import {Router} from "express"
import {AuthService} from "./service/authService.js"
import {AuthController} from "./controller/authController.js"
const authService=new AuthService();
const authController =new AuthController(authService);
const router =Router();

router.post("/login",authController.login);
router.post("/refresh",authController.refresh);

export {router as authRouter};