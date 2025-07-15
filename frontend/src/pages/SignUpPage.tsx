import React from "react";
import { useNavigate } from "react-router-dom";

import SignUpForm from "../components/SignUpForm";

const SignUpPage: React.FC = () => {
  const navigate = useNavigate();

  const handleSignUpSuccess = () => {
    navigate("/dashboard");
  };

  return <SignUpForm onSignUpSuccess={handleSignUpSuccess} />;
};

export default SignUpPage;
