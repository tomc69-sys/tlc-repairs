(function () {
  var form = document.getElementById("review-form");
  if (!form) return;

  var statusEl = document.getElementById("review-form-status");
  var submitBtn = document.getElementById("review-submit");
  var textEl = document.getElementById("review-text");
  var countEl = document.getElementById("review-char-count");
  var localHost = /^(localhost|127\.0\.0\.1)$/i.test(location.hostname);
  var localEditor = "http://127.0.0.1:8891/api/submit";
  var mailInbox = "https://formsubmit.co/ajax/tlcarder@gmail.com";

  function setStatus(msg, type) {
    if (!statusEl) return;
    statusEl.hidden = !msg;
    statusEl.textContent = msg || "";
    statusEl.className = "review-form-status" + (type ? " is-" + type : "");
  }

  function updateCount() {
    if (countEl && textEl) countEl.textContent = String(textEl.value.length);
  }

  if (textEl) {
    textEl.addEventListener("input", updateCount);
    updateCount();
  }

  function payloadFromForm() {
    var rating = form.querySelector('input[name="rating"]:checked');
    return {
      name: (form.name.value || "").trim(),
      service: (form.service.value || "").trim(),
      town: (form.town.value || "").trim(),
      rating: rating ? rating.value : "",
      text: (form.text.value || "").trim(),
      company: (form.company.value || "").trim(),
    };
  }

  function postJson(url, body) {
    return fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
    }).then(function (res) {
      return res.json().then(function (data) {
        return { ok: res.ok && data && data.ok !== false, data: data, status: res.status };
      }).catch(function () {
        return { ok: res.ok, data: null, status: res.status };
      });
    });
  }

  function postFormSubmit(fields) {
    return fetch(mailInbox, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        name: fields.name,
        service: fields.service,
        town: fields.town,
        rating: fields.rating,
        text: fields.text,
        _subject: "New TLC PC Repairs review",
        _template: "table",
        _captcha: "false",
        _honey: fields.company,
      }),
    }).then(function (res) {
      return res.json().then(function (data) {
        var ok = res.ok && data && data.success !== false && data.ok !== false;
        return { ok: ok, data: data, status: res.status };
      }).catch(function () {
        return { ok: res.ok, data: null, status: res.status };
      });
    });
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    setStatus("", "");

    var fields = payloadFromForm();
    if (fields.name.length < 2) {
      setStatus("Please enter your name.", "error");
      form.name.focus();
      return;
    }
    if (!fields.rating) {
      setStatus("Please choose a star rating.", "error");
      return;
    }
    if (fields.text.length < 20) {
      setStatus("Please write at least 20 characters in your review.", "error");
      form.text.focus();
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Sending…";
    }
    setStatus("Sending your review…", "pending");

    var send = localHost ? postJson(localEditor, fields) : postFormSubmit(fields);
    send
      .then(function (result) {
        if (result.ok) {
          form.reset();
          updateCount();
          setStatus(
            (result.data && (result.data.message || result.data.next)) ||
              "Thank you! Your review was submitted and will appear after approval.",
            "success"
          );
          form.classList.add("is-submitted");
        } else {
          setStatus(
            (result.data && (result.data.error || result.data.message)) ||
              "Something went wrong. Call or text (406) 369-0838, or try again later.",
            "error"
          );
        }
      })
      .catch(function () {
        setStatus(
          "Could not send the review. Call or text (406) 369-0838.",
          "error"
        );
      })
      .finally(function () {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = "Submit review";
        }
      });
  });
})();
