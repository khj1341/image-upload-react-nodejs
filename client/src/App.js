import React from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Switch, Route } from "react-router-dom";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import MainPage from "./pages/MainPage";
import ImagePage from "./pages/ImagePage";
import ToolBar from "./components/ToolBar";

const App = () => {
  return (
    // margin auto로 주면 가운데 정렬 해줌
    <div style={{ maxWidth: 600, margin: "auto" }}>
      <ToastContainer />
      <ToolBar />
      <Switch>
        <Route path="/images/:imageId" exact component={ImagePage} />
        <Route path="/auth/register" exact component={RegisterPage} />
        <Route path="/auth/login" exact component={LoginPage} />
        <Route path="/" component={MainPage} />
      </Switch>
    </div>
  );
};

export default App;
