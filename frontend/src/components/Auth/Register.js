import { SimpleGrid, Progress, Popover, Space, Paper, TextInput, PasswordInput, Button, Container, Title, Text, Group, Anchor, Checkbox, LoadingOverlay, Input} from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconUserPlus } from "@tabler/icons-react";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { confirmCaptcha, register } from "../../store/AuthSlice";
// import ReCAPTCHA from "react-google-recaptcha";
import classes from './Auth.module.css';
import Header from "../Home/Header/Header.js";
import { getStrength, checkPassword } from "../Common/PasswordChecker.js";
import GoogleSignInButton from "./GoogleSignInButton";


const Register = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const isLoading = useSelector(state => state.auth.isLoading);

    const [popoverOpened, setPopoverOpened] = React.useState(false);
    const [passwordCheck, setPasswordCheck] = React.useState({
        color: "red",
        strength: 0,
        checks: null,
        meetsRequirements: true,
    });

    const form = useForm({
        validateInputOnChange: true,
        initialValues: {
            email: '',
            password: '',
            password2: '',
            terms: false,
            isRecaptchaValid: true,
        },
        validate: {
            password2: (value, values) => value !== values.password ? 'Passwords did not match' : null,
            email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
            terms: (value) => value !== true ? 'You must accept terms & conditions' : null,
            isRecaptchaValid: (value) => value !== true ? 'Are you a bot?' : null,
        }
    });

    /* const handleRecaptcha = (value) => {
        dispatch(confirmCaptcha(value)).unwrap()
        .then(() => {
            form.setFieldValue("isRecaptchaValid", true)
        })
        .catch(() => {
            form.setFieldValue("isRecaptchaValid", false)
        })
    } */

    React.useEffect(() => {
        setPasswordCheck(checkPassword(form.values.password));
    }, [
        form.values.password,
    ]);


    const handleSubmit = () => {
        const data = {
            email: form.values.email,
            password: form.values.password,
        }
        dispatch(register(data)).unwrap()
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
        <Title order={1} className={classes.title}>
            Register to Unlock the <br /> Power of Analytics
        </Title>
        <LoadingOverlay visible={isLoading} />
        <Paper withBorder shadow="md" p={30} mt={30} radius="md" sx={{width: "100%"}} className={classes.paper}>
						<GoogleSignInButton
							message="Sign up"
						/>
						<div class={classes.horizontalLine}>
							<span class={classes.horizontalLineText}>Or</span>
						</div>
            <form onSubmit={form.onSubmit((values) => handleSubmit(values))}>
            <TextInput size="md" mt="md" name="email" label="Email" placeholder="test@example.com" required {...form.getInputProps('email')}/>
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
                    placeholder="Your password"
                    mt="md"
                    {...form.getInputProps('password')}
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
                label="Confirm Password"
                placeholder="Your password"
                required
                mt="md"
                {...form.getInputProps('password2')}
            />
            <Checkbox
                size="lg"
                mt="md"
                {...form.getInputProps('terms', { type: 'checkbox' })}
                label={<Text size="lg">I Accept {" "} <Anchor href="/terms" target="_blank"> Terms of Services </Anchor> </Text>}
            />
            <Space h="md" />
            {/* <Input.Wrapper disabled {...form.getInputProps('isRecaptchaValid', { type: 'checkbox' })} >
            <ReCAPTCHA
                sitekey={process.env.site_key}
                onChange={handleRecaptcha}
            />
            </Input.Wrapper> */}
            <Space h="md" />
            <Button
                fullWidth
                mt="xl"
                type="submit"
                size="lg"
                rightSection={<IconUserPlus size="24px" stroke={"1.5"}/>}
                disabled={!form.isValid()}
            >
                Sign Up
            </Button>
            </form>
            <Group position="apart" mt="md">
                <Text size="lg">
                    Already have an account?
                </Text>
                <Anchor component="a" type="button" onClick={() => {navigate("/signin")}}>
			        <Text color="blue" size="lg">
                        Sign in here
                    </Text>
                </Anchor>
            </Group>
        </Paper>
        </Container>
		</>
    );
}

export default Register;
