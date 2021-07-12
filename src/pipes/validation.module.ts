import { Module } from "@nestjs/common";
import { RoomsModule } from "../rooms/rooms.module";
import { ValidationService } from "./validation/validation.service";

@Module({
  imports: [RoomsModule],
  providers: [ValidationService],
  exports: [ValidationService]
})
export class ValidationModule {}
