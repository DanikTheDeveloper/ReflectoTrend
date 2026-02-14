import React from "react";
import { Title, Space, Box, Skeleton, Grid } from "@mantine/core";
import { useDispatch } from "react-redux";
import { getStockData, handleAnalyse } from "../../../store/StockSlice";
import { formatDate } from "../../Utils/Utils";
import CandleStickChart from "./StockChartWithBrush";
import ChartActions from "./ChartActions";
import ChartInterval from "./ChartInterval";
import ChartDate from "./ChartDate";
import { timeParse } from "d3-time-format";
import classes from "./Chart.module.css";
import AnalyseForm from "./AnalyseForm";
import type { AppDispatch } from "../../../store/types";

export interface StockDataPoint {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface RawStockData {
  Date: string;
  Data: {
    Open: string | number;
    High: string | number;
    Low: string | number;
    Close: string | number;
  };
}

export interface ViewRange {
  startDate: Date;
  endDate: Date;
  range: '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | 'ALL';
  startIdx: number;
  endIdx: number;
}

export interface ActionState {
  resetView: boolean;
  zoomEvent: boolean;
  macd: boolean;
  mouseMoveEvent: boolean;
  brush: boolean;
}

export type ActionType = keyof ActionState;

export interface Stock {
  value: string;
  label: string;
  startDate?: Date;
}

interface ChartProps {
  stock: Stock;
}

interface AnalyseFormData {
  minimumSimilarityRate: number;
  sliceToAnalyse: string;
}

interface StockAPIResponse {
  share: RawStockData[];
}

const parseStockDate = timeParse("%Y-%m-%dT%H:%M:%SZ");

function parseStockData(parse: (dateString: string) => Date | null) {
  return function (d: RawStockData): StockDataPoint {
    const parsedDate = parse(d.Date);
    
    if (!parsedDate) {
      throw new Error(`Invalid date format: ${d.Date}`);
    }

    return {
      date: parsedDate,
      open: Number(d.Data.Open),
      high: Number(d.Data.High),
      low: Number(d.Data.Low),
      close: Number(d.Data.Close),
    };
  };
}

const Chart: React.FC<ChartProps> = ({ stock }) => {
  const dispatch = useDispatch<AppDispatch>();

  const today = new Date();
  const lastMonth = new Date(new Date().setMonth(today.getMonth() - 2));

  const [interval, setInterval] = React.useState<string>('1h');
  
  const [viewRange, setViewRange] = React.useState<ViewRange>({
    startDate: lastMonth,
    endDate: today,
    range: '1M',
    startIdx: 0,
    endIdx: 100,
  });

  const [isLoading, setLoading] = React.useState<boolean>(true);
  const [seriesData, setSeriesData] = React.useState<StockDataPoint[] | null>(null);
  
  const [actionState, setActionState] = React.useState<ActionState>({
    resetView: false,
    zoomEvent: false,
    macd: false,
    mouseMoveEvent: false,
    brush: false,
  });

  const handleAction = (action: ActionType): void => {
    setActionState({
      ...actionState,
      [action]: !actionState[action],
    });
  };

  const handleChartInterval = (newInterval: string): void => {
    setInterval(newInterval);
  };

  React.useMemo(() => {
    if (seriesData === null) {
      return;
    }
    setViewRange({
      ...viewRange,
      startIdx: 3,
      endIdx: seriesData.length,
    });
  }, [seriesData]);

  React.useMemo(() => {
    setLoading(true);
    
    dispatch(
      getStockData({
        stockName: stock.value,
        interval: interval,
        startDate: formatDate(viewRange.startDate),
        endDate: formatDate(viewRange.endDate),
      })
    )
      .unwrap()
      .then((data: StockAPIResponse) => {
        const parsedData = data.share.map(parseStockData(parseStockDate));
        setSeriesData(parsedData);
        setLoading(false);
      })
      .catch((err: Error) => {
        console.error('Failed to fetch stock data:', err);
        setLoading(false);
      });
  }, [stock, interval]);

  React.useEffect(() => {
    if (seriesData !== null && seriesData.length > 0) {
      const needsNewData =
        viewRange.startDate < seriesData[0].date ||
        viewRange.endDate > seriesData[seriesData.length - 1].date;

      if (needsNewData) {
        setLoading(true);
        
        dispatch(
          handleAnalyse({
            stockName: stock.value,
            interval: interval,
            startDate: formatDate(viewRange.startDate),
            endDate: formatDate(viewRange.endDate),
          })
        )
          .unwrap()
          .then((data: StockAPIResponse) => {
            const parsedData = data.share.map(parseStockData(parseStockDate));
            setSeriesData(parsedData);
            setLoading(false);
          })
          .catch((err: Error) => {
            console.error('Failed to fetch extended data:', err);
            setLoading(false);
          });
      }
    }
  }, [viewRange.startDate, viewRange.endDate]);

  const analyseSlice = (formData: AnalyseFormData): void => {
    dispatch(
      handleAnalyse({
        stockName: stock.value,
        interval: interval,
        startDate: formatDate(viewRange.startDate),
        endDate: formatDate(viewRange.endDate),
        minimumSimilarityRate: formData.minimumSimilarityRate,
        sliceToAnalyse: formData.sliceToAnalyse,
      })
    )
      .unwrap()
      .then((data: unknown) => {
        console.log('Analysis result:', data);
      })
      .catch((err: Error) => {
        console.error('Analysis failed:', err);
      });
  };

  return (
    <div>
      <Box pos="relative">
        <Title order={2} className={classes.title}>{stock.label}</Title>
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
            initStartDate={stock.startDate}
          />
        </div>
        
        <Space h="md" />
        
        {!isLoading ? (
          <Grid gutter="xs">
            <Grid.Col span={9} className={classes.chart}>
              <CandleStickChart
                isLoading={isLoading}
                type="hybrid"
                data={seriesData}
                stockName={stock.label}
                viewRange={viewRange}
                zoomEvent={actionState.zoomEvent}
                brush={actionState.brush}
                macd={actionState.macd}
                resetView={actionState.resetView}
                handleAction={handleAction}
              />
            </Grid.Col>
            
            <Grid.Col span={1}>
              <div style={{ zIndex: 111111 }}>
                <ChartActions
                  zoomEvent={actionState.zoomEvent}
                  brush={actionState.brush}
                  macd={actionState.macd}
                  resetView={actionState.resetView}
                  handleAction={handleAction}
                />
              </div>
            </Grid.Col>

            <Grid.Col span={2}>
              <AnalyseForm analyseSlice={analyseSlice} />
            </Grid.Col>
          </Grid>
        ) : (
          <Skeleton height={650} mt={6} width={1500} radius="lg" />
        )}
      </Box>
    </div>
  );
};

export default Chart;
