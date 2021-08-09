import { MongooseModule } from "@nestjs/mongoose";
import { Module } from "@nestjs/common";
import { NotificationsSchema } from "./schemas/notifications.schema";
import { MessageSchema } from "./schemas/message.schema";
import { RightsSchema } from "./schemas/rights.schema";
import { RoomsController } from "./rooms.controller";
import { UserSchema } from "./schemas/user.schema";
import { RoomSchema } from "./schemas/room.schema";
import { RoomsService } from "./rooms.service";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: "Room", schema: RoomSchema }], "room"),
    MongooseModule.forFeature([{ name: "Messages", schema: MessageSchema }], "messages"),
    MongooseModule.forFeature([{ name: "Rights", schema: RightsSchema }], "room"),
    MongooseModule.forFeature([{ name: "Notifications", schema: NotificationsSchema }], "room"),
    MongooseModule.forFeature([{ name: "User", schema: UserSchema }], "user")
  ],
  controllers: [RoomsController],
  providers: [RoomsService],
  exports: [RoomsService]
})
export class RoomsModule {}
