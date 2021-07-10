import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import helmet from "helmet";

async function bootstrap() {
  // const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
  //   transport: Transport.TCP,
  //   options: {
  //     host: "0.0.0.0",
  //     port: 9000
  //   }
  // });

  const app = await NestFactory.create(AppModule);

  app.use(helmet());
  app.enableCors({
    origin: [process.env.FRONT_URL],
    credentials: true,
    exposedHeaders: ["Access-Token", "Refresh-Token", "Client-Token", "Country", "Content-Type"],
    methods: ["GET", "POST", "DELETE", "PUT", "OPTIONS"]
  });

  // @ts-ignore
  // app.listen(() => console.log("Microservice is listening"));
  await app.listen(8000);
}

bootstrap();
