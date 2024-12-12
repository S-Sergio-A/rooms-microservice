import { IsArray, IsNotEmpty, IsString } from "class-validator";
import { Type } from "class-transformer";

export class UserDto {
  @IsNotEmpty()
  @IsString()
  _id: string;

  @IsNotEmpty()
  @IsString()
  username: string;
}

export class RecentMessageDto {
  @IsNotEmpty()
  @IsString()
  _id: string;

  @IsNotEmpty()
  @Type(() => UserDto)
  user: UserDto;

  @IsNotEmpty()
  @IsString()
  roomId: string;

  @IsNotEmpty()
  @IsString()
  text: string;

  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  attachment: string[];

  @IsNotEmpty()
  @IsString()
  timestamp: string;
}
