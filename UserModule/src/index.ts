import { Router } from "express";
import { UserRepo } from "./repo/userRepo.js";
import { UserService } from "./service/userService.js";
import { UserController } from "./controller/userController.js";
const repo = new UserRepo();
const service = new UserService(repo);
const controller = new UserController(service);
const router = Router();

router.post("/", controller.createUser);
router.get("/", controller.getAllUsers);

export { router as userRouter };
