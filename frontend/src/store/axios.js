import axios from "axios";

let baseURL = window.location.origin;
if (process.env.NODE_ENV === "development") {
	baseURL = "http://localhost:8081";
}

const axiosInstance = axios.create({
	baseURL: baseURL,
	timeout: 50000,
	headers: {
		Authorization: localStorage.getItem("token")
			? "Bearer " + localStorage.getItem("token")
			: null,
		"Content-Type": "application/json",
		accept: "application/json",
	},
});

axiosInstance.interceptors.response.use(
	(response) => {
		return response;
	},
	async function (error) {
		const originalRequest = error.config;

		if (typeof error.response === "undefined") {
			return Promise.reject(error);
		}
        console.log(error.response.status)
        console.log("status text ", error.response.statusText)
        console.log(originalRequest.url)

		if ( error.response.status == 401 && (originalRequest.url == "/auth/refresh" || originalRequest.url == "/auth/login") ) {
            localStorage.removeItem("token");
            localStorage.removeItem("refresh");
			return Promise.reject(error);
		}
        if (error.response.status == 401 && error.response.statusText == "Unauthorized") {
			const refreshToken = localStorage.getItem("refresh");
			if (refreshToken) {
                const body = JSON.stringify({"refresh_token": refreshToken})
				const tokenParts = JSON.parse(atob(refreshToken.split(".")[1]));
				const now = Math.ceil(Date.now() / 1000);
				if (tokenParts.exp > now) {
					return axiosInstance.post("/auth/refresh/", body).then((response) => {
							localStorage.setItem("token", response.data.access_token);
							localStorage.setItem("refresh", response.data.refresh_token);
							axiosInstance.defaults.headers["Authorization"] = "Bearer " + response.data.access_token;
							originalRequest.headers["Authorization"] = "Bearer " + response.data.access_token;
                            console.log("got response from refresh")
							return axiosInstance(originalRequest);
						})
						.catch((error) => {
							return Promise.reject(error);
						});
				} else {
					return Promise.reject(error);
				}
			} else {
				return Promise.reject(error);
			}
		}
		return Promise.reject(error);
	}
);

export default axiosInstance;


