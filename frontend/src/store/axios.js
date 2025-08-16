import axios from "axios";

// const baseURL = window.location.origin;
const baseURL = "http://localhost:8081";
const authToken = localStorage.getItem("token")

let headers = {}
if (authToken !== null) {
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${authToken}`
    }
} else {
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
    }
}
const axiosInstance = axios.create({
    baseURL: baseURL,
    timeout: 50000,
    headers: headers
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    })

    failedQueue = [];
}

axiosInstance.interceptors.response.use(
    response => {
        return response;
    },
    error => {
        const originalRequest = error.config;

        if (error.response.status === 401 && originalRequest.url.toString() === "/auth/refresh") {
            return Promise.reject(error);
        }
        if (error.response.status === 401 && originalRequest.url.toString() !== "/auth/refresh") {
            if (!isRefreshing) {
                isRefreshing = true;
                axiosInstance.post("/auth/refresh", { refresh_token: localStorage.getItem("refresh") })
                    .then((resp) => {
                        localStorage.setItem("token", resp.data.access_token);
                        localStorage.setItem("refresh", resp.data.refresh_token);
                        axiosInstance.defaults.headers["Authorization"] = `Bearer ${resp.data.access_token}`;
                        processQueue(null, resp.data.auth);
                        isRefreshing = false;
                    })
                    .catch((refreshError) => {
                        processQueue(refreshError, null);
                        isRefreshing = false;
                        localStorage.removeItem("refresh");
                        localStorage.removeItem("token");
                    });
            }
            return new Promise((resolve, reject) => {
                failedQueue.push({ resolve, reject });
            }).then(() => {
                originalRequest.headers["Authorization"] = `Bearer ${localStorage.getItem("token")}`;
                return axiosInstance(originalRequest);
            }).catch((err) => {
                Promise.reject(err);
            });
        }

        return Promise.reject(error);
    }
);
export default axiosInstance;

