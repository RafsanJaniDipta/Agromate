# Agromate Backend - Postman API Testing Guide

We have created a ready-to-import Postman Collection file for you: `Sever/agromate_postman_collection.json`.

---

## 🚀 How to Import into Postman

1. Open **Postman**.
2. Click the **Import** button (top-left corner).
3. Select the file: `Sever/agromate_postman_collection.json`.
4. The **Agromate API v1 Collection** will appear in your Postman sidebar with all organized folders and requests.

---

## 📝 Testing Workflow (Order of Operations)

### Before testing

1. Start PostgreSQL and configure `Sever/.env` from `.env.example`, including
   `DATABASE_URL` and a `BETTER_AUTH_SECRET` of at least 32 characters.
2. From the `Sever` directory, generate the Prisma client and start the API:
   ```bash
   bun run db:generate
   bun run dev
   ```
   Apply development migrations first with `bun run db:migrate` if the database
   has not been set up yet.
3. Confirm the server is listening on port `5000`.

### 1. Register, log in, and log out (`Auth`)

The API uses Better Auth email/password endpoints. Email verification is disabled for now. Better Auth stores the session in an HTTP-only cookie; Postman should keep and resend that cookie automatically for requests to the same host.

1. **Register**: `POST http://localhost:5000/api/auth/sign-up/email`
   ```json
   {
     "name": "Rahim Farmer",
     "email": "rahim@example.com",
     "password": "password123"
   }
   ```
   Use a new email address for each new account.
2. **Log in with Email**: `POST http://localhost:5000/api/auth/sign-in/email`
   ```json
   {
     "email": "farmer@agromate.dev",
     "password": "Farmer@12345",
     "rememberMe": true
   }
   ```
3. **Log in with Phone Number (No OTP)**: `POST http://localhost:5000/api/auth/sign-in/phone-number`
   ```json
   {
     "phoneNumber": "+8801700112233",
     "password": "Farmer@12345",
     "rememberMe": true
   }
   ```
4. **Check the session**: `GET http://localhost:5000/api/auth/get-session`. The response should contain the signed-in user and session.
5. **Try an authenticated endpoint**: `GET http://localhost:5000/api/users/me`. It should return the current user's profile.
6. **Log out**: `POST http://localhost:5000/api/auth/sign-out`.
7. **Check again**: repeat the session request. It should no longer return an active session.

If Postman does not resend the cookie, open its **Cookies** manager for `localhost:5000` and check that the Better Auth cookie exists and is enabled. Do not use a bearer token; this project authenticates requests with cookies.

For permission checks, an unauthenticated request to a protected endpoint should return `401`. A signed-in farmer calling an admin-only endpoint should return `403`. Expert answers require an expert profile with `VERIFIED` status; pending experts should receive `403`.

### 2. User Profile (`Users`)
- **Get Profile**: `GET http://localhost:5000/api/users/me`
- **Update Profile**: `PATCH http://localhost:5000/api/users/me`

### 3. Farm & Field CRUD (`Farms` & `Fields`)
1. **Create Farm**: `POST http://localhost:5000/api/farms` -> Copy the returned `id` (e.g., `farm_123`).
2. **Create Field**: `POST http://localhost:5000/api/farms/farm_123/fields` -> Copy the returned `id` (e.g., `field_456`).
3. **Get Fields**: `GET http://localhost:5000/api/farms/farm_123/fields`

### 4. Crop Cycles (`Crops & Crop Cycles`)
1. **Get Crops List**: `GET http://localhost:5000/api/crops` -> Choose a `cropId`.
2. **Crop Plan Preview (template, before starting)**: `GET http://localhost:5000/api/crops/{cropId}/plan?plantingDate=2026-10-01`
3. **Create Crop Cycle**: `POST http://localhost:5000/api/crop-cycles` using `fieldId` and `cropId`. The growth plan (milestones + tasks) is auto-generated; `expectedHarvestDate` is derived from the crop's plan (3-4 months). Pass your own `expectedHarvestDate` for a custom timeframe — all task dates scale proportionally.
4. **Get Crop Cycles**: `GET http://localhost:5000/api/crop-cycles`
5. **Get Growth Plan (auto-generated)**: `GET http://localhost:5000/api/crop-cycles/{cycleId}/plan` — milestones with windows, task checklist, and progress %.
6. **Re-generate Plan**: `POST http://localhost:5000/api/crop-cycles/{cycleId}/plan` — wipes and rebuilds tasks for that cycle.
7. **Mark Task Done / Reopen**: `PATCH http://localhost:5000/api/crop-cycles/{cycleId}/tasks/{taskId}` with `{ "isDone": true }`.

> Plan data is stored in the **database** (`crop_milestone_template` +
> `crop_task_template`, seeded from `Sever/src/data/crop-plans.json` via
> `bunx tsx prisma/seed.ts`). Rice, wheat, potato, tomato, maize, mustard &
> jute ship with plans (EN + BN, 5-6 milestones each). Crops without a plan
> (e.g. any newly added crop) still create cycles, just with an empty plan.

### 5. Harvests & Expenses (`Harvests & Expenses`)
1. **Record Harvest**: `POST http://localhost:5000/api/harvests` using `cropCycleId`.
2. **Record Expense**: `POST http://localhost:5000/api/expenses` using `cropCycleId`.

### 6. Weather & Market (`Weather & Market Prices`)
- **Current Weather**: `GET http://localhost:5000/api/weather/current?location=Dhaka` (or `?lat=23.81&lon=90.41`)
- **Forecast**: `GET http://localhost:5000/api/weather/forecast?location=Dhaka&days=7`
- **Past Weather (30 days)**: `GET http://localhost:5000/api/weather/history?location=Dhaka&days=30`
- **Market Prices**: `GET http://localhost:5000/api/market-prices`

> Weather note: responses carry `source: "live"` (real WeatherAPI data) or
> `source: "sample"` (test data when no valid `WEATHER_API_KEY` is configured,
> per the assignment's fallback-for-testing rule). The current key in `.env` is
> rejected by the provider (error 2006), so these return sample data until a
> valid key is set.

### 7. Dashboard (`Dashboard`)
- **Summary**: `GET http://localhost:5000/api/dashboard/summary`
- **Crop Distribution**: `GET http://localhost:5000/api/dashboard/crop-distribution`
- **Financial Summary**: `GET http://localhost:5000/api/dashboard/financial-summary`
