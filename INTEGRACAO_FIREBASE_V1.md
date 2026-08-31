# Integração do novo design com a infraestrutura Firebase da V1

## Objetivo

Este pacote mantém **o design novo** como interface oficial e reaproveita da V1 somente a infraestrutura de dados:

- Firebase / Firestore;
- `InviteDataService`;
- adapter Firestore;
- configuração do projeto Firebase já existente;
- Worker administrativo para validar a senha do modo edição;
- estrutura para imagens de presentes;
- compatibilidade com os dados antigos de `convites/principal`.

A V1 não é usada como referência visual.

## Fluxo de dados

```text
Novo design
  ├─ Página 1
  ├─ Página 2
  ├─ Presentes
  └─ Votação
       │
       ▼
InviteApp / InviteDataService
       │
       ▼
Firebase Adapter
       │
       ▼
Firestore
  convites/principal
       └─ votos/{deviceId}
```

## Documento principal

O conteúdo editável continua no documento:

`convites/principal`

São reaproveitados os campos antigos da V1, como:

- `menina`;
- `menino`;
- `textoOu`;
- `data`;
- `horario`;
- `confirmarPresenca`;
- `localizacaoFesta`;
- `presentes`.

O novo design acrescenta o objeto `paginas`, usado para textos que não existiam na V1.

## Modo edição

O botão **Editar** agora:

1. pede a senha administrativa;
2. valida a senha no Cloudflare Worker da V1 (`/admin/verify`);
3. habilita os campos de texto;
4. ao clicar em **Salvar alterações**, grava o conteúdo no Firestore;
5. qualquer convidado que abrir o site depois lê o conteúdo atualizado do banco.

Em `file://`, a verificação do Worker pode falhar por CORS; existe uma exceção apenas para teste local.

## Presentes

A lista de presentes agora é carregada do campo `presentes` do Firestore.

No modo normal, ela aparece somente como labels com ícone + texto.

No modo edição:

- aparece **Adicionar sugestão**;
- cada item pode ser removido;
- o texto pode ser editado;
- ao salvar, a lista inteira é persistida no Firestore.

A infraestrutura de upload de imagens da V1 foi preservada na pasta `worker/` e em `js/services/present-images-service.js`, mas a interface de upload ainda não foi acoplada ao editor visual novo.

## Votação

Os votos usam uma subcoleção:

`convites/principal/votos/{deviceId}`

Cada documento possui:

```json
{
  "opcao": "menina",
  "criadoEm": "serverTimestamp"
}
```

O navegador cria um identificador local de dispositivo. O mesmo ID não consegue atualizar o próprio voto pelas regras fornecidas, porque a subcoleção aceita `create`, mas não `update` ou `delete`.

Depois do voto, a página consulta a subcoleção e mostra percentuais reais de Menina/Menino.

### Limitação

Não é identidade forte: limpar o armazenamento do navegador ou usar outro aparelho gera outro ID. Para um voto estritamente único por convidado, a etapa futura deve usar link/token individual ou autenticação.

## Segurança importante

O arquivo `firestore.rules` mantém a compatibilidade com a V1 e ainda permite escrita pública em `convites/principal`. Isso faz o editor funcionar com a arquitetura atual, mas **não é a configuração final recomendada para produção**.

Também foi incluído:

`firestore.rules.production.example`

Ele bloqueia escrita pública do conteúdo. Para adotá-lo sem perder o modo edição, será necessário mover a gravação administrativa para um backend autenticado (Worker com credencial de serviço ou Firebase Auth com claims).

## Segredos

O `.env` da V1 **não foi copiado** para este pacote.

Tokens GitHub e `ADMIN_KEY` devem permanecer apenas nos secrets do Cloudflare Worker / ambiente de implantação.
