# Connect

API em Node.js para cadastro de participantes e controle de indicação/ranking por convites.

## Visão geral

O projeto expõe uma API HTTP com Fastify, validação com Zod, documentação OpenAPI/Swagger e persistência em PostgreSQL + Redis.

O fluxo principal é:

1. Uma pessoa se inscreve com `name` e `email`.
2. Se ela vier por um link com `referrer`, o indicador ganha 1 ponto no ranking.
3. Cada acesso ao link de convite incrementa o contador de cliques daquele `subscriberId`.
4. A API disponibiliza ranking, posição e métricas individuais por participante.

## Stack

- **Node.js**
- **Fastify**
- **TypeScript**
- **Zod**
- **Drizzle ORM**
- **PostgreSQL**
- **Redis**
- **Swagger/OpenAPI**

## Estrutura

```txt
src/
├── app.ts
├── env.ts
├── drizzle/
│   ├── client.ts
│   ├── schema/
│   └── migrations/
├── redis/
│   └── client.ts
├── routes/
└── functions/
```

## Requisitos

- Node.js 18+
- PostgreSQL
- Redis

## Variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
PORT=3333
DATABASE_URL=postgresql://user:password@localhost:5432/connect
REDIS_URL=redis://localhost:6379
REFERRAL_URL=http://localhost:3000
```

### Descrição

- `PORT`: porta da API.
- `DATABASE_URL`: conexão do PostgreSQL usada pelo Drizzle.
- `REDIS_URL`: conexão do Redis usada para ranking e métricas.
- `REFERRAL_URL`: URL de destino para onde o link de convite redireciona adicionando `?referrer=...`.

## Instalação

```bash
npm install
```

## Banco de dados e Redis com Docker

O arquivo `docker-compose.yml` já define os serviços necessários:

- PostgreSQL na porta `5432`
- Redis na porta `6379`

```bash
docker compose up -d
```

## Migrações

O projeto usa Drizzle para criar e aplicar migrações:

```bash
npm run migrate
```

## Scripts

| Script | Descrição |
|---|---|
| `npm run dev` | Executa a aplicação em modo watch |
| `npm run build` | Gera o build para produção |
| `npm run migrate` | Aplica as migrações do banco |
| `npm run start` | Executa a migração e inicia o build em `dist/` |

## Execução

### Desenvolvimento

```bash
npm run dev
```

### Produção

```bash
npm run build
npm run start
```

## Documentação da API

Quando a aplicação está rodando, a documentação Swagger fica disponível em:

```txt
/docs
```

## Banco de dados

### Tabela `subscriptions`

Campos principais:

- `id` UUID primário
- `name` nome do participante
- `email` email único
- `created_at` data de criação

## Redis

O Redis armazena as métricas de referral:

- `referral:ranking` -> sorted set com a pontuação de cada `subscriberId`
- `referral:access-count` -> hash com o total de acessos de convite por `subscriberId`

## Endpoints

### `POST /subscriptions`

Cria uma inscrição.

**Body**

```json
{
  "name": "Ana Silva",
  "email": "ana@email.com",
  "referrer": "subscriber-id-opcional"
}
```

**Resposta `201`**

```json
{
  "subscriberId": "uuid-da-inscricao"
}
```

Se o `email` já existir, o sistema retorna o `subscriberId` já cadastrado.

### `GET /invites/:subscriberId`

Registra um acesso no link de convite e redireciona para `REFERRAL_URL` com o query param `referrer`.

Exemplo:

```txt
/invites/abc123
```

Redireciona para algo como:

```txt
http://localhost:3000?referrer=abc123
```

### `GET /ranking`

Retorna o top 3 do ranking.

**Resposta `200`**

```json
{
  "ranking": [
    {
      "id": "uuid",
      "name": "Ana Silva",
      "score": 10
    }
  ]
}
```

### `GET /subscribers/:subscriberId/ranking/count`

Retorna a pontuação atual do participante no ranking.

**Resposta `200`**

```json
{
  "count": 10
}
```

### `GET /subscribers/:subscriberId/ranking/clicks`

Retorna quantos acessos o link de convite desse participante recebeu.

**Resposta `200`**

```json
{
  "count": 7
}
```

### `GET /subscribers/:subscriberId/ranking/position`

Retorna a posição do participante no ranking.

**Resposta `200`**

```json
{
  "position": 1
}
```

Se o participante não aparecer no ranking, a posição pode ser `null`.

## Como funciona o ranking

- Cada inscrição com `referrer` soma 1 ponto para o indicador no sorted set `referral:ranking`.
- O endpoint `/ranking` consulta os 3 primeiros colocados.
- A posição é calculada com `ZREVRANK`, então maior pontuação = melhor posição.

## Observações

- A API já registra Swagger/OpenAPI.
- CORS está habilitado.
- A configuração de ambiente é validada com Zod na inicialização.
