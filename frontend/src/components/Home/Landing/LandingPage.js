import React from "react";
import classes from "./Landing.module.css";
import Home from "./Home";
import { useSelector } from "react-redux";
import LandingPageNotAuthenticated from "./LandingPageNotAuthenticated.js";

const LandingPage = () => {
    const isAuthenticated = useSelector(state => state.auth.isAuthenticated)

    const card = {
        description: 'Stay updated with the latest headlines, breaking stories, and in-depth reporting on current events from around the world.',
        icon: 'newspaper',
        label: 'News',
        href: '/news',
        activeUsers: 0,
        image: 'https://cdn.pixabay.com/photo/2014/05/21/22/28/old-newspaper-350376_1280.jpg',
    }

    return (
        <>
        { isAuthenticated ?
            <Home />
            :
            <>
                <LandingPageNotAuthenticated />
            </>
        }
        </>
    );
}

export default LandingPage;
