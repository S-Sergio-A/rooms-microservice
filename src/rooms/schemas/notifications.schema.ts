import { Schema, SchemaFactory, Prop } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
import { RoomDocument } from "./room.schema";
import { UserDocument } from "./user.schema";

export type NotificationsDocument = Notifications & Document;

@Schema()
class Notifications {
  @Prop({ required: true, index: false, ref: "User", type: Types.ObjectId })
  user: UserDocument | Types.ObjectId;

  @Prop({ required: true, index: false, ref: "Room", type: Types.ObjectId })
  roomId: RoomDocument | Types.ObjectId;
  
  @Prop({ required: true, index: false })
  notifications: boolean;
}

export const NotificationsSchema = SchemaFactory.createForClass(Notifications);
