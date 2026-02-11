import React, { useState } from "react";
import {
    Button,
    TextInput,
    Text,
    Modal,
    Anchor,
    Input,
    Space,
    Group,
} from "@mantine/core";
import { resetPasswordEmail, confirmCaptcha } from "../../store/AuthSlice";
import { useDispatch } from "react-redux";
import { IconArrowBack, IconSend } from "@tabler/icons-react";
import ReCAPTCHA from "react-google-recaptcha";
import { useForm } from "@mantine/form";
import classes from "./Modal.module.css";

const ModalForgotPassword = () => {
    const dispatch = useDispatch();
    const [show, setShow] = useState(false);

    const form = useForm({
        validateInputOnChange: true,
        initialValues: {
            email: "",
            isRecaptchaValid: false,
        },
        validate: {
            email: (v) => (/^\S+@\S+$/.test(v) ? null : "Invalid email"),
            isRecaptchaValid: (v) => (v !== true ? "Are you a bot?" : null),
        },
    });

    const handleSubmit = (values) => {
        dispatch(resetPasswordEmail(values.email))
            .unwrap()
            .then(() => setShow(false))
            .catch(() => form.reset());
    };

    const handleRecaptcha = (value) => {
        dispatch(confirmCaptcha(value))
            .unwrap()
            .then(() => form.setFieldValue("isRecaptchaValid", true))
            .catch(() => form.setFieldValue("isRecaptchaValid", false));
    };

    const inputStyles = {
        label: { color: "rgba(220,210,255,0.85)", marginBottom: 4 },
        input: {
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(167,139,250,0.25)",
            color: "#EDE9FF",
            "::placeholder": { color: "rgba(167,139,250,0.40)" },
        },
    };

    return (
        <>
            <Anchor component="button" onClick={() => setShow(true)}>
                <Text size="sm" style={{ color: "#a78bfa" }}>
                    Forgot Password?
                </Text>
            </Anchor>

            <Modal
                opened={show}
                onClose={() => setShow(false)}
                withCloseButton={false}
                centered
                size="sm"
                classNames={{ content: classes.formCard }}
            >
                <form onSubmit={form.onSubmit(handleSubmit)}>
                    <Text
                        size="xl"
                        fw={700}
                        align="center"
                        style={{ color: "#EDE9FF" }}
                    >
                        Reset Password
                    </Text>

                    <Text
                        size="sm"
                        align="center"
                        mt={6}
                        style={{ color: "rgba(210,200,255,0.65)" }}
                    >
                        We’ll email you a reset link
                    </Text>

                    <div
                        className={classes.divider}
                        style={{ margin: "18px auto" }}
                    />

                    <TextInput
                        size="md"
                        label="Email"
                        placeholder="you@example.com"
                        required
                        styles={inputStyles}
                        {...form.getInputProps("email")}
                    />

                    <Space h="md" />

                    <Input.Wrapper
                        disabled
                        {...form.getInputProps("isRecaptchaValid", {
                            type: "checkbox",
                        })}
                    >
                        <ReCAPTCHA
                            sitekey={process.env.site_key}
                            onChange={handleRecaptcha}
                        />
                    </Input.Wrapper>

                    <Space h="md" />

                    <Button
                        fullWidth
                        type="submit"
                        size="md"
                        disabled={!form.isValid()}
                        rightSection={<IconSend size={18} stroke={1.6} />}
                        style={{
                            background:
                                "linear-gradient(135deg, #613DE4, #4E31B6)",
                            border: "none",
                            fontWeight: 700,
                            letterSpacing: "0.02em",
                        }}
                    >
                        Send reset email
                    </Button>

                    <Space h="sm" />

                    <Button
                        fullWidth
                        variant="outline"
                        size="md"
                        onClick={() => setShow(false)}
                        rightSection={<IconArrowBack size={18} stroke={1.6} />}
                        styles={{
                            root: {
                                borderColor: "rgba(167,139,250,0.35)",
                                color: "#a78bfa",
                            },
                        }}
                    >
                        Back to Sign In
                    </Button>
                </form>
            </Modal>
        </>
    );
};

export default ModalForgotPassword;

