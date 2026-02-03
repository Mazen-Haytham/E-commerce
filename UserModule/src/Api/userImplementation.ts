import { userApi } from "./userApi.js";
import { UserService } from "../service/userService.js";
export class UserImp implements userApi {
  constructor(private readonly UserService: UserService) {}
  async findUserById(userId: string) {
    const user = await this.UserService.findUserById(userId);
    return user;
  }
  async findUserByEmail(email: string) {
    const user = await this.UserService.findUserByEmail(email);
    return user;
  }
}
