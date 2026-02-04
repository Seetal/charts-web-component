class LineChart extends HTMLElement {
  constructor() {
    super();
  }
  connectedCallback() {
    console.log('LineChart connected');
  }
}

customElements.define('line-chart', LineChart);