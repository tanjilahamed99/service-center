import API from "@/config/axios";

// ---- Jobs ----

// params: { status } (optional)
export const serviceCenterJobs = (params = {}) =>
  API.get(`/service-center/jobs`, { params });

export const getJobLogs = (id) => API.get(`/service-center/getJobLogs/${id}`);

// data: { jobIds: [id, ...], serviceEngineer, scheduleDate, note }
export const assignJob = (data) => API.post(`/service-center/assignJob`, data);

// data: { holdSubStatus, holdReason, holdPhotos, holdRemarks }
export const holdJob = (id, data) =>
  API.put(`/service-center/holdJob/${id}`, data);

// data: { consumedParts, sparesTotal, serviceCharge, discount, actualIssueFound,
//         correctiveActionTaken, closurePhotos, customerSignature, otp }
export const closeJob = (id, data) =>
  API.put(`/service-center/closeJob/${id}`, data);

// data: { reason }
export const cancelJob = (id, data) =>
  API.put(`/service-center/cancelJob/${id}`, data);

// data: { status, note }
export const updateJobStatus = (id, data) =>
  API.put(`/service-center/updateJobStatus/${id}`, data);

// ---- Service Engineers (scoped to this service center) ----

export const getServiceEngineers = (params = {}) =>
  API.get(`/service-center/getServiceEngineers`, { params });

// ---- Profile ----

export const getProfile = () => API.get(`/service-center/getProfile`);

// data: { name, address, contactPerson, contactNumber, gstNumber }
export const updateProfile = (data) =>
  API.put(`/service-center/updateProfile`, data);

// data: { currentPassword, newPassword }
export const changePassword = (data) =>
  API.put(`/service-center/changePassword`, data);

// ---- Dashboard ----

export const getDashboardStats = () =>
  API.get(`/service-center/dashboard-stats`);

export const loginServiceEngineer = (id) =>
  API.post(`/service-center/service-engineer/${id}`);

// services/service-center.js
export const getMySparePartStock = () =>
  API.get(`/service-center/getMySparePartStock`);
export const getMySparePartTransactions = () =>
  API.get(`/service-center/getMySparePartTransactions`);
