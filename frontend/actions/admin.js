import API from "@/config/axios";

export const createCompany = (data) => {
  return API.post("/admin/company", data);
};
export const getCompany = () => {
  return API.get("/admin/company");
};
export const getCompanyById = (id) => {
  return API.get(`/admin/company/${id}`);
};
export const updateCompanyData = ({ id, data }) => {
  return API.patch(`/admin/company/${id}`, data);
};
export const deleteCompany = (id) => {
  return API.delete(`/admin/company/${id}`);
};
export const loginCompany = (id) => {
  return API.post(`/admin/company/login/${id}`);
};
