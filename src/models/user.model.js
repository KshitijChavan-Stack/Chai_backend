import mongoose, { Schema, model } from "mongoose";
// destructuering the Schema from mongoose
import { Jwt } from "jsonwebtoken";
// jwt is a bearer token
// who ever has the token can access the data
import bcrypt from "bcrypt";

const userSchema = new Schema(
  {
    watchHistory: [
      {
        type: Schema.Types.ObjectId,
        ref: "Video",
      },
    ],
    username: {
      type: String,
      required: true,
      lowercase: true,
      unique: true,
      trim: true,
      // when we want to enable optimise searching feild
      // index->true
      index: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      unique: true,
      trim: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    avatar: {
      type: String, // useing cloudinary for image hosting
      required: true,
    },
    coverImage: {
      type: String, // useing cloudinary for image hosting
    },
    password: {
      type: String, // need to be encrypted
      required: [true, "password is required"],
    },
    refreshToken: {
      type: String,
    },
  },
  { timestamps: true }
  // createdAt, updatedAt
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.isPasswordCorrect = async function (password) {
  // password -> plain text password
  // this.password -> hashed password
  return await bcrypt.compare(password, this.password);
  // returns true or false
};

userSchema.methods.generateAccessToken = function () {
  // this process won't take long time
  return Jwt.sign(
    {
      //payload
      // key : value coming from DB
      _id: this._id,
      email: this.email,
      username: this.username,
      fullName: this.fullName,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};

userSchema.methods.generateRefreshToken = function () {
  return Jwt.sign(
    {
      // bcoz the referesh token is refereshed
      // again and again we don't need much info
      //payload
      // key : value coming from DB
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};

export const User = model("User", userSchema);
