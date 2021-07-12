import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ValidationModule } from "./pipes/validation.module";
import { RoomsModule } from "./rooms/rooms.module";
import { ConfigModule } from "@nestjs/config";

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRoot(
      `mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_CLUSTER_URL}/${process.env.MONGO_DATABASE_NAME}?retryWrites=true&w=majority`
    ),
    RoomsModule,
    ValidationModule
  ]
})
export class AppModule {}
