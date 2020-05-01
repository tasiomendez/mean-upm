// Get the current browser and its corresponding functions
// independently of which one is it (Firefox, Chrome)
let _browser = new Browser();

/**
 * ValidationError class
 * Error thrown when te user is not in the right location to
 * use the addon.
 */
class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
  }
}

/**
 * Listen for clicks on the buttons, and send the appropriate message to
 * the content script in the page.
 * Get the current tab and executes the corresponding function.
 */
function listenForClicks (enabled) {

  document.addEventListener("click", (e) => {
    e.target.id = e.target.id || e.target.parentNode.id;

    _browser.getCurrentTab()
      .then((tab) => {
        if (!enabled) throw new ValidationError("ActionNotAllowed");
        else return tab;
      })
      .then((tab) => {
        if (e.target.id === "calculator")
          return calculator(tab);
        else if (e.target.id === "statistics")
          return statistics(tab);
        else throw new ValidationError("ButtonNotDefined");
      })
      .catch(onError);
  });

};

/**
 * Compute the mean and show it on the page
 */
function calculator(tab) {
  return _browser.sendMessage(tab, { function: "mean" });
}

/**
 * Compute statistics and show them on a new page.
 */
function statistics(tab) {
  let windowInfo;
  return _browser.createWindow({
    type: "normal",
    state: "maximized",
    url: '/html/statistics.index.html',
  })
  .then((window) => {
    return _browser.sendMessage(tab, { function: "statistics" });
  })
  .catch(onError);
}

/**
 * Check if the user is in the right location.
 */
function checkLocation () {
  return _browser.getCurrentTab()
    .then((tab) => {
      return _browser.sendMessage(tab, { function: "check" });
    })
    .then((response) => {
      if (!response.check)
        throw new ValidationError("NotRightLocation");
      else return true;
    })
    .catch((error) => {
      document.querySelector(".error .alert").innerText =
        "Dirijase a 'Mis Datos' > 'Estudios' > 'Expediente' para calcular " +
        "la media y las estadísticas. Por último seleccione como desea ver " +
        "el expediente";
      document.querySelector(".error").style.display = "block";
    });
}

/**
 * Check if the user is in the right web page.
 */
function checkURL (tab) {
  if(/.*upm\.es\/politecnica\_virtual.*/.test(tab.url))
    return tab;
  else throw new ValidationError("WrongURL");
}

/**
 * There was an error executing the addon.
 * Display the error message on console.
 */
function onError (error) {
  if (error instanceof ValidationError)
    console.debug(`Failed to execute addon: ${error.message}`);
  else console.error(`Failed to execute addon: ${error.message}`);
}

/**
 * When the popup loads, inject a content script into the active tab,
 * and add a click handler.
 * If we couldn't inject the script, handle the error.
 */
_browser.getCurrentTab()
  .then(checkURL)
  .then(() => {
    // Enable buttons
    document.querySelectorAll(".choice.disabled").forEach((item) => {
      item.className = "choice";
    });
  })
  .then(() => {
    return _browser.executeScript({ file: "/scripts/scraper.js" });
  })
  .then(checkLocation)
  .then(listenForClicks)
  .catch(onError);

/**
 * Call the appropriate function when clicking on button.
 */
document.addEventListener("click", (e) => {
  e.target.id = e.target.id || e.target.parentNode.id;
  if (e.target.id === "webmail") {
    _browser.createTab({ url: "https://www.upm.es/webmail_alumnos/" });
  } else if (e.target.id === "polivirtual") {
    _browser.createTab({ url: "https://www.upm.es/politecnica_virtual/" });
  }
});

// Hide error message
document.querySelector(".error").style.display = "none";

// Fix CSS style in Chrome
if (_browser.type === "Chrome")
  document.querySelector(".error .alert").style.marginRight = "18px";
