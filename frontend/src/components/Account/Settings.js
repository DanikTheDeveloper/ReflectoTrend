import React from 'react';
import { SimpleGrid, Progress, Badge, Accordion, Stack, NavLink, Popover, Space, Paper, TextInput, PasswordInput, Button, Container, Title, Text, Group, Anchor, Checkbox, LoadingOverlay, Input} from "@mantine/core";
import { useForm } from '@mantine/form';
import classes from './Account.module.css';
import { getStrength, checkPassword } from "../Common/PasswordChecker.js";
import { IconLogin2, IconKey, IconMail, IconDeviceMobile } from "@tabler/icons-react";


const Settings = () => {

    const [popoverOpened, setPopoverOpened] = React.useState(false);
    const [passwordCheck, setPasswordCheck] = React.useState({
        color: "red",
        strength: 0,
        checks: null,
        meetsRequirements: false,
    });

    const passwordForm = useForm({
        validateOnInputChnage: true,
        initialValues: {
            password: '',
            newPassword: '',
            newPassword2: '',
            meetsRequirements: false,
        },
        validate: {
            newPassword2: (value, values) => (value !== values.newPassword && value.newPassword !== '') ? 'Passwords did not match' : null,
            newPassword: (value) => (value !== '') ? null : 'Invalid password',
            meetsRequirements: (value) => value !== true ? 'Password does not meet requirements' : null,
        }
    });

    React.useEffect(() => {
        setPasswordCheck(checkPassword(checkPassword(passwordForm.values.password)));
        passwordForm.setFieldValue("meetsRequirements", passwordCheck.meetsRequirements);
    }, [
        passwordForm.values.password,
    ]);


    const handlePasswordChange = () => {
        console.log("password change");
    }

    const emailForm = useForm({
        validateOnInputChnage: true,
        initialValues: {
            email: '',
        },
        validate: {
            email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
        }
    });

    const handleEmailChange = () => {
        console.log("email change");
    }

    //const twoFactorForm = useForm({});


    return (
        <>
        <div className={classes.settingsContainer}>
            <Paper shadow="xs" p="md" radius="md" withBorder >
                <Stack spacing="xs">
                <Title order={3}>Settings</Title>
                <Accordion>
                <Accordion.Item value={"change_password"}>
                    <Accordion.Control
                    icon={<IconKey size={24} color="teal" stroke={1.5} />}
                    >
                    Change Password
                    </Accordion.Control>
                    <Accordion.Panel>
                        <form onSubmit={passwordForm.onSubmit((values) => handleSubmit(values))}>
                            <PasswordInput size="md" mt="md" name="email" label="Your Password" placeholder="a good password" required {...passwordForm.getInputProps('password')}/>
                            <Popover
                                opened={popoverOpened}
                                position="bottom"
                                width="target"
                                transitionProps={{ transition: "pop" }}
                            >
                            <Popover.Target>
                            <div  onFocusCapture={() => setPopoverOpened(true)} onBlurCapture={() =>setPopoverOpened(false)} >
                                <PasswordInput
                                    size="md"
                                    required
                                    label="Your password"
                                    name="password"
                                    placeholder="A better password"
                                    mt="md"
                                    {...passwordForm.getInputProps('newPassword')}
                                />
                            </div>
                            </Popover.Target>
                            <Popover.Dropdown>
                                <Progress  color={passwordCheck.color} value={passwordCheck.strength} size={5} mb="xs" />
                                {passwordCheck.checks}
                            </Popover.Dropdown>
                            </Popover>
                            <PasswordInput
                                size="md"
                                name="password2"
                                placeholder="confirm the new password"
                                label="Confirm Password"
                                required
                                mt="md"
                                {...passwordForm.getInputProps('newPassword2')}
                            />
                            <Button
                                rightSection={<IconLogin2 size="24px" stroke={1.5} />}
                                disabled={!passwordForm.isValid()}
                                fullWidth
                                type="submit"
                                radius="md"
                                mt="md"
                                size="md"
                            >
                            Change Password
                            </Button>
                        </form>
                    </Accordion.Panel>
                </Accordion.Item>
                <Accordion.Item value={"change_email"}>
                    <Accordion.Control
                    icon={<IconMail size={24} color="teal" stroke={1.5} />}
                    >
                    Change Email
                    </Accordion.Control>
                    <Accordion.Panel>
                        <form onSubmit={emailForm.onSubmit((values) => handleEmailChange(values))}>
                            <TextInput
                                size="md"
                                mt="md"
                                name="email"
                                label="New Email"
                                placeholder="test@example.com"
                                required
                                {...emailForm.getInputProps('email')}/>
                            <Button
                                rightSection={<IconLogin2 size="24px" stroke={1.5} />}
                                disabled={!emailForm.isValid()}
                                fullWidth
                                type="submit"
                                radius="md"
                                mt="md"
                                size="md"
                            >
                            Change Email
                            </Button>
                        </form>
                    </Accordion.Panel>
                </Accordion.Item>
                <Accordion.Item value={"add_2fa"}>
                    <Accordion.Control
                    icon={<IconDeviceMobile size={24} color="teal" stroke={1.5} />}
                    >
                    Change 2FA (Coming Soon)
                    </Accordion.Control>
                    <Accordion.Panel>
                        <Text color="red"> WORK IN PROGRESS </Text>
                    </Accordion.Panel>
                </Accordion.Item>
                </Accordion>
                </Stack>
            </Paper>
        </div>
        </>
    )
}
export default Settings;
