# Página de Votação — versão integrada ao Firestore

## Funcionamento

A página `votacao.html` preserva o novo design e usa a infraestrutura Firebase reaproveitada da V1.

Antes de votar, o convidado vê apenas as opções **Menina** e **Menino**. O resultado geral não é mostrado para não influenciar o palpite.

Ao confirmar, o voto é gravado na subcoleção:

`convites/principal/votos/{deviceId}`

Depois da confirmação, a página consulta os votos existentes e apresenta os percentuais reais e o total de palpites.

## Um voto por navegador/dispositivo

O site cria um `deviceId` no armazenamento local e usa esse ID como nome do documento do voto. As regras incluídas permitem criar o documento, mas não atualizar ou apagar um voto já existente.

Isso evita um segundo voto usando o mesmo identificador. Não é uma identidade forte: outro aparelho, outro navegador ou limpeza do armazenamento pode gerar outro ID.

Para controle estrito de um voto por convidado, a evolução recomendada é usar um token individual no link do convite ou autenticação.

## Regras necessárias

A V1 bloqueava todas as subcoleções. Para a votação funcionar, este pacote inclui um `firestore.rules` atualizado que libera leitura e criação de votos.

Após revisar as regras, é necessário publicá-las no projeto Firebase, por exemplo:

```bash
firebase deploy --only firestore:rules
```

## Modo edição

Os textos da votação continuam editáveis pelo botão **Editar**. A senha é validada pelo Worker administrativo da V1 e, ao salvar, os textos são gravados em `convites/principal`.

## Segurança

O documento `INTEGRACAO_FIREBASE_V1.md` explica a limitação atual das regras de escrita do conteúdo principal e a recomendação para endurecimento antes de uma publicação ampla.
