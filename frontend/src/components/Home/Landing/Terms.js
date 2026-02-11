import React from 'react'
import {Group, Anchor, Container, Flex, Text, Card, Space, Stack, Title, List } from '@mantine/core';
import { FaFacebookF, FaTwitter, FaLinkedinIn, FaInstagram, FaYoutube } from 'react-icons/fa';
import classes from './Landing.module.css';
import { useSelector } from 'react-redux';
import PrivateHeader from "../../Home/Header/PrivateHeader.js";
import Header from '../../Home/Header/Header.js';
import PageBackground from "../../Common/Background";

const Terms = () => {
    const isAuthenticated = useSelector(state => state.auth.isAuthenticated);
    
    const sectionStyle = {
        marginBottom: "32px",
    };
    
    const headingStyle = {
        color: "#EDE9FF",
        fontSize: "22px",
        fontWeight: 700,
        marginBottom: "12px",
        fontFamily: "'Georgia', 'Times New Roman', serif",
    };
    
    const textStyle = {
        color: "rgba(220,210,255,0.80)",
        fontSize: "15px",
        lineHeight: 1.7,
        marginBottom: "12px",
    };
    
    const listStyle = {
        color: "rgba(220,210,255,0.80)",
        fontSize: "15px",
        lineHeight: 1.7,
    };

    return (
        <>
        <PageBackground>
            {isAuthenticated ? <PrivateHeader /> : <Header />}
            <Container size="md" py={60}>
                <Flex gap="md" justify="center" align="center" direction="column" wrap="wrap">
                    
                    {/* Header */}
                    <Text 
                        align="center" 
                        style={{ 
                            fontSize: "42px",
                            fontWeight: 800,
                            color: "#EDE9FF",
                            marginBottom: "8px",
                            fontFamily: "'Georgia', 'Times New Roman', serif",
                        }}
                    >
                        Terms and Conditions
                    </Text>
                    <Text 
                        align="center" 
                        style={{ 
                            fontSize: "15px",
                            color: "rgba(167,139,250,0.60)",
                            marginBottom: "40px",
                        }}
                    >
                        Last updated: February 12, 2026
                    </Text>

                    {/* Content Card */}
                    <Card 
                        shadow="lg" 
                        padding="xl" 
                        radius="lg" 
                        style={{
                            background: 'rgba(255,255,255,0.04)',
                            backdropFilter: 'blur(14px)',
                            WebkitBackdropFilter: 'blur(14px)',
                            border: '1px solid rgba(255,255,255,0.09)',
                            maxWidth: '900px',
                            width: '100%',
                        }}
                    >
                        <Stack spacing="xl">

                            {/* Introduction */}
                            <div style={sectionStyle}>
                                <Text style={textStyle}>
                                    Welcome to our analytics platform (the "Service"). By accessing or using our Service, 
                                    you agree to be bound by these Terms and Conditions. Please read them carefully.
                                </Text>
                            </div>

                            {/* 1. Acceptance of Terms */}
                            <div style={sectionStyle}>
                                <Title order={3} style={headingStyle}>
                                    1. Acceptance of Terms
                                </Title>
                                <Text style={textStyle}>
                                    By creating an account or using the Service, you acknowledge that you have read, 
                                    understood, and agree to be bound by these Terms. If you do not agree, you must 
                                    discontinue use of the Service immediately.
                                </Text>
                            </div>

                            {/* 2. Account Registration */}
                            <div style={sectionStyle}>
                                <Title order={3} style={headingStyle}>
                                    2. Account Registration and Security
                                </Title>
                                <Text style={textStyle}>
                                    You must provide accurate, complete, and current information during registration. 
                                    You are responsible for:
                                </Text>
                                <List style={listStyle} spacing="xs" mt="sm">
                                    <List.Item>Maintaining the confidentiality of your account credentials</List.Item>
                                    <List.Item>All activities that occur under your account</List.Item>
                                    <List.Item>Notifying us immediately of any unauthorized access</List.Item>
                                </List>
                            </div>

                            {/* 3. Data Ownership and Usage */}
                            <div style={sectionStyle}>
                                <Title order={3} style={headingStyle}>
                                    3. Data Ownership and Usage Rights
                                </Title>
                                <Text style={textStyle}>
                                    <strong style={{ color: "#FCE073" }}>Your Data Remains Yours.</strong> You retain 
                                    all ownership rights to data you upload or generate using the Service ("Your Data"). 
                                    However, you grant us a limited license to:
                                </Text>
                                <List style={listStyle} spacing="xs" mt="sm">
                                    <List.Item>Store, process, and display Your Data to provide the Service</List.Item>
                                    <List.Item>Create aggregated, anonymized analytics for service improvement</List.Item>
                                    <List.Item>Backup Your Data for disaster recovery purposes</List.Item>
                                </List>
                                <Text style={{ ...textStyle, marginTop: "12px" }}>
                                    We will <strong style={{ color: "#FCE073" }}>never</strong> sell Your Data to third 
                                    parties or use it for purposes outside of providing and improving the Service.
                                </Text>
                            </div>

                            {/* 4. Prohibited Activities */}
                            <div style={sectionStyle}>
                                <Title order={3} style={headingStyle}>
                                    4. Prohibited Activities
                                </Title>
                                <Text style={textStyle}>
                                    You agree not to:
                                </Text>
                                <List style={listStyle} spacing="xs" mt="sm">
                                    <List.Item>Scrape, extract, or systematically collect data from the Service using automated means</List.Item>
                                    <List.Item>Reverse engineer, decompile, or attempt to derive source code from the Service</List.Item>
                                    <List.Item>Share your account credentials or access with unauthorized third parties</List.Item>
                                    <List.Item>Upload malicious code, viruses, or any harmful content</List.Item>
                                    <List.Item>Use the Service for any illegal or unauthorized purpose</List.Item>
                                    <List.Item>Interfere with or disrupt the Service or servers/networks connected to it</List.Item>
                                </List>
                            </div>

                            {/* 5. Data Protection */}
                            <div style={sectionStyle}>
                                <Title order={3} style={headingStyle}>
                                    5. Data Protection and Security
                                </Title>
                                <Text style={textStyle}>
                                    We implement industry-standard security measures to protect Your Data, including:
                                </Text>
                                <List style={listStyle} spacing="xs" mt="sm">
                                    <List.Item>Encryption of data in transit and at rest</List.Item>
                                    <List.Item>Regular security audits and monitoring</List.Item>
                                    <List.Item>Access controls and authentication mechanisms</List.Item>
                                    <List.Item>Secure backup and disaster recovery procedures</List.Item>
                                </List>
                                <Text style={{ ...textStyle, marginTop: "12px" }}>
                                    However, no method of transmission over the Internet is 100% secure. While we strive 
                                    to protect Your Data, we cannot guarantee absolute security.
                                </Text>
                            </div>

                            {/* 6. Intellectual Property */}
                            <div style={sectionStyle}>
                                <Title order={3} style={headingStyle}>
                                    6. Intellectual Property Rights
                                </Title>
                                <Text style={textStyle}>
                                    The Service, including its software, design, text, graphics, and functionality, is 
                                    owned by us and protected by copyright, trademark, and other intellectual property laws. 
                                    You may not copy, modify, distribute, or create derivative works without our express 
                                    written permission.
                                </Text>
                            </div>

                            {/* 7. Service Availability */}
                            <div style={sectionStyle}>
                                <Title order={3} style={headingStyle}>
                                    7. Service Availability and Modifications
                                </Title>
                                <Text style={textStyle}>
                                    We strive to maintain high availability, but we do not guarantee uninterrupted access. 
                                    We reserve the right to:
                                </Text>
                                <List style={listStyle} spacing="xs" mt="sm">
                                    <List.Item>Modify, suspend, or discontinue any part of the Service</List.Item>
                                    <List.Item>Perform scheduled maintenance with reasonable notice</List.Item>
                                    <List.Item>Update these Terms at any time (with notification to users)</List.Item>
                                </List>
                            </div>

                            {/* 8. Termination */}
                            <div style={sectionStyle}>
                                <Title order={3} style={headingStyle}>
                                    8. Account Termination
                                </Title>
                                <Text style={textStyle}>
                                    Either party may terminate this agreement at any time:
                                </Text>
                                <List style={listStyle} spacing="xs" mt="sm">
                                    <List.Item>You may close your account from your account settings</List.Item>
                                    <List.Item>We may suspend or terminate your account for violations of these Terms</List.Item>
                                    <List.Item>Upon termination, you will lose access to Your Data unless you export it beforehand</List.Item>
                                </List>
                            </div>

                            {/* 9. Limitation of Liability */}
                            <div style={sectionStyle}>
                                <Title order={3} style={headingStyle}>
                                    9. Limitation of Liability
                                </Title>
                                <Text style={textStyle}>
                                    To the maximum extent permitted by law, we shall not be liable for any indirect, 
                                    incidental, special, consequential, or punitive damages, including loss of profits, 
                                    data, or use, arising from:
                                </Text>
                                <List style={listStyle} spacing="xs" mt="sm">
                                    <List.Item>Your use or inability to use the Service</List.Item>
                                    <List.Item>Unauthorized access to Your Data</List.Item>
                                    <List.Item>Errors, bugs, or interruptions in the Service</List.Item>
                                    <List.Item>Third-party conduct or content on the Service</List.Item>
                                </List>
                            </div>

                            {/* 10. Disclaimer of Warranties */}
                            <div style={sectionStyle}>
                                <Title order={3} style={headingStyle}>
                                    10. Disclaimer of Warranties
                                </Title>
                                <Text style={textStyle}>
                                    The Service is provided "as is" and "as available" without warranties of any kind, 
                                    either express or implied, including but not limited to warranties of merchantability, 
                                    fitness for a particular purpose, or non-infringement.
                                </Text>
                            </div>

                            {/* 11. Governing Law */}
                            <div style={sectionStyle}>
                                <Title order={3} style={headingStyle}>
                                    11. Governing Law and Disputes
                                </Title>
                                <Text style={textStyle}>
                                    These Terms shall be governed by and construed in accordance with applicable laws. 
                                    Any disputes arising from these Terms or your use of the Service shall be resolved 
                                    through binding arbitration, except where prohibited by law.
                                </Text>
                            </div>

                            {/* 12. Contact */}
                            <div style={sectionStyle}>
                                <Title order={3} style={headingStyle}>
                                    12. Contact Information
                                </Title>
                                <Text style={textStyle}>
                                    If you have questions about these Terms, please contact us at{" "}
                                    <Anchor 
                                        href="mailto:legal@reflecto-trend.from-delhi.net" 
                                        style={{ color: "#a78bfa", textDecoration: "underline" }}
                                    >
                                        legal@reflecto-trend.from-delhi.net
                                    </Anchor>
                                </Text>
                            </div>

                            {/* Agreement Statement */}
                            <div 
                                style={{
                                    background: "rgba(97,61,228,0.12)",
                                    border: "1px solid rgba(97,61,228,0.30)",
                                    borderRadius: "12px",
                                    padding: "20px",
                                    marginTop: "24px",
                                }}
                            >
                                <Text style={{ ...textStyle, marginBottom: 0 }}>
                                    By using the Service, you acknowledge that you have read, understood, and agree 
                                    to be bound by these Terms and Conditions.
                                </Text>
                            </div>

                        </Stack>
                    </Card>

                    <Space h="xl" />
                </Flex>
            </Container>
        </PageBackground>
        </>
    );
}

export default Terms;
