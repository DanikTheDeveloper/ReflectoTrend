import React from "react";
import { Container, Title, Text, Stack, Card, Group, Badge, List, ThemeIcon, Divider } from "@mantine/core";
import { IconChartLine, IconClock, IconTarget, IconTrendingUp } from "@tabler/icons-react";
import AppShell from "../General/AppShell";
import classes from "./Blog.module.css";

const Blog = () => {
    return (
        <>
        <AppShell
            selectedIndex={2}
            component={
                <Container size="md" className={classes.blog} py="xl">
                    <Stack gap="md" mb="xl">
                        <Badge size="lg" variant="light" color="blue">Product Spotlight</Badge>
                        <Title order={1} className={classes.title}>
                            Why Pattern Recognition Changes Everything for Retail Traders
                        </Title>
                        <Text size="lg" c="dimmed">
                            How Reflecto Trend finds hidden opportunities in historical price data—so you don't have to
                        </Text>
                    </Stack>

                    <Divider my="xl" />

                    <Stack gap="xl">
                        <div>
                            <Title order={2} mb="md">The Pattern Problem</Title>
                            <Text>
                                Here's the thing about trading: the patterns are there. Every trader knows that moment when you look at a chart and think, <i>"I swear I've seen this before."</i>
                            </Text>
                            <Text mt="md">
                                But then what? You'd need to manually scroll through months or years of historical data, eyeballing similar movements, taking notes, trying to remember what happened next. It's tedious. It's time-consuming. And honestly? You'll probably miss the best matches.
                            </Text>
                        </div>

                        <Card withBorder padding="lg" radius="md">
                            <Title order={3} mb="md">Enter Pattern Recognition</Title>
                            <Text>
                                Reflecto Trend's pattern recognition does the heavy lifting for you. Pick any time period you're analyzing—could be the last week, the last month, whatever you're curious about—and our algorithm scans the entire historical dataset to find similar price movements.
                            </Text>
                            <Text mt="md" fw={500}>
                                In seconds, not hours.
                            </Text>
                        </Card>

                        <div>
                            <Title order={2} mb="md">How It Actually Works</Title>
                            <Text mb="md">
                                We use statistical correlation (specifically Pearson correlation, for the stats nerds) to compare your selected pattern against every possible historical slice of the same length. Think of it like a smart search engine for price movements.
                            </Text>
                            
                            <List
                                spacing="md"
                                icon={
                                    <ThemeIcon color="blue" size={24} radius="xl">
                                        <IconChartLine size={16} />
                                    </ThemeIcon>
                                }
                            >
                                <List.Item>
                                    <Text><b>You select a date range</b> on the chart that looks interesting</Text>
                                </List.Item>
                                <List.Item>
                                    <Text><b>We scan the entire history</b> of that stock for similar patterns</Text>
                                </List.Item>
                                <List.Item>
                                    <Text><b>Results show you</b> when similar patterns happened and what came next</Text>
                                </List.Item>
                                <List.Item>
                                    <Text><b>You decide</b> if history gives you an edge on what might happen now</Text>
                                </List.Item>
                            </List>
                        </div>

                        <div>
                            <Title order={2} mb="md">Why This Matters for You</Title>
                            
                            <Stack gap="md">
                                <Group gap="md" align="flex-start">
                                    <ThemeIcon size={40} radius="md" color="green">
                                        <IconClock size={24} />
                                    </ThemeIcon>
                                    <div style={{ flex: 1 }}>
                                        <Text fw={600} mb={4}>Save Time</Text>
                                        <Text size="sm" c="dimmed">
                                            What used to take hours of chart scrolling now takes seconds. Spend your time analyzing results, not hunting for them.
                                        </Text>
                                    </div>
                                </Group>

                                <Group gap="md" align="flex-start">
                                    <ThemeIcon size={40} radius="md" color="blue">
                                        <IconTarget size={24} />
                                    </ThemeIcon>
                                    <div style={{ flex: 1 }}>
                                        <Text fw={600} mb={4}>Find What You'd Miss</Text>
                                        <Text size="sm" c="dimmed">
                                            The algorithm doesn't get tired or biased. It catches patterns from years ago that you'd never manually find.
                                        </Text>
                                    </div>
                                </Group>

                                <Group gap="md" align="flex-start">
                                    <ThemeIcon size={40} radius="md" color="violet">
                                        <IconTrendingUp size={24} />
                                    </ThemeIcon>
                                    <div style={{ flex: 1 }}>
                                        <Text fw={600} mb={4}>Data-Backed Decisions</Text>
                                        <Text size="sm" c="dimmed">
                                            Instead of gut feelings, you're working with actual historical precedents. See what happened the last 5 times a similar pattern emerged.
                                        </Text>
                                    </div>
                                </Group>
                            </Stack>
                        </div>

                        <Card withBorder padding="lg" radius="md" bg="gray.0">
                            <Title order={3} mb="md">Real Talk</Title>
                            <Text>
                                Does this guarantee you'll predict the future? No. Past patterns don't guarantee future results—anyone who tells you otherwise is lying.
                            </Text>
                            <Text mt="md">
                                But here's what it <i>does</i> do: it gives you context. It shows you historical precedents. It helps you make informed decisions faster than you ever could manually. And in trading, speed and information are everything.
                            </Text>
                        </Card>

                        <div>
                            <Title order={2} mb="md">The Bottom Line</Title>
                            <Text>
                                Reflecto Trend's pattern recognition isn't magic—it's just really good math applied to something traders have been trying to do manually forever. We built it because we were tired of spending hours hunting through charts for patterns we <i>knew</i> were there somewhere.
                            </Text>
                            <Text mt="md">
                                Now you can find them in seconds. What you do with that information? That's up to you.
                            </Text>
                            <Text mt="lg" fw={500} size="lg">
                                Happy trading. 📈
                            </Text>
                        </div>
                    </Stack>
                </Container>
            }
        />
        </>
    );
}

export default Blog;
