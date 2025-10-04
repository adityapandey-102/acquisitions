# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Development Commands

### Core Development

- `npm run dev` - Start development server with file watching (uses Node.js --watch flag)
- `npm run lint` - Run ESLint to check code quality
- `npm run lint:fix` - Run ESLint with automatic fixes
- `npm run format` - Format code using Prettier
- `npm run format:check` - Check code formatting without making changes

### Database Operations

- `npm run db:generate` - Generate Drizzle migrations from schema changes
- `npm run db:migrate` - Apply pending migrations to the database
- `npm run db:studio` - Launch Drizzle Studio for database management

### Environment Setup

- Copy `.env.example` to `.env` if it exists, or ensure these environment variables are set:
  - `DATABASE_URL` - Neon PostgreSQL connection string
  - `JWT_SECRET` - JWT signing secret
  - `LOG_LEVEL` - Winston log level (info, debug, error)
  - `NODE_ENV` - Environment (development, production)
  - `PORT` - Server port (defaults to 3000)

## Architecture Overview

### Application Structure

This is a Node.js Express API with a layered architecture following MVC patterns:

**Entry Point Flow:**

- `src/index.js` → loads environment → starts `src/server.js`
- `src/server.js` → imports `src/app.js` → starts HTTP server
- `src/app.js` → configures Express middleware and routes

**Layer Architecture:**

```
Controllers → Services → Models → Database
     ↓           ↓         ↓         ↓
   HTTP      Business   Schema   Drizzle ORM
 Handling     Logic    Definition   + Neon DB
```

### Import Alias System

The project uses Node.js import maps defined in `package.json`:

- `#config/*` → `./src/config/*`
- `#controllers/*` → `./src/controllers/*`
- `#middleware/*` → `./src/middleware/*`
- `#models/*` → `./src/models/*`
- `#routes/*` → `./src/routes/*`
- `#services/*` → `./src/services/*`
- `#utils/*` → `./src/utils/*`
- `#validations/*` → `./src/validations/*`

Always use these aliases when importing internal modules.

### Database Architecture

- **ORM**: Drizzle ORM with Neon serverless PostgreSQL
- **Schema**: Defined in `src/models/` using Drizzle's pgTable
- **Migrations**: Auto-generated in `./drizzle/` directory
- **Connection**: Configured in `src/config/database.js` using `@neondatabase/serverless`

### Authentication System

- **Strategy**: JWT tokens stored in HTTP-only cookies
- **Password Hashing**: bcrypt with salt rounds of 10
- **Token Expiry**: 1 day (configured in `src/utils/jwt.js`)
- **Cookie Security**: 15-minute maxAge, httpOnly, secure in production, sameSite strict

### Validation & Error Handling

- **Schema Validation**: Zod schemas in `src/validations/`
- **Logging**: Winston logger configured in `src/config/logger.js`
  - File logging: `logs/combined.log` and `logs/error.log`
  - Console logging in non-production environments
- **Request Logging**: Morgan middleware integrated with Winston

## Key Patterns

### Service Layer Pattern

Services contain business logic and database interactions. Controllers should be thin and delegate to services:

```javascript
// Controller
export const signup = async (req, res, next) => {
  const user = await createUser({ name, email, password, role });
  // Handle response...
};

// Service
export const createUser = async ({ name, email, password, role }) => {
  // Database operations and business logic
};
```

### Error Handling

- Services throw errors with descriptive messages
- Controllers catch and format errors for HTTP responses
- Use Winston logger for error tracking
- Validation errors use `formValidationError` utility from `#utils/format.js`

### Database Queries

- Use Drizzle ORM query builder syntax
- Import `db` from `#config/database.js`
- Define models in `src/models/` using pgTable
- Always use parameterized queries via Drizzle methods

### Route Organization

- Routes are defined in `src/routes/` and mounted in `src/app.js`
- Use Express router instances
- Current routes: `/api/auth` (mounted auth routes)
- Health check available at `/health`

## Development Workflow

1. **Adding New Features:**
   - Create/update Drizzle models in `src/models/`
   - Run `npm run db:generate` to create migrations
   - Run `npm run db:migrate` to apply changes
   - Add validation schemas in `src/validations/`
   - Implement services in `src/services/`
   - Create controllers in `src/controllers/`
   - Define routes in `src/routes/` and mount in `src/app.js`

2. **Code Quality:**
   - Follow ESLint configuration (2-space indentation, single quotes, semicolons)
   - Use Prettier for consistent formatting
   - Prefer arrow functions and ES6+ features
   - No unused variables (prefix with `_` if needed)

3. **Testing Endpoints:**
   - Use `npm run db:studio` to inspect database state
   - Check logs in `logs/combined.log` for request tracking
   - Health endpoint: `GET /health` returns server status
