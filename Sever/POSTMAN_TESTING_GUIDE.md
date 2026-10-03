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

### 1. Register & Login (`Auth`)
- **Register**: `POST http://localhost:5000/api/auth/register`
- **Login**: `POST http://localhost:5000/api/auth/login`
- *(Better Auth cookies / session tokens will automatically handle authentication if session cookies are enabled in Postman).*

### 2. User Profile (`Users`)
- **Get Profile**: `GET http://localhost:5000/api/users/me`
- **Update Profile**: `PATCH http://localhost:5000/api/users/me`

### 3. Farm & Field CRUD (`Farms` & `Fields`)
1. **Create Farm**: `POST http://localhost:5000/api/farms` -> Copy the returned `id` (e.g., `farm_123`).
2. **Create Field**: `POST http://localhost:5000/api/farms/farm_123/fields` -> Copy the returned `id` (e.g., `field_456`).
3. **Get Fields**: `GET http://localhost:5000/api/farms/farm_123/fields`

### 4. Crop Cycles (`Crops & Crop Cycles`)
1. **Get Crops List**: `GET http://localhost:5000/api/crops` -> Choose a `cropId`.
2. **Create Crop Cycle**: `POST http://localhost:5000/api/crop-cycles` using `fieldId` and `cropId`.
3. **Get Crop Cycles**: `GET http://localhost:5000/api/crop-cycles`

### 5. Harvests & Expenses (`Harvests & Expenses`)
1. **Record Harvest**: `POST http://localhost:5000/api/harvests` using `cropCycleId`.
2. **Record Expense**: `POST http://localhost:5000/api/expenses` using `cropCycleId`.

### 6. Weather & Market (`Weather & Market Prices`)
- **Current Weather**: `GET http://localhost:5000/api/weather/current?location=Dhaka`
- **Forecast**: `GET http://localhost:5000/api/weather/forecast?location=Dhaka&days=7`
- **Market Prices**: `GET http://localhost:5000/api/market-prices`

### 7. Dashboard (`Dashboard`)
- **Summary**: `GET http://localhost:5000/api/dashboard/summary`
- **Crop Distribution**: `GET http://localhost:5000/api/dashboard/crop-distribution`
- **Financial Summary**: `GET http://localhost:5000/api/dashboard/financial-summary`
