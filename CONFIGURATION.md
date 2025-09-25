# AMHSJ Backend Configuration

## Environment Variables

Create a `.env` file in the backend directory with the following variables:

### Required Variables
```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/amhsj

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Server Configuration
PORT=3001
NODE_ENV=development
```

### Optional Variables (Services will be disabled if not configured)

#### Email Services
```env
# Resend API Key (for transactional emails)
RESEND_API_KEY=re_your_resend_api_key_here

# SMTP Configuration (for editorial emails)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

#### File Upload Service
```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

## Service Behavior

- **ResendService**: Will be disabled if `RESEND_API_KEY` is not provided
- **SmtpService**: Will work if SMTP credentials are provided
- **CloudinaryService**: Will throw errors if credentials are not provided (upload functionality will fail)

## Getting Started

1. Copy the required variables to your `.env` file
2. Install dependencies: `pnpm install`
3. Start the development server: `pnpm run start:dev`

The application will start successfully even without optional services configured, but those features will not be available.
