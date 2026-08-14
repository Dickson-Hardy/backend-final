import { NestFactory } from "@nestjs/core"
import { ValidationPipe } from "@nestjs/common"
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger"
import { AppModule } from "./app.module"

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  // Enable CORS for frontend communication
  const isProduction = process.env.NODE_ENV === 'production'
  const configuredOrigins = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map(origin => origin.trim().replace(/\/$/, ''))
    .filter(Boolean)
  
  // Production origins - update these with your actual domains
  const productionOrigins = [
    'https://amhsj.org',
    'https://www.amhsj.org',
    ...configuredOrigins,
    process.env.FRONTEND_URL,
    process.env.FRONTEND_URL_WWW, // For www subdomain
    process.env.FRONTEND_URL_ADMIN, // For admin subdomain if needed
  ]
    .filter((origin): origin is string => Boolean(origin))
    .map(origin => origin.replace(/\/$/, ''))

  // Development origins
  const developmentOrigins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001", // For testing
    "http://localhost:3004",
    "http://127.0.0.1:3004",
    ...configuredOrigins,
  ]

  const allowedOrigins = Array.from(new Set(isProduction ? productionOrigins : developmentOrigins))

  app.enableCors({
    origin: (origin, callback) => {
      // CORS is a browser-origin policy. Render health checks, direct API
      // navigation, command-line clients, and server-to-server requests may
      // legitimately omit the Origin header.
      if (!origin) {
        return callback(null, true)
      }

      // In production, be more strict about origins
      if (isProduction) {
        if (allowedOrigins.includes(origin.replace(/\/$/, ''))) {
          callback(null, true)
        } else {
          console.warn(`🚫 CORS blocked request from origin: ${origin}`)
          callback(new Error(`Origin ${origin} not allowed by CORS policy`))
        }
      } else {
        if (allowedOrigins.includes(origin.replace(/\/$/, ''))) {
          callback(null, true)
        } else {
          console.warn(`🚫 CORS blocked request from origin: ${origin}`)
          callback(new Error(`Origin ${origin} not allowed by CORS policy`))
        }
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type', 
      'Authorization', 
      'Accept',
      'X-Requested-With',
      'Cache-Control',
    ],
    exposedHeaders: ['X-Total-Count', 'X-Page-Count'], // For pagination
    maxAge: isProduction ? 86400 : 3600, // Cache preflight for 24h in prod, 1h in dev
    optionsSuccessStatus: 200, // For legacy browser support
  })

  // Security headers for production
  if (isProduction) {
    // Add security headers manually (alternative to helmet)
    app.use((req, res, next) => {
      // Prevent clickjacking
      res.setHeader('X-Frame-Options', 'DENY')
      
      // Prevent MIME type sniffing
      res.setHeader('X-Content-Type-Options', 'nosniff')
      
      // Enable XSS protection
      res.setHeader('X-XSS-Protection', '1; mode=block')
      
      // Referrer policy
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
      
      // Content Security Policy
      res.setHeader('Content-Security-Policy', 
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline'; " +
        "style-src 'self' 'unsafe-inline'; " +
        "img-src 'self' data: https:; " +
        "font-src 'self' data:; " +
        "connect-src 'self'; " +
        "frame-ancestors 'none';"
      )
      
      // HSTS (HTTP Strict Transport Security)
      if (req.secure) {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
      }
      
      next()
    })
  }

  // NestJS automatically handles JSON parsing, but we can configure it if needed
  // The express middleware is handled internally by NestJS

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  )

  // API prefix
  app.setGlobalPrefix("api/v1")

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle("AMHSJ API")
    .setDescription("Advances in Medicine and Health Sciences Journal API")
    .setVersion("1.0")
    .addBearerAuth()
    .build()
  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup("api/docs", app, document)

  const port = process.env.PORT || 3001
  await app.listen(port)
  console.log(`🚀 AMHSJ Backend running on port ${port}`)
  console.log(`📚 API Documentation: http://localhost:${port}/api/docs`)
}
bootstrap()


