import React from 'react';
import { Carousel } from '@mantine/carousel';
import { TextInput, Button, Anchor, Text, Container, Flex, Image, BackgroundImage, Card, Badge, Group, Center, Space } from '@mantine/core';
import Header from "../Header/Header";
import classes from './Landing.module.css';
import AutoPlay from "embla-carousel-autoplay";
import { IconPhone, IconMail } from '@tabler/icons-react';
import { useNavigate } from "react-router-dom";
import '@mantine/carousel/styles.css';

const LandingPageNotAuthenticated = () => {
    const autoplay = React.useRef(AutoPlay({ delay: 7000 }));
    const navigate = useNavigate();
    const currentYear = new Date().getFullYear();
    const openContactUs = () => {
        window.open("/contact-us", "_blank");
    }

    const [email, setEmail] = React.useState("");
    const handleSubscription = () => {
        console.log(email);
    }

    return (
        <>
        <BackgroundImage src="images/hero-bg.png" position="center" size="cover" alt="bg" >
                <Header
                    image="./images/reflecto_dark.svg"
                />
                <Carousel
                    withControls={false}
                    slideGap="lg"
                    loop
                    slideSize="100%"
                    height="500"
                    slidesToScroll={1}
                    withIndicators={true}
                    align="start"
                    plugins={[autoplay.current]}
                    onMouseEnter={autoplay.current.stop}
                    onMouseLeave={autoplay.current.play}
                >
                    <Carousel.Slide>
                        <Flex gap="sm" justify="center" align="flex-start" direction="row" wrap="wrap" padding={40}>
                            <Flex gap="sm" align="flex-start" justify="center" direction="column" wrap="wrap" style={{ marginTop: "120px", padding: "20px" }}>
                                <Text style={{ fontSize: "32px", color: "white" }}>
                                    Find Patterns <br />
                                    in Crypto <br />
                                    Currency
                                </Text>
                                <Text style={{ fontSize: "16px", color: "white" }}>
                                    Smart Pattern Recognition: Identifying and highlighting historical market patterns <br />
                                    that exhibit stark similarities with current movements.
                                </Text>
                                <Button
                                    variant="filled"
                                    color="blue"
                                    size="md"
                                    radius="md"
                                    padding="xl"
                                    fullWidth={false}
                                    onClick={() => navigate("/register")}
                                >
                                    Get Started
                                </Button>
                            </Flex>
                            <Image className={classes.bounce} radius="md" h={400} w="auto" fit="contain" src="images/slider-img.png" alt="" />
                        </Flex>
                    </Carousel.Slide>
                    <Carousel.Slide>
                        <Flex gap="sm" justify="center" align="flex-start" direction="row" wrap="wrap" padding={40}>
                            <Flex gap="sm" align="flex-start" justify="center" direction="column" wrap="wrap" style={{ marginTop: "120px", padding: "20px" }}>
                                <Text style={{ fontSize: "32px", color: "white" }}>
                                    Smart Trading<br />
                                    Starts Here.<br />
                                </Text>
                                <Text style={{ fontSize: "16px", color: "white" }}>
                                    Deep Dive into crypto's history <br />
                                    for patterns that can help you predict the future.
                                </Text>
                            </Flex>
                            <Image className={classes.bounce} radius="md" h={400} w="auto" fit="contain" src="images/about-img.png" alt="" />
                        </Flex>
                    </Carousel.Slide>
                    <Carousel.Slide>
                        <Flex gap="sm" justify="center" align="flex-start" direction="row" wrap="wrap" padding={40}>
                            <Flex gap="sm" align="flex-start" justify="center" direction="column" wrap="wrap" style={{ marginTop: "120px", padding: "20px" }}>
                                <Text style={{ fontSize: "32px", color: "white" }}>
                                    Unlock Market <br />
                                    Insights <br />
                                </Text>
                                <Text style={{ fontSize: "16px", color: "white" }}>
                                    Smart Pattern Recognition: Identifying and highlighting historical market patterns <br />
                                    that exhibit stark similarities with current movements.
                                </Text>
                            </Flex>
                            <Image className={classes.bounce} radius="md" h={400} w="auto" fit="contain" src="images/slider-img2.png" alt="" />
                        </Flex>
                    </Carousel.Slide>
                </Carousel>
        </BackgroundImage>
            <Container>
                <Flex gap="md" justify="center" align="center" direction="column" wrap="wrap" >
                    <Text align="center" style={{ fontSize: "32px" }}>
                        Our Services
                    </Text>
                    <Text align="center" style={{ fontSize: "16px" }}>
                        We understand that within the flow of market trends lie hidden parallels and recurring motifs, often shadowing the potential of lucrative opportunities.
                    </Text>
                    <Space h="lg" />
                    <Flex gap="sm" direction="row" justify="center">
                        <Card shadow="sm" padding="md" radius="md" >
                            <img
                                src="images/s3.png"
                                alt="Analysis"
                                style={{ width: "50%", display: "flex", alignSelf: "center" }}
                            />

                            <Group justify="center" mt="md" mb="xs">
                                <Text fw={500}>Analysis Tools</Text>

                                <Text center size="sm" c="dimmed">
                                    Comes with all the tools included that you will need to analyze the market.
                                </Text>

                            </Group>
                        </Card>
                        <Card shadow="sm" padding="md" radius="md" >
                            <Image
                                src="images/s2.png"
                                alt="service wallet"
                                style={{ width: "50%", display: "flex", alignSelf: "center" }}
                            />
                            <Group justify="center" mt="md" mb="xs">
                                <Text fw={500}>Complete History</Text>
                                <Text size="sm" c="dimmed">
                                    Analyze each crypto currency against its whole history to make a decision.
                                </Text>
                            </Group>
                        </Card>
                        <Card shadow="sm" padding="md" radius="md" >
                            <Image
                                src="images/s1.png"
                                alt="service wallet"
                                style={{ width: "50%", display: "flex", alignSelf: "center" }}
                            />
                            <Group justify="center" mt="md" mb="xs">
                                <Text fw={500}>Amazing UI</Text>
                                <Text size="sm" c="dimmed">
                                    Comes with easy to use graphical interface to make your analysis easy.
                                </Text>
                            </Group>
                        </Card>
                    </Flex>
                    <Space h="lg" />
                </Flex>

            </Container>
            <BackgroundImage src="images/stacked.svg" position="center" size="cover" alt="bg" style={{ padding: "20px" }}>
            <Container  style={{ padding: "20px" }}>
                <Flex gap="sm" justify="center" align="center" direction="column" wrap="wrap" >
                    <Text style={{ fontSize: "32px", color: "white" }}>
                        About <span style={{ color: "#00bbf0" }}>Us </span>
                    </Text>
                    <Text style={{ fontSize: "16px", color: "white" }}>
                        Pet project for two amigos!
                    </Text>
                </Flex>
                <Flex gap="sm" justify="center" align="flex-start" direction="row" wrap="wrap">
                    <Flex gap="sm" align="flex-start" justify="center" direction="column" wrap="wrap" style={{ marginTop: "20px", padding: "20px" }}>
                        <Text style={{ fontSize: "32px", color: "white" }}>
                            We are Reflecto, this is a pet project created by two friends! 
                        </Text>
                        <Text style={{ fontSize: "16px", color: "white" }} >
                            
                        </Text>
                        <Space h="lg" />
                    </Flex>
                </Flex>
            </Container>
            </BackgroundImage>
                <Space h="lg" />
                <Flex direction="row" justify="space-evenly" align="center">
                    <Flex direction="column" justify="space-between" align="flex-start" >
                        <Text style={{ fontSize: "24px" }} >
                            Contact Us
                        </Text>
                        <Space h="md" />
                        <Anchor href="index.html" underline="hover" className={classes.anchorLabel}>
                            <IconPhone size="24px" />
                            <span>
                                Call +91 9354340241
                            </span>
                        </Anchor>
                        <Space h="sm" />
                        <Anchor href="index.html" underline="hover" className={classes.anchorLabel}>
                            <IconMail size="24px" />
                            <span>
                                piyushkhurana38@gmail.com
                            </span>
                        </Anchor>
                    </Flex>
                        <Flex direction="column" justify="space-between" align="flex-start" style={{ marginTop: "50px" }}>
                            <Text style={{ fontSize: "24px" }} >
                                Links
                            </Text>
                            <Space h="sm" />
                            <Anchor underline="hover" className={classes.anchorLabel} onClick={() => navigate("/")} >
                                Home
                            </Anchor>
                            <Space h="sm" />
                            <Anchor underline="hover" className={classes.anchorLabel} onClick={() => navigate("/about")} >
                                About
                            </Anchor>
                            <Space h="sm" />
                            <Anchor underline="hover" className={classes.anchorLabel} onClick={() => navigate("/about")} >
                                Why Us
                            </Anchor>
                            <Space h="sm" />
                            <Anchor underline="hover" className={classes.anchorLabel} onClick={() => navigate("/team")} >
                                Team
                            </Anchor>
                        </Flex>
                        <Space w="xl" />
                        <Space w="xl" />
                        <Flex direction="column" justify="space-between" align="flex-start" style={{float: "left" }} >
                            <Text style={{ fontSize: "24px" }} >
                                Subscribe
                            </Text>
                            <TextInput placeholder="Enter email" label="Email" size="md" value={email} onChange={(e) => setEmail(e.target.value)} />
                            <Space h="xs" />
                            <Button type="submit" size="md" fullWidth onClick={handleSubscription}>
                                Subscribe
                            </Button>
                        </Flex>
                    </Flex>
                <Space h="xl" />
                <Space h="xl" />
                <Flex direction="row" justify="center" align="center" wrap="wrap" style={{ height: "45px", width: "100%", color: "white" }}>
                    Reflecto Trend &copy; {" " + currentYear + " "} All Rights Reserved
                </Flex>
        </>
    );
}

export default LandingPageNotAuthenticated;
