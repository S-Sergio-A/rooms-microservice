import { Schema, SchemaFactory, Prop } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type RoomDocument = Room & Document;

@Schema()
class Room {
  @Prop({ required: true, index: true })
  id: string;

  @Prop({ required: true, index: false })
  name: string;

  @Prop({ required: true, index: false })
  description: string;

  @Prop({ required: true, index: false })
  isUser: boolean;

  @Prop({ required: true, index: false })
  isPrivate: boolean;

  @Prop({ required: true, index: false, ref: "User" })
  usersID: string[];

  @Prop({ required: true, index: false, ref: "Messages" })
  messagesID: string[];

  @Prop({ required: true, index: false })
  membersCount: number;

  @Prop({ required: true, index: false })
  createdAt: string;
}

export const RoomSchema = SchemaFactory.createForClass(Room);
