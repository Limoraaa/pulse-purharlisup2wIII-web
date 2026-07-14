// import node module libraries
import { configureStore } from "@reduxjs/toolkit";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";

//import required reducers
import appReducer from "./slices/appSlice";
import inventoryToolsReducer from "./slices/inventoryToolsSlice";

const store = configureStore({
  reducer: {
    app: appReducer,
    inventoryTools: inventoryToolsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;

export type AppDispatch = typeof store.dispatch;
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();

export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export default store;
