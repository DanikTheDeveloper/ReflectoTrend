import React from "react";
import { Container, Text, Loader } from "@mantine/core";
import classes from "./Auth.module.css";
import { useNavigate } from "react-router-dom";

const VerifyEmail = () => {
    const navigate = useNavigate();

    React.useLayoutEffect(() => {
        document.name="VerifyEmail"
        const timer = setTimeout(() => {
          navigate("/signin")
        }, 2000);

        return () => clearTimeout(timer);
    }, []);


    return (
        <>
        <Container className={classes.formContainer}>
            <Text>
                Thank you for verifying Email. <br/>
                Redirecting to Signin
            </Text>
            <Loader visible={true} />
        </Container>
        </>
    );
}

export default VerifyEmail;
