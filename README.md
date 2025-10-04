# Acquisitions Application - Docker Setup

A Node.js application with Express and Neon Database, containerized for both development and production environments.

## Architecture Overview

- **Development Environment**: Uses Neon Local proxy for ephemeral database branches
- **Production Environment**: Connects directly to Neon Cloud Database
- **Database ORM**: Drizzle ORM with Neon serverless driver
- **Container**: Multi-stage Docker builds optimized for each environment

## Quick Start

### Prerequisites

- Docker and Docker Compose installed
- Neon Database account with a project created
- Neon API key with appropriate permissions

### Development Setup

1. **Clone the repository and navigate to the project directory**

2. **Configure environment variables for development:**

   Copy the development environment template:

   ```bash
   cp .env.development .env.development.local
   ```

   Edit `.env.development.local` with your Neon credentials:

   ```env
   NEON_API_KEY=your_actual_neon_api_key
   NEON_PROJECT_ID=your_actual_project_id
   PARENT_BRANCH_ID=your_main_branch_id
   JWT_SECRET=your_development_jwt_secret
   COOKIE_SECRET=your_development_cookie_secret
   ```

   > **Note**: Get these values from your [Neon Console](https://console.neon.tech):
   >
   > - API Key: Account Settings → API Keys
   > - Project ID: Project Settings → General
   > - Branch ID: Your project's main/default branch ID

3. **Start the development environment:**

   ```bash
   docker-compose -f docker-compose.dev.yml --env-file .env.development.local up --build
   ```

   This will:
   - Start Neon Local proxy with ephemeral branch creation
   - Build and run your application in development mode
   - Enable hot reloading with volume mounts
   - Create a fresh database branch for each session

4. **Access the application:**
   - Application: http://localhost:3000
   - Health Check: http://localhost:3000/health
   - API: http://localhost:3000/api

5. **Run database migrations (if needed):**

   ```bash
   # In a separate terminal
   docker exec acquisitions-app-dev npm run db:migrate
   ```

6. **Stop the development environment:**
   ```bash
   docker-compose -f docker-compose.dev.yml down
   ```

### Production Setup

1. **Configure production environment variables:**

   Create a production environment file:

   ```bash
   cp .env.production .env.production.local
   ```

   Edit `.env.production.local` with your production values:

   ```env
   DATABASE_URL=postgres://username:password@ep-xxx-xxx.region.neon.tech/acquisitions?sslmode=require
   JWT_SECRET=your_strong_production_jwt_secret
   COOKIE_SECRET=your_strong_production_cookie_secret
   CORS_ORIGIN=https://your-production-domain.com
   ```

2. **Deploy with production configuration:**

   ```bash
   docker-compose -f docker-compose.prod.yml --env-file .env.production.local up --build -d
   ```

   This will:
   - Build optimized production images
   - Connect directly to Neon Cloud Database
   - Run with security hardening and resource limits
   - Include Nginx reverse proxy (optional)

3. **Health check:**
   ```bash
   curl http://localhost:3000/health
   ```

## Environment Configuration

### Development (.env.development)

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgres://neon:npg@neon-local:5432/acquisitions?sslmode=require
NEON_API_KEY=your_neon_api_key
NEON_PROJECT_ID=your_neon_project_id
PARENT_BRANCH_ID=your_parent_branch_id
```

Key features:

- Connects to Neon Local proxy at `neon-local:5432`
- Automatically creates ephemeral branches
- Enables database query logging
- Relaxed security for development

### Production (.env.production)

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgres://username:password@ep-xxx-xxx.region.neon.tech/acquisitions?sslmode=require
JWT_SECRET=strong_production_secret
COOKIE_SECRET=strong_production_secret
CORS_ORIGIN=https://your-domain.com
TRUST_PROXY=true
LOG_LEVEL=info
```

Key features:

- Direct connection to Neon Cloud
- Production-grade security settings
- Optimized logging levels
- SSL/TLS enforcement

## Database Management

### Development Database

The development setup uses **Neon Local** which:

- Creates ephemeral branches automatically
- Branches are deleted when containers stop
- No manual cleanup required
- Fresh database state for each development session

### Production Database

Production connects directly to your **Neon Cloud Database**:

- Uses your actual production database
- Persistent data storage
- Connection pooling via Neon's serverless driver
- Automatic scaling and branching available

### Running Migrations

**Development:**

```bash
# Using Docker exec
docker exec acquisitions-app-dev npm run db:migrate

# Or using docker-compose exec
docker-compose -f docker-compose.dev.yml exec app npm run db:migrate
```

**Production:**

```bash
docker-compose -f docker-compose.prod.yml exec app npm run db:migrate
```

### Database Studio (Development)

Access Drizzle Studio for database inspection:

```bash
docker exec acquisitions-app-dev npm run db:studio
```

## Docker Commands Reference

### Development Commands

```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up --build

# Start in background
docker-compose -f docker-compose.dev.yml up -d --build

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop services
docker-compose -f docker-compose.dev.yml down

# Stop and remove volumes
docker-compose -f docker-compose.dev.yml down -v

# Rebuild only the app service
docker-compose -f docker-compose.dev.yml build app
```

### Production Commands

```bash
# Deploy production environment
docker-compose -f docker-compose.prod.yml up -d --build

# Scale the application
docker-compose -f docker-compose.prod.yml up -d --scale app=3

# View production logs
docker-compose -f docker-compose.prod.yml logs -f app

# Rolling update
docker-compose -f docker-compose.prod.yml up -d --build --no-deps app

# Stop production services
docker-compose -f docker-compose.prod.yml down
```

## Troubleshooting

### Common Issues

**1. Neon Local connection issues:**

```bash
# Check if Neon Local is healthy
docker-compose -f docker-compose.dev.yml exec neon-local pg_isready -h localhost -p 5432 -U neon

# View Neon Local logs
docker-compose -f docker-compose.dev.yml logs neon-local
```

**2. Application not starting:**

```bash
# Check application logs
docker-compose -f docker-compose.dev.yml logs app

# Check health endpoint
curl http://localhost:3000/health
```

**3. Database connection errors:**

- Verify your `NEON_API_KEY`, `NEON_PROJECT_ID`, and `PARENT_BRANCH_ID` are correct
- Check your Neon Console for proper branch IDs
- Ensure your Neon API key has the necessary permissions

**4. Environment variables not loading:**

- Ensure your `.env.development.local` or `.env.production.local` files exist
- Check that you're using the `--env-file` flag with the correct file path
- Verify file permissions allow reading

### Health Checks

The application includes comprehensive health checks:

```bash
# Basic health check
curl http://localhost:3000/health

# Expected response:
{
  "status": "OK",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "uptime": 123.45,
  "environment": "development",
  "database": {
    "status": "healthy",
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
}
```

### Logs and Debugging

**View application logs:**

```bash
# Development
docker-compose -f docker-compose.dev.yml logs -f app

# Production
docker-compose -f docker-compose.prod.yml logs -f app
```

**Access container shell:**

```bash
# Development
docker-compose -f docker-compose.dev.yml exec app sh

# Production
docker-compose -f docker-compose.prod.yml exec app sh
```

## Security Considerations

### Development

- Uses relaxed CORS settings
- Database logging enabled
- Self-signed certificates accepted for Neon Local

### Production

- Runs as non-root user (nodejs:1001)
- Read-only root filesystem
- Resource limits enforced
- Strict CORS configuration
- Production-grade logging
- Optional Nginx reverse proxy included

## Performance Optimization

### Docker Build Optimization

- Multi-stage builds reduce final image size
- Layer caching for dependencies
- `.dockerignore` excludes unnecessary files

### Runtime Optimization

- Production builds exclude dev dependencies
- Connection pooling via Neon serverless driver
- Health checks for container orchestration
- Resource limits prevent resource exhaustion

## CI/CD Integration

This setup is ready for CI/CD pipelines. Example GitHub Actions workflow:

```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to production
        env:
          DATABASE_URL: ${{ secrets.NEON_DATABASE_URL }}
          JWT_SECRET: ${{ secrets.JWT_SECRET }}
        run: |
          docker-compose -f docker-compose.prod.yml up -d --build
```

## License

This project is licensed under the ISC License.
