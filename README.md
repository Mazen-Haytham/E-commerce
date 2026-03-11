# 🛒 E-Commerce REST API

A full-featured RESTful API for an e-commerce platform, supporting product catalog management, inventory tracking, shopping carts, order processing, payments, and discount pricing.

**Base URL:** `http://localhost:3000/api`

---

## 📋 Table of Contents

- [Authentication](#-authentication)
- [Categories](#-categories)
- [Product Catalog](#-product-catalog)
- [Inventory](#-inventory)
- [Users](#-users)
- [Shopping Cart](#-shopping-cart)
- [Orders](#-orders)
- [Payments](#-payments)
- [Pricing & Discounts](#-pricing--discounts)
- [Error Handling](#-error-handling)
- [Roles & Permissions](#-roles--permissions)

---

## 🔐 Authentication

All protected endpoints require a **Bearer Token** in the `Authorization` header:

```
Authorization: Bearer <accessToken>
```

### POST `/auth/login`
Authenticates a user and returns an access token. Sets an HttpOnly `refreshToken` cookie.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response `200 OK`:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### POST `/auth/refresh`
Generates a new access token using the `refreshToken` cookie (valid for 7 days).

**Response `200 OK`:**
```json
{
  "accessToken": "newAccessTokenHere"
}
```

---

## 📂 Categories

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| `GET` | `/categories` | Get all categories | ADMIN, USER |
| `GET` | `/categories/:id` | Get category by ID | ADMIN, USER |
| `POST` | `/categories` | Create one or more categories | ADMIN |
| `PATCH` | `/categories/:id` | Update a category | ADMIN |
| `DELETE` | `/categories/:id` | Delete a category | ADMIN |

### POST `/categories` — Create Categories

**Request Body (array):**
```json
[
  { "name": "Electronics" },
  { "name": "Clothing" }
]
```

**Response `201 Created`:**
```json
{
  "status": "Success",
  "data": { "count": 2 }
}
```

---

## 📦 Product Catalog

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| `GET` | `/catalog/` | Get all active products with variants | ADMIN, USER |
| `POST` | `/catalog/` | Create a new product | ADMIN, SUPPLIER |
| `PATCH` | `/catalog/:id` | Update a product and/or its variants | ADMIN, SUPPLIER |
| `DELETE` | `/catalog/:id` | Soft-delete a product | ADMIN, SUPPLIER |

### POST `/catalog/` — Add Product

Products support multiple variants (e.g. different sizes/colors), each with their own SKU, pricing, images, and inventory associations.

**Request Body:**
```json
{
  "name": "Gaming Laptop",
  "producer": "TechBrand",
  "categories": ["category-uuid-1", "category-uuid-2"],
  "variants": [
    {
      "sku": "LAPTOP-001-16GB",
      "color": "Space Gray",
      "size": "15.6 inch",
      "weight": "1.8kg",
      "price": 1299.99,
      "images": [
        {
          "url": "https://example.com/laptop-gray-1.jpg",
          "altText": "Gaming laptop space gray",
          "isPrimary": true
        }
      ],
      "inventories": [
        { "id": "inventory-uuid", "stockLevel": 50, "restock": 10 }
      ]
    }
  ]
}
```

**Response `201 Created`:**
```json
{
  "status": "Success",
  "data": {
    "id": "product-uuid",
    "name": "Gaming Laptop",
    "producer": "TechBrand",
    "variants": [
      { "productId": "product-uuid", "id": "variant-uuid-1" }
    ]
  }
}
```

---

## 🏭 Inventory

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| `GET` | `/inventory/` | Get all inventory locations | ADMIN |
| `GET` | `/inventory/:id` | Get inventory by ID | ADMIN |
| `POST` | `/inventory/` | Create an inventory location | ADMIN |
| `PATCH` | `/inventory/:id` | Update an inventory location | ADMIN |
| `PATCH` | `/inventory/stock/:id` | Update stock level for a product variant | ADMIN, SUPPLIER |
| `DELETE` | `/inventory/:id` | Deactivate an inventory location | ADMIN |

### PATCH `/inventory/stock/:id` — Update Stock Level

**Request Body:**
```json
{
  "productVariantId": "variant-uuid",
  "inventoryId": "inventory-uuid",
  "stockLevel": 75
}
```

---

## 👤 Users

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| `POST` | `/users/` | Create a new user account | Public |
| `GET` | `/users/` | Get all users | ADMIN |
| `GET` | `/users/:id` | Get user by ID | ADMIN |
| `GET` | `/users/email/:email` | Get user by email | ADMIN |
| `PATCH` | `/users/:id` | Update user info | ADMIN, CUSTOMER |
| `DELETE` | `/users/:id` | Deactivate a user | ADMIN, CUSTOMER |

### POST `/users/` — Register User

```json
{
  "email": "newuser@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "password": "SecurePassword123!",
  "phone": "+1234567890",
  "profilePic": "https://example.com/profile.jpg"
}
```

**Response `201 Created`:** Returns the created user with role `["CUSTOMER"]`.

---

## 🛍️ Shopping Cart

Base path: `/users/:id/cart`

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| `GET` | `/users/:id/cart` | Get user's cart | ADMIN, CUSTOMER |
| `POST` | `/users/:id/cart/items` | Add item to cart | ADMIN, CUSTOMER |
| `PATCH` | `/users/:id/cart/items/:variantId` | Update item quantity | ADMIN, CUSTOMER |
| `DELETE` | `/users/:id/cart/items/:variantId` | Remove item from cart | ADMIN, CUSTOMER |
| `DELETE` | `/users/:id/cart` | Clear entire cart | ADMIN, CUSTOMER |

### GET `/users/:id/cart` — View Cart

**Response `200 OK`:**
```json
{
  "status": "Success",
  "data": {
    "userId": "user-uuid",
    "items": [
      {
        "productVariantId": "variant-uuid-1",
        "quantity": 2,
        "price": 49.99,
        "subtotal": 99.98
      }
    ],
    "totalPrice": 129.97
  }
}
```

---

## 📋 Orders

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| `GET` | `/orders/` | Get all orders | ADMIN |
| `POST` | `/orders/` | Create a new order | Authenticated |
| `GET` | `/orders/:orderId` | Get order by ID | Authenticated |
| `GET` | `/orders/user/:userId` | Get orders by user | Authenticated |
| `PATCH` | `/orders/:orderId/status` | Update order status | Authenticated |
| `DELETE` | `/orders/:orderId` | Soft-delete an order | Authenticated |

### Order Statuses
`pending` → `confirmed` → `packed` → `shipped` → `delivered` → `cancelled`

### POST `/orders/` — Create Order

**Request Body:**
```json
{
  "userId": "user-uuid",
  "items": [
    { "productVariantId": "variant-uuid-1", "quantity": 2, "unitPrice": 49.99 },
    { "productVariantId": "variant-uuid-2", "quantity": 1, "unitPrice": 29.99 }
  ],
  "totalPrice": 129.97
}
```

---

## 💳 Payments

Base path: `/orders/:orderId/payments`

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| `POST` | `/orders/:orderId/payments` | Create a payment record | Authenticated |
| `GET` | `/orders/:orderId/payments` | Get payments for an order | Authenticated |

### POST `/orders/:orderId/payments` — Create Payment

**Request Body:**
```json
{
  "orderId": "order-uuid",
  "paymentMethodId": "method-uuid",
  "amount": 129.97,
  "transactionId": "txn_123456789"
}
```

**Response `201 Created`:** Returns payment record with `status: "pending"`.

---

## 🏷️ Pricing & Discounts

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| `GET` | `/orders/pricing/product/:productId` | Get pricing for all variants of a product | Public |
| `GET` | `/orders/pricing/variant/:variantId` | Get pricing for a specific variant | Public |
| `GET` | `/orders/pricing/category/:categoryId` | Get pricing for all products in a category | Public |
| `POST` | `/orders/discount/variant` | Create a discount for a product variant | ADMIN |
| `POST` | `/orders/discount/category` | Create a discount for an entire category | ADMIN |

### POST `/orders/discount/variant` — Create Variant Discount

**Request Body:**
```json
{
  "productVariantId": "variant-uuid",
  "discountType": "percentage",
  "discountValue": 15
}
```

> **Discount types:** `percentage` (0–100) or `fixed_amount` (currency value)

### POST `/orders/discount/category` — Create Category Discount

**Request Body:**
```json
{
  "categoryId": "category-uuid",
  "discountType": "percentage",
  "discountValue": 20
}
```

---

## ❌ Error Handling

All error responses follow this format:

```json
{
  "status": "Error",
  "message": "Error description",
  "data": {
    "details": "Additional error information if available"
  }
}
```

| Status Code | Meaning |
|-------------|---------|
| `200` | OK — Request succeeded |
| `201` | Created — Resource successfully created |
| `400` | Bad Request — Invalid request data |
| `401` | Unauthorized — Missing or invalid token |
| `403` | Forbidden — Insufficient permissions |
| `404` | Not Found — Resource not found |
| `500` | Internal Server Error |

---

## 🔑 Roles & Permissions

| Role | Access Level |
|------|-------------|
| **ADMIN** | Full access to all endpoints |
| **SUPPLIER** | Can manage products and update inventory stock |
| **CUSTOMER / USER** | Can browse products, manage own cart, and place orders |

> Access tokens have a limited lifetime. Use `POST /auth/refresh` to renew them. Refresh tokens are valid for **7 days**.
