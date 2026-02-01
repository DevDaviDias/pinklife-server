# 🌸 PinkLife Server

API REST desenvolvida em **Node.js** para servir como backend do projeto **PinkLife**, uma aplicação de organização pessoal e bem-estar.

A API é responsável por **autenticação, persistência de dados e regras de negócio**, comunicando-se com o front-end através de requisições HTTP protegidas por **JWT**.

---

## 🚀 Tecnologias Utilizadas

- **Node.js**
- **Express**
- **MongoDB + Mongoose**
- **JWT (JSON Web Token)**
- **Bcrypt**
- **Dotenv**
- **Cors**
- **Nodemon** (ambiente de desenvolvimento)

---

## 🔐 Autenticação

A autenticação é feita via **JWT**.

### Fluxo:
1. Usuário se registra (`/auth/register`)
2. Usuário faz login (`/auth/login`)
3. A API retorna um **token**
4. O token deve ser enviado no header:
```http
Authorization: Bearer SEU_TOKEN_AQUI
