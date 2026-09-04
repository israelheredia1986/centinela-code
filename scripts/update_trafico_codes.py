#!/usr/bin/env python3
import json, re, urllib.request
from pathlib import Path
from html import unescape

SOURCES = [
    {'id':'rd-1428-2003','name':'Reglamento General de Circulación','rd':'Real Decreto 1428/2003, de 21 de noviembre','boe':'BOE-A-2003-23514','url':'https://www.boe.es/buscar/act.php?id=BOE-A-2003-23514','max_articles':158},
    {'id':'rd-2822-1998','name':'Reglamento General de Vehículos','rd':'Real Decreto 2822/1998, de 23 de diciembre','boe':'BOE-A-1999-1826','url':'https://www.boe.es/buscar/act.php?id=BOE-A-1999-1826','max_articles':51},
    {'id':'rd-818-2009','name':'Reglamento General de Conductores','rd':'Real Decreto 818/2009, de 8 de mayo','boe':'BOE-A-2009-9481','url':'https://www.boe.es/buscar/act.php?id=BOE-A-2009-9481','max_articles':79},
]
HEAD_RE = re.compile(r'\bArtículo\s+(\d+)\s*\.\s*([^\n]{0,500})', re.I)

def html_to_text(html):
    html = re.sub(r'<(script|style|noscript)[^>]*>.*?</\1>', ' ', html, flags=re.I|re.S)
    html = re.sub(r'<br\s*/?>', '\n', html, flags=re.I)
    html = re.sub(r'</(p|div|li|h[1-6]|tr|td|section|article)>', '\n', html, flags=re.I)
    html = re.sub(r'<[^>]+>', ' ', html)
    text = unescape(html).replace('\xa0',' ')
    text = re.sub(r'[ \t]+', ' ', text)
    text = re.sub(r'\n\s*\n+', '\n', text)
    return text

def clean_body(s):
    lines=[]
    for line in s.splitlines():
        line=line.strip()
        if not line: continue
        if line.lower() in ('boletín oficial del estado','legislación consolidada'): continue
        if re.fullmatch(r'página\s+\d+', line, re.I): continue
        if re.fullmatch(r'\d+', line): continue
        if 'Este documento es de carácter informativo y no tiene valor jurídico.' in line: continue
        lines.append(line)
    return re.sub(r'\n{3,}','\n\n','\n'.join(lines)).strip()

def extract_articles(text, max_articles, name):
    marker=text.upper().find(name.upper())
    chunk=text[marker:] if marker >= 0 else text
    matches=list(HEAD_RE.finditer(chunk))
    selected=[]; expected=1
    for m in matches:
        n=int(m.group(1))
        if n == expected:
            selected.append(m); expected += 1
            if expected > max_articles: break
    if expected <= max_articles:
        raise RuntimeError(f'{name}: extracción incompleta ({expected-1}/{max_articles})')
    articles=[]
    for i,m in enumerate(selected):
        end=selected[i+1].start() if i+1<len(selected) else len(chunk)
        block=chunk[m.start():end]
        title=re.sub(r'\s+',' ',m.group(2)).strip()
        title=re.sub(r'\s*\.(?:\s*\.){2,}\s*\d+\s*$','.',title)
        body=block.split('\n',1)[1] if '\n' in block else block[m.end():]
        body=clean_body(body)
        # El último artículo no debe arrastrar anexos/disposiciones.
        if i == len(selected)-1:
            body=re.split(r'\n\s*(?:ANEXO|DISPOSICIONES|Disposición)\b',body,maxsplit=1)[0].strip()
        articles.append({'numero':str(int(m.group(1))),'titulo':title,'texto':body})
    return articles

def fetch(url):
    req=urllib.request.Request(url,headers={'User-Agent':'Centinela-Code traffic updater/1.0'})
    with urllib.request.urlopen(req,timeout=60) as r:
        return r.read().decode('utf-8','ignore')

def main():
    data_dir=Path('data'); data_dir.mkdir(exist_ok=True)
    combined_path=data_dir/'normativa_trafico.json'
    existing={}
    if combined_path.exists():
        try: existing=json.loads(combined_path.read_text(encoding='utf-8'))
        except Exception: existing={}
    ids={s['id'] for s in SOURCES}
    old_laws=[l for l in existing.get('leyes',[]) if l.get('id') not in ids]
    new_laws=[]
    for src in SOURCES:
        text=html_to_text(fetch(src['url']))
        articles=extract_articles(text,src['max_articles'],src['name'])
        law={'id':src['id'],'ambito':'Estatal','ley':src['rd'],'abreviatura':src['name'],'boe':src['boe'],'estado':'vigente','enlaceOficial':src['url'],'descripcion':f"{src['name']} con su articulado completo para consulta policial.",'fuente':'BOE, texto consolidado','articulos':articles}
        new_laws.append(law)
        (data_dir/(src['id']+'.json')).write_text(json.dumps({'version':'1.0.0','categoria':'trafico','ley':law},ensure_ascii=False,indent=2),encoding='utf-8')
        print(src['name'],len(articles))
    combined={'version':'3.0.0','categoria':'trafico','nombreCategoria':'Tráfico','descripcion':'Normativa estatal de tráfico para consulta policial. Mantiene la normativa existente y añade el articulado íntegro de los Reglamentos Generales de Circulación, Vehículos y Conductores.','reglamentosCompletos':True,'fuenteActualizacion':'BOE - textos consolidados','leyes':old_laws+new_laws}
    combined_path.write_text(json.dumps(combined,ensure_ascii=False,indent=2),encoding='utf-8')

if __name__=='__main__': main()
