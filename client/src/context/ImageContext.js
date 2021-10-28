import axios from "axios";
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AuthContext } from "./AuthContext";

export const ImageContext = createContext();

export const ImageProvider = (prop) => {
  const [me] = useContext(AuthContext);
  const [images, setImages] = useState([]); // public images
  const [myImages, setMyImages] = useState([]); // 개인 images

  const [isPublic, setIsPublic] = useState(true);
  const [imageUrl, setImageUrl] = useState("/images");
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState(false);

  // useRef는 1. HTML Element 찾기
  //         2. useState는 setState되면 Component가 리렌더링 되는데, useRef는 갖고 있는 state가 바뀌더라도 Component가 리렌더링되지 않음 (=> 1. 퍼포먼스 좋아짐. 2. 과거의 상태를 알기 위해서)
  //                => 그래서 setState가 없음
  const pastImageUrlRef = useRef();

  useEffect(() => {
    if (pastImageUrlRef.current === imageUrl) return; // useRef 변수는 deps에 안넣어줘도 됨
    setImageLoading(true);
    // proxy 처리가 돼있기 때문에 url 주소 다 쓸 필요없음
    axios
      .get(imageUrl)
      .then((result) =>
        isPublic
          ? setImages((prevData) => [...prevData, ...result.data])
          : setMyImages((prevData) => [...prevData, ...result.data])
      ) // setImages([...images, ...result.data]) 으로 하면 deps에 images 넣어줘야 하기 때문에 prevData 활용
      .catch((err) => {
        console.error(err);
        setImageError(err);
      })
      .finally(() => {
        setImageLoading(false);
        pastImageUrlRef.current = imageUrl; // 다 끝났을때 과거 URL 넣어줌
      });
  }, [imageUrl, isPublic]);

  useEffect(() => {
    if (me) {
      setTimeout(() => {
        axios
          .get("/users/me/images")
          .then((result) => setMyImages(result.data))
          .catch((err) => console.error(err));
      }, 0);
    } else {
      // 로그아웃 한 경우
      setMyImages([]);
      setIsPublic(true);
    }
  }, [me]);

  return (
    <ImageContext.Provider
      value={{
        images: isPublic ? images : myImages,
        setImages,
        setMyImages,
        isPublic,
        setIsPublic,
        setImageUrl,
        imageLoading,
        imageError,
      }}
    >
      {prop.children}
    </ImageContext.Provider>
  );
};
