# E-commerce Backend API

REST API for an e-commerce platform, built with Node.js, Express, TypeScript, Prisma and PostgreSQL.

## Features

- Sign up with OTP email verification (emails sent through Brevo)
- Login with a JWT stored in an httpOnly cookie
- Role-based access control (USER and ADMIN)
- Product catalogue with categories, search and image uploads (Cloudinary)
- Shopping cart with stock checks
- Order management: checkout, order history, cancellation and admin status updates
- Request validation with Joi
- Interactive API documentation with Swagger

## Tech stack

| Area | Tool |
|---|---|
| Runtime | Node.js, Express 5 |
| Language | TypeScript |
| Database | PostgreSQL (Supabase) with Prisma ORM |
| Auth | JWT, bcryptjs, cookie-parser |
| Validation | Joi |
| Email | Brevo |
| Uploads | Multer, Cloudinary |
| Docs | swagger-jsdoc, swagger-ui-express |
| Tooling | ESLint, tsx |

## Project structure

```
src/
├── controllers/   # Request handlers (auth, cart, category, order, product)
├── routes/        # Route definitions
├── middleware/    # Authentication, uploads, validation
├── services/      # Email and cart logic
├── utils/         # OTP generation and email template
├── validators/    # Joi schemas
├── docs/          # Swagger documentation (YAML)
├── app.ts         # Express app setup
├── server.ts      # Server entry point
├── prisma.ts      # Prisma client
├── brevo.ts       # Brevo email client
├── cloudinary.ts  # Cloudinary configuration
└── swagger.ts     # Swagger setup
prisma/            # Schema and migrations
```

## Getting started

### Requirements

- Node.js 18 or newer
- A PostgreSQL database (for example a free Supabase project)
- A Brevo account with a verified sender email
- A Cloudinary account

### Setup

1. Clone the repository and install the packages:

   ```bash
   git clone https://github.com/prince0538/ecommerce-backend.git
   cd ecommerce-backend
   npm install
   ```

2. Copy `.env.example` to `.env` and fill in your values (see below).

3. Create the database tables:

   ```bash
   npx prisma migrate dev
   ```

4. Start the server:

   ```bash
   npm run dev
   ```

The API runs on the port set in `.env`. Check it at `GET /health`.

### Environment variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Long random string used to sign tokens |
| `PORT` | Port the server listens on |
| `NODE_ENV` | `development` or `production` |
| `CLIENT_URL` | Address of the frontend, used for CORS and cookies |
| `BREVO_API_KEY` | Brevo API key |
| `BREVO_SENDER_EMAIL` | Sender address verified in Brevo |
| `BREVO_SENDER_NAME` | Sender name shown in emails |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the server with auto-reload |
| `npm run lint` | Check the code with ESLint |
| `npm run lint:fix` | Fix lint problems automatically |

## API documentation

Swagger is available at `/api-docs` while the server is running.

## Authentication

Login sets an httpOnly cookie named `token`. Protected routes also accept an `Authorization: Bearer <token>` header, which is useful for testing in Postman.

The frontend must send credentials with every request (`credentials: 'include'` with fetch, or `withCredentials: true` with axios) and must run at the address set in `CLIENT_URL`.

New users must verify their email with a 6-digit code before they can log in. Codes expire after 10 minutes, and five wrong attempts lock the code.

### Creating an admin

Everyone who signs up is a USER. To make an admin, sign up and verify, then change that user's `role` to `ADMIN` in the database, and log in again to get a new token.

## Endpoints

All routes start with `/api/v1`.

### Auth

| Method | Path | Access |
|---|---|---|
| POST | `/auth/signup` | Public |
| POST | `/auth/verify-otp` | Public |
| POST | `/auth/resend-otp` | Public |
| POST | `/auth/login` | Public |
| POST | `/auth/logout` | Public |
| GET | `/auth/me` | Logged in |

### Users

| Method | Path | Access |
|---|---|---|
| GET | `/users` | Admin |
| GET | `/users/profile` | Logged in |
| PUT | `/users/profile` | Logged in |
| DELETE | `/users/profile` | Logged in |

### Categories

| Method | Path | Access |
|---|---|---|
| GET | `/categories` | Public |
| GET | `/categories/:id` | Public |
| POST | `/categories` | Admin |
| PUT | `/categories/:id` | Admin |
| DELETE | `/categories/:id` | Admin |

### Products

| Method | Path | Access |
|---|---|---|
| GET | `/products` (`?search=`, `?categoryId=`) | Public |
| GET | `/products/:id` | Public |
| POST | `/products` | Admin |
| PUT | `/products/:id` | Admin |
| DELETE | `/products/:id` | Admin |

### Cart

| Method | Path | Access |
|---|---|---|
| GET | `/cart` | Logged in |
| POST | `/cart/items` | Logged in |
| PUT | `/cart/items/:productId` | Logged in |
| DELETE | `/cart/items/:productId` | Logged in |
| DELETE | `/cart` | Logged in |

### Orders

| Method | Path | Access |
|---|---|---|
| POST | `/orders` (checkout from the cart) | Logged in |
| GET | `/orders` | Logged in |
| GET | `/orders/:id` | Owner or admin |
| POST | `/orders/:id/cancel` | Owner or admin |
| GET | `/orders/admin/all` | Admin |
| PUT | `/orders/:id/status` | Admin |

## Notes

- Prices are whole numbers in kobo (`250000` is ₦2,500).
- Order statuses: `PENDING`, `PAID`, `SHIPPED`, `DELIVERED`, `CANCELLED`.
- Checkout reduces stock, and cancelling a pending order puts it back.
- There is no payment gateway yet. Orders start as `PENDING`, and an admin marks them `PAID`.

## Troubleshooting

- **`P1001: Can't reach database server`**: your network may block port 5432. Try another network or a phone hotspot, and use the Session pooler connection string from Supabase.
- **Cookie not saved**: the frontend must run at `CLIENT_URL` and send credentials with each request.
- **No email arrives**: check that the sender is verified in Brevo, and look in the spam folder.