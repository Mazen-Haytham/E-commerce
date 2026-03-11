import { NextFunction, Request, Response } from "express";
import { UserService } from "../service/userService.js";
import { AppError } from "../../../../utils/AppError.js";
import { UserEmailParams, UserParams } from "../types/userTypes.js";
export class UserController {
  constructor(private readonly userService: UserService) {}
  createUser = async (req: Request, res: Response, next: NextFunction) => {
    console.log("iam here");
    
    try {
      const { email, firstName, lastName, password, phone, profilePic } =
        req.body;
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
      const limit: number = Number(req.query.limit) || 20;
      const cursor: string | undefined =
        (req.query.nextCursor as string) || undefined;
      const allUsers = await this.userService.getAllUsers(limit, cursor);
      return res.status(200).send({
        data: allUsers.data,
        nextCursor: allUsers.nextCursor,
      });
    } catch (err) {
      next(err);
    }
  };
  updateUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
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
  deactivateUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
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
  getUserById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
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
  getUserByEmail = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const email = req.params.email as string;
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

  /* Cart handlers */
  getCart = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const cart = await this.userService.getCart(id);
      return res.status(200).send({ status: "Success", data: cart });
    } catch (err) {
      next(err);
    }
  };

  addCartItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const { productVariantId, quantity } = req.body;
      const item = await this.userService.addToCart(
        id,
        productVariantId,
        quantity,
      );
      return res.status(200).send({ status: "Success", data: item });
    } catch (err) {
      next(err);
    }
  };

  updateCartItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const variantId = req.params.variantId as string;
      const { quantity } = req.body;
      const item = await this.userService.updateCartItem(
        id,
        variantId,
        quantity,
      );
      return res.status(200).send({ status: "Success", data: item });
    } catch (err) {
      next(err);
    }
  };

  removeCartItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const variantId = req.params.variantId as string;
      const item = await this.userService.removeCartItem(id, variantId);
      return res.status(200).send({ status: "Success", data: item });
    } catch (err) {
      next(err);
    }
  };

  clearCart = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const result = await this.userService.clearCart(id);
      return res.status(200).send({ status: "Success", data: result });
    } catch (err) {
      next(err);
    }
  };
}
