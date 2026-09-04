import json
import re
import sys
from datetime import date

src, dst = sys.argv[1], sys.argv[2]
text = open(src, encoding='utf-8').read()

meta = {}
parts = text.split('---', 2)
body = text
if len(parts) == 3:
    front = parts[1]
    body = parts[2]
    for line in front.splitlines():
        if ':' in line:
            k, v = line.split(':', 1)
            v = v.strip().strip('"')
            meta[k.strip()] = v

headings = []
lines = body.splitlines()
for i, line in enumerate(lines):
    m = re.match(r'^#{2,6}\s+Artículo\s+(\d+)$', line.strip())
    if m:
        headings.append((i, int(m.group(1))))

articles = []
for idx, (start, num) in enumerate(headings):
    end = headings[idx + 1][0] if idx + 1 < len(headings) else len(lines)
    raw = lines[start:end]
    raw = raw[1:]
    while raw and not raw[0].strip():
        raw.pop(0)
    while raw and not raw[-1].strip():
        raw.pop()
    titulo = f'Artículo {num}'
    clean = []
    for ln in raw:
        if ln.startswith('> <small>'):
            clean.append(re.sub(r'^>\s*', '', ln))
        elif re.match(r'^#{2,5}\s+', ln):
            continue
        else:
            clean.append(ln)
    txt = '\n'.join(clean).strip()
    keys = []
    for k in [f'artículo {num}', f'art. {num}', str(num)]:
        keys.append(k)
    words = re.findall(r'[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9]+', txt.lower())
    freq = {}
    for w in words:
        if len(w) >= 5:
            freq[w] = freq.get(w, 0) + 1
    for w, _ in sorted(freq.items(), key=lambda x: (-x[1], x[0]))[:35]:
        if w not in keys:
            keys.append(w)
    articles.append({
        'tipo': 'articulo',
        'numero': num,
        'titulo': titulo,
        'texto': txt,
        'palabrasClave': keys
    })

# Disposiciones: keep them intact and structured as final components.
disp = []
pat = re.compile(r'(?m)^######\s+(Disposición (?:adicional|transitoria|derogatoria|final)[^\n]*)\.?\s*$')
dmatches = list(pat.finditer(body))
for i, m in enumerate(dmatches):
    end = dmatches[i+1].start() if i+1 < len(dmatches) else len(body)
    block = body[m.start():end].strip()
    block = re.sub(r'^######\s+', '', block, count=1)
    disp.append({'titulo': block.split('\n',1)[0].strip(), 'texto': block})

# Preamble is before the first article heading.
pre = ''
first_heading = re.search(r'(?m)^#{2,6}\s+Artículo\s+1\s*$', body)
if first_heading:
    pre = body[:first_heading.start()].strip()

out = {
    'ley': 'Constitución Española',
    'identificador': 'BOE-A-1978-31229',
    'referenciaBOE': 'BOE-A-1978-31229',
    'tipo': 'Constitución',
    'titulo': 'Constitución Española',
    'ambito': 'Estatal',
    'estado': 'vigente',
    'fecha': '1978-12-27',
    'ultimaActualizacion': meta.get('last_updated', '2026-05-20'),
    'fuenteOficial': 'https://www.boe.es/buscar/act.php?id=BOE-A-1978-31229',
    'urlELI': 'https://www.boe.es/eli/es/c/1978/12/27/(1)',
    'fuenteConsolidada': 'legalize-dev/legalize-es (texto derivado del BOE)',
    'consultado': str(date.today()),
    'totalArticulos': len(articles),
    'preambulo': pre,
    'articulos': articles,
    'disposiciones': disp,
    'infracciones': [],
    'aviso': 'Texto consolidado para consulta informativa. Para efectos jurídicos debe consultarse la publicación oficial aplicable del BOE.'
}

with open(dst, 'w', encoding='utf-8') as f:
    json.dump(out, f, ensure_ascii=False, indent=2)
    f.write('\n')
print(f'Generado {dst}: {len(articles)} artículos, {len(disp)} disposiciones')
