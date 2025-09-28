import { NestFactory } from "@nestjs/core"
import { ValidationPipe } from "@nestjs/common"
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger"
import { AppModule } from "./app.module"

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  // Enable CORS for frontend communication
  const isProduction = process.env.NODE_ENV === 'production'
  
  // Production origins - update these with your actual domains
  const productionOrigins = [
    'https://amhsj.org',
    'https://www.amhsj.org',
    process.env.FRONTEND_URL,
    process.env.FRONTEND_URL_WWW, // For www subdomain
    process.env.FRONTEND_URL_ADMIN, // For admin subdomain if needed
  ].filter(Boolean) // Remove undefined values

  // Development origins
  const developmentOrigins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001", // For testing
  ]

  const allowedOrigins = isProduction ? productionOrigins : developmentOrigins

  app.enableCors({
    origin: (origin, callback) => {
      // In production, be more strict about origins
      if (isProduction) {
        // Only allow requests with valid origins in production
        if (!origin) {
          return callback(new Error('Origin header is required in production'))
        }
        
        if (allowedOrigins.includes(origin)) {
          callback(null, true)
        } else {
          console.warn(`🚫 CORS blocked request from origin: ${origin}`)
          callback(new Error(`Origin ${origin} not allowed by CORS policy`))
        }
      } else {
        // Development: Allow requests with no origin (like Postman, curl)
        if (!origin) return callback(null, true)
        
        if (allowedOrigins.includes(origin)) {
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
    .setDescription("Advances in Medicine & Health Sciences Journal API")
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
