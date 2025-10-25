import multer from "multer";
import fs from "fs";
// in json data , we only want to store the file name and path
// not the entire file object
// thats why we use multer
// Create the folder if it doesn't exist (do this once when server starts)
const tempDir = "./public/temp";
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
  //{recursive:true} ->
  // Creates public folder first (if it doesn't exist)
  // Then creates temp folder inside it
  // Creates the entire path/hierarchy as needed
  // No error even if folders already exist
}
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, tempDir);
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // specify the file name uploded by user
  },
});

export const upload = multer({ storage: storage });
