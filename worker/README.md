# Cloudflare Worker — convite V2

O Worker mantém os segredos fora do HTML e atende três funções:

1. valida a senha do painel administrativo;
2. grava o convite e registra votos no Firestore;
3. envia imagens para o repositório do GitHub.

## Secrets obrigatórios

Cadastre em **Cloudflare > Workers > convite-cha-revelacao-api > Settings > Variables and Secrets**:

- `ADMIN_KEY`: senha forte usada em `admin.html`;
- `GITHUB_TOKEN`: token fine-grained com `Contents: Read and write` somente no repositório do convite;
- `FIREBASE_SERVICE_ACCOUNT_JSON`: JSON completo de uma conta de serviço do projeto Firebase.

Para obter o JSON: **Firebase Console > Configurações do projeto > Contas de serviço > Gerar nova chave privada**. Cole todo o conteúdo como um único secret e nunca adicione o arquivo JSON ao repositório.

## Variáveis normais

Revise `wrangler.toml`:

- `GITHUB_OWNER`;
- `GITHUB_REPO`;
- `GITHUB_BRANCH`.

Opcionalmente configure `ALLOWED_ORIGIN` com a origem exata do GitHub Pages, por exemplo `https://usuario.github.io`.

## Rotas

- `POST /admin/verify` — valida `X-Admin-Key`;
- `PUT /invite` — grava os dados do convite, protegido por senha;
- `GET|POST /present-images` — lista/envia imagens;
- `GET /votes/:deviceId` — consulta o voto desse navegador;
- `POST /votes` — registra um voto apenas uma vez;
- `GET /vote-results` — lê somente o contador agregado.

## Publicação

No diretório `worker`, execute:

```powershell
npx wrangler secret put ADMIN_KEY
npx wrangler secret put GITHUB_TOKEN
npx wrangler secret put FIREBASE_SERVICE_ACCOUNT_JSON
npx wrangler deploy
```

Depois publique `firestore.rules` no Firebase. Essas regras deixam a leitura do convite pública, mas bloqueiam qualquer gravação direta do navegador; o Worker usa a conta de serviço e não depende dessas permissões.

Para teste local, copie `.dev.vars.example` para `.dev.vars`. Nunca faça commit de `.dev.vars` ou da chave privada.
