import React from 'react';
import PrivateHeader from "../../Home/Header/PrivateHeader.js";
import Header from '../../Home/Header/Header.js';
import { Container, Flex, Text, Title } from '@mantine/core';
import { useSelector } from 'react-redux';

const About = () => {
    const isAuthenticated = useSelector(state => state.auth.isAuthenticated);

    return (
        <>
            {isAuthenticated ? <PrivateHeader /> : <Header />}
        <div style={{
            minHeight: '90vh',
            background: 'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)',
            fontFamily: "'Courier New', monospace",
            color: '#ffffff',
            padding: '80px 20px'
        }}>
            
            <Container size="xl">
                <Title 
                    order={1} 
                    style={{
                        fontSize: '3.5rem',
                        textAlign: 'center',
                        marginBottom: '40px',
                        background: 'linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        fontWeight: 900
                    }}
                >
                    About us
                </Title>
                
                <Text 
                    size="xl" 
                    style={{
                        fontSize: '1.8rem',
                        textAlign: 'center',
                        marginBottom: '50px',
                        opacity: 0.9,
                        lineHeight: '1.4'
                    }}
                >
                    Not a startup. Not a side hustle.
                </Text>
                
                <Flex justify="center" mb={60}>
                    <Text 
                        size="2.8rem" 
                        style={{
                            fontWeight: 'bold',
                            background: 'linear-gradient(45deg, #f7931e, #ffcc02)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            border: '2px solid #f7931e',
                            padding: '20px 40px',
                            borderRadius: '12px',
                            boxShadow: '0 10px 30px rgba(247, 147, 30, 0.3)',
                            textTransform: 'uppercase',
                            letterSpacing: '2px'
                        }}
                    >
                        A PET PROJECT ON STEROIDS
                    </Text>
                </Flex>
                
                <Flex justify="center">
                    <Text 
                        size="3.2rem" 
                        style={{
                            color: '#4ecdc4',
                            fontWeight: 'bold',
                            textShadow: '0 0 20px rgba(78, 205, 196, 0.5)',
                            fontFamily: 'Impact, sans-serif'
                        }}
                    >
                        We already have 500K+ signups for this app!
                    </Text>
                </Flex>
            </Container>
        </div>
        </>
    );
};

export default About;

