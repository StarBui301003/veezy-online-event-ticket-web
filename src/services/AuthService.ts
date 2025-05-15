import axios from "axios";

export const requestResetPassword = async (email: string) => {
  const response = await axios.post("https://localhost:7120/api/Account/forgot-password", { email });
  return response.data;
};

export const resetPasswordWithCode = async (email: string, code: string, newPassword: string) => {
  const response = await axios.post("https://localhost:7120/api/Account/reset-password", {
    email,
    verificationCode: code,
    newPassword,
  });
  return response.data;
};