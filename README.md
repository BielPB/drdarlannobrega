# Landing page — Dr. Darlan Gomes Nóbrega

Site estático (HTML, CSS e JS puros). A **raiz** do repositório é o site publicado; basta apontar a hospedagem para ela.

## Editar
Altere somente os arquivos de `_fonte/` (`index.html`, `styles.css`, `app.js`) e gere de novo:

```bash
python3 _fonte/build.py --domain https://www.seudominio.com.br
```

Sem `--domain`, as tags de SEO que dependem do endereço (canonical, og:url, sitemap) são omitidas.

## Configurar
- **WhatsApp, GA4, Meta Pixel e GTM:** bloco `SITE` no topo de `_fonte/app.js` (o aviso de cookies só aparece se houver ID).
- **Pendente (comentários `TODO` no `index.html`):** CRM/RQE, horário de atendimento e coordenadas (JSON-LD), legenda do vídeo (`.vtt`).
- `privacidade.html` é um modelo e precisa de revisão jurídica.
