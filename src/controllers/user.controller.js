import { asyncHandler } from "../utils/asyncHandler.js";
import apiError from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { apiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";
import { deleteFromCloudinary } from "../utils/deleteFromCloudinary.js";
import { Subscription } from "../models/subscription.model.js";
import mongoose from "mongoose";

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
  /*
  Why This Causes Circular Reference Error:
  Without await, loggedInUser is a Mongoose Query object
  (not the actual user data), which contains circular references.
  When you try to convert it to JSON in the response, 
  it fails with "Converting circular structure to JSON".
  */
  const loggedInUser = await User.findById(userexist._id).select(
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

const refreshAccessToken = asyncHandler(async (req, res) => {
  // this is about refreshing the accesstoken by sending our refresh token
  // the user refresh token is also saved in db
  // so we'll cross check if the user sended token and db token is same
  // if its same then access token is refresh (a new one)

  // full token enrypted
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new apiError("No refresh token found", 401);
  }

  try {
    const decodedRefreshToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedRefreshToken?._id);

    if (!user) {
      throw new apiError("Invalid refreshToken", 401);
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new apiError("RefreshToken is expired or used", 401);
    }

    const options = {
      secure: true,
      httpOnly: true,
    };

    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshTokens(user._id, options);

    return res
      .status(200)
      .cookie("accessToken", accessToken)
      .cookie("refreshToken", newRefreshToken)
      .json(
        new apiResponse(
          200,
          {
            accessToken,
            refreshToken: newRefreshToken,
          },
          "AccessToken refreshed success"
        )
      );
  } catch (error) {
    throw new apiError(error?.message || "Invalid refresh Token", 401);
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  // can also be added
  // if (newPassword !== confirmPassword) {
  //   throw new apiError("confirm password should be same !", 401)
  // }

  const user = await User.findById(req.user._id);

  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new apiError("oldPassword verification failed", 400);
  }

  user.password = newPassword;
  // This is a database operation
  await User.save({ validateBeforeSave: false }); //pre hooked will be called

  return res
    .status(200)
    .json(new apiResponse(200, {}, "Password Changed Success !"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new apiResponse(200, req.user, "Current user fetched successfully"));
});

// text based data updated
const updateAccountDetails = asyncHandler(async (req, res) => {
  // we can take whatever we want here
  const { fullName, email } = req.body;

  if (!fullName || !email) {
    throw new apiError("all field should be provided", 400);
  }

  // bcoz we have multiple things to update so we use
  // this method
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        // we can do both ways
        fullName,
        email: email,
      },
    },
    { new: true } // after the updatation the information is returned!!
  ).select("-password");

  // user.findById(user._id).select("-password")

  res.status(200).json(new apiResponse(200, user, "Account details updated"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  // Get the new avatar file path
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new apiError("Avatar file missing", 400);
  }

  // Get the old avatar URL before updating
  const user = await User.findById(req.user?._id);

  if (!user) {
    throw new apiError("User not found", 404);
  }

  const oldAvatarUrl = user.avatar;

  // Upload new avatar to Cloudinary
  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar) {
    throw new apiError("Error while uploading to cloudinary avatar");
  }

  // Update user with new avatar
  const updatedUser = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true }
  ).select("-password");

  // Delete old avatar from Cloudinary (if it exists)
  if (oldAvatarUrl) {
    // Extract public_id from the Cloudinary URL
    //  split('/') - Split by slashes: ['https:', '', 'res.cloudinary.com', ..., 'abc123def.jpg']
    // .pop() - Get last element: 'abc123def.jpg'
    // .split('.')[0] - Remove extension: 'abc123def'
    const publicId = oldAvatarUrl.split("/").pop().split(".")[0];
    // ex -> https://res.cloudinary.com/demo/image/upload/v1234567890/abc123def.jpg
    await deleteFromCloudinary(publicId);
  }

  res
    .status(200)
    .json(new apiResponse(200, updatedUser, "Avatar updated successfully"));
});
const updateUserCoverImage = asyncHandler(async (req, res) => {
  // we just want one file so we write .file
  const coverImageLocalPath = req.file?.path;

  if (!coverImageLocalPath) {
    throw new apiError("CoverImage file missing", 400);
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!coverImage.url) {
    throw new apiError("Error while uploding to cloudinary CoverImage ");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      // we just need to update one
      $set: {
        coverImage: coverImage.url, // only CoverImage will be the complete object
      },
    },
    { new: true }
  ).select("-password");

  res.status(200).json(new apiResponse(200, user, "avatar update success"));
});

// aggregation pipeline
// why Aggregation ->  Performs multiple operations in one query
const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;

  if (!username?.trim()) {
    throw new apiError("No username found", 400);
  }
  /*
  Why aggregate? Because we need to:
  -Join data from the Subscription collection
  -Calculate counts
  -Add computed fields
  -All in ONE efficient database query
  */
  // we get the arrays
  const channel = await User.aggregate([
    {
      // matching the user
      $match: {
        // just a safty major if we dont get the username
        username: username?.toLowerCase(),
      },
    },
    {
      //$lookup = SQL JOIN - Combines data from different collections

      // finding the count of subscribers
      $lookup: {
        //Finds all subscriptions WHERE channel === this user's _id
        from: "subscription",
        localField: "_id",
        foreignField: "channel",
        as: "subs",
      },
    },
    {
      // to how many we have subscribed to
      $lookup: {
        //Finds all subscriptions WHERE subscriber === this user's _id
        from: "subscription",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      // new fields added in the orignal user object
      $addFields: {
        SubscribersCount: {
          $size: "$subs",
        },
        channelsSubscribedToCount: {
          $size: "$subscribedTo",
        },
        //Logic: "Is the current user one of this channel's subscribers?"
        isSubscribed: {
          $cond: {
            // $in will see in objects and aswell as arrays
            // $in -> checks if the logged-in user's ID exists in that array
            if: { $in: [req.user?._id, "$subs.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      //---final projection---
      // gives the projection that we'll not give all the values thats showing
      // we'll give selected things only
      $project: {
        //Only returns specified fields (like .select() in Mongoose)
        fullName: 1,
        username: 1,
        SubscribersCount: 1,
        channelsSubscribedToCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
        email: 1,
      },
    },
  ]);
  // we should ones log "channel"
  // so we can see what aggregate returns
  // we'll get a array
  //aggregate() ALWAYS returns an array, even if only one document matches!

  if (!channel?.length) {
    throw new apiError("channel does not exist ! ", 404);
  }

  return res
    .status(200)
    .json(new apiResponse(200, channel[0], "User channel fetched success"));
});

const getUserWatchHistory = asyncHandler(async (req, res) => {
  // here we get a string not a mongodb ID
  // then further we can use it with findById()/etc
  // mongoose takes care behind the scene
  // req.user._id

  // WHAT WE ARE DOIN HERE
  /*
  Users -> watchhistroy -> get all Videos docs -> we have owner there -use subpipeline add another lookup ->
  go back to user and get all values -> bcoz we have so much things we use $project(only send perticualr things)
  -> we get the array -> we add another pipeline where it adds fields take the first Object
  */
  const user = await User.aggregate([
    {
      // aggregation pipeline code goes direct ! mongoose doesn't see here
      $match: {
        // _id: req.user._id
        // here se how we need to use the mongoose object
        _id: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      // now we have numbers of documents from the video model
      $lookup: {
        from: "Video",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            // subPipeline concept
            $lookup: {
              from: "User",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  // another sub pipeline for
                  // the things only to show
                  // from the doucment we got
                  $project: {
                    fullName: 1,
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          // the pervious pipeline gives us a array and then we
          // have to dig into it
          {
            $addFields: {
              // with this we'll overwrite the existing fiield only
              owner: {
                // in array we want first element
                $first: "$owner", // this will give us direct object to the frontend
              },
            },
          },
        ],
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new apiResponse(200, "Watch history found success", user[0].watchHistory)
    );
});

export {
  registerUser,
  loginUser,
  logoutUse,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getUserWatchHistory,
};
