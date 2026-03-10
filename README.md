<div align="center">

# 🛒 E-Commerce Platform

**A modular, scalable backend built with TypeScript, Express & Prisma**

[![TypeScript](https://img.shields.io/badge/TypeScript-98.3%25-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-v16+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express.js-Framework-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![License](https://img.shields.io/badge/License-Apache%202.0-22c55e?style=for-the-badge)](LICENSE)

</div>

---

## ✨ Features

| | Feature | Description |
|---|---|---|
| 🔐 | **Auth & JWT** | Secure login, registration & token-based sessions |
| 🛍️ | **Product Catalog** | Full CRUD for products, categories & inventory |
| 🛒 | **Shopping Cart** | Persistent cart with session management |
| 📦 | **Order Lifecycle** | Full order creation, tracking & management |
| 💳 | **Payment Ready** | Prepared for payment gateway integration |
| 🔍 | **Search & Filter** | Advanced product discovery with efficient queries |
| 👥 | **User Management** | Customer profiles & account management |
| 📊 | **Inventory Tracking** | Real-time stock management |

---

## 🛠️ Tech Stack

- **Runtime** — Node.js v16+
- **Language** — TypeScript
- **Framework** — Express.js
- **ORM** — Prisma
- **Database** — PostgreSQL / MySQL / SQLite
- **Auth** — JWT

---

## 🚀 Quick Start

**1. Clone & install**
```bash
git clone https://github.com/Mazen-Haytham/E-commerce.git
cd E-commerce
npm install
```

**2. Set up your `.env`**
```env
DATABASE_URL="postgresql://user:password@localhost:5432/ecommerce"
PORT=3000
NODE_ENV=development
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d
```

**3. Set up the database**
```bash
npx prisma generate
npx prisma migrate dev
```

**4. Start the dev server**
```bash
npm run dev
# → http://localhost:3000
```

---

## 📁 Project Structure

```
src/
├── modules/
│   ├── auth/          # Authentication & JWT
│   ├── users/         # User profiles & accounts
│   ├── products/      # Product catalog & search
│   ├── orders/        # Order lifecycle
│   ├── cart/          # Shopping cart & sessions
│   └── payments/      # Payment processing
├── shared/            # Shared utilities & types
└── infrastructure/    # Cross-cutting concerns
```

---

## 📡 API Endpoints

Base URL: `http://localhost:3000/api/v1`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/register` | Register new user |
| `POST` | `/auth/login` | User login |
| `GET` | `/auth/me` | Current user info |
| `GET` | `/products` | List all products |
| `POST` | `/products` | Create product |
| `PUT` | `/products/:id` | Update product |
| `DELETE` | `/products/:id` | Delete product |
| `GET` | `/orders` | List all orders |
| `POST` | `/orders` | Create order |
| `PUT` | `/orders/:id` | Update order |

---

## 🧰 Scripts

```bash
npm run dev          # Start dev server with hot reload
npm run build        # Build for production
npm start            # Start production server
npm test             # Run tests
npm run lint         # Lint code
npm run prisma:studio  # Open Prisma Studio (DB GUI)
```

---

## 🤝 Contributing

1. Fork the repo
2. Create a branch: `git checkout -b feature/your-feature`
3. Commit: `git commit -m 'Add your feature'`
4. Push: `git push origin feature/your-feature`
5. Open a Pull Request

---

<div align="center">

Made by [Mazen Haytham](https://github.com/Mazen-Haytham) &nbsp;·&nbsp; Apache 2.0 License

**⭐ Star this repo if you find it useful!**

</div>