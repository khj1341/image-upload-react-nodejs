import React, { useContext } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

import { AuthContext } from "../context/AuthContext";

const ToolBar = () => {
  const [me, setMe] = useContext(AuthContext);

  const logoutHandler = async () => {
    try {
      await axios.patch("/users/logout");
      setMe();
      toast.success("로그아웃");
    } catch (err) {
      console.error(err);
      toast.error(err.message);
    }
  };

  return (
    <div>
      {/* a태그를 쓰면 refresh 되기 떄문에 쓰면 안됨 => Link 사용 */}
      <Link to="/">
        <span>홈</span>
      </Link>
      {me ? (
        <span
          style={{ float: "right", cursor: "pointer" }}
          onClick={logoutHandler}
        >
          로그아웃({me.name})
        </span>
      ) : (
        <>
          <Link to="/auth/login">
            <span style={{ float: "right" }}>로그인</span>
          </Link>
          <Link to="/auth/register">
            <span style={{ float: "right", marginRight: 10 }}>회원가입</span>
          </Link>
        </>
      )}
    </div>
  );
};

export default ToolBar;
