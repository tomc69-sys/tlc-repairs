let pending = [];
let approved = [];

function esc(text) {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function toast(msg) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 2800);
}

function setStatus(msg) {
  document.getElementById("status").textContent = msg || "";
}

function stars(n) {
  const r = Math.max(0, Math.min(5, Number(n) || 0));
  return "★".repeat(r) + "☆".repeat(5 - r);
}

function metaLine(r) {
  const bits = [];
  if (r.service) bits.push(r.service);
  if (r.town) bits.push(String(r.town));
  if (r.submitted_at) bits.push("submitted " + String(r.submitted_at).slice(0, 10));
  if (r.approved_at) bits.push("approved " + String(r.approved_at).slice(0, 10));
  return bits.join(" · ");
}

function renderPending() {
  const root = document.getElementById("pending-list");
  document.getElementById("pending-count").textContent = String(pending.length);
  if (!pending.length) {
    root.innerHTML = '<p class="empty">No pending reviews yet.</p>';
    return;
  }
  root.innerHTML = pending
    .map(
      (r) => `<article class="review-item" data-id="${esc(r.id)}">
      <div class="review-item-head">
        <span class="review-item-name">${esc(r.name)}</span>
        <span class="review-item-stars">${stars(r.rating)}</span>
      </div>
      <p class="review-item-meta">${esc(metaLine(r))}</p>
      <p class="review-item-text">${esc(r.text)}</p>
      <div class="review-item-actions">
        <button type="button" class="approve" data-action="approve" data-id="${esc(r.id)}">Approve</button>
        <button type="button" class="reject" data-action="reject" data-id="${esc(r.id)}">Reject</button>
      </div>
    </article>`
    )
    .join("");
}

function renderApproved() {
  const root = document.getElementById("approved-list");
  document.getElementById("approved-count").textContent = String(approved.length);
  if (!approved.length) {
    root.innerHTML = '<p class="empty">No approved reviews yet. Approved items rebuild reviews.html automatically.</p>';
    return;
  }
  root.innerHTML = approved
    .map(
      (r, idx) => `<article class="review-item" data-id="${esc(r.id)}">
      <div class="review-item-head">
        <span class="review-item-name">${esc(r.name)}</span>
        <span class="review-item-stars">${stars(r.rating)}</span>
      </div>
      <p class="review-item-meta">${esc(metaLine(r))}</p>
      <p class="review-item-text">${esc(r.text)}</p>
      <div class="review-item-actions">
        <button type="button" data-action="up" data-id="${esc(r.id)}" ${idx === 0 ? "disabled" : ""}>↑</button>
        <button type="button" data-action="down" data-id="${esc(r.id)}" ${idx === approved.length - 1 ? "disabled" : ""}>↓</button>
        <button type="button" data-action="unapprove" data-id="${esc(r.id)}">Unapprove</button>
        <button type="button" class="delete" data-action="delete" data-id="${esc(r.id)}">Delete</button>
      </div>
    </article>`
    )
    .join("");
}

async function api(path, body) {
  const opts = body
    ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
    : { method: path.startsWith("/api/") && path !== "/api/data" ? "POST" : "GET" };
  if (path === "/api/rebuild") opts.method = "POST";
  if (opts.method === "POST" && !opts.body) opts.body = "{}";
  const res = await fetch(path, opts);
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || "Request failed");
  return data;
}

async function load() {
  setStatus("Loading…");
  const data = await api("/api/data");
  pending = data.pending || [];
  approved = data.approved || [];
  renderPending();
  renderApproved();
  setStatus(`Pending ${pending.length} · Approved ${approved.length}`);
}

async function postAction(path, id) {
  try {
    const data = await api(path, { id });
    toast(data.message || "Done");
    await load();
  } catch (err) {
    toast(err.message || String(err));
  }
}

async function reorder(fromId, dir) {
  const ids = approved.map((r) => String(r.id));
  const i = ids.indexOf(String(fromId));
  if (i < 0) return;
  const j = dir === "up" ? i - 1 : i + 1;
  if (j < 0 || j >= ids.length) return;
  [ids[i], ids[j]] = [ids[j], ids[i]];
  try {
    const data = await api("/api/reorder-approved", { ids });
    toast(data.message || "Reordered");
    await load();
  } catch (err) {
    toast(err.message || String(err));
  }
}

document.getElementById("pending-list").addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;
  const id = btn.dataset.id;
  if (btn.dataset.action === "approve") postAction("/api/approve", id);
  if (btn.dataset.action === "reject") {
    if (confirm("Reject and permanently remove this pending review?")) postAction("/api/reject", id);
  }
});

document.getElementById("approved-list").addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;
  const id = btn.dataset.id;
  const action = btn.dataset.action;
  if (action === "up") reorder(id, "up");
  if (action === "down") reorder(id, "down");
  if (action === "unapprove") postAction("/api/unapprove", id);
  if (action === "delete") {
    if (confirm("Delete this approved review? This rebuilds the page.")) postAction("/api/delete-approved", id);
  }
});

document.getElementById("btn-refresh").addEventListener("click", () => {
  load().catch((err) => toast(err.message || String(err)));
});

document.getElementById("btn-rebuild").addEventListener("click", async () => {
  try {
    const data = await api("/api/rebuild", {});
    toast(data.message || "Rebuilt");
  } catch (err) {
    toast(err.message || String(err));
  }
});

document.getElementById("btn-preview").addEventListener("click", () => {
  window.open("../../reviews.html", "_blank");
});

document.getElementById("add-pending").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;
  const body = {
    name: form.name.value,
    service: form.service.value,
    town: form.town.value,
    rating: form.rating.value,
    text: form.text.value,
  };
  try {
    const data = await api("/api/add-pending", body);
    toast(data.message || "Saved");
    form.reset();
    form.rating.value = "5";
    await load();
  } catch (err) {
    toast(err.message || String(err));
  }
});

load().catch((err) => {
  setStatus("");
  toast(err.message || String(err));
});
