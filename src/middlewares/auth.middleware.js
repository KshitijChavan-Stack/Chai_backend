import { User } from "../models/user.model";
import apiError from "../utils/apiError";
import { asyncHandler } from "../utils/asyncHandler";
import jwt from "jsonwebtoken";

// sometime we see we dont use res object
// so we just make it as underscore
export const verifyJWT = asyncHandler(async (req, _, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer", "");

    if (!token) {
      throw new apiError(401, "Unauth request !");
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // we have decodedToken from model we have ._id
    const user = await User.findById(decodedToken?._id).select(
      "-password ,-refreshToken"
    );

    if (!user) {
      // TODE : discuss about frontend
      throw new apiError(401, "Invalid access Token");
    }
    // adding user
    req.user = user;
    next(); // we write this bcoz to tell after this is done,
    // run the next method
  } catch (error) {
    throw new apiError(401, "invalid access token");
  }
});
