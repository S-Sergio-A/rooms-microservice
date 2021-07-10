import { MiddlewareConsumer, Module, NestModule, RequestMethod } from "@nestjs/common";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { MongooseModule } from "@nestjs/mongoose";
import { APP_GUARD } from "@nestjs/core";
import { ValidationModule } from "./pipes/validation.module";
import { RoomsModule } from "./rooms/rooms.module";
import { ConfigModule } from "@nestjs/config";
import { RightsMiddleware } from "./rights.middleware";
import { RoomsController } from "./rooms/rooms.controller";

@Module({
  imports: [
    ConfigModule.forRoot(),
    ThrottlerModule.forRoot({
      ttl: 400,
      limit: 30,
      ignoreUserAgents: [new RegExp("googlebot", "gi"), new RegExp("bingbot", "gi")]
    }),
    MongooseModule.forRoot(
      `mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_CLUSTER_URL}/${process.env.MONGO_DATABASE_NAME}?retryWrites=true&w=majority`
    ),
    RoomsModule,
    ValidationModule
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard
    }
  ]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RightsMiddleware)
      .exclude({ path: "/rooms", method: RequestMethod.ALL }, { path: "/rooms/:name", method: RequestMethod.GET })
      .forRoutes(RoomsController);
  }
}
