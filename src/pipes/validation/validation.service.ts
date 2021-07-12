import { Injectable } from "@nestjs/common";
import { RoomsService } from "../../rooms/rooms.service";
import { InternalFailure } from "../interfaces/internal-failure.interface";

@Injectable()
export class ValidationService {
  constructor(private readonly roomsService: RoomsService) {}

  async verifyRights(data) {
    let errors: Partial<{ rights: string } & InternalFailure> = {};
    try {
      if (!data["rights"] || !(await this.roomsService.verifyRights(data["rights"], data.userId))) {
        errors.rights = "You don't have rights for this action.";
      }
    } catch (e) {
      errors.internalFailure = e;
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
