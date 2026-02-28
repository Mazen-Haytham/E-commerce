import { Router } from "express";
import { UserService } from "./service/userService.js";
import { UserController } from "./controller/userController.js";
import { RepoFactory } from "./Components/RepoFactory.js";
import { UserImp } from "./Api/userImplementation.js";
import { authenticate } from "../../Auth/middleware/authMiddleWare.js";
import { authorize } from "../../Auth/middleware/authorizationMiddleWare.js";

const repo = RepoFactory.getUserRepo("prisma");
const service = new UserService(repo);
const userApi = new UserImp(service);
const controller = new UserController(service);
const router = Router();

router.get("/", authenticate, authorize(["ADMIN"]), controller.getAllUsers);
router.get("/:id", authenticate, authorize(["ADMIN"]), controller.getUserById);
router.get(
  "/email/:email",
  authenticate,
  authorize(["ADMIN"]),
  controller.getUserByEmail,
);
router.patch(
  "/:id",
  authenticate,
  authorize(["ADMIN", "CUSTOMER"]),
  controller.updateUser,
);
router.delete(
  "/:id",
  authenticate,
  authorize(["ADMIN", "CUSTOMER"]),
  controller.deactivateUser,
);
router.post("/", controller.createUser);

export { router as userRouter };
export { userApi };
