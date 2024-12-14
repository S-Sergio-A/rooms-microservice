import { MongooseModule } from "@nestjs/mongoose";
import { Module } from "@nestjs/common";
import { RoomsService } from "./rooms.service";
import { Handlers } from "~/modules/rooms/handlers";
import { Executor } from "~/modules/rooms/executor";
import { ConnectionNamesEnum, Message, ModelsNamesEnum, Notification, Right, Room, User } from "@ssmovzh/chatterly-common-utils";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: ModelsNamesEnum.ROOMS, schema: Room }], ConnectionNamesEnum.ROOMS),
    MongooseModule.forFeature([{ name: ModelsNamesEnum.MESSAGES, schema: Message }], ConnectionNamesEnum.MESSAGES),
    MongooseModule.forFeature([{ name: ModelsNamesEnum.RIGHTS, schema: Right }], ConnectionNamesEnum.ROOMS),
    MongooseModule.forFeature(
      [
        {
          name: ModelsNamesEnum.NOTIFICATIONS,
          schema: Notification
        }
      ],
      ConnectionNamesEnum.ROOMS
    ),
    MongooseModule.forFeature([{ name: ModelsNamesEnum.USERS, schema: User }], ConnectionNamesEnum.USERS)
  ],
  providers: [RoomsService, Handlers, Executor],
  exports: [RoomsService, Handlers, Executor]
})
export class RoomsModule {}
