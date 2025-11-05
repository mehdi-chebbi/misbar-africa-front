# Misbar Africa Backend API

Backend API for the Misbar Africa mapping application with user authentication and role-based access control.

## Features

- **User Authentication**: Register, login, logout, password management
- **Role-Based Access Control**: User and Admin roles with different permissions
- **JWT Token Security**: Secure token-based authentication with refresh tokens
- **Admin Panel**: User management, system statistics, activity monitoring
- **MySQL Database**: Scalable database with user management and activity logging
- **Rate Limiting**: Protection against brute force attacks
- **Input Validation**: Comprehensive request validation and sanitization

## Technology Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MySQL** - Database with mysql2 driver
- **JWT** - JSON Web Token authentication
- **bcryptjs** - Password hashing
- **express-validator** - Input validation
- **helmet** - Security headers
- **cors** - Cross-Origin Resource Sharing
- **express-rate-limit** - Rate limiting

## Quick Start

### Prerequisites

- Node.js 18+ installed
- MySQL 8.0+ running
- Environment variables configured

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

3. **Create database:**
   ```sql
   CREATE DATABASE misland_app;
   ```

4. **Run database migrations:**
   ```bash
   npm run migrate
   ```

5. **Start the server:**
   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm start
   ```

### Default Admin User

- **Email**: admin@example.com
- **Password**: admin123

⚠️ **Change this password in production!**

## API Endpoints

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | User login | No |
| POST | `/api/auth/logout` | User logout | Yes |
| GET | `/api/auth/me` | Get current user | Yes |
| PUT | `/api/auth/update-password` | Update password | Yes |

### Admin (Admin Only)

| Method | Endpoint | Description | Parameters |
|--------|----------|-------------|------------|
| GET | `/api/admin/users` | Get all users | `page`, `limit`, `search`, `role` |
| GET | `/api/admin/users/:id` | Get user by ID | `id` |
| PUT | `/api/admin/users/:id` | Update user | `id`, `email`, `role`, `is_active` |
| DELETE | `/api/admin/users/:id` | Delete user (soft) | `id` |
| GET | `/api/admin/stats` | Get system stats | - |
| GET | `/api/admin/activity-logs` | Get activity logs | `page`, `limit`, `userId`, `action` |

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Server health check |
| GET | `/api/health` | API health check |

## API Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error": "error_code"
}
```

## Request Examples

### Register User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "Password123!"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "Password123!"
  }'
```

### Get All Users (Admin)
```bash
curl -X GET http://localhost:3000/api/admin/users \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('user', 'admin') DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMP NULL
);
```

### Activity Logs Table
```sql
CREATE TABLE user_activity_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  action VARCHAR(50) NOT NULL,
  details TEXT,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

## Environment Variables

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=misland_app
DB_PORT=3306

# JWT Configuration
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRE=15m
JWT_REFRESH_SECRET=your_refresh_secret_key
JWT_REFRESH_EXPIRE=7d

# Server Configuration
PORT=3000
NODE_ENV=development

# CORS Configuration
FRONTEND_URL=http://localhost:4200

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_ATTEMPTS=5

# Security
BCRYPT_SALT_ROUNDS=12
```

## Security Features

- **Password Hashing**: bcrypt with configurable salt rounds
- **JWT Tokens**: Secure token-based authentication
- **Rate Limiting**: Protection against brute force attacks
- **Input Validation**: Request validation and sanitization
- **CORS Protection**: Configurable cross-origin settings
- **Security Headers**: Helmet.js for security headers
- **Activity Logging**: Complete audit trail of user actions

## Development

### Available Scripts

```bash
npm start          # Start production server
npm run dev        # Start development server with nodemon
npm test           # Run tests
npm run migrate    # Run database migrations
npm run seed       # Seed database with sample data
```

### Running Tests

```bash
# Install test dependencies
npm install --dev

# Run all tests
npm test

# Run tests with coverage
npm run test:coverage
```

## Production Deployment

1. **Environment Setup:**
   - Set `NODE_ENV=production`
   - Configure secure JWT secrets
   - Set up production database

2. **Database Setup:**
   - Run migrations on production database
   - Configure proper database user with limited permissions

3. **Security:**
   - Change default admin password
   - Configure HTTPS/SSL
   - Set up reverse proxy (nginx/Apache)
   - Configure firewall rules

4. **Monitoring:**
   - Set up logging
   - Monitor database connections
   - Track API performance metrics

## License

This project is licensed under the ISC License.