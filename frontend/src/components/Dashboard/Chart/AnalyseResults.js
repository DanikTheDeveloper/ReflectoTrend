import React from "react";
import { ActionIcon, Group, Title, Text, Badge, Stack, Box, Skeleton } from "@mantine/core";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { useSelector } from "react-redux";

const pct = (v) => (v != null ? (v * 100).toFixed(1) + "%" : "-");

const AnalyseResults = ({ onJumpToMatch }) => {
    const results = useSelector((state) => state.stock.analyseData);
    const stats = useSelector((state) => state.stock.analyseStats);
    const isLoading = useSelector((state) => state.stock.isAnalyseLoading);

    const [index, setIndex] = React.useState(0);

    React.useEffect(() => {
        setIndex(0);
    }, [results]);

    if (isLoading) {
        return (
            <Stack spacing="xs" mt="md">
                <Skeleton height={20} width="60%" />
                <Skeleton height={50} />
            </Stack>
        );
    }

    if (!results || results.length === 0) {
        return (
            <Text size="sm" c="dimmed" mt="md" ta="center">
                No matches found
            </Text>
        );
    }

    const match = results[index];
    const total = results.length;

    const fromDate = match.startDate.slice(0, 10);
    const toDate = match.endDate.slice(0, 10);
    const fromTime = match.startDate.slice(11, 19);
    const toTime = match.endDate.slice(11, 19);
    const candleCount = match.slice?.length || 0;

    const similarityPct = (match.similarity * 100).toFixed(1);

    const handleJump = () => {
        if (onJumpToMatch) {
            onJumpToMatch(match.startDate, match.endDate);
        }
    };

    return (
        <Stack spacing="xs" mt="md">
            <Group position="apart" align="center">
                <Title order={6}>Matches</Title>
                <Badge size="sm" variant="filled" color={total > 0 ? "blue" : "gray"}>
                    {index + 1} / {total}
                </Badge>
            </Group>

            <Box
                style={{
                    padding: "8px",
                    borderRadius: "4px",
                    border: "1px solid #dee2e6",
                    cursor: "pointer",
                }}
                onClick={handleJump}
            >
                <Group position="apart" align="center" mb={4}>
                    <Text size="lg" fw={700} c="blue">
                        {similarityPct}%
                    </Text>
                    <Group spacing={4}>
                        {match.forwardReturn != null && (
                            <Badge
                                size="sm"
                                variant="light"
                                color={match.forwardReturn >= 0 ? "green" : "red"}
                            >
                                {pct(match.forwardReturn)}
                            </Badge>
                        )}
                        <Badge size="sm" variant="light" color="gray">
                            {candleCount}c
                        </Badge>
                    </Group>
                </Group>
                <Text size="xs" c="dimmed">
                    {fromDate} {fromTime}
                </Text>
                <Text size="xs" c="dimmed">
                    {toDate} {toTime}
                </Text>
                {match.truncated && (
                    <Text size="xs" c="orange">
                        Forward data truncated
                    </Text>
                )}
                <Text size="xs" c="blue" mt={4}>
                    Click to jump to range
                </Text>
            </Box>

            {stats && (
                <Box
                    style={{
                        padding: "6px",
                        borderRadius: "4px",
                        border: "1px solid #e9ecef",
                        background: "#f8f9fa",
                    }}
                >
                    <Text size="xs" fw={600} mb={4}>
                        Outcome ({stats.sampleCount} samples, {stats.lookAheadCandles}fwd)
                    </Text>
                    <Group spacing={4} mb={2}>
                        <Text size="xs" c="green">
                            {pct(stats.pctHigher)} higher
                        </Text>
                        <Text size="xs" c="dimmed">·</Text>
                        <Text size="xs">med {pct(stats.medianReturn)}</Text>
                        <Text size="xs" c="dimmed">·</Text>
                        <Text size="xs">avg {pct(stats.meanReturn)}</Text>
                    </Group>
                    <Group spacing={4}>
                        <Text size="xs" c="green">best {pct(stats.bestReturn)}</Text>
                        <Text size="xs" c="dimmed">·</Text>
                        <Text size="xs" c="red">worst {pct(stats.worstReturn)}</Text>
                    </Group>
                </Box>
            )}

            <Group position="apart">
                <ActionIcon
                    variant="outline"
                    size="sm"
                    disabled={index === 0}
                    onClick={() => setIndex(index - 1)}
                >
                    <IconChevronLeft size={14} />
                </ActionIcon>

                <ActionIcon
                    variant="outline"
                    size="sm"
                    disabled={index >= total - 1}
                    onClick={() => setIndex(index + 1)}
                >
                    <IconChevronRight size={14} />
                </ActionIcon>
            </Group>
        </Stack>
    );
};

export default AnalyseResults;
