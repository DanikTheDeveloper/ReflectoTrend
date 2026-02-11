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


// ─── Styles ───────────────────────────────────────────────────────────────────
const S = {
    // ── left panel: layout only, background comes from PageBackground ──
    panel: {
        position:       "relative",
        minHeight:      "calc(100vh - 90px)",
        display:        "flex",
        flexDirection:  "column",
        justifyContent: "center",
        padding:        "56px 48px",
    },

    // ── right panel: glass card on the dark bg ──
    formCard: {
        background:   "rgba(255,255,255,0.04)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        border:       "1px solid rgba(255,255,255,0.09)",
        borderRadius: "18px",
        padding:      "36px 32px",
        marginTop:    "30px",
    },

    // ── eyebrow pill ──
    eyebrow: {
        display:       "inline-flex",
        alignItems:    "center",
        gap:           "7px",
        fontSize:      "10.5px",
        fontWeight:    700,
        letterSpacing: "0.13em",
        textTransform: "uppercase",
        color:         "#a78bfa",            // violet-300
        background:    "rgba(97,61,228,0.15)",
        border:        "1px solid rgba(97,61,228,0.30)",
        borderRadius:  "100px",
        padding:       "5px 15px",
        marginBottom:  "26px",
    },

    // ── pulsing dot inside eyebrow ──
    dot: {
        width:        "6px",
        height:       "6px",
        borderRadius: "50%",
        background:   "#a78bfa",
        boxShadow:    "0 0 7px #a78bfa",
        animation:    "heroPulse 2s ease-in-out infinite",
    },

    // ── main title ──
    title: {
        fontSize:      "clamp(1.9rem, 3vw, 2.8rem)",
        fontWeight:    800,
        lineHeight:    1.18,
        color:         "#EDE9FF",            // near-white violet tint
        letterSpacing: "-0.025em",
        fontFamily:    "'Georgia', 'Times New Roman', serif",
        marginBottom:  "4px",
    },

    // ── typewriter word — gold accent ──
    accent: {
        color:      "#FCE073",
        textShadow: "0 0 24px rgba(252,224,115,0.45)",
        fontStyle:  "italic",
    },

    // ── blinking cursor ──
    cursor: {
        display:       "inline-block",
        width:         "3px",
        height:        "0.8em",
        background:    "#FCE073",
        marginLeft:    "3px",
        verticalAlign: "middle",
        borderRadius:  "2px",
        boxShadow:     "0 0 9px rgba(252,224,115,0.80)",
    },

    // ── gradient divider ──
    divider: {
        width:        "44px",
        height:       "3px",
        background:   "linear-gradient(90deg, #613DE4, #FCE073)",
        borderRadius: "4px",
        margin:       "22px 0",
    },

    // ── subtitle ──
    subtitle: {
        fontSize:     "14.5px",
        color:        "rgba(210,200,255,0.65)",
        lineHeight:   1.7,
        maxWidth:     "330px",
        marginBottom: "34px",
        fontFamily:   "'Georgia', serif",
    },

    // ── feature list ──
    featureList: {
        display:       "flex",
        flexDirection: "column",
        gap:           "13px",
    },
    featureRow: {
        display:    "flex",
        alignItems: "center",
        gap:        "12px",
        fontSize:   "13.5px",
        color:      "rgba(220,210,255,0.82)",
        fontFamily: "system-ui, sans-serif",
    },
    featureIcon: {
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
        width:          "34px",
        height:         "34px",
        borderRadius:   "10px",
        background:     "rgba(97,61,228,0.18)",
        border:         "1px solid rgba(97,61,228,0.30)",
        color:          "#a78bfa",
        flexShrink:     0,
    },

    // ── bottom trust line ──
    footer: {
        marginTop:     "46px",
        paddingTop:    "22px",
        borderTop:     "1px solid rgba(167,139,250,0.12)",
        fontSize:      "11.5px",
        color:         "rgba(167,139,250,0.38)",
        letterSpacing: "0.04em",
        fontFamily:    "system-ui, sans-serif",
    },

    // ── form labels / text override to work on dark bg ──
    formLabel: {
        color: "rgba(220,210,255,0.90)",
    },
    formText: {
        color: "rgba(200,190,255,0.75)",
    },

    // ── "Or" divider ──
    orDivider: {
        display:    "flex",
        alignItems: "center",
        gap:        "12px",
        margin:     "20px 0",
        color:      "rgba(167,139,250,0.45)",
        fontSize:   "12px",
        letterSpacing: "0.08em",
    },
    orLine: {
        flex:       1,
        height:     "1px",
        background: "rgba(167,139,250,0.18)",
    },
};


// ─── Component ────────────────────────────────────────────────────────────────
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

    // Mantine input styles scoped to dark background
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

                {/* ────────────── LEFT HERO PANEL ────────────── */}
                <Grid.Col span={5}>
                    <div style={S.panel}>
                        <div>

                            <div style={S.title} className="hfu-1">
                                Register to Unlock<br />
                                the Power of{" "}
                                <span style={S.accent}>
                                    {displayText}
                                    <span style={{
                                        ...S.cursor,
                                        opacity:    showCursor ? 1 : 0,
                                        transition: "opacity 0.1s",
                                    }} />
                                </span>
                            </div>

                            <div style={S.divider} className="hfu-2" />

                            <p style={S.subtitle} className="hfu-2">
                                Transform raw data into clear decisions.
                                Powerful tools for teams that move fast.
                            </p>

                            <div style={S.featureList} className="hfu-3">
                                {FEATURES.map(({ icon: Icon, label }) => (
                                    <div key={label} style={S.featureRow}>
                                        <div style={S.featureIcon}>
                                            <Icon size={16} stroke={1.8} />
                                        </div>
                                        {label}
                                    </div>
                                ))}
                            </div>

                            <div style={S.footer} className="hfu-4">
                                Trusted by 10,000+ analysts worldwide
                            </div>

                        </div>
                    </div>
                </Grid.Col>

                {/* ────────────── RIGHT FORM PANEL ────────────── */}
                <LoadingOverlay visible={isLoading} />
                <Grid.Col span={7}>
                    <div style={S.formCard}>

                        <GoogleSignInButton message="Sign up" />

                        {/* "Or" divider — inline replacement, no CSS module needed */}
                        <div style={S.orDivider}>
                            <div style={S.orLine} />
                            OR
                            <div style={S.orLine} />
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
