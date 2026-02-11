import React from  "react"
import { Title, Space, LoadingOverlay, Box, Skeleton, Grid} from "@mantine/core";
import { useSelector, useDispatch } from "react-redux";
import { getStockData } from "../../../store/StockSlice";
import { formatDate } from "../../Utils/Utils";
import CandleStickChart from "./StockChartWithBrush.js";
import ChartActions from "./ChartActions.js";
import ChartInterval from "./ChartInterval.js";
import ChartDate from "./ChartDate.js";
import { tsvParse, csvParse } from  "d3-dsv";
import { timeParse } from "d3-time-format";
import classes from "./Chart.module.css";
import AnalyseForm from "./AnalyseForm.js";
import { handleAnalyse } from "../../../store/StockSlice.js"

function parseStockData(parse) {
	return function(d) {
    let n = {};
		n.date = parse(d.Date);
		n.open = +d.Data.Open;
		n.high = +d.Data.High;
		n.low = +d.Data.Low;
		n.close = +d.Data.Close;
		return n;
	};
}
const parseStockDate = timeParse("%Y-%m-%dT%H:%M:%SZ");

const Chart = (props = { stock }) => {
    const dispatch = useDispatch();

    let today = new Date();
    let lastMonth  = new Date(new Date().setMonth(today.getMonth() -2));

    const [interval, setInterval] = React.useState('1h');
    const [viewRange, setViewRange] = React.useState(
        {
            startDate: lastMonth,
            endDate: today,
            range: '1M',
            startIdx: 0,
            endIdx: 100,
        }
    );
    const [isLoading, setLoading] = React.useState(true);
    const [seriesData, setSeriesData] = React.useState(null);
    const [ actionState, setActionState ] = React.useState({
        resetView: false,
        zoomEvent: false,
        macd: false,
        mouseMoveEvent: false,
        brush: false
    });

    const handleAction = (action) => {
        setActionState({
            ...actionState,
            [action]: !actionState[action]
        })
    }

    const handleChartInterval = (newInterval) => {
        setInterval(newInterval);
    }

    React.useMemo(() => {
        if (seriesData === null) {
            return
        }
        setViewRange({
            ...viewRange,
            startIdx: 3,
            endIdx: seriesData.length
        });
        console.log(seriesData)
    }, [seriesData]);

    React.useMemo(() => {
        setLoading(true);
        dispatch(getStockData({stockName: props.stock.value, interval: interval, startDate: formatDate(viewRange.startDate), endDate: formatDate(viewRange.endDate) })).unwrap()
            .then((data) => {
                const parsedData = data.share.map(parseStockData(parseStockDate));
                setSeriesData(parsedData);
                setLoading(false);
            }).catch((err) => {
                setLoading(false);
            })
    }, [props.stock, interval]);

    React.useEffect(() => {
        if ( seriesData !== null ) {
            if ( viewRange.startDate < seriesData[0].date || viewRange.endDate > seriesData[seriesData.length -1].date ) {
                // fetch new data
                setLoading(true);
                dispatch(handleAnalyse({stockName: props.stock.value, interval: interval, startDate: formatDate(viewRange.startDate), endDate: formatDate(viewRange.endDate) })).unwrap()
                    .then((data) => {
                        const parsedData = data.share.map(parseStockData(parseStockDate));
                        setSeriesData(parsedData);
                        setLoading(false);

                    }).catch((err) => {
                        setLoading(false);
                    });
            }
        }
    }, [viewRange.startDate, viewRange.endDate]);


		const analyseSlice = (formData) => {
      dispatch(handleAnalyse({stockName: props.stock.value,
									interval: interval,
									startDate: formatDate(viewRange.startDate),
									endDate: formatDate(viewRange.endDate),
									minimumSimilarityRate:  formData.minimumSimilarityRate,
									sliceToAnalyse: formData.sliceToAnalyse
				})).unwrap().then((data) => {
						console.log(data);

				}).catch((err) => {
					console.log(err)
				});
		}

    return (
        <div>
            <Box pos="relative">
            <Title order={2}>{props.stock.label}</Title>
            <Space h="lg" />
            <div className={classes.intervalGroup}>
                <ChartInterval
                    interval={interval}
                    handleChartInterval={handleChartInterval}
                />
                <Space w="lg" />
                <ChartDate
                    viewRange={viewRange}
                    setViewRange={setViewRange}
                    initStartDate={props.stock.startDate}
                >
                </ChartDate>
            </div>
            <Space h="md" />
                    { !isLoading ?
                    <Grid gutters="xs">
                    <Grid.Col span="11" className={classes.chart}>
                    <CandleStickChart
                        isLoading={isLoading}
                        type="hybrid"
                        data={seriesData}
                        stockName={props.stock.label}
                        viewRange={viewRange}
                        zoomEvent={actionState.zoomEvent}
                        brush={actionState.brush}
                        macd={actionState.macd}
                        resetView={actionState.resetView}
                        handleAction={handleAction}
                    >
                    </CandleStickChart>
                    </Grid.Col>
                    <Grid.Col span="1">
                    <div style={{ zIndex: 111111 }}>
                        <ChartActions
                            zoomEvent={actionState.zoomEvent}
                            brush={actionState.brush}
                            macd={actionState.macd}
                            resetView={actionState.resetView}
                            handleAction={handleAction}
                        >
                        </ChartActions>
                    </div>
                    </Grid.Col>
                    </Grid>
                        :
                        <Skeleton height={650} mt={6} width={1500} radius="l" />
                    }
            </Box>
            <Space h="lg" />
            <AnalyseForm
							analyseSlice={analyseSlice}
						/>
        </div>
    );
}

export default Chart;
