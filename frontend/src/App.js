import React from "react";
import {
    RouterProvider,
    createBrowserRouter,
    defer,
} from "react-router-dom";
import { myTheme, resolver } from "./theme.js";
import { MantineProvider} from '@mantine/core';

import LandingPage from "./components/Home/Landing/LandingPage.js";
import Dashboard from "./components/Dashboard/Dashboard.js";
import NotFound from "./components/Utils/NotFound.js";
import ContactUs from "./components/Home/ContactPage/ContactUs.js";
import SignIn from "./components/Auth/SignIn.js";
import SignOut from "./components/Auth/SignOut.js";
import Register from "./components/Auth/Register.js";
import Pricing from "./components/Pricing/Pricing.js";
import PricingDashboard from "./components/Pricing/PricingDashboard.js";
import BackendCallback from "./components/Common/BackendCallback.js";
import PrivateRoute from "./components/Common/PrivateRoute.js";
import VerifyEmail from "./components/Auth/VerifyEmail.js";
import ResetPassword from "./components/Auth/ResetPassword.js";
import Profile from "./components/Account/Profile.js";
import Layout from "./components/Home/Layout/Layout.js";
import Blog from "./components/Blog/Blog.js";
import About from "./components/Home/Landing/About.js";
import Team from "./components/Home/Landing/Team.js";
import Terms from "./components/Home/Landing/Terms.js";
import { getStockList } from "./store/StockSlice.js";
import { loadUser, googleAuthCallback } from "./store/AuthSlice.js";
import '@mantine/dates/styles.css';
import {useSelector} from "react-redux";
import { Provider } from "react-redux";
import store from "./store/store.js";

const DashboardLoader = async () => {
    const resp = store.dispatch(getStockList({}));
    return defer({
        stockList: await resp
    });
};

const userLoader = async () => {
    console.log("loading user from app");
    if (localStorage.getItem('token') !== null) {
        const resp = store.dispatch(loadUser("from app"));
        return defer({
            user: await resp
        });
    } else {
        return defer({
            user: null
        });
    }
};

const App = () => {
    const router = createBrowserRouter([
        {
            path: "/",
            loader: () => userLoader(),
            element: <Layout />,
            errorElement: <NotFound />,
            id: "root",
            children: [
                { index: true, element: <LandingPage /> },
                {
                    path: "/dashboard",
                    loader: () => DashboardLoader(),
                    element: <PrivateRoute><Dashboard /></PrivateRoute>
                },
                {
                    path: "/blog",
                    element: <Blog />
                },
                {
                    path: "/user-details",
                    element: <PrivateRoute><Profile /></PrivateRoute>
                },
                {
                    path: "/signin",
                    element: <SignIn />
                },
                {
                    path: "/VerifyEmail",
                    element: <VerifyEmail />
                },
                {
                    path: "/signout",
                    element: <SignOut />
                },
                {
                    path: "/register",
                    element: <Register />
                },
                {
                    path: "/ResetPassword",
                    element: <ResetPassword />
                },
                {
                    path: "/contact-us",
                    element: <ContactUs />
                },
                {
                    path: "/pricing",
                    element: <Pricing />
                },
                {
                    path: "/pricingDashboard",
                    element: <PricingDashboard />
                },
                {
                    path: "/about",
                    element: <About />
                },
                {
                    path: "/team",
                    element: <Team />
                },
                {
                    path: "/terms",
                    element: <Terms />
                },
                {
                    path: "/api/googleAuthCallback",
                    element: <BackendCallback />
                },
                { path: "*", element: <NotFound/>}
            ],
        },
    ]);

    return (
        <MantineProvider theme={myTheme} cssVariablesResolver={resolver}>
            <Provider store={store}>
                <RouterProvider router={router}/>
            </Provider>
        </MantineProvider>
    );
};

export default App;
