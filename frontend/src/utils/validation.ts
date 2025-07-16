export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPassword = (password: string): boolean => {
  return (
    password.length >= 8 && /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)
  );
};

export interface ValidationRule<T> {
  field: keyof T;
  validate: (value: any, formData: T) => string | undefined;
}

export const validateForm = <T>(
  formData: T,
  rules: ValidationRule<T>[]
): Partial<T> => {
  const errors: Partial<T> = {};

  rules.forEach((rule) => {
    const error = rule.validate(formData[rule.field], formData);
    if (error) {
      errors[rule.field] = error as T[keyof T];
    }
  });

  return errors;
};
