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

// The evidence example and the roles table scroll sideways when they are wider than the screen,
// so each has a keyboard stop for scrolling it. Where it fits, the stop does nothing; it is
// taken out, and put back as soon as the box overflows again (a narrower window, zoom, larger text).
(function () {
  var boxes = document.querySelectorAll(".scroll[tabindex]");
  if (!boxes.length) return;

  function update() {
    for (var i = 0; i < boxes.length; i++) {
      var box = boxes[i];
      if (box.scrollWidth > box.clientWidth) box.setAttribute("tabindex", "0");
      else if (box !== document.activeElement) box.removeAttribute("tabindex");
    }
  }

  update();
  if (window.ResizeObserver) {
    var watch = new ResizeObserver(update);
    for (var i = 0; i < boxes.length; i++) {
      watch.observe(boxes[i]);
      if (boxes[i].firstElementChild) watch.observe(boxes[i].firstElementChild);
    }
  } else {
    window.addEventListener("resize", update);
  }
})();
