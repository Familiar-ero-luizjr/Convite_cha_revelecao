# Configuração da V2

## O que editar no dia a dia

Abra `admin.html` pelo endereço publicado, entre com a senha e escolha a página. Na página:

- clique em **Editar**;
- clique no texto para alterá-lo;
- na página do convite, clique em “Confirmar presença” ou “Localização” para trocar o endereço;
- clique em uma imagem para enviar outra;
- em Presentes, altere o texto, a foto, remova ou adicione itens;
- clique em **Salvar**.

Os textos e endereços ficam no Firestore. As imagens são enviadas pelo Worker ao GitHub e o endereço salvo no Firestore. A senha e as credenciais nunca ficam no HTML.

## Primeira ativação

1. Configure e publique o Worker conforme `worker/README.md`.
2. Publique `firestore.rules` no Firebase.
3. Confirme a URL do Worker em `js/config/app-config.js`.
4. Confirme `GITHUB_OWNER`, `GITHUB_REPO` e `GITHUB_BRANCH` em `worker/wrangler.toml`.
5. Publique esta pasta no GitHub Pages.

## Custo esperado

Para um convite familiar, a arquitetura cabe normalmente nos planos gratuitos de GitHub Pages, Cloudflare Workers e Firestore. A votação usa um documento de contador agregado, evitando reler todos os votos.

## Observação sobre segurança

Uma senha armazenada apenas no JavaScript não seria segura. Por isso ela é validada pelo Worker. O navegador guarda a autorização somente na sessão atual; ao fechar a aba, é necessário entrar novamente.
