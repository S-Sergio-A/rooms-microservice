import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { defaultImports, LoggerModule } from "~/modules/common";
import { HealthCheckModule } from "~/modules/health-check/health-check.module";
import { RabbitModule } from "~/modules/rabbit";
import { RoomsModule } from "~/modules/rooms/rooms.module";
import { ConnectionNamesEnum } from "@ssmovzh/chatterly-common-utils";

@Module({
  imports: [
    ...defaultImports,
    RoomsModule,
    RabbitModule,
    HealthCheckModule,
    LoggerModule,
    MongooseModule.forRoot(
      `mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_CLUSTER_URL}/${process.env.MONGO_USER_DATABASE_NAME}?retryWrites=true&w=majority`,
      {
        connectionName: ConnectionNamesEnum.USERS
      }
    ),
    MongooseModule.forRoot(
      `mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_CLUSTER_URL}/${process.env.MONGO_ROOMS_DATABASE_NAME}?retryWrites=true&w=majority`,
      {
        connectionName: ConnectionNamesEnum.ROOMS
      }
    ),
    MongooseModule.forRoot(
      `mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_CLUSTER_URL}/${process.env.MONGO_MESSAGES_DATABASE_NAME}?retryWrites=true&w=majority`,
      {
        connectionName: ConnectionNamesEnum.MESSAGES
      }
    )
  ]
})
export class AppModule {}
