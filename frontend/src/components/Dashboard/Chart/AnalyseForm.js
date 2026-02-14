import React from "react";
import { Container, Title, NumberInput, Button, Text, Stack, Box } from '@mantine/core';
import { DateInput } from "@mantine/dates";
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
        <Box style={{ 
            marginLeft: '-5px',
            borderRadius: '4px',
            background: '#ffffff',
            padding: '1rem',
        }}>
            <Title order={3} mb="md">
                Analyse Data
            </Title>
            <form onSubmit={handleSubmit}>
                <Stack spacing="md">
                    <div>
                        <Text size="sm" weight={700} mb="xs">
                            Start Date
                        </Text>
                        <DateInput
                            value={formData.startDate}
                            onChange={(value) =>
                                setFormData({
                                    ...formData,
                                    startDate: value
                                })
                            }
                            size="sm"
                        />
                    </div>
                    
                    <div>
                        <Text size="sm" weight={700} mb="xs">
                            End Date
                        </Text>
                        <DateInput
                            value={formData.endDate}
                            minDate={new Date(0)}
                            maxDate={new Date()}
                            onChange={(value) =>
                                setFormData({
                                    ...formData,
                                    endDate: value
                                })
                            }
                            size="sm"
                        />
                    </div>
                    
                    <div>
                        <Text size="sm" weight={700} mb="xs">
                            Similarity Rate
                        </Text>
                        <NumberInput
                            value={formData.minimumSimilarityRate}
                            onChange={(value) => 
                                setFormData({ 
                                    ...formData, 
                                    minimumSimilarityRate: value 
                                })
                            }
                            min={0}
                            max={100}
                            step={1}
                            suffix="%"
                            size="sm"
                        />
                    </div>
                    
                    <Button 
                        type="submit" 
                        variant="filled" 
                        color="blue" 
                        loading={isAnalyseLoading}
                        fullWidth
                        size="sm"
                    >
                        Analyze
                    </Button>
                    
                    <AnalyseResults />
                </Stack>
            </form>
        </Box>
    );
}

export default AnalyseForm;
