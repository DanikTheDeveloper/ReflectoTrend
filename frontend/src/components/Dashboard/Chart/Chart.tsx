import React from "react";
import { Title, Space, Box, Skeleton, Grid } from "@mantine/core";
import { useDispatch, useSelector } from "react-redux";
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
  sliceToAnalyse: [string, string];
  searchScope: string;
  lookAheadCandles: number;
  maxResults: number;
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

  const analyseStats = useSelector((state: any) => state.stock.analyseStats);
  const analyseData = useSelector((state: any) => state.stock.analyseData);

  const projectionData = React.useMemo(() => {
    if (!analyseStats?.medianPath || !analyseData?.length || !seriesData?.length) return null;
    const lastClose = seriesData[seriesData.length - 1].close;
    const stepMs = seriesData.length >= 2
      ? seriesData[seriesData.length - 1].date.getTime() - seriesData[seriesData.length - 2].date.getTime()
      : 3600000;
    const anchorTime = seriesData[seriesData.length - 1].date.getTime();
    return analyseStats.medianPath.map((ret: number, i: number) => ({
      date: new Date(anchorTime + (i + 1) * stepMs),
      close: lastClose * (1 + ret),
    }));
  }, [analyseStats, analyseData, seriesData]);

  const onJumpToMatch = React.useCallback((startDate: string, endDate: string) => {
    if (!seriesData) return;
    const startIdx = seriesData.findIndex(
      (d) => d.date >= new Date(startDate)
    );
    const endIdx = seriesData.findIndex(
      (d) => d.date >= new Date(endDate)
    );
    if (startIdx >= 0 && endIdx >= 0) {
      setViewRange((prev) => ({
        ...prev,
        startIdx,
        endIdx,
        startDate: seriesData[startIdx].date,
        endDate: seriesData[Math.min(endIdx, seriesData.length - 1)].date,
      }));
    }
  }, [seriesData]);

  const handleAction = (action: ActionType): void => {
    setActionState({
      ...actionState,
      [action]: !actionState[action],
    });
  };

  const handleChartInterval = (newInterval: string): void => {
    setInterval(newInterval);
  };

  React.useEffect(() => {
    if (seriesData === null) {
      return;
    }
    setViewRange({
      ...viewRange,
      startIdx: 3,
      endIdx: seriesData.length,
    });
  }, [seriesData]);

  React.useEffect(() => {
    setLoading(true);
    setSeriesData(null);
    
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
        const parsedData = (data.share ?? []).map(parseStockData(parseStockDate));
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
        searchScope: formData.searchScope,
        lookAheadCandles: formData.lookAheadCandles || undefined,
        maxResults: formData.maxResults || undefined,
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
        
        {!isLoading && seriesData != null ? (
          <>
            <Grid gutter="xs">
              <Grid.Col span={8} className={classes.chart}>
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
                  projectionData={projectionData}
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

              <Grid.Col span={3}>
                <AnalyseForm
                  analyseSlice={analyseSlice}
                  onJumpToMatch={onJumpToMatch}
                  stockName={stock.value}
                  currentPrice={seriesData.length > 0 ? seriesData[seriesData.length - 1].close : 0}
                />
              </Grid.Col>
            </Grid>

          </>
        ) : (
          <Skeleton height={650} mt={6} width={1500} radius="lg" />
        )}
                {
                    isLoading && seriesData === null && (
                        <Box h={650} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Title order={4} c="dimmed"> No data available for this stock. </Title>
                        </Box>
                    )
                }
      </Box>
    </div>
  );
};

export default Chart;
