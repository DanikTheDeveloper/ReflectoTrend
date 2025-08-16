import React from "react";
import { Button, Popover, Text, Group, Modal, Checkbox, Space, SegmentedControl} from '@mantine/core';
import classes from "./Chart.module.css";
import {DateInput } from "@mantine/dates";
import { useDisclosure } from "@mantine/hooks";

const ChartDate = (props = { startDate, endDate, setStartDate, setEndDate, automaticFill, toggleAutomaticFill }) => {

    const [opened, {open, close} ] = useDisclosure(false);
    const [customRange, setCustomRange] = React.useState('1m')

    const handleAutoClose = () => {
        props.toggleAutomaticFill(!props.automaticFill);
    }

    const handleCustomRange = (value) => {
        let today = new Date();
        console.log(today);
        props.setEndDate(today);
        setCustomRange(value);
        if ( value === 'custom') {
            open();
        }
        if ( value === 'all') {
            props.setStartDate(props.initialStartDate);
        }
        else if ( value === '5y') {
            props.setStartDate(new Date(new Date().setFullYear(today.getFullYear() -5)));
        }
        else if ( value === '1y') {
            props.setStartDate(new Date(new Date().setFullYear(today.getFullYear() -1)));
        }
        else if ( value === '6m') {
            props.setStartDate(new Date(new Date().setMonth(today.getMonth() -6)));
        }
        else if ( value === '3m') {
            props.setStartDate(new Date(new Date().setMonth(today.getMonth() -3)));
        }
        else if ( value === '1m') {
            props.setStartDate(new Date(new Date().setMonth(today.getMonth() -1)));
        }
        else if ( value === '10d') {
            props.setStartDate(new Date(new Date().setDate(today.getDate() -10)));
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
        <div>
        <div className={classes.intervalGroup}>
            <Text align="center" weight={700} size="lg">View Range: </Text>
            <Space w="xs" />
            <SegmentedControl color="blue" data={['10d', '1m', '3m', '6m', '1y', '5y', 'all', 'custom']} value={customRange} onChange={(value) => handleCustomRange(value)} />
        <Space w="xs" />
        <Modal title="View Range" opened={opened} onClose={close} >
            <DateInput label="StartDate" placeholder="StartDate" valueFormat="DD/MM/YYYY" size="xs" value={props.startDate} onChange={(value) => {props.setStartDate(value)}} />
            <DateInput label="EndDate" placeholder="EndDate" valueFormat="DD/MM/YYYY" size="xs" value={props.endDate} onChange={(value) => {props.setEndDate(value)}} />
            <div class={classes.horizontalLine}>
                <span class={classes.horizontalLineText}>Or</span>
            </div>
            <Checkbox label="Fill on horizontal scroll" size="md" checked={props.automaticFill} onChange={() => (handleAutoClose()) }/>
        </Modal>
        <Button onClick={open}>Custom</Button>
        </div>
        </div>
    );
}

export default React.memo(ChartDate);
