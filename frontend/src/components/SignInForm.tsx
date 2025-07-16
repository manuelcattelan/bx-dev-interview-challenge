import React from "react";
import { useAuthForm } from "../hooks/useAuthForm";
import { isValidEmail } from "../utils/validation";
import { ValidationRule } from "../utils/validation";
import authService, { SignInData } from "../services/auth";
import AuthFormContainer, { AuthFormConfig } from "./shared/AuthFormContainer";
import EmailField from "./shared/EmailField";
import PasswordField from "./shared/PasswordField";

interface SignInFormProps {
  onSignInSuccess: () => void;
}

const signInConfig: AuthFormConfig = {
  title: "Access your account",
  submitButtonText: "Sign in",
  loadingButtonText: "Signing in...",
  bottomLinkText: "Don't have an account?",
  bottomLinkHref: "/sign-up",
  bottomLinkLabel: "Sign up",
  passwordAutoComplete: "current-password",
};

const signInValidationRules: ValidationRule<SignInData>[] = [
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
      }
      return undefined;
    },
  },
];

const SignInForm: React.FC<SignInFormProps> = ({ onSignInSuccess }) => {
  const initialData: SignInData = {
    email: "",
    password: "",
  };

  const {
    formData,
    formError,
    isSubmitting,
    handleFormChange,
    handleFormSubmit,
  } = useAuthForm(initialData, signInValidationRules, async (data) => {
    await authService.signIn(data);
    onSignInSuccess();
  });

  return (
    <AuthFormContainer
      config={signInConfig}
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
        autoComplete={signInConfig.passwordAutoComplete}
      />
    </AuthFormContainer>
  );
};

export default SignInForm;
