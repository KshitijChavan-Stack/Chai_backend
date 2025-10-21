// when we try to talk to db the problems can occur
// wrapit in try catch(asycn-await) or take promices
//"Database is always in different continent"

// this syntax polute the consistance of the code
// require("dotenv").config({ path: "./env" });

// for using this we need to do add some experimental feature
// in package.json
// -> "scripts": {
//   "dev": "nodemon -r dotenv/config --experimental-json-modules src/index.js"
// },
// import mongoose from "mongoose";
// import { DB_NAME } from "./constants";
import dotenv from "dotenv";
import connectDB from "./db/dbConnect.js";
import app from "./app.js";

dotenv.config({
  path: "./env",
});

// as this is a async function it returns a promice
// and as its a promice we can use then-catch
connectDB()
  .then(() => {
    // this is a precheck
    app.on("error", (error) => {
      console.log("ERROR: ", error);
      throw error;
    });

    app.listen(process.env.PORT || 8000, () => {
      console.log(`app listening on port-> ${process.env.PORT}`);
    });
  })
  .catch((error) => {
    console.error("MONGO DB Failed to connect in index.js: ", error);
    process.exit(1);
  });

//--------------------first approch------------------------
/*
import express from "express";
const app = express();

(async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);

    app.on("error", (error) => {
      console.log("ERROR: ", error);
      throw error;
    });

    app.listen(process.env.PORT, () => {
      console.log(`app listening on port-> ${process.env.PORT}`);
    });
  } catch (error) {
    console.error("ERROR: ", error);
    throw error;
  }
})();
*/
