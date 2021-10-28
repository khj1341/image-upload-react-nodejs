import React, { useContext, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";

import { ImageContext } from "../context/ImageContext";
import { AuthContext } from "../context/AuthContext";
import Image from "../components/Image";
import "./ImageList.css";

const ImageList = () => {
  const {
    images,
    isPublic,
    setIsPublic,
    setImageUrl,
    imageLoading,
    imageError,
  } = useContext(ImageContext);
  const [me] = useContext(AuthContext);
  const elementRef = useRef(null);

  // useEffect: deps 에는 함수를 새로 만들어줘야 하는 조건을 넣어줌 (원래 다른것들이 바뀌어서 component가 리렌더링되면 새로 만들어짐(재선언됨))
  const loadMoreImages = useCallback(() => {
    if (images.length === 0 || imageLoading) return;
    const lastImageId =
      images.length > 0 ? images[images.length - 1]._id : null;
    setImageUrl(`${isPublic ? "" : "/users/me"}/images?lastid=${lastImageId}`);
  }, [images, imageLoading, isPublic, setImageUrl]); // deps에는 객체나 배열 같은 것 보다 Primitive Value 넣어주는게 좋음, 모두 다 호출된 시점에서는 lastImageId, imageLoading이 바뀌지 않기 때문에 loadMoreImages가 호출되지 않음

  useEffect(() => {
    if (!elementRef.current) return;
    const observer = new IntersectionObserver(([entry]) => {
      // entry 는 디스트럭쳐링으로 뽑아낸거
      console.log("isIntersecting", entry.isIntersecting);
      if (entry.isIntersecting) loadMoreImages();
    });
    observer.observe(elementRef.current);
    // 새로 로딩되면서 맨아래것들이 observer에 계속 누적돼서 쌓이는데  제일 아래것만 observer에 등록하기 위해서 disconnect 작업 해줌
    return () => observer.disconnect();
  }, [loadMoreImages]);

  const imgList = images.map((image, index) => (
    <Link
      key={image.key}
      to={`/images/${image._id}`}
      ref={index + 5 === images.length ? elementRef : undefined} // + 1 로 하면 맨 마지막 거 감지, +5 하면 맨 아래보다 위에거 감지
    >
      <Image
        imageUrl={`https://d2mq49i9t15w6h.cloudfront.net/w140/${image.key}`}
      />
      {/* <img
        alt=""
        src={`https://image-upload-inflearn.s3.ap-northeast-2.amazonaws.com/w140/${image.key}`} // upload됐을 당시에는 raw폴더에는 이미지가 있지만, 화면이 refresh되는것보다 느리게 lambda에서 이미지 리사이징을 해주기 때문에 이미지가 처음에 안뜸 => 윗줄처럼 상태관리 통해서 관리해줄것임
      /> */}
    </Link>
  ));

  return (
    <div>
      <h3 style={{ display: "inline-block", marginRight: 10 }}>
        Image List ({isPublic ? "공개" : "개인"} 사진)
      </h3>
      {me && (
        <button onClick={() => setIsPublic(!isPublic)}>
          {isPublic ? "개인" : "공개"} 사진 보기
        </button>
      )}
      <div className="image-list-container">{imgList}</div>
      {imageError && <div>Error...</div>}
      {imageLoading && <div>Loading...</div>}
    </div>
  );
};

export default ImageList;
