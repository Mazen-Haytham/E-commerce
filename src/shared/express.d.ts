// src/shared/express.d.ts
import { token } from "../../Modules/Auth/types/authTypes";


declare global {
  namespace Express {
    interface Request {
      user?: token;
    }
  }
}
