import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`
    );

    // do concole log ones this connection instance
    console.log(
      // this is done bcoz what if we connect to some wrong host
      `\n MongoDB connected !!! DB host -> ${connectionInstance.connection.host}`
    );
  } catch (error) {
    // we must also check with wrong db auth so we can see the error handling'
    // with debuging
    console.error("mongo DB connection FAILED: ", error);
    process.exit(1);
  }
};

export default connectDB;
