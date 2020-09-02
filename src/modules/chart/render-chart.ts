import { createCanvas, registerFont } from 'canvas';

const width = 1024 + 256;
const height = 512 + 256;
const margin = 128;
const titleTextSize = 35;

const lineWidth = 16;
const yAxisThickness = 2;

const colors = {
	bg: '#434343',
	text: '#e0e4cc',
	yAxis: '#5a5a5a',
	dataset: [
		'#ff4e50',
		'#c2f725',
		'#69d2e7',
		'#f38630',
		'#f9d423',
	]
};

const yAxisTicks = 4;

type Chart = {
	title?: string;
	datasets: {
		title?: string;
		data: number[];
	}[];
};

export function renderChart(chart: Chart) {
	registerFont('./font.ttf', { family: 'CustomFont' });

	const canvas = createCanvas(width, height);
	const ctx = canvas.getContext('2d');
	ctx.antialias = 'default';

	ctx.fillStyle = colors.bg;
	ctx.beginPath();
	ctx.fillRect(0, 0, width, height);

	let chartAreaX = margin;
	let chartAreaY = margin;
	let chartAreaWidth = width - (margin * 2);
	let chartAreaHeight = height - (margin * 2);

	// Draw title
	if (chart.title) {
		ctx.font = `${titleTextSize}px CustomFont`;
		const t = ctx.measureText(chart.title);
		ctx.fillStyle = colors.text;
		ctx.fillText(chart.title, (width / 2) - (t.width / 2), 128);

		chartAreaY += titleTextSize;
		chartAreaHeight -= titleTextSize;
	}

	const xAxisCount = chart.datasets[0].data.length;
	const serieses = chart.datasets.length;

	let lowerBound = Infinity;
	let upperBound = -Infinity;

	for (let xAxis = 0; xAxis < xAxisCount; xAxis++) {
		let v = 0;
		for (let series = 0; series < serieses; series++) {
			v += chart.datasets[series].data[xAxis];
		}
		if (v > upperBound) upperBound = v;
		if (v < lowerBound) lowerBound = v;
	}

	// Calculate Y axis scale
	const yAxisSteps = niceScale(lowerBound, upperBound, yAxisTicks);
	const yAxisStepsMin = yAxisSteps[0];
	const yAxisStepsMax = yAxisSteps[yAxisSteps.length - 1];
	const yAxisRange = yAxisStepsMax - yAxisStepsMin;

	// Draw Y axis
	ctx.lineWidth = yAxisThickness;
	ctx.lineCap = 'round';
	ctx.strokeStyle = colors.yAxis;
	for (let i = 0; i < yAxisSteps.length; i++) {
		const step = yAxisSteps[yAxisSteps.length - i - 1];
		const y = i * (chartAreaHeight / (yAxisSteps.length - 1));
		ctx.beginPath();
		ctx.lineTo(chartAreaX, chartAreaY + y);
		ctx.lineTo(chartAreaX + chartAreaWidth, chartAreaY + y);
		ctx.stroke();

		ctx.font = '20px CustomFont';
		ctx.fillStyle = colors.text;
		ctx.fillText(step.toString(), chartAreaX, chartAreaY + y - 8);
	}

	const newDatasets: any[] = [];

	for (let series = 0; series < serieses; series++) {
		newDatasets.push({
			data: []
		});
	}

	for (let xAxis = 0; xAxis < xAxisCount; xAxis++) {
		for (let series = 0; series < serieses; series++) {
			newDatasets[series].data.push(chart.datasets[series].data[xAxis] / yAxisRange);
		}
	}

	const perXAxisWidth = chartAreaWidth / xAxisCount;

	let newUpperBound = -Infinity;

	for (let xAxis = 0; xAxis < xAxisCount; xAxis++) {
		let v = 0;
		for (let series = 0; series < serieses; series++) {
			v += newDatasets[series].data[xAxis];
		}
		if (v > newUpperBound) newUpperBound = v;
	}

	// Draw X axis
	ctx.lineWidth = lineWidth;
	ctx.lineCap = 'round';

	for (let xAxis = 0; xAxis < xAxisCount; xAxis++) {
		const xAxisPerTypeHeights: number[] = [];

		for (let series = 0; series < serieses; series++) {
			const v = newDatasets[series].data[xAxis];
			const vHeight = (v / newUpperBound) * (chartAreaHeight - ((yAxisStepsMax - upperBound) / yAxisStepsMax * chartAreaHeight));
			xAxisPerTypeHeights.push(vHeight);
		}

		for (let series = serieses - 1; series >= 0; series--) {
			ctx.strokeStyle = colors.dataset[series % colors.dataset.length];

			let total = 0;
			for (let i = 0; i < series; i++) {
				total += xAxisPerTypeHeights[i];
			}

			const height = xAxisPerTypeHeights[series];

			const x = chartAreaX + (perXAxisWidth * ((xAxisCount - 1) - xAxis)) + (perXAxisWidth / 2);

			const yTop = (chartAreaY + chartAreaHeight) - (total + height);
			const yBottom = (chartAreaY + chartAreaHeight) - (total);

			ctx.globalAlpha = 1 - (xAxis / xAxisCount);
			ctx.beginPath();
			ctx.lineTo(x, yTop);
			ctx.lineTo(x, yBottom);
			ctx.stroke();
		}
	}

	return canvas.toBuffer();
}

// https://stackoverflow.com/questions/326679/choosing-an-attractive-linear-scale-for-a-graphs-y-axis
// https://github.com/apexcharts/apexcharts.js/blob/master/src/modules/Scales.js
// This routine creates the Y axis values for a graph.
function niceScale(lowerBound: number, upperBound: number, ticks: number): number[] {
	if (lowerBound === 0 && upperBound === 0) return [0];

	// Calculate Min amd Max graphical labels and graph
	// increments.  The number of ticks defaults to
	// 10 which is the SUGGESTED value.  Any tick value
	// entered is used as a suggested value which is
	// adjusted to be a 'pretty' value.
	//
	// Output will be an array of the Y axis values that
	// encompass the Y values.
	const steps: number[] = [];

	// Determine Range
	const range = upperBound - lowerBound;

	let tiks = ticks + 1;
	// Adjust ticks if needed
	if (tiks < 2) {
		tiks = 2;
	} else if (tiks > 2) {
		tiks -= 2;
	}

	// Get raw step value
	const tempStep = range / tiks;

	// Calculate pretty step value
	const mag = Math.floor(Math.log10(tempStep));
	const magPow = Math.pow(10, mag);
	const magMsd = (parseInt as any)(tempStep / magPow);
	const stepSize = magMsd * magPow;

	// build Y label array.
	// Lower and upper bounds calculations
	const lb = stepSize * Math.floor(lowerBound / stepSize);
	const ub = stepSize * Math.ceil(upperBound / stepSize);
	// Build array
	let val = lb;
	while (1) {
		steps.push(val);
		val += stepSize;
		if (val > ub) {
			break;
		}
	}

	return steps;
}
