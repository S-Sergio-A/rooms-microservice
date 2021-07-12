import { IsDefined, IsNotEmpty, IsString, IsNumber, IsArray, IsBoolean } from "class-validator";

export class RoomDto {
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  id: string;
  
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  name: string;
  
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  description: string;
  
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
  usersID: string[];
  
  @IsDefined()
  @IsNotEmpty()
  @IsArray()
  messagesID: string[];
  
  @IsDefined()
  @IsNotEmpty()
  @IsNumber()
  membersCount: number;
  
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  createdAt: string;
}
