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

  var form = document.querySelector("#message");
  if (!form) return;
  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var data = new FormData(form);
    var name = String(data.get("name") || "").trim();
    var phone = String(data.get("phone") || "").trim();
    var message = String(data.get("message") || "").trim();
    var note = document.querySelector(".form-note");
    if (note) {
      note.hidden = false;
      note.textContent = "Call or text (406) 369-0838 and we'll get you back online. If this device can text, a message is ready with what you wrote.";
    }
    var body = "Hi TLC, I'm " + (name || "a neighbor") + ". " + message + (phone ? " Reach me at " + phone + "." : "");
    window.location.href = "sms:+14063690838?&body=" + encodeURIComponent(body);
  });
})();
