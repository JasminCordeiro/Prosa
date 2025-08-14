import { Box } from "@mui/material";
import LoginForm from "./LoginForm";
import bg from '../assets/background02.png';

const Login = () => {

  return (
    <Box
      className="papel-de-parede"
      sx={{
        backgroundImage: `url(${bg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        minHeight: "100vh",
        border: "none",
        margin: 0,
        padding: 0,
        boxSizing: "border-box",
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
    >
      <LoginForm />
    </Box>
  );
};

export default Login;
