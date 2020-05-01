/**
 * Draw a column chart on the element id provided with the data
 * passed as argument.
 */
function drawColumnChart (element, data, _width) {

  // set the dimensions and margins of the graph
  let margin = {top: 50, right: 50, bottom: 50, left: 50},
      width = _width - margin.left - margin.right,
      height = 500 - margin.top - margin.bottom;

  // append the svg object to the body of the page
  let svg = d3.select(element)
    .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");

  // List of subgroups = header of the csv files = soil condition here
  let subgroups = ["weighted", "arithmetic"];

  // List of groups = species here = value of the first column called group -> I show them on the X axis
  let groups = d3.map(data, function(d) { return d.title }).keys();

  // X axis: scale and draw:
  let x = d3.scaleBand()
      .domain(groups)
      .range([0, width])
      .padding([0.2]);
  svg.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x).tickSize(0).tickPadding(10));

  // Y axis: scale and draw:
  let y = d3.scaleLinear()
      .domain([0, 10])
      .range([height, 0]);
  svg.append("g")
      .call(d3.axisLeft(y));

  // Another scale for subgroup position?
  let xSubgroup = d3.scaleBand()
    .domain(subgroups)
    .range([0, x.bandwidth()])
    .padding([0.05]);

  // color palette = one color per subgroup
  let color = d3.scaleOrdinal()
    .domain(subgroups)
    .range(['#69b3a2','#377eb8']);

  // append the bar rectangles to the svg element
  svg.append("g")
    .selectAll("g")
    // Enter in data = loop group per group
    .data(data)
    .enter()
    .append("g")
      .attr("transform", function(d) { return "translate(" + x(d.title) + ",0)"; })
    .selectAll("rect")
    .data(function(d) { return subgroups.map(function(key) { return {key: key, value: d[key]}; }); })
    .enter().append("rect")
      .attr("x", function(d) { return xSubgroup(d.key); })
      .attr("y", function(d) { return y(d.value); })
      .attr("width", xSubgroup.bandwidth())
      .attr("height", function(d) { return height - y(d.value); })
      .attr("fill", function(d) { return color(d.key); });
}
