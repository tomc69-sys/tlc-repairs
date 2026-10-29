(function () {
  var header = document.querySelector(".site-header");
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".nav");

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  document.querySelectorAll(".menu > a").forEach(function (link) {
    link.addEventListener("click", function (event) {
      if (window.matchMedia("(max-width: 1100px)").matches) {
        event.preventDefault();
        link.parentElement.classList.toggle("open");
      }
    });
  });

  function placeHeader() {
    var bar = document.querySelector(".preview-bar");
    if (!header) return;
    var stuck = bar && getComputedStyle(bar).position === "sticky";
    var barH = stuck && bar ? bar.offsetHeight : 0;
    header.style.top = barH + "px";
    var barSeen = bar ? Math.max(0, bar.getBoundingClientRect().bottom) : 0;
    document.documentElement.style.setProperty("--stack", (header.offsetHeight + barSeen) + "px");
  }
  function onScroll() {
    if (header) header.classList.toggle("scrolled", window.scrollY > 8);
    placeHeader();
  }
  placeHeader();
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", placeHeader);
  function revealHash() {
    if (!location.hash) return;
    var target = document.querySelector(location.hash);
    if (target) target.scrollIntoView();
  }
  revealHash();
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () {
      placeHeader();
      revealHash();
    });
  }

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var nodes = document.querySelectorAll(".rise");
  if (!reduce && "IntersectionObserver" in window) {
    document.documentElement.classList.add("motion");
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("show");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.16, rootMargin: "0px 0px -8% 0px" });
    nodes.forEach(function (node) { io.observe(node); });
    window.setTimeout(function () {
      nodes.forEach(function (node) { node.classList.add("show"); });
    }, 1600);
  }

  var rail = document.querySelector("[data-rail]");
  if (rail) {
    var dragging = false;
    var moved = false;
    var startX = 0;
    var pauseUntil = 0;
    var snapTimer = 0;
    var coarse = window.matchMedia("(pointer: coarse)").matches;
    if (!reduce && !coarse) {
      var originals = Array.prototype.slice.call(rail.children);
      originals.forEach(function (node) {
        var copy = node.cloneNode(true);
        copy.setAttribute("aria-hidden", "true");
        if (copy.matches("a")) copy.tabIndex = -1;
        rail.appendChild(copy);
      });
      var loopAt = 0;
      function measureLoop() {
        var mark = rail.children[originals.length];
        var first = rail.children[0];
        loopAt = mark && first ? mark.offsetLeft - first.offsetLeft : 0;
      }
      measureLoop();
      window.addEventListener("resize", measureLoop);
      var gliding = true;
      var last = 0;
      function frame(now) {
        if (!last) last = now;
        var dt = Math.min(34, now - last);
        last = now;
        var paused = dragging || Date.now() < pauseUntil || (window.matchMedia("(hover: hover)").matches && rail.matches(":hover"));
        if (gliding && !paused && loopAt > 0) {
          rail.classList.add("gliding");
          rail.scrollLeft += dt * 0.032;
          if (rail.scrollLeft >= loopAt) rail.scrollLeft -= loopAt;
        }
        window.requestAnimationFrame(frame);
      }
      window.requestAnimationFrame(frame);
      rail.addEventListener("wheel", function () {
        gliding = false;
        rail.classList.remove("gliding");
      }, { passive: true });
    }
    function settleRail() {
      window.clearTimeout(snapTimer);
      snapTimer = window.setTimeout(function () {
        if (!dragging) rail.classList.remove("dragging");
      }, 160);
    }
    rail.addEventListener("pointerdown", function (event) {
      dragging = true;
      moved = false;
      startX = event.clientX;
      rail.classList.add("dragging");
      rail.classList.remove("gliding");
    });
    rail.addEventListener("pointermove", function (event) {
      if (dragging && Math.abs(event.clientX - startX) > 8) moved = true;
    });
    function releaseRail() {
      dragging = false;
      pauseUntil = Date.now() + 1600;
      settleRail();
    }
    rail.addEventListener("pointerup", releaseRail);
    rail.addEventListener("pointercancel", releaseRail);
    rail.addEventListener("scroll", function () {
      if (dragging || !rail.classList.contains("dragging")) return;
      settleRail();
    }, { passive: true });
    rail.addEventListener("click", function (event) {
      if (!moved) return;
      event.preventDefault();
      event.stopPropagation();
    }, true);
  }

  var box = document.querySelector(".lightbox");
  if (box) {
    var shot = box.querySelector("img");
    var cap = box.querySelector("p");
    document.querySelectorAll("[data-full]").forEach(function (button) {
      button.addEventListener("click", function () {
        shot.src = button.getAttribute("data-full");
        shot.alt = button.getAttribute("data-alt") || "";
        cap.textContent = button.getAttribute("data-caption") || "";
        box.classList.add("open");
      });
    });
    box.addEventListener("click", function (event) {
      if (event.target === box || event.target.classList.contains("x")) box.classList.remove("open");
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") box.classList.remove("open");
    });
  }

  var turbine = document.querySelector(".turbine");
  if (turbine) {
    var rotor = turbine.querySelector(".rotor");
    function placeTurbine() {
      var banner = turbine.parentElement;
      var bw = banner.clientWidth;
      var bh = banner.clientHeight;
      var styles = getComputedStyle(banner);
      var cropY = parseFloat(styles.getPropertyValue("--crop-y"));
      var rotorSrc = parseFloat(styles.getPropertyValue("--rotor"));
      if (!isFinite(cropY)) cropY = 0.58;
      if (!isFinite(rotorSrc)) rotorSrc = 108;
      var scale = Math.max(bw / 1600, bh / 937);
      var visible = bw / scale;
      var tip = 1510 + rotorSrc / 2 + 6;
      var cropX = 0.5;
      if (visible < 1594) {
        var need = (tip - visible) / (1600 - visible);
        if (need > cropX) cropX = Math.min(1, need);
      }
      banner.style.setProperty("--crop-x", cropX.toFixed(4));
      var ox = (bw - 1600 * scale) * cropX;
      var oy = (bh - 937 * scale) * cropY;
      var dia = rotorSrc * scale;
      var hubX = 1510;
      var hubY = 424;
      var poleBottom = 700;
      var top = oy + hubY * scale - dia / 2;
      turbine.style.left = (ox + hubX * scale - dia / 2) + "px";
      turbine.style.top = top + "px";
      turbine.style.width = dia + "px";
      turbine.style.height = (oy + poleBottom * scale - top) + "px";
      turbine.style.setProperty("--hub", (dia / 2) + "px");
      rotor.style.width = dia + "px";
      rotor.style.height = dia + "px";
    }
    placeTurbine();
    window.addEventListener("resize", placeTurbine);
  }

  var calc = document.querySelector("[data-solar-calc]");
  if (calc) {
    var bill = calc.querySelector("[name=bill]");
    var rate = calc.querySelector("[name=rate]");
    var offset = calc.querySelector("[name=offset]");
    var sun = calc.querySelector("[name=sun]");
    var ppw = calc.querySelector("[name=ppw]");
    var out = calc.querySelector("[data-calc-out]");
    var derate = 0.82;
    function money(n) {
      return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
    }
    function runCalc() {
      var monthlyBill = Number(bill.value);
      var price = Number(rate.value);
      var share = Number(offset.value) / 100;
      var hours = Number(sun.value);
      var wattPrice = Number(ppw.value);
      if (!(monthlyBill > 0) || !(price > 0) || !(hours > 0) || !(share > 0)) {
        out.innerHTML = "<li><strong>—</strong><span>Enter a monthly bill to see a starting size.</span></li>";
        return;
      }
      var monthlyKwh = monthlyBill / price;
      var yearlyKwh = monthlyKwh * 12 * share;
      var kw = yearlyKwh / (hours * 365 * derate);
      var panels = Math.max(1, Math.round((kw * 1000) / 400));
      var made = kw * hours * 365 * derate;
      var savings = made * price;
      var cost = kw * 1000 * (wattPrice > 0 ? wattPrice : 0);
      var years = savings > 0 && cost > 0 ? cost / savings : 0;
      out.innerHTML = [
        ["Monthly use", Math.round(monthlyKwh).toLocaleString() + " kWh", "From the bill and the rate"],
        ["System size", kw.toFixed(1) + " kW", panels + " panels at 400 watts"],
        ["Yearly power", Math.round(made).toLocaleString() + " kWh", "After winter and equipment losses"],
        ["Yearly savings", money(savings), "If the rate stays the same"],
        ["Rough cost", wattPrice > 0 ? money(cost) : "—", "Not a bid"],
        ["Simple payback", years ? years.toFixed(1) + " years" : "—", "Before batteries or roof work"]
      ].map(function (row) {
        return "<li><strong>" + row[1] + "</strong><span>" + row[0] + ". " + row[2] + "</span></li>";
      }).join("");
    }
    calc.addEventListener("submit", function (event) { event.preventDefault(); });
    calc.addEventListener("input", runCalc);
    runCalc();
  }

  var mapAddress = "4342 Eastside Hwy, Stevensville, MT 59870";
  var mapPin = "46.524974,-114.066602";
  var mapLabel = "Remote Power Systems, Building 438, Unit 4";
  var mapButtons = document.querySelectorAll("[data-maps]");
  if (mapButtons.length) {
    var encodedAddress = encodeURIComponent(mapAddress);
    var encodedLabel = encodeURIComponent(mapLabel);
    var android = /Android/i.test(navigator.userAgent || "");
    var phone = android || /iPhone|iPad|iPod/i.test(navigator.userAgent || "") || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    var sheet = document.createElement("div");
    sheet.className = "map-sheet";
    sheet.hidden = true;
    var apps = [
      ["Apple Maps", "https://maps.apple.com/?daddr=" + encodedAddress + "&dirflg=d", "iPhone and Mac"],
      ["Google Maps", "https://www.google.com/maps/dir/?api=1&destination=" + encodedAddress + "&travelmode=driving", "Android and iPhone"],
      ["Waze", "https://waze.com/ul?ll=" + mapPin + "&navigate=yes&q=" + encodedAddress, "Android and iPhone"]
    ];
    if (android) apps.unshift(["Your map app", "geo:" + mapPin + "?q=" + mapPin + "(" + encodedLabel + ")", "Opens the one already on the phone"]);
    sheet.innerHTML = '<button type="button" class="map-backdrop" aria-label="Close directions"></button>'
      + '<div class="map-panel" role="dialog" aria-modal="true" aria-labelledby="map-title">'
      + '<p class="kicker">New shop</p><h2 id="map-title">4342 Eastside Hwy</h2>'
      + '<p>Building 438, Unit 4, Stevensville, MT 59870. Each choice opens that address in that app.</p>'
      + '<div class="map-choices">'
      + apps.map(function (app) {
        return '<a href="' + app[1] + '">' + app[0] + '<span>' + app[2] + '</span></a>';
      }).join("")
      + '</div><button type="button" class="map-close">Close</button></div>';
    document.body.appendChild(sheet);
    var dialog = sheet.querySelector(".map-panel");
    var lastFocus = null;
    function openMaps(event) {
      if (event) event.preventDefault();
      lastFocus = document.activeElement;
      sheet.hidden = false;
      requestAnimationFrame(function () { sheet.classList.add("open"); });
      var first = sheet.querySelector("a");
      if (first) first.focus();
    }
    function closeMaps() {
      sheet.classList.remove("open");
      window.setTimeout(function () {
        sheet.hidden = true;
        if (lastFocus && lastFocus.focus) lastFocus.focus();
      }, window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 280);
    }
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var carFace = '<rect x="-16" y="-6" width="32" height="12" rx="5" fill="#ffe566" stroke="#1a1a1a" stroke-width="1.25"></rect>'
      + '<rect x="-2" y="-11" width="14" height="8" rx="3" fill="#9ad8ff" stroke="#1a1a1a" stroke-width="1"></rect>'
      + '<circle cx="2" cy="-8" r="1.15" fill="#1a1a1a"></circle>'
      + '<circle cx="7" cy="-8" r="1.15" fill="#1a1a1a"></circle>'
      + '<path d="M2 -5.4 Q4.5 -3.2 7 -5.4" fill="none" stroke="#1a1a1a" stroke-width="1.1" stroke-linecap="round"></path>'
      + '<circle cx="-8" cy="6" r="3.2" fill="#222"></circle>'
      + '<circle cx="9" cy="6" r="3.2" fill="#222"></circle>'
      + '<circle cx="-8" cy="6" r="1.25" fill="#f4f4f4"></circle>'
      + '<circle cx="9" cy="6" r="1.25" fill="#f4f4f4"></circle>'
      + '<circle cx="14.5" cy="-1.5" r="1.6" fill="#fff4a3" stroke="#1a1a1a" stroke-width="0.6"></circle>';
    mapButtons.forEach(function (button, index) {
      button.addEventListener("click", openMaps);
      if (!button.classList.contains("map-open")) return;
      var id = "map-road-path-" + index;
      var motion = reduceMotion ? "" : '<animateMotion dur="6.5s" repeatCount="indefinite" rotate="auto" calcMode="linear"><mpath href="#' + id + '"></mpath></animateMotion>';
      button.insertAdjacentHTML("afterbegin",
        '<span class="map-road" aria-hidden="true"></span>'
        + '<span class="map-lane" aria-hidden="true"><svg class="map-drive" overflow="visible" aria-hidden="true">'
        + '<path id="' + id + '" fill="none"></path>'
        + '<g class="map-driver">' + carFace + motion + '</g>'
        + '</svg></span>');
      var lane = button.querySelector(".map-lane");
      var roadPath = button.querySelector("#" + id);
      var driver = button.querySelector(".map-driver");
      var svg = button.querySelector(".map-drive");
      function layoutRoad() {
        var w = lane.clientWidth;
        var h = lane.clientHeight;
        if (w < 8 || h < 8) return;
        var radius = h / 2;
        var d = "M " + radius + " 0 H " + (w - radius)
          + " A " + radius + " " + radius + " 0 0 1 " + (w - radius) + " " + h
          + " H " + radius
          + " A " + radius + " " + radius + " 0 0 1 " + radius + " 0 Z";
        roadPath.setAttribute("d", d);
        svg.setAttribute("viewBox", "0 0 " + w + " " + h);
        if (reduceMotion) driver.setAttribute("transform", "translate(" + (w / 2) + " 0)");
      }
      layoutRoad();
      window.addEventListener("resize", layoutRoad);
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(layoutRoad);
    });
    sheet.querySelector(".map-backdrop").addEventListener("click", closeMaps);
    sheet.querySelector(".map-close").addEventListener("click", closeMaps);
    sheet.addEventListener("keydown", function (event) {
      if (event.key === "Escape") closeMaps();
    });
    sheet.querySelectorAll("a").forEach(function (link) {
      if (!phone) {
        link.target = "_blank";
        link.rel = "noopener";
      }
    });
    dialog.addEventListener("click", function (event) { event.stopPropagation(); });
  }

  var form = document.querySelector("[data-preview-form]");
  if (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var note = form.querySelector(".form-result");
      if (note) note.hidden = false;
    });
  }
})();
