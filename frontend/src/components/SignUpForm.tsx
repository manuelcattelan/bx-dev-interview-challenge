import React from "react";
import authService, { SignUpData } from "../services/auth";
import { useAuthForm } from "../hooks/useAuthForm";
import {
  isValidEmail,
  isValidPassword,
  ValidationRule,
} from "../utils/validation";
import { AuthFormConfig } from "../types/auth";
import AuthFormContainer from "./shared/AuthFormContainer";
import EmailField from "./shared/EmailField";
import PasswordField from "./shared/PasswordField";

interface SignUpFormProps {
  onSignUpSuccess: () => void;
}

const signUpConfig: AuthFormConfig = {
  title: "Create your account",
  submitButtonText: "Sign up",
  loadingButtonText: "Signing up...",
  bottomLinkText: "Already have an account?",
  bottomLinkHref: "/sign-in",
  bottomLinkLabel: "Sign in",
  passwordAutoComplete: "new-password",
};

const signUpValidationRules: ValidationRule<SignUpData>[] = [
  {
    field: "email",
    validate: (value: string) => {
      if (!value.trim()) {
        return "Email is required";
      } else if (!isValidEmail(value)) {
        return "Please enter a valid email address";
      }
      return undefined;
    },
  },
  {
    field: "password",
    validate: (value: string) => {
      if (!value) {
        return "Password is required";
      } else if (!isValidPassword(value)) {
        return "Password must be at least 8 characters with uppercase, lowercase, and number";
      }
      return undefined;
    },
  },
];

const SignUpForm: React.FC<SignUpFormProps> = ({ onSignUpSuccess }) => {
  const initialData: SignUpData = {
    email: "",
    password: "",
  };

  const {
    formData,
    formError,
    requestError,
    isSubmitting,
    handleFormChange,
    handleFormSubmit,
  } = useAuthForm(initialData, signUpValidationRules, async (data) => {
    await authService.signUp(data);
    onSignUpSuccess();
  });

  return (
    <AuthFormContainer
      config={signUpConfig}
      requestError={requestError}
      isSubmitting={isSubmitting}
      onSubmit={handleFormSubmit}
    >
      <EmailField
        value={formData.email}
        onChange={handleFormChange("email")}
        error={formError.email}
        disabled={isSubmitting}
        autoFocus
        autoComplete="email"
      />

      <PasswordField
        value={formData.password}
        onChange={handleFormChange("password")}
        error={formError.password}
        disabled={isSubmitting}
        autoComplete={signUpConfig.passwordAutoComplete}
      />
    </AuthFormContainer>
  );
};

export default SignUpForm;
