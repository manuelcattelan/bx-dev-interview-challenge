import React from "react";
import {
  Container,
  Paper,
  Box,
  Typography,
  Button,
  CircularProgress,
  Link,
} from "@mui/material";

export interface AuthFormConfig {
  title: string;
  submitButtonText: string;
  loadingButtonText: string;
  bottomLinkText: string;
  bottomLinkHref: string;
  bottomLinkLabel: string;
  passwordAutoComplete: string;
}

interface AuthFormContainerProps {
  config: AuthFormConfig;
  isSubmitting: boolean;
  onSubmit: (event: React.FormEvent) => void;
  children: React.ReactNode;
}

const AuthFormContainer: React.FC<AuthFormContainerProps> = ({
  config,
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
