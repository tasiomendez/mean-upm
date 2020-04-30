/**
 * Listen for clicks on the buttons, and send the appropriate message to
 * the content script in the page.
 */
function listenForClicks (enabled) {

  document.addEventListener("click", (e) => {
    e.target.id = e.target.id || e.target.parentNode.id;

    /**
     * Compute the mean and show it on the page
     */
    function calculator(tabs) {
      browser.tabs.sendMessage(tabs[0].id, {
        function: "mean"
      });
    }

    /**
     * Compute statistics and show them on a new page.
     */
    function statistics(tabs) {
      let windowInfo;
      browser.windows.create({
        type: "normal",
        state: "maximized",
        url: '/statistics/index.html',
        titlePreface: "Mostrar estadísticas",
      }).then((window) => {
        return browser.tabs.sendMessage(tabs[0].id, {
          function: "statistics"
        });
      }).catch(reportError);

    }

    /**
     * Just log the error to the console.
     */
    function reportError(error) {
      console.error(error);
      console.error(`An error ocurred: ${error}`);
    }

    /**
     * Get the active tab,
     * then call the appropriate function.
     */
    if (e.target.id === "calculator" && enabled) {
      browser.tabs.query({ active: true, currentWindow: true })
        .then(calculator)
        .catch(reportError);
    } else if (e.target.id === "statistics" && enabled) {
      browser.tabs.query({ active: true, currentWindow: true })
        .then(statistics)
        .catch(reportError);
    }
  });

};

/**
 * Check if the user is in the right location.
 */
function checkLocation () {
  return browser.tabs.query({ active: true, currentWindow: true })
    .then((tabs) => {
      return browser.tabs.sendMessage(tabs[0].id, {
        function: "check"
      });
    }).then((response) => {
      if (!response.check)
        throw new Error("NotRightLocation");
      else return response;
    }).catch((error) => {
      document.querySelector(".error .alert").innerText =
        "Dirijase a 'Mis Datos' > 'Estudios' > 'Expediente' para calcular " +
        "la media y las estadísticas. Por último seleccione como desea ver " +
        "el expediente";
      document.querySelector(".error").style.display = "block";
    });
}

/**
 * There was an error executing the script.
 * Display the popup's error message, and hide the normal UI.
 */
function reportExecuteScriptError (error) {
  console.error(`Failed to execute content script: ${error.message}`);
}

/**
 * When the popup loads, inject a content script into the active tab,
 * and add a click handler.
 * If we couldn't inject the script, handle the error.
 */
browser.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  if(/.*upm\.es\/politecnica\_virtual.*/.test(tabs[0].url)) {

    // Enable buttons
    document.querySelectorAll(".choice.disabled").forEach((item) => {
      item.className = "choice";
    });

    browser.tabs.executeScript({ file: "/scrapper.js" })
      .then(checkLocation)
      .then(listenForClicks)
      .catch(reportExecuteScriptError);

  }
});

/**
 * Call the appropriate function when clicking on button.
 */
document.addEventListener("click", (e) => {
  e.target.id = e.target.id || e.target.parentNode.id;
  if (e.target.id === "webmail") {
    browser.tabs.create({ url: "https://www.upm.es/webmail_alumnos/" });
  } else if (e.target.id === "polivirtual") {
    browser.tabs.create({ url: "https://www.upm.es/politecnica_virtual/" });
  } else if (e.target.id === "help") {
    browser.tabs.create({ url: "https://addons.mozilla.org/es/firefox/addon/calculadora-nota-media-upm/" });
  }
});

// Hide error message
document.querySelector(".error").style.display = "none";
