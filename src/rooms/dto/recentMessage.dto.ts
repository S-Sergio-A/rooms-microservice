import { IsDefined, IsNotEmpty, IsString, IsArray } from "class-validator";

export class RecentMessageDto {
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  _id: string;

  @IsDefined()
  @IsNotEmpty()
  user: {
    _id: string;
    username: string;
  };

  @IsDefined()
  @IsNotEmpty()
  @IsString()
  roomId: string;

  @IsDefined()
  @IsNotEmpty()
  @IsString()
  text: string;

  @IsDefined()
  @IsNotEmpty()
  @IsArray()
  attachment: string[];

  @IsDefined()
  @IsNotEmpty()
  @IsString()
  timestamp: string;
}
