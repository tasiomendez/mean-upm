/**
 * PV Scraper
 *
 * Scrapper of the PV website to get the information of the different
 * tables of the transcript of records.
 *
 * Author: Tasio Méndez (tasiomendez)
 * URL: https://github.com/tasiomendez/
 * Version: 1.0
 */
;(function(undefined) {

  // Get the browser object
  const _browser = (typeof browser !== 'undefined') ? browser : chrome;

  const RECOGNITION = "R. Cred."

  // Translate column names
  const translation = {
    "Asignatura":  "subject",
    "Año":         "year",
    "Calif.":      "grade",
    "Cred.":       "ects",
    "Conv.":       "session",
    "Curso":       "course",
    "Duración":    "duration",
    "Tipo":        "type"
  };

  /**
   * Extract data from the field given. It can be converted to a Number
   * in case it is needed.
   */
  function getDataFromField (str, toInt) {
    let number = Number(str.replace(",",".").match(/[\d[\.|\,]+/));
    if (number && !toInt) return number;
    else return str;
  }

  /**
   * Extract data from the row given.
   */
  function getDataFromRow (row, cols) {
    let data = {};
    for (let i = 0; i < cols.length; i++)
      data[cols[i]] = getDataFromField(row.children[i].innerText, cols[i] === "subject");
    return data;
  }

  /**
   * Extract data from the table given.
   */
  function getDataFromTable (table) {
    let cols = getMedataFromTable(table);
    return Array.from(table.querySelectorAll("tbody tr")).map((row) => {
      return getDataFromRow(row, cols);
    }).filter((item) => {
      return item.grade >= 5.0 || item.grade === RECOGNITION;
    });
  }

  /**
   * Get the metadata from the table, i.e. the name of the columns and
   * translate them to be used in other functions.
   */
  function getMedataFromTable (table) {
    return Array.from(table.querySelectorAll("thead tr th")).map((item) => {
      return translation[item.innerText];
    });
  }

  /**
   * Get the title of the table.
   */
  function getTitleFromTable (table) {
    return table.querySelector("caption").innerText.replace(" académico", "");
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
        })
        .catch(error => {
          console.error(error);
        });
  }

  /**
   * Builds the average table and is filled with the corresponding data.
   */
  function getAverageTable (data) {
    return getTemplate('/html/template.average.html')
      .then((response) => {
        response.querySelector("table#average td#weighted").innerText = getWeightedAverage(data);
        response.querySelector("table#average td#arithmetic").innerText = getArithmeticAverage(data);
        response.querySelector("table#average td#credits").innerText = getPassedCredits(data);
        return response;
      })
      .catch((error) => {
        console.error(error);
      });
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
   * Get data from the page.
   */
  function getDataFromPage () {
    return Array.from(document.querySelectorAll("table#tabla_expediente[data-role=table]")).reduce((acc, item) => {
      return acc.concat(getDataFromTable(item));
    }, []);
  }

  /**
   * Append a new table to the DOM with the two different averages: the
   * weighted and the arithmetic average.
   */
  function appender () {
    let data = getDataFromPage();
    return getAverageTable(data).then((table) => {
      let container = document.querySelectorAll("#contenido_seccion")[2];
      let child = container.firstElementChild;

      // Override if exists
      if (container.querySelector("table#average"))
        container.children[1].innerHTML = table.innerHTML;
      else child.parentNode.insertBefore(table, child.nextSibling);

      // Make table visible
      setTimeout(() => {
        document.querySelector("table#average[data-role=average]").style.backgroundColor = "white";
      }, 200);
    });
  }

  /**
   * Get the career name of the student;
   */
  function getCareerName() {
    if (document.querySelector("textarea"))
      return document.querySelector("textarea").value.split('-')[0].trim();
  }

  /**
   * Structure the data of the whole page in an Array.
   * The first position of the array is the name of the career, and the
   * remainder objects are each of the tables.
   */
  function getStructuredData() {
    let data = [];
    data.push((getCareerName()) ? getCareerName() : "");
    document.querySelectorAll("table#tabla_expediente[data-role=table]").forEach((item) => {
      data.push({
        title: getTitleFromTable(item),
        data: getDataFromTable(item),
      });
    });
    if (data.length > 1)
      return data;
  }

  /**
   * Listen for messages from the background script.
   */
  _browser.runtime.onMessage.addListener((message, sender, sendResponse) => {

    let check = Array.from(document.querySelectorAll("li.activo")).reduce((acc, item) => {
      return acc || item.innerText.includes("Expediente");
    }, false);

    if (message.function === "check")
      sendResponse({ check: check })

    else if (message.function === "mean" && getStructuredData())
      appender();

    else if (message.function === "statistics")
      setTimeout(() => {
        _browser.runtime.sendMessage({ data: getStructuredData() });
      }, 1000)
  });

})();
