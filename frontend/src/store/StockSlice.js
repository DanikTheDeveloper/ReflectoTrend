import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import axiosInstance from "../store/axios.js";
import { notificationActions } from "./NotificationSlice.js";

export const getStockList = createAsyncThunk(
	"stock/getStockList",
	async (something = null, thunkAPI) => {
		try {
			thunkAPI.dispatch(stockActions.stockLoading());
			const resp = await axiosInstance.get("/api/getStockList/");
			return resp.data;
		} catch (error) {
			thunkAPI.dispatch(
				notificationActions.setStatus({
					type: "error",
					title: "Stock List",
					message: error.response.data,
				}),
			);
			throw error;
		}
	},
);

export const getStockData = createAsyncThunk(
	"stock/getStockData",
	async ({ stockName, interval, startDate, endDate }, thunkAPI) => {
		try {
			thunkAPI.dispatch(stockActions.stockLoading());
			const body = JSON.stringify({ stockName, interval, startDate, endDate });
			const resp = await axiosInstance.post("/api/getStockData", body);
			return resp.data;
		} catch (error) {
			thunkAPI.dispatch(notificationActions.setStatus({type: 'error', message: error.response.data }))
			thunkAPI.dispatch(stockActions.stopStockLoading());
			throw error;
		}
	},
);

export const handleAnalyse = createAsyncThunk(
	"stock/handleAnalyse",
	async({ stockName, interval, startDate, endDate, minimumSimilarityRate, sliceToAnalyse}, thunkAPI) => {
		try {
			thunkAPI.dispatch(stockActions.analyseLoading());
			const body = JSON.stringify({ stockName, interval, startDate, endDate, minimumSimilarityRate, sliceToAnalyse });
			const resp = await axiosInstance.post("/api/analyse", body);
			if (resp.data.similarSlices == null) {
					thunkAPI.dispatch(notificationActions.setStatus({type: 'error', title:"Analyse", message: "No similar Slices Found" }))
			}
			return resp.data;
		}
		catch (error){
			console.log(error)
			thunkAPI.dispatch(stockActions.analyseLoading());
			thunkAPI.dispatch(notificationActions.setStatus({type: 'error', title: "Analyse", message: error.response.data }))
			throw error;
		}
	});

export const getStockDataAPI = createApi({
	baseQuery: fetchBaseQuery({ baseUrl: "/api/getStockData" }),
	keepUnusedDataFor: 1800,
	refetchOnMountorArgChange: true,
	endpoints: (builder) => ({
		getStockData: builder.query({
			query: ({ stockName, interval, startDate, endDate }) => {
				return {
					url: `/api/getStockData/`,
					body: { stockName, interval, startDate, endDate },
				};
			},
		}),
	}),
});


export const stockSlice = createSlice({
	name: "stock",
	initialState: {
		isLoading: false,
		isAnalyseLoading: false,
		stockList: [],
		stockData: [],
		analyseData: [],
	},
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
			.addCase(getStockList.fulfilled, (state, action) => {
				state.stockList = action.payload.assets;
				state.isLoading = false;
			})
			.addCase(getStockList.rejected, (state) => {
				state.stockList = [];
			})
			.addCase(getStockData.rejected, (state, action) => {
				state.stockData = [];
				state.isLoading = false;
			})
			.addCase(handleAnalyse.fulfilled, (state, action) => {
				state.analyseData = action.payload.similarSlices;
				state.isAnalyseLoading = false;
			})
			.addCase(handleAnalyse.rejected, (state, action) => {
				state.isAnalyseLoading = false;
			});
	},
});

export const stockActions = stockSlice.actions;
export const stock = (state) => stock.pattern;
export default stockSlice.reducer;

//export const getStockDataAPI;
