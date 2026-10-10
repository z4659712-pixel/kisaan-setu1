# Kisaan Setu — Full-stack starter (Next.js + Supabase)

For SIH26132: **Strengthening Market Linkages and Price Discovery for Farmers**.

This starter keeps the responsive Next.js dashboard and adds:
- Supabase Auth signup/sign-in page (`/login`)
- PostgreSQL schema with profiles, market prices, produce listings and buyer offers
- API route to query stored market prices
- Buyer-offer API that requires an authenticated, admin-verified buyer
- Weather API proxy (Open-Meteo by default, or OpenWeather if configured)
- Forecast API proxy for a separately deployed Python/XGBoost service
- `.env.example` and setup instructions

## Important limits

This is a development starter, not a production-audited marketplace. The current dashboard still contains demo market rows. The API and schema are included but are not wired into every dashboard component yet. No live mandi feed, buyer-verification admin screen, listing creation UI, payment flow, or deployed ML service is included. Never use sample prices for real trading decisions.

## Requirements

- Node.js 20.9+
- Git
- Supabase project
- GitHub and Vercel accounts

## 1. Install and test locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

On Windows PowerShell, use `Copy-Item .env.example .env.local` instead of `cp`.

Open http://localhost:3000. `/login` needs valid Supabase settings.

## 2. Configure Supabase

1. Create a project at https://supabase.com/dashboard.
2. Open Project Settings / API (or API Keys).
3. Copy the project URL and publishable/anon key into `.env.local`.
4. Copy the service-role/secret key into `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`. **Server only; never add `NEXT_PUBLIC_` to it.**
5. In SQL Editor, run `supabase/schema.sql`.
6. In Authentication settings, configure allowed redirect URLs and email confirmation for your local and production domains.

Do not commit `.env.local`. The `.gitignore` excludes it.

## 3. API endpoints

### Market prices

```http
GET /api/market-prices?crop=Potato&district=Jalpaiguri
```

Returns stored rows. An empty `data` array means import data before expecting results.

### Weather

```http
GET /api/weather?latitude=26.52&longitude=88.72
```

Returns current/daily weather from the configured provider. Verify provider terms and limits before production use.

### Forecast

```http
POST /api/forecast
Content-Type: application/json

{
  "crop": "Potato",
  "district": "Jalpaiguri",
  "horizon_days": 7
}
```

Set `ML_API_URL` to a separately deployed Python service implementing `POST /predict/price`. Until configured, the route returns HTTP 503 instead of inventing a forecast.

Expected ML service request shape: `{"crop":"Potato","district":"Jalpaiguri","horizon_days":7}`. Define and document the response schema in the Python service before connecting the UI.

### Buyer offers

Requires an access token from Supabase Auth:

```http
Authorization: Bearer SUPABASE_ACCESS_TOKEN
Content-Type: application/json

POST /api/buyer-offers
{
  "produce_listing_id": "a-valid-listing-uuid",
  "offered_price_per_quintal": 1800,
  "quantity_quintals": 5,
  "message": "Please confirm pickup date."
}
```

Buyer accounts must be approved by an administrator before they can submit offers. The starter deliberately does not provide a public endpoint that can verify a buyer.

## 4. GitHub

Create an empty repository named `kisaan-setu`, extract the ZIP, and open a terminal in the project folder:

```bash
git init
git add .
git commit -m "Add Kisaan Setu full-stack starter"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/kisaan-setu.git
git push -u origin main
```

If you already have the existing GitHub repository, set the correct remote instead of creating a second repository. If Git reports an existing repository, do not re-run `git init`.

## 5. Vercel

1. Import the GitHub repository at https://vercel.com/new.
2. Select Next.js and keep the default build command.
3. Add environment variables from `.env.example` in Project Settings → Environment Variables.
4. Add the Supabase URL and public key, plus server-only `SUPABASE_SERVICE_ROLE_KEY`.
5. Add `ML_API_URL` only after your Python service is deployed.
6. Redeploy after environment variables are saved.

Use separate Supabase projects for development and production where possible. Configure Supabase Auth redirect URLs with your Vercel production domain. Never put secrets in client code or commit them.

## 6. Suggested next implementation order

1. Connect dashboard market table to `/api/market-prices`.
2. Build produce-listing create/edit pages.
3. Build the admin-only buyer verification workflow with strict server-side authorization.
4. Deploy Python FastAPI + XGBoost price prediction and demand forecasting.
5. Add weather-aware recommendations with clear forecast timestamps and source.
6. Add logistics estimates and payment integration only after security and transaction flows are reviewed.
