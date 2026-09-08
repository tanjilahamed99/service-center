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

export const createUsers = (data) => {
  return API.post(`/admin/createUser`, data);
};

export const getUsers = () => {
  return API.get(`/admin/users`);
};

export const updateUser = (id, data) => {
  return API.put(`/admin/user/${id}`, data);
};

export const deleteUser = (id) => {
  return API.delete(`/admin/user/${id}`);
};

export const getProfile = () => API.get(`/admin/getProfile`);

// data: { name, address, contactPerson, contactNumber, gstNumber }
export const updateProfile = (data) => API.put(`/admin/updateProfile`, data);

// data: { currentPassword, newPassword }
export const changePassword = (data) => API.put(`/admin/changePassword`, data);

export const getAdminDashboardStats = () => API.get(`/admin/getDashboardStats`);
export const getAdminServiceCenters = (params = {}) =>
  API.get(`/admin/getServiceCenters`, { params });
export const getAdminServiceEngineers = (params = {}) =>
  API.get(`/admin/getServiceEngineers`, { params });
export const getCompaniesLookup = () => API.get(`/admin/getCompaniesLookup`);

// actions/company.js (add these)
export const getJobCategories = (type, activeOnly = false) =>
  API.get("/admin/job-categories", { params: { type, activeOnly } });

export const createJobCategory = (payload) =>
  API.post("/admin/job-categories", payload);

export const updateJobCategory = (id, payload) =>
  API.patch(`/admin/job-categories/${id}`, payload);

export const deleteJobCategory = (id) =>
  API.delete(`/admin/job-categories/${id}`);
