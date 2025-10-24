//This is a Mongoose User Model with authentication
//features including password hashing, jwt token generation,
//and video watch history tracking.
import mongoose, { Schema, model } from "mongoose";
// destructuering the Schema from mongoose
import jwt from "jsonwebtoken";
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

// hook - pre-save middleware
userSchema.pre("save", async function (next) {
  //NOT arrow function because we need this keyword
  if (!this.isModified("password")) return next();
  //Prevents re-hashing on every save (like updating email)
  //this refers to the document being saved

  this.password = await bcrypt.hash(this.password, 10);
  //10: Salt rounds (higher = more secure but slower)
  next();
  //Tells Mongoose to continue with save operation
  // Without this, save would hang forever
});

//Instance Methods
userSchema.methods.isPasswordCorrect = async function (password) {
  // password -> plain text password
  // this.password -> hashed password
  return await bcrypt.compare(password, this.password);
  //bcrypt.compare(): Checks if plain password matches hash
  // returns true or false
};

userSchema.methods.generateAccessToken = function () {
  // this process won't take long time
  return jwt.sign(
    //Three parts: Header.Payload.Signature
    {
      //Data to encode in token
      //payload
      // key : value coming from DB
      _id: this._id,
      email: this.email,
      username: this.username,
      fullName: this.fullName,
    },
    //Used to verify token authenticity
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};

userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
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
