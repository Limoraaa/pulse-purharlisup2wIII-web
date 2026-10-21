"use client";
//import node modules libraries
import { Provider } from "react-redux";

//import redux store
import store from "store/store";
import { FeedbackProvider } from "./FeedbackProvider";

const ClientWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <Provider store={store}>
      <FeedbackProvider>{children}</FeedbackProvider>
    </Provider>
  );
};

export default ClientWrapper;
