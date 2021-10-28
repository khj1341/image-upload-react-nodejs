const sharp = require("sharp"); // npm install --arch=x64 --platform=linux sharp    로 인스톨 해줘야됨(lambda가 linux기반이라서)
const aws = require("aws-sdk"); // lambda에는 기본적으로 aws-sdk가 내장되어있어서 npm i aws-sdk 안해줘도됨
const s3 = new aws.S3();

// name 은 폴더 이름
const transformationOptions = [
  { name: "w140", width: 140 },
  { name: "w600", width: 600 },
];

exports.handler = async (event) => {
  try {
    const Key = event.Records[0].s3.object.key; // 아래 정보에 Key로 그대로 넣기 위해서 대문자 K
    const keyOnly = Key.split("/")[1]; // raw 제거
    console.log(`Image Resizing: ${keyOnly}`);
    const image = await s3
      .getObject({
        Bucket: "image-upload-inflearn",
        Key,
      })
      .promise(); // promise를 return하지 않기 때문에 .promise() 해줌 (js문법 아닌 s3 제공 메서드)

    await Promise.all(
      transformationOptions.map(async ({ name, width }) => {
        try {
          const newKey = `${name}/${keyOnly}`;
          const resizedImage = await sharp(image.Body)
            .rotate()
            .resize({ width, height: width, fit: "outside" }) // 이렇게 해줘야지 가로세로 길이 다를때  이미지 깨지지 않고 잘 맞춰서 리사이징됨
            .toBuffer(); // image.Body : image buffer, parameter없이 rotate() 를 하면 사진 업로드했을 때 각도와 동일하게 끔 설정이 됨(간혹 각도가 바뀌어있는 경우 대비)

          await s3
            .putObject({
              Bucket: "image-upload-inflearn",
              Body: resizedImage,
              Key: newKey,
            })
            .promise();
        } catch (err) {
          throw err;
        }
      })
    );

    return {
      statusCode: 200,
      body: event,
    };
  } catch (err) {
    console.log(err);
    return {
      statusCode: 500,
      body: event,
    };
  }
};
