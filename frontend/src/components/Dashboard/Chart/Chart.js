import React from  "react"
import { Title, Space, LoadingOverlay } from "@mantine/core";
import { useSelector, useDispatch } from "react-redux";
import { getStockData } from "../../../store/StockSlice";
import { formatDate } from "../../Utils/Utils";
import CandleStickChart from "./StockChart.js";
import ChartActions from "./ChartActions.js";
import ChartInterval from "./ChartInterval.js";
import ChartDate from "./ChartDate.js";
import { tsvParse, csvParse } from  "d3-dsv";
import { timeParse } from "d3-time-format";
import classes from "./Chart.module.css";
import AnalyseForm from "./AnalyseForm.js";

function parseStockData(parse) {
	return function(d) {
        let n = {};
		n.date = parse(d.Date);
		n.open = +d.Data.Open;
		n.high = +d.Data.High;
		n.low = +d.Data.Low;
		n.close = +d.Data.Close;
        if ( n.open > n.close ) {
            console.log("red")
        }
		return n;
	};
}
const parseStockDate = timeParse("%Y-%m-%dT%H:%M:%SZ");

const Chart = (props = {stock}) => {
    const dispatch = useDispatch();

    let today = new Date();
    let lastMonth  = new Date(new Date().setMonth(today.getMonth() -2));
    //let lastMonth  = new Date(new Date().setFullYear(today.getFullYear() -1));

    const [interval, setInterval] = React.useState('1h');
    const [startDate, setStartDate] = React.useState(lastMonth);
    const [endDate, setEndDate] = React.useState(today);
    const [isLoading, setLoading] = React.useState(true);
    const [seriesData, setSeriesData] = React.useState(null);
    const [automaticFill, toggleAutomaticFill] = React.useState(true);
    const [ actionState, setActionState ] = React.useState({
        zoomEvent: false,
        mouseMoveEvent: false,
        panEvent: false,
        brush: false
    });
    const [viewRange, setViewRange] = React.useState();

    const handleAction = (action) => {
        console.log(actionState)
        setActionState({
            ...actionState,
            [action]: !actionState[action]
        })
    }

    const handleChartInterval = (newInterval) => {
        setInterval(newInterval);
    }

    React.useEffect(() => {
        setLoading(true);
        console.log(props.stock)
        dispatch(getStockData({stockName: props.stock.value, interval: interval, startDate: formatDate(startDate), endDate: formatDate(endDate) })).unwrap()
            .then((data) => {
                const parsedData = data.share.map(parseStockData(parseStockDate));
                console.log(parsedData)
                setSeriesData(parsedData);
                setViewRange([startDate, endDate]);
                setLoading(false);
            }).catch((err) => {
                setLoading(false);
                console.log(err)
            })
    }, [props.stock, interval]);

    React.useEffect(() => {
        if ( seriesData !== null ) {
            if ( startDate < seriesData[0].date ||  endDate > seriesData[seriesData.length -1].date ) {
                // fetch new data
                setLoading(true);
                dispatch(getStockData({stockName: props.stock.value, interval: interval, startDate: formatDate(startDate), endDate: formatDate(endDate) })).unwrap()
                    .then((data) => {
                        const parsedData = data.share.map(parseStockData(parseStockDate));
                        console.log(parsedData)
                        setSeriesData(parsedData);
                        setViewRange([startDate, endDate]);
                        setLoading(false);

                    }).catch((err) => {
                        setLoading(false);
                        console.log(err)
                    });
            }
        }
    }, [startDate, endDate]);



    return (
        <div>
        {isLoading ?
            <>
            <LoadingOverlay visible={isLoading} zIndex={100} overlayProps={{radius: "lg", blur: 1}} /> :
            </>
            :
            <>
            <Title order={2}>{props.stock.label}</Title>
            <Space h="lg" />
            <div className={classes.intervalGroup}>
                <ChartInterval
                    interval={interval}
                    handleChartInterval={handleChartInterval}
                />
                <Space w="lg" />
                <ChartDate
                    startDate={startDate}
                    endDate={endDate}
                    setStartDate={setStartDate}
                    setEndDate={setEndDate}
                    automaticFill={automaticFill}
                    toggleAutomaticFill={toggleAutomaticFill}
                    initStartDate={props.stock.startDate}
                >
                </ChartDate>
            </div>
            <Space h="md" />
            <div id="chart" className={classes.ChartArea}>
                <div className={classes.chart}>
                    <CandleStickChart
                        type="hybrid"
                        data={seriesData}
                        stockName={props.stock.label}
                        mouseMoveEvent={actionState.mouseMoveEvent}
                        panEvent={actionState.panEvent}
                        zoomEvent={actionState.zoomEvent}
                        brushEnabled={actionState.brush}
                        viewRange={viewRange}
                    >
                    </CandleStickChart>
                </div>
                <Space w="sm" />
                <ChartActions
                    mouseMoveEvent={actionState.mouseMoveEvent}
                    panEvent={actionState.panEvent}
                    zoomEvent={actionState.zoomEvent}
                    brush={actionState.brush}
                    handleAction={handleAction}
                >
                </ChartActions>
            </div>
            <Space h="lg" />
            <AnalyseForm />
            </>
        }
        </div>
    );
}

export default Chart;
