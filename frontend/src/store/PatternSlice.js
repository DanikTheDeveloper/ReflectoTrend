import { createSelector, createSlice } from '@reduxjs/toolkit';

export const patternSlice = createSlice({
    name: "pattern",
    initialState: {
        isLoading: true,
    },
    reducers: {
    },
});

export const patternActions = patternSlice.actions;
export const pattern = (state) => state.pattern;
export default patternSlice.reducer;
