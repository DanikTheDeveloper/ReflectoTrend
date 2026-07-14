import React from "react";
import { Container, Title, NumberInput, Button, Text, Stack, Box, SegmentedControl } from '@mantine/core';
import { DateInput } from "@mantine/dates";
import classes from "./Chart.module.css";
import { useDispatch, useSelector } from "react-redux";
import { formatDate } from "../../Utils/Utils";
import AnalyseResults from "./AnalyseResults";

const AnalyseForm = ({ analyseSlice, onJumpToMatch }) => {
	const isAnalyseLoading = useSelector( (state) => state.stock.isAnalyseLoading);

    const [formData, setFormData] = React.useState({
        startDate: new Date(),
        endDate: new Date(),
        minimumSimilarityRate: 50,
        searchScope: 'viewRange',
        lookAheadCandles: 0,
        maxResults: 20,
    });

    const handleSubmit = (e) => {
        e.preventDefault();

        const data = {
            sliceToAnalyse: [
                formatDate(formData.startDate),
                formatDate(formData.endDate),
            ],
            minimumSimilarityRate: formData.minimumSimilarityRate,
            searchScope: formData.searchScope,
            lookAheadCandles: formData.lookAheadCandles,
            maxResults: formData.maxResults,
        }
        analyseSlice(data)
    };
    
    return (
        <Box
            style={{
                marginLeft: '-5px',
                borderRadius: '4px',
                background: '#ffffff',
                padding: '1rem',
                maxHeight: 'calc(100vh - 140px)',
                overflowY: 'auto',
            }}
        >
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
                        <Text size="xs" c="dimmed" mt={2}>
                            Percent-return correlation (5-40 recommended for 1h)
                        </Text>
                    </div>

                    <div>
                        <Text size="sm" weight={700} mb="xs">
                            Search Scope
                        </Text>
                        <SegmentedControl
                            value={formData.searchScope}
                            onChange={(value) =>
                                setFormData({ ...formData, searchScope: value })
                            }
                            data={[
                                { label: 'View Range', value: 'viewRange' },
                                { label: 'Full History', value: 'full' },
                            ]}
                            size="xs"
                            fullWidth
                        />
                    </div>

                    <div>
                        <Text size="sm" weight={700} mb="xs">
                            Look Ahead
                        </Text>
                        <NumberInput
                            value={formData.lookAheadCandles}
                            onChange={(value) =>
                                setFormData({ ...formData, lookAheadCandles: value })
                            }
                            min={0}
                            max={500}
                            step={1}
                            size="sm"
                        />
                        <Text size="xs" c="dimmed" mt={2}>
                            0 = auto (same as slice length)
                        </Text>
                    </div>

                    <div>
                        <Text size="sm" weight={700} mb="xs">
                            Max Results
                        </Text>
                        <NumberInput
                            value={formData.maxResults}
                            onChange={(value) =>
                                setFormData({ ...formData, maxResults: value })
                            }
                            min={1}
                            max={100}
                            step={1}
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
                    
                    <AnalyseResults onJumpToMatch={onJumpToMatch} />
                </Stack>
            </form>
        </Box>
    );
}

export default AnalyseForm;
