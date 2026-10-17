(function () {
  var header = document.querySelector(".site-header");
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".site-nav");

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  function inbox() {
    return String.fromCharCode(116, 108, 99, 97, 114, 100, 101, 114, 64, 103, 109, 97, 105, 108, 46, 99, 111, 109);
  }

  function trapFilled() {
    var trap = document.querySelector(".hp input");
    return !!(trap && String(trap.value || "").trim());
  }

  var mailLink = document.querySelector("[data-mail]");
  if (mailLink) {
    mailLink.addEventListener("click", function (event) {
      event.preventDefault();
      if (trapFilled()) return;
      window.location.href = "mailto:" + inbox();
    });
  }

  var form = document.querySelector("#message");
  if (!form) return;
  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var note = document.querySelector(".form-note");
    if (note) {
      note.hidden = false;
      note.textContent = "Call or text (406) 369-0838 and we'll get you back online. If this device can text, a message is ready with what you wrote.";
    }
    if (trapFilled()) return;
    var data = new FormData(form);
    var name = String(data.get("name") || "").trim();
    var phone = String(data.get("phone") || "").trim();
    var message = String(data.get("message") || "").trim();
    var body = "Hi TLC, I'm " + (name || "a neighbor") + ". " + message + (phone ? " Reach me at " + phone + "." : "");
    window.location.href = "sms:+14063690838?&body=" + encodeURIComponent(body);
  });
})();
