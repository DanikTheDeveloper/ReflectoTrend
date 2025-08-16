import React from "react";
import { Button, Text, Checkbox, Anchor, Space, Title, Modal } from '@mantine/core';
import { handleSocialAuthConsent } from "../../store/AuthSlice";
import { useDispatch } from "react-redux";
import { useSearchParams, useNavigate } from "react-router-dom";
import { IconLogin2 } from "@tabler/icons-react";
import { useForm } from "@mantine/form";

const SocialAuthConsent = () => {
    const [ params ] = useSearchParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    document.title = "Social Auth Sign Up";

    const form = useForm({
        validateInputOnChange: true,
        initialValues: {
            consent: false,
        },
        validate: {
            consent: (value) => value !== true ? 'Accept the terms to continue' : null,
        },
    });
    const handleSubmit = () => {
        console.log("consent form is ", form.isValid());
        if (form.isValid) {
            dispatch(handleSocialAuthConsent(params.get('email'))).unwrap().then((response) => {
                console.log("consent form is valid response", response);
                navigate('/');
            }).catch((error) => {
                console.log(error);
                navigate('/register');
            });
        }
    }

    document.title = "Social Auth Sign Up";

    return (
        <>
        <Modal
            opened="true"
            size="lg"
            closeOnEscape={false}
            withCloseButton={false}
        >
            <Title order={2}>Social Auth Sign Up</Title>
            <Space h="md" />
            <Text>
                Reflecto Trend will use the email address provided by your social media account to create an account for you.
                We will not share your email with anyone else.
                Please confirm the email address below is correct.
            </Text>
            <Text size="lg" weight={700} color="red">
                {params.get('email')}
            </Text>
            <Space h="sm" />
            <form onSubmit={handleSubmit}>
                <Checkbox
                    size="lg"
                    mt="md"
                    {...form.getInputProps('consent', { type: 'checkbox' })}
                    label={<Text size="lg">I Accept {" "} <Anchor href="/terms" target="_blank"> Terms of Services </Anchor> </Text>}
                />
            <Space h="sm" />
            <Button
                rightSection={<IconLogin2 size="24px" stroke={1.5} />}
                onClick={handleSubmit}
                fullWidth
                mt="md"
                size="md"
                type="submit"
                disabled={!form.isValid()}
            > Sign In
            </Button>
            </form>
        </Modal>
    </>
    );
};

export default SocialAuthConsent;
