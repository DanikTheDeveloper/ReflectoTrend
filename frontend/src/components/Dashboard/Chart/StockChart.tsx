import React from "react";
import PropTypes from "prop-types";
import { format } from "d3-format";
import { timeFormat } from "d3-time-format";
import { ChartCanvas, Chart, ZoomButtons } from "@react-stockcharts/core";
import {
	BarSeries,
	CandlestickSeries,
} from "@react-stockcharts/series";
import { XAxis, YAxis } from "@react-stockcharts/axes";
import {
	CrossHairCursor,
	MouseCoordinateX,
	MouseCoordinateY,
} from "@react-stockcharts/coordinates";
import { discontinuousTimeScaleProviderBuilder } from "@react-stockcharts/scales";
import {
	OHLCTooltip,
} from "@react-stockcharts/tooltip";
import { fitWidth } from "@react-stockcharts/helper";
import { last, isDefined } from "@react-stockcharts/utils";
import { Brush } from "@react-stockcharts/interactive";
// import {
// 	saveInteractiveNode,
// } from "./InteractiveUtils";
import { ema, sma, macd } from "@react-stockcharts/indicator";


const BRUSH_TYPE = "2D"; // Valid values = "2D", "1D"

const ema26 = ema()
	.id(0)
	.options({
		windowSize: 26,
	})
	.merge((d, c) => { d.ema26 = c; })
	.accessor(d => d.ema26);

const ema12 = ema()
	.id(1)
	.options({
		windowSize: 12,
	})
	.merge((d, c) => { d.ema12 = c; })
	.accessor(d => d.ema12);

const macdCalculator = macd()
	.options({
		fast: 12,
		slow: 26,
		signal: 9,
	})
	.merge((d, c) => { d.macd = c; })
	.accessor(d => d.macd);

const smaVolume50 = sma()
	.id(3)
	.options({
		windowSize: 10,
		sourcePath: "volume",
	})
	.merge((d, c) => { d.smaVolume50 = c; })
	.accessor(d => d.smaVolume50);

class CandleStickChart extends React.Component {
    constructor(props) {
		super(props);
		this.saveNode = this.saveNode.bind(this);
		this.resetYDomain = this.resetYDomain.bind(this);
		this.handleReset = this.handleReset.bind(this);
        this.candlesAppearance = {
            wickStroke: "#000000",
            fill: function fill(d) {
                return d.close > d.open ? "#6BA583": "#FF0000";
            },
            stroke: "#000000",
            candleStrokeWidth: 1,
            widthRatio: 0.8,
            opacity: 1,
        };
        this.handleBrush1 = this.handleBrush1.bind(this);
        //this.saveInteractiveNode = saveInteractiveNode.bind(this);
        const { data: initialData } = props;

		const calculatedData = macdCalculator(smaVolume50(ema12(ema26(initialData))));
		const xScaleProvider = discontinuousTimeScaleProvider
			.inputDateAccessor(d => d.date);
		const {
			data,
			xScale,
			xAccessor,
			displayXAccessor,
		} = xScaleProvider(calculatedData);

		const start = xAccessor(last(data));
		const end = xAccessor(data[Math.max(0, data.length - 150)]);
		const xExtents = [start, end];

		this.state = {
			data, xScale, xAccessor, displayXAccessor,
			xExtents,
			brushEnabled: true,
		};
	}

    static propTypes = {
        data: PropTypes.array.isRequired,
        width: PropTypes.number.isRequired,
        ratio: PropTypes.number.isRequired,
        type: PropTypes.oneOf(["svg", "hybrid"]).isRequired,
    };

    state = {
        suffix: 1,
        xExtents: [0, 0],
        yExtents1: [0, 0],
        brushEnabled: true,
    }

    componentDidUpdate(prevProps) {
        if (prevProps.viewRange !== this.props.viewRange) {
            this.refs.chartCanvas.setViewRange(this.props.viewRange);
        }
    }

	saveNode(node) {
		this.node = node;
	}
	resetYDomain() {
		this.node.resetYDomain();
	}
	handleReset() {
		this.setState({
            ...this.state,
			suffix: this.state.suffix + 1
		});
	}

    handleBrush1(brushCoords, moreProps) {
        const { start, end } = brushCoords;
        const left = Math.min(start.xValue, end.xValue);
        const right = Math.max(start.xValue, end.xValue);

        const low = Math.min(start.yValue, end.yValue);
        const high = Math.max(start.yValue, end.yValue);

        // uncomment the line below to make the brush to zoom
        this.setState({
            ...state,
            xExtents: [left, right],
            yExtents1: BRUSH_TYPE === "2D" ? [low, high] : this.state.yExtents1,
            brushEnabled: false,
        });
    }
	render() {
		const { type, width, ratio, stockName, clamp, mouseMoveEvent, panEvent, zoomEvent, zoomAnchor, brushEnabled, viewRange } = this.props;
        const { data, xScale, xAccessor, displayXAccessor, xExtents } = this.state;

		const yExtents1 =  isDefined(this.state.yExtents1)
            ? this.state.yExtents1
            : [d => [d.high, d.low], ema26.accessor(), ema12.accessor()];

		const margin = { left: 70, right: 70, top: 20, bottom: 30 };

		const height = 400;

		const gridHeight = height - margin.top - margin.bottom;
		const gridWidth = width - margin.left - margin.right;

		const showGrid = true;
		const yGrid = showGrid ? { innerTickSize: -1 * gridWidth, tickStrokeOpacity: 0.2 } : {};
		const xGrid = showGrid ? { innerTickSize: -1 * gridHeight, tickStrokeOpacity: 0.2 } : {};

		return (
			<ChartCanvas ref="chartCanvas" height={height}
				ratio={ratio}
				width={width}
				margin={{ left: 70, right: 70, top: 10, bottom: 30 }}
	    		mouseMoveEvent={mouseMoveEvent}
				panEvent={panEvent}
				zoomEvent={zoomEvent}
				clamp={clamp}
				zoomAnchor={zoomAnchor}
				type={type}
				seriesName={stockName}
				data={data}
				xScale={xScale}
				xExtents={xExtents}
				xAccessor={xAccessor}
				displayXAccessor={displayXAccessor}
			>
				<Chart id={1}
					yExtents={yExtents1}
				>
					<XAxis axisAt="bottom"
						orient="bottom"
						zoomEnabled={zoomEvent}
						{...xGrid} />
					<YAxis axisAt="right"
						orient="right"
						ticks={5}
						zoomEnabled={zoomEvent}
						{...yGrid}
					/>

					<MouseCoordinateY
						at="right"
						orient="right"
						displayFormat={format(".2f")} />

					<CandlestickSeries
                        {...this.candlesAppearance}
                    />
					<OHLCTooltip origin={[-40, 0]}/>
				</Chart>
			</ChartCanvas>
		);
	}
}


CandleStickChart = fitWidth(CandleStickChart);

export default CandleStickChart;
