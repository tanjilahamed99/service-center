import API from "@/config/axios";

export const serviceEngineerJobs = (params = {}) =>
  API.get(`/service-engineer/getJobs`, { params });
export const serviceEngineerJobById = (id) =>
  API.get(`/service-engineer/getJobById/${id}`);
export const serviceEngineerHoldJob = (id, data) =>
  API.put(`/service-engineer/holdJob/${id}`, data);
export const serviceEngineerCloseJob = (id, data) =>
  API.put(`/service-engineer/closeJob/${id}`, data);
export const serviceEngineerJobLogs = (id) =>
  API.get(`/service-engineer/getJobLogs/${id}`);

export const getProfile = () => {
  return API.get(`/service-engineer/getProfile`);
};

// data: { name, contactNumber, aadharNumber, username }
export const updateProfile = (data) => {
  return API.put(`/service-engineer/updateProfile`, data);
};

// data: { currentPassword, newPassword }
export const changePassword = (data) => {
  return API.put(`/service-engineer/changePassword`, data);
};

export const getDashboardStats = () =>
  API.get(`/service-engineer/dashboard-stats`);
