# Cloudflare Worker — API de imagens

Código do Worker usado pelo painel administrativo para listar e enviar imagens para `assets/presentes/` no GitHub.

## Variáveis no Cloudflare

Secrets:

- `GITHUB_TOKEN`: Fine-grained Personal Access Token com `Contents: Read and write` somente no repositório do convite.
- `ADMIN_KEY`: senha administrativa usada pelo painel para autorizar uploads.

Variáveis normais:

- `GITHUB_OWNER=Familiar-ero-luizjr`
- `GITHUB_REPO=Convite_cha_revelecao`
- `GITHUB_BRANCH=main`

Opcional:

- `ALLOWED_ORIGIN`: origem permitida para CORS. Se não for configurada, o Worker responde com `*`.

## Rotas

- `GET /` — saúde da API.
- `POST /admin/verify` — valida `X-Admin-Key`.
- `GET /present-images` — lista imagens existentes no repositório.
- `POST /present-images` — recebe `multipart/form-data` com campo `file`, faz commit no GitHub e devolve o caminho.

## Atualizar pelo painel da Cloudflare

Abra o Worker, clique em **Editar código**, substitua pelo conteúdo de `src/index.js` e implante.

## Teste local opcional com Wrangler

Copie `.dev.vars.example` para `.dev.vars`, preencha os secrets e execute Wrangler no diretório `worker/`.

Nunca faça commit de `.dev.vars`.
