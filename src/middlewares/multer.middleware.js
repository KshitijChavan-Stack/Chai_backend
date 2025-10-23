import multer from "multer";

// in json data , we only want to store the file name and path
// not the entire file object
// thats why we use multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp"); // specify the destination directory
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // specify the file name uploded by user
  },
});

export const upload = multer({ storage: storage });
