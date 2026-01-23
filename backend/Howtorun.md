## How to run (first time after cloning)

This repo has:
- **Mobile**: Expo / React Native (TypeScript)
- **Backend API**: ASP.NET Core (.NET 8)
- **Database**: SQL Server (EF Core migrations)

### 0) Prerequisites
- Node.js (LTS) + npm
- Expo Go app installed on your phone (for development)
- .NET 8 SDK
- SQL Server (LocalDB / Express / Developer)

> Note: The backend uses this connection string by default:
> `Server=.;Database=TourBooking;Trusted_Connection=True;TrustServerCertificate=True;MultipleActiveResultSets=True`
> (see `backend/TourBooking.Api/appsettings.json`).

### 1) Restore dependencies
From repo root:
1. `npm install`

From `backend/TourBooking.Api`:
1. `dotnet restore`

### 2) Database setup (EF Core)
Make sure SQL Server is running and you can connect using Windows Authentication.

From repo root, apply migrations:
1. (If you don't have EF tools installed)
   - `dotnet tool install --global dotnet-ef`
   - OR update: `dotnet tool update --global dotnet-ef`

2. Apply migrations to create/update the DB:
   - `dotnet ef database update --project backend/TourBooking.Api/TourBooking.Api.csproj --startup-project backend/TourBooking.Api/TourBooking.Api.csproj`

After this, a database named **TourBooking** should exist with an **Agreements** table.

### 3) Run the backend API (keep it running)
From `backend/TourBooking.Api`:
- `dotnet run --urls "http://0.0.0.0:5115"`

Test in browser:
- Swagger: `http://localhost:5115/swagger`

### 4) Run the mobile app (Expo)
From repo root:
- `npx expo start --lan -c`

Then:
1. Open Expo Go on your phone
2. Scan the QR code

Why these flags?
- `--lan`: makes the phone reach your dev machine over Wi‑Fi/LAN
- `-c`: clears Expo bundler cache (helps if you see weird old builds)

### Troubleshooting
- **Phone cannot reach API**:
  - Ensure phone + dev PC are on the same Wi‑Fi
  - Keep backend running on `0.0.0.0:5115`
  - Allow the backend through Windows Firewall (Private network)
  - If LAN is blocked, try: `npx expo start --tunnel -c` (slower but works on many networks)

- **SQL Server connection fails**:
  - Check SQL Server service is running
  - Confirm the connection string in `backend/TourBooking.Api/appsettings.json`
  - Ensure Windows Authentication / Trusted Connection works on your machine