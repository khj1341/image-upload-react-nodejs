const multer = require("multer");
const { v4: uuid } = require("uuid");
const mime = require("mime-types");
const multerS3 = require("multer-s3");
const { s3 } = require("../aws");

// local에 저장
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => cb(null, "./uploads"),
//   filename: (req, file, cb) =>
//     cb(null, `${uuid()}.${mime.extension(file.mimetype)}`),
// });

// AWS S3에 저장
const storage = multerS3({
  s3,
  bucket: "image-upload-inflearn",
  key: (req, file, cb) =>
    cb(null, `raw/${uuid()}.${mime.extension(file.mimetype)}`), // folder 이름 써줘야됨(raw)
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (["image/png", "image/jpeg"].includes(file.mimetype)) cb(null, true);
    else cb(new Error("invalid file type."), false);
  },
  limits: {
    fileSize: 1024 * 1024 * 5, // 5mb
  },
});

module.exports = { upload };
