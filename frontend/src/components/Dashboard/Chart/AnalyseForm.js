import React from "react";
import { Container, Paper, Grid, TextInput, Select, Button,  Slider, Text, Group, SimpleGrid, Accordion } from '@mantine/core';
import {DateInput } from "@mantine/dates";
import classes from "./Chart.module.css";
import { useDispatch, useSelector } from "react-redux";

const AnalyseForm = () => {
    const stockList = useSelector( (state) => state.stock.stockList);

    const [formData, setFormData] = React.useState({
        sliceToAnalyse: {
            startDate: new Date(),
            endDate: new Date(),
        },
        minimumSimilarityRate: 50, // Default value
    });

    const [value, setValue] = React.useState(null);

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log(formData);
    };
    return (
        <>
        <Accordion variant="contained" defaultValue="analyse">

        <Accordion.Item value="analyse" >
        <Accordion.Control>
            Analyse a slice
        </Accordion.Control>
        <Accordion.Panel>
            <Container size="md" >
                <form onSubmit={handleSubmit}>
                    <SimpleGrid cols={1} className={classes.gridContainer}>
                    <div>
                        <Text size="sm" weight={700} style={{ marginBottom: '8px' }}>
                            Slice To Analyze
                        </Text>
                        <Group>
                            <DateInput
                                label="Start Date"
                                value={formData.sliceToAnalyse.startDate}
                                onChange={(value) =>
                                    setFormData({
                                        ...formData,
                                        sliceToAnalyse: { ...formData.sliceToAnalyse, startDate: value },
                                    })
                                }
                            />
                            <DateInput
                                label="End Date"
                                value={formData.sliceToAnalyse.endDate}
                                minDate={new Date(0)} // Set a minimum date, e.g., '1970-01-01'
                                maxDate={new Date()} // Set a maximum date, e.g., today
                                onChange={(value) =>
                                    setFormData({
                                        ...formData,
                                        sliceToAnalyse: { ...formData.sliceToAnalyse, endDate: value },
                                    })
                                }
                            />
                        </Group>
                    </div>
                    <div>
                        <Text size="sm" weight={700} style={{ marginBottom: '8px' }}>
                            Minimum Similarity Rate
                        </Text>
                        <div className={classes.slider}>
                        <Slider
                            showLabelOnHover={false}
                            labelAlwaysOn={true}
                            value={formData.minimumSimilarityRate}
                            onChange={(value) => setFormData({ ...formData, minimumSimilarityRate: value })}
                            min={0}
                            max={100}
                            step={1}
                            marks={[
                                { value: 20, label: '20%' },
                                { value: 50, label: '50%' },
                                { value: 80, label: '80%' },
                           ]}

                        />
                        </div>
                    </div>
                    <div>
                        <Button type="submit" variant="filled" color="blue" style={{ marginTop: '16px' }}>
                            Start Analysis
                        </Button>
                    </div>
                    </SimpleGrid>
                </form>
            </Container>
        </Accordion.Panel>
        </Accordion.Item>
        <Accordion.Item value="save_results">
        <Accordion.Control>
            Save Results
        </Accordion.Control>
        <Accordion.Panel>
            <p>WIP</p>
        </Accordion.Panel>
        </Accordion.Item>
        </Accordion>
        </>
    );
}

export default AnalyseForm;
