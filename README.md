# Convite Chá Revelação — v2

Reorganização do projeto original em uma estrutura de pastas (assets, css, js/config,
js/services, js/adapters, js/pages) mantendo exatamente o mesmo comportamento.

Princípio desta versão:
- NÃO recria as três páginas do convite.
- NÃO altera o layout original do convite.
- NÃO remove nem substitui `page_1.jpeg`, `page_2.jpeg` ou `page_3.jpeg` (agora em `assets/convite/`).
- As imagens continuam sendo o fundo original das telas.
- Apenas são adicionados campos dinâmicos, um painel administrativo e CSS separado para os elementos novos.

## Modos de dados

1. **mock**
   - funciona agora, sem Firebase;
   - salva em localStorage;
   - permite testar e editar no próprio computador/navegador.

2. **banco**
   - preparado para Firestore;
   - usa o mesmo `InviteDataService`;
   - depois basta preencher `APP_CONFIG.firebase` (em `js/config/app-config.js`), carregar os SDKs compat e o `js/adapters/firebase-adapter.js` passa a registrar o modo banco.

O modo pode ser trocado dentro do próprio painel administrativo.

## Terceira imagem / presentes

`assets/convite/page_3.jpeg` continua intacta.
Foi adicionada uma camada por cima dela com:
- `presentesTitulo`
- `presentesLista`
- `presentesObservacao`

Os campos começam vazios para não duplicar o texto que ainda estiver desenhado na imagem.
Quando a imagem for limpa, basta preencher esses campos no painel.

## Imagens

Os valores padrão continuam:
- `assets/convite/page_1.jpeg`
- `assets/convite/page_2.jpeg`
- `assets/convite/page_3.jpeg`

O painel apenas permite trocar esses caminhos/URLs futuramente.
A pasta `assets/presentes/` está reservada para ícones de sugestões de presentes.

## Senha temporária

```
troque-esta-senha
```

A senha simples em um site estático é apenas uma barreira visual. Para produção com Firestore, use Firebase Authentication e regras do banco.

## Estrutura de pastas

```
Convite_cha_revelecao_v2/
├── index.html
├── admin.html
├── assets/
│   ├── convite/       # page_1.jpeg, page_2.jpeg, page_3.jpeg
│   └── presentes/     # ícones de presentes (reservado)
├── css/
│   ├── convite.css
│   ├── convite-overlays.css
│   ├── admin.css
│   └── admin-entry.css
└── js/
    ├── config/         # app-config.js, convite-data.js
    ├── services/       # data-service.js
    ├── adapters/       # firebase-adapter.js
    └── pages/          # convite.js, admin.js
```
