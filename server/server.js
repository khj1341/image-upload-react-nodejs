const express = require("express");
const multer = require("multer");
const { v4: uuid } = require("uuid");
const mime = require("mime-types");
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "./uploads"),
  filename: (req, file, cb) =>
    cb(null, `${uuid()}.${mime.extension(file.mimetype)}`),
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

const app = express();
const PORT = 5000;

// 지정한 특정 폴더만 공개 (localhost:5000/uploads/filename 으로 접근 가능)
app.use("/uploads", express.static("uploads"));

// upload는 미들웨어
app.post("/upload", upload.single("imageTest"), (req, res) => {
  console.log(req.file);
  res.json(req.file);
});

app.listen(PORT, () => {
  console.log("Express server listening on PORT " + PORT);
});
