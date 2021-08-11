import { IsDefined, IsNotEmpty, IsString, IsNumber, IsArray, IsBoolean, IsOptional, IsUrl } from "class-validator";
import { Types } from "mongoose";

export class RoomDto {
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsDefined()
  @IsNotEmpty()
  @IsString()
  @IsOptional()
  description?: string;

  @IsDefined()
  @IsNotEmpty()
  @IsString()
  @IsUrl()
  @IsOptional()
  photo?: string;

  @IsDefined()
  @IsNotEmpty()
  @IsBoolean()
  isUser: boolean;

  @IsDefined()
  @IsNotEmpty()
  @IsBoolean()
  isPrivate: boolean;

  @IsDefined()
  @IsNotEmpty()
  @IsArray()
  usersID: Types.ObjectId[];

  @IsDefined()
  @IsNotEmpty()
  @IsArray()
  messagesID: Types.ObjectId[];

  @IsDefined()
  @IsNotEmpty()
  @IsNumber()
  membersCount: number;

  @IsDefined()
  @IsNotEmpty()
  @IsString()
  createdAt: string;
}
