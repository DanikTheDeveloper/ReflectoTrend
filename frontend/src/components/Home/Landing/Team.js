import React from 'react'
import {Group, Anchor, Container, Flex, Text, Card, Image, Space } from '@mantine/core';
import { FaFacebookF, FaTwitter, FaLinkedinIn, FaInstagram, FaYoutube } from 'react-icons/fa';
import classes from './Landing.module.css';
import { useSelector } from 'react-redux';
import PrivateHeader from "../../Home/Header/PrivateHeader.js";
import Header from '../../Home/Header/Header.js';

const icons = {
    facebook: FaFacebookF,
    twitter: FaTwitter,
    linkedin: FaLinkedinIn,
    instagram: FaInstagram,
    youtube: FaYoutube,
};

const SocialIcon = ({ icon: Icon }) => (
    <Anchor href="#" className={classes.socialIcon} target="_blank" rel="noopener noreferrer">
        <Icon size={20} />
    </Anchor>
);

const SocialMediaBar = () => (
    <Group spacing={5} justify="center" style={{ padding: '10px 0' }}>
        {Object.values(icons).map((Icon, index) => (
            <SocialIcon key={index} icon={Icon} />
        ))}
    </Group>
);
const Team = () => {
    const isAuthenticated = useSelector(state => state.auth.isAuthenticated);
    const currentYear = new Date().getFullYear();
    return (
        <>
            {isAuthenticated ? <PrivateHeader /> : <Header />}
            <Container>
                <Flex gap="md" justify="center" align="center" direction="column" wrap="wrap" padding={40}>
                    <Text align="center" style={{ fontSize: "32px" }}>
                        Our <span style={{ color: "#00bbf0" }}>Team</span>
                    </Text>
                    <Flex gap="sm" direction="row" justify="center">
                        <Card shadow="sm" padding="md" radius="md" >
                            <Image src="images/team-1.jpg" class="img1" alt="" style={{ borderRadius: "50%" }} />
                            <Flex direction="column" justify="center" align="center">
                                <Text size="lg">
                                    Denny
                                </Text >
                                <Text size="md" c="dimmed">
                                    Full Stack Developer
                                </Text>
                            </Flex>
                            <SocialMediaBar />
                        </Card>
                        <Card shadow="sm" padding="md" radius="md" >
                            <Image src="images/team-3.jpg" class="img1" alt="" style={{ borderRadius: "50%" }} />
                            <Flex direction="column" justify="center" align="center">
                                <Text size="lg">
                                    Piyush Khurana
                                </Text >
                                <Text size="md" c="dimmed">
                                    Full Stack Developer
                                </Text>
                            </Flex>
                            <SocialMediaBar />
                        </Card>
                    </Flex>
                    <Space h="lg" />
                </Flex>
            </Container>
                <Flex direction="row" justify="center" align="center" wrap="wrap" style={{ height: "45px", width: "100%", color: "white" }}>
                    Reflecto Trend &copy; {" " + currentYear + " "} All Rights Reserved
                </Flex>
        </>
    );
}

export default Team;
