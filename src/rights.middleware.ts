import { NestMiddleware, HttpStatus, Injectable, HttpException, Req, Res, Next } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { RoomsService } from "./rooms/rooms.service";

@Injectable()
export class RightsMiddleware implements NestMiddleware {
  constructor(private readonly roomService: RoomsService) {}

  async use(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    if (!!req.headers["rights"] && (await this.roomService.verifyRights(req))) {
      next();
    } else {
      throw new HttpException("You don't have rights for this action.", HttpStatus.UNAUTHORIZED);
    }
  }
}
