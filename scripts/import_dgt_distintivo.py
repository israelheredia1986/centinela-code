#!/usr/bin/env python3
"""
CENTINELA CODE - Importador diario del distintivo ambiental DGT.

Descarga el ZIP oficial de la DGT, detecta automáticamente el fichero de
texto y sus columnas, normaliza matrícula/distintivo y hace UPSERT en
Supabase: public.dgt_distintivo_ambiental.

Variables requeridas:
  SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY

No se guarda ninguna clave en el repositorio.
"""

import csv
import io
import os
import re
import sys
import zipfile
from datetime import date

import requests

DGT_URL = "https://www.dgt.es/microdatos/salida/distintivoAmbiental/export_dist_ambiental.zip"


def norm_key(value):
    value = str(value or "").strip().lower()
    replacements = str.maketrans("áéíóúüñ", "aeiouun")
    value = value.translate(replacements)
    return re.sub(r"[^a-z0-9]", "", value)


def norm_plate(value):
    value = str(value or "").upper().strip()
    value = re.sub(r"[^A-Z0-9]", "", value)
    return value


def norm_badge(value):
    value = str(value or "").strip().upper()
    if value in {"0", "CERO", "0 EMISIONES", "CERO EMISIONES"}:
        return "0"
    if value in {"A", "SIN DISTINTIVO", "SIN ETIQUETA", "SIN DISTINTIVO AMBIENTAL"}:
        return "A"
    if value in {"B", "C", "ECO"}:
        return value
    # Algunos ficheros pueden contener descripciones largas.
    if "ECO" in value:
        return "ECO"
    if "CERO" in value or "0 EMISION" in value:
        return "0"
    if re.search(r"\bB\b", value):
        return "B"
    if re.search(r"\bC\b", value):
        return "C"
    return value


def find_column(headers, candidates):
    normalized = {norm_key(h): h for h in headers}
    for candidate in candidates:
        key = norm_key(candidate)
        if key in normalized:
            return normalized[key]
    for h in headers:
        hk = norm_key(h)
        if any(norm_key(c) in hk for c in candidates):
            return h
    return None


def decode_bytes(raw):
    for enc in ("utf-8-sig", "latin-1", "cp1252"):
        try:
            return raw.decode(enc)
        except UnicodeDecodeError:
            pass
    return raw.decode("utf-8", errors="replace")


def parse_member(raw):
    text = decode_bytes(raw)
    sample = text[:20000]
    try:
        dialect = csv.Sniffer().sniff(sample, delimiters=";,|\t")
        delimiter = dialect.delimiter
    except csv.Error:
        delimiter = ";" if sample.count(";") >= sample.count(",") else ","

    reader = csv.DictReader(io.StringIO(text), delimiter=delimiter)
    headers = reader.fieldnames or []
    plate_col = find_column(headers, ["matricula", "matrícula", "plate", "matricula_vehiculo"])
    badge_col = find_column(headers, ["distintivo", "distintivo_ambiental", "etiqueta_ambiental", "clasificacion_ambiental", "categoria_ambiental"])
    if not plate_col or not badge_col:
        return None, None, None

    rows = []
    today = date.today().isoformat()
    for row in reader:
        plate = norm_plate(row.get(plate_col, ""))
        badge = norm_badge(row.get(badge_col, ""))
        if re.fullmatch(r"\d{4}[BCDFGHJKLMNPRSTVWXYZ]{3}", plate) and badge:
            rows.append({"matricula": plate, "distintivo": badge, "fecha_actualizacion": today})
    return rows, plate_col, badge_col


def download_zip():
    print(f"Descargando DGT: {DGT_URL}")
    response = requests.get(DGT_URL, timeout=120)
    response.raise_for_status()
    return response.content


def import_supabase(rows):
    url = os.environ.get("SUPABASE_URL", "").rstrip("/")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
    if not url or not key:
        raise RuntimeError("Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY")

    endpoint = f"{url}/rest/v1/dgt_distintivo_ambiental?on_conflict=matricula"
    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates,return=minimal",
    }

    total = len(rows)
    batch_size = 1000
    for start in range(0, total, batch_size):
        batch = rows[start:start + batch_size]
        response = requests.post(endpoint, headers=headers, json=batch, timeout=120)
        if response.status_code >= 300:
            raise RuntimeError(f"Supabase HTTP {response.status_code}: {response.text[:1000]}")
        done = min(start + batch_size, total)
        print(f"Importados {done}/{total}")


def main():
    zip_bytes = download_zip()
    with zipfile.ZipFile(io.BytesIO(zip_bytes)) as zf:
        members = [n for n in zf.namelist() if not n.endswith("/")]
        print("Ficheros encontrados:", ", ".join(members))
        selected = None
        rows = None
        for name in members:
            try:
                candidate_rows, plate_col, badge_col = parse_member(zf.read(name))
            except Exception as exc:
                print(f"Ignorado {name}: {exc}")
                continue
            if candidate_rows is not None:
                selected = name
                rows = candidate_rows
                print(f"Fuente seleccionada: {name} | matrícula={plate_col} | distintivo={badge_col}")
                break

    if not rows:
        raise RuntimeError("No se ha encontrado en el ZIP un fichero con columnas de matrícula y distintivo ambiental.")

    print(f"Registros válidos: {len(rows)}")
    import_supabase(rows)
    print("IMPORTACIÓN DGT COMPLETADA CORRECTAMENTE")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        sys.exit(1)
