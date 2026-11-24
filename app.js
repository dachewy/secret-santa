// Bad Santa: Secret Santa with private links. No server needed.

const $ = (id) => document.getElementById(id);
let names = [];

// ---------- Link encoding (light obfuscation, not real security) ----------
function encode(obj) {
  const bytes = new TextEncoder().encode(JSON.stringify(obj));
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function decode(str) {
  const b64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

// ---------- Draw ----------
// Sattolo's shuffle makes one big loop, so nobody ever gets themselves.
function draw(list) {
  const order = [...list];
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * i); // j < i (this is what makes it Sattolo)
    [order[i], order[j]] = [order[j], order[i]];
  }
  // Each person gives to the next person in the loop.
  return order.map((giver, i) => ({ g: giver, r: order[(i + 1) % order.length] }));
}

// ---------- Organiser view ----------
function showError(msg) {
  $("error").textContent = msg;
  $("error").hidden = !msg;
}

function renderNames() {
  const list = $("name-list");
  list.innerHTML = "";
  names.forEach((n, i) => {
    const li = document.createElement("li");
    const span = document.createElement("span");
    span.textContent = n;
    const btn = document.createElement("button");
    btn.className = "remove";
    btn.title = "Remove";
    btn.textContent = "×";
    btn.onclick = () => {
      names.splice(i, 1);
      $("results").hidden = true;
      renderNames();
    };
    li.append(span, btn);
    list.append(li);
  });
  $("draw-btn").disabled = names.length < 3;
  $("draw-btn").textContent =
    names.length < 3 ? `🎁 Add at least ${3 - names.length} more` : `🎁 Draw! (${names.length} people)`;
}

function renderLinks(pairs) {
  const base = location.href.split("#")[0];
  const list = $("link-list");
  list.innerHTML = "";
  // Sort by giver so the order gives nothing away.
  [...pairs]
    .sort((a, b) => a.g.localeCompare(b.g))
    .forEach((p) => {
      const url = `${base}#g=${encode(p)}`;
      const li = document.createElement("li");
      const who = document.createElement("span");
      who.className = "who";
      who.textContent = p.g;
      const btn = document.createElement("button");
      btn.className = "copy small";
      btn.textContent = "Copy link";
      btn.onclick = async () => {
        try {
          await navigator.clipboard.writeText(url);
        } catch {
          window.prompt("Copy this link:", url);
          return;
        }
        btn.textContent = "Copied ✓";
        btn.classList.add("done");
      };
      li.append(who, btn);
      list.append(li);
    });
  $("results").hidden = false;
}

function initOrganiser() {
  $("organiser").hidden = false;

  $("add-form").onsubmit = (e) => {
    e.preventDefault();
    const name = $("name-input").value.trim();
    if (!name) return showError("Please type a name.");
    if (names.some((n) => n.toLowerCase() === name.toLowerCase()))
      return showError(`${name} is already on the list.`);
    showError("");
    names.push(name);
    $("name-input").value = "";
    $("name-input").focus();
    $("results").hidden = true;
    renderNames();
  };

  $("draw-btn").onclick = () => renderLinks(draw(names));
  $("redraw-btn").onclick = () => renderLinks(draw(names));
  renderNames();
}

// ---------- Reveal view ----------
function initReveal(code) {
  let pair;
  try {
    pair = decode(code);
    if (typeof pair.g !== "string" || typeof pair.r !== "string") throw new Error();
  } catch {
    $("bad-link").hidden = false;
    return;
  }
  $("reveal").hidden = false;
  $("giver-name").textContent = pair.g;
  $("unwrap-btn").onclick = () => {
    $("receiver-name").textContent = pair.r;
    $("unwrap-btn").hidden = true;
    $("match").hidden = false;
  };
}

// ---------- Snow ----------
function letItSnow() {
  const snow = $("snow");
  for (let i = 0; i < 40; i++) {
    const f = document.createElement("span");
    f.className = "flake";
    f.textContent = "❄";
    f.style.left = Math.random() * 100 + "vw";
    f.style.fontSize = 8 + Math.random() * 14 + "px";
    f.style.animationDuration = 6 + Math.random() * 10 + "s";
    f.style.animationDelay = -Math.random() * 16 + "s";
    snow.append(f);
  }
}

// ---------- Start ----------
letItSnow();
const match = location.hash.match(/^#g=(.+)$/);
if (match) initReveal(match[1]);
else initOrganiser();
