import { useState } from "react";
import { AuthFormData } from "../types/auth";
import { ValidationRule, validateForm } from "../utils/validation";
import { useToast } from "./useToast";
import { getErrorMessage } from "../utils/errors";

export const useAuthForm = <T extends AuthFormData>(
  initialData: T,
  validationRules: ValidationRule<T>[],
  onSubmit: (data: T) => Promise<void>
) => {
  const [formData, setFormData] = useState<T>(initialData);
  const [formError, setFormError] = useState<Partial<T>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showErrorNotification: showError } = useToast();

  const handleFormChange =
    (field: keyof T) => (event: React.ChangeEvent<HTMLInputElement>) => {
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

    const errors = validateForm(formData, validationRules);
    setFormError(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(formData);
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      showError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    formData,
    formError,
    isSubmitting,
    handleFormChange,
    handleFormSubmit,
  };
};
