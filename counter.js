(function () {
  var HIT = "https://abacus.jasoncameron.dev/hit/tlcpcrepairs.com/visits";
  var GET = "https://abacus.jasoncameron.dev/get/tlcpcrepairs.com/visits";
  var SESSION = "tlc-hit-counted";

  function pad(n) {
    return String(Math.max(0, Math.floor(n))).padStart(6, "0").slice(-6);
  }

  function renderDigits(root, n) {
    var el = root.querySelector("[data-hit-digits]");
    if (!el) return;
    el.textContent = "";
    pad(n).split("").forEach(function (ch) {
      var span = document.createElement("span");
      span.className = "hit-digit";
      span.textContent = ch;
      el.appendChild(span);
    });
    root.setAttribute("aria-label", n.toLocaleString() + " visits");
  }

  function loadCount(root) {
    var bumped = false;
    try {
      bumped = sessionStorage.getItem(SESSION) === "1";
    } catch (err) {}
    fetch(bumped ? GET : HIT)
      .then(function (res) { return res.json(); })
      .then(function (data) {
        var value = Number(data && data.value);
        if (!Number.isFinite(value)) return;
        if (!bumped) {
          try { sessionStorage.setItem(SESSION, "1"); } catch (err) {}
        }
        renderDigits(root, value);
      })
      .catch(function () {});
  }

  function startClock(root) {
    var face = root.querySelector("[data-clock-face]");
    if (!face) return;
    var i;
    for (i = 0; i < 12; i += 1) {
      var tick = document.createElement("span");
      tick.className = "clock-tick" + (i % 3 === 0 ? " major" : "");
      tick.style.transform = "rotate(" + (i * 30) + "deg)";
      face.appendChild(tick);
    }
    var hour = document.createElement("div");
    hour.className = "hand hour";
    var minute = document.createElement("div");
    minute.className = "hand minute";
    var second = document.createElement("div");
    second.className = "hand second";
    var cap = document.createElement("div");
    cap.className = "clock-cap";
    face.append(hour, minute, second, cap);

    function tock() {
      var d = new Date();
      var s = d.getSeconds();
      var m = d.getMinutes();
      var h = d.getHours() % 12;
      second.style.transform = "rotate(" + (s * 6) + "deg)";
      minute.style.transform = "rotate(" + (m * 6 + s * 0.1) + "deg)";
      hour.style.transform = "rotate(" + (h * 30 + m * 0.5) + "deg)";
    }
    tock();
    setInterval(tock, 1000);
  }

  document.querySelectorAll("[data-hit-clock]").forEach(function (root) {
    startClock(root);
    loadCount(root);
  });
})();
