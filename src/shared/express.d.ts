// src/types/express.d.ts
import { JwtPayload } from "../utils/jwt.ts";

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}
