# 🛒 E-Commerce Platform

A robust, scalable e-commerce backend built with modern technologies and best practices. This project implements a modular monolith architecture, providing a solid foundation for building enterprise-grade e-commerce applications.

![TypeScript](https://img.shields.io/badge/TypeScript-98.3%25-blue?logo=typescript)
![JavaScript](https://img.shields.io/badge/JavaScript-1.7%25-yellow?logo=javascript)
![License](https://img.shields.io/badge/License-Apache%202.0-green)

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Configuration](#configuration)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

## 🎯 Overview

This e-commerce platform provides a comprehensive backend solution for building modern online stores. Built with TypeScript and following modular monolith architecture principles, it offers a scalable, maintainable, and type-safe foundation for e-commerce applications.

## ✨ Key Features

- **🏗️ Modular Monolith Architecture** - Clean separation of concerns with organized modules
- **🔐 Secure Authentication & Authorization** - JWT-based authentication system
- **🛍️ Product Management** - Complete CRUD operations for products and categories
- **🛒 Shopping Cart** - Persistent cart functionality with session management
- **📦 Order Processing** - Full order lifecycle management
- **💳 Payment Integration Ready** - Prepared for payment gateway integration
- **👥 User Management** - Customer profiles and account management
- **🔍 Advanced Search & Filtering** - Efficient product discovery
- **📊 Inventory Management** - Real-time stock tracking
- **📱 RESTful API** - Well-designed API endpoints
- **🗃️ Database ORM** - Type-safe database operations with Prisma
- **⚡ High Performance** - Optimized queries and caching strategies

## 🛠️ Tech Stack

### Core Technologies

- **Runtime**: Node.js
- **Language**: TypeScript
- **Framework**: Express.js
- **Database ORM**: Prisma
- **Database**: SQL (PostgreSQL/MySQL/SQLite)

### Development Tools

- **TypeScript Compiler**: TSC
- **Package Manager**: npm
- **Version Control**: Git

## 🏛️ Architecture

This project follows a **Modular Monolith Architecture**, which provides:

- **Modularity**: Clear boundaries between business domains
- **Maintainability**: Easier to understand and modify code
- **Scalability**: Can be split into microservices if needed
- **Simplified Development**: Single deployment unit with multiple modules

### Module Structure

```
src/
├── modules/
│   ├── auth/          # Authentication & authorization
│   ├── users/         # User management
│   ├── products/      # Product catalog
│   ├── orders/        # Order processing
│   ├── cart/          # Shopping cart
│   └── payments/      # Payment processing
├── shared/            # Shared utilities and types
└── infrastructure/    # Cross-cutting concerns
```

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16.x or higher)
- **npm** (v8.x or higher)
- **Database** (PostgreSQL, MySQL, or SQLite)
- **Git**

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/Mazen-Haytham/E-commerce.git
cd E-commerce
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/ecommerce"

# Server
PORT=3000
NODE_ENV=development

# JWT
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d

# Application
API_VERSION=v1
```

4. **Set up the database**

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev

# (Optional) Seed the database
npm run seed
```

5. **Start the development server**

```bash
npm run dev
```

The server should now be running on `http://localhost:3000` 🎉

## ⚙️ Configuration

### Database Configuration

Prisma supports multiple databases. Update your `DATABASE_URL` in `.env`:

**PostgreSQL:**
```
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
```

**MySQL:**
```
DATABASE_URL="mysql://USER:PASSWORD@HOST:PORT/DATABASE"
```

**SQLite:**
```
DATABASE_URL="file:./dev.db"
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | Database connection string | Required |
| `PORT` | Server port | 3000 |
| `NODE_ENV` | Environment mode | development |
| `JWT_SECRET` | Secret key for JWT | Required |
| `JWT_EXPIRES_IN` | JWT expiration time | 7d |

## 📁 Project Structure

```
E-commerce/
├── prisma/                 # Prisma schema and migrations
│   ├── schema.prisma      # Database schema
│   └── migrations/        # Database migrations
├── src/                   # Source code
│   ├── modules/           # Business logic modules
│   ├── shared/            # Shared utilities
│   ├── infrastructure/    # Infrastructure setup
│   ├── config/            # Configuration files
│   └── server.ts          # Application entry point
├── .gitignore            # Git ignore rules
├── package.json          # Project dependencies
├── tsconfig.json         # TypeScript configuration
├── prisma.config.ts      # Prisma configuration
└── README.md             # Project documentation
```

## 📚 API Documentation

### Base URL

```
http://localhost:3000/api/v1
```

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | User login |
| POST | `/auth/logout` | User logout |
| GET | `/auth/me` | Get current user |

### Product Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/products` | Get all products |
| GET | `/products/:id` | Get product by ID |
| POST | `/products` | Create new product |
| PUT | `/products/:id` | Update product |
| DELETE | `/products/:id` | Delete product |

### Order Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/orders` | Get all orders |
| GET | `/orders/:id` | Get order by ID |
| POST | `/orders` | Create new order |
| PUT | `/orders/:id` | Update order |
| DELETE | `/orders/:id` | Delete order |

> **Note**: Detailed API documentation with request/response examples coming soon!

## 🗄️ Database Schema

The database is managed using Prisma ORM. Key entities include:

- **User** - Customer accounts and authentication
- **Product** - Product catalog
- **Category** - Product categories
- **Order** - Customer orders
- **OrderItem** - Order line items
- **Cart** - Shopping cart
- **CartItem** - Cart items
- **Payment** - Payment records

To view the complete schema:

```bash
npx prisma studio
```

## 💻 Development

### Available Scripts

```bash
# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Format code
npm run format

# Generate Prisma Client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Open Prisma Studio
npm run prisma:studio
```

### Code Style

This project uses:
- **ESLint** for code linting
- **Prettier** for code formatting
- **TypeScript** for type safety

### Git Workflow

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Commit your changes: `git commit -m 'Add some feature'`
3. Push to the branch: `git push origin feature/your-feature`
4. Submit a pull request

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 🚢 Deployment

### Production Build

```bash
# Install production dependencies
npm ci --production

# Build the application
npm run build

# Start the production server
npm start
```

### Docker Deployment

```dockerfile
# Dockerfile example (to be added)
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Environment Considerations

- Set `NODE_ENV=production`
- Use a production-grade database
- Enable SSL/TLS for database connections
- Implement rate limiting
- Set up logging and monitoring
- Configure proper CORS settings

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Contribution Guidelines

- Follow the existing code style
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting PR

## 📄 License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## 👤 Contact

**Mazen Haytham**

- GitHub: [@Mazen-Haytham](https://github.com/Mazen-Haytham)
- Project Link: [https://github.com/Mazen-Haytham/E-commerce](https://github.com/Mazen-Haytham/E-commerce)

## 🙏 Acknowledgments

- [Express.js](https://expressjs.com/) - Fast, unopinionated, minimalist web framework
- [Prisma](https://www.prisma.io/) - Next-generation ORM for Node.js and TypeScript
- [TypeScript](https://www.typescriptlang.org/) - Typed JavaScript at Any Scale
- [Node.js](https://nodejs.org/) - JavaScript runtime

---

<div align="center">
  <strong>⭐ Star this repository if you find it helpful! ⭐</strong>
</div>
