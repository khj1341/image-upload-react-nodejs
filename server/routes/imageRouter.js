const { Router } = require("express");
const fs = require("fs");
const { promisify } = require("util");
const imageRouter = Router();
const { isValidObjectId } = require("mongoose");
const { v4: uuid } = require("uuid");
const mime = require("mime-types");

const { s3, getSignedUrl } = require("../aws");
const Image = require("../models/Image");
const { upload } = require("../middleware/imageUpload");

// const fileUnlink = promisify(fs.unlink);

imageRouter.get("/", async (req, res) => {
  // public 이미지들만 제공
  // offset vs cursor (pagination)
  // offset은 중간에 누가 추가 하거나 삭제하면 데이터 잘 안나옴
  // cursor는 $lt id로 하기 때문에 문제없음

  try {
    const { lastid } = req.query;
    if (lastid && !isValidObjectId(lastid)) throw new Error("invalid lastid");

    // [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    const images = await Image.find(
      lastid ? { public: true, _id: { $lt: lastid } } : { public: true }
    )
      .sort({ _id: -1 })
      .limit(20);
    res.json(images);
  } catch (err) {
    console.log(err);
    res.status(400).json({ message: err.message });
  }
});

imageRouter.get("/:imageId", async (req, res) => {
  try {
    const { imageId } = req.params;
    if (!isValidObjectId(imageId))
      throw new Error("옳바르지 않은 이미지id입니다.");
    const image = await Image.findOne({ _id: imageId });
    if (!image) throw new Error("해당 이미지는 존재하지 않습니다.");
    if (!image.public && (!req.user || req.user.id !== image.user.id))
      // _id로 비교하면 객체이기 때문에 그냥 비교 불가 => id(String)으로 비교
      throw new Error("권한이 없습니다.");
    res.json(image);
  } catch (err) {
    console.log(err);
    res.status(400).json({ message: err.message });
  }
});

imageRouter.post("/presigned", async (req, res) => {
  try {
    if (!req.user) throw new Error("권한이 없습니다.");
    const { contentTypes } = req.body;
    if (!Array.isArray(contentTypes)) throw new Error("invalid contentTypes");
    const presignedData = await Promise.all(
      contentTypes.map(async (contentType) => {
        const imageKey = `${uuid()}.${mime.extension(contentType)}`;
        const key = `raw/${imageKey}`;
        const presigned = await getSignedUrl({ key });
        return { imageKey, presigned };
      })
    );

    res.json(presignedData);
  } catch (err) {
    console.log(err);
    res.status(400).json({ message: err.message });
  }
});

imageRouter.post("/", upload.array("imageTest", 5), async (req, res) => {
  // 유저 정보, public 유무 확인
  try {
    if (!req.user) throw new Error("권한이 없습니다.");
    const { images, public } = req.body;

    const imageDocs = await Promise.all(
      images.map((image) =>
        new Image({
          user: {
            _id: req.user.id, // _id대신 id 로 쓰면 _id를 String으로 바꿔줌 (_id 쓰던지 id 쓰던지 크게 신경 안써도 됨... mongoose에서 알아서 처리해줌)
            name: req.user.name,
            username: req.user.username,
          },
          public,
          key: image.imageKey,
          originalFileName: image.originalname,
        }).save()
      )
    );

    res.json(imageDocs);
  } catch (err) {
    console.log(err);
    res.status(400).json({ message: err.message });
  }
});

// upload는 미들웨어
// imageRouter.post("/", upload.array("imageTest", 5), async (req, res) => {
//   // 유저 정보, public 유무 확인
//   try {
//     if (!req.user) throw new Error("권한이 없습니다.");
//     const images = await Promise.all(
//       req.files.map(async (file) => {
//         const image = await new Image({
//           user: {
//             _id: req.user.id, // _id대신 id 로 쓰면 _id를 String으로 바꿔줌 (_id 쓰던지 id 쓰던지 크게 신경 안써도 됨... mongoose에서 알아서 처리해줌)
//             name: req.user.name,
//             username: req.user.username,
//           },
//           public: req.body.public,
//           key: file.key.replace("raw/", ""),
//           originalFileName: file.originalname,
//         }).save();
//         return image;
//       })
//     );

//     res.json(images);
//   } catch (err) {
//     console.log(err);
//     res.status(400).json({ message: err.message });
//   }
// });

imageRouter.patch("/:imageId/like", async (req, res) => {
  // 유저 권한 확인
  try {
    if (!req.user) throw new Error("권한이 없습니다.");
    if (!isValidObjectId(req.params.imageId))
      throw new Error("옳바르지 않은 imageId입니다.");
    const image = await Image.findOneAndUpdate(
      { _id: req.params.imageId },
      { $addToSet: { likes: req.user.id } },
      { new: true }
    );
    res.json(image);
  } catch (err) {
    console.log(err);
    res.status(400).json({ message: err.message });
  }
  // like 중복 안되도록 확인
});

imageRouter.patch("/:imageId/unlike", async (req, res) => {
  // 유저 권한 확인
  try {
    if (!req.user) throw new Error("권한이 없습니다.");
    if (!isValidObjectId(req.params.imageId))
      throw new Error("옳바르지 않은 imageId입니다.");
    const image = await Image.findOneAndUpdate(
      { _id: req.params.imageId },
      { $pull: { likes: req.user.id } },
      { new: true }
    );
    res.json(image);
  } catch (err) {
    console.log(err);
    res.status(400).json({ message: err.message });
  }
  // like 중복 취소 안되도록 확인
});

imageRouter.delete("/:imageId", async (req, res) => {
  // 유저 권한 확인
  try {
    if (!req.user) throw new Error("권한이 없습니다.");
    const { imageId } = req.params;
    if (!isValidObjectId(imageId))
      throw new Error("옳바르지 않은 imageId입니다.");
    // 사진 삭제
    // 1. 데이터베이스에 있는 image document 삭제
    const image = await Image.findOneAndDelete({ _id: imageId });
    if (!image)
      return res.json({ message: "요청하신 사진은 이미 삭제되었습니다." });
    // 2. uploads 폴더에 있는 사진 데이터를 삭제 (node 모듈중에 fs(file system) 사용해야함)
    // fs.unlink는 콜백만 지원하고 promise 지원하지 않기 때문에 promisify 사용해서 await 사용 가능
    // local folder에서 삭제
    // await fileUnlink(`./uploads/${image.key}`);

    // s3에서 삭제
    s3.deleteObject(
      {
        Bucket: "image-upload-inflearn",
        Key: `raw/${image.key}`,
      },
      (error, data) => {
        if (error) throw error;
      }
    );

    res.json({ message: "요청하신 이미지가 삭제되었습니다.", image });
  } catch (err) {
    console.log(err);
    res.status(400).json({ message: err.message });
  }
});

module.exports = { imageRouter };
