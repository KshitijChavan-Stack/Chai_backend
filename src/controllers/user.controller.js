import { asyncHandler } from "../utils/asyncHandler.js";
import apiError from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { apiResponse } from "../utils/apiResponse.js";

const generateAccessAndRefreshTokens = async (userid) => {
  try {
    const user = await User.findById(userid);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new apiError(
      500,
      "Something went wrong while generating access and refreshToken token"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  // ----------------logic to register the user---------------
  // get the data from the req object
  // if the user is already register then give me a res with user present -> EMAIL/USERNAME
  // CHECK FOR IMAGES ,CHECK FOR AVATAR
  // UPLOAD TO CLOUDINARY IF PRESENT-> UPLOADOnCLOUDINARY.JS
  // create user object ->  create entry in DB
  // remove passowrd and refreshToken token field from the response
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

  // ---------WE NEED TO STUDY THIS ONE----------
  // console.log(req.files);

  // but we need to upload these images to cloudinary
  const avatarLocalPath = req.files?.avatar[0]?.path;
  // Returns undefined if any step fails (safe)

  // this is done just becoz when we user dont send the
  // cover image it goes undifined and then a error
  // arise-> cannot read properties of undefined
  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files?.coverImage[0]?.path;
  }

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

  // this is one of the minor bug resolved
  // while creating thr user we're contacting with db and
  // this can take time thats why in our case we were getting a error
  // "something went wrong" -> but the user was getting created and saved in atlas
  // so we just added the await keyword so things work asper required
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

const loginUser = asyncHandler(async (req, res) => {
  //Steps we need to follow
  // 1. get the userdata to validate
  // 2.verify the user sends all the fields are filled
  // 3.make a final check if user exist or not if not send him to registration page
  // 4.if exist give him a access token and refresh token and give the access
  // 5.send cookie
  const { username, password, email } = req.body;
  console.log(email);

  // a little logic change wrap it and then give a exclamatory
  if (!(username || email)) {
    throw new apiError(400, "Username or email is required");
  }

  console.log(`UserName : ${username}`); // just checking

  const userexist = await User.findOne({
    // $or is a mongoDb operator
    $or: [{ username }, { email }],
  });

  if (!userexist) {
    throw new apiError(404, "User not found or maybe does not exist");
  }

  const passwordCheck = await userexist.isPasswordCorrect(password);
  if (!passwordCheck) {
    throw new apiError(401, "Password is incorrect , invalid crediancials!");
  }
  // might take time
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    userexist._id
  );

  const loggedInUser = User.findById(userexist._id).select(
    "-password -refreshToken"
  );
  console.log("Sending response-----");

  // this is just a object
  const options = {
    // this both tells only server can modify it
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new apiResponse(
        200,
        {
          // this is -> data
          // we are handling this case as when user want to
          // save access and refersh token from his side(localstorage)
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        // message
        "User logged In success"
      )
    );
});

const logoutUse = asyncHandler(async (req, res) => {
  //just bcoz we are not able to logout so we created a middleware
  // which can give use the user._id
  // first need to clear the cookies
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
      // when we get a return value we
      // get new updated value
    }
  );
  const options = {
    // this both tells only server can modify it
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new apiResponse(200, {}, "User Logged out Done"));
});

export { registerUser, loginUser, logoutUse };
