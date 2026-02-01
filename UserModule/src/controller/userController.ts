import express, { Request, Response }  from "express";
import { UserService } from "../service/userService.js";

export class UserController {
    constructor(private readonly userService:UserService){}
   createUser=async(req:Request,res:Response) =>{
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
    return res.status(201).send(newUser);
  }
   getAllUsers=async(req:Request,res:Response)=>{
    const allUsers=await this.userService.getAllUsers();
    return res.status(200).send(allUsers)
  }
}
