(function () {
  var usesCurrentEntry = Array.prototype.some.call(document.scripts, function (script) {
    return /(^|\/)js\/app\.js(\?|$)/.test(script.getAttribute("src") || "");
  });

  if (usesCurrentEntry || window.__MUZIBAI_APP_LOADED__) return;

  var target = "/?refresh=" + Date.now();
  if (location.pathname !== "/" || location.search.indexOf("refresh=") === -1) {
    location.replace(target);
  }
})();
