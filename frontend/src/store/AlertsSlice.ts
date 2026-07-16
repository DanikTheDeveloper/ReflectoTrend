import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axiosInstance from "../store/axios";
import { notificationActions } from "./NotificationSlice";

export interface AlertItem {
  id: number;
  user_email: string;
  symbol: string;
  condition: string;
  target_value: number;
  window_minutes?: number | null;
  status: string;
  repeat: boolean;
  created_at: string;
  triggered_at?: string | null;
}

export interface CreateAlertParams {
  symbol: string;
  condition: string;
  target_value: number;
  window_minutes?: number;
  repeat?: boolean;
}

export interface UpdateAlertParams {
  id: number;
  target_value?: number;
  status?: string;
  repeat?: boolean;
}

interface AlertsState {
  alerts: AlertItem[];
  isLoading: boolean;
}

const initialState: AlertsState = {
  alerts: [],
  isLoading: false,
};

export const fetchAlerts = createAsyncThunk<AlertItem[], void, { rejectValue: string }>(
  "alerts/fetchAlerts",
  async (_, thunkAPI) => {
    try {
      thunkAPI.dispatch(alertsActions.setLoading(true));
      const resp = await axiosInstance.get<AlertItem[]>("/api/alerts");
      return resp.data;
    } catch (error: any) {
      thunkAPI.dispatch(
        notificationActions.setStatus({
          type: "error",
          title: "Alerts",
          message: error.response?.data?.error || "Failed to fetch alerts",
        })
      );
      return thunkAPI.rejectWithValue(error.response?.data || "Failed");
    }
  }
);

export const createAlert = createAsyncThunk<AlertItem, CreateAlertParams, { rejectValue: string }>(
  "alerts/createAlert",
  async (params, thunkAPI) => {
    try {
      const resp = await axiosInstance.post<AlertItem>("/api/alerts", params);
      thunkAPI.dispatch(
        notificationActions.setStatus({
          type: "success",
          title: "Alert Created",
          message: `Alert set for ${params.symbol}`,
        })
      );
      return resp.data;
    } catch (error: any) {
      thunkAPI.dispatch(
        notificationActions.setStatus({
          type: "error",
          title: "Create Alert",
          message: error.response?.data?.error || "Failed to create alert",
        })
      );
      return thunkAPI.rejectWithValue(error.response?.data || "Failed");
    }
  }
);

export const deleteAlert = createAsyncThunk<number, number, { rejectValue: string }>(
  "alerts/deleteAlert",
  async (id, thunkAPI) => {
    try {
      await axiosInstance.delete(`/api/alerts/${id}`);
      thunkAPI.dispatch(
        notificationActions.setStatus({
          type: "success",
          title: "Alert Deleted",
          message: "Alert has been removed",
        })
      );
      return id;
    } catch (error: any) {
      thunkAPI.dispatch(
        notificationActions.setStatus({
          type: "error",
          title: "Delete Alert",
          message: error.response?.data?.error || "Failed to delete alert",
        })
      );
      return thunkAPI.rejectWithValue(error.response?.data || "Failed");
    }
  }
);

export const updateAlert = createAsyncThunk<AlertItem, UpdateAlertParams, { rejectValue: string }>(
  "alerts/updateAlert",
  async (params, thunkAPI) => {
    try {
      const { id, ...body } = params;
      const resp = await axiosInstance.patch<AlertItem>(`/api/alerts/${id}`, body);
      thunkAPI.dispatch(
        notificationActions.setStatus({
          type: "success",
          title: "Alert Updated",
          message: "Alert has been updated",
        })
      );
      return resp.data;
    } catch (error: any) {
      thunkAPI.dispatch(
        notificationActions.setStatus({
          type: "error",
          title: "Update Alert",
          message: error.response?.data?.error || "Failed to update alert",
        })
      );
      return thunkAPI.rejectWithValue(error.response?.data || "Failed");
    }
  }
);

const alertsSlice = createSlice({
  name: "alerts",
  initialState,
  reducers: {
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    clearAlerts(state) {
      state.alerts = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAlerts.fulfilled, (state, action) => {
        state.alerts = action.payload;
        state.isLoading = false;
      })
      .addCase(fetchAlerts.rejected, (state) => {
        state.isLoading = false;
      })
      .addCase(createAlert.fulfilled, (state, action) => {
        state.alerts.unshift(action.payload);
      })
      .addCase(deleteAlert.fulfilled, (state, action) => {
        state.alerts = state.alerts.filter((a) => a.id !== action.payload);
      })
      .addCase(updateAlert.fulfilled, (state, action) => {
        const idx = state.alerts.findIndex((a) => a.id === action.payload.id);
        if (idx !== -1) {
          state.alerts[idx] = action.payload;
        }
      });
  },
});

export const alertsActions = alertsSlice.actions;
export default alertsSlice.reducer;
