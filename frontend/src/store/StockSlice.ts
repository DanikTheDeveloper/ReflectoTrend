import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import axiosInstance from "../store/axios";
import { notificationActions } from "./NotificationSlice";

export interface StockListItem {
  symbol: string;
  name: string;
  exchange?: string;
}

export interface StockDataPoint {
  Date: string;
  Data: {
    Open: string | number;
    High: string | number;
    Low: string | number;
    Close: string | number;
    Volume?: string | number;
  };
}

export interface SimilarSlice {
  similarity: number;
  startDate: string;
  endDate: string;
  slice: StockDataPoint[];
  forward?: StockDataPoint[];
  forwardReturn?: number;
  truncated?: boolean;
}

export interface AnalyseStats {
  sampleCount: number;
  lookAheadCandles: number;
  pctHigher: number;
  medianReturn: number;
  meanReturn: number;
  bestReturn: number;
  worstReturn: number;
  medianPath: number[];
}

export interface StockState {
  isLoading: boolean;
  isAnalyseLoading: boolean;
  stockList: StockListItem[];
  stockData: StockDataPoint[];
  analyseData: SimilarSlice[];
  analyseStats: AnalyseStats | null;
}

export interface GetStockDataParams {
  stockName: string;
  interval: string;
  startDate: string;
  endDate: string;
}

export interface AnalyseParams extends GetStockDataParams {
  minimumSimilarityRate?: number;
  sliceToAnalyse?: [string, string];
  searchScope?: string;
  lookAheadCandles?: number;
  maxResults?: number;
}

interface StockListResponse {
  assets: StockListItem[];
}

interface StockDataResponse {
  share: StockDataPoint[];
}

interface AnalyseResponse {
  matches: SimilarSlice[];
  stats: AnalyseStats | null;
}

export const getStockList = createAsyncThunk<
  StockListResponse,
  void,
  { rejectValue: string }
>(
  "stock/getStockList",
  async (_, thunkAPI) => {
    try {
      thunkAPI.dispatch(stockActions.stockLoading());
      const resp = await axiosInstance.get<StockListResponse>("/api/getStockList");
      return resp.data;
    } catch (error: any) {
      thunkAPI.dispatch(
        notificationActions.setStatus({
          type: "error",
          title: "Stock List",
          message: extractErrorMessage(error, "Failed to fetch stock list"),
        })
      );
      throw error;
    }
  }
);

export const getStockData = createAsyncThunk<
  StockDataResponse,
  GetStockDataParams,
  { rejectValue: string }
>(
  "stock/getStockData",
  async ({ stockName, interval, startDate, endDate }, thunkAPI) => {
    try {
      thunkAPI.dispatch(stockActions.stockLoading());
      const body = JSON.stringify({ stockName, interval, startDate, endDate });
      const resp = await axiosInstance.post<StockDataResponse>("/api/getStockData", body);
      return resp.data;
    } catch (error: any) {
      thunkAPI.dispatch(
        notificationActions.setStatus({
          type: "error",
          message: extractErrorMessage(error, "Failed to fetch stock data"),
        })
      );
      thunkAPI.dispatch(stockActions.stopStockLoading());
      throw error;
    }
  }
);

export const handleAnalyse = createAsyncThunk<
  AnalyseResponse,
  AnalyseParams,
  { rejectValue: string }
>(
  "stock/handleAnalyse",
  async (
    { stockName, interval, startDate, endDate, minimumSimilarityRate, sliceToAnalyse, searchScope },
    thunkAPI
  ) => {
    try {
      thunkAPI.dispatch(stockActions.analyseLoading());
      const body = JSON.stringify({
        stockName,
        interval,
        startDate,
        endDate,
        minimumSimilarityRate,
        sliceToAnalyse,
        searchScope,
      });
      const resp = await axiosInstance.post<AnalyseResponse>("/api/analyse", body);
      
      if (!resp.data.matches || resp.data.matches.length === 0) {
        thunkAPI.dispatch(
          notificationActions.setStatus({
            type: "info",
            title: "Analyse",
            message: "No matches found — try lowering the similarity rate or changing the slice",
          })
        );
      }
      
      return resp.data;
    } catch (error: any) {
      console.log(error);
      thunkAPI.dispatch(stockActions.stopAnalyseLoading());
      thunkAPI.dispatch(
        notificationActions.setStatus({
          type: "error",
          title: "Analyse",
          message: extractErrorMessage(error, "Analysis failed"),
        })
      );
      throw error;
    }
  }
);

export const getStockDataAPI = createApi({
  baseQuery: fetchBaseQuery({ baseUrl: "/api/getStockData" }),
  keepUnusedDataFor: 1800,
  refetchOnMountOrArgChange: true,
  endpoints: (builder) => ({
    getStockData: builder.query<StockDataResponse, GetStockDataParams>({
      query: ({ stockName, interval, startDate, endDate }) => {
        return {
          url: `/api/getStockData/`,
          method: "POST",
          body: { stockName, interval, startDate, endDate },
        };
      },
    }),
  }),
});

function extractErrorMessage(err: any, fallback: string): string {
  if (!err.response?.data) return fallback;
  const d = err.response.data;
  if (typeof d === "string") return d;
  if (typeof d === "object" && d !== null && typeof d.error === "string") return d.error;
  return fallback;
}

const initialState: StockState = {
  isLoading: false,
  isAnalyseLoading: false,
  stockList: [],
  stockData: [],
  analyseData: [],
  analyseStats: null,
};

export const stockSlice = createSlice({
  name: "stock",
  initialState,
  reducers: {
    stockLoading(state) {
      state.isLoading = true;
    },
    stopStockLoading(state) {
      state.isLoading = false;
    },
    analyseLoading(state) {
      state.isAnalyseLoading = true;
    },
    stopAnalyseLoading(state) {
      state.isAnalyseLoading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getStockList.fulfilled, (state, action: PayloadAction<StockListResponse>) => {
        state.stockList = action.payload.assets;
        state.isLoading = false;
      })
      .addCase(getStockList.rejected, (state) => {
        state.stockList = [];
        state.isLoading = false;
      })
      .addCase(getStockData.fulfilled, (state, action: PayloadAction<StockDataResponse>) => {
        state.stockData = action.payload.share;
        state.isLoading = false;
      })
      .addCase(getStockData.rejected, (state) => {
        state.stockData = [];
        state.isLoading = false;
      })
      .addCase(handleAnalyse.fulfilled, (state, action: PayloadAction<AnalyseResponse>) => {
        state.analyseData = action.payload.matches || [];
        state.analyseStats = action.payload.stats || null;
        state.isAnalyseLoading = false;
      })
      .addCase(handleAnalyse.rejected, (state) => {
        state.isAnalyseLoading = false;
      });
  },
});

export const stockActions = stockSlice.actions;
export const { useGetStockDataQuery } = getStockDataAPI;
export default stockSlice.reducer;
