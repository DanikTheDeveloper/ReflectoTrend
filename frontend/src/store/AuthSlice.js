import { createSelector, createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../store/axios.js';
import {notificationActions} from './NotificationSlice.js';

export const initGoogleAuth = createAsyncThunk('initGoogleAuth', async (something=null, thunkAPI) => {
    try {
        const resp = await axiosInstance.post('/api/initGoogleAuth');
        return resp.data;
    }
    catch(error) {
        throw(error)
    }
});

export const googleAuthCallback = createAsyncThunk('googleAuthCallback', async (params, thunkAPI) => {
	const url = `/api/googleAuthCallback?state=${params.get('state')}&code=${params.get('code')}
	&scope=${params.get('scope')}&authuser=${params.get('authuser')}&prompt=${params.get('prompt')}`
	const resp = await axiosInstance.post(url);
	return resp.data;
});

export const confirmCaptcha = createAsyncThunk('confirmCaptcha', async (value, thunkAPI) => {
    try{
        const resp = await axiosInstance.post('/api/confirmCaptcha/', {captcha_value: value});
        return resp.data;
    } catch(error) {
        thunkAPI.dispatch(notificationActions.setStatus({type: 'error', message: 'Captcha Invalid! Are you a Bot?'}))
        throw(error)
    }
});

export const createPaymentIntent = createAsyncThunk('pricing/createPaymentIntent', async ({ planId, userId }, thunkAPI) => {
    try {
        thunkAPI.dispatch(authActions.userLoading());
        const response = await axiosInstance.post('/api/createPaymentIntent', {
            planId,
            userId
        });
        thunkAPI.dispatch(notificationActions.setStatus({type: 'success', message: "Payment intent created successfully.", title: 'Payment'}));
        return response.data;
    } catch(error) {
        thunkAPI.dispatch(notificationActions.setStatus({type: 'error', message: error.response.data, title: 'Payment'}));
        throw(error);
    }
});

const handlePlanSelect = async (planKey) => {
    const userId = getCurrentUserId();
    // Dispatch the Redux action here
    dispatch(createPaymentIntent({ planId: planKey, userId }))
        .then((response) => {
            // Handle success, such as confirming the payment with Stripe
        })
        .catch((error) => {
            // Handle error
            console.error("Failed to create payment intent", error);
        });
};


export const resetPasswordEmail = createAsyncThunk('auth/resetPasswordEmail', async (email, thunkAPI) => {
    try {
        thunkAPI.dispatch(authActions.userLoading());
        const resp = await axiosInstance.post('/api/sendForgotPasswordEmail', {email: email});
        return resp.data;
    }
    catch(error) {
        thunkAPI.dispatch(notificationActions.setStatus({type: 'error', message: error.response.data, title: 'Reset Password'}));
        throw(error);
    }
});

export const loadUser = createAsyncThunk('loadUser', async (something=null, thunkAPI) => {
    try {
        thunkAPI.dispatch(authActions.userLoading())
        axiosInstance.defaults.headers["Authorization"] = `Bearer ${localStorage.getItem('token')}`;
        const resp = await axiosInstance.get('/auth/user')
        return resp.data;
    }catch(error) {
        thunkAPI.dispatch(notificationActions.setStatus({type: 'error', title: 'Load User', message: error.response.data }))
        throw(error)
    }
});

export const signIn = createAsyncThunk('signIn', async ({email, password}, thunkAPI) => {
    try {
        thunkAPI.dispatch(authActions.userLoading())
        const body = JSON.stringify({email, password});
        axiosInstance.defaults.headers["Authorization"] = null;
        const resp = await axiosInstance.post('/auth/login', body);
        return resp.data
    }
    catch(error) {
        thunkAPI.dispatch(notificationActions.setStatus({type: 'error', title: 'Login', message: error.response.data }))
        throw(error)
    }
});

export const register = createAsyncThunk('register', async ({email, password}, thunkAPI) => {
    try {
        thunkAPI.dispatch(authActions.userLoading())
        const body = JSON.stringify({email, password});
        axiosInstance.defaults.headers["Authorization"] = null;
        const resp = await axiosInstance.post('/auth/register/', body);
        thunkAPI.dispatch(notificationActions.setStatus({type: 'success', message: "Registered Successfully.", title: 'Register' }))
        thunkAPI.dispatch(authActions.stopLoading())
        return resp.data
    }
    catch(error) {
        thunkAPI.dispatch(notificationActions.setStatus({type: 'error', message: error.response.data, title: 'Register' }))
        thunkAPI.dispatch(authActions.stopLoading())
        throw(error)
    }
});

export const signOut = createAsyncThunk('signOut', async ({}, thunkAPI) => {
    try {
        thunkAPI.dispatch(authActions.userLoading())
        axiosInstance.defaults.headers["Authorization"] = null;
        const body = JSON.stringify({access_token: localStorage.getItem('token'), refresh_token: localStorage.getItem('refresh')})
        const resp = await axiosInstance.post('/auth/logout/', body);
        thunkAPI.dispatch(notificationActions.setStatus({type: 'success', title: 'Logout', message: resp.data }))
    }
    catch(error) {
        thunkAPI.dispatch(notificationActions.setStatus({type: 'error', title: 'Logout', message: error.response.data }))
        throw(error)
    }
});

export const authSlice = createSlice({
    name: "auth",
    initialState: {
        isRecaptchaValid: false,
        isAuthenticated: false,
        isLoading: false,

        id: null,
        email: null,
        last_login: null,
        updated_at: null,
        created_at: null,
        status: null,
        is_admin: false,
        is_social: null,
    },
    reducers: {
        userLoading(state) {
            state.isLoading = true;
        },
        stopLoading(state) {
            state.isLoading = false;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(confirmCaptcha.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isRecaptchaValid = action.payload.success
            })
            .addCase(confirmCaptcha.rejected, (state, action) => {
                state.isLoading = false;
                state.isRecaptchaValid = action.payload.success
            })
            .addCase(signIn.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isAuthenticated = true;
                localStorage.setItem("token", action.payload.access_token)
                localStorage.setItem("refresh", action.payload.refresh_token)
            })
            .addCase(signIn.rejected, (state, _action) => {
                state.isLoading = false;
                state.isAuthenticated = false
            })
            .addCase(googleAuthCallback.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isAuthenticated = true;
                localStorage.setItem("token", action.payload.auth)
                localStorage.setItem("refresh", action.payload.refresh)
            })
            .addCase(googleAuthCallback.rejected, (state, _action) => {
                state.isLoading = false;
                state.isAuthenticated = false
            })
            .addCase(loadUser.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isAuthenticated = true;
                state.id = action.payload.id;
                state.email = action.payload.email;
                state.last_login = action.payload.last_login;
                state.updated_at = action.payload.updated_at;
                state.created_at = action.payload.created_at;
                state.status = action.payload.status;
                state.is_admin = action.payload.is_admin;
                state.is_social = action.payload.is_social;
            })
            .addCase(loadUser.rejected, (state, _action) => {
                state.isLoading = false;
                state.isAuthenticated = false
            })
    },
});

export const auth = (state) => state.auth;
export const authActions = authSlice.actions;
export default authSlice.reducer;

