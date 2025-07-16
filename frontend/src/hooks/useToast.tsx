import React, { createContext, useContext, useState, ReactNode } from "react";
import { Snackbar, Alert, AlertColor, Slide } from "@mui/material";

interface ToastMessage {
  id: string;
  message: string;
  severity: AlertColor;
  autoHideDuration?: number;
  closing?: boolean;
}

interface ToastContextType {
  showNotification: (
    message: string,
    severity?: AlertColor,
    autoHideDuration?: number
  ) => void;
  showSuccessNotification: (message: string) => void;
  showErrorNotification: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showNotification = (
    message: string,
    severity: AlertColor = "info",
    autoHideDuration: number = 6000
  ) => {
    const id = Date.now().toString();
    const newToast: ToastMessage = {
      id,
      message,
      severity,
      autoHideDuration,
      closing: false,
    };

    setToasts((prev) => [...prev, newToast]);
  };

  const showSuccessNotification = (message: string) =>
    showNotification(message, "success");
  const showErrorNotification = (message: string) =>
    showNotification(message, "error");

  const handleClose = (id: string) => {
    setToasts((prev) =>
      prev.map((toast) =>
        toast.id === id ? { ...toast, closing: true } : toast
      )
    );
  };

  const handleExited = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider
      value={{
        showNotification,
        showSuccessNotification,
        showErrorNotification,
      }}
    >
      {children}
      {toasts.map((toast) => (
        <Snackbar
          key={toast.id}
          open={!toast.closing}
          autoHideDuration={toast.autoHideDuration}
          onClose={() => handleClose(toast.id)}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
          slots={{
            transition: Slide,
          }}
          slotProps={{
            transition: {
              direction: "left",
              onExited: () => handleExited(toast.id),
            },
          }}
        >
          <Alert
            onClose={() => handleClose(toast.id)}
            severity={toast.severity}
            variant="filled"
            sx={{ width: "100%" }}
          >
            {toast.message}
          </Alert>
        </Snackbar>
      ))}
    </ToastContext.Provider>
  );
};
