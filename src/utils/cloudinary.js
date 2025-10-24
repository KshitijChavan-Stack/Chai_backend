import { v2 as cloudinary } from "cloudinary";
import fs from "fs"; // file system module to handle file operations

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, // Your Cloudinary cloud name
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (filePath) => {
  try {
    if (!filePath) return null;
    // upload file to cloudinary
    const res = await cloudinary.uploader.upload(filePath, {
      resource_type: "auto", // this will automatically detect the file type
    });
    // file has been uploaded, now we can remove it from the server
    console.log("upload on cloudinary success", res.url); // gives us a public URL
    return res; // we send the entire response object back, whatever they want they can have
  } catch (error) {
    fs.unlinkSync(filePath); // remove the locally saved temp file from server in case of operation failure
    throw null;
  }
};

export { uploadOnCloudinary };
