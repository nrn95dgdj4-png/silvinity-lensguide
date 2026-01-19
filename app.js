/* =========================
   Silvinity LensGuide PWA
   app.js
   ========================= */

const $ = (id) => document.getElementById(id);

/* Screens */
const screenHome = $("screenHome");
const screenModule = $("screenModule");
const screenDemo = $("screenDemo");

/* Home */
const moduleGrid = $("moduleGrid");
const search = $("search");
const homeBtn = $("homeBtn");

/* Module */
const moduleTitle = $("moduleTitle");
const moduleDesc = $("moduleDesc");
const demoList = $("demoList");
const backBtn = $("backBtn");

/* Demo */
const demoTitle = $("demoTitle");
const demoCaption = $("demoCaption");
const demoBody = $("demoBody");
const demoBackBtn = $("demoBackBtn");

/* UI */
const customerMode = $("customerMode");
const offlineStatus = $("offlineStatus");

let modules = [];
let currentModule = null;

/* =========================
   Navigation
   ========================= */
function setScreen(name) {
  screenHome.classList.add("hidden");
  screenModule.classList.add("hidden");
  screenDemo.classList.add("hidden");

  if (name === "home") screenHome.classList.remove("hidden");
  if (name === "module") screenModule.classList.remove("hidden");
  if (name === "demo") screenDemo.classList.remove("hidden");

  homeBtn.classList.toggle("hidden", name === "home");
}

/* =========================
   Customer Mode text simplifier
   ========================= */
function customerText(text) {
  if (!customerMode.checked || !text) return text;
  return text
    .replace(/anti[- ]?reflection/gi, "clear coating")
    .replace(/hydrophobic/gi, "water-repellent")
    .replace(/oleophobic/gi, "smudge-resistant")
    .replace(/anti[- ]?static/gi, "dust-resistant")
    .replace(/refractive index/gi, "material index");
}

/* =========================
   Load modules
   ========================= */
async function loadModules() {
  const res = await fetch("./modules.json");
  modules = await res.json();
  renderHome(modules);
}

/* =========================
   Home screen
   ========================= */
function renderHome(list) {
  moduleGrid.innerHTML = "";
  list.forEach(m => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div class="cardTop">
        <div class="cardIcon">${m.emoji || "👓"}</div>
        <span class="pill subtle">${m.demos.length} demo${m.demos.length > 1 ? "s" : ""}</span>
      </div>
      <div class="cardTitle">${m.title}</div>
      <div class="cardSub">${customerText(m.subtitle || "")}</div>
      <div class="pillRow">
        <span class="pill good">Offline</span>
        <span class="pill">Fast</span>
      </div>
    `;
    card.onclick = () => openModule(m.id);
    moduleGrid.appendChild(card);
  });
}

/* =========================
   Module screen
   ========================= */
function openModule(id) {
  currentModule = modules.find(m => m.id === id);
  if (!currentModule) return;

  moduleTitle.textContent = currentModule.title;
  moduleDesc.textContent = customerText(currentModule.description);

  demoList.innerHTML = "";
  currentModule.demos.forEach(d => {
    const item = document.createElement("div");
    item.className = "demoCard";
    item.innerHTML = `
      <p class="demoCardTitle">${d.title}</p>
      <p class="demoCardCap">${customerText(d.caption || "")}</p>
    `;
    item.onclick = () => openDemo(d);
    demoList.appendChild(item);
  });

  setScreen("module");
}

/* =========================
   Demo screen
   ========================= */
function openDemo(demo) {
  demoTitle.textContent = demo.title;
  demoCaption.textContent = customerText(demo.caption || "");
  demoBody.innerHTML = "";

  switch (demo.type) {
    case "splitCompare":
      demoBody.appendChild(makeSplitCompare(demo.before, demo.after));
      break;
    case "coatingToggles":
      demoBody.appendChild(makeCoatingToggles());
      break;
    case "photochromic":
      demoBody.appendChild(makePhotochromic());
      break;
    case "thicknessCalculator":
      demoBody.appendChild(makeThicknessCalculator());
      break;
    default:
      demoBody.innerHTML = "<div class='panel' style='padding:14px'>Demo coming soon</div>";
  }

  setScreen("demo");
}

/* =========================
   Split Compare (Before/After)
   ========================= */
function makeSplitCompare(beforeSrc, afterSrc) {
  const panel = document.createElement("div");
  panel.className = "panel";

  const wrap = document.createElement("div");
  wrap.className = "splitWrap";

  const before = new Image();
  before.src = beforeSrc;

  const after = new Image();
  after.src = afterSrc;
  after.className = "splitAfter";

  const handle = document.createElement("div");
  handle.className = "splitHandle";

  const knob = document.createElement("div");
  knob.className = "knob";
  knob.textContent = "⇆";

  wrap.append(before, after, handle, knob);

  const controls = document.createElement("div");
  controls.className = "demoControls";
  controls.innerHTML = `
    <span class="pill subtle">Before</span>
    <input type="range" class="range" min="0" max="100" value="50">
    <span class="pill subtle">After</span>
  `;

  const range = controls.querySelector("input");

  const setPos = (pct) => {
    after.style.clipPath = `inset(0 ${100 - pct}% 0 0)`;
    handle.style.left = `${pct}%`;
    knob.style.left = `${pct}%`;
  };

  setPos(50);

  range.oninput = () => setPos(range.value);

  wrap.onpointerdown = e => {
    wrap.setPointerCapture(e.pointerId);
    move(e);
  };
  wrap.onpointermove = e => move(e);

  function move(e) {
    const r = wrap.getBoundingClientRect();
    const x = Math.min(Math.max(e.clientX - r.left, 0), r.width);
    const pct = (x / r.width) * 100;
    range.value = pct;
    setPos(pct);
  }

  panel.append(wrap, controls);
  return panel;
}

/* =========================
   Coating Stack
   ========================= */
function makeCoatingToggles() {
  const panel = document.createElement("div");
  panel.className = "panel stackBox";

  const state = {
    ar: true,
    hard: true,
    hydro: true,
    oleo: true,
    antistatic: false
  };

  const preview = document.createElement("div");
  preview.className = "stackPreview";

  const title = document.createElement("div");
  title.style.fontWeight = "800";
  title.textContent = "Coating Stack";

  const sub = document.createElement("div");
  sub.className = "muted";

  const pills = document.createElement("div");
  pills.className = "pillRow";

  preview.append(title, sub, pills);

  const toggles = document.createElement("div");
  toggles.className = "stackToggles";

  const map = {
    ar: "Anti-Reflection",
    hard: "Hard Coat",
    hydro: "Water-Repellent",
    oleo: "Smudge-Resistant",
    antistatic: "Dust-Resistant"
  };

  const update = () => {
    const active = Object.keys(state).filter(k => state[k]);
    sub.textContent = customerMode.checked
      ? `${active.length} benefits selected`
      : `${active.length} layers enabled`;

    pills.innerHTML = "";
    active.forEach(k => {
      const p = document.createElement("span");
      p.className = "pill";
      p.textContent = customerText(map[k]);
      pills.appendChild(p);
    });
  };

  Object.keys(map).forEach(k => {
    const row = document.createElement("label");
    row.innerHTML = `
      <span>${customerText(map[k])}</span>
      <input type="checkbox" ${state[k] ? "checked" : ""}>
    `;
    row.querySelector("input").onchange = e => {
      state[k] = e.target.checked;
      update();
    };
    toggles.appendChild(row);
  });

  panel.append(preview, toggles);
  update();
  return panel;
}

/* =========================
   Photochromic Demo
   ========================= */
function makePhotochromic() {
  const panel = document.createElement("div");
  panel.className = "panel photoBox";

  const stage = document.createElement("div");
  stage.className = "photoStage";

  const tint = document.createElement("div");
  tint.className = "photoTint";

  const label = document.createElement("div");
  label.className = "photoMid";
  label.innerHTML = `<span>Photochromic Lens</span><span id="uvLabel">UV 20%</span>`;

  stage.append(tint, label);

  const controls = document.createElement("div");
  controls.className = "demoControls";
  controls.innerHTML = `
    <span class="pill subtle">Indoor</span>
    <input type="range" class="range" min="0" max="100" value="20">
    <span class="pill subtle">Outdoor</span>
  `;

  const range = controls.querySelector("input");
  const uvLabel = label.querySelector("#uvLabel");

  const update = v => {
    tint.style.opacity = Math.min(0.1 + v / 120, 0.85);
    uvLabel.textContent = `UV ${v}%`;
  };

  range.oninput = () => update(range.value);
  update(20);

  panel.append(stage, controls);
  return panel;
}

/* =========================
   Thickness Calculator
   ========================= */
function makeThicknessCalculator() {
  const panel = document.createElement("div");
  panel.className = "panel thickBox";

  const sphere = document.createElement("input");
  sphere.type = "number";
  sphere.step = "0.25";
  sphere.value = "-3.00";
  sphere.className = "num";

  const material = document.createElement("select");
  material.className = "select";
  material.innerHTML = `
    <option value="1.50">1.50</option>
    <option value="1.56">1.56</option>
    <option value="1.60" selected>1.60</option>
    <option value="1.67">1.67</option>
    <option value="1.74">1.74</option>
  `;

  const barWrap = document.createElement("div");
  barWrap.className = "barWrap";
  const bar = document.createElement("div");
  bar.className = "bar";
  barWrap.appendChild(bar);

  const note = document.createElement("div");
  note.className = "note";
  note.textContent = "Visual estimate only. Higher index usually means thinner lenses.";

  const calc = () => {
    const p = Math.abs(parseFloat(sphere.value) || 0);
    const idx = parseFloat(material.value);
    const score = (p * 10) / Math.max(1.2, (idx - 1.35) * 10);
    const pct = Math.min(95, Math.max(10, (score / 25) * 100));
    bar.style.width = pct + "%";
  };

  sphere.oninput = calc;
  material.onchange = calc;
  calc();

  panel.append(
    document.createTextNode("Sphere (D) "), sphere,
    document.createTextNode(" Material "), material,
    barWrap,
    note
  );

  return panel;
}

/* =========================
   Search
   ========================= */
search.oninput = () => {
  const q = search.value.toLowerCase();
  if (!q) return renderHome(modules);
  renderHome(modules.filter(m =>
    (m.title + m.subtitle + m.description).toLowerCase().includes(q)
  ));
};

/* =========================
   Buttons
   ========================= */
homeBtn.onclick = () => setScreen("home");
backBtn.onclick = () => setScreen("home");
demoBackBtn.onclick = () => setScreen("module");

/* =========================
   Offline indicator
   ========================= */
function updateOffline() {
  offlineStatus.textContent = navigator.onLine ? "Online (cached)" : "Offline";
  offlineStatus.className = "pill " + (navigator.onLine ? "warn" : "good");
}
window.addEventListener("online", updateOffline);
window.addEventListener("offline", updateOffline);
updateOffline();

/* =========================
   Service Worker
   ========================= */
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./service-worker.js");
}

/* =========================
   Init
   ========================= */
loadModules();
setScreen("home");
