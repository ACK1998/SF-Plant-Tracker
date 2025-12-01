# Sanctity Ferme Backend API

A Node.js/Express backend API for the Sanctity Ferme Plant Tracker application.

## Features

- �� JWT Authentication
- �� Plant Management
- 👥 User Management
- 🏢 Organization Management
- 📍 Domain & Plot Management
- 📊 Status Tracking
- 🔒 Role-based Authorization

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

## Installation

1. **Navigate to the backend directory**
   ```bash
   cd sanctity-ferme-plant-tracker/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start MongoDB**
   ```bash
   # Make sure MongoDB is running on your system
   mongod
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

## Environment Variables

Create a `.env` file in the backend directory:

```env
PORT=5001
MONGODB_URI=mongodb://localhost:27017/sanctity-ferme
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NODE_ENV=development
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Plants
- `GET /api/plants` - Get all plants
- `GET /api/plants/:id` - Get single plant
- `POST /api/plants` - Create new plant
- `PUT /api/plants/:id` - Update plant
- `DELETE /api/plants/:id` - Delete plant
- `POST /api/plants/:id/status` - Add status update

## Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests (to be implemented)
- `npm run seed:farm-layout` - Upsert the SF3 domain and plots derived from the farm overlay

### Seeding the SF3 layout

The frontend overlay data now has a matching MongoDB representation. To sync it into the database:

1. Ensure `MONGODB_URI` points to the target cluster and that the `Sanctity Ferme` organization plus an admin user already exist (run `setupDatabase.js` if needed).
2. (Optional) Override defaults with:
   ```
   export SEED_ORG_NAME="Sanctity Ferme"
   export SEED_CREATED_BY_EMAIL="admin@sanctityferme.com"
   ```
3. Run the seeder:
   ```
   npm run seed:farm-layout
   ```

The script upserts the `SF3` domain coordinates and creates/updates plots `1-109`, `200-260`, and `300-344`, so MapView data comes from the DB instead of hardcoded fallbacks.

## Database Schema

The application uses MongoDB with the following collections:
- Users
- Organizations
- Domains
- Plots
- Plants

## Security Features

- JWT Authentication
- Password hashing with bcrypt
- CORS protection
- Helmet security headers
- Input validation
- Role-based authorization

## Development

The server runs on `http://localhost:5001` by default in development mode.

## Production Deployment

1. Set `NODE_ENV=production`
2. Use a strong JWT_SECRET
3. Configure CORS origins
4. Set up proper MongoDB connection string
5. Use PM2 or similar process manager 