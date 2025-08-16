import React from "react";

import {
    Paper,
    TextInput,
    PasswordInput,
    Group,
    Anchor,
    Button,
    Container,
    Text,
    Space,
    LoadingOverlay,
} from '@mantine/core';
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { signIn, loadUser } from "../../store/AuthSlice";
import { IconLogin2 } from "@tabler/icons-react";
import ModalForgotPassword from "../Modals/ModalForgotPassword";
import classes from './Auth.module.css';
import Header from "../Home/Header/Header.js";
import {useForm, zodResolver } from "@mantine/form";
import { z } from 'zod';
import GoogleSignInButton from "./GoogleSignInButton";

const schema = z.object({
    email: z.string().email({ message: 'Invalid email' }),
})

const SignIn = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const isLoading = useSelector((state) => state.auth.isLoading);
    const isAuthenticated = useSelector(state => state.auth.isAuthenticated)

    const form = useForm({
        initialValues: {
            email: '',
            password: '',
        },
        valiate: zodResolver(schema),
    });

    React.useLayoutEffect(() => {
        document.title = "Login";
        if (isAuthenticated === true) {
            navigate('/dashboard')
        }
    }, [isAuthenticated]);

    const handleSubmit = () => {
        const data = {
            email: form.values.email,
            password: form.values.password,
        }
        dispatch(signIn(data)).unwrap().then(() => {
            dispatch(loadUser()).unwrap().then(() => {
                navigate('/dashboard')
            }).catch(() => {
                console.log("error from loaduser")
            })
        }).catch(() => {
            console.log("error from signin")
        });
    };
    return (
        <>
        <Header />
        <LoadingOverlay visible={isLoading} />
        <Container className={classes.formContainer}>
        <Text size="xl" >
            Don't have an account? {" "}
            <Anchor component="a" type="button" onClick={() => {navigate('/register')}} >
                Sign up!
            </Anchor>
        </Text>
        <Paper withBorder shadow="md" p={30} mt={30} radius="md" sx={{ width: '100%'}} className={classes.paper} >
            <GoogleSignInButton
							message="Continue"
						/>
						<div class={classes.horizontalLine}>
							<span class={classes.horizontalLineText}>Or</span>
						</div>
            <form onSubmit={form.onSubmit((values) => handleSubmit(values))}>
            <TextInput size="md" name="email" label="Email" radius="md" placeholder="user@gmail.com" required
                {...form.getInputProps('email')}
            />
            <PasswordInput size="md" name="password" label="Password" radius="md" placeholder="Your password" required mt="md"
                {...form.getInputProps('password')}
            />
                <Space h="md" />
                <Button
                    rightSection={<IconLogin2 size="24px" stroke={1.5} />}
                    fullWidth
                    type="submit"
                    radius="md"
                    mt="md"
                    size="lg"
                > Sign In
                </Button>
            </form>
            <Group position="apart" mt="md">
                <ModalForgotPassword />
            </Group>
        </Paper>
        </Container>
        </>
    );
}

export default SignIn;
