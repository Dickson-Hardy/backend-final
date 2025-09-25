import { NestFactory } from "@nestjs/core"
import { ValidationPipe } from "@nestjs/common"
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger"
import * as express from "express"
import { AppModule } from "./app.module"

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  // Enable CORS for frontend communication
  app.enableCors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })

  // Ensure JSON parsing
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))

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
