# Retail Inventory Management System

A full-stack web application designed to simplify retail store operations, inventory tracking, product management, and user administration.

## Project Overview

The Retail Inventory Management System helps manage retail business operations through a web-based interface. It combines a React frontend, Node.js backend, and MySQL database to provide an integrated inventory management solution.

## Technologies Used

**Frontend**
- React.js
- Vite
- React Router
- Axios
- Recharts
- Lucide React

**Backend**
- Node.js
- Express.js
- MySQL
- JWT Authentication
- Multer
- Nodemailer

**Database**
- MySQL

## Key Features

- User registration and login
- Email OTP verification
- JWT-based authentication
- Product and inventory management
- Product image upload
- Inventory-related operations
- Dashboard and data visualization
- MySQL database integration

## Project Structure

```text
Retail-Inventory-Management-System/
│
├── backend/
│   ├── db.js
│   ├── index.js
│   ├── server.js
│   ├── package.json
│   └── uploads/
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.js
│
└── .gitignore
```

## Installation and Setup

### 1. Clone the repository

```bash
git clone https://github.com/souravdevsourav7-jpg/Retail-Inventory-Management-System.git
```

### 2. Backend Setup

```bash
cd Retail-Inventory-Management-System/backend
npm install
```

Create a `.env` file inside the backend folder:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=retail_inventory
JWT_SECRET=your_secret_key
EMAIL_USER=your_email@gmail.com
EMAIL_APP_PASSWORD=your_email_app_password
PORT=5000
```

Configure your MySQL database and create the required tables before running the application.

Start the backend:

```bash
node server.js
```

### 3. Frontend Setup

Open another terminal:

```bash
cd Retail-Inventory-Management-System/frontend
npm install
npm run dev
```

Open the local URL displayed by Vite in your browser.

## Environment Variables

For security reasons, credentials and secret keys must be stored in environment variables and must never be committed to GitHub.

## Future Improvements

- Cloud deployment
- Advanced inventory analytics
- Improved security and role management
- Automated stock alerts
- Enhanced reporting features

## Author

**Vijay Sharma**

Electrical and Computer Engineering

ABES Engineering College, Ghaziabad

## Repository

[GitHub Repository](https://github.com/souravdevsourav7-jpg/Retail-Inventory-Management-System)

