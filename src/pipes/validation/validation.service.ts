import { Injectable } from "@nestjs/common";
import { v4 } from "uuid";
import { GlobalErrorCodes } from "../../exceptions/errorCodes/GlobalErrorCodes";
import { InternalFailure } from "../interfaces/internal-failure.interface";
import { RoomDto } from "../../rooms/dto/room.dto";
import { Room } from "../interfaces/room";

@Injectable()
export class ValidationService {
  async validateRoom(data: RoomDto) {
    let errors: Partial<Room & InternalFailure> = {};

    try {
      if (await this._isEmpty(data.id)) {
        data.id = v4();
      }

      if (await this._isEmpty(data.name)) {
        errors.name = GlobalErrorCodes.EMPTY_ERROR.value;
      }

      if (await this._isEmpty(data.description)) {
        data.description = "";
      }

      if (await this._isEmpty(data.isUser)) {
        errors.name = GlobalErrorCodes.EMPTY_ERROR.value;
      }

      if (await this._isEmpty(data.isPrivate)) {
        data.isPrivate = true;
      }

      if (await this._isEmpty(data.usersID)) {
        data.usersID = [];
      }

      if (await this._isEmpty(data.messagesID)) {
        data.messagesID = [];
      }

      if (await this._isEmpty(data.membersCount)) {
        data.membersCount = 2;
      }

      if (await this._isEmpty(data.createdAt)) {
        const date = Date.now();
        const localTime = new Date(date).toLocaleTimeString("ru-RU").substring(0, 5);
        const localDate = new Date(date).toLocaleDateString("ru-RU");

        data.createdAt = `${localTime} ${localDate}`;
      }
    } catch (err) {
      errors.internalFailure = err;
    }

    return {
      errors,
      isValid: await this._isEmpty(errors)
    };
  }

  private async _isEmpty(obj) {
    if (obj !== undefined && obj !== null) {
      let isString = typeof obj === "string" || obj instanceof String;
      if ((typeof obj === "number" || obj instanceof Number) && obj !== 0) {
        return false;
      }
      return (
        obj === "" ||
        obj === 0 ||
        (Object.keys(obj).length === 0 && obj.constructor === Object) ||
        obj.length === 0 ||
        (isString && obj.trim().length === 0)
      );
    } else {
      return "type is undefined or null";
    }
  }
}
