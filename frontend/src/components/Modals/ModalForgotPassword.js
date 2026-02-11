import React, { useState } from "react";
import { Button, TextInput, Text, SimpleGrid, Modal, Anchor, Input, Space} from '@mantine/core';
import { resetPasswordEmail, confirmCaptcha } from "../../store/AuthSlice";
import { useDispatch, useSelector } from "react-redux";
import { IconArrowBack, IconSend } from "@tabler/icons-react";
import ReCAPTCHA from "react-google-recaptcha";
import { useForm } from "@mantine/form";
import classes from './Modal.module.css';

const ModalForgotPassword = () => {
    const dispatch = useDispatch();
    const isRecaptchaValid = useSelector(state => state.auth.isRecaptchaValid);

    const [show, setShow] = useState(false);

    const form = useForm({
        validateInputOnChange: true,
        initialValues: {
            email: '',
            isRecaptchaValid: false
        },
        validate:  {
            email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
            isRecaptchaValid: (value) => value !== true ? 'Are you a bot?' : null,
        }
    });

    const handleSubmit = (values) => {
        dispatch(resetPasswordEmail(values.email)).unwrap().then(() => {
            setShow(false);
        }).catch((error) => {
            console.log(error);
            form.reset();
        });
    };

    const handleShow = () => setShow(true);
    const handleClose = () => setShow(false);

    const handleRecaptcha = (value) => {
        dispatch(confirmCaptcha(value)).unwrap().then(() => {
            form.setFieldValue("isRecaptchaValid", true);
        }).catch(() => {
            form.setFieldValue("isRecaptchaValid", false);
        });
    };

    return (
        <>
            <Anchor component="a" type="button" onClick={handleShow}>
                <Text size="lg">
                    Forgot Password?
                </Text>
            </Anchor>
            <Modal opened={show} onClose={handleClose} withCloseButton={false} >
                <form className={classes.formContainer} onSubmit={form.onSubmit((values) => handleSubmit(values))}>
                    <Text size="xl" align="center" weight={500}>
                        Reset Password
                    </Text>
                    <Space h="md" />
                    <TextInput
                        size="md"
                        placeholder="your-email@gmail.com"
                        label="Your Email"
                        required
                        {...form.getInputProps('email')}
                    />
                    <Space h="md" />
                    <Input.Wrapper disabled {...form.getInputProps('isRecaptchaValid', { type: 'checkbox' })} >
                    <ReCAPTCHA
                        sitekey={process.env.site_key}
                        onChange={handleRecaptcha}
                    />
                    </Input.Wrapper>
                    <Space h="md" />
                    <Button
                        variant="filled"
                        size="md"
                        radius="md"
                        type="submit"
                        fullWidth
                        rightSection={<IconSend size="24px" stroke={"1.5"} />}
                        disabled={!form.isValid()}
                    >
                        Send Email
                    </Button>
                    </form>
                    <Space h="md" />
                    <Button
                        fullWidth
                        variant="outline"
                        size="md"
                        type="button"
                        rightSection={<IconArrowBack size="24px" stroke={"1.5"}/>}
                        onClick={handleClose}
                    >
                        Back to Sign In
                    </Button>
            </Modal>
        </>
    );
};

export default ModalForgotPassword;
