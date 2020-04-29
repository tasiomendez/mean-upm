(function() {

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

  function getOverallTemplate (data, career) {
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

  function setSidebarMenu(data, career) {
    let menu = document.querySelector("ul.pmd-sidebar-nav");
    while (menu.childNodes.length > 2)
        menu.removeChild( menu.lastChild );

    for (let i = 0; i < data.length; i++) {
      if (!data[i].title) continue;

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
      $span.innerText = data[i].title;

      $div.appendChild($img);
      $div.appendChild($span);
      $li.appendChild($div);

      menu.appendChild($li);

      getTemplate('/statistics/modules/year.html')
          .then((template) => {
            template.querySelector(".career-name").innerText = "Titulación en " + career;

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
            document.querySelector(".main-content").appendChild($pane);

            return template;

          }).then((template) => {

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

            $tr.appendChild($th);
            $tr.appendChild($ma);
            $tr.appendChild($mp);
            $tr.appendChild($cs);

            template.querySelector(".overall-average tbody").appendChild($tr);
          });
    }
  }

  browser.runtime.onMessage.addListener((message) => {
    let career = message.data.shift();
    document.querySelectorAll(".hidden").forEach((item) => {
      item.style.display = "block";
    });
    document.querySelector(".spinner-wrapper").className += " hidden-spinner";
    setSidebarMenu(message.data, career);
    getOverallTemplate(message.data, career);
  });

})();
