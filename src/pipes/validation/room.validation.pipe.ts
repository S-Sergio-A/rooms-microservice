import { PipeTransform, ArgumentMetadata, BadRequestException, Injectable } from "@nestjs/common";
import { ValidationService } from "./validation.service";
import { RpcException } from "@nestjs/microservices";

@Injectable()
export class RoomValidationPipe implements PipeTransform {
  async transform(value, metadata: ArgumentMetadata) {
    if (!value) {
      throw new BadRequestException("No data submitted");
    }

    if (!metadata.metatype) {
      return value;
    }

    const { errors, isValid } = await ValidationService.prototype.validateRoom(value);

    if (isValid) {
      return value;
    } else {
      throw new RpcException(errors);
    }
  }
}
