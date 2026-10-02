// Classic (non-module) script: runs even when opened from disk.
// Browsers block ES modules on file://, so explain how to run the toolkit.
(function () {
  if (location.protocol !== 'file:') return;
  function show() {
    var div = document.createElement('div');
    div.className = 'file-banner';
    div.innerHTML =
      '<strong>Opened from disk, so the tools can\'t load.</strong> Browsers block JavaScript modules on file:// URLs. ' +
      'Run <code>npm start</code> in the repo folder and open <code>http://localhost:4173</code>, ' +
      'or use the GitHub Pages link from the README.';
    document.body.insertBefore(div, document.body.firstChild);
  }
  if (document.body) show();
  else document.addEventListener('DOMContentLoaded', show);
})();
