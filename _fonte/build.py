#!/usr/bin/env python3
"""Gera o site publicado (raiz do repositório) a partir dos arquivos desta pasta.

  python3 _fonte/build.py --domain https://www.seudominio.com.br   # SEO completo (canonical, og:url, sitemap)
  python3 _fonte/build.py                                          # sem domínio (remove essas tags)

Edite SOMENTE os arquivos de _fonte/ (index.html, styles.css, app.js...). Os da raiz são gerados.
Precisa de Node (esbuild via npx) para minificar; sem Node, copia sem minificar.
"""
import argparse, re, shutil, subprocess, sys, datetime
from pathlib import Path

SRC = Path(__file__).parent
OUT = SRC.parent
ap = argparse.ArgumentParser(); ap.add_argument('--domain', default='')
domain = ap.parse_args().domain.rstrip('/')

def minify(src, dst, loader):
    try:
        subprocess.run(['npx', '--yes', 'esbuild', str(src), '--minify', f'--loader:.{loader}={loader}', f'--outfile={dst}', '--log-level=error'], check=True)
    except Exception:
        shutil.copy(src, dst); print('! sem minificação:', src.name, file=sys.stderr)

html = (SRC / 'index.html').read_text()
if domain:
    html = html.replace('__SITE_URL__', domain)
    html = re.sub(r' data-seo', '', html)
else:
    html = re.sub(r'\s*<(?:link|meta)[^>]*data-seo[^>]*/>', '', html)
    html = html.replace('"url": "__SITE_URL__/",', '').replace('"image": "__SITE_URL__/assets/darlan-2.webp",', '"image": "assets/darlan-2.webp",')
html = re.sub(r'<!--(?!\[).*?-->', '', html, flags=re.S)
html = re.sub(r'\n\s*\n+', '\n', html)
(OUT / 'index.html').write_text(html)
shutil.copy(SRC / 'privacidade.html', OUT / 'privacidade.html')
(OUT / 'assets').mkdir(exist_ok=True)
minify(SRC / 'styles.css', OUT / 'assets' / 'styles.css', 'css')
minify(SRC / 'app.js', OUT / 'assets' / 'app.js', 'js')

robots = (SRC / 'robots.txt').read_text()
if domain:
    (OUT / 'robots.txt').write_text(robots.replace('__SITE_URL__', domain))
    (OUT / 'sitemap.xml').write_text(f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>{domain}/</loc><lastmod>{datetime.date.today()}</lastmod></url></urlset>\n')
else:
    (OUT / 'robots.txt').write_text(re.sub(r'\n?Sitemap:.*\n?', '\n', robots))
for n in ('_headers', '.htaccess'):
    shutil.copy(SRC / n, OUT / n)
print('OK: site gerado na raiz.', 'Domínio:', domain or '(não definido)')
