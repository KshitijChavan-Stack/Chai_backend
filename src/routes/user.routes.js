// all user routes will be defined here
import { Router } from "express";
import {
  loginUser,
  logoutUse,
  registerUser,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// here we're just injecting the multer middleware
// which ever method is getting executed just before that
// inject it in
router.route("/register").post(
  //"Injecting" = Adding middleware before route handler
  //Order matters: upload runs first, then registerUser
  upload.fields([
    //upload.fields(): Accepts multiple different file fields
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);

router.route("/login").post(loginUser);

//secure routes
router.route("/logout").post(verifyJWT, logoutUse);
export default router;
