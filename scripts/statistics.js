/**
 * Statistics Webpage Builder
 *
 * Creates a review page with different statistics which have been
 * obtained from the transcript of records.
 *
 * Author: Tasio Méndez (tasiomendez)
 * URL: https://github.com/tasiomendez/
 * Version: 1.0
 */
;(function(undefined) {

  // Get the browser object
  const _browser = (typeof browser !== 'undefined') ? browser : chrome;

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
    return fetch(_browser.extension.getURL(path))
        .then(response => response.text())
        .then(data => {
          let $div = document.createElement("div");
          $div.innerHTML = data;
          return $div;
        }).catch(error => {
          console.error(error);
        });
  }

  /**
   * Append a new row to the table given with the data passed as parameter.
   * The title of the row is passed as parameter and it could be passed
   * an extra class to the <tr> element.
   */
  function fillAverageTableRow (table, data, title, className) {

    let $tr = document.createElement("tr");
    if (className)
      $tr.className = className;
    let $th = document.createElement("th");
    $th.setAttribute("scope", "row");
    $th.innerText = title;
    let $ma = document.createElement("td");
    $ma.className = "center";
    $ma.innerText = getArithmeticAverage(data);
    let $mp = document.createElement("td");
    $mp.className = "center";
    $mp.innerText = getWeightedAverage(data);
    let $cs = document.createElement("td");
    $cs.className = "center";
    $cs.innerText = getPassedCredits(data);

    $tr.appendChild($th);
    $tr.appendChild($ma);
    $tr.appendChild($mp);
    $tr.appendChild($cs);

    table.querySelector("tbody").appendChild($tr);
    return table;
  }

  /**
   * Get the overall template and fill it.
   */
  function getOverallTemplate (data, career) {
    let total = Array.from(data).reduce((acc, item) => {
      return acc.concat(item.data);
    }, []);
    return getTemplate('/html/template.overall.html')
        .then((template) => {
          template.querySelector(".career-name").innerText = "Titulación en " + career;
          let table = template.querySelector(".overall-average");

          for (let i = 0; i < data.length; i++) {
            fillAverageTableRow(table, data[i].data, data[i].title);
          }

          fillAverageTableRow(table, total, "Total", "total");
          return template;

        }).then((template) => {
          document.querySelector(".module-wrapper").innerHTML = template.innerHTML;

        }).then((template) => {
          let width = document.querySelector("#columnchart").clientWidth;

          drawHistogram("#histogramchart", total, width);

          // Fit data to draw the column chart
          let _data = data.reduce((acc, item) => {
            acc.push({
              title: item.title,
              weighted: Number(getWeightedAverage(item.data)),
              arithmetic: Number(getArithmeticAverage(item.data))
            })
            return acc;
          }, []).filter((item) => {
            return !Number.isNaN(Number(item.arithmetic));
          });

          drawColumnChart('#columnchart', _data, width);
        });
  }

  /**
   * Append a new menu entry on the sidebar menu.
   */
  function buildNewMenuItem (title, i) {
    let $li = document.createElement("li");
    $li.className = "nav-item";

    let $div = document.createElement("div");
    $div.className = "nav-link";
    $div.setAttribute("id", "tab" + i + "-tab");
    $div.setAttribute("data-toggle", "tab");
    $div.setAttribute("href", "#tab" + i);
    $div.setAttribute("role", "tab");
    $div.setAttribute("aria-controls", "tab" + i);
    $div.setAttribute("aria-selected", "false");

    let $img = document.createElement("img");
    $img.setAttribute("src", "/icons/calendar@black.svg");
    $img.setAttribute("alt", "icon");

    let $span = document.createElement("span");
    $span.className = "media-body";
    $span.innerText = title;

    $div.appendChild($img);
    $div.appendChild($span);
    $li.appendChild($div);
    return $li;
  }

  /**
   * Build a new pane which is connected to a menu item.
   */
  function buildNewPane (template, i) {
    // Tab panels
    let $pane = document.createElement("div");
    $pane.className = "tab-pane fade";
    $pane.setAttribute("id", "tab" + i);
    $pane.setAttribute("role", "tabpanel");
    $pane.setAttribute("aria-labelledby", "tab" + i + "-tab");

    let $wrapper = document.createElement("div");
    $wrapper.className = "col-sm-10 offset-sm-1 module-wrapper";

    $wrapper.appendChild(template);
    $pane.appendChild($wrapper);
    return $pane;
  }

  /**
   * Fill the sidebar menu and creates the necessary
   * panes connected to them;
   */
  function setSidebarMenu (data, career) {
    let menu = document.querySelector("ul.pmd-sidebar-nav");
    while (menu.childNodes.length > 2)
        menu.removeChild( menu.lastChild );

    for (let i = 0; i < data.length; i++) {
      if (!data[i].title) continue;

      let $li = buildNewMenuItem(data[i].title, i);
      menu.appendChild($li);

      getTemplate('/html/template.year.html')
          .then((template) => {
            template.querySelector(".career-name").innerText = "Titulación en " + career;

            let $pane = buildNewPane(template, i);
            document.querySelector(".main-content").appendChild($pane);

            let table = template.querySelector(".overall-average");
            fillAverageTableRow(table, data[i].data, data[i].title);

            template.querySelector("#histogramchart").setAttribute("id", "histogramchart" + i);
          });

      // Draw histogram every time menu changes
      $('div[data-toggle="tab"]').on('shown.bs.tab', function (e) {
        document.querySelector("#histogramchart" + i).innerHTML = "";
        let width = document.querySelector("#histogramchart" + i).clientWidth;
        drawHistogram("#histogramchart" + i, data[i].data, width);
      });
    }
  }

  /**
   * Add a listener to receive messages. The message receive contains
   * the data which is shown.
   */
  _browser.runtime.onMessage.addListener((message) => {
    if (!message.data) return;
    let career = message.data.shift();
    document.querySelectorAll(".hidden").forEach((item) => {
      item.style.display = "block";
    });
    document.querySelector(".spinner-wrapper").className += " hidden-spinner";
    setSidebarMenu(message.data, career);
    getOverallTemplate(message.data, career);
  });

})();
