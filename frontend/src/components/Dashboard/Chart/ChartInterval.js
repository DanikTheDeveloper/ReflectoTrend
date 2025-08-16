import React from "react";
import { Badge, ActionIcon, SegmentedControl, Group, Space, Text, Tooltip } from "@mantine/core";
import classes from "./Chart.module.css";

const ChartInterval = (props = { interval, handleChartInterval}) => {
    return (
        <div className={classes.intervalGroup}>
        <Text align="center" weight={700} size="lg">Interval: </Text>
        <Space w="xs" />
        <SegmentedControl color="blue" data={['1m', '5m', '15m', '30m', '1h']} value={props.interval} onChange={(value) => props.handleChartInterval(value)} />
        </div>
    );
}

export default React.memo(ChartInterval);
