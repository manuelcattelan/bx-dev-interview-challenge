import React from "react";
import { TextField } from "@mui/material";

interface EmailFieldProps {
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  autoComplete?: string;
}

const EmailField: React.FC<EmailFieldProps> = ({
  value,
  onChange,
  error,
  disabled = false,
  autoFocus = false,
  autoComplete = "email",
}) => {
  return (
    <TextField
      id="email"
      label="Email address"
      type="email"
      value={value}
      onChange={onChange}
      error={!!error}
      helperText={error}
      required
      disabled={disabled}
      fullWidth
      margin="normal"
      autoComplete={autoComplete}
      autoFocus={autoFocus}
      slotProps={{
        htmlInput: {
          "aria-describedby": error ? "email-error" : undefined,
        },
      }}
    />
  );
};

export default EmailField;
