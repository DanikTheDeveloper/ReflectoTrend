import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axiosInstance from "../store/axios";
import { notificationActions } from "./NotificationSlice";

export interface TrendingCoin {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  fully_diluted_valuation?: number;
  circulating_supply?: number;
  total_supply?: number;
  max_supply?: number | null;
  ath?: number;
  ath_change_percentage?: number;
  ath_date?: string;
  atl?: number;
  atl_change_percentage?: number;
  atl_date?: string;
  last_updated?: string;
}

export interface TrendsState {
  isLoading: boolean;
  coins: TrendingCoin[];
  lastUpdate: string | null;
  error: string | null;
}

interface TrendsAPIResponse {
  coins?: TrendingCoin[];
}

export const getTrendingCoins = createAsyncThunk<
  TrendingCoin[],
  void,
  { rejectValue: string }
>(
  "trends/getTrendingCoins",
  async (_, thunkAPI) => {
    try {
      thunkAPI.dispatch(trendsActions.setLoading(true));
      const resp = await axiosInstance.get<TrendingCoin[]>("/api/trends");
      return resp.data;
    } catch (error: any) {
      thunkAPI.dispatch(
        notificationActions.setStatus({
          type: "error",
          title: "Trending Coins",
          message: error.response?.data || "Failed to fetch trending coins",
        })
      );
      thunkAPI.dispatch(trendsActions.setLoading(false));
      return thunkAPI.rejectWithValue(
        error.response?.data || "Failed to fetch trending coins"
      );
    }
  }
);

const initialState: TrendsState = {
  isLoading: false,
  coins: [],
  lastUpdate: null,
  error: null,
};

export const trendsSlice = createSlice({
  name: "trends",
  initialState,
  reducers: {
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    clearError(state) {
      state.error = null;
    },
    clearCoins(state) {
      state.coins = [];
      state.lastUpdate = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getTrendingCoins.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getTrendingCoins.fulfilled, (state, action: PayloadAction<TrendingCoin[]>) => {
        state.coins = action.payload;
        state.lastUpdate = new Date().toISOString();
        state.isLoading = false;
        state.error = null;
      })
      .addCase(getTrendingCoins.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Failed to fetch trending coins";
      });
  },
});

export const trendsActions = trendsSlice.actions;
export default trendsSlice.reducer;
