# 🐦‍⬛ tsmean
> **TypeScript** · **MySQL** · **Express/NestJS** · **Angular** · **Node.js**

Uma MEAN stack, full-stack moderna, fortemente tipada, construída inteiramente com TypeScript.

<img width="1110" height="1114" alt="112906968-74f27000-90c3-11eb-89d3-fd6328e44968" src="https://github.com/user-attachments/assets/5de3a0ae-e9ae-428c-87fd-17cd0e12f390" />


## 📦 Stack

| Camada             | Tecnologia                    |
|--------------------|-------------------------------|
| **Linguagem**      | TypeScript                    |
| **Banco de Dados** | MySQL + TypeORM               |
| **Backend**        | NestJS (Express + Node.js)    |
| **Frontend**       | Angular                       |
| **Testes**         | Jest                          |
| **CI**             | Travis CI + AppVeyor          |
| **Gerenciador**    | npm                           |

---

## 🚀 Início Rápido

### Pré-requisitos

- Node.js >= 18
- MySQL >= 8.0
- npm >= 9

### Instalação

```bash
# Clonar o repositório
git clone https://github.com/seu-usuario/tsmean.git
cd tsmean

# Instalar todas as dependências
npm run install:all
```

### Configurar Banco de Dados

1. Crie um banco MySQL:
```sql
CREATE DATABASE tsmean_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. Copie e configure o arquivo de ambiente:
```bash
cp backend/.env.example backend/.env
```

3. Edite `backend/.env` com suas credenciais.

### Iniciar a Aplicação

```bash
# Terminal 1 - Backend (http://localhost:3000)
npm run start:backend

# Terminal 2 - Frontend (http://localhost:4200)
npm run start:frontend
```

---

## 🏗️ Estrutura do Projeto

```
tsmean/
├── backend/                  # NestJS API
│   ├── src/
│   │   ├── main.ts           # Ponto de entrada
│   │   ├── app.module.ts     # Módulo raiz
│   │   ├── database/         # Configuração TypeORM + MySQL
│   │   └── users/            # Módulo de usuários (CRUD)
│   └── test/                 # Testes e2e
├── frontend/                 # Angular App
│   └── src/
│       ├── app/
│       │   ├── users/        # Componente de usuários
│       │   ├── core/         # Serviços globais, interceptors
│       │   └── shared/       # Componentes compartilhados
│       └── environments/     # Configurações de ambiente
├── .travis.yml               # CI Travis
├── appveyor.yml              # CI AppVeyor
└── package.json              # Scripts monorepo
```

---

## 🧪 Testes

```bash
# Todos os testes
npm test

# Somente backend
npm run test:backend

# Somente frontend
npm run test:frontend
```

---

## 🔌 API Endpoints

| Método   | Rota            | Descrição              |
|----------|-----------------|------------------------|
| `GET`    | `/users`        | Listar usuários        |
| `GET`    | `/users/:id`    | Buscar usuário por ID  |
| `POST`   | `/users`        | Criar usuário          |
| `PATCH`  | `/users/:id`    | Atualizar usuário      |
| `DELETE` | `/users/:id`    | Deletar usuário        |

---

## 🔄 CI/CD

- **Travis CI**: Testa em Linux/macOS
- **AppVeyor**: Testa em Windows
