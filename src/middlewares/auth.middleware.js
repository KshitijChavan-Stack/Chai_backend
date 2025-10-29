// This middleware is a standard authentication pattern used in production Node.js applications with JWT!
// It's the gatekeeper that protects your routes from unauthorized access.
import { User } from "../models/user.model.js";
import apiError from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

// sometime we see we dont use res object
// so we just make it as underscore
export const verifyJWT = asyncHandler(async (req, _, next) => {
  try {
    const token = //Returns undefined if cookies doesn't exist
      req.cookies?.accessToken ||
      // this is For mobile apps, Postman, or API clients
      req.header("Authorization")?.replace("Bearer ", "");
    // .replace("Bearer", ""): Removes "Bearer " prefix

    if (!token) {
      throw new apiError(
        401,
        "Authentication required but missing/invalid request !"
      );
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // we have decodedToken from model we have ._id
    // decodedToken?._id ->Safe access (though jwt.verify already threw error if invalid)
    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );

    if (!user) {
      // TODO : discuss about frontend
      throw new apiError(401, "Invalid access Token");
    }
    // adding user
    // Adds custom property to req object
    req.user = user;

    // I'm done, move to next middleware/route
    next(); // we write this bcoz to tell after this is done,
    // run the next method
  } catch (error) {
    throw new apiError(401, "invalid access token");
  }
});
