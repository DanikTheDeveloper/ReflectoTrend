import React from "react";
import classes from "./Landing.module.css";
import {
    Title,
    Button,
    ActionButton,
    Text,
    Input,
    Flex,
    ScrollArea,
    Box,
} from '@mantine/core';
import Home from "./Home.js";
import {useNavigate} from "react-router-dom";
import CustomCard from "../../Common/Card.js";
import Header from "../../Home/Header/Header.js";
import PrivateHeader from "../../Home/Header/PrivateHeader.js";
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
            <>
                <PrivateHeader />
                <ScrollArea className={classes.body} h="100%">
                    <Flex direction="column" gap="lg" className="container mx-auto my-lg">
                        <Home />
                    </Flex>
                </ScrollArea>
            </>
            :
            <>
                <Header />
                <LandingPageNotAuthenticated />
            </>
        }
        </>
    );
}

export default LandingPage;
