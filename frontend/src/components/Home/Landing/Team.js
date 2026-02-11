import React from 'react'
import {Group, Anchor, Container, Flex, Text, Card, Image, Space } from '@mantine/core';
import { FaFacebookF, FaTwitter, FaLinkedinIn, FaInstagram, FaYoutube } from 'react-icons/fa';
import classes from './Landing.module.css';
import { useSelector } from 'react-redux';
import PrivateHeader from "../../Home/Header/PrivateHeader.js";
import Header from '../../Home/Header/Header.js';
import PageBackground from "../../Common/Background";

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
        <PageBackground>
            {isAuthenticated ? <PrivateHeader /> : <Header />}
            <Container>
                <Flex gap="md" justify="center" align="center" direction="column" wrap="wrap" padding={40}>
                    <Text align="center" style={{ fontSize: "32px" , color: "#EDE9FF"}}>
                        Our Team
                    </Text>
                    <Flex gap="sm" direction="row" justify="center">
                        <Card shadow="sm" padding="md" radius="md" style={{background: 'linear-gradient(40deg, #12082e 0%, #1c1050 45%, #0e1a3a 100%)' }} >
                            <Image src="images/team-1.jpg" alt="" style={{ borderRadius: "50%" }} />
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
                        <Card shadow="sm" padding="md" radius="md" style={{background: 'linear-gradient(40deg, #12082e 0%, #1c1050 45%, #0e1a3a 100%)' }} >
                            <Image src="images/team-3.jpg" alt="" style={{ borderRadius: "50%" }} />
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
        </PageBackground>
        </>
    );
}

export default Team;
