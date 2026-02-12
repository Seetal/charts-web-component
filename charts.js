class Chart extends HTMLElement {
  constructor() {
    super();
    this.data = null;
    this.chartType = this.getAttribute('data-type') || 'bar';
    this.linePointShapes = ['circle', 'square', 'diamond', 'up-triangle', 'down-triangle', 'box', 'ring'];
    this.lineTransitionPoint = 0;
  }
  
  connectedCallback() {
    const template = document.querySelector('[data-chart-template]').content.cloneNode(true);
    this.appendChild(template);
    this.chartInner = this.querySelector('[data-inner]');
    this.bars = this.querySelector('[data-bars]');
    this.lines = this.querySelector('[data-lines]');
    this.yAxis = this.querySelector('[data-y-axis]');
    this.xAxis = this.querySelector('[data-x-axis]');
    this.showPatterns = this.getAttribute('data-show-patterns') === 'true';
    this.legend = this.querySelector('[data-legend]');
    if (this.data && this.data.values) {
      this.render();
    }
  }

  get chartData() {
    return this.data;
  }

  set chartData(data) {
    if (!data || !data.values) {
      console.error('Invalid data format. Expected an object with a "values" array.');
      return;
    }
    this.data = data;
    this.lineTransitionPoint = 0;
    this.setYAxisValues();

    if (this.minValue < 0) {
      this.bars.style.setProperty('--positive-offset-padding', `${(Math.abs(this.yAxisMinValue) / this.yAxisRange) * 100}cqh`);
      this.bars.style.setProperty('--negative-offset-padding', `${(Math.abs(this.yAxisMaxValue) / this.yAxisRange) * 100}cqh`);
    } else {
      this.bars.style.removeProperty('--positive-offset-padding');
      this.bars.style.removeProperty('--negative-offset-padding');
    }
    this.render();
  }

  setYAxisValues() {
    this.maxValue = Math.max(...this.data.values.map((item) => {
      return Math.max(...item.dataSets.map(obj => Object.values(obj)[0]));
    }));
    this.minValue = Math.min(...this.data.values.map((item) => {
      return Math.min(...item.dataSets.map(obj => Object.values(obj)[0]));
    }));
    this.valueRange = this.maxValue - this.minValue;
    const size = Math.floor(Math.log10(Math.abs(this.valueRange)));
    this.magnitude = Math.pow(10, size);

    const tickMultiplierInitial = this.valueRange / this.magnitude;

    switch (true) {
      case tickMultiplierInitial <= 2:
        this.tickMultiplier = this.magnitude / 5;
        break;
      case tickMultiplierInitial <= 5:
        this.tickMultiplier = this.magnitude / 2;
        break;
      default:
        this.tickMultiplier = this.magnitude;
    }

    if (this.maxValue % this.tickMultiplier !== 0) {
      this.yAxisMaxValue = Math.ceil(this.maxValue / this.tickMultiplier) * this.tickMultiplier;
    } else {
      this.yAxisMaxValue = this.maxValue;
    }
    if (this.minValue % this.tickMultiplier !== 0) {
      this.yAxisMinValue = Math.floor(this.minValue / this.tickMultiplier) * this.tickMultiplier;
    } else {
      this.yAxisMinValue = this.minValue;
    }
    this.yAxisRange = this.yAxisMaxValue - this.yAxisMinValue;
  }

  generateBars(item) {
    const barsHtml = item.dataSets.map((dataSet, index) => {
      const value = Object.values(dataSet)[0];
      const itemClass = value >= 0 ? '' : 'chart__item--negative';
      const patternClass = this.showPatterns ? 'pattern-' + (index + 1) : '';
      const barHeight = value >=0 ? (value / this.yAxisMaxValue) * 100 : (Math.abs(value) / Math.abs(this.yAxisMinValue)) * 100;
      const barColor = this.data.colors[index];
      const title = `${Object.keys(dataSet)[0]}: ${value}`;
      return `
        <li class="chart__item ${itemClass}">
          <div class="chart__bar ${patternClass}" style="--transition-height: ${barHeight}%; --bar-color: ${barColor};" title="${title}"></div>
        </li>
      `;
    }).join('');
    return barsHtml;
  }

  generateBarGroups() {
    return this.data.values.map((item, index) => `
      <div class="chart__bar-group">
        <p class="chart__bar-group-label">
          ${item.label}
        </p>
        <ul class="chart__bar-list">
          ${this.generateBars(item)}
        </ul>
      </div>
    `).join('');
  }

  updateBarHeights() {
    const bars = this.querySelectorAll('.chart__bar');
    bars.forEach((bar) => {
      bar.classList.add('chart__bar--animate');
    });
  }

  roundToTwoDecimalPlaces(value) {
    return Math.round(value * 100) / 100;
  }

  generateLinePoints(item, itemIndex) {
    const linesHtml = item.dataSets.map((dataSet, index) => {
      const value = Object.values(dataSet)[0];
      const topPosition = (this.yAxisMaxValue - value) / this.yAxisRange * 100;
      const lineColor = this.data.colors[index];
      const nextValue = itemIndex < this.data.values.length - 1 ? Object.values(this.data.values[itemIndex + 1].dataSets[index])[0] : null;
      if (nextValue === null) {
        return `<li class="chart__line-point" style="top: ${topPosition}%; --dataset-color: ${lineColor}" title="${value}">
          <span class="chart__line-point-shape ${this.linePointShapes[index]}"></span>
        </li>`;
      }
      const containerWidth = this.lines.clientWidth;
      const containerHeight = this.lines.clientHeight;
      const nextValueDifference = this.roundToTwoDecimalPlaces(Math.abs(value - nextValue));
      const differencePercentage = this.roundToTwoDecimalPlaces((nextValueDifference / this.yAxisRange * 100)) || 0;
      const trianglePixelHeight = this.roundToTwoDecimalPlaces((differencePercentage / 100) * containerHeight);
      const trianglePixelLength = this.roundToTwoDecimalPlaces(containerWidth / (this.data.values.length - 1));
      const hypotenuse = this.roundToTwoDecimalPlaces(Math.hypot(trianglePixelHeight, trianglePixelLength));
      const lineWidth = this.roundToTwoDecimalPlaces((hypotenuse / containerWidth) * 100);
      const sinOfAngle = trianglePixelLength / hypotenuse;
      const lineAngle = this.roundToTwoDecimalPlaces((90 - (Math.asin(sinOfAngle) * (180 / Math.PI))));
      const angleValue = nextValue > value ? `-${lineAngle}deg` : `${lineAngle}deg`;
      return `<li class="chart__line-point point-${itemIndex + 1}" style="top: ${topPosition}%; --line-width: ${lineWidth}cqw; --line-angle: ${angleValue}; --dataset-color: ${lineColor}" title="${value}">
        <span class="chart__line-point-shape ${this.linePointShapes[index]}"></span>
      </li>`;
    }).join('');
    return linesHtml;
  }

  updateLineWidths() {
    this.lineTransitionPoint++;
    if (this.lineTransitionPoint < this.data.values.length) {
      const linePoints = this.querySelectorAll(`.point-${this.lineTransitionPoint}`);
      linePoints.forEach((point, index) => {
        point.classList.add('chart__line-point--transition');
        console.log(index);
        if (index === 0) {
          console.log('adding listener');
          point.addEventListener('transitionend', () => {this.updateLineWidths(); }, { once: true });
        }
      });
    }
  }

  generateLineGroups() {
    const lineGroupsHtml = this.data.values.map((item, index) => {
      const lastClass = index === this.data.values.length - 1 ? 'last' : '';
      return `
        <div class="chart__line-group ${lastClass}">
          <p class="chart__line-group-label">
            ${item.label}
          </p>
          <ul class="chart__line-list">
            ${this.generateLinePoints(item, index)}
          </ul>
        </div>
        `;
    }).join('');
    return lineGroupsHtml;
  }

  generateYAxis() {
    let lines = ``;
    let numberOfTicks = 0;
    const decimalPlaces = this.yAxisMaxValue <= 5 ? 2 : 0;
    for (let i = this.yAxisMaxValue; i >= this.yAxisMinValue; i -= this.tickMultiplier) {
      const oddEvenClass = (numberOfTicks % 2 === 0) ? 'even' : 'odd';
      const lineItem = `<div class="chart__y-axis-line ${oddEvenClass}">
        <span class="chart__y-axis-value">${(i).toFixed(decimalPlaces)}</span></div>`;
      lines += lineItem;
      numberOfTicks++;
    }
    this.yAxis.style.setProperty('--number-of-ticks', numberOfTicks);
    return lines;
  }

  generateBarLegend() {
    const legendHtml = this.data.values[0].dataSets.map((item, index) => {
      const patternClass = this.showPatterns ? 'pattern-' + (index + 1) : '';
      const barColor = this.data.colors[index];
      const label = Object.keys(item)[0];
      return `<div class="chart__legend-item">
        <span class="chart__legend-identifier ${patternClass}" style="--bar-color: ${barColor}"></span>
        <span class="chart__legend-label">${label}</span></div>`;

    }).join('');
    return legendHtml;
  }

  generateLineLegend() {
    const legendHtml = this.data.values[0].dataSets.map((item, index) => {
      const lineColor = this.data.colors[index];
      const label = Object.keys(item)[0];
      return `<div class="chart__legend-item">
        <span class="chart__legend-line-identifier ${this.linePointShapes[index]}" style="--dataset-color: ${lineColor}"></span>
        <span class="chart__legend-label">${label}</span></div>`;

    }).join('');
    return legendHtml;
  }

  render() {
    if(this.chartType === 'line') {
      this.renderLineChart();
    } else {
      this.renderBarChart();
    }
  }

  renderLineChart() {
    this.lines.classList.add('active');
    this.lines.innerHTML = this.generateLineGroups();
    this.yAxis.innerHTML = this.generateYAxis();
    if (this.getAttribute('data-show-legend') === 'true') {
      this.legend.innerHTML = this.generateLineLegend();
    }
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.updateLineWidths();
      });
    });
  }

  renderBarChart() {
    this.bars.classList.add('active');
    const numberOfBars = this.data.values.length;
    this.style.setProperty('--number-of-bar-groups', numberOfBars);
    this.bars.innerHTML = this.generateBarGroups();
    this.yAxis.innerHTML = this.generateYAxis();
    if (this.getAttribute('data-show-legend') === 'true') {
      this.legend.innerHTML = this.generateBarLegend();
    }
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.updateBarHeights();
      });
    });
  }
}

customElements.define('chart-wc', Chart);