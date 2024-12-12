import { MongooseModule } from "@nestjs/mongoose";
import { Module } from "@nestjs/common";
import { MessageSchema, NotificationsSchema, RightsSchema, RoomSchema, UserSchema } from "~/modules/schemas";
import { RoomsService } from "./rooms.service";
import { Handlers } from "~/modules/rooms/handlers";
import { Executor } from "~/modules/rooms/executor";
import { ConnectionNamesEnum, ModelsNamesEnum } from "~/modules/common";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: ModelsNamesEnum.ROOM, schema: RoomSchema }], ConnectionNamesEnum.ROOM),
    MongooseModule.forFeature([{ name: ModelsNamesEnum.MESSAGES, schema: MessageSchema }], ConnectionNamesEnum.MESSAGES),
    MongooseModule.forFeature([{ name: ModelsNamesEnum.RIGHTS, schema: RightsSchema }], ConnectionNamesEnum.ROOM),
    MongooseModule.forFeature([{ name: ModelsNamesEnum.NOTIFICATIONS, schema: NotificationsSchema }], ConnectionNamesEnum.ROOM),
    MongooseModule.forFeature([{ name: ModelsNamesEnum.USER, schema: UserSchema }], ConnectionNamesEnum.USER)
  ],
  providers: [RoomsService, Handlers, Executor],
  exports: [RoomsService, Handlers, Executor]
})
export class RoomsModule {}
