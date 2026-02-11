import { Grid, Progress, Popover, Space, TextInput, PasswordInput, Button, Text, Group, Anchor, Checkbox, LoadingOverlay, Input } from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconUserPlus, IconChartBar, IconBolt, IconTrendingUp } from "@tabler/icons-react";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { confirmCaptcha, register } from "../../store/AuthSlice";
import ReCAPTCHA from "react-google-recaptcha";
import classes from './Auth.module.css';
import Header from "../Home/Header/Header.js";
import { checkPassword } from "../Common/PasswordChecker.js";
import GoogleSignInButton from "./GoogleSignInButton";
import PageBackground from "../Common/Background";

/**
 * Brand tokens
 * primary   #613DE4
 * secondary #4E31B6
 * accent    #FCE073  ← gold, used for the typewriter highlight
 * text-base #EDE9FF  ← near-white with a violet tint
 * text-muted rgba(210,200,255,0.60)
 */

// ─── Buzzwords ────────────────────────────────────────────────────────────────
const BUZZWORDS = [
    "Analytics", "Insights", "Growth", "Intelligence",
    "Performance", "Innovation", "Success", "Excellence",
];

// ─── Feature rows ─────────────────────────────────────────────────────────────
const FEATURES = [
    { icon: IconChartBar,   label: "Real-time dashboards" },
    { icon: IconBolt,       label: "Instant insights"     },
    { icon: IconTrendingUp, label: "Predictive trends"    },
];

// ─── Typewriter hook ──────────────────────────────────────────────────────────
const useTypewriter = (words, { typingSpeed = 80, deletingSpeed = 50, pauseDuration = 2000 } = {}) => {
    const [displayText, setDisplayText] = React.useState(words[0]);
    const [wordIndex,   setWordIndex]   = React.useState(0);
    const [isDeleting,  setIsDeleting]  = React.useState(false);
    const [showCursor,  setShowCursor]  = React.useState(true);

    React.useEffect(() => {
        const id = setInterval(() => setShowCursor(p => !p), 500);
        return () => clearInterval(id);
    }, []);

    React.useEffect(() => {
        const currentWord = words[wordIndex];
        const timeout = setTimeout(() => {
            if (!isDeleting) {
                if (displayText.length < currentWord.length) {
                    setDisplayText(currentWord.slice(0, displayText.length + 1));
                } else {
                    setTimeout(() => setIsDeleting(true), pauseDuration);
                }
            } else {
                if (displayText.length > 0) {
                    setDisplayText(currentWord.slice(0, displayText.length - 1));
                } else {
                    setIsDeleting(false);
                    setWordIndex(prev => (prev + 1) % words.length);
                }
            }
        }, isDeleting ? deletingSpeed : typingSpeed);
        return () => clearTimeout(timeout);
    }, [displayText, isDeleting, wordIndex, words, typingSpeed, deletingSpeed, pauseDuration]);

    return { displayText, showCursor };
};


const Register = () => {
    const navigate  = useNavigate();
    const dispatch  = useDispatch();
    const isLoading = useSelector(state => state.auth.isLoading);

    const { displayText, showCursor } = useTypewriter(BUZZWORDS);

    const [popoverOpened, setPopoverOpened] = React.useState(false);
    const [passwordCheck, setPasswordCheck] = React.useState({
        color: "violet", strength: 0, checks: null, meetsRequirements: true,
    });

    const form = useForm({
        validateInputOnChange: true,
        initialValues: {
            email: '', password: '', password2: '', terms: false, isRecaptchaValid: true,
        },
        validate: {
            password2:        (v, vals) => v !== vals.password ? 'Passwords did not match' : null,
            email:            (v)       => (/^\S+@\S+$/.test(v) ? null : 'Invalid email'),
            terms:            (v)       => v !== true ? 'You must accept terms & conditions' : null,
            isRecaptchaValid: (v)       => v !== true ? 'Are you a bot?' : null,
        }
    });

    const handleRecaptcha = (value) => {
        dispatch(confirmCaptcha(value)).unwrap()
            .then(() => form.setFieldValue("isRecaptchaValid", true))
            .catch(() => form.setFieldValue("isRecaptchaValid", false));
    };

    React.useEffect(() => {
        setPasswordCheck(checkPassword(form.values.password));
    }, [form.values.password]);

    const handleSubmit = () => {
        const data = { email: form.values.email, password: form.values.password };
        dispatch(register(data)).unwrap()
            .then(() => navigate('/signin'))
            .catch(() => form.reset());
    };

    const inputStyles = {
        label: { color: "rgba(220,210,255,0.85)", marginBottom: "4px" },
        input: {
            background:  "rgba(255,255,255,0.05)",
            border:      "1px solid rgba(167,139,250,0.25)",
            color:       "#EDE9FF",
            "::placeholder": { color: "rgba(167,139,250,0.40)" },
        },
    };

    return (
        <PageBackground>
            <Header />
            <Grid p={29} gutter={24} align="stretch">

            <Grid.Col span={{ base: 12, md: 5 }}>
                    <div class={classes.panel}>
                        <div>

                            <div class={classes.title} >
                                Register to Unlock<br />
                                the Power of{" "}
                                <span class={classes.accent}>
                                    {displayText}
                                    <span class={classes.cursor}
                                    style={{
                                        opacity:    showCursor ? 1 : 0,
                                        transition: "opacity 0.1s",
                                    }} />
                                </span>
                            </div>

                            <div class={classes.divider} />

                            <p class={classes.subtitle} >
                                Transform raw data into clear decisions.
                                Powerful tools for teams that move fast.
                            </p>

                            <div class={classes.featureList} >
                                {FEATURES.map(({ icon: Icon, label }) => (
                                    <div key={label} class={classes.featureRow}>
                                        <div class={classes.featureIcon}>
                                            <Icon size={16} stroke={1.8} />
                                        </div>
                                        {label}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </Grid.Col>

                <LoadingOverlay visible={isLoading} />
                <Grid.Col span={{ base: 12, md: 7 }}>
                    <div class={classes.formCard}>

                        <GoogleSignInButton message="Sign up" />

                        <div class={classes.orDivider}>
                            <div class={classes.orLine} />
                            OR
                            <div class={classes.orLine} />
                        </div>

                        <form onSubmit={form.onSubmit((values) => handleSubmit(values))}>
                            <TextInput
                                size="md" mt="md" name="email" label="Email"
                                placeholder="test@example.com" required
                                styles={inputStyles}
                                {...form.getInputProps('email')}
                            />
                            <Popover opened={popoverOpened} position="bottom" width="target" transitionProps={{ transition: "pop" }}>
                                <Popover.Target>
                                    <div onFocusCapture={() => setPopoverOpened(true)} onBlurCapture={() => setPopoverOpened(false)}>
                                        <PasswordInput
                                            size="md" required label="Your password"
                                            name="password" placeholder="Your password" mt="md"
                                            styles={inputStyles}
                                            {...form.getInputProps('password')}
                                        />
                                    </div>
                                </Popover.Target>
                                <Popover.Dropdown>
                                    <Progress color="violet" value={passwordCheck.strength} size={5} mb="xs" />
                                    {passwordCheck.checks}
                                </Popover.Dropdown>
                            </Popover>
                            <PasswordInput
                                size="md" name="password2" label="Confirm Password"
                                placeholder="Your password" required mt="md"
                                styles={inputStyles}
                                {...form.getInputProps('password2')}
                            />

                            <Checkbox
                                size="md" mt="lg"
                                color="violet"
                                {...form.getInputProps('terms', { type: 'checkbox' })}
                                styles={{
                                    label: { color: "rgba(220,210,255,0.80)" },
                                }}
                                label={
                                    <Text size="sm" style={{ color: "rgba(220,210,255,0.80)" }}>
                                        I Accept{" "}
                                        <Anchor href="/terms" target="_blank" style={{ color: "#a78bfa" }}>
                                            Terms of Services
                                        </Anchor>
                                    </Text>
                                }
                            />

                            <Space h="md" />
                            <Input.Wrapper disabled {...form.getInputProps('isRecaptchaValid', { type: 'checkbox' })}>
                                <ReCAPTCHA sitekey={process.env.site_key} onChange={handleRecaptcha} />
                            </Input.Wrapper>
                            <Space h="md" />

                            <Button
                                fullWidth mt="xl" type="submit" size="lg"
                                style={{
                                    background:  "linear-gradient(135deg, #613DE4, #4E31B6)",
                                    border:      "none",
                                    fontWeight:  700,
                                    letterSpacing: "0.02em",
                                }}
                                rightSection={<IconUserPlus size="20px" stroke={1.8} />}
                            >
                                Sign Up
                            </Button>
                        </form>

                        <Group justify="space-between" mt="lg">
                            <Text size="sm" style={{ color: "rgba(200,190,255,0.65)" }}>
                                Already have an account?
                            </Text>
                            <Anchor
                                component="button"
                                onClick={() => navigate("/signin")}
                                style={{ color: "#a78bfa", fontSize: "14px" }}
                            >
                                Sign in here
                            </Anchor>
                        </Group>
                    </div>
                </Grid.Col>
            </Grid>
        </PageBackground>
    );
};

export default Register;
