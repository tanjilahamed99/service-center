import API from "@/config/axios";

export const createJob = (data) => {
  return API.post(`/company/createJob`, data);
};

// params: { search, status, callType, natureOfWork, serviceCenter, serviceEngineer, sortDesc, page, limit }
export const getJobs = (params = {}) => {
  return API.get(`/company/getJobs`, { params });
};

export const getJobById = (id) => {
  return API.get(`/company/getJobById/${id}`);
};

export const updateJob = (id, data) => {
  return API.put(`/company/updateJob/${id}`, data);
};

// data: { jobIds: [id, ...], serviceCenter, scheduleDate, note }
export const assignJob = (data) => {
  return API.post(`/company/assignJob`, data);
};

// data: { holdSubStatus, holdReason, holdPhotos, holdRemarks }
export const holdJob = (id, data) => {
  return API.put(`/company/holdJob/${id}`, data);
};

// data: { consumedParts, serviceCharge, discount, actualIssueFound, correctiveActionTaken, closurePhotos, customerSignature, otp }
export const closeJob = (id, data) => {
  return API.put(`/company/closeJob/${id}`, data);
};

// data: { reason }
export const cancelJob = (id, data) => {
  return API.put(`/company/cancelJob/${id}`, data);
};

export const getJobLogs = (id) => {
  return API.get(`/company/getJobLogs/${id}`);
};

export const searchCustomers = (search) => {
  return API.get(`/company/searchCustomers`, { params: { search } });
};

// data: { name, mobileNumber, alternateNumber, address }
export const createCustomer = (data) => {
  return API.post(`/company/createCustomer`, data);
};

export const getCustomerPreviousJobs = (customerId) => {
  return API.get(`/company/getCustomerPreviousJobs/${customerId}`);
};

// export const getServiceCenters = () => {
//   return API.get(`/company/getServiceCenters`);
// };

// export const getServiceEngineers = (serviceCenter) => {
//   return API.get(`/company/getServiceEngineers`, {
//     params: serviceCenter ? { serviceCenter } : {},
//   });
// };

// Service Centers — params: { status } optional
export const getServiceCenters = (params = {}) =>
  API.get(`/company/getServiceCenters`, { params });
export const getServiceCenterById = (id) =>
  API.get(`/company/getServiceCenterById/${id}`);
export const createServiceCenter = (data) =>
  API.post(`/company/createServiceCenter`, data);
export const updateServiceCenter = (id, data) =>
  API.put(`/company/updateServiceCenter/${id}`, data);
export const deleteServiceCenter = (id) =>
  API.delete(`/company/deleteServiceCenter/${id}`);

// Service Engineers — params: { serviceCenter, status } optional
export const getServiceEngineers = (params = {}) =>
  API.get(`/company/getServiceEngineers`, { params });
export const getServiceEngineerById = (id) =>
  API.get(`/company/getServiceEngineerById/${id}`);
export const createServiceEngineer = (data) =>
  API.post(`/company/createServiceEngineer`, data);
export const updateServiceEngineer = (id, data) =>
  API.put(`/company/updateServiceEngineer/${id}`, data);
export const deleteServiceEngineer = (id) =>
  API.delete(`/company/deleteServiceEngineer/${id}`);

export const getProfile = () => API.get(`/company/getProfile`);

// data: { name, address, contactPerson, contactNumber, gstNumber }
export const updateProfile = (data) => API.put(`/company/updateProfile`, data);

// data: { currentPassword, newPassword }
export const changePassword = (data) =>
  API.put(`/company/changePassword`, data);

export const getDashboardStats = () => API.get(`/company/getDashboardStats`);


export const getProducts = (params = {}) => API.get(`/company/products`, { params });
 
export const getProductById = (id) => API.get(`/company/products/${id}`);
 
// data: { brand, productName, model, status }
export const createProduct = (data) => API.post(`/company/products`, data);
 
// data: { brand, productName, model, status }
export const updateProduct = (id, data) => API.put(`/company/products/${id}`, data);
 
export const deleteProduct = (id) => API.delete(`/company/products/${id}`);
 