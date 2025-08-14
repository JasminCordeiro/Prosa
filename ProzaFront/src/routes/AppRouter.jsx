import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import Login from "../auth/Login";
import ChatPage from "../pages/Chat";

function AppRouter() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/Chat" element={<ChatPage />} />
        </Routes>
      </BrowserRouter>{" "}
    </>
  );
}
export default AppRouter;