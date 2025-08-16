import React from "react";
import Header from "../Header/Header.js";
import PrivateHeader from "../Header/PrivateHeader.js";
import Footer from "../Footer/Footer.js";
import { ScrollArea } from "@mantine/core";
import NotificationBar from "../../Notification/Notification.js";
import { Outlet } from "react-router-dom";
import classes from "./Layout.module.css";

const Layout = () => {
    return (
        <div id="page_container" className={classes.page_container}>
            <NotificationBar />
            <main id="main_content" className={classes.main_content}>
                <Outlet />
            </main>
            <Footer />
        </div>
    )
}

export default Layout;
