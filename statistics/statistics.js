(function() {


  function drawHistogram (_data) {

    let data = _data.reduce((acc, item) => {
      acc.push({ grade: item.grade })
      return acc;
    }, []);

    // set the dimensions and margins of the graph
    let margin = {top: 50, right: 50, bottom: 50, left: 50},
        width = document.querySelector("#history").clientWidth - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;

    // append the svg object to the body of the page
    let svg = d3.select("#histogramchart")
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
        .call(d3.axisBottom(x));

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
        y.domain([0, d3.max(bins, function(d) { return d.length; })]);   // d3.hist has to be called before the Y axis obviously
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

  function drawColumnChart (_data) {

    let data = _data.reduce((acc, item) => {
      acc.push({
        title: item.title,
        weighted: Number(getWeightedAverage(item.data)),
        arithmetic: Number(getArithmeticAverage(item.data))
      })
      return acc;
    }, []).filter((item) => {
      return !Number.isNaN(Number(item.arithmetic));
    });

    // set the dimensions and margins of the graph
    let margin = {top: 50, right: 50, bottom: 50, left: 50},
        width = document.querySelector("#history").clientWidth - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;

    // append the svg object to the body of the page
    let svg = d3.select("#columnchart")
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
    var x = d3.scaleBand()
        .domain(groups)
        .range([0, width])
        .padding([0.2]);
    svg.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x).tickSize(0));

    // Y axis: scale and draw:
    let y = d3.scaleLinear()
        .range([height, 0]);
        y.domain([0, d3.max(data, function(d) { return d.arithmetic; })]);
    svg.append("g")
        .call(d3.axisLeft(y));

    // Another scale for subgroup position?
    var xSubgroup = d3.scaleBand()
      .domain(subgroups)
      .range([0, x.bandwidth()])
      .padding([0.05]);

    // color palette = one color per subgroup
    var color = d3.scaleOrdinal()
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

  /**
   * Extract from the data the weighted mean.
   * sum(grade * ects) / sum(ects)
   */
  function getWeightedAverage (data) {
    let _data = data.reduce((acc, item) => {
      if (!Number(item.grade)) return acc;
      acc.ects += item.ects;
      acc.acc += item.ects * item.grade;
      return acc;
    }, { ects: 0, acc: 0 });
    return (_data.acc / _data.ects).toFixed(4);
  }

  /**
   * Extract from the data the arithmetic mean.
   * sum(grades) / number of subjects
   */
  function getArithmeticAverage (data) {
    let _data = data.reduce((acc, item) => {
      if (!Number(item.grade)) return acc;
      acc.subjects++;
      acc.acc += item.grade;
      return acc;
    }, { subjects: 0, acc: 0 });
    return (_data.acc / _data.subjects).toFixed(4);
  }


  /**
   * Extract from the data the sum off all the ects that the
   * student has passed.
   */
  function getPassedCredits (data) {
    let ects = data.reduce((acc, item) => {
      return acc + item.ects;
    }, 0);
    return ects.toFixed(1);
  }

  /**
   * Get HTML template from the extension stored in path.
   */
  function getTemplate (path) {
    return fetch(browser.extension.getURL(path))
        .then(response => response.text())
        .then(data => {
          let div = document.createElement("div");
          div.innerHTML = data;
          return div;
        }).catch(error => {
          console.error(error);
        });
  }

  function getOverallTemplate (data) {
    let career = data.shift();
    let total = Array.from(data).reduce((acc, item) => {
      return acc.concat(item.data);
    }, []);
    return getTemplate('/statistics/modules/overall.html')
        .then((template) => {
          template.querySelector(".career-name").innerText = "Titulación en " + career;

          for (let i = 0; i < data.length; i++) {
            let $tr = document.createElement("tr");
            let $th = document.createElement("th");
            $th.setAttribute("scope", "row");
            $th.innerText = data[i].title;
            let $ma = document.createElement("td");
            $ma.className = "center";
            $ma.innerText = getArithmeticAverage(data[i].data);
            let $mp = document.createElement("td");
            $mp.className = "center";
            $mp.innerText = getWeightedAverage(data[i].data);
            let $cs = document.createElement("td");
            $cs.className = "center";
            $cs.innerText = getPassedCredits(data[i].data);

            $tr.appendChild($th).appendChild($ma).appendChild($mp).appendChild($cs);

            template.querySelector(".overall-average tbody").appendChild($tr);
          }

          let $tr = document.createElement("tr");
          $tr.className = "total";
          let $th = document.createElement("th");
          $th.setAttribute("scope", "row");
          $th.innerText = "Total";
          let $ma = document.createElement("td");
          $ma.className = "center";
          $ma.innerText = getArithmeticAverage(total);
          let $mp = document.createElement("td");
          $mp.className = "center";
          $mp.innerText = getWeightedAverage(total);
          let $cs = document.createElement("td");
          $cs.className = "center";
          $cs.innerText = getPassedCredits(total);

          $tr.appendChild($th).appendChild($ma).appendChild($mp).appendChild($cs);

          template.querySelector(".overall-average tbody").appendChild($tr);

          return template;
        }).then((template) => {
          document.querySelector(".module-wrapper").innerHTML = template.innerHTML;
        }).then((template) => {

          drawHistogram(total);
          drawColumnChart(data);

        });
  }

  browser.runtime.onMessage.addListener((message) => {
    getOverallTemplate(message.data);
  });

})();
