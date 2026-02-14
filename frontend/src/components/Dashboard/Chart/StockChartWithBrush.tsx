import { format } from "d3-format";
import { timeFormat } from "d3-time-format";
import React, { Component } from "react";
import PropTypes from "prop-types"; // Note: Consider using TypeScript interfaces instead
import ChartActions from "./ChartActions"; // Update to .tsx if needed
import { StraightLine } from "@react-stockcharts3/series";
import {
    ChartCanvas,
    Chart,
    isDefined,
    last,
} from "@react-stockcharts3/core";
import { withDeviceRatio, withSize } from "@react-stockcharts3/utils";
import { discontinuousTimeScaleProviderBuilder } from "@react-stockcharts3/scales";
import {
    CandlestickSeries,
    LineSeries,
    MACDSeries,
} from "@react-stockcharts3/series";
import { XAxis, YAxis } from "@react-stockcharts3/axes";
import {
    CrossHairCursor,
    EdgeIndicator,
    CurrentCoordinate,
    MouseCoordinateX,
    MouseCoordinateY,
} from "@react-stockcharts3/coordinates";
import { OHLCTooltip, MovingAverageTooltip, MACDTooltip } from "@react-stockcharts3/tooltip";
import { ema, sma, macd } from "@react-stockcharts3/indicators";
import { Brush } from "@react-stockcharts3/interactive";

interface CandlestickChartProps {
    data: any[]; 
    width: number;
    ratio: number;
    type: "svg" | "hybrid";
    stockName?: string;
    clamp?: boolean;
    plotResults?: Array<{ startIdx: number; endIdx: number }> | null;
    activePage?: number;
    macd?: boolean;
    zoomEvent?: boolean;
    brush?: boolean;
    viewRange: { startIdx: number; endIdx: number };
    resetView?: boolean;
    handleAction: (action: string) => void;
}

interface CandlestickChartState {
    data: any[];
    xScale: any;
    xAccessor: (d: any) => Date;
    displayXAccessor: (d: any) => string;
    xExtents: [number, number];
    yExtents1?: any[] | ((d: any) => [number, number]);
    yExtents3?: any;
    zoomAnchor?: any;
}

const BRUSH_TYPE = "2D";
const macdAppearance = {
    fillStyle: {
        divergence: "#4682B4"
    },
    strokeStyle: {
        macd: "#0093FF",
        signal: "#D84315",
        zero: "rgba(0, 0, 0, 0.3)",
    },
} as const;

const ema26 = ema()
    .id(0)
    .options({ windowSize: 26 })
    .merge((d: any, c: any) => { d.ema26 = c; })
    .accessor((d: any) => d.ema26);

const ema12 = ema()
    .id(1)
    .options({ windowSize: 12 })
    .merge((d: any, c: any) => { d.ema12 = c; })
    .accessor((d: any) => d.ema12);

const macdCalculator = macd()
    .options({ fast: 12, slow: 26, signal: 9 })
    .merge((d: any, c: any) => { d.macd = c; })
    .accessor((d: any) => d.macd);

const smaVolume50 = sma()
    .id(3)
    .options({ windowSize: 10, sourcePath: "volume" })
    .merge((d: any, c: any) => { d.smaVolume50 = c; })
    .accessor((d: any) => d.smaVolume50);



class CandlestickChart extends Component<CandlestickChartProps, CandlestickChartState> {
    private node_1?: any;
    private canvasNode?: any;
    private interactiveNodes?: any;

    private saveInteractiveNode(type: string, chartId: number) {
        return (node: any) => {
            if (!this.interactiveNodes) {
                this.interactiveNodes = {};
            }
            const key = `${type}_${chartId}`;
            if (node || this.interactiveNodes[key]) {
                this.interactiveNodes = {
                    ...this.interactiveNodes,
                    [key]: { type, chartId, node },
                };
            }
        };
    }

    constructor(props: CandlestickChartProps) {
        super(props);
        this.handleBrush1 = this.handleBrush1.bind(this);
        this.onKeyPress = this.onKeyPress.bind(this);
        this.handleChangeViewRange = this.handleChangeViewRange.bind(this);

        const { data: initialData } = props;
        const calculatedData = macdCalculator(smaVolume50(ema12(ema26(initialData))));
        const xScaleProvider = discontinuousTimeScaleProviderBuilder().inputDateAccessor(
            (d: any) => d.date,
        );

        const { data, xScale, xAccessor, displayXAccessor } = xScaleProvider(calculatedData);

        const start = xAccessor(data[this.props.viewRange.startIdx]);
        const end = xAccessor(data[Math.max(0, this.props.viewRange.endIdx - 150)]);
        const xExtents = [start, end];

        this.state = {
            data,
            xScale,
            xAccessor,
            displayXAccessor,
            xExtents,
        };
    }


    componentDidMount() {
        document.addEventListener("keyup", this.onKeyPress);
    }

    componentWillUnmount() {
        document.removeEventListener("keyup", this.onKeyPress);
    }

    componentDidUpdate(prevProps: CandlestickChartProps) {
        if (prevProps.data.length !== this.props.data.length) {
            console.log("data changed");
        } else if (prevProps.resetView !== this.props.resetView) {
            console.log("Resetting view");
            const left = 0;
            const right = this.props.data.length - 1;

            const calculatedData = macdCalculator(smaVolume50(ema12(ema26(this.props.data))));
            const xScaleProvider = discontinuousTimeScaleProviderBuilder().inputDateAccessor(
                (d: any) => d.date,
            );
            const { data, xScale, xAccessor, displayXAccessor } = xScaleProvider(calculatedData);

            this.setState({
                ...this.state,
                data,
                xScale,
                xAccessor,
                displayXAccessor,
                xExtents: [left, right],
                yExtents1: undefined,
                yExtents3: undefined,
            });
            this.node_1?.terminate();
        }
    }

    saveCanvasNode = (node: any) => {
        this.canvasNode = node;
    };

    onKeyPress = (e: KeyboardEvent) => {
        const keyCode = e.which;
        switch (keyCode) {
            case 27: { // ESC
                this.node_1?.terminate();
            }
        }
    };

    handleBrush1 = (brushCoords: { start: { xValue: number }; end: { xValue: number } }) => {
        const { start, end } = brushCoords;
        const left = Math.min(start.xValue, end.xValue);
        const right = Math.max(start.xValue, end.xValue);

        if (left === right) {
            this.setState({ ...this.state });
            this.props.handleAction("brush");
            this.node_1?.terminate();
            return;
        }

        this.setState({
            ...this.state,
            xExtents: [left, right],
            yExtents1: undefined,
            yExtents3: undefined,
        });
        this.props.handleAction("brush");
        this.node_1?.terminate();
    };

    handleChangeViewRange = (startIdx: number, endIdx: number) => {
        this.setState({
            ...this.state,
            xExtents: [startIdx, endIdx],
            yExtents1: undefined,
            yExtents3: undefined,
        });
        this.props.handleAction("brush");
        this.node_1?.terminate();
    };

    render() {
        const {
            type,
            width,
            ratio,
            stockName,
            clamp,
            plotResults,
            activePage,
            macd,
            brush
        } = this.props;
        const { data, xExtents, xScale, xAccessor, displayXAccessor } = this.state;

        const yExtents1 = isDefined(this.state.yExtents1)
            ? this.state.yExtents1
            : [(d: any) => [d.high, d.low], ema26.accessor(), ema12.accessor()];

        const yExtents3 = isDefined(this.state.yExtents3)
            ? this.state.yExtents3
            : macdCalculator.accessor();

        const height = macd ? 1050 : 650;

        return (
            <ChartCanvas
                height={height}
                width={width}
                ratio={ratio}
                margin={{ left: 70, right: 70, top: 20, bottom: 30 }}
                panEvent={true}
                zoomEvent={this.props.zoomEvent}
                clamp={clamp}
                zoomAnchor={this.state.zoomAnchor}
                type={type}
                seriesName={stockName}
                data={data}
                xScale={xScale}
                xAccessor={xAccessor}
                displayXAccessor={displayXAccessor}
                xExtents={xExtents}
            >
                <Chart
                    id={1}
                    height={550}
                    yPanEnabled={isDefined(this.state.yExtents1)}
                    yExtents={yExtents1}
                    padding={{ top: 100, bottom: 20 }}
                >
                    <XAxis axisAt="bottom" orient="bottom" />
                    <YAxis
                        axisAt="left"
                        orient="left"
                        ticks={10}
                        zoomEnabled={this.props.zoomEvent}
                        showTicks={true}
                        className="react-stockcharts3-y-axis y-axis"
                    />

                    <MouseCoordinateY
                        at="right"
                        orient="right"
                        displayFormat={format(".2f")}
                    />

                    <CandlestickSeries />
                    <LineSeries yAccessor={ema26.accessor()} stroke={ema26.stroke()} />
                    <LineSeries yAccessor={ema12.accessor()} stroke={ema12.stroke()} />

                    <CurrentCoordinate yAccessor={ema26.accessor()} fill={ema26.stroke()} />
                    <CurrentCoordinate yAccessor={ema12.accessor()} fill={ema12.stroke()} />

                    <EdgeIndicator
                        itemType="last"
                        orient="right"
                        edgeAt="right"
                        yAccessor={(d: any) => d.close}
                        fill={(d: any) => (d.close > d.open ? "#6BA583" : "#FF0000")}
                    />

                    <OHLCTooltip origin={[15, 0]} />

                    <MovingAverageTooltip
                        onClick={(e: any) => console.log(e)}
                        origin={[15, 15]}
                        options={[
                            {
                                yAccessor: ema26.accessor(),
                                type: ema26.type(),
                                stroke: ema26.stroke(),
                                windowSize: ema26.options().windowSize,
                            },
                            {
                                yAccessor: ema12.accessor(),
                                type: ema12.type(),
                                stroke: ema12.stroke(),
                                windowSize: ema12.options().windowSize,
                            },
                        ]}
                    />

                    <MouseCoordinateX
                        at="bottom"
                        orient="bottom"
                        displayFormat={timeFormat("%Y-%m-%d")}
                    />
                    {false &&
                        plotResults.map((result: { startIdx: number; endIdx: number }, index: number) => (
                            <React.Fragment key={index}>
                                <StraightLine
                                    type="vertical"
                                    xValue={result.startIdx}
                                    stroke={activePage! - 1 === index ? "red" : "blue"}
                                    strokeWidth={activePage! - 1 === index ? 2 : 1}
                                    opacity={activePage! - 1 === index ? 1 : 0.5}
                                />
                                <StraightLine
                                    type="vertical"
                                    xValue={result.endIdx}
                                    stroke={activePage! - 1 === index ? "red" : "blue"}
                                    strokeWidth={activePage! - 1 === index ? 2 : 1}
                                    opacity={activePage! - 1 === index ? 1 : 0.5}
                                />
                            </React.Fragment>
                        ))}
                    
                    {/* Brush component for zooming */}
                    {brush && (
                        <Brush
                            ref={this.saveInteractiveNode(BRUSH_TYPE, 1)}
                            enabled={brush}
                            type={BRUSH_TYPE}
                            onBrush={this.handleBrush1}
                        />
                    )}
                </Chart>
                {macd && (
                    <Chart
                        id={3}
                        height={150}
                        yExtents={yExtents3}
                        yPanEnabled={isDefined(this.state.yExtents3)}
                        origin={(_w: number, h: number) => [0, h - 200]}
                        padding={{ top: 10, bottom: 10 }}
                    >
                        <XAxis axisAt="bottom" orient="bottom" />
                        <YAxis axisAt="right" orient="right" ticks={2} />
                        <MouseCoordinateX
                            at="bottom"
                            orient="bottom"
                            displayFormat={timeFormat("%Y-%m-%d")}
                        />
                        <MouseCoordinateY
                            at="right"
                            orient="right"
                            displayFormat={format(".2f")}
                        />
                        <MACDSeries yAccessor={(d: any) => d.macd} {...macdAppearance} />
                        <MACDTooltip
                            origin={[-38, 15]}
                            yAccessor={(d: any) => d.macd}
                            options={macdCalculator.options()}
                            appearance={macdAppearance}
                        />
                    </Chart>
                )}
                <CrossHairCursor />
            </ChartCanvas>
        );
    }

}

CandlestickChart.propTypes = {
    data: PropTypes.array.isRequired,
    width: PropTypes.number.isRequired,
    ratio: PropTypes.number.isRequired,
    type: PropTypes.oneOf(["svg", "hybrid"]).isRequired,
};

CandlestickChart.defaultProps = {
    type: "svg",
};

const Charter = withSize({ style: { minHeight: 650, minWidth: 1500 } })(
    withDeviceRatio()(CandlestickChart)
) as React.ComponentType<CandlestickChartProps>;

export default Charter;
