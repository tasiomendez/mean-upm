browser.runtime.onMessage.addListener((message) => {
  console.log(message);
  document.querySelector("body").style.backgroundColor = "red";
});
