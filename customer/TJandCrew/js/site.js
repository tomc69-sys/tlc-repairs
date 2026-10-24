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

  var form = document.querySelector("[data-preview-form]");
  if (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var note = form.querySelector(".form-result");
      if (note) note.hidden = false;
    });
  }
})();
