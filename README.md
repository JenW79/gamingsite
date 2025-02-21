Live Link https://jens-auth-me.onrender.com/

# 🏡 Auth-Me: Home Rentals Clone

Welcome to the **Auth-Me Home Rentals Clone**, an home rental-style full-stack project!

## 📖 **Documentation**
This project is fully documented in the **[GitHub Wiki](https://github.com/JenW79/projectmod4/wiki)**.

For detailed instructions, visit:
- **[MVP Features](https://github.com/JenW79/projectmod4/wiki/MVP-Features)**
- **[Redux State](https://github.com/JenW79/projectmod4/wiki/Redux-State-Shape)**
- **[API Documentation](https://github.com/JenW79/projectmod4/wiki/API-Documentation)**

## 🚀 **Quick Start**

1. Clone the repository:
   ```sh
   git clone https://github.com/JenW79/projectmod4.git
   cd projectmod4
   
   ```

2. Install dependencies:

```sh
npm install
```

3. Start the backend:
```sh
cd backend
npm install
npm start
```
4. Create a .env file and add your database configuration:
```sh
DATABASE_URL=your_database_connection_string
JWT_SECRET=your_secret_key
```
5. Set up the database (PostgreSQL required):
```sh
npx dotenv sequelize db:create
npx dotenv sequelize db:migrate
npx dotenv sequelize db:seed:all
npm start
```
6. Set up the frontend
Open a new terminal window and navigate to the frontend directory:
```sh
cd ../frontend
```
Install dependencies:
```sh
npm install
```
Start the frontend server:
```sh
npm run dev
```
7. Open the application
Once both the frontend and backend are running:
```sh
Frontend → Open http://localhost:5173
Backend → Running at http://localhost:8000
```

## 🔥**Troubleshooting**

Missing dependencies? Run npm install again in both backend/ and frontend/.

Database errors? Ensure PostgreSQL is running and .env is correctly
configured.

Port issues? Check if something is already running on port 8000 (backend) or 5173 (frontend).
