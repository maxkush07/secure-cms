# Secure CMS

A comprehensive, security-focused Content Management System built with modern web technologies and industry best practices.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Installation Guide](#installation-guide)
- [Configuration](#configuration)
- [API Endpoints](#api-endpoints)
- [Security Features](#security-features)
- [Deployment Instructions](#deployment-instructions)
- [Contributing](#contributing)
- [License](#license)

## Overview

Secure CMS is an enterprise-grade content management system designed with security as a first-class citizen. It provides a robust platform for managing content, users, and permissions with comprehensive audit logging and compliance features.

## Features

### Core Features
- **Content Management**: Full CRUD operations for pages, posts, and media
- **User Management**: Role-based access control (RBAC) with granular permissions
- **Media Library**: Secure file upload and management
- **Versioning**: Content revision history and rollback capabilities
- **Audit Logging**: Comprehensive activity tracking for compliance
- **API-First Architecture**: RESTful API for all operations
- **Multi-language Support**: Built-in i18n capabilities
- **Responsive Dashboard**: Modern admin interface

### Security Features
- **End-to-End Encryption**: Data encryption at rest and in transit
- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: Protection against brute force attacks
- **CORS Protection**: Cross-origin resource sharing validation
- **SQL Injection Prevention**: Parameterized queries and ORM protection
- **XSS Protection**: Content Security Policy headers
- **CSRF Tokens**: Cross-site request forgery prevention
- **Password Hashing**: BCrypt with configurable salt rounds
- **2FA Support**: Two-factor authentication implementation
- **API Key Management**: Secure API key generation and rotation
- **IP Whitelisting**: Restrict access by IP address
- **Penetration Testing Ready**: Security headers and best practices

## Installation Guide

### Prerequisites

- **Node.js**: v16.0.0 or higher
- **npm**: v7.0.0 or higher
- **PostgreSQL**: v12.0 or higher
- **Redis**: v6.0 or higher (for caching and sessions)
- **Git**: Latest version

### Step 1: Clone the Repository

```bash
git clone https://github.com/maxkush07/secure-cms.git
cd secure-cms
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Environment Setup

Create a `.env` file in the root directory:

```env
# Application
NODE_ENV=development
PORT=3000
APP_URL=http://localhost:3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=secure_cms
DB_USER=cms_user
DB_PASSWORD=secure_password

# Redis
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRATION=24h
REFRESH_TOKEN_SECRET=your_refresh_token_secret

# Security
BCRYPT_ROUNDS=12
ENCRYPTION_KEY=your_32_character_encryption_key
SESSION_SECRET=your_session_secret

# Email Configuration
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_email@example.com
SMTP_PASSWORD=your_email_password
SMTP_FROM=noreply@example.com

# File Upload
MAX_FILE_SIZE=52428800
ALLOWED_MIME_TYPES=image/jpeg,image/png,application/pdf

# API Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100

# 2FA
TOTP_WINDOW=2
```

### Step 4: Database Setup

```bash
# Create database
createdb secure_cms

# Run migrations
npm run migrate

# Seed initial data (optional)
npm run seed
```

### Step 5: Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Step 6: Create Admin User

```bash
npm run create-admin
# Follow the interactive prompts to set admin credentials
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment (development/production/test) | development |
| `PORT` | Application port | 3000 |
| `JWT_SECRET` | Secret key for JWT signing | - |
| `DB_HOST` | Database host | localhost |
| `REDIS_URL` | Redis connection string | redis://localhost:6379 |
| `BCRYPT_ROUNDS` | Password hashing rounds | 12 |
| `MAX_FILE_SIZE` | Max upload size in bytes | 52428800 |

### Database Schema

The application uses PostgreSQL with the following main tables:
- `users` - User accounts and authentication
- `roles` - Role definitions
- `permissions` - Permission definitions
- `user_roles` - User-role assignments
- `content` - Page and post content
- `media` - Media files metadata
- `audit_logs` - Activity tracking
- `api_keys` - API key management
- `sessions` - Session management

## API Endpoints

### Authentication Endpoints

#### Register User
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response (201 Created)**
```json
{
  "success": true,
  "data": {
    "id": "user-uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "createdAt": "2025-12-12T13:02:18Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "id": "user-uuid",
    "email": "user@example.com",
    "roles": ["user"]
  },
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### Enable 2FA
```http
POST /api/v1/auth/2fa/enable
Authorization: Bearer {token}
```

**Response (200 OK)**
```json
{
  "success": true,
  "qrCode": "data:image/png;base64,...",
  "secret": "JBSWY3DPEBLW64TMMQ======"
}
```

#### Verify 2FA
```http
POST /api/v1/auth/2fa/verify
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "token": "123456"
}
```

### Content Endpoints

#### List Content
```http
GET /api/v1/content?page=1&limit=10&status=published
Authorization: Bearer {token}
```

**Response (200 OK)**
```json
{
  "success": true,
  "data": [
    {
      "id": "content-uuid",
      "title": "Welcome to Secure CMS",
      "slug": "welcome-to-secure-cms",
      "status": "published",
      "author": {
        "id": "user-uuid",
        "name": "John Doe"
      },
      "createdAt": "2025-12-12T13:02:18Z",
      "updatedAt": "2025-12-12T13:02:18Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 42
  }
}
```

#### Get Content by ID
```http
GET /api/v1/content/{id}
Authorization: Bearer {token}
```

#### Create Content
```http
POST /api/v1/content
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "New Post",
  "slug": "new-post",
  "content": "<p>Post content here</p>",
  "status": "draft",
  "featured": false
}
```

#### Update Content
```http
PUT /api/v1/content/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Updated Post Title",
  "status": "published"
}
```

#### Delete Content
```http
DELETE /api/v1/content/{id}
Authorization: Bearer {token}
```

### User Management Endpoints

#### List Users
```http
GET /api/v1/users?page=1&limit=10
Authorization: Bearer {token}
X-Admin-Token: {admin-token}
```

#### Get User Profile
```http
GET /api/v1/users/profile
Authorization: Bearer {token}
```

#### Update User Profile
```http
PUT /api/v1/users/profile
Authorization: Bearer {token}
Content-Type: application/json

{
  "firstName": "Jane",
  "lastName": "Smith"
}
```

#### Change Password
```http
POST /api/v1/users/change-password
Authorization: Bearer {token}
Content-Type: application/json

{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewPassword456!"
}
```

#### Assign Role
```http
POST /api/v1/users/{userId}/roles
Authorization: Bearer {token}
X-Admin-Token: {admin-token}
Content-Type: application/json

{
  "roleId": "role-uuid"
}
```

### Media Endpoints

#### Upload Media
```http
POST /api/v1/media/upload
Authorization: Bearer {token}
Content-Type: multipart/form-data

File: {binary_file_data}
```

**Response (201 Created)**
```json
{
  "success": true,
  "data": {
    "id": "media-uuid",
    "fileName": "image.jpg",
    "url": "/media/image-uuid.jpg",
    "mimeType": "image/jpeg",
    "size": 1024,
    "uploadedAt": "2025-12-12T13:02:18Z"
  }
}
```

#### Get Media
```http
GET /api/v1/media/{id}
Authorization: Bearer {token}
```

#### Delete Media
```http
DELETE /api/v1/media/{id}
Authorization: Bearer {token}
```

### Audit Log Endpoints

#### Get Audit Logs
```http
GET /api/v1/audit-logs?page=1&limit=50&action=create
Authorization: Bearer {token}
X-Admin-Token: {admin-token}
```

**Response (200 OK)**
```json
{
  "success": true,
  "data": [
    {
      "id": "log-uuid",
      "userId": "user-uuid",
      "action": "create",
      "resource": "content",
      "resourceId": "content-uuid",
      "changes": {
        "title": "New Post"
      },
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "timestamp": "2025-12-12T13:02:18Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 156
  }
}
```

### API Key Endpoints

#### Generate API Key
```http
POST /api/v1/api-keys
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Mobile App Key",
  "expiresIn": "365d"
}
```

**Response (201 Created)**
```json
{
  "success": true,
  "data": {
    "id": "key-uuid",
    "name": "Mobile App Key",
    "key": "sk_live_abc123xyz...",
    "createdAt": "2025-12-12T13:02:18Z",
    "expiresAt": "2026-12-12T13:02:18Z"
  }
}
```

#### List API Keys
```http
GET /api/v1/api-keys
Authorization: Bearer {token}
```

#### Revoke API Key
```http
DELETE /api/v1/api-keys/{keyId}
Authorization: Bearer {token}
```

## Security Features

### Authentication & Authorization

- **JWT Tokens**: Stateless authentication with short-lived tokens (1 hour)
- **Refresh Tokens**: Long-lived tokens (7 days) for obtaining new access tokens
- **Role-Based Access Control**: Fine-grained permission management
- **Multi-Factor Authentication**: TOTP-based 2FA support

### Data Protection

- **Encryption at Rest**: AES-256 encryption for sensitive data
- **Encryption in Transit**: TLS 1.3 for all connections
- **Password Security**: Bcrypt hashing with configurable rounds (default: 12)
- **API Key Rotation**: Support for API key expiration and rotation

### Request Validation & Sanitization

- **Input Validation**: Schema validation for all endpoints
- **SQL Injection Prevention**: Parameterized queries via ORM
- **XSS Protection**: Output escaping and Content Security Policy headers
- **NoSQL Injection Prevention**: Type checking and validation

### Rate Limiting & DDoS Protection

- **API Rate Limiting**: Configurable per-user/per-IP limits
- **Brute Force Protection**: Account lockout after failed attempts
- **CORS Protection**: Strict origin validation
- **Request Size Limits**: Prevents large payload attacks

### Logging & Monitoring

- **Audit Trails**: Comprehensive logging of all user actions
- **Security Events**: Special logging for sensitive operations
- **Error Handling**: Secure error messages without information leakage
- **IP Tracking**: All requests logged with client IP address

### Compliance Features

- **GDPR Ready**: Data export and deletion capabilities
- **Compliance Logging**: Audit trail for regulatory requirements
- **Activity Reports**: Detailed reporting for compliance audits
- **Data Retention**: Configurable log retention policies

### API Security Headers

The application automatically adds these security headers:

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

## Deployment Instructions

### Prerequisites for Production

- Ubuntu 20.04 LTS or similar Linux distribution
- Node.js v16+ and npm
- PostgreSQL 12+
- Redis 6+
- Nginx (reverse proxy)
- SSL Certificate (Let's Encrypt recommended)
- Domain name

### Option 1: Manual Deployment

#### Step 1: Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install Redis
sudo apt install -y redis-server

# Install Nginx
sudo apt install -y nginx
```

#### Step 2: Configure Database

```bash
# Connect to PostgreSQL
sudo -u postgres psql

# Create database and user
CREATE DATABASE secure_cms;
CREATE USER cms_user WITH PASSWORD 'secure_password';
ALTER ROLE cms_user SET client_encoding TO 'utf8';
ALTER ROLE cms_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE cms_user SET default_transaction_deferrable TO on;
ALTER ROLE cms_user SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE secure_cms TO cms_user;
\q
```

#### Step 3: Application Deployment

```bash
# Create application directory
sudo mkdir -p /var/www/secure-cms
sudo chown $USER:$USER /var/www/secure-cms

# Clone repository
cd /var/www/secure-cms
git clone https://github.com/maxkush07/secure-cms.git .

# Install dependencies
npm ci --only=production

# Create .env file
nano .env
# (Add production environment variables)

# Run migrations
npm run migrate

# Create admin user
npm run create-admin
```

#### Step 4: Configure Nginx

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/secure-cms
```

Add the following configuration:

```nginx
upstream secure_cms {
  server 127.0.0.1:3000;
}

server {
  listen 80;
  server_name yourdomain.com www.yourdomain.com;
  
  # Redirect HTTP to HTTPS
  return 301 https://$server_name$request_uri;
}

server {
  listen 443 ssl http2;
  server_name yourdomain.com www.yourdomain.com;

  ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
  
  # SSL Configuration
  ssl_protocols TLSv1.2 TLSv1.3;
  ssl_ciphers HIGH:!aNULL:!MD5;
  ssl_prefer_server_ciphers on;

  # Security Headers
  add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
  add_header X-Frame-Options "DENY" always;
  add_header X-Content-Type-Options "nosniff" always;
  add_header X-XSS-Protection "1; mode=block" always;
  add_header Referrer-Policy "strict-origin-when-cross-origin" always;
  add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;

  # Logging
  access_log /var/log/nginx/secure-cms-access.log;
  error_log /var/log/nginx/secure-cms-error.log;

  # Client upload size
  client_max_body_size 50M;

  location / {
    proxy_pass http://secure_cms;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Host $server_name;
    proxy_read_timeout 90;
  }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/secure-cms /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### Step 5: Setup SSL Certificate

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Generate certificate
sudo certbot certonly --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo systemctl enable certbot.timer
```

#### Step 6: Process Management with PM2

```bash
# Install PM2 globally
sudo npm install -g pm2

# Create ecosystem.config.js
cat > /var/www/secure-cms/ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'secure-cms',
    script: './src/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};
EOF

# Start application
pm2 start ecosystem.config.js

# Setup auto-restart on server reboot
pm2 startup
sudo env PATH=$PATH:/usr/bin /usr/local/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp /home/$USER
pm2 save
```

#### Step 7: Monitoring & Maintenance

```bash
# Monitor application
pm2 monit

# View logs
pm2 logs secure-cms

# Backup database (daily)
sudo crontab -e
# Add: 0 2 * * * pg_dump -U cms_user secure_cms > /var/backups/secure_cms_$(date +\%Y\%m\%d).sql
```

### Option 2: Docker Deployment

#### Dockerfile

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application
COPY . .

# Run migrations
RUN npm run migrate

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "start"]
```

#### Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      DB_HOST: postgres
      REDIS_URL: redis://redis:6379
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_DB: secure_cms
      POSTGRES_USER: cms_user
      POSTGRES_PASSWORD: secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    restart: unless-stopped

volumes:
  postgres_data:
```

Deploy with:

```bash
docker-compose up -d
```

### Post-Deployment Checklist

- [ ] Verify SSL certificate installation
- [ ] Test all API endpoints
- [ ] Configure backup strategy
- [ ] Set up monitoring and alerting
- [ ] Run security headers verification
- [ ] Test password reset functionality
- [ ] Verify email notifications
- [ ] Configure log rotation
- [ ] Test 2FA setup
- [ ] Run penetration testing
- [ ] Document deployment configuration
- [ ] Create disaster recovery plan

### Production Environment Variables

Ensure these are set securely in production:

```env
NODE_ENV=production
JWT_SECRET=<64+ character random string>
ENCRYPTION_KEY=<32 character random string>
SESSION_SECRET=<32+ character random string>
DB_PASSWORD=<strong database password>
SMTP_PASSWORD=<email service password>
```

### Monitoring & Alerting

Set up monitoring for:

- Application uptime and response time
- Database performance and disk space
- Redis memory usage
- Nginx error rates
- CPU and memory utilization
- Failed authentication attempts
- API response times

## Contributing

We welcome contributions! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Security Reporting

If you discover a security vulnerability, please email security@example.com instead of using the issue tracker.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Last Updated**: 2025-12-12

For more information and updates, visit [GitHub Repository](https://github.com/maxkush07/secure-cms)
