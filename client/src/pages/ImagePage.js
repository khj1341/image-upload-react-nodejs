import React, { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { useHistory } from "react-router-dom";

import { ImageContext } from "../context/ImageContext";
import { AuthContext } from "../context/AuthContext";

const ImagePage = () => {
  const history = useHistory();
  const { imageId } = useParams("");
  const { images, setImages, setMyImages } = useContext(ImageContext); // images, myImage가 바뀌면 children component는 리렌더링됨. (Loading... =>  images 나열)
  const [me] = useContext(AuthContext);
  const [hasLiked, setHasLiked] = useState(false);
  const [isError, setIsError] = useState(false);

  const [image, setImage] = useState();

  const updateImage = (images, image) =>
    [...images.filter((image) => image._id !== imageId), image].sort((a, b) => {
      // createdAt으로 sorting하면 동시에 올린 이미지들의 순서끼리 바뀜
      if (b._id > a._id) return 1;
      else return -1;
    });

  const onSubmit = async () => {
    const result = await axios.patch(
      `/images/${imageId}/${hasLiked ? "unlike" : "like"}`
    );
    if (result.data.public)
      setImages((prevData) => updateImage(prevData, result.data));
    setMyImages((prevData) => updateImage(prevData, result.data));
    setHasLiked(!hasLiked);
  };

  const deleteHandler = async () => {
    try {
      if (!window.confirm("정말 해당 이미지를 삭제하시겠습니까?")) return;
      const result = await axios.delete(`/images/${imageId}`);
      toast.success(result.data.message);
      setImages((prevData) =>
        prevData.filter((image) => image._id !== imageId)
      );
      setMyImages((prevData) =>
        prevData.filter((image) => image._id !== imageId)
      );
      history.push("/");
    } catch (err) {
      console.log(err);
      toast.success(err.message);
    }
  };

  useEffect(() => {
    const img = images.find((image) => image._id === imageId);
    if (img) setImage(img);
  }, [imageId, images]);

  useEffect(() => {
    // 배열에 이미지가 존재하지 않으면 무조건 서버 호출
    if (image && image._id === imageId) return;
    axios
      .get(`/images/${imageId}`)
      .then(({ data }) => {
        setImage(data);
        setIsError(false);
      })
      .catch((err) => {
        setIsError(true);
        toast.error(err.response.data.message);
      });
  }, [imageId, image]);

  useEffect(() => {
    if (me && image?.likes.includes(me.userId)) setHasLiked(true);
  }, [me, image]);

  if (isError) return <h3>Error...</h3>;
  else if (!image) return <h3>Loading...</h3>;
  return (
    <div>
      <h3>Image Page - {imageId}</h3>
      <img
        style={{ width: "100%" }}
        alt={imageId}
        src={`https://d2mq49i9t15w6h.cloudfront.net/w600/${image.key}`}
      />
      <span>좋아요 {image.likes.length}</span>
      {me && image.user._id === me.userId && (
        <button
          style={{ float: "right", marginLeft: 10 }}
          onClick={deleteHandler}
        >
          삭제
        </button>
      )}
      <button style={{ float: "right" }} onClick={onSubmit}>
        {hasLiked ? "좋아요 취소" : "좋아요"}
      </button>
    </div>
  );
};

export default ImagePage;
