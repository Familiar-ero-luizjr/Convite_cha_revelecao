# Convite Chá Revelação — Firestore + Cloudflare Worker + GitHub Pages

Versão atualizada mantendo as três artes originais do convite como fundo e sem alterar `css/convite.css`.

## Arquitetura

- **GitHub Pages**: hospeda o convite.
- **Firestore**: guarda nomes, data, horário, links e lista de presentes.
- **Cloudflare Worker**: faz upload de imagens por commit na pasta `assets/presentes/`.
- **Firebase Storage**: não é usado.
- **Mock**: continua disponível via `localStorage` para testes.

## O que foi atualizado

- modo padrão de produção agora é `banco` (Firestore);
- painel administrativo usa a `ADMIN_KEY` do Cloudflare Worker;
- presentes são itens dinâmicos, não mais um textarea único;
- cada presente pode ter:
  - sem imagem;
  - imagem já existente no repositório;
  - URL externa;
  - upload de nova imagem, com commit automático no GitHub;
- itens podem ser adicionados, removidos e reordenados;
- o seletor de imagens é alimentado por `GET /present-images`;
- os três placeholders PNG vazios foram removidos;
- regras do Firestore foram limitadas a `convites/principal`;
- código do Cloudflare Worker foi incluído em `worker/`;
- `.env` e `.env.example` foram incluídos para referência/configuração local.

## Importante sobre `.env`

O arquivo `.env` está no `.gitignore` e não deve ser commitado.

Como o convite é um site estático no GitHub Pages, o navegador **não lê `.env` diretamente**. A URL pública do Worker e a configuração Web do Firebase ficam em `js/config/app-config.js`. Isso é normal: a configuração Web do Firebase não é um segredo.

`GITHUB_TOKEN` e `ADMIN_KEY` nunca devem ser colocados em `app-config.js`.

O `GITHUB_TOKEN` deve existir somente como Secret do Cloudflare Worker. A `ADMIN_KEY` também fica como Secret no Worker e é digitada no painel administrativo; ela é guardada apenas em `sessionStorage` durante a sessão.

## Cloudflare Worker

Worker atual:

`https://convite-cha-revelacao-api.luizjunior-lopes.workers.dev`

No painel do Cloudflare configure:

### Secrets

- `GITHUB_TOKEN`
- `ADMIN_KEY`

### Variáveis normais

- `GITHUB_OWNER = Familiar-ero-luizjr`
- `GITHUB_REPO = Convite_cha_revelecao`
- `GITHUB_BRANCH = main`

Depois substitua o código do Worker pelo arquivo:

`worker/src/index.js`

A versão nova adiciona `POST /admin/verify` e ignora arquivos de imagem com 0 bytes na listagem.

## Firestore

Projeto configurado:

`convite-cha-revelacao-la`

Documento usado:

`convites/principal`

Após atualizar o projeto, publique as regras:

```powershell
firebase deploy --only firestore:rules
```

As regras atuais permitem leitura e escrita somente em `convites/principal`. Como não há Firebase Authentication neste projeto, esse documento continua publicamente gravável por quem souber chamar a API do Firestore. Não armazene informações sensíveis nele.

## Testar localmente

Na raiz do projeto:

```powershell
python -m http.server 5500
```

Abra:

`http://localhost:5500/`

Painel:

`http://localhost:5500/admin.html`

A senha do painel é a mesma `ADMIN_KEY` que você cadastrou no Cloudflare Worker.

## Modos do painel

- **Mock**: grava somente no navegador atual.
- **Banco**: grava no Firestore e aparece para os visitantes.

O modo padrão para novos visitantes está configurado como `banco` em `js/config/app-config.js`.

## Publicar no GitHub

Confira antes:

```powershell
git status
```

Depois:

```powershell
git add .
git commit -m "Integra Firestore, Worker e upload de imagens"
git push origin main
```

O `.env` não será incluído porque já está ignorado pelo Git.

## Estrutura principal

```text
Convite_cha_revelecao/
├── .env                         # local, ignorado pelo Git
├── .env.example
├── .firebaserc
├── firebase.json
├── firestore.rules
├── index.html
├── admin.html
├── assets/
│   ├── convite/
│   │   ├── page_1.jpeg
│   │   ├── page_2.jpeg
│   │   └── page_3.jpeg
│   └── presentes/
├── css/
│   ├── convite.css              # original, não alterado
│   ├── convite-overlays.css
│   ├── admin.css
│   └── admin-entry.css
├── js/
│   ├── adapters/firebase-adapter.js
│   ├── config/app-config.js
│   ├── config/convite-data.js
│   ├── pages/admin.js
│   ├── pages/convite.js
│   └── services/
│       ├── data-service.js
│       └── present-images-service.js
└── worker/
    ├── src/index.js
    ├── wrangler.toml
    ├── .dev.vars.example
    └── README.md
```
