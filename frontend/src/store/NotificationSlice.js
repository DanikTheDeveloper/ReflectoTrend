import { createSelector, createSlice, createAsyncThunk} from '@reduxjs/toolkit';

// types:
// error
// success
// warning

export const notificationSlice = createSlice({
    name: "notification",
    initialState: {
        type: null,
        title: null,
        message: null
    },
    reducers: {
        clearStatus(state, action) {
            state.type = null;
            state.title = null;
            state.message = null;
        },
        setStatus(state, action) {
            state.type = action.payload.type;
            state.title = action.payload.title;
            state.message = action.payload.message;
        }
    },
});

export const notificationActions = notificationSlice.actions;
export const notification = (state) => state.notification;
export default notificationSlice.reducer;
