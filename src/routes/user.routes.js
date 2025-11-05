// all user routes will be defined here
import { Router } from "express";
import {
  loginUser,
  logoutUse,
  registerUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getUserWatchHistory,
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
router.route("/refreshToken").post(refreshAccessToken);

router.route("/changePassword").post(verifyJWT, changeCurrentPassword);
router.route("/getCurrentUser").get(verifyJWT, getCurrentUser);
// patch is used bcoz in post all details will be updated
router.route("/updateUser-Details").patch(verifyJWT, updateAccountDetails);
// we use the second middleware as multer object with single() cuz only one file is coming
router
  .route("/updateAvatar")
  .patch(verifyJWT, upload.single("avatar"), updateUserAvatar);
router
  .route("/coverImageUpdate")
  .patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage);
router.route("/c/:username").get(verifyJWT, getUserChannelProfile);
router.route("/watchHistory").get(verifyJWT, getUserWatchHistory);
export default router;
