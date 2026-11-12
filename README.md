# Retail Inventory Management System

A full-stack retail inventory application built with React, Vite, Node.js, Express, and MySQL.

## Features

- Email OTP registration and login
- JWT-based user and admin access
- Product and category management
- Inventory and stock tracking
- Order placement and order management
- Admin dashboard and reports
- Product image uploads stored in MySQL for persistence on serverless hosting

## Technology

- Frontend: React, Vite, React Router, Axios, Recharts, Lucide React
- Backend: Node.js, Express 5, MySQL2, JWT, Nodemailer, Multer
- Database: MySQL 8+
- Deployment: Vercel Services and Aiven MySQL

## Repository layout

```text
.
├── backend/
│   ├── db.js
│   ├── server.js
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   ├── package.json
│   └── vite.config.js
├── vercel.json
└── README.md
```

## Deploy on Vercel

This repository is configured as a Vercel Services monorepo:

- Frontend service root: `frontend`
- Backend service root: `backend`
- API requests: `/api/*` are routed to the backend service
- All other requests are routed to the frontend service

Import the repository into Vercel and ensure the project uses the **Services** framework/preset. The Vercel Services feature must be enabled for the project.

### Required environment variables

Add these variables in the Vercel project settings for the Production environment (and Preview if needed):

| Variable | Purpose |
| --- | --- |
| `DB_HOST` | Aiven MySQL hostname |
| `DB_PORT` | Aiven MySQL port |
| `DB_USER` | MySQL username |
| `DB_PASSWORD` | MySQL password |
| `DB_NAME` | Database name, for example `defaultdb` |
| `DB_CA_CERT` | Full Aiven CA certificate |
| `JWT_SECRET` | Long, random signing secret |
| `EMAIL_USER` | Gmail address used to send OTP |
| `EMAIL_APP_PASSWORD` | Gmail App Password |

Do not put real credentials in GitHub. The `backend/.env.example` file contains placeholders only.

Email variables are required for email OTP registration. Database and JWT variables are required for normal API operation.

### Health check

After deployment, open:

`https://YOUR-VERCEL-DOMAIN/api/health`

A healthy deployment returns JSON with `status: "ok"`, `database: "connected"`, and the email configuration status. If the endpoint lists missing variables, add them in Vercel and redeploy.

## Local development

Use Node.js 22.12 or newer and MySQL 8 or newer.

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Fill in your local or cloud database and email settings.
npm start
```

The `npm start` script starts the exported Express app on port 5000 locally. Vercel imports the same app as a serverless service.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The Vite development server proxies `/api` and `/uploads` to `http://localhost:5000`, so run the backend and frontend in separate terminals.

## Deployment notes

- Product images uploaded through the application are stored as data URLs in the MySQL `products.image` column. The backend automatically upgrades that column to `MEDIUMTEXT` during initialization.
- Image uploads are limited to 2 MB and common image formats (JPG, PNG, WEBP, GIF).
- The MySQL pool is limited to five connections per backend instance. Keep the total number of concurrent Vercel instances within your Aiven connection limits.
- The first backend request may take longer while database tables and compatibility columns are checked/created.
- Keep regular database backups, especially before changing schema or deploying migrations.

## Security notes

- New passwords are stored using Node.js scrypt hashes. Existing plain-text passwords are upgraded to hashes after the next successful login.
- Keep `JWT_SECRET`, database credentials, the Aiven CA certificate, and Gmail App Password private.
- Use a unique, strong admin password and grant admin role only to trusted accounts.
