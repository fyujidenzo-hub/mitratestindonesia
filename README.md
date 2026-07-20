# Shopee Work Indonesia

![Shopee Work campaign](client/public/assets/campaign-desktop-en.png)

A polished, responsive task-and-order workflow portal for customer teams and administrators. Built with React, TypeScript, Tailwind CSS, Express, Prisma, and Neon PostgreSQL.

The balance is an internal workflow ledger only. It is not a payment gateway, e-wallet, or real-money custody system.

## Product highlights

- Responsive customer experience with dedicated desktop and mobile navigation.
- Invitation-based onboarding with staff ownership and registration bonuses.
- End-to-end task lifecycle from acceptance and assignment through delivery.
- Commission, top-up, withdrawal, reward, and audit workflows.
- Super Admin controls plus scoped staff access for assigned customers.
- Secure HttpOnly-cookie sessions, password hashing, validation, and rate limiting.

## Architecture

```text
React + Tailwind UI
        │
Express API and authentication
        │
Prisma ORM
        │
Neon PostgreSQL
```

| Layer | Technology |
| --- | --- |
| Customer and admin UI | React, TypeScript, Vite, Tailwind CSS |
| API | Node.js, Express, Zod |
| Data | Prisma ORM, Neon PostgreSQL |
| Security | bcrypt, JWT, HttpOnly cookies, Helmet, rate limiting |
| Deployment | Render Blueprint |

## Included workflow

- Customer registration through staff invitation codes and automatic registration bonuses.
- Secure customer and administrator sessions using hashed passwords and HttpOnly cookies.
- One active task per customer, product assignment by the responsible admin, product-change approval, shipment steps, delivery confirmation, and one-time commission crediting.
- Top-up requests with image proof; only Super Admin approval credits the simulated balance.
- Withdrawals require a PIN, a minimum of Rp100,000, sufficient balance, no active task, and no account lock. The amount is reserved immediately and refunded if Super Admin rejects it.
- Super Admin rewards, withdrawal locks, full reporting, product catalog, bank list, and staff visibility.
- Scoped administrators can see and manage only customers registered through their own invitation code.

## Neon PostgreSQL setup

XAMPP and MySQL are no longer used by this project.

1. In Neon, create a project named `shopee-work`. Choose the region closest to the Render service (Singapore is a good choice for users in the Philippines when it is available on both platforms).
2. Open **Connect** in Neon. Copy both connection strings:
   - Enable **Connection pooling** and copy that URL as `DATABASE_URL`.
   - Disable **Connection pooling** and copy the direct URL as `DIRECT_URL`.
3. Copy `server/.env.example` to `server/.env`, replace both placeholder URLs, and set a long random `JWT_SECRET`.
4. Install dependencies, apply the committed PostgreSQL migration, seed the initial accounts, and start the app:

   ```bash
   npm install
   npm run db:generate
   npm run db:deploy
   npm run db:seed
   npm run dev
   ```

5. Open `http://127.0.0.1:4173`. The API health check is at `http://127.0.0.1:3001/api/health`.

The development frontend is configured on port `4173` and proxies `/api` to Express on port `3001`.

## Seeded local accounts

| Area | Username | Password | Extra |
| --- | --- | --- | --- |
| Super Admin | `superadmin` | `Admin123!` | Invitation `900001` |
| Admin | `admin.shopee` | `Admin123!` | Invitation `991888` |
| Customer | `demo.customer` | `Customer123!` | Withdrawal PIN `123456` |

Change all seeded passwords, invitation codes, and the JWT secret before publishing.

## Production build

```bash
npm run typecheck
npm run db:deploy
npm run build
npm run start -w server
```

The Express process serves both the compiled React application and `/api` in production.

## Render deployment with Neon

The included `render.yaml` defines one Node web service that builds the React client, serves it through Express, applies Prisma migrations before each deploy, and runs the seed only after the first successful deployment.

1. Push this repository to GitHub.
2. In Render, create a new **Blueprint** from the repository.
3. When Render asks for environment variables, provide:
   - `DATABASE_URL`: the pooled Neon connection URL.
   - `DIRECT_URL`: the direct Neon connection URL.
   - `CLIENT_ORIGIN`: the final `https://...onrender.com` service URL. If the URL is not known during the first form, add it in the service Environment page and redeploy.
4. Render generates `JWT_SECRET` automatically and runs the initial migration and seed.
5. After the first login, replace the seeded administrator passwords and review the bank and support settings.

Render's free web-service filesystem is temporary. Database records remain in Neon, but uploaded payment-proof files in `server/uploads` do not survive redeploys. Use object storage such as Cloudinary or Supabase Storage before treating proof uploads as production data.

Do not rerun the development seed after replacing the seeded accounts with real production accounts. Keep regular Neon exports or backups appropriate to the selected plan.
