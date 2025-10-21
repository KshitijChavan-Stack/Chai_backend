import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

/*
1.Database hamesha another continent me hota hai isiliye async await lagan hota hai
2. database se baat karte samay error aa sakti hai isiliye try catch lagana jarurri hai
*/
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
    // we also need to see this methods that comes with
    // process object
  }
};

export default connectDB;
