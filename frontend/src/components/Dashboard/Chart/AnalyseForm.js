import React from "react";
import { Container, Title, Grid, TextInput, Select, Button,  Slider, Text, Group, SimpleGrid, Accordion } from '@mantine/core';
import {DateInput } from "@mantine/dates";
import classes from "./Chart.module.css";
import { useDispatch, useSelector } from "react-redux";
import { formatDate } from "../../Utils/Utils";
import AnalyseResults from "./AnalyseResults";

const AnalyseForm = (props = {analyseSlice}) => {
	const isAnalyseLoading = useSelector( (state) => state.stock.isAnalyseLoading);

    const [formData, setFormData] = React.useState({
        startDate: new Date(),
        endDate: new Date(),
        minimumSimilarityRate: 50,
    });

    const handleSubmit = (e) => {
        e.preventDefault();

        const data = {
            sliceToAnalyse: [
                formatDate(formData.startDate),
                formatDate(formData.endDate),
            ],
            minimumSimilarityRate: formData.minimumSimilarityRate
        }
        props.analyseSlice(data)
    };
    return (
        <>
        <Accordion variant="contained" defaultValue="analyse">

        <Accordion.Item value="analyse" >
        <Accordion.Control>
            <Title order={2}>
            Analyse Data
            </Title>
        </Accordion.Control>
        <Accordion.Panel>
            <Container size="md" >
                <form onSubmit={handleSubmit}>
                    <SimpleGrid cols={2} className={classes.gridContainer}>
                    <div>
                        <Text size="sm" weight={700} style={{ marginBottom: '8px' }}>
                            Slice To Analyze:
                        </Text>
                        <Group>
                            <DateInput
                                label="Start Date"
                                value={formData.startDate}
                                onChange={(value) =>
                                    setFormData({
                                        ...formData,
                                        startDate: value
                                    })
                                }
                            />
                            <DateInput
                                label="End Date"
                                value={formData.endDate}
                                minDate={new Date(0)} // Set a minimum date, e.g., '1970-01-01'
                                maxDate={new Date()} // Set a maximum date, e.g., today
                                onChange={(value) =>
                                    setFormData({
                                        ...formData,
                                        endDate: value
                                    })
                                }
                            />
                        </Group>
                        <Text size="sm" weight={700} style={{ marginTop: '8px', marginBottom: '8px' }}>
                            Minimum Similarity Rate:
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
                        <Button type="submit" variant="filled" color="blue" style={{ marginTop: '16px' }} loading={isAnalyseLoading}>
                            Start Analysis
                        </Button>
                    </div>
                    <div>
                        <AnalyseResults />
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
