import React, { useState } from "react";

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Link,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { IconButton, InputAdornment } from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";

import authService, { SignInData } from "../services/auth.service";

interface SignInFormProps {
  onSignInSuccess: () => void;
}

const SignInForm: React.FC<SignInFormProps> = ({ onSignInSuccess }) => {
  const [formData, setFormData] = useState<SignInData>({
    email: "",
    password: "",
  });

  const [formError, setFormError] = useState<Partial<SignInData>>({});
  const [requestError, setRequestError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = (): boolean => {
    const updatedFormError: Partial<SignInData> = {};

    if (!formData.email.trim()) {
      updatedFormError.email = "Email is required";
    } else if (!isValidEmail(formData.email)) {
      updatedFormError.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      updatedFormError.password = "Password is required";
    }

    setFormError(updatedFormError);
    return Object.keys(updatedFormError).length === 0;
  };

  const handleFormChange =
    (field: keyof SignInData) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));

      if (formError[field]) {
        setFormError((prev) => ({
          ...prev,
          [field]: undefined,
        }));
      }
    };

  const handleFormSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setRequestError(null);

    try {
      await authService.signIn(formData);
      onSignInSuccess();
    } catch (error) {
      setRequestError("There was an error signing in. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Box component="form" onSubmit={handleFormSubmit} noValidate>
          <Typography
            variant="h4"
            component="h1"
            gutterBottom
            textAlign="center"
            aria-label="Access your account"
          >
            Access your account
          </Typography>

          {requestError && (
            <Alert
              severity="error"
              sx={{ mb: 2 }}
              role="alert"
              aria-live="polite"
            >
              {requestError}
            </Alert>
          )}

          <TextField
            id="email"
            label="Email address"
            type="email"
            value={formData.email}
            onChange={handleFormChange("email")}
            error={!!formError.email}
            helperText={formError.email}
            required
            disabled={isSubmitting}
            fullWidth
            margin="normal"
            autoComplete="email"
            autoFocus
            slotProps={{
              htmlInput: {
                "aria-describedby": formError.email ? "email-error" : undefined,
              },
            }}
          />

          <TextField
            id="password"
            label="Password"
            type={isPasswordVisible ? "text" : "password"}
            value={formData.password}
            onChange={handleFormChange("password")}
            error={!!formError.password}
            helperText={formError.password}
            required
            disabled={isSubmitting}
            fullWidth
            margin="normal"
            autoComplete="current-password"
            slotProps={{
              htmlInput: {
                "aria-describedby": formError.password
                  ? "password-error"
                  : undefined,
              },
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={togglePasswordVisibility}
                      disabled={isSubmitting}
                      edge="end"
                      aria-label={
                        isPasswordVisible ? "Hide password" : "Show password"
                      }
                    >
                      {isPasswordVisible ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />

          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting}
            fullWidth
            sx={{ mt: 3, mb: 2 }}
            aria-label={
              isSubmitting ? "Signing in..." : "Sign in to your account"
            }
          >
            {isSubmitting ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              "Sign in"
            )}
          </Button>

          <Box textAlign="center">
            <Typography variant="body2">
              Don't have an account?{" "}
              <Link
                href="/sign-up"
                aria-label="Switch to sign up"
                onClick={isSubmitting ? (e) => e.preventDefault() : undefined}
                sx={{
                  pointerEvents: isSubmitting ? "none" : "auto",
                  opacity: isSubmitting ? 0.5 : 1,
                }}
              >
                Sign up
              </Link>
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default SignInForm;
