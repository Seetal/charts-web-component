const barChart = document.getElementById('barChart');
const lineChart = document.getElementById('lineChart');

barChart.chartData = {
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
lineChart.chartData = {
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
    { label: 'Thursday',
      dataSets: [ {a: 0.34}, {b: 0.27}, {c: 0.42}, {d: -0.41}, {e: 0.87}, {f: 0.12} ]
    },
  ],
  colors: ['#25C7D9', '#F2D338', '#F2622E', '#03A678', '#8E44AD', '#F27457']
};

const updateButton = document.getElementById('updateButton');
updateButton.addEventListener('click', () => {
  const newData = Array.from({ length: 5 }, () => {
    return Array.from({ length: 4 }, () => Math.floor(Math.random() * 50));
  });
  barChart.chartData = {
    values: newData.map((value, index) => ({
      label: String.fromCharCode(85 + index),
      dataSets: value.map((val, i) => ({ [String.fromCharCode(97 + i)]: val }))
    })),
    colors: ['#25C7D9', '#F2D338', '#F2622E', '#03A678', '#8E44AD']
  };
 lineChart.chartData = {
    values: newData.map((value, index) => ({
      label: String.fromCharCode(85 + index),
      dataSets: value.map((val, i) => ({ [String.fromCharCode(97 + i)]: val }))
    })),
    colors: ['#25C7D9', '#F2D338', '#F2622E', '#03A678', '#8E44AD']
  };
});