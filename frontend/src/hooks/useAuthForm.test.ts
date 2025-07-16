/**
 * @jest-environment jsdom
 */
import { renderHook, act } from "@testing-library/react";
import { useAuthForm } from "./useAuthForm";
import { AuthFormData } from "../types/auth";
import { ValidationRule } from "../utils/validation";
import { useToast } from "./useToast";

jest.mock("./useToast");
const mockUseToast = useToast as jest.MockedFunction<typeof useToast>;

const mockToast = {
  showErrorNotification: jest.fn(),
  showSuccessNotification: jest.fn(),
  showNotification: jest.fn(),
};

interface TestFormData extends AuthFormData {
  email: string;
  password: string;
}

describe("useAuthForm", () => {
  const initialData: TestFormData = {
    email: "",
    password: "",
  };

  const validationRules: ValidationRule<TestFormData>[] = [
    {
      field: "email",
      validate: (value: string) => {
        if (!value) return "Email is required";
        if (!value.includes("@")) return "Invalid email";
        return undefined;
      },
    },
    {
      field: "password",
      validate: (value: string) => {
        if (!value) return "Password is required";
        if (value.length < 8) return "Password must be at least 8 characters";
        return undefined;
      },
    },
  ];

  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseToast.mockReturnValue(mockToast);
  });

  it("should initialize with default values", () => {
    const { result } = renderHook(() =>
      useAuthForm(initialData, validationRules, mockOnSubmit)
    );

    expect(result.current.formData).toEqual(initialData);
    expect(result.current.formError).toEqual({});
    expect(result.current.isSubmitting).toBe(false);
  });

  it("should update form data on field change", () => {
    const { result } = renderHook(() =>
      useAuthForm(initialData, validationRules, mockOnSubmit)
    );

    act(() => {
      const event = {
        target: { value: "test@example.com" },
      } as React.ChangeEvent<HTMLInputElement>;
      result.current.handleFormChange("email")(event);
    });

    expect(result.current.formData.email).toBe("test@example.com");
  });

  it("should clear field error when field is updated", () => {
    const { result } = renderHook(() =>
      useAuthForm(initialData, validationRules, mockOnSubmit)
    );

    act(() => {
      const event = { preventDefault: jest.fn() } as any;
      result.current.handleFormSubmit(event);
    });

    expect(result.current.formError.email).toBe("Email is required");

    act(() => {
      const event = {
        target: { value: "test@example.com" },
      } as React.ChangeEvent<HTMLInputElement>;
      result.current.handleFormChange("email")(event);
    });

    expect(result.current.formError.email).toBeUndefined();
  });

  it("should validate form and show errors on submit", async () => {
    const { result } = renderHook(() =>
      useAuthForm(initialData, validationRules, mockOnSubmit)
    );

    await act(async () => {
      const event = { preventDefault: jest.fn() } as any;
      await result.current.handleFormSubmit(event);
    });

    expect(result.current.formError).toEqual({
      email: "Email is required",
      password: "Password is required",
    });
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it("should submit form when validation passes", async () => {
    const { result } = renderHook(() =>
      useAuthForm(initialData, validationRules, mockOnSubmit)
    );

    act(() => {
      const emailEvent = {
        target: { value: "test@example.com" },
      } as React.ChangeEvent<HTMLInputElement>;
      result.current.handleFormChange("email")(emailEvent);
    });

    act(() => {
      const passwordEvent = {
        target: { value: "password123" },
      } as React.ChangeEvent<HTMLInputElement>;
      result.current.handleFormChange("password")(passwordEvent);
    });

    await act(async () => {
      const event = { preventDefault: jest.fn() } as any;
      await result.current.handleFormSubmit(event);
    });

    expect(mockOnSubmit).toHaveBeenCalledWith({
      email: "test@example.com",
      password: "password123",
    });
  });

  it("should handle submit error", async () => {
    const submitError = new Error("Submit failed");
    mockOnSubmit.mockRejectedValue(submitError);

    const { result } = renderHook(() =>
      useAuthForm(initialData, validationRules, mockOnSubmit)
    );

    act(() => {
      const emailEvent = {
        target: { value: "test@example.com" },
      } as React.ChangeEvent<HTMLInputElement>;
      result.current.handleFormChange("email")(emailEvent);
    });

    act(() => {
      const passwordEvent = {
        target: { value: "password123" },
      } as React.ChangeEvent<HTMLInputElement>;
      result.current.handleFormChange("password")(passwordEvent);
    });

    await act(async () => {
      const event = { preventDefault: jest.fn() } as any;
      await result.current.handleFormSubmit(event);
    });

    expect(mockToast.showErrorNotification).toHaveBeenCalledWith(
      "Submit failed"
    );
  });

  it("should set loading state during submit", async () => {
    let resolveSubmit: (value: any) => void;
    const submitPromise = new Promise((resolve) => {
      resolveSubmit = resolve;
    });
    mockOnSubmit.mockReturnValue(submitPromise);

    const { result } = renderHook(() =>
      useAuthForm(initialData, validationRules, mockOnSubmit)
    );

    act(() => {
      const emailEvent = {
        target: { value: "test@example.com" },
      } as React.ChangeEvent<HTMLInputElement>;
      result.current.handleFormChange("email")(emailEvent);
    });

    act(() => {
      const passwordEvent = {
        target: { value: "password123" },
      } as React.ChangeEvent<HTMLInputElement>;
      result.current.handleFormChange("password")(passwordEvent);
    });

    act(() => {
      const event = { preventDefault: jest.fn() } as any;
      result.current.handleFormSubmit(event);
    });

    expect(result.current.isSubmitting).toBe(true);

    await act(async () => {
      resolveSubmit!(undefined);
    });

    expect(result.current.isSubmitting).toBe(false);
  });
});
