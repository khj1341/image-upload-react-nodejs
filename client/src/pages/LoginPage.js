import React, { useState, useContext } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useHistory } from "react-router-dom";

import CustomInput from "../components/CustomInput";
import { AuthContext } from "../context/AuthContext";

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [, setMe] = useContext(AuthContext);

  const history = useHistory();
  const loginHandler = async (e) => {
    try {
      e.preventDefault();
      if (username.length < 3 || password.length < 6)
        throw new Error("입력하신 정보가 옳바르지 않습니다.");
      const result = await axios.patch("/users/login", { username, password });
      setMe({
        name: result.data.name,
        sessionId: result.data.sessionId,
        userId: result.data.userId,
      });
      toast.success("로그인!");
      history.push("/");
    } catch (err) {
      console.error(err.response);
      toast.error(err.response.data.message);
    }
  };

  return (
    <div
      style={{
        marginTop: 100,
        maxWidth: "350px",
        marginLeft: "auto",
        marginRight: "auto",
      }}
    >
      <h3>로그인</h3>
      <form onSubmit={loginHandler}>
        <CustomInput label="회원ID" value={username} setValue={setUsername} />
        <CustomInput
          label="비밀번호"
          type="password"
          value={password}
          setValue={setPassword}
        />
        <button type="submit">로그인</button>
      </form>
    </div>
  );
};

export default LoginPage;
