import { NextFunction, Request, Response } from "express";
import { UserService } from "../service/userService.js";
import { AppError } from "../../../../src/utils/AppError.js";
import { UserEmailParams, UserParams } from "../types/userTypes.js";
export class UserController {
  constructor(private readonly userService: UserService) {}
  createUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, firstName, lastName, password, phone, profilePic } =
        req.body;
      console.log(req.body);
      const newUser = await this.userService.createUser({
        email,
        firstName,
        lastName,
        password,
        phone,
        profilePic,
      });

      return res.status(201).send({
        status: "Success",
        message: "User Created SuccessFully",
        data: newUser,
      });
    } catch (err: AppError | any) {
      next(err);
    }
  };
  getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const allUsers = await this.userService.getAllUsers();
      return res.status(200).send(allUsers);
    } catch (err) {
      next(err);
    }
  };
  updateUser = async (
    req: Request<UserParams>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const id = req.params.id;
      console.log(id);
      const updatedUser = await this.userService.updateUser(id, req.body);
      return res.status(200).send({
        status: "Success",
        message: "User Data Is Updated Successfully",
        data: updatedUser,
      });
    } catch (err) {
      next(err);
    }
  };
  deactivateUser = async (
    req: Request<UserParams>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const id = req.params.id;
      const deactivatedUserId: string | undefined =
        await this.userService.deactivateUser(id);
      if (!deactivatedUserId) throw new AppError("Something Went Wrong", 500);
      return res.status(200).send({
        status: "Success",
        message: "User Deleted Successfully",
      });
    } catch (err) {
      next(err);
    }
  };
  getUserById = async (
    req: Request<UserParams>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const id = req.params.id;
      const user = await this.userService.findUserById(id);
      if (!user) throw new AppError("User Not Found", 404);
      return res.status(200).send({
        status: "Success",
        data: user,
      });
    } catch (err) {
      next(err);
    }
  };
  getUserByEmail = async (
    req: Request<UserEmailParams>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const email = req.params.email;
      console.log(email);
      const user = await this.userService.findUserByEmail(email);
      if (!user) throw new AppError("User Not Found", 404);
      return res.status(200).send({
        status: "Success",
        data: user,
      });
    } catch (err) {
      next(err);
    }
  };
  
}
