import API from "@/config/axios";

export const serviceCenterJobs = () => API.get(`/service-center/jobs`);
export const updateJobStatus = () => API.patch(`/service-center/jobs`);

export const getServiceEngineer = () => API.get(`/service-center/jobs`);
export const updateServiceEngineer = () => API.patch(`/service-center/jobs`);
export const assignServiceEngineer = () => API.patch(`/service-center/jobs`);

export const getProfile = () => {
  return API.get(`/service-center/getProfile`);
};

// data: { name, contactNumber, aadharNumber, username }
export const updateProfile = (data) => {
  return API.put(`/service-center/updateProfile`, data);
};

// data: { currentPassword, newPassword }
export const changePassword = (data) => {
  return API.put(`/service-center/changePassword`, data);
};
