import { Schema, SchemaFactory, Prop } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

export type RightsDocument = Rights & Document;

@Schema()
class Rights {
  @Prop({ required: true, index: false, ref: "User", type: Types.ObjectId })
  user: Types.ObjectId;

  @Prop({ required: true, index: false, ref: "Room", type: Types.ObjectId })
  roomId: Types.ObjectId;

  @Prop({ required: true, index: false })
  rights: string[];
}

export const RightsSchema = SchemaFactory.createForClass(Rights);
