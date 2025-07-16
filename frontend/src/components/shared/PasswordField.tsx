import React, { useState } from "react";
import { TextField, IconButton, InputAdornment } from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";

interface PasswordFieldProps {
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  disabled?: boolean;
  autoComplete?: string;
  label?: string;
}

const PasswordField: React.FC<PasswordFieldProps> = ({
  value,
  onChange,
  error,
  disabled = false,
  autoComplete = "current-password",
  label = "Password",
}) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  return (
    <TextField
      id="password"
      label={label}
      type={isPasswordVisible ? "text" : "password"}
      value={value}
      onChange={onChange}
      error={!!error}
      helperText={error}
      required
      disabled={disabled}
      fullWidth
      margin="normal"
      autoComplete={autoComplete}
      slotProps={{
        htmlInput: {
          "aria-describedby": error ? "password-error" : undefined,
        },
        input: {
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={togglePasswordVisibility}
                disabled={disabled}
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
  );
};

export default PasswordField;
