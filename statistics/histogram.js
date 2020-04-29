(function () {

  /**
   * Draw an histogram on the element id provided with the data
   * passed as argument.
   */
  function drawHistogram (element, _data) {

    let data = _data.reduce((acc, item) => {
      acc.push({ grade: item.grade })
      return acc;
    }, []);

    // set the dimensions and margins of the graph
    let margin = {top: 50, right: 50, bottom: 50, left: 50},
        width = document.querySelector("#history").clientWidth - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;

    // append the svg object to the body of the page
    let svg = d3.select(element)
      .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform",
              "translate(" + margin.left + "," + margin.top + ")");

    // X axis: scale and draw:
    let x = d3.scaleLinear()
        .domain([5, 10])
        .range([0, width]);
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x).tickPadding(10));

    // set the parameters for the histogram
    let histogram = d3.histogram()
        .value(function(d) { return d.grade; })   // I need to give the vector of value
        .domain(x.domain())  // then the domain of the graphic
        .thresholds(x.ticks(10)); // then the numbers of bins

    // And apply this function to data to get the bins
    let bins = histogram(data);

    // Y axis: scale and draw:
    let y = d3.scaleLinear()
        .range([height, 0]);
        y.domain([0, d3.max(bins, function(d) { return d.length; })]);
    svg.append("g")
        .call(d3.axisLeft(y));

    // append the bar rectangles to the svg element
    svg.selectAll("rect")
        .data(bins)
        .enter()
        .append("rect")
          .attr("x", 1)
          .attr("transform", function(d) { return "translate(" + x(d.x0) + "," + y(d.length) + ")"; })
          .attr("width", function(d) { return x(d.x1) - x(d.x0) -1 ; })
          .attr("height", function(d) { return height - y(d.length); })
          .style("fill", "#69b3a2");
  }

})();
