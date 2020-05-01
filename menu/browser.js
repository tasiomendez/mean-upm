/**
 * Browser Definition
 *
 * It creates an object with the main functions from the browser to create
 * an addon. It does not matter if it is Chrome or Firefox, since it will
 * always translate the corresponding functions and returns a Promise.
 *
 * Author: Tasio Méndez (tasiomendez)
 * URL: https://github.com/tasiomendez/
 * Version: 1.0
 */
class Browser {

  constructor() {
    this.browser = (typeof browser !== 'undefined') ? browser : chrome;
  }

  /**
   * Get the current tab openen. Return a promise with the current tab as
   * the parameter.
   */
  getCurrentTab () {
    return new Promise( (resolve, reject) => {
      this.browser.tabs.query({ active: true, currentWindow: true }, (tabs, error) => {
        if (error) reject(error);
        else resolve(tabs[0]);
      });
    });
  }

  /**
   * Execute the given script. Return a promise if the script
   * is executed successfully.
   */
  executeScript (options) {
    return new Promise( (resolve, reject) => {
      try {
        this.browser.tabs.executeScript(options, () => {
          resolve();
        });
      } catch (error) {
        reject(error)
      };
    });
  }

  /**
   * Create a new tab.
   * Example:
   *  {
   *    url:"https://example.org"
   *  }
   */
  createTab (options) {
    return new Promise( (resolve, reject) => {
      try {
        this.browser.tabs.create(options, (tab) => {
          resolve(tab);
        });
      } catch (error) {
        reject(error)
      };
    });
  }

  /**
   * Create a new window.
   * Example:
   *  {
   *    url: "https://example.org",
   *    type: "normal",
   *    state: "maximized"
   *  }
   */
  createWindow (options) {
    return new Promise( (resolve, reject) => {
      try {
        this.browser.windows.create(options, (win) => {
          resolve(win);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Send a message to the given tab.
   */
  sendMessage (tab, message) {
    return new Promise( (resolve, reject) => {
      try {
        this.browser.tabs.sendMessage(tab, message, (response) => {
          resolve(response);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

}
