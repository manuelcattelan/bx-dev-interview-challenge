import React from "react";
import { Button, CircularProgress } from "@mui/material";

interface ActionButtonProps {
  onClick: () => void;
  disabled: boolean;
  isLoading: boolean;
  loadingText: string;
  defaultText: string;
  icon: React.ReactNode;
  ariaLabel: string;
  variant?: "contained" | "outlined";
  color?: "primary" | "error";
}

const ActionButton: React.FC<ActionButtonProps> = ({
  onClick,
  disabled,
  isLoading,
  loadingText,
  defaultText,
  icon,
  ariaLabel,
  variant = "contained",
  color = "primary",
}) => {
  return (
    <Button
      variant={variant}
      color={color}
      startIcon={isLoading ? <CircularProgress size={16} /> : icon}
      onClick={onClick}
      disabled={disabled}
      size="small"
      aria-label={ariaLabel}
    >
      {isLoading ? loadingText : defaultText}
    </Button>
  );
};

export default ActionButton;
