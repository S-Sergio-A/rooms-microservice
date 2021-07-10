import { IsDefined, IsNotEmpty, IsString, IsNumber, IsArray, IsBoolean } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class RoomDto {
  @ApiProperty({
    example: "13f4fwe4",
    description: "ID of the message.",
    format: "string"
  })
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  id: string;

  @ApiProperty({
    example: "Saddam Hussein's Cave",
    description: "Name of the chat.",
    format: "string"
  })
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    example: "Я продаю лучшие хергитские гобелены. Не желаете взглянуть?",
    description: "The description of the chat.",
    format: "string"
  })
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({
    example: "false",
    description: "Is it a personal one-to-one chat or a group chat.",
    format: "string"
  })
  @IsDefined()
  @IsNotEmpty()
  @IsBoolean()
  isUser: boolean;

  @ApiProperty({
    example: "false",
    description: "Is it a private chat room.",
    format: "string"
  })
  @IsDefined()
  @IsNotEmpty()
  @IsBoolean()
  isPrivate: boolean;

  @ApiProperty({
    example: "[fgf123d123, hgh234fgf, 23h56h68jk ...]",
    description: "The list of users which have entered the chat.",
    format: "string"
  })
  @IsDefined()
  @IsNotEmpty()
  @IsArray()
  usersID: string[];

  @ApiProperty({
    example: "[fgf123d123, hgh234fgf, 23h56h68jk ...]",
    description: "The list of messages that have been sent in the chat.",
    format: "string"
  })
  @IsDefined()
  @IsNotEmpty()
  @IsArray()
  messagesID: string[];

  @ApiProperty({
    example: "16",
    description: "The number of current members.",
    format: "string"
  })
  @IsDefined()
  @IsNotEmpty()
  @IsNumber()
  membersCount: number;

  @ApiProperty({
    example: "13:15 06.07.2021",
    description: "The timestamp of the chat creation.",
    format: "string"
  })
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  createdAt: string;
}
