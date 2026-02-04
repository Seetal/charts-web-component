function RoundedMax(a) {
    const mx = Math.max(...a);
    if (mx == 0) {return 0};
    const size = Math.floor(Math.log10(Math.abs(mx)));
    const magnitude = Math.pow(10, size);
    const yMax = Math.ceil(mx / magnitude) * magnitude;
    return yMax;
}

function RoundedMin(a) {
    const mn = Math.min(...a);
    if (mn == 0) {return 0};
    const size = Math.floor(Math.log10(Math.abs(mn)));
    const magnitude = Math.pow(10, size);
    const yMin = Math.floor(mn / magnitude) * magnitude;
    return yMin;
}

const array = [20, 45, 43, 56, 2, 98];
const roundedMax = RoundedMax(array);
console.log('Rounded Max:', roundedMax); // Output: Rounded Max: 100

const roundedMin = RoundedMin(array);
console.log('Rounded Min:', roundedMin); // Output: Rounded Min: 0

class BarChart extends HTMLElement {
  constructor() {
    super();
    this.data = null;
    this.maxValue = null;
    this.yAxisMaxValue = null;
    this.afterDecimal = null;
  }
  
  connectedCallback() {
    const template = document.querySelector('[data-bar-chart-template]').content.cloneNode(true);
    this.appendChild(template);
    this.chartInner = this.querySelector('[data-inner]');
    this.bars = this.querySelector('[data-bars]');
    this.yAxis = this.querySelector('[data-y-axis]');
    this.tickMarks = this.getAttribute('data-tick-marks');
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
    this.render();
  }

  
  // setYAxisAbove1() {
  //   const roundedMax = Math.ceil(this.maxValue);
  //   const numOfDigits = roundedMax.toString().length;
  //   const firstDigit = parseInt(roundedMax.toString()[0], 10);
  //   const newFirstDigit = firstDigit === 1 && roundedMax.toString()[1] === '0' ? 11 : firstDigit + 1;
  //   const updatedNumOfDigits = newFirstDigit === 10 ? numOfDigits + 1 : numOfDigits;
  //   const scaleString = newFirstDigit.toString().padEnd(updatedNumOfDigits, '0');
  //   this.yAxisMaxValue = parseInt(scaleString, 10);
  // }

  // setYAxisBelow1() {
  //   const afterDecimal = String(this.maxValue).split('.')[1];
  //   let zerosAfterDecimal = 0;
  //   let significantDigit = null;
  //   for (const char of afterDecimal) {
  //     if (char === '0') {
  //       zerosAfterDecimal += 1;
  //     } else {
  //       significantDigit = char;
  //       break;
  //     }
  //   }
  //   this.afterDecimal = zerosAfterDecimal + 1;
  //   const newSignificantDigit = parseInt(significantDigit, 10) + 1;
  //   const updatedZerosAfterDecimal = newSignificantDigit > 9 ? zerosAfterDecimal - 1 : zerosAfterDecimal;
  //   this.yAxisMaxValue = parseFloat(`0.${'0'.repeat(updatedZerosAfterDecimal)}${newSignificantDigit}`);
  // }

  // We want the Y-axis max value to be a rounded number just above the actual max value
  setYAxisMaxValue() {
    const size = Math.floor(Math.log10(Math.abs(this.maxValue)));
    const magnitude = Math.pow(10, size);
    const yMax = Math.ceil(this.maxValue / magnitude) * magnitude;
    this.yAxisMaxValue = yMax;
  }
  // setYAxisMaxValue() {
  //   if (this.maxValue > 1) {
  //     this.setYAxisAbove1();
  //   } else {
  //     this.setYAxisBelow1();
  //   }
  // }

  generateBars() {
    return this.data.values.map((item, index) => `
      <div class="chart__bar-group" id="bar-${index}">
        ${item.dataSets.map((dataSet, index) => `
          <div class="chart__bar ${this.showPatterns ? 'pattern-' + (index + 1) : ''}" style="--transition-height: ${(Object.values(dataSet)[0] / this.yAxisMaxValue) * 100}%; --bar-color: ${this.data.colors[index]};" title="${Object.keys(dataSet)[0]}:${Object.values(dataSet)[0]}"></div>
        `).join('')}
        <span class="chart__bar-label">${item.label}</span>
      </div>
    `).join('');
  }

  updateBarHeights() {
    const bars = this.querySelectorAll('.chart__bar');
    bars.forEach((bar) => {
      bar.classList.add('chart__bar--animate');
    });
  }

  generateYAxis() {
    let lines = ``;
    const numberOfTicks = Number(this.tickMarks) || 10;
    const decimalPlaces = this.yAxisMaxValue <= 5 ? 2 : 0;
    for (let i = numberOfTicks; i > 0; i--) {
      const lineItem = `<div class="chart__y-axis-line">
        <span class="chart__y-axis-value">${(this.yAxisMaxValue / numberOfTicks * i).toFixed(decimalPlaces)}</span></div>`;
      lines += lineItem;
      if (i == 1) {
        lines += `<div class="chart__y-axis-zero">
          <span class="chart__y-axis-zero-value">0</span></div>`;
      }
    }
    this.yAxis.style.setProperty('--number-of-ticks', numberOfTicks);
    return lines;
  }

  generateLegend() {
     console.log('Generating legend');
     return this.data.values[0].dataSets.map((item, index) => `<div class="chart__legend-item">
      <span class="chart__legend-identifier ${this.showPatterns ? 'pattern-' + (index + 1) : ''}" style="--bar-color: ${this.data.colors[index]}"></span>
      <span class="chart__legend-label">${Object.keys(item)[0]}</span></div>`).join('');
  }

  render() {
    this.maxValue = Math.max(...this.data.values.map((item) => {
      return Math.max(...item.dataSets.map(obj => Object.values(obj)));
    }));
    this.setYAxisMaxValue();
    const numberOfBars = this.data.values.length;
    this.style.setProperty('--number-of-bars', numberOfBars);
    this.bars.innerHTML = this.generateBars();
    this.yAxis.innerHTML = this.generateYAxis();
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
      dataSets: [ {a: 0.1}, {b: 0.78}, {c: 0.45}, {d: 0.50}, {e: 0.60}, {f: 0.9} ]
    },
    { label: 'Tuesday',
      dataSets: [ {a: 0.56}, {b: 0.23}, {c: 0.89}, {d: 0.40}, {e: 0.70}, {f: 0.80} ]
    },
    { label: 'Wednesday',
      dataSets: [ {a: 0.74}, {b: 0.97}, {c: 0.65}, {d: 0.50}, {e: 0.80}, {f: 0.86} ]
    },
  ],
  colors: ['#25C7D9', '#F2D338', '#F2622E', '#03A678', '#8E44AD', '#F27457']
};
const updateButton = document.getElementById('updateButton');
updateButton.addEventListener('click', () => {
  const newData = Array.from({ length: 5 }, () => {
    return Array.from({ length: 4 }, () => Math.floor(Math.random() * 100));
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