import { NextFunction, Request, Response } from "express";
import { UserService } from "../service/userService.js";
import { AppError } from "../../../src/utils/AppError.js";
import { UserParams } from "../types/userTypes.js";
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
  updateUser=async(req:Request<UserParams>,res:Response,next:NextFunction)=>{
    try{
      const id=req.params.id;
      console.log(id);
      const updatedUser=await this.userService.updateUser(id,req.body);
      return res.status(200).send({
        status:"Success",
        message:"User Data Is Updated Successfully",
        data:updatedUser
      })
    }catch(err){
      next(err);
    }
  }
}
