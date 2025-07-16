export interface BaseFormData {
  email: string;
  password: string;
}

export interface AuthFormConfig {
  title: string;
  submitButtonText: string;
  loadingButtonText: string;
  bottomLinkText: string;
  bottomLinkHref: string;
  bottomLinkLabel: string;
  passwordAutoComplete: string;
}

export interface AuthFormProps {
  onSuccess: () => void;
  config: AuthFormConfig;
}
