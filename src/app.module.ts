import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { defaultImports } from "~/modules/common";
import { RabbitModule } from "~/modules/rabbit";
import { RoomsModule } from "~/modules/rooms/rooms.module";
import { ConnectionNamesEnum, HealthCheckModule, LoggerModule } from "@ssmovzh/chatterly-common-utils";

@Module({
  imports: [
    ...defaultImports,
    RoomsModule,
    RabbitModule,
    HealthCheckModule,
    LoggerModule,
    MongooseModule.forRoot(
      `mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_CLUSTER_URL}/${ConnectionNamesEnum.USERS}?retryWrites=true&w=majority&appName=Cluster0`,
      {
        connectionName: ConnectionNamesEnum.USERS
      }
    ),
    MongooseModule.forRoot(
      `mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_CLUSTER_URL}/${ConnectionNamesEnum.ROOMS}?retryWrites=true&w=majority&appName=Cluster0`,
      {
        connectionName: ConnectionNamesEnum.ROOMS
      }
    ),
    MongooseModule.forRoot(
      `mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_CLUSTER_URL}/${ConnectionNamesEnum.MESSAGES}?retryWrites=true&w=majority&appName=Cluster0`,
      {
        connectionName: ConnectionNamesEnum.MESSAGES
      }
    )
  ]
})
export class AppModule {}
