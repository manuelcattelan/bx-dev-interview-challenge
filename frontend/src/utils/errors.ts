import { AxiosError } from "axios";

export interface ErrorResponse {
  message: string;
  statusCode?: number;
  error?: string;
}

export const getErrorMessage = (error: unknown): string => {
  if (error && typeof error === "object" && "isAxiosError" in error) {
    const axiosError = error as AxiosError<ErrorResponse>;

    if (axiosError.response?.data) {
      const errorData = axiosError.response.data;

      if (errorData.message) {
        return errorData.message;
      }
      if (errorData.error) {
        return errorData.error;
      }
    }

    if (axiosError.message) {
      return axiosError.message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }

  return "An unexpected error occurred. Please try again.";
};
