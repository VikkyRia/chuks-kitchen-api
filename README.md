# Chuks Kitchen API

A backend REST API for **Chuks Kitchen** — a digital food ordering platform built for Trueminds Innovations Ltd.

Built with **Node.js (Express)** and **SQLite** using a clean MVC architecture.

---

## Project Structure

```
chuks-kitchen-api/
├── src/
│   ├── config/
│   │   └── db.js                  # Database connection
│   ├── db/
│   │   └── migrate.js             # Table creation (migrations)
│   ├── models/
│   │   ├── user.model.js          # User database queries
│   │   ├── food.model.js          # Food database queries
│   │   ├── cart.model.js          # Cart database queries
│   │   └── order.model.js         # Order database queries
│   ├── controllers/
│   │   ├── user.controller.js     # User business logic
│   │   ├── food.controller.js     # Food business logic
│   │   ├── cart.controller.js     # Cart business logic
│   │   └── order.controller.js    # Order business logic
│   ├── routes/
│   │   ├── user.routes.js         # User endpoints
│   │   ├── food.routes.js         # Food endpoints
│   │   ├── cart.routes.js         # Cart endpoints
│   │   └── order.routes.js        # Order endpoints
│   └── app.js                     # Entry point
├── package.json
└── README.md
```

---

## Setup & Installation

```bash
# 1. Clone the repository
git clone https://github.com/VikkyRia/chuks-kitchen-api.git
cd chuks-kitchen-api

# 2. Install dependencies
npm install

# 3. Start the server
npm run dev       # development (auto-restarts on save)
npm start         # production
```

The server runs on `http://localhost:5001`  
The SQLite database file (`chuks.db`) is auto-created on first run.

---

## System Overview

Chuks Kitchen API is a food ordering backend that supports two user types:

**Customer** — can register, browse food, manage a cart, place orders, and track order status.  
**Admin** — can add, update, and delete food items, and manage order statuses.

### How it works end-to-end:

1. Customer signs up with email or phone number
2. A 6-digit OTP is generated and returned (in production, this would be sent via email/SMS)
3. Customer verifies their account using the OTP
4. Customer browses available food items
5. Customer adds items to their cart
6. Customer places an order — the system validates the cart, calculates the total, creates the order, and clears the cart automatically (all in a single database transaction)
7. Admin updates the order status as it progresses through the lifecycle
8. Customer can track their order status at any time

---

## 🔁 Flow Diagrams

### A) User Registration & Verification Flow

```
Customer → POST /api/users/signup
         → Validate (name + email/phone required)
         → Check for duplicate email/phone
         → Validate referral code (if provided)
         → Generate 6-digit OTP (expires in 10 mins)
         → Save user (is_verified = 0)
         → Return user_id + OTP

Customer → POST /api/users/verify
         → Find user by user_id
         → Check if already verified
         → Check OTP expiry
         → Check OTP match
         → Set is_verified = 1, clear OTP
         → Return success
```

**Edge Cases Handled:**
- Duplicate email → 409 Conflict
- Duplicate phone → 409 Conflict
- Invalid referral code → 400 Bad Request
- Expired OTP → 400 Bad Request
- Wrong OTP → 400 Bad Request
- Already verified account → 400 Bad Request

---

### B) Food Browsing Flow

```
Customer/Admin → GET /api/foods
              → Optional ?category=rice filter
              → Returns only available items (is_available = 1)

Admin → POST /api/foods
      → Validate (name, price, category required)
      → Check for duplicate food name
      → Save food item
      → Return created food

Admin → PATCH /api/foods/:id
      → Find food by ID
      → Update only provided fields (partial update)
      → Return updated food

Admin → DELETE /api/foods/:id
      → Find food by ID
      → Remove from database
```

---

### C) Cart Flow

```
Customer → POST /api/cart
         → Validate user exists and is verified
         → Check food exists and is available
         → If item already in cart → increase quantity
         → Else → add new cart item
         → Return cart item

Customer → GET /api/cart/:user_id
         → JOIN cart with foods table
         → Calculate subtotal per item
         → Calculate total price
         → Warn if any item became unavailable

Customer → DELETE /api/cart/:user_id/item/:cart_item_id
         → Remove single item

Customer → DELETE /api/cart/:user_id/clear
         → Remove all items
```

**Edge Cases Handled:**
- Unverified user cannot add to cart
- Unavailable food cannot be added
- Duplicate item increases quantity instead of creating a duplicate
- Cart warns customer if item became unavailable after being added

---

### D) Order Flow

```
Customer → POST /api/orders
         → Validate user exists and is verified
         → Fetch cart items (JOIN with foods)
         → Check cart is not empty
         → Check no unavailable items exist
         → Calculate total price
         → BEGIN TRANSACTION:
             1. Create order record (status = pending)
             2. Save each item as order_item
             3. Clear the cart
         → END TRANSACTION
         → Return order details

Admin → PATCH /api/orders/:id/status
      → Validate status is one of the allowed values
      → Check order is not already completed/cancelled
      → Update status

Customer → PATCH /api/orders/:id/cancel
         → Check order belongs to this user
         → Check order is still pending
         → Set status to cancelled
```

**Order Status Lifecycle:**
```
pending → confirmed → preparing → out_for_delivery → completed
                                                   ↘ cancelled
```

**Edge Cases Handled:**
- Empty cart cannot be ordered
- Unavailable items block order placement
- Completed/cancelled orders cannot be updated
- Customers can only cancel pending orders
- Wrong user cannot cancel another user's order
- All 3 order steps happen in a transaction (all succeed or all fail)

---

## 📡 API Endpoints

### Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/users/signup` | Register a new user |
| POST | `/api/users/verify` | Verify account with OTP |
| GET | `/api/users/:id` | Get user profile |

**Signup Request Body:**
```json
{
  "name": "Chidi Okonkwo",
  "email": "chidi@gmail.com",
  "phone": "08012345678",
  "referral_code": "optional-user-id"
}
```

**Verify Request Body:**
```json
{
  "user_id": "uuid-here",
  "otp": "694199"
}
```

---

### Foods

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/foods` | Get all available foods |
| GET | `/api/foods?category=rice` | Filter by category |
| GET | `/api/foods/:id` | Get single food item |
| POST | `/api/foods` | Admin: Add food item |
| PATCH | `/api/foods/:id` | Admin: Update food item |
| DELETE | `/api/foods/:id` | Admin: Delete food item |

**Create Food Request Body:**
```json
{
  "name": "Jollof Rice",
  "description": "Nigerian party jollof with chicken",
  "price": 2500,
  "category": "rice"
}
```

---

### Cart

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/cart` | Add item to cart |
| GET | `/api/cart/:user_id` | View cart with totals |
| DELETE | `/api/cart/:user_id/item/:cart_item_id` | Remove single item |
| DELETE | `/api/cart/:user_id/clear` | Clear entire cart |

**Add to Cart Request Body:**
```json
{
  "user_id": "uuid-here",
  "food_id": "uuid-here",
  "quantity": 2
}
```

---

### Orders

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/orders` | Place order from cart |
| GET | `/api/orders/:id` | Get order details |
| GET | `/api/orders/user/:user_id` | Get all orders for a user |
| PATCH | `/api/orders/:id/status` | Admin: Update order status |
| PATCH | `/api/orders/:id/cancel` | Customer: Cancel order |

**Place Order Request Body:**
```json
{
  "user_id": "uuid-here"
}
```

**Update Status Request Body:**
```json
{
  "status": "confirmed"
}
```

Valid statuses: `pending`, `confirmed`, `preparing`, `out_for_delivery`, `completed`, `cancelled`

---

## Data Model

### Entity Relationship

```
users ──< cart >── foods
users ──< orders ──< order_items >── foods
```

### Tables

**users**
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT (UUID) | Primary key |
| name | TEXT | Full name |
| email | TEXT | Unique email |
| phone | TEXT | Unique phone |
| referral_code | TEXT | Referrer's user ID |
| is_verified | INTEGER | 0 = unverified, 1 = verified |
| otp | TEXT | 6-digit verification code |
| otp_expires_at | TEXT | OTP expiry timestamp |
| role | TEXT | 'customer' or 'admin' |
| created_at | TEXT | Registration timestamp |

**foods**
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT (UUID) | Primary key |
| name | TEXT | Food name |
| description | TEXT | Optional description |
| price | REAL | Price in Naira |
| category | TEXT | e.g. rice, protein, drinks |
| is_available | INTEGER | 0 = unavailable, 1 = available |
| created_at | TEXT | Creation timestamp |

**cart**
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT (UUID) | Primary key |
| user_id | TEXT | Foreign key → users |
| food_id | TEXT | Foreign key → foods |
| quantity | INTEGER | Number of items |
| created_at | TEXT | Added timestamp |

**orders**
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT (UUID) | Primary key |
| user_id | TEXT | Foreign key → users |
| total_price | REAL | Total order amount |
| status | TEXT | Order status |
| created_at | TEXT | Order timestamp |

**order_items**
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT (UUID) | Primary key |
| order_id | TEXT | Foreign key → orders |
| food_id | TEXT | Foreign key → foods |
| quantity | INTEGER | Quantity ordered |
| price | REAL | Price at time of order |

---

## Assumptions

1. **OTP delivery** — In this implementation, the OTP is returned directly in the API response for testing purposes. In production, it would be sent via email (using Nodemailer or SendGrid) or SMS (using Termii or Twilio).

2. **Authentication** — No JWT authentication is implemented as per the deliverable instructions. In production, a token-based auth system would be added.

3. **Payment** — Payment logic is assumed only. The order is created immediately with status `pending` without actual payment processing.

4. **Admin role** — There is no admin login. Any request to admin endpoints (add food, update status) is treated as authorized. In production, role-based middleware would protect these routes.

5. **Referral code** — A user's referral code is their own user ID. This is a simple implementation; a production system might generate a shorter unique code.

6. **Price snapshot** — When an order is placed, the price is saved in `order_items` at the time of ordering. This means if the admin changes a food price later, existing orders are not affected.

---

## Scalability Thoughts

At 100 users the current setup works fine. Here's what would change at 10,000+ users:

| Concern | Current | At Scale |
|---------|---------|----------|
| Database | SQLite (file-based) | PostgreSQL or MySQL (handles concurrent writes) |
| OTP delivery | Returned in response | Queue-based (BullMQ + Redis) with email/SMS provider |
| Authentication | None | JWT tokens with refresh token rotation |
| API performance | No caching | Redis caching for food menu (rarely changes) |
| Server | Single process | Load balancer + multiple instances (PM2 cluster) |
| File storage | Local | Cloud storage (AWS S3) for food images |
| Monitoring | Console logs | Structured logging (Winston) + error tracking (Sentry) |

The MVC architecture used here makes this transition easier — swapping SQLite for PostgreSQL would mostly involve changing the model files without touching controllers or routes.

---

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** SQLite (via better-sqlite3)
- **ID Generation:** UUID v4
- **Dev Tool:** Nodemon

---

## Author

Built as part of the **Trueminds Innovations Backend Developer Internship**  