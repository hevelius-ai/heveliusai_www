// Conveniences only: the page works fully with scripts turned off.
(function () {
  var row = document.getElementById("copy-row");
  var btn = document.getElementById("copy-email");
  var status = document.getElementById("copy-status");
  var link = document.querySelector(".email a");
  if (!row || !btn || !status || !link) return;

  var address = "contact@heveliusai.com";
  row.hidden = false;

  btn.addEventListener("click", function () {
    status.textContent = "";
    function done() { status.textContent = "Address copied."; }
    function fallback() {
      var range = document.createRange();
      range.selectNodeContents(link);
      var sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      status.textContent = "Address selected. Copy it with your keyboard.";
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(address).then(done, fallback);
    } else {
      fallback();
    }
  });
})();
