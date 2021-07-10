import { Rights } from "./utils/rights";

declare global {
  namespace Express {
    export interface Request {
      rights: string[];
      user: {
        userId: string;
      };
    }
  }
}
