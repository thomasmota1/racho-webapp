# Rachô

Aplicação web para organizar despesas compartilhadas de viagens, festas, churrascos, repúblicas, compras coletivas e outros grupos.

O Rachô não processa dinheiro. Ele registra despesas, calcula os saldos e permite que um usuário informe que pagou por fora do sistema. A pessoa que recebeu confirma ou recusa o acerto.

## Tecnologias

- Frontend: React com Vite e CSS próprio
- Backend: Node.js com Express
- Banco de dados: PostgreSQL local
- ORM: Prisma
- Autenticação: JWT e senha criptografada com bcrypt

Não foi usado framework visual. A interface foi construída em CSS para que o funcionamento continue fácil de explicar.

## Funcionalidades

### Usuário comum

- criar conta e entrar no sistema;
- editar o próprio perfil e trocar a senha;
- criar grupos de despesas;
- adicionar ao grupo pessoas já cadastradas;
- criar, consultar, editar e excluir as próprias despesas;
- selecionar o pagador e os participantes de cada despesa;
- consultar quanto cada pessoa pagou, consumiu, deve ou recebe;
- consultar sugestões de transferência;
- informar um pagamento realizado fora do sistema;
- confirmar ou recusar um pagamento que deveria receber.

### Administrador

O administrador cuida dos cadastros gerais da aplicação.

- visualizar todos os grupos e usuários;
- abrir e editar qualquer grupo;
- editar ou excluir qualquer despesa;
- confirmar ou recusar pagamentos informados pelos participantes;
- criar, editar, desativar e excluir categorias;
- editar nome, perfil e status de qualquer usuário;
- desativar contas sem apagar o histórico relacionado.

## Estrutura do projeto

```text
racho-webapp/
├── backend/
│   ├── prisma/
│   │   ├── migrations/
│   │   ├── schema.prisma
│   │   └── seed.js
│   └── src/
│       ├── controllers/
│       ├── middlewares/
│       ├── routes/
│       ├── services/
│       ├── utils/
│       ├── app.js
│       └── server.js
└── frontend/
    └── src/
        ├── components/
        │   ├── admin/
        │   └── group/
        ├── contexts/
        ├── pages/
        ├── services/
        ├── utils/
        ├── App.jsx
        └── styles.css
```

Os principais nomes internos de componentes, funções e variáveis estão em português. Nomes como
`name`, `password`, `groupId` e `participantIds` foram mantidos somente nos campos da
API e do Prisma, pois fazem parte do contrato entre as camadas.

## Execução local

É necessário ter Node.js, npm e PostgreSQL instalados localmente.

### 1. Verificar o PostgreSQL local

Este projeto usa a instalação local do PostgreSQL 17 na porta padrão `5432`. Confirme se o serviço está ativo:

```powershell
Get-Service postgresql*
```

Confirme que a porta está aberta:

```powershell
Test-NetConnection 127.0.0.1 -Port 5432
```

O resultado esperado é `TcpTestSucceeded : True`.

Se o banco `racho` ainda não existir, crie-o com:

```powershell
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -h 127.0.0.1 -p 5432 -U postgres -d postgres -c "CREATE DATABASE racho;"
```

### 2. Configurar e preparar o backend

```powershell
cd backend
npm install
Copy-Item .env.example .env
```

Confirme que `backend/.env` contém a porta `5432` e a senha configurada durante a instalação do PostgreSQL:

```env
DATABASE_URL="postgresql://postgres:SUA_SENHA@127.0.0.1:5432/racho?schema=public"
JWT_SECRET="chave-local-do-projeto-racho"
PORT=3333
FRONTEND_URL="http://localhost:5173"
```

Depois, execute:

```powershell
npm run prisma:generate
npx prisma migrate dev
npm run seed
```

O comando `npm run seed` recria os dados demonstrativos e apaga os dados existentes. Não o execute em um banco que contenha dados importantes.

### 3. Iniciar o backend

Ainda no diretório `backend`:

```powershell
npm run dev
```

O backend ficará em `http://localhost:3333`.

Teste rápido, em outro terminal:

```powershell
Invoke-RestMethod http://localhost:3333/api/health
```

### 4. Iniciar o frontend

Em outro PowerShell:

```powershell
cd frontend
npm install
npm run dev
```

O frontend ficará em `http://localhost:5173`.

O frontend já usa por padrão `http://localhost:3333/api`. Se necessário, crie `frontend/.env` com:

```env
VITE_API_URL="http://localhost:3333/api"
```

### 5. Dados demonstrativos

Administrador:

```text
admin@racho.com / admin123
```

Usuários comuns:

```text
ana@racho.com / 123456
bruno@racho.com / 123456
carla@racho.com / 123456
```

## Como o cálculo funciona

Para cada integrante, o backend calcula:

```text
saldo = total pago - participação nas despesas
```

- saldo positivo: a pessoa deve receber;
- saldo negativo: a pessoa deve pagar;
- saldo zero: a pessoa está em dia.

Depois, o backend separa credores e devedores e combina os valores até todos os saldos chegarem a zero.
O resultado é uma sugestão prática de acertos, sem a promessa de ser o mínimo matemático em todos os casos.

Exemplo:

```text
Ana: + R$ 50
Bruno: + R$ 20
Carla: - R$ 70
```

Sugestões:

```text
Carla paga R$ 50 para Ana
Carla paga R$ 20 para Bruno
```

<<<<<<< Updated upstream
=======
## Documentos para estudo

- `PROPOSTA-PARA-ENTREGAR.md`: texto breve da proposta.
- `docs/GUIA-DO-CODIGO.md`: explicação detalhada da aplicação.
- `docs/ROTEIRO-DE-APRESENTACAO.md`: organização de uma apresentação de 25 a 30 minutos.
- `docs/MODELAGEM-E-REQUISITOS.md`: tabelas, relacionamentos e atendimento ao enunciado.
- `docs/DIVISAO-E-EXECUCAO.md`: responsabilidades da equipe, comandos e roteiro de testes.
- `docs/ROTEIRO-DEFESA-E-PERCURSOS.md`: roteiro detalhado para explicar ações do frontend ao banco.

>>>>>>> Stashed changes
## Observação sobre pagamentos

O sistema não se conecta ao Pix, a bancos ou a cartões. O pagamento acontece fora da aplicação. O Rachô registra:

1. quem pagou;
2. quem deveria receber;
3. o valor;
4. a forma utilizada;
5. o status pendente, confirmado ou recusado.

Isso mantém o projeto dentro do conteúdo de Programação para Web II e evita dependência de serviços financeiros externos.
