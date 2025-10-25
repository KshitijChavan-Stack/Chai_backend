import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser"; // to access the cookies of the users browser
// from my server and also store

const app = express();

// just need to tell that we are using a middleware
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);
// ----------MAJOR CONFIG---------------
// we can configure that we accept the json and we
// also have some options to configure
app.use(express.json({ limit: "16kb" })); // this will parse the incoming req with json payload
app.use(express.urlencoded({ extended: true, limit: "16kb" })); // this will parse the incoming req with urlencoded payload
// extended -> you give objects inside objects
app.use(express.static("public")); // this will serve the static files from the public folder
// sometimes we want to store the files or folders or images that come
// so we can store them in public folder
app.use(cookieParser()); // this will parse the cookies from the incoming req

// routes will be here

import userRoutes from "./routes/user.routes.js";

// this is to prefix all the user routes with /api/user
// http://localhost:5000/api/v1/user/register
// http://localhost:5000/api/v1/user/login
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/register", userRoutes);
app.use((err, req, res, next) => {
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    errors: err.errors || [],
  });
});

export default app;
