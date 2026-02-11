import React from "react";
import {
    TextInput,
    PasswordInput,
    Group,
    Anchor,
    Button,
    Text,
    Space,
    LoadingOverlay,
} from "@mantine/core";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { signIn, loadUser } from "../../store/AuthSlice";
import { IconLogin2 } from "@tabler/icons-react";
import ModalForgotPassword from "../Modals/ModalForgotPassword";
import classes from "./Auth.module.css";
import Header from "../Home/Header/Header.js";
import { useForm, zodResolver } from "@mantine/form";
import { z } from "zod";
import GoogleSignInButton from "./GoogleSignInButton";
import PageBackground from "../Common/Background";

const schema = z.object({
    email: z.string().email({ message: "Invalid email" }),
});

const SignIn = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const isLoading = useSelector((state) => state.auth.isLoading);
    const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

    const form = useForm({
        initialValues: {
            email: "",
            password: "",
        },
        validate: zodResolver(schema),
    });

    React.useLayoutEffect(() => {
        document.title = "Sign In";
        if (isAuthenticated) navigate("/dashboard");
    }, [isAuthenticated]);

    const handleSubmit = () => {
        dispatch(signIn(form.values))
            .unwrap()
            .then(() =>
                dispatch(loadUser())
                    .unwrap()
                    .then(() => navigate("/dashboard"))
            );
    };

    const inputStyles = {
        label: { color: "rgba(220,210,255,0.85)", marginBottom: "4px" },
        input: {
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(167,139,250,0.25)",
            color: "#EDE9FF",
            "::placeholder": { color: "rgba(167,139,250,0.40)" },
        },
    };

    return (
        <PageBackground>
            <Header />
            <LoadingOverlay visible={isLoading} />

            <div className={classes.panel} style={{ alignItems: "center" }}>
                <div className={classes.formCard} style={{ maxWidth: 440, width: "100%" }}>
                    <div style={{ textAlign: "center", marginBottom: 28 }}>
                        <div className={classes.title} style={{ fontSize: "2rem" }}>
                            Welcome Back
                        </div>
                        <div className={classes.divider} style={{ marginInline: "auto" }} />
                        <p className={classes.subtitle} style={{ maxWidth: "100%" }}>
                            Sign in to continue where you left off.
                        </p>
                    </div>

                    <GoogleSignInButton message="Continue" />

                    <div className={classes.orDivider}>
                        <div className={classes.orLine} />
                        OR
                        <div className={classes.orLine} />
                    </div>

                    <form onSubmit={form.onSubmit(handleSubmit)}>
                        <TextInput
                            size="md"
                            label="Email"
                            placeholder="user@example.com"
                            required
                            styles={inputStyles}
                            {...form.getInputProps("email")}
                        />

                        <PasswordInput
                            size="md"
                            label="Password"
                            placeholder="Your password"
                            required
                            mt="md"
                            styles={inputStyles}
                            {...form.getInputProps("password")}
                        />

                        <Space h="md" />

                        <Button
                            fullWidth
                            type="submit"
                            size="lg"
                            mt="md"
                            style={{
                                background:
                                    "linear-gradient(135deg, #613DE4, #4E31B6)",
                                border: "none",
                                fontWeight: 700,
                                letterSpacing: "0.02em",
                            }}
                            rightSection={
                                <IconLogin2 size={20} stroke={1.8} />
                            }
                        >
                            Sign In
                        </Button>
                    </form>

                    <Group justify="space-between" mt="lg">
                        <ModalForgotPassword />

                        <Text size="sm" style={{ color: "rgba(200,190,255,0.65)" }}>
                            New here?{" "}
                            <Anchor
                                component="button"
                                onClick={() => navigate("/register")}
                                style={{ color: "#a78bfa" }}
                            >
                                Create an account
                            </Anchor>
                        </Text>
                    </Group>
                </div>
            </div>
        </PageBackground>
    );
};

export default SignIn;

