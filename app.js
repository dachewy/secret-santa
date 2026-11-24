// Secret Santa with private links. No server needed.

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
  const stage = $("stage");
  const gift = $("gift");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const finish = () => {
    gift.hidden = true;
    stage.classList.add("revealed");
    if (!reduceMotion) confettiBurst();
  };

  gift.onclick = () => {
    $("receiver-name").textContent = pair.r;
    $("reveal-hint").hidden = true;
    if (reduceMotion) return finish();
    stage.classList.add("unwrapping");
    setTimeout(finish, 1600); // matches the CSS unwrapping sequence
  };
}

function confettiBurst() {
  const box = $("confetti");
  const colours = ["#c8102e", "#0f5132", "#f4c430", "#ffffff", "#2e8b57", "#ff6b6b"];
  for (let i = 0; i < 60; i++) {
    const p = document.createElement("span");
    const angle = Math.random() * Math.PI * 2;
    const dist = 90 + Math.random() * 130;
    p.style.setProperty("--c", colours[i % colours.length]);
    p.style.setProperty("--dx", Math.cos(angle) * dist + "px");
    p.style.setProperty("--dy", Math.sin(angle) * dist - 40 + "px");
    p.style.setProperty("--rot", Math.random() * 720 - 360 + "deg");
    p.style.animationDelay = Math.random() * 0.15 + "s";
    box.append(p);
  }
  setTimeout(() => (box.innerHTML = ""), 1800);
}

// ---------- Snow ----------
function letItSnow() {
  const snow = $("snow");
  const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const shapes = ["❄", "❅", "❆", "•"];
  for (let i = 0; i < (calm ? 20 : 80); i++) {
    const f = document.createElement("span");
    f.className = "flake";
    f.textContent = shapes[i % shapes.length];
    f.style.left = Math.random() * 100 + "vw";
    f.style.fontSize = 8 + Math.random() * 16 + "px";
    f.style.opacity = 0.4 + Math.random() * 0.6;
    f.style.setProperty("--sway", 15 + Math.random() * 40 + "px");
    f.style.animationDuration = (calm ? 30 : 8) + Math.random() * 12 + "s";
    f.style.animationDelay = -Math.random() * 20 + "s";
    snow.append(f);
  }
}

// ---------- Music: Jingle Bells (public domain), played with the Web Audio API ----------
const Music = (() => {
  const BEAT = 0.36; // seconds per beat
  const HZ = {
    C3: 130.81, D3: 146.83, F3: 174.61, G3: 196.0,
    C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99,
  };

  // Chorus melody as [note, beats]
  const jingleAllTheWay = [["E5",1],["E5",1],["E5",2],["E5",1],["E5",1],["E5",2],
    ["E5",1],["G5",1],["C5",1.5],["D5",0.5],["E5",4]];
  const ohWhatFun = [["F5",1],["F5",1],["F5",1.5],["F5",0.5],["F5",1],["E5",1],["E5",1],["E5",0.5],["E5",0.5]];
  const melody = [
    ...jingleAllTheWay,
    ...ohWhatFun, ["E5",1],["D5",1],["D5",1],["E5",1],["D5",2],["G5",2],
    ...jingleAllTheWay,
    ...ohWhatFun, ["G5",1],["G5",1],["F5",1],["D5",1],["C5",4],
  ];
  const bassPerBar = ["C3","C3","C3","C3","F3","C3","D3","G3","C3","C3","C3","C3","F3","C3","G3","C3"];
  const LOOP_BEATS = 64;

  // One loop of events, sorted by time
  const events = [];
  let beat = 0;
  for (const [note, len] of melody) {
    events.push({ beat, kind: "bell", hz: HZ[note], len: len * BEAT });
    beat += len;
  }
  bassPerBar.forEach((note, bar) => {
    events.push({ beat: bar * 4, kind: "bass", hz: HZ[note] });
    events.push({ beat: bar * 4 + 2, kind: "bass", hz: HZ[note] });
  });
  for (let b = 0; b < LOOP_BEATS; b++) events.push({ beat: b, kind: "jingle", accent: b % 2 === 0 });
  events.sort((a, b) => a.beat - b.beat);

  const VOLUME = 0.1;
  let ctx, master, mellow, timer, idx, loopStart;
  let playing = false;

  function setup() {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
    // Soft filter that rounds off the melody and bass so they don't sound like beeps
    mellow = ctx.createBiquadFilter();
    mellow.type = "lowpass";
    mellow.frequency.value = 2200;
    mellow.connect(master);
    ctx.onstatechange = () => api.onchange && api.onchange();
  }

  function envelope(t, peak, attack, decay, out) {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
    g.connect(out);
    return g;
  }

  function tone(hz, t, peak, attack, decay, out, type = "sine") {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.value = hz;
    o.connect(envelope(t, peak, attack, decay, out));
    o.start(t);
    o.stop(t + decay + 0.05);
  }

  // A soft music-box / celesta note: pure tone plus gentle overtones
  function musicBox(hz, t, len) {
    const decay = Math.max(len, 0.5) + 0.6;
    tone(hz, t, 0.45, 0.02, decay, mellow);
    tone(hz * 2, t, 0.12, 0.02, decay * 0.5, mellow);
    tone(hz * 3.01, t, 0.04, 0.02, decay * 0.3, mellow);
  }

  // One shake of sleigh bells: a cluster of tiny metal bells ringing a few ms apart
  function sleighBells(t, loud) {
    const bells = loud ? 5 : 3;
    for (let b = 0; b < bells; b++) {
      const start = t + Math.random() * 0.04;
      const base = 2800 + Math.random() * 2200;
      // Metal bells have uneven ("inharmonic") overtones, which gives the jingle
      for (const ratio of [1, 1.47, 2.09]) {
        tone(base * ratio, start, (loud ? 0.05 : 0.03) / ratio, 0.003, 0.18 + Math.random() * 0.12, master);
      }
    }
  }

  function play(ev, t) {
    if (ev.kind === "bell") musicBox(ev.hz, t, ev.len);
    else if (ev.kind === "bass") tone(ev.hz, t, 0.3, 0.03, 0.7, mellow, "triangle");
    else sleighBells(t, ev.accent);
  }

  // Schedule notes a little ahead of time so playback stays smooth
  function tick() {
    for (;;) {
      const ev = events[idx];
      const t = loopStart + ev.beat * BEAT;
      if (t > ctx.currentTime + 0.3) break;
      play(ev, t);
      if (++idx === events.length) {
        idx = 0;
        loopStart += LOOP_BEATS * BEAT;
      }
    }
  }

  const api = {
    onchange: null,
    // True only when sound is actually coming out (not blocked by the browser)
    get audible() { return playing && ctx.state === "running"; },
    start() {
      if (!ctx) setup();
      ctx.resume().catch(() => {}); // the browser may refuse until the visitor taps
      if (playing) return;
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setValueAtTime(VOLUME, ctx.currentTime);
      idx = 0;
      loopStart = ctx.currentTime + 0.1;
      timer = setInterval(tick, 100);
      playing = true;
    },
    stop() {
      if (!playing) return;
      clearInterval(timer);
      master.gain.setTargetAtTime(0, ctx.currentTime, 0.05); // quick fade out
      playing = false;
    },
  };
  return api;
})();

function initMusic() {
  const btn = $("music-btn");
  const savePref = (on) => { try { localStorage.setItem("ss-music", on ? "on" : "off"); } catch {} };
  let mutedBefore = false;
  try { mutedBefore = localStorage.getItem("ss-music") === "off"; } catch {}

  const refresh = () => {
    btn.textContent = Music.audible ? "🔇 Stop music" : "🎵 Play music";
    btn.setAttribute("aria-pressed", String(Music.audible));
  };
  Music.onchange = refresh;

  // Most browsers block sound until the visitor taps or types. So: try to play
  // straight away, and if that's blocked, start on their first interaction.
  const stopAutoStart = () => {
    document.removeEventListener("pointerdown", autoStart);
    document.removeEventListener("keydown", autoStart);
  };
  const autoStart = (e) => {
    if (e.target === btn) return; // the button handles itself
    stopAutoStart();
    Music.start();
    refresh();
  };

  btn.onclick = () => {
    stopAutoStart(); // the visitor has chosen; don't override it
    const turnOn = !Music.audible;
    turnOn ? Music.start() : Music.stop();
    savePref(turnOn);
    refresh();
  };

  if (!mutedBefore) {
    Music.start(); // autoplay attempt
    refresh();
    document.addEventListener("pointerdown", autoStart);
    document.addEventListener("keydown", autoStart);
  }
}

// ---------- Start ----------
letItSnow();
initMusic();
const match = location.hash.match(/^#g=(.+)$/);
if (match) initReveal(match[1]);
else initOrganiser();
