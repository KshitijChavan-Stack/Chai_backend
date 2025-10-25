import { asyncHandler } from "../utils/asyncHandler.js";
import apiError from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { apiResponse } from "../utils/apiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
  // ----------------logic to register the user---------------
  // get the data from the req object
  // if the user is already register then give me a res with user present -> EMAIL/USERNAME
  // CHECK FOR IMAGES ,CHECK FOR AVATAR
  // UPLOAD TO CLOUDINARY IF PRESENT-> UPLOADOnCLOUDINARY.JS
  // create user object ->  create entry in DB
  // remove passowrd and referesh token field from the response
  // as when we create a user we get the complete user object in return so we don't want to send it complete
  // check for user creation
  // return response

  const { fullName, email, username, password } = req.body;
  console.log(`Email : ${email}`); // just checking

  // i thought if just need to iterate over the array why can't
  // we use forEach directly  but it doesn't return anything
  // and as it not return anything the condition cannot be checked
  if (
    // multiple fields check
    [fullName, email, username, password].some((element) => {
      return !element?.trim(); // if anyone is empty this will return false and the
      // condition will not be satisfied
    })
  ) {
    throw new apiError(400, "All fields are required");
  }
  // this return .findOne() returns a promise
  // need to be awaited
  const existedUser = await User.findOne({
    $or: [{ email }, { username }],
  });
  //$or - MongoDB logical operator that returns
  //documents matching at least one condition in the array

  if (existedUser) {
    throw new apiError("User already registered with us", 409);
  }

  // we might have the files access or might not have
  // so we do optional chaining
  // this local paths can be come or maynot its not confirmed

  // but we need to upload these images to cloudinary
  const avatarLocalPath = req.files?.avatar[0]?.path;
  // Returns undefined if any step fails (safe)
  const coverImageLocalPath = req.files?.coverImage[0]?.path;
  // we also need to check if the avatar and cover image is present or not and send by user

  if (!avatarLocalPath) {
    throw new apiError(400, "Avatar is required");
  }

  // upload to cloudinary
  const avatarCloudinaryRes = await uploadOnCloudinary(avatarLocalPath);

  // this will return us a complete response from cloudinary
  if (!avatarCloudinaryRes) {
    throw new apiError(500, "Error in uploading avatar image");
  }
  // Only upload cover image if path exists
  let coverImageCloudinaryRes = null;
  if (coverImageLocalPath) {
    coverImageCloudinaryRes = await uploadOnCloudinary(coverImageLocalPath);
  }

  const user = await User.create({
    fullName,
    avatar: avatarCloudinaryRes.url,
    // we have checked the avatar but in case of
    //cover image we need to do like this
    // if its available upload otherwise send empty string
    coverImage: coverImageCloudinaryRes?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  // we select the specific fields with the findbyId method
  // and also we are excluding the password and refresh token fields
  // this can also be done when we are creating the user object
  const checkUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  /// this is the one that checks in the one thats just created
  if (!checkUser) {
    throw new apiError(
      500,
      "Went wrong in registering user please try again later"
    );
  }

  return res
    .status(201)
    .json(new apiResponse(201, checkUser, "user registered success"));
});

export { registerUser };
