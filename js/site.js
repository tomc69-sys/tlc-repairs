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

  var downloads = document.querySelectorAll(".dl-check");
  for (var i = 0; i < downloads.length; i++) {
    (function (dl) {
      var file = dl.getAttribute("data-file") || "";
      var note = dl.querySelector(".form-note");
      var ask = dl.querySelector(".check-q");
      var actions = dl.querySelector(".check-actions");
      var go = dl.querySelector(".dl-go");
      var yes = dl.querySelector("[data-real=yes]");
      var no = dl.querySelector("[data-real=no]");
      function trapHere() {
        var trap = dl.querySelector(".hp input");
        return !!(trap && String(trap.value || "").trim());
      }
      function showNote(text) {
        if (!note) return;
        note.hidden = false;
        note.textContent = text;
      }
      if (yes) {
        yes.addEventListener("click", function () {
          if (trapHere() || !file || !go) {
            showNote("That didn't look like a person.");
            return;
          }
          go.href = "files/" + file.split("/").map(function (part) {
            return encodeURIComponent(part);
          }).join("/");
          go.setAttribute("download", file.split("/").pop());
          go.hidden = false;
          if (ask) ask.hidden = true;
          if (actions) actions.hidden = true;
          if (note) note.hidden = true;
        });
      }
      if (no) {
        no.addEventListener("click", function () {
          if (go) {
            go.hidden = true;
            go.removeAttribute("href");
          }
          showNote("The download stays hidden.");
        });
      }
    })(downloads[i]);
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
