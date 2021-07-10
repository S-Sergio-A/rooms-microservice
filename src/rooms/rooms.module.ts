import { MongooseModule } from "@nestjs/mongoose";
import { Module } from "@nestjs/common";
import { RightsSchema } from "./schemas/rights.schema";
import { RoomsController } from "./rooms.controller";
import { RoomSchema } from "./schemas/room.schema";
import { RoomsService } from "./rooms.service";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: "Room", schema: RoomSchema }]),
    MongooseModule.forFeature([{ name: "Rights", schema: RightsSchema }])
  ],
  controllers: [RoomsController],
  providers: [RoomsService],
  exports: [RoomsService]
})
export class RoomsModule {}
