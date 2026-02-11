import React from "react";
import { Grid, Text,  Modal, Space, SegmentedControl, Title} from '@mantine/core';
import classes from "./Chart.module.css";
import {DateInput } from "@mantine/dates";
import { useDisclosure } from "@mantine/hooks";

const ChartDate = (props = { viewRange, setViewRange, initialStartDate }) => {

    const [opened, {open, close} ] = useDisclosure(false);

    let today = new Date();
    const handleCustomRange = (value) => {
        if (value === 'custom') {
            open();
        }
        else if (value === 'All') {
            console.log(props.initialStartDate);
            props.setViewRange({ ...props.viewRange, startDate: props.initialStartDate, endDate: today, range: value });
        }
        else if (value === '5Y') {
            let startDate = new Date(new Date().setFullYear(today.getFullYear() - 5));
            props.setViewRange({ ...props.viewRange, startDate: startDate, endDate: today, range: value });
        }
        else if (value === '1Y') {
            let startDate = new Date(new Date().setFullYear(today.getFullYear() - 1));
            props.setViewRange({ ...props.viewRange, startDate: startDate, endDate: today, range: value });
        }
        else if (value === '6M') {
            let startDate = new Date(new Date().setMonth(today.getMonth() - 6));
            props.setViewRange({ ...props.viewRange, startDate: startDate, endDate: today, range: value });
        }
        else if (value === '1M') {
            let startDate = new Date(new Date().setMonth(today.getMonth() - 1));
            props.setViewRange({ ...props.viewRange, startDate: startDate, endDate: today, range: value });
        }
        else if (value === '3M') {
            let startDate = new Date(new Date().setMonth(today.getMonth() - 3));
            props.setViewRange({ ...props.viewRange, startDate: startDate, endDate: today, range: value });
        }
        else if (value === '10d') {
            let startDate = new Date(new Date().setDate(today.getDate() - 10));
            props.setViewRange({ ...props.viewRange, startDate: startDate, endDate: today, range: value });
        }
    }

     React.useEffect(() => {
        if (props.automaticFill === true) {
            const timerId = setTimeout(() => { close(); }, 250);
            return () => {
                clearTimeout(timerId);
            };
        }
  }, [props.automaticFill]);

    return (
        <div className={classes.intervalGroup}>
            <Text align="center" weight={700} size="lg">View Range: </Text>
            <Space w="xs" />
            <SegmentedControl color="blue" data={['10d', '1M', '3M', '6M', '1Y', '5Y', 'All', 'custom']} value={props.viewRange.range} onChange={(value) => handleCustomRange(value)} />
        <Space w="xs" />
        <Modal title={<Title order={3}>View Range</Title>} opened={opened} onClose={close} >
            <Grid>
            <Grid.Col span={6}>
            <DateInput
                label={<Text order={2}> Start Date </Text>}
                placeholder="StartDate"
                valueFormat="DD/MM/YYYY"
                size="md" value={props.viewRange.startDate}
                onChange={(value) => {props.setStartDate(value)}}
            />
            </Grid.Col>
            <Grid.Col span={6}>
            <DateInput
                label={<Text order={2}> End Date</Text>}
                placeholder="StartDate"
                valueFormat="DD/MM/YYYY"
                size="md" value={props.viewRange.startDate}
                onChange={(value) => {props.setEndDate(value)}}
            />
            </Grid.Col>
            </Grid>
        </Modal>
        </div>
    );
}

export default ChartDate;
