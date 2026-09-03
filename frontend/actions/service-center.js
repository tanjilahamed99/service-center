import API from "@/config/axios";

export const serviceCenterJobs = () => API.get(`/service-center/jobs`);
export const updateJobStatus = () => API.patch(`/service-center/jobs`);

export const getServiceEngineer = () => API.get(`/service-center/jobs`);
export const updateServiceEngineer = () => API.patch(`/service-center/jobs`);
export const assignServiceEngineer = () => API.patch(`/service-center/jobs`);