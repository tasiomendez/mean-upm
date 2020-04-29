/**
 * Listen for clicks on the buttons, and send the appropriate message to
 * the content script in the page.
 */
function listenForClicks() {
  document.addEventListener("click", (e) => {
    e.target.id = e.target.id || e.target.parentNode.id;

    function calculator(tabs) {
      browser.tabs.sendMessage(tabs[0].id, {
        function: "calculator"
      });
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
    if (e.target.id === "calculator") {
      browser.tabs.query({active: true, currentWindow: true})
        .then(calculator)
        .catch(reportError);
    }
  });
};

/**
 * There was an error executing the script.
 * Display the popup's error message, and hide the normal UI.
 */
function reportExecuteScriptError(error) {
  console.error(`Failed to execute content script: ${error.message}`);
}

/**
 * When the popup loads, inject a content script into the active tab,
 * and add a click handler.
 * If we couldn't inject the script, handle the error.
 */
browser.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  if(/.*upm\.es\/politecnica\_virtual.*/.test(tabs[0].url))
    browser.tabs.executeScript({ file: "/background.js" })
      .then(listenForClicks)
      .catch(reportExecuteScriptError);
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
  }
});
