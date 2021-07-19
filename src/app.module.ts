import { ConfigModule } from "@nestjs/config";
import { Module } from "@nestjs/common";
import { RoomsModule } from "./rooms/rooms.module";
import { MongooseModule } from "@nestjs/mongoose";

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRoot(
      `mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_CLUSTER_URL}/${process.env.MONGO_USER_DATABASE_NAME}?retryWrites=true&w=majority`,
      {
        connectionName: "user"
      }
    ),
    MongooseModule.forRoot(
      `mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_CLUSTER_URL}/${process.env.MONGO_ROOMS_DATABASE_NAME}?retryWrites=true&w=majority`,
      {
        connectionName: "room"
      }
    ),
    RoomsModule
  ]
})
export class AppModule {}
