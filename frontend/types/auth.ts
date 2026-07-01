export interface LoginFormData {
  email: string;
  password: string;
}

export type LoginFormSubmitHandler = (data: LoginFormData) => void;

