import axios from "axios";

const API = axios.create({
  baseURL: "http://103.243.232.236:5011/api",
});

const Navigate = (path) => {
  window.location.href = path;
};

API.interceptors.request.use((config) => {
  const data = localStorage.getItem("service-center-auth");
  const auth = JSON.parse(data);
  const token = auth.state.token;

  if (token) config.headers["Authorization"] = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  function (response) {
    return response;
  },
  async (error) => {
    const status = error.response.status;
    console.log("error in interceptor", status, error);
    if (status == 401 || status == 403) {
      // window.localStorage.clear();
      // Navigate("/");
    }
    return Promise.reject(error);
  },
);

export default API;
