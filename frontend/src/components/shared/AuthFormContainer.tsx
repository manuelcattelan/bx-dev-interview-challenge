import React from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Link,
  Paper,
  Typography,
} from "@mui/material";
import { AuthFormConfig } from "../../types/auth";

interface AuthFormContainerProps {
  config: AuthFormConfig;
  requestError: string | null;
  isSubmitting: boolean;
  onSubmit: (event: React.FormEvent) => void;
  children: React.ReactNode;
}

const AuthFormContainer: React.FC<AuthFormContainerProps> = ({
  config,
  requestError,
  isSubmitting,
  onSubmit,
  children,
}) => {
  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Box component="form" onSubmit={onSubmit} noValidate>
          <Typography
            variant="h4"
            component="h1"
            gutterBottom
            textAlign="center"
            aria-label={config.title}
          >
            {config.title}
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

          {children}

          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting}
            fullWidth
            sx={{ mt: 3, mb: 2 }}
            aria-label={
              isSubmitting ? config.loadingButtonText : config.submitButtonText
            }
          >
            {isSubmitting ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              config.submitButtonText
            )}
          </Button>

          <Box textAlign="center">
            <Typography variant="body2">
              {config.bottomLinkText}{" "}
              <Link
                href={config.bottomLinkHref}
                aria-label={config.bottomLinkLabel}
                onClick={isSubmitting ? (e) => e.preventDefault() : undefined}
                sx={{
                  pointerEvents: isSubmitting ? "none" : "auto",
                  opacity: isSubmitting ? 0.5 : 1,
                }}
              >
                {config.bottomLinkLabel}
              </Link>
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default AuthFormContainer;
