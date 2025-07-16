import { useState } from "react";
import { BaseFormData } from "../types/auth";
import { ValidationRule, validateForm } from "../utils/validation";

export const useAuthForm = <T extends BaseFormData>(
  initialData: T,
  validationRules: ValidationRule<T>[],
  onSubmit: (data: T) => Promise<void>
) => {
  const [formData, setFormData] = useState<T>(initialData);
  const [formError, setFormError] = useState<Partial<T>>({});
  const [requestError, setRequestError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    setRequestError(null);

    try {
      await onSubmit(formData);
    } catch (error) {
      setRequestError(
        "There was an error processing your request. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    formData,
    formError,
    requestError,
    isSubmitting,
    handleFormChange,
    handleFormSubmit,
  };
};
