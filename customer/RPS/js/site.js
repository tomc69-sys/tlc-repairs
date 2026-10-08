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

  function onScroll() {
    if (header) header.classList.toggle("scrolled", window.scrollY > 8);
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

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
  if (rail && !reduce && !window.matchMedia("(pointer: coarse)").matches) {
    var dragging = false;
    var pauseUntil = 0;
    var timer = window.setInterval(function () {
      if (dragging || Date.now() < pauseUntil) return;
      if (window.matchMedia("(hover: hover)").matches && rail.matches(":hover")) return;
      var max = rail.scrollWidth - rail.clientWidth;
      if (max <= 0) return;
      if (rail.scrollLeft >= max - 1) rail.scrollLeft = 0;
      else rail.scrollLeft += 1;
    }, 24);
    function holdRail(event) {
      dragging = true;
      rail.classList.add("dragging");
      if (event.pointerId != null && rail.setPointerCapture) {
        try { rail.setPointerCapture(event.pointerId); } catch (e) {}
      }
    }
    var snapTimer = 0;
    function releaseRail() {
      dragging = false;
      pauseUntil = Date.now() + 1600;
      window.clearTimeout(snapTimer);
      snapTimer = window.setTimeout(function () {
        if (!dragging) rail.classList.remove("dragging");
      }, 160);
    }
    rail.addEventListener("scroll", function () {
      if (dragging || !rail.classList.contains("dragging")) return;
      window.clearTimeout(snapTimer);
      snapTimer = window.setTimeout(function () {
        if (!dragging) rail.classList.remove("dragging");
      }, 160);
    }, { passive: true });
    rail.addEventListener("pointerdown", holdRail);
    rail.addEventListener("pointerup", releaseRail);
    rail.addEventListener("pointercancel", releaseRail);
    rail.addEventListener("wheel", function () { window.clearInterval(timer); }, { passive: true });
  } else if (rail) {
    var fingerDown = false;
    var snapTimer = 0;
    function settleRail() {
      window.clearTimeout(snapTimer);
      snapTimer = window.setTimeout(function () {
        if (!fingerDown) rail.classList.remove("dragging");
      }, 160);
    }
    rail.addEventListener("pointerdown", function (event) {
      fingerDown = true;
      rail.classList.add("dragging");
      if (event.pointerId != null && rail.setPointerCapture) {
        try { rail.setPointerCapture(event.pointerId); } catch (e) {}
      }
    });
    rail.addEventListener("scroll", function () {
      if (fingerDown || !rail.classList.contains("dragging")) return;
      settleRail();
    }, { passive: true });
    rail.addEventListener("pointerup", function () {
      fingerDown = false;
      settleRail();
    });
    rail.addEventListener("pointercancel", function () {
      fingerDown = false;
      settleRail();
    });
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

  var form = document.querySelector("[data-preview-form]");
  if (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var note = form.querySelector(".form-result");
      if (note) note.hidden = false;
    });
  }
})();
