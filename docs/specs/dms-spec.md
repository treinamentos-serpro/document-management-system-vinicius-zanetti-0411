# Especificação — Document Management System

## 1. Objetivo

Permitir que usuários autenticados enviem, consultem e baixem seus documentos, mantendo os arquivos no filesystem local da aplicação e os metadados em memória nesta fase.

## 2. Escopo

### Dentro do escopo

- Autenticação de usuários por OpenID Connect (OIDC).
- Criação, consulta e encerramento de sessões gerenciadas pelo backend.
- Upload, listagem e download de documentos com isolamento por usuário.
- Armazenamento local em `backend/storage`, usando Multer com `diskStorage`.
- Metadados dos documentos mantidos em memória.
- Endpoint de verificação de saúde do backend.

### Fora do escopo

- Armazenamento dos documentos em nuvem ou em serviços externos.
- Persistência dos metadados em banco de dados nesta fase.
- Versionamento, edição, exclusão ou compartilhamento de documentos.
- Cadastro e gestão local de senhas e contas.
- Busca avançada, categorias e tags.

## 3. Requisitos funcionais

| ID | Requisito |
| --- | --- |
| RF-01 | O sistema deve aceitar um arquivo enviado como `multipart/form-data`, no campo `file`. |
| RF-02 | O sistema deve rejeitar requisições sem arquivo ou com arquivo vazio. |
| RF-03 | O sistema deve gravar arquivos no filesystem local usando Multer com `diskStorage`. |
| RF-04 | O nome físico do arquivo deve ser gerado pelo sistema e não deve depender do nome ou caminho enviado pelo cliente. |
| RF-05 | Após um upload bem-sucedido, o sistema deve registrar em memória os metadados e o proprietário do documento. |
| RF-06 | A resposta do upload deve retornar metadados públicos, sem caminho físico ou nome interno de armazenamento. |
| RF-07 | O sistema deve listar somente documentos pertencentes ao usuário autenticado. |
| RF-08 | O sistema deve permitir o download de um documento somente quando pertencer ao usuário autenticado. |
| RF-09 | Documento inexistente, de outro usuário ou indisponível no filesystem deve resultar em `404`, sem revelar se pertence a terceiros. |
| RF-10 | O sistema deve expor `GET /health`, sem exigir autenticação. |
| RF-11 | Se o registro dos metadados falhar após a gravação, o sistema deve tentar remover o arquivo. |
| RF-12 | O frontend deve acessar a API pelo prefixo `/api`, encaminhado pelo proxy do Vite. |
| RF-13 | O backend deve autenticar usuários por um provedor OIDC configurado, usando Authorization Code com PKCE. |
| RF-14 | O backend deve validar `state`, `nonce`, PKCE, assinatura e claims do token, incluindo emissor, audiência e validade. |
| RF-15 | Após autenticar, o backend deve criar uma sessão própria. O frontend não deve usar tokens do provedor para autorizar chamadas à API. |
| RF-16 | O backend deve permitir iniciar login, tratar o callback OIDC, consultar a identidade atual e encerrar a sessão. |
| RF-17 | Os endpoints de documentos devem exigir sessão válida e derivar o proprietário exclusivamente da identidade validada pelo backend. |
| RF-18 | Listagem e download devem limitar o acesso aos documentos do usuário autenticado. |
| RF-19 | Requisições autenticadas que alteram estado devem validar proteção contra CSRF. |

## 4. Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | Arquivos devem permanecer no filesystem local, por padrão em `backend/storage`. |
| RNF-02 | Metadados de documentos ficam em memória e podem ser perdidos ao reiniciar o backend. |
| RNF-03 | Configuração operacional e segredos devem ser fornecidos por variáveis de ambiente. |
| RNF-04 | O tamanho máximo de upload deve ser limitado e configurável; o valor padrão será definido antes da implementação. |
| RNF-05 | Caminhos locais devem ser construídos com diretório configurado e nome gerado pelo sistema, nunca com caminhos fornecidos pelo cliente. |
| RNF-06 | Erros da API devem usar JSON consistente, exceto respostas binárias de download e redirecionamentos de autenticação. |
| RNF-07 | O backend deve respeitar `routes -> controllers -> services -> repositories`. |
| RNF-08 | Testes backend devem usar `node:test`; deve-se preferir dependências já presentes quando adequadas. |
| RNF-09 | A identidade deve ser mapeada pelo par estável `issuer + sub`; e-mail não deve ser usado para autorização. |
| RNF-10 | O cookie de sessão deve ser `HttpOnly`, `SameSite=Lax` e `Secure` em produção, com expiração definida. |
| RNF-11 | Segredos OIDC, cookies e tokens não devem aparecer em logs nem em respostas de erro. |
| RNF-12 | Sessões em memória são aceitáveis apenas para desenvolvimento local. Produção deve usar armazenamento de sessão compartilhado, com expiração e revogação. |
| RNF-13 | Chamadas com credenciais devem permanecer na mesma origem; não usar CORS permissivo com credenciais. |

## 5. Modelo de dados

### Documento

| Campo | Tipo | Visibilidade | Descrição |
| --- | --- | --- | --- |
| `id` | string | Público | Identificador único gerado pelo sistema. |
| `ownerId` | string | Interno | Identidade do proprietário, derivada do principal OIDC validado. |
| `originalName` | string | Público | Nome original do arquivo enviado. |
| `size` | number | Público | Tamanho em bytes. |
| `uploadedAt` | string | Público | Data e hora do upload em ISO 8601. |
| `mimeType` | string | Público | Tipo MIME, quando disponível. |
| `storedName` | string | Interno | Nome gerado para o arquivo armazenado. |
| `storagePath` | string | Interno | Caminho local para localizar o arquivo. |

`ownerId`, `storedName` e `storagePath` não devem ser retornados nas respostas públicas.

### Identidade

| Campo | Tipo | Descrição |
| --- | --- | --- |
| `issuer` | string | Emissor OIDC validado. |
| `sub` | string | Identificador do usuário fornecido pelo provedor. |
| `userId` | string | Identificador interno associado ao par `issuer + sub`. |
| `displayName` | string | Nome de exibição, se fornecido; não é usado para autorização. |

Não associar contas automaticamente pelo e-mail. A identidade autorizadora deriva de `(issuer, sub)` validado.

### Sessão

| Campo | Tipo | Descrição |
| --- | --- | --- |
| `sessionId` | string | Valor aleatório opaco enviado em cookie `HttpOnly`. |
| `userId` | string | Usuário associado à sessão autenticada. |
| `expiresAt` | string | Data e hora de expiração da sessão. |
| `csrfToken` | string | Token associado à sessão e exigido em operações que alteram estado. |

## 6. Contratos de API

Os caminhos abaixo são do backend. O frontend os acessa com prefixo `/api`, encaminhado pelo proxy do Vite.

### Formato de erro

```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Não foi possível processar a solicitação."
  }
}
```

Erros não devem revelar stack traces, tokens, caminhos locais ou detalhes internos.

### `GET /auth/login`

Inicia o fluxo OIDC e redireciona ao provedor. O backend gera e armazena os valores necessários para validar `state`, `nonce` e PKCE.

### `GET /auth/callback`

Recebe a resposta do provedor OIDC, valida o fluxo e cria a sessão. Em sucesso, define o cookie de sessão e redireciona o usuário à aplicação. Em caso de validação inválida, não cria sessão.

### `GET /auth/me`

Retorna a identidade autenticada e o token CSRF da sessão atual.

**Sucesso — `200 OK`:**

```json
{
  "user": {
    "id": "identidade-interna",
    "displayName": "Nome do usuário"
  },
  "csrfToken": "token-da-sessao"
}
```

Sem sessão válida, retorna `401 Unauthorized`.

### `POST /auth/logout`

Encerra a sessão atual. Exige sessão válida e cabeçalho `X-CSRF-Token`. Invalida a sessão e limpa o cookie.

- Sucesso: `204 No Content`.
- Sem sessão válida: `401 Unauthorized`.
- Token CSRF inválido: `403 Forbidden`.

### `POST /upload`

Recebe um arquivo como `multipart/form-data`, no campo `file`. Exige sessão válida e `X-CSRF-Token`. O proprietário é obtido exclusivamente da sessão.

**Sucesso — `201 Created`:**

```json
{
  "document": {
    "id": "identificador-gerado",
    "originalName": "relatorio.pdf",
    "size": 153600,
    "uploadedAt": "2026-11-04T12:00:00.000Z",
    "mimeType": "application/pdf"
  }
}
```

| Status | Código sugerido | Situação |
| --- | --- | --- |
| `400` | `FILE_REQUIRED` | Arquivo ausente ou vazio. |
| `401` | `UNAUTHENTICATED` | Sessão ausente ou inválida. |
| `403` | `CSRF_INVALID` | Token CSRF ausente ou inválido. |
| `413` | `FILE_TOO_LARGE` | Arquivo acima do limite configurado. |
| `500` | `UPLOAD_FAILED` | Falha ao gravar arquivo ou registrar metadados. |

### `GET /documents`

Lista documentos do usuário autenticado. Exige sessão válida.

**Sucesso — `200 OK`:**

```json
{
  "documents": [
    {
      "id": "identificador-gerado",
      "originalName": "relatorio.pdf",
      "size": 153600,
      "uploadedAt": "2026-11-04T12:00:00.000Z",
      "mimeType": "application/pdf"
    }
  ]
}
```

Sem documentos, retorna `200 OK` com lista vazia. A resposta não inclui `ownerId`, `storedName` ou `storagePath`.

### `GET /documents/:id/download`

Baixa um documento pertencente ao usuário autenticado.

- Exige sessão válida.
- Sucesso: `200 OK` com conteúdo binário.
- `Content-Type`: MIME registrado ou `application/octet-stream`.
- `Content-Disposition`: `attachment`, com o nome original tratado com segurança para uso em cabeçalho HTTP.
- Documento inexistente, de outro usuário ou indisponível: `404 DOCUMENT_NOT_FOUND`.
- Falha inesperada de transmissão: `500 DOWNLOAD_FAILED`.

### `GET /health`

Verifica se o backend está respondendo, sem exigir autenticação.

**Sucesso — `200 OK`:**

```json
{
  "status": "ok"
}
```

## 7. Decisões arquiteturais

- `routes/`: registra endpoints e conecta middlewares e controllers.
- `controllers/`: interpreta HTTP, valida parâmetros de entrada e produz respostas ou redirecionamentos.
- `services/`: concentra autenticação OIDC, ciclo de vida da sessão, autorização e regras de documentos.
- `repositories/`: abstrai sessões, metadados em memória e arquivos locais.
- Middleware de autenticação valida a sessão e disponibiliza `req.user` com identidade confiável.
- O serviço de documentos recebe o usuário autenticado e aplica regras de propriedade; o repositório filtra por `ownerId`.
- O frontend usa React e acessa a API por `fetch` com prefixo `/api`.
- O proxy Vite encaminha `/api` ao backend e remove o prefixo durante o desenvolvimento.
- O armazenamento dos documentos deve usar Multer com `diskStorage`; não usar armazenamento externo.
- A integração OIDC pode depender de um provedor externo; isso não altera a restrição de armazenamento local dos documentos.
- Deve-se selecionar uma biblioteca OIDC mantida, sem implementar validação criptográfica de tokens manualmente.
- O cookie de sessão deve ser opaco; o frontend não deve acessar credenciais OIDC.
- CSRF deve ser aplicado a upload e logout, com validação de `X-CSRF-Token`.

## 8. Plano de execução

As etapas abaixo descrevem trabalho futuro. Esta especificação não executa alterações nos arquivos de backend ou frontend.

1. **Fechar decisões de segurança e configuração**
   - Selecionar provedor OIDC, registrar callback e definir limite de upload e expiração da sessão.
   - Definir variáveis de ambiente e armazenamento de sessão por ambiente.
   - **Aceite:** configuração local e de produção, bem como políticas de identidade e sessão, estão documentadas.

2. **Implementar autenticação OIDC e sessões**
   - Implementar login, callback, consulta da sessão e logout.
   - Validar `state`, `nonce`, PKCE, assinatura e claims do token.
   - **Aceite:** somente callback válido cria sessão; `/auth/me` informa a identidade; logout invalida a sessão.

3. **Proteger a API**
   - Aplicar middleware de autenticação às rotas de documentos e proteção CSRF às operações mutáveis.
   - **Aceite:** sessão ausente retorna `401`, CSRF inválido retorna `403` e a identidade não pode ser forjada pelo cliente.

4. **Implementar documentos e armazenamento local**
   - Configurar Multer com `diskStorage`, limite de tamanho, nome físico gerado e compensação para falhas.
   - Filtrar listagem e download pelo `ownerId` derivado da sessão.
   - **Aceite:** arquivos ficam em armazenamento local; respostas não expõem caminhos internos; acesso cruzado resulta em `404`.

5. **Integrar frontend**
   - Consultar `/api/auth/me`, permitir login/logout e enviar token CSRF nas operações protegidas.
   - **Aceite:** upload, listagem e download funcionam pela origem do frontend e pelo proxy `/api`.

6. **Testar contratos, segurança e falhas**
   - Cobrir fluxo OIDC, sessão expirada ou revogada, CSRF, isolamento entre usuários, limites e falhas do filesystem.
   - **Aceite:** testes relevantes passam e um usuário não consegue acessar documentos de outro alterando IDs ou enviando campos de proprietário.

7. **Preparar operação**
   - Documentar configuração do provedor, callbacks, cookies, proxy, segredos e comportamento de reinício.
   - **Aceite:** ambiente local é configurável sem segredos versionados; requisitos de produção e limitações de metadados em memória estão explícitos.

## 9. Riscos e limitações

- Metadados em memória desaparecem ao reiniciar o backend; arquivos podem permanecer sem referência.
- Sessões em memória são perdidas ao reiniciar e não são adequadas a múltiplas instâncias de produção.
- O isolamento depende da validação correta do provedor e da aplicação consistente do middleware e dos filtros por proprietário.
- Usar e-mail como chave pode causar colisões ou associação indevida; usar `issuer + sub`.
- Falhas de filesystem podem causar inconsistência entre arquivo e metadados; a compensação do upload deve ser testada.
- Provedor OIDC, limite de upload e tipos de arquivo aceitos precisam ser definidos antes da implementação.
