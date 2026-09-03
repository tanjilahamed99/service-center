import API from "@/config/axios";

export const login = (data) => {
  return API.post("/auth/login", data);
};
