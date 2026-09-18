(function () {
  var KEY = "hc-cart";
  var PRODUCTS = [
    { id: "wool-shirt", name: "Range Wool Shirt", price: 89, cat: "wear", color: "#6b4a32", blurb: "Heavy shirt for cold mornings. Looks like work clothes on purpose." },
    { id: "camp-hat", name: "Sawtooth Cap", price: 28, cat: "wear", color: "#243028", blurb: "Wool cap, one size, does not try to be a fashion hat." },
    { id: "ranch-socks", name: "Ranch Socks", price: 16, cat: "wear", color: "#8b5a2b", blurb: "Two-pack. Thick enough for boots." },
    { id: "enamel-mug", name: "Enamel Mug", price: 18, cat: "camp", color: "#3e5c48", blurb: "12 oz, chips if you throw it. That is part of the look." },
    { id: "canvas-tote", name: "Canvas Tote", price: 34, cat: "camp", color: "#c4b49a", blurb: "Groceries, kindling, or a change of clothes." },
    { id: "lodge-candle", name: "Lodge Candle", price: 22, cat: "camp", color: "#d8c4a0", blurb: "Pine and smoke. Burns a long evening." }
  ];

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY) || "[]"); }
    catch (e) { return []; }
  }
  function save(cart) { localStorage.setItem(KEY, JSON.stringify(cart)); }
  function product(id) { return PRODUCTS.filter(function (p) { return p.id === id; })[0]; }
  function count(cart) {
    return cart.reduce(function (n, i) { return n + i.qty; }, 0);
  }
  function money(n) { return "$" + n.toFixed(0); }

  function cartItems() {
    return load().map(function (i) {
      var p = product(i.id);
      return p ? { product: p, qty: i.qty } : null;
    }).filter(Boolean);
  }

  function addToCart(id, qty) {
    var cart = load();
    var found = cart.filter(function (i) { return i.id === id; })[0];
    if (found) found.qty += qty;
    else cart.push({ id: id, qty: qty });
    save(cart);
    render();
  }

  function setQty(id, qty) {
    var cart = load().filter(function (i) {
      if (i.id !== id) return true;
      i.qty = qty;
      return qty > 0;
    });
    save(cart);
    render();
  }

  function paintBadge() {
    var n = count(load());
    document.querySelectorAll("[data-cart-count]").forEach(function (el) {
      el.textContent = n;
    });
  }

  function drawerHtml() {
    var rows = cartItems();
    if (!rows.length) return "<p class='empty'>Cart is empty.</p>";
    var total = 0;
    var html = "<ul class='include-list' style='list-style:none;padding:0;margin:0'>";
    rows.forEach(function (row) {
      var line = row.product.price * row.qty;
      total += line;
      html += "<li style='display:flex;justify-content:space-between;gap:1rem;padding:.55rem 0;border-bottom:1px solid var(--line)'>" +
        "<span>" + row.product.name + " × " + row.qty + "</span><b>" + money(line) + "</b></li>";
    });
    html += "</ul><p><strong>Subtotal " + money(total) + "</strong></p>";
    html += "<p><a class='btn primary' href='./checkout.html'>Checkout</a></p>";
    return html;
  }

  function renderDrawer() {
    var box = document.querySelector("[data-cart-list]");
    if (box) box.innerHTML = drawerHtml();
  }

  function renderShop() {
    var list = document.querySelector("[data-products]");
    if (!list) return;
    var filter = list.getAttribute("data-filter") || "all";
    list.innerHTML = PRODUCTS.filter(function (p) {
      return filter === "all" || p.cat === filter;
    }).map(function (p) {
      return "<li class='product'>" +
        "<div class='swatch' style='background:" + p.color + "'></div>" +
        "<div class='body'><h3><a href='./product.html?id=" + p.id + "'>" + p.name + "</a></h3>" +
        "<p class='muted'>" + p.blurb + "</p>" +
        "<p class='price'>" + money(p.price) + "</p>" +
        "<button class='btn sage' data-add='" + p.id + "'>Add to cart</button></div></li>";
    }).join("");
  }

  function renderFeatured() {
    var list = document.querySelector("[data-featured]");
    if (!list) return;
    list.innerHTML = PRODUCTS.slice(0, 3).map(function (p) {
      return "<li class='product'>" +
        "<div class='swatch' style='background:" + p.color + "'></div>" +
        "<div class='body'><h3><a href='./product.html?id=" + p.id + "'>" + p.name + "</a></h3>" +
        "<p class='price'>" + money(p.price) + "</p></div></li>";
    }).join("");
  }

  function renderProduct() {
    var root = document.querySelector("[data-product]");
    if (!root) return;
    var id = new URLSearchParams(location.search).get("id") || "wool-shirt";
    var p = product(id) || PRODUCTS[0];
    root.innerHTML =
      "<div class='detail-swatch' style='background:" + p.color + "'></div>" +
      "<div class='detail'><p class='muted'>High Country Supply</p><h1>" + p.name + "</h1>" +
      "<p>" + p.blurb + "</p><p class='price'>" + money(p.price) + "</p>" +
      "<div class='qty'><label>Qty <input type='number' min='1' value='1' data-qty></label></div>" +
      "<button class='btn primary' data-add='" + p.id + "'>Add to cart</button> " +
      "<a class='btn ghost' href='./shop.html'>Back to shop</a></div>";
  }

  function renderCheckout() {
    var box = document.querySelector("[data-checkout-summary]");
    if (!box) return;
    var rows = cartItems();
    if (!rows.length) {
      box.innerHTML = "<p class='empty'>Nothing in the cart. <a href='./shop.html'>Go to the shop</a>.</p>";
      return;
    }
    var total = 0;
    var html = "<table class='cart-table'><tbody>";
    rows.forEach(function (row) {
      var line = row.product.price * row.qty;
      total += line;
      html += "<tr><td>" + row.product.name + " × " + row.qty + "</td><td>" + money(line) + "</td></tr>";
    });
    html += "<tr><th>Subtotal</th><th>" + money(total) + "</th></tr>";
    html += "<tr><td>Sample shipping</td><td>$8</td></tr>";
    html += "<tr><th>Demo total</th><th>" + money(total + 8) + "</th></tr></tbody></table>";
    box.innerHTML = html;
  }

  function render() {
    paintBadge();
    renderDrawer();
    renderShop();
    renderFeatured();
    renderProduct();
    renderCheckout();
  }

  document.addEventListener("click", function (e) {
    var addBtn = e.target.closest("[data-add]");
    if (addBtn) {
      var qtyEl = document.querySelector("[data-qty]");
      var qty = qtyEl ? Math.max(1, parseInt(qtyEl.value, 10) || 1) : 1;
      addToCart(addBtn.getAttribute("data-add"), qty);
      openDrawer();
    }
    if (e.target.closest("[data-open-cart]")) {
      e.preventDefault();
      openDrawer();
    }
    if (e.target.closest("[data-close-cart]")) closeDrawer();
    var filter = e.target.closest("[data-filter-btn]");
    if (filter) {
      var list = document.querySelector("[data-products]");
      if (list) list.setAttribute("data-filter", filter.getAttribute("data-filter-btn"));
      document.querySelectorAll("[data-filter-btn]").forEach(function (b) {
        b.classList.toggle("is-on", b === filter);
      });
      renderShop();
    }
  });

  function openDrawer() {
    document.querySelectorAll("[data-cart-drawer], [data-cart-backdrop]").forEach(function (el) {
      el.classList.add("open");
    });
  }
  function closeDrawer() {
    document.querySelectorAll("[data-cart-drawer], [data-cart-backdrop]").forEach(function (el) {
      el.classList.remove("open");
    });
  }

  var form = document.querySelector("[data-checkout-form]");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!load().length) return;
      save([]);
      form.hidden = true;
      document.querySelector("[data-thanks]").hidden = false;
      render();
    });
  }

  render();
})();
