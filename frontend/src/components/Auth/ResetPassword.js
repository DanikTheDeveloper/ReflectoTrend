import { Progress, Popover, Paper, PasswordInput, Button, Container, Title, LoadingOverlay } from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconKey } from "@tabler/icons-react";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { resetPassword } from "../../store/AuthSlice";
import classes from './Auth.module.css';
import Header from "../Home/Header/Header.js";
import { useSearchParams } from "react-router-dom"
import { getStrength, checkPassword } from "../Common/PasswordChecker.js";

const ResetPassword = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const isLoading = useSelector(state => state.auth.isLoading);

    const [searchParams] = useSearchParams();

    const [popoverOpened, setPopoverOpened] = React.useState(false);
    const [passwordCheck, setPasswordCheck] = React.useState({
        Color: "red",
        strength: 0,
        checks: null,
        meetsRequirements: true,
    });

    const form = useForm({
        validateInputOnChange: true,
        initialValues: {
            password: '',
            password2: '',
        },
        validate: {
            password2: (value, values) => value !== values.password ? 'Passwords did not match' : null,
        }
    });

    React.useEffect(() => {
        setPasswordCheck(checkPassword(form.values.password));
    }, [
        form.values.password,
    ]);


    const handleSubmit = () => {
        const data = {
            token: searchParams.get("token"),
            password: form.values.password,
        }
        dispatch(resetPassword(data)).unwrap()
            .then(() => {
                navigate('/signin')
            })
            .catch(() => {
                form.reset()
            })
    }

    return (
        <>
            <Header />
                <Container className={classes.formContainer}>
                    <LoadingOverlay visible={isLoading} />
                    <Title order={1} className={classes.title} mt={50}>
                        Reset Password
                    </Title>
                        <Paper withBorder p={20} mt={30} className={classes.paper}>
                            <form onSubmit={form.onSubmit((values) => handleSubmit(values))}>
                                <Popover
                                    opened={popoverOpened}
                                    position="bottom"
                                    width="target"
                                    transitionProps={{ transition: "pop" }}
                                >
                                    <Popover.Target>
                                        <div onFocusCapture={() => setPopoverOpened(true)} onBlurCapture={() => setPopoverOpened(false)} >
                                            <PasswordInput
                                                size="md"
                                                required
                                                label="Your password"
                                                name="password"
                                                placeholder="Your password"
                                                mt="md"
                                                {...form.getInputProps('password')}
                                            />
                                        </div>
                                    </Popover.Target>
                                    <Popover.Dropdown>
                                        <Progress Color={passwordCheck.color} value={passwordCheck.strength} size={5} mb="xs" />
                                        {passwordCheck.checks}
                                    </Popover.Dropdown>
                                </Popover>
                                <PasswordInput
                                    size="md"
                                    name="password2"
                                    label="Confirm Password"
                                    placeholder="Your password"
                                    required
                                    mt="md"
                                    {...form.getInputProps('password2')}
                                />
                                <Button
                                    mt="xl"
                                    type="submit"
                                    size="md"
                                    rightSection={<IconKey size="24px" stroke={"1.5"} />}
                                    disabled={!form.isValid()}
                                >
                                    ResetPassword
                                </Button>
                            </form>
                        </Paper>
            </Container>
        </>
    );
}

export default ResetPassword;
