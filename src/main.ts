/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Logger, ValidationPipe } from '@nestjs/common';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
// import { MicroserviceOptions, Transport } from '@nestjs/microservices';

const PORT = process.env.PORT ?? 4000;
const logger = new Logger('Bootstrap');

async function bootstrap() {
  const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
    {
      cors: {
        origin: process.env.CORS_ORIGINS?.split(',') || [],
        methods,
      },
    },
  );

  // Enable global validation with transformation
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // // mqtt setup
  // app.connectMicroservice<MicroserviceOptions>({
  //   transport: Transport.MQTT,
  //   options: {
  //     url: process.env.MQTT_URL,
  //     username: process.env.MQTT_USERNAME,
  //     password: process.env.MQTT_PASSWORD,
  //   },
  // });

  await app.startAllMicroservices();
  const config = new DocumentBuilder()
    .setTitle('Whatsapp Webhook')
    .setDescription('The Whatsapp Webhook API for app service')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        in: 'header',
      },
      'JWT',
    )
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  await app.listen(PORT, '0.0.0.0');

  logger.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap().catch((err) => {
  logger.error('Error during app bootstrap:', err);
  process.exit(1);
});
