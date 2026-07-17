# ShopX — MERN Stack E-Commerce Platform

ShopX is a full-featured multi-vendor e-commerce app — buyer storefront, seller
dashboard, and admin console — rebuilt on the **MERN stack**:

- **M**ongoDB + Mongoose (was PostgreSQL + Drizzle)
- **E**xpress 5
- **R**eact 19 + Vite + TypeScript
- **N**ode.js

Payments run through **Razorpay** (Card / UPI / Netbanking + Cash on Delivery),
and sign-in supports both **email/password** and **Google Sign-In**.

## Folder structure

```
shopx/
├── server/                     # Express + MongoDB API
│   ├── src/
│   │   ├── config/             # env loader, DB connection, Razorpay client
│   │   ├── models/              # Mongoose schemas (User, Product, Order, ...)
│   │   ├── middlewares/        # JWT auth, error handler
│   │   ├── routes/             # REST endpoints, one file per resource
│   │   ├── utils/              # logger, slugify, asyncHandler
│   │   ├── app.ts              # Express app (middleware + route wiring)
│   │   ├── index.ts            # server entry point
│   │   └── seed.ts             # sample data seeder
│   ├── .env.example
│   └── package.json
├── client/                     # React SPA (Vite)
│   ├── src/
│   │   ├── api/                # typed API client + React Query hooks
│   │   ├── components/         # ProductCard, Navbar, layouts, shadcn/ui primitives
│   │   ├── context/             # AuthContext (session + login/logout)
│   │   ├── pages/               # storefront, auth, seller/*, admin/*
│   │   ├── hooks/, lib/
│   │   ├── App.tsx, main.tsx
│   ├── .env.example
│   └── package.json
├── package.json                 # root convenience scripts
└── README.md
```

This mirrors the original app's shape (`routes/`, `middlewares/`, `pages/`,
`components/`) so anything you already know about the codebase still applies —
`lib/db/schema` simply became `server/src/models`, and the generated
`api-client-react` package became the plain, readable `client/src/api` module.

## Prerequisites

- Node.js 20+
- A MongoDB instance — local (`mongodb://127.0.0.1:27017`) or [Atlas](https://www.mongodb.com/atlas)
- (Optional) A [Razorpay](https://dashboard.razorpay.com/) test account for online payments
- (Optional) A [Google Cloud OAuth Client ID](https://console.cloud.google.com/apis/credentials) for Google Sign-In

The app runs fine without Razorpay/Google configured — Cash on Delivery and
email/password auth work out of the box; the online-payment option and the
Google button simply stay hidden/disabled until you add keys.

## Setup

```bash
# 1. Install dependencies for both apps
npm run install:all

# 2. Configure environment variables
cp server/.env.example server/.env
cp client/.env.example client/.env
# then edit server/.env and client/.env with your own values (see below)

# 3. Seed sample data (categories, brands, demo admin/seller, products, a coupon)
npm run seed

# 4. Run both apps together
npm run dev
```

- API: http://localhost:5000 (health check at `/api/healthz`)
- Client: http://localhost:5173 (proxies `/api/*` to the server in dev)

Run them separately with `npm run dev:server` / `npm run dev:client` if you prefer.

### Demo accounts (after `npm run seed`)

| Role   | Email               | Password    |
|--------|----------------------|-------------|
| Admin  | admin@shopx.test     | Admin@123   |
| Seller | seller@shopx.test    | Seller@123  |

A `WELCOME10` coupon (10% off, ₹500 min order, ₹500 cap) is also seeded.

## Environment variables

### `server/.env`

| Variable | Required | Notes |
|---|---|---|
| `PORT` | no | defaults to `5000` |
| `MONGODB_URI` | yes | local or Atlas connection string |
| `CLIENT_URL` | yes | frontend origin(s) for CORS, comma-separated |
| `JWT_SECRET` / `JWT_REFRESH_SECRET` | yes | any long random strings |
| `GOOGLE_CLIENT_ID` | for Google Sign-In | from Google Cloud Console |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | for online payments | from the Razorpay dashboard (test mode keys work) |
| `RAZORPAY_WEBHOOK_SECRET` | optional | only if you wire up the webhook endpoint |

### `client/.env`

| Variable | Required | Notes |
|---|---|---|
| `VITE_GOOGLE_CLIENT_ID` | for Google Sign-In | same Client ID as the server |
| `VITE_API_URL` | no | only set if the API isn't reachable at relative `/api` |
| `VITE_API_PROXY_TARGET` | no | dev-only, changes what `/api` proxies to (default `http://localhost:5000`) |

## Setting up Razorpay

1. Sign up at https://dashboard.razorpay.com and switch to **Test Mode**.
2. Go to **Settings → API Keys** and generate a test key pair.
3. Put `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` in `server/.env`.
4. Use [Razorpay's test cards/UPI](https://razorpay.com/docs/payments/payments/test-card-upi-details/) to pay in the checkout modal.
5. (Optional) For the webhook fallback, add `https://<your-domain>/api/payments/razorpay/webhook`
   under **Settings → Webhooks**, subscribe to `payment.captured`, and copy the
   signing secret into `RAZORPAY_WEBHOOK_SECRET`.

The checkout flow: placing an order with "Card / UPI / Netbanking" creates a
pending order plus a Razorpay order, opens the Razorpay Checkout modal, and
verifies the payment signature server-side before marking the order paid. If
the modal is closed before paying, the order stays pending and a **Pay Now**
button appears on that order's detail page to retry.

## Setting up Google Sign-In

1. In the [Google Cloud Console](https://console.cloud.google.com/apis/credentials), create an **OAuth 2.0 Client ID** of type **Web application**.
2. Add your frontend origin (e.g. `http://localhost:5173`) under **Authorized JavaScript origins**.
3. Put the Client ID in both `server/.env` (`GOOGLE_CLIENT_ID`) and `client/.env` (`VITE_GOOGLE_CLIENT_ID`).

The frontend uses Google Identity Services to get an ID token; the backend verifies it
with `google-auth-library` and issues the same JWT session used by email/password login. If an email
that's signed up via password later signs in with Google (or vice versa), the accounts are linked automatically.
New Google sign-ups are created as buyers — invite them to your seller program from the admin console if needed.

## What changed from the original stack

- **Database**: PostgreSQL + Drizzle ORM → MongoDB + Mongoose. All 11 tables became
  schemas in `server/src/models`; numeric serial IDs became MongoDB ObjectId strings
  end-to-end (frontend, API contracts, and route params all updated to match).
- **API client**: the generated OpenAPI/Orval package (`@workspace/api-client-react`)
  was replaced with a small hand-written client in `client/src/api` — same hook names
  (`useListProducts`, `useAddToCart`, etc.) and calling conventions, so the page
  components needed only minimal changes, but it's now plain readable TypeScript
  with no code-gen step.
- **Payments**: added end-to-end Razorpay integration (order creation, checkout modal,
  signature verification, retry-payment flow, optional webhook).
- **Auth**: added Google Sign-In alongside the existing email/password + OTP flow.
- **Monorepo → two apps**: the pnpm workspace/Turborepo layout collapsed into a plain
  `server/` + `client/` pair, each with its own standard `package.json` — no workspace
  tooling required.
- A few pre-existing bugs were fixed along the way (filter dropdowns that built
  the wrong query params, and the admin user-role filter that was actually
  filtering by account status).

## Production build

```bash
npm run build
```

This compiles the server to `server/dist` (run with `node server/dist/index.js`)
and builds the client to `client/dist` (serve with any static host, or point
your own Express/Nginx at it). Set `CLIENT_URL` and `VITE_API_URL` appropriately
for your deployed domains.
