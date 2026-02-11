import React from "react";
import {ActionIcon, Button, LoadingOverlay, Group, Title } from "@mantine/core";
import classes from "./Chart.module.css";
import { useDispatch, useSelector } from "react-redux";
import {IconChevronLeft, IconChevronRight } from "@tabler/icons-react"

const AnalyseResults = () => {
    const analyseResults = useSelector( (state) => state.stock.analyseData);
    const isAnalyseLoading = useSelector( (state) => state.stock.isAnalyseLoading);

    const [index, setIndex] = React.useState(0);


    return (
        <>
        { analyseResults == null || analyseResults.length != 0 &&
            <>
            <Title order={4}> Results </Title>
            <Group>
                <ActionIcon onClick={() => {setIndex(index-1)}}>
                    <IconChevronLeft />
                </ActionIcon>
                    <p> {index} </p>
                <ActionIcon onClick={() => {setIndex(index+1)}}>
                    <IconChevronRight />
                </ActionIcon>
            </Group>
            </>
            }
        </>
    );
}

export default AnalyseResults;
