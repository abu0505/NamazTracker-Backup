# Running NamazTracker Locally

This guide will help you run the NamazTracker application on your local computer.

## Prerequisites

Before you begin, make sure you have the following installed on your computer:

1. **Node.js** (version 20 or higher)
   - Download from: https://nodejs.org/
   - Verify installation: `node --version`

2. **PostgreSQL** (version 14 or higher)
   - Download from: https://www.postgresql.org/download/
   - Verify installation: `psql --version`

3. **Git** (to clone the repository)
   - Download from: https://git-scm.com/
   - Verify installation: `git --version`

## Step 1: Get the Project Files

If you're working from Replit, download your project:
1. In Replit, go to the three-dot menu
2. Select "Download as ZIP"
3. Extract the ZIP file to your desired location

Or clone from your repository:
```bash
git clone <your-repository-url>
cd <project-folder>
```

## Step 2: Install Dependencies

Open a terminal in the project folder and run:

```bash
npm install
```

This will install all required packages including Express, React, Vite, and other dependencies.

## Step 3: Set Up the Database

### Create a PostgreSQL Database

1. Open PostgreSQL command line or pgAdmin
2. Create a new database:

```sql
CREATE DATABASE namaz_tracker;
```

3. Create a database user (optional but recommended):

```sql
CREATE USER namaz_user WITH PASSWORD 'your_password_here';
GRANT ALL PRIVILEGES ON DATABASE namaz_tracker TO namaz_user;
```

### Configure Database Connection

1. Create a `.env` file in the root of your project (or edit the existing one):

```env
# Database Configuration
DATABASE_URL=postgresql://namaz_user:your_password_here@localhost:5432/namaz_tracker

# Development Settings
NODE_ENV=development

# Port Configuration
PORT=5000

# JWT Secret for Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

Replace `your_password_here` with your actual database password.

### Push Database Schema

Run this command to create all the necessary tables:

```bash
npm run db:push
```

### Create Demo User

Run these SQL commands to create a demo user for testing:

```sql
-- Connect to your database first
\c namaz_tracker

-- Create demo user
INSERT INTO users (id, username, email, password_hash, first_name, last_name, is_active, created_at, updated_at)
VALUES ('demo-user', 'demo', 'demo@example.com', '', 'Demo', 'User', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Create user stats
INSERT INTO user_stats (user_id, total_prayers, on_time_prayers, qaza_prayers, current_streak, best_streak, perfect_weeks, last_streak_update, updated_at)
VALUES ('demo-user', 0, 0, 0, 0, 0, 0, NULL, NOW())
ON CONFLICT (user_id) DO NOTHING;
```

## Step 4: Run the Application

### Development Mode (with hot reload)

```bash
npm run dev
```

This will start:
- Express backend server on port 5000
- Vite development server with hot module replacement
- The application will be available at: http://localhost:5000

### Production Mode

First, build the application:

```bash
npm run build
```

Then start the production server:

```bash
npm run start
```

The application will be available at: http://localhost:5000

## Step 5: Access the Application

Open your web browser and navigate to:

```
http://localhost:5000
```

You should see the Namaz Tracker dashboard with:
- Today's prayer times
- Prayer tracking checkboxes
- Navigation to Qaza, Achievements, and Analytics pages

## Troubleshooting

### Port Already in Use

If port 5000 is already in use, you can change it in the `.env` file:

```env
PORT=3000
```

### Database Connection Issues

1. Make sure PostgreSQL is running:
   - **Windows**: Check Services for PostgreSQL
   - **Mac**: `brew services list` (if installed via Homebrew)
   - **Linux**: `sudo systemctl status postgresql`

2. Verify your DATABASE_URL is correct
3. Check that the database exists: `psql -U namaz_user -d namaz_tracker`

### Module Not Found Errors

If you see module errors, try:

```bash
rm -rf node_modules package-lock.json
npm install
```

### Database Schema Issues

If you need to reset the database:

```bash
npm run db:push --force
```

Then recreate the demo user using the SQL commands above.

## Project Structure

```
NamazTracker/
├── client/              # React frontend
│   ├── src/
│   │   ├── components/  # UI components
│   │   ├── pages/       # Page components
│   │   ├── lib/         # Utilities
│   │   └── main.tsx     # Entry point
│   └── index.html
├── server/              # Express backend
│   ├── index.ts         # Server entry point
│   ├── routes.ts        # API routes
│   ├── storage.ts       # Database operations
│   ├── db.ts            # Database connection
│   └── vite.ts          # Vite middleware
├── shared/              # Shared types
│   └── schema.ts        # Database schema
├── package.json         # Dependencies
├── vite.config.ts       # Vite configuration
└── .env                 # Environment variables
```

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run check` - Type check with TypeScript
- `npm run db:push` - Push database schema changes

## Features

Once running, you can:
- ✅ Track daily prayers (Fajr, Dhuhr, Asr, Maghrib, Isha)
- ✅ View prayer times with countdown
- ✅ Manage historical prayers (Qaza)
- ✅ Earn achievements and track streaks
- ✅ View analytics and statistics
- ✅ Toggle dark/light mode

## Need Help?

If you encounter any issues:
1. Check the console output for error messages
2. Verify all prerequisites are installed correctly
3. Make sure the database is running and accessible
4. Check that port 5000 is not being used by another application

Enjoy using NamazTracker! 🕌
