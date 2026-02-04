import { Router } from "express";
import { UserService } from "./service/userService.js";
import { UserController } from "./controller/userController.js";
import { RepoFactory } from "./Components/RepoFactory.js";
import { UserImp } from "./Api/userImplementation.js";
const repo = RepoFactory.getUserRepo("prisma");
const service = new UserService(repo);
const userApi = new UserImp(service);
const controller = new UserController(service);
const router = Router();

router.get("/", controller.getAllUsers);
router.get("/:id", controller.getUserById);
router.get("/email/:email", controller.getUserByEmail);
router.patch("/:id", controller.updateUser);
router.delete("/:id", controller.deactivateUser);
router.post("/", controller.createUser);

export { router as userRouter };
export { userApi };
