import { Anchor } from "@mantine/core";
import React from "react";
import { useNavigate } from "react-router-dom";
import classes from "./Footer.module.css";

const Footer = () => {
    const navigate = useNavigate();
    const currentYear = new Date().getFullYear();
    const openContactUs = () => {
        window.open("/contact-us", "_blank");
    }

    return (
        <div className={classes.footer}>
            <p className={classes.linklabel}>
            Reflecto Trade &copy; {" "}
            <span id="currentYear">
                {currentYear}
            </span>
            {" "} | {" "}
            <Anchor
                className={classes.linklabel}
                onClick={() => openContactUs()}
                variant="outline"
            >
                <span>Contact Us </span>
            </Anchor>
            </p>
        </div>
    );
}

export default Footer;
