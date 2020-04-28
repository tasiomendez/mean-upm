(function() {

  /**
   *
   */
  function getDataFromRow (row, subjectCol, ectsCol) {
    let subject = row.children[subjectCol].innerText;
    let mark = Number(row.lastElementChild.innerText.replace(",",".").match(/[\d[\.|\,]+/));
    let ects = Number(row.children[ectsCol].innerText.replace(",",".").match(/[\d[\.|\,]+/));
    return [subject, mark, ects];
  }

  /**
   *
   */
  function getDataFromTable (table) {
    let cols = Array.from(table.querySelectorAll("thead tr th")).filter((item, index) => {
      return (item.innerText === "Cred." || item.innerText === "Asignatura");
    }, []);
    return Array.from(table.querySelectorAll("tbody tr")).map((row) => {
      let rdata = getDataFromRow(row,
        Array.prototype.indexOf.call(cols[0].parentNode.children, cols[0]),
        Array.prototype.indexOf.call(cols[1].parentNode.children, cols[1])
      );
      return { subject: rdata[0], mark: rdata[1], ects: rdata[2] }
    });
  }

  /**
   *
   */
  function getMedataFromTable (table) {
    return table.querySelector("caption").innerText;
  }

  /**
   *
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

  /**
   *
   */
  function getWeightedAverage (data) {
    let acc = data.reduce((acc, item) => {
      if (item.mark >= 5.0) return acc + (item.mark * item.ects);
      else return acc;
    }, 0);
    let ects = data.reduce((acc, item) => {
      if (item.mark >= 5.0) return acc + item.ects;
      else return acc;
    }, 0);
    return (acc / ects).toFixed(4);
  }

  /**
   *
   */
  function getArithmeticAverage (data) {
    let acc = data.reduce((acc, item) => {
      if (item.mark >= 5.0) return acc + item.mark;
      else return acc;
    }, 0);
    let subjects = data.reduce((acc, item) => {
      if (item.mark >= 5.0) return acc + 1;
      else return acc;
    }, 0);
    return (acc / subjects).toFixed(4);
  }


  /**
   *
   */
  function getPassedCredits (data) {
    let ects = data.reduce((acc, item) => {
      if (item.mark >= 5.0) return acc + item.ects;
      else return acc;
    }, 0);
    return ects.toFixed(1);
  }

  /**
   * Append a new table to the DOM with the two different averages: the
   * weighted and the arithmetic average.
   */
  function appender () {
    let data = Array.from(document.querySelectorAll("table#tabla_expediente[data-role=table]")).reduce((acc, item) => {
      return acc.concat(getDataFromTable(item));
    }, []);
    getTemplate('/average.html').then((response) => {
      let container = document.querySelectorAll("#contenido_seccion")[2];
      let child = container.firstElementChild;

      response.querySelector("table#average td#weighted").innerText = getWeightedAverage(data);
      response.querySelector("table#average td#arithmetic").innerText = getArithmeticAverage(data);
      response.querySelector("table#average td#credits").innerText = getPassedCredits(data);

      if (container.querySelector("table#average"))
        container.children[1].innerHTML = response.innerHTML;
      else child.parentNode.insertBefore(response, child.nextSibling);
    });
  }

  /**
   * Listen for messages from the background script.
   */
  browser.runtime.onMessage.addListener((message) => {
    if (message.function === "calculator")
      appender();
    else if (message.command === "reset")
      removeExistingBeasts();
  });

})();
