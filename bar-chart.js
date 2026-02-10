class BarChart extends HTMLElement {
  constructor() {
    super();
    this.data = null;
  }
  
  connectedCallback() {
    const template = document.querySelector('[data-bar-chart-template]').content.cloneNode(true);
    this.appendChild(template);
    this.chartInner = this.querySelector('[data-inner]');
    this.bars = this.querySelector('[data-bars]');
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
      <ul class="chart__bar-group" id="bar-${index}">
        ${this.generateBars(item)}
      </ul>
    `).join('');
  }

  updateBarHeights() {
    const bars = this.querySelectorAll('.chart__bar');
    bars.forEach((bar) => {
      bar.classList.add('chart__bar--animate');
    });
  }

  generateXAxis() {
    return this.data.values.map((item) => `
      <div class="chart__y-axis-label">
        ${item.label}
      </div>
    `).join('');
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

  generateLegend() {
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

  render() {
    const numberOfBars = this.data.values.length;
    this.style.setProperty('--number-of-bar-groups', numberOfBars);
    this.bars.innerHTML = this.generateBarGroups();
    this.yAxis.innerHTML = this.generateYAxis();
    this.xAxis.innerHTML = this.generateXAxis();
    if (this.getAttribute('data-show-legend') === 'true') {
      this.legend.innerHTML = this.generateLegend();
    }
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.updateBarHeights();
      });
    });
  }
}

customElements.define('bar-chart', BarChart);

const chart = document.getElementById('barChart');
chart.chartData = {
  values: [
    { label: 'Monday',
      dataSets: [ {a: 0.2}, {b: -0.1}, {c: -0.3}, {d: 0.4}, {e: 0.60}, {f: 0.9} ]
    },
    { label: 'Tuesday',
      dataSets: [ {a: 0.56}, {b: 0.23}, {c: 0.89}, {d: 0.40}, {e: 0.70}, {f: 0.80} ]
    },
    { label: 'Wednesday',
      dataSets: [ {a: 0.74}, {b: 0.97}, {c: 0.65}, {d: -0.48}, {e: 0.80}, {f: 0.86} ]
    },
  ],
  colors: ['#25C7D9', '#F2D338', '#F2622E', '#03A678', '#8E44AD', '#F27457']
};
const updateButton = document.getElementById('updateButton');
updateButton.addEventListener('click', () => {
  const newData = Array.from({ length: 5 }, () => {
    return Array.from({ length: 4 }, () => Math.floor(Math.random() * 50));
  });
  chart.chartData = {
    values: newData.map((value, index) => ({
      label: String.fromCharCode(85 + index),
      dataSets: value.map((val, i) => ({ [String.fromCharCode(97 + i)]: val }))
    })),
    colors: ['#25C7D9', '#F2D338', '#F2622E', '#03A678', '#8E44AD']
  };
});

const addNewButton = document.getElementById('addNew');
addNewButton.addEventListener('click', () => {
  const newChart = document.createElement('bar-chart');
  newChart.setAttribute('class', 'bar-chart');
  newChart.setAttribute('data-tick-marks', '5');
  newChart.data = {
    values: [
      { label: 'A', dataSets: 20 },
      { label: 'B', dataSets: 40 },
      { label: 'C', dataSets: 60 },
      { label: 'D', dataSets: 80 },
    ]
  };
  document.querySelector('.wrapper').appendChild(newChart);
});