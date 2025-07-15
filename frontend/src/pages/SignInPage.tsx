import React from "react";
import { useNavigate } from "react-router-dom";

import SignInForm from "../components/SignInForm";

const SignInPage: React.FC = () => {
  const navigate = useNavigate();

  const handleSignInSuccess = () => {
    navigate("/dashboard");
  };

  return <SignInForm onSignInSuccess={handleSignInSuccess} />;
};

export default SignInPage;
