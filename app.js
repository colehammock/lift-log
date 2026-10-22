'use strict';
/* Lift Log: workout logger built on the Fundamentals Hypertrophy Program. All data lives in localStorage. */

const DATA = window.PROGRAM_DATA;
const KEY = 'liftlog.v1';

// Equipment and muscles for each exercise. Used for superset pairing and weekly volume.
const META = {
  'ASSISTED DIP': ['machine', 'chest triceps'],
  'BACK SQUAT': ['barbell', 'quads glutes', 'primary'],
  'BARBELL BENCH PRESS': ['barbell', 'chest triceps fdelts', 'primary'],
  'BARBELL BENT OVER ROW': ['barbell', 'back biceps rdelts'],
  'BARBELL HIP THRUST': ['barbell', 'glutes hams'],
  'BENT OVER REVERSE DUMBBELL FLYE': ['dumbbell', 'rdelts'],
  'BICYCLE CRUNCH': ['body', 'abs'],
  'CABLE FLYE': ['cable', 'chest'],
  'CABLE LATERAL RAISE': ['cable', 'sdelts'],
  'CABLE REVERSE FLYE': ['cable', 'rdelts'],
  'CABLE SEATED ROW': ['cable', 'back biceps'],
  'CABLE TRICEP KICKBACK': ['cable', 'triceps'],
  'CHEST-SUPPORTED T-BAR ROW': ['machine', 'back biceps rdelts'],
  'CLOSE-GRIP BENCH PRESS': ['barbell', 'chest triceps', 'primary'],
  'CRUNCH': ['body', 'abs'],
  'DEADLIFT': ['barbell', 'back hams glutes', 'primary'],
  'DUMBBELL FLOOR PRESS': ['dumbbell', 'chest triceps'],
  'DUMBBELL INCLINE PRESS': ['dumbbell', 'chest fdelts triceps'],
  'DUMBBELL LATERAL RAISE': ['dumbbell', 'sdelts'],
  'DUMBBELL ROW': ['dumbbell', 'back biceps'],
  'DUMBBELL SEATED SHOULDER PRESS': ['dumbbell', 'fdelts sdelts triceps'],
  'DUMBBELL SINGLE-LEG HIP THRUST': ['dumbbell', 'glutes hams'],
  'DUMBBELL SKULL CRUSHER': ['dumbbell', 'triceps'],
  'DUMBBELL SUPINATED CURL': ['dumbbell', 'biceps'],
  'DUMBBELL WALKING LUNGE': ['dumbbell', 'quads glutes'],
  'EZ BAR CURL': ['barbell', 'biceps'],
  'GOBLET SQUAT': ['dumbbell', 'quads glutes'],
  'HAMMER CURL': ['dumbbell', 'biceps'],
  'HANGING LEG RAISE': ['body', 'abs'],
  'LAT PULLDOWN': ['cable', 'back biceps'],
  'LEG CURL': ['machine', 'hams'],
  'LEG EXTENSION': ['machine', 'quads'],
  'LEG PRESS': ['machine', 'quads glutes'],
  'LYING LEG CURL': ['machine', 'hams'],
  'MACHINE INCLINE CHEST PRESS': ['machine', 'chest fdelts triceps'],
  'MACHINE SEATED HIP ABDUCTION': ['machine', 'glutes'],
  'NEUTRAL-GRIP PULLDOWN': ['cable', 'back biceps'],
  'OVERHEAD PRESS': ['barbell', 'fdelts sdelts triceps', 'primary'],
  'PEC DECK': ['machine', 'chest'],
  'PLANK': ['body', 'abs'],
  'REVERSE PEC DECK': ['machine', 'rdelts'],
  'REVERSE-GRIP LAT PULLDOWN': ['cable', 'back biceps'],
  'ROMANIAN DEADLIFT': ['barbell', 'hams glutes back'],
  'SEATED FACE PULL': ['cable', 'rdelts'],
  'SEATED LEG CURL': ['machine', 'hams'],
  'SINGLE-ARM CABLE CURL': ['cable', 'biceps'],
  'SINGLE-ARM PULLDOWN': ['cable', 'back biceps'],
  'SINGLE-ARM ROPE TRICEP EXTENSION': ['cable', 'triceps'],
  'SINGLE-LEG LEG EXTENSION': ['machine', 'quads'],
  'SINGLE-LEG LYING LEG CURL': ['machine', 'hams'],
  'STANDING CALF RAISE': ['machine', 'calves'],
};
const MUSCLE_LABEL = { chest: 'Chest', back: 'Back', fdelts: 'Front delts', sdelts: 'Side delts', rdelts: 'Rear delts', biceps: 'Biceps', triceps: 'Triceps', quads: 'Quads', hams: 'Hamstrings', glutes: 'Glutes', calves: 'Calves', abs: 'Abs' };
const HEAVY_LOWER = ['BACK SQUAT', 'DEADLIFT', 'ROMANIAN DEADLIFT', 'BARBELL HIP THRUST', 'LEG PRESS'];

// ---------- state ----------
function defaults() {
  return { units: 'lb', program: 'ul', week: 0, done: {}, sessions: [], active: null, swaps: {}, supersets: true, theme: 'auto' };
}
let S = load();
function load() {
  try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && s.sessions) return Object.assign(defaults(), s); } catch (e) {}
  return defaults();
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { toast('Could not save. Storage is full or blocked.'); }
}

// ---------- helpers ----------
const $ = (sel, el = document) => el.querySelector(sel);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const title = n => n.toLowerCase().replace(/(^|[\s\-(])([a-z])/g, (m, a, b) => a + b.toUpperCase()).replace(/\bEz\b/, 'EZ').replace(/\bT-bar\b/i, 'T-Bar');
const prog = () => DATA.programs[S.program];
const meta = n => {
  if (META[n]) return { eq: META[n][0], mus: META[n][1].split(' '), primary: META[n][2] === 'primary' };
  const u = n.toUpperCase();
  const eq = /DUMBBELL/.test(u) ? 'dumbbell' : /CABLE|PULLDOWN|ROPE/.test(u) ? 'cable' : /BARBELL|EZ BAR|SMITH|BENCH PRESS|SQUAT|DEADLIFT/.test(u) ? 'barbell' : /MACHINE|PRESS|DECK|CURL|EXTENSION/.test(u) ? 'machine' : 'body';
  return { eq, mus: [], primary: false };
};
const unit = () => S.units;
function inc(n) {
  const m = meta(n);
  if (m.eq === 'body') return 0;
  if (S.units === 'kg') return HEAVY_LOWER.includes(n) ? 5 : 2.5;
  return HEAVY_LOWER.includes(n) ? 10 : 5;
}
const roundTo = (w, step) => step ? Math.round(w / step) * step : w;
const isTime = r => /sec/i.test(r);
const repNum = r => parseInt(r, 10) || 0;
const e1rm = (w, r) => w * (1 + r / 30);
const fmtDate = t => new Date(t).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
const dayKey = t => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };
function toast(msg) {
  const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg;
  document.body.appendChild(t); setTimeout(() => t.remove(), 2200);
}

// ---------- scheduling ----------
function workoutMuscles(ex) {
  const set = new Set();
  ex.forEach(e => meta(e.n).mus.forEach(m => set.add(m)));
  return set;
}
// Picks the next logical workout in the current program week: the one not done yet that overlaps
// least with the muscles trained last session, ties broken by program order.
function nextWorkoutIndex() {
  const wos = prog().weeks[S.week];
  const done = S.done[S.program + ':' + S.week] || [];
  const remaining = wos.map((_, i) => i).filter(i => !done.includes(i));
  if (!remaining.length) return 0;
  const last = S.sessions.filter(s => s.program === S.program).slice(-1)[0];
  if (!last) return remaining[0];
  const lastM = workoutMuscles(last.ex);
  let best = remaining[0], bestScore = Infinity;
  remaining.forEach(i => {
    const m = workoutMuscles(wos[i].ex);
    let shared = 0; m.forEach(x => { if (lastM.has(x)) shared++; });
    if (shared < bestScore) { best = i; bestScore = shared; }
  });
  return best;
}

// ---------- supersets ----------
// Primary lifts stay as straight sets. Others pair first by shared equipment (dumbbell or cable),
// then short-rest accessories pair with a portable partner (dumbbells or bodyweight).
function buildBlocks(ex) {
  const items = ex.map((e, i) => ({ i, m: meta(e.n), rest: e.rest[0] }));
  const conflict = (a, b) => a.m.mus.some(x => b.m.mus.includes(x));
  const used = new Set();
  const pairs = {};
  const tryPair = (ok) => {
    items.forEach(a => {
      if (used.has(a.i) || a.m.primary) return;
      const b = items.find(b => b.i > a.i && !used.has(b.i) && !b.m.primary && !conflict(a, b) && ok(a, b));
      if (b) { used.add(a.i); used.add(b.i); pairs[a.i] = b.i; }
    });
  };
  if (S.supersets) {
    tryPair((a, b) => a.m.eq === b.m.eq && (a.m.eq === 'dumbbell' || a.m.eq === 'cable'));
    tryPair((a, b) => a.rest <= 1 && b.rest <= 1 && (['dumbbell', 'body'].includes(a.m.eq) || ['dumbbell', 'body'].includes(b.m.eq)));
  }
  const blocks = [];
  const placed = new Set();
  items.forEach(a => {
    if (placed.has(a.i)) return;
    if (pairs[a.i] !== undefined) { blocks.push([a.i, pairs[a.i]]); placed.add(a.i); placed.add(pairs[a.i]); }
    else if (!used.has(a.i)) { blocks.push([a.i]); placed.add(a.i); }
  });
  return blocks;
}

// ---------- progression ----------
function lastFor(n) {
  for (let i = S.sessions.length - 1; i >= 0; i--) {
    const e = S.sessions[i].ex.find(x => x.n === n && x.sets.some(s => s.done));
    if (e) return { e, at: S.sessions[i].at };
  }
  return null;
}
function suggestion(n, target) {
  const step = inc(n);
  const body = meta(n).eq === 'body';
  const last = lastFor(n);
  const r = repNum(target.r);
  if (!last) {
    return { w: '', reps: r, why: body ? 'First time. Hit the target with clean form.' : `First time. Pick a weight you could lift about ${r + (10 - target.rpe)} times, then do ${r}.` };
  }
  const done = last.e.sets.filter(s => s.done);
  const lastW = Math.max(...done.map(s => +s.w || 0));
  const lastR = repNum(last.e.target.r);
  const hitAll = done.length >= last.e.target.s && done.every(s => +s.r >= lastR);
  const days = (Date.now() - last.at) / 864e5;
  if (body) {
    if (hitAll && last.e.effort !== 'hard') return { w: lastW || '', reps: r, why: `Last time you hit every rep. Aim for ${r} or a couple more.` };
    return { w: lastW || '', reps: r, why: 'Aim to hit every rep this time.' };
  }
  if (r !== lastR && lastR && r) {
    const w = Math.max(step, Math.floor(e1rm(lastW, lastR) / (1 + r / 30) / step) * step);
    return { w, reps: r, why: `Reps changed from ${lastR} to ${r}, so the weight is adjusted to match.` };
  }
  if (days > 14) return { w: lastW, reps: r, why: 'It has been a couple of weeks, so start at your last weight.' };
  if (hitAll && last.e.effort === 'easy') return { w: lastW + 2 * step, reps: r, why: `It felt easy last time: +${2 * step} ${unit()}.` };
  if (hitAll && last.e.effort !== 'hard') return { w: lastW + step, reps: r, why: `You hit every rep last time: +${step} ${unit()}.` };
  if (hitAll) return { w: lastW, reps: r, why: 'All reps but it felt hard. Same weight; add when it feels easier.' };
  return { w: lastW, reps: r, why: `Same weight until you hit all ${last.e.target.s}×${lastR}.` };
}
function warmups(n, w) {
  if (!meta(n).primary || !w) return '';
  const bar = S.units === 'kg' ? 20 : 45;
  const st = S.units === 'kg' ? 2.5 : 5;
  const steps = [[0, 10], [0.5, 5], [0.7, 3], [0.85, 2]]
    .map(([p, r]) => [p ? Math.max(bar, roundTo(w * p, st)) : bar, r])
    .filter(([x], i, a) => x < w && (i === 0 || x > a[i - 1][0]));
  return steps.length ? 'Warm-up: ' + steps.map(([x, r]) => `${x}×${r}`).join(', ') : '';
}

// ---------- workout lifecycle ----------
function startWorkout(wi) {
  const wo = prog().weeks[S.week][wi];
  const ex = wo.ex.map(e => {
    const n = S.swaps[e.n] || e.n;
    const sug = suggestion(n, e);
    return {
      n, orig: e.n, cue: e.cue, rest: e.rest, why: sug.why,
      target: { s: e.s, r: e.r, rpe: e.rpe },
      sets: Array.from({ length: e.s }, () => ({ w: sug.w, r: sug.reps, done: false })),
      effort: null,
    };
  });
  S.active = { program: S.program, week: S.week, wi, name: wo.name, startedAt: Date.now(), ex, blocks: buildBlocks(ex), open: {} };
  save(); render();
  window.scrollTo(0, 0);
}
function finishWorkout() {
  const a = S.active;
  const ex = a.ex.filter(e => e.sets.some(s => s.done)).map(e => ({ n: e.n, orig: e.orig, target: e.target, effort: e.effort, sets: e.sets.filter(s => s.done).map(s => ({ w: +s.w || 0, r: +s.r || 0, done: true })) }));
  if (!ex.length) { S.active = null; save(); render(); return; }
  const prs = ex.filter(e => {
    const best = Math.max(...e.sets.map(s => e1rm(s.w, s.r)));
    const prev = S.sessions.flatMap(s => s.ex.filter(x => x.n === e.n)).flatMap(x => x.sets).map(s => e1rm(s.w, s.r));
    return prev.length && best > Math.max(...prev) && best > 0;
  }).map(e => title(e.n));
  S.sessions.push({ at: Date.now(), program: a.program, week: a.week, wi: a.wi, name: a.name, min: Math.round((Date.now() - a.startedAt) / 6e4), ex });
  const k = a.program + ':' + a.week;
  S.done[k] = Array.from(new Set([...(S.done[k] || []), a.wi]));
  S.active = null;
  let msg = 'Workout saved.';
  if (a.program === S.program && S.done[k].length >= prog().weeks[a.week].length) {
    if (S.week < prog().weeks.length - 1) { S.week++; msg = `Week ${a.week + 1} done. On to week ${S.week + 1}.`; }
    else { S.week = 0; Object.keys(S.done).filter(x => x.startsWith(S.program + ':')).forEach(x => delete S.done[x]); msg = 'You finished all 8 weeks! Starting again at week 1.'; }
  }
  save(); stopRest(); render();
  toast(prs.length ? `New best: ${prs.slice(0, 2).join(', ')}` : msg);
  window.scrollTo(0, 0);
}

// ---------- rest timer ----------
let restEnd = 0, restTotal = 0, restTick = null;
function startRest(sec) {
  restTotal = sec; restEnd = Date.now() + sec * 1000;
  $('#restBar').hidden = false; tickRest();
  clearInterval(restTick); restTick = setInterval(tickRest, 250);
}
function stopRest() { clearInterval(restTick); $('#restBar').hidden = true; $('#restBar').classList.remove('over'); }
function tickRest() {
  const left = Math.round((restEnd - Date.now()) / 1000);
  const bar = $('#restBar');
  bar.classList.toggle('over', left <= 0);
  const a = Math.abs(left);
  $('#restTime').textContent = (left < 0 ? '+' : '') + Math.floor(a / 60) + ':' + String(a % 60).padStart(2, '0');
  $('#restFill').style.width = Math.min(100, Math.max(0, (1 - left / restTotal) * 100)) + '%';
  if (left < -120) stopRest();
}
$('#restAdd').onclick = () => { restEnd += 30000; restTotal += 30; tickRest(); };
$('#restSkip').onclick = stopRest;

// ---------- sheet ----------
function openSheet(html, bind) {
  $('#sheetCard').innerHTML = html; $('#sheet').hidden = false;
  if (bind) bind($('#sheetCard'));
}
function closeSheet() { $('#sheet').hidden = true; }
$('#sheet').addEventListener('click', e => { if (e.target.id === 'sheet' || e.target.closest('[data-close]')) closeSheet(); });

function confirmSheet(text, yes, onYes, danger) {
  openSheet(`<h3>${esc(text)}</h3><div style="display:grid;gap:8px;margin-top:14px">
    <button class="btn ${danger ? 'danger' : ''}" id="cfYes">${esc(yes)}</button>
    <button class="btn secondary" data-close>Cancel</button></div>`,
    c => { $('#cfYes', c).onclick = () => { closeSheet(); onYes(); }; });
}

// ---------- views ----------
let tab = 'today';
document.querySelectorAll('.tabs button').forEach(b => b.onclick = () => { tab = b.dataset.tab; render(); window.scrollTo(0, 0); });
$('#settingsBtn').onclick = () => { tab = 'settings'; render(); };

function render() {
  document.querySelectorAll('.tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
  document.documentElement.dataset.theme = S.theme === 'auto' ? '' : S.theme;
  if (S.theme === 'auto') delete document.documentElement.dataset.theme;
  const v = $('#view');
  if (tab === 'today') { $('#topTitle').textContent = S.active ? S.active.name : 'Today'; v.innerHTML = S.active ? activeView() : todayView(); bindToday(v); }
  if (tab === 'stats') { $('#topTitle').textContent = 'Stats'; v.innerHTML = statsView(); bindStats(v); }
  if (tab === 'history') { $('#topTitle').textContent = 'History'; v.innerHTML = historyView(); bindHistory(v); }
  if (tab === 'settings') { $('#topTitle').textContent = 'Settings'; v.innerHTML = settingsView(); bindSettings(v); }
}

function todayView() {
  const wi = nextWorkoutIndex();
  const wo = prog().weeks[S.week][wi];
  const done = S.done[S.program + ':' + S.week] || [];
  const total = prog().weeks[S.week].length;
  const last = S.sessions[S.sessions.length - 1];
  const gap = last ? Math.floor((dayKey(Date.now()) - dayKey(last.at)) / 864e5) : null;
  const ex = wo.ex.map(e => ({ ...e, n: S.swaps[e.n] || e.n }));
  const blocks = buildBlocks(ex);
  let letter = 0;
  const list = blocks.map(b => {
    const L = b.length > 1 ? String.fromCharCode(65 + letter++) : '';
    return b.map((i, j) => `<li><span>${b.length > 1 ? `<span class="ss-tag">${L}${j + 1}</span>` : ''}${esc(title(ex[i].n))}</span><span class="muted">${ex[i].s}×${esc(ex[i].r)}</span></li>`).join('');
  }).join('');
  let note = '';
  if (gap === 0 && last) note = `<div class="pill good">You already trained today. Nice work.</div>`;
  else if (gap >= 3) note = `<div class="pill">${gap} days since your last workout. Picking up where you left off.</div>`;
  return `
  <div class="card hero">
    <div class="spread"><span class="muted small">Week ${S.week + 1} of ${prog().weeks.length} · ${done.length}/${total} done this week</span></div>
    <h2>${esc(wo.name)}</h2>
    <div class="meta">${wo.ex.length} exercises · ${(n => n + (n === 1 ? ' superset' : ' supersets'))(blocks.filter(b => b.length > 1).length)}</div>
    ${note ? `<div style="margin-top:8px">${note}</div>` : ''}
    <ul class="preview">${list}</ul>
  </div>
  <button class="btn" id="startBtn" data-wi="${wi}">Start workout</button>
  <button class="link-btn" id="pickBtn" style="display:block;margin:10px auto 0">Do a different workout</button>`;
}

function exHtml(a, i, tag) {
  const e = a.ex[i];
  const m = meta(e.n);
  const body = m.eq === 'body';
  const time = isTime(e.target.r);
  const open = a.open[i];
  const swapped = e.n !== e.orig;
  const sets = e.sets.map((s, k) => `
    <div class="set ${s.done ? 'done' : ''}" data-ex="${i}" data-set="${k}">
      <div class="n">${k + 1}</div>
      <div class="field"><input inputmode="decimal" data-f="w" value="${esc(s.w)}" placeholder="${body ? 'BW' : '–'}" aria-label="Weight"><span>${body ? '+' + unit() : unit()}</span></div>
      <div class="field"><input inputmode="numeric" data-f="r" value="${esc(s.r)}" aria-label="${time ? 'Seconds' : 'Reps'}"><span>${time ? 'sec' : 'reps'}</span></div>
      <button class="check" data-act="check" aria-label="Mark set done"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7"/></svg></button>
    </div>`).join('');
  const allDone = e.sets.every(s => s.done);
  return `<div class="ex">
    <div class="ex-name"><span>${tag ? `<span class="ss-tag">${tag}</span>` : ''}${esc(title(e.n))}</span>
      <button class="link-btn small" data-act="info" data-ex="${i}">${open ? 'Hide' : 'Form'}</button></div>
    <div class="ex-target">${e.target.s} sets × ${esc(e.target.r)} · effort ${e.target.rpe}/10 · rest ${e.rest[0]}–${e.rest[1]} min${swapped ? ` · <i>swapped from ${esc(title(e.orig))}</i>` : ''}</div>
    ${open ? `<div class="tip"><b>Form:</b> ${esc(e.cue)}<div class="row" style="margin-top:6px;gap:14px">${DATA.videos[e.n] ? `<a class="link-btn" href="${esc(DATA.videos[e.n])}" target="_blank" rel="noopener">Watch demo</a>` : ''}<button class="link-btn" data-act="swap" data-ex="${i}">Swap exercise</button></div></div>` : ''}
    <div class="tip">${esc(e.why)}</div>
    ${warmups(e.n, +e.sets[0].w) ? `<div class="warm">${esc(warmups(e.n, +e.sets[0].w))}</div>` : ''}
    <div class="sets">${sets}</div>
    ${allDone ? `<div class="effort" data-ex="${i}">
      ${[['easy', 'Felt easy'], ['ok', 'Just right'], ['hard', 'Really hard']].map(([k, l]) => `<button data-eff="${k}" class="${e.effort === k ? 'on' : ''}">${l}</button>`).join('')}
    </div>` : ''}
  </div>`;
}

function activeView() {
  const a = S.active;
  let letter = 0;
  const blocks = a.blocks.map(b => {
    const L = b.length > 1 ? String.fromCharCode(65 + letter++) : '';
    if (b.length === 1) return `<div class="block">${exHtml(a, b[0])}</div>`;
    return `<div class="block"><div class="block-head">Superset ${L} · alternate sets, rest after both</div>${b.map((i, j) => exHtml(a, i, L + (j + 1))).join('')}</div>`;
  }).join('');
  const doneSets = a.ex.reduce((t, e) => t + e.sets.filter(s => s.done).length, 0);
  const totalSets = a.ex.reduce((t, e) => t + e.sets.length, 0);
  return `<div class="muted small" style="margin:-4px 0 10px">Week ${a.week + 1} · ${doneSets}/${totalSets} sets done · tap ✓ after each set</div>
    ${blocks}
    <button class="btn" id="finishBtn">Finish workout</button>
    <button class="link-btn" id="cancelBtn" style="display:block;margin:10px auto 0;color:var(--danger)">Discard workout</button>`;
}

function bindToday(v) {
  const start = $('#startBtn', v);
  if (start) start.onclick = () => startWorkout(+start.dataset.wi);
  const pick = $('#pickBtn', v);
  if (pick) pick.onclick = () => {
    const done = S.done[S.program + ':' + S.week] || [];
    const wos = prog().weeks[S.week];
    openSheet(`<h3>Pick a workout</h3><p class="muted small" style="margin-top:0">Week ${S.week + 1}. Done ones are marked.</p>
      ${wos.map((w, i) => `<button class="choice" data-wi="${i}">${esc(w.name)}${done.includes(i) ? ' ✓' : ''}<small>${w.ex.slice(0, 3).map(e => title(e.n)).join(', ')}…</small></button>`).join('')}
      <button class="btn secondary" data-close>Cancel</button>`,
      c => c.querySelectorAll('[data-wi]').forEach(b => b.onclick = () => { closeSheet(); startWorkout(+b.dataset.wi); }));
  };
  if (!S.active) return;
  const a = S.active;
  v.oninput = e => {
    const row = e.target.closest('.set'); if (!row) return;
    const i = +row.dataset.ex, k = +row.dataset.set, f = e.target.dataset.f;
    const val = e.target.value.replace(',', '.');
    a.ex[i].sets[k][f] = val;
    // Typing a new weight fills it into the later sets that are not done yet.
    if (f === 'w') a.ex[i].sets.forEach((s, j) => { if (j > k && !s.done) { s.w = val; const inp = v.querySelector(`.set[data-ex="${i}"][data-set="${j}"] input[data-f="w"]`); if (inp) inp.value = val; } });
    save();
  };
  v.onclick = e => {
    const btn = e.target.closest('[data-act],[data-eff]'); if (!btn) return;
    if (btn.dataset.eff) { const i = +btn.closest('.effort').dataset.ex; a.ex[i].effort = btn.dataset.eff; save(); render(); return; }
    const act = btn.dataset.act;
    if (act === 'info') { const i = +btn.dataset.ex; a.open[i] = !a.open[i]; save(); render(); return; }
    if (act === 'swap') { swapSheet(+btn.dataset.ex); return; }
    if (act === 'check') {
      const row = btn.closest('.set'); const i = +row.dataset.ex, k = +row.dataset.set;
      const s = a.ex[i].sets[k];
      s.done = !s.done; save();
      if (s.done) {
        const block = a.blocks.find(b => b.includes(i));
        const partner = block.find(x => x !== i);
        // In a superset, rest only after both exercises are done for this round.
        const partnerDone = partner === undefined || !a.ex[partner].sets[k] || a.ex[partner].sets[k].done;
        if (partnerDone) startRest(a.ex[i].rest[0] * 60 + (a.ex[i].rest[0] >= 3 ? 0 : 30));
        else stopRest();
      }
      const y = window.scrollY; render(); window.scrollTo(0, y);
    }
  };
  $('#finishBtn', v).onclick = () => {
    const left = a.ex.reduce((t, e) => t + e.sets.filter(s => !s.done).length, 0);
    if (left) confirmSheet(`${left} sets aren't checked off. Finish anyway?`, 'Finish and save', finishWorkout);
    else finishWorkout();
  };
  $('#cancelBtn', v).onclick = () => confirmSheet('Discard this workout? Nothing will be saved.', 'Discard', () => { S.active = null; save(); stopRest(); render(); }, true);
}

function swapSheet(i) {
  const a = S.active, e = a.ex[i];
  const opts = [e.orig, ...(DATA.subs[e.orig] || []).map(x => x.toUpperCase())];
  openSheet(`<h3>Swap ${esc(title(e.orig))}</h3><p class="muted small" style="margin-top:0">Alternatives from the program. Your pick is remembered for next time.</p>
    ${opts.map(o => `<button class="choice ${o === e.n ? 'on' : ''}" data-o="${esc(o)}">${esc(title(o))}${o === e.orig ? '<small>As written in the program</small>' : ''}</button>`).join('')}
    <button class="btn secondary" data-close>Cancel</button>`,
    c => c.querySelectorAll('[data-o]').forEach(b => b.onclick = () => {
      const n = b.dataset.o;
      if (n === e.orig) delete S.swaps[e.orig]; else S.swaps[e.orig] = n;
      const sug = suggestion(n, e.target);
      e.n = n; e.why = sug.why;
      e.sets.forEach(s => { if (!s.done) { s.w = sug.w; s.r = sug.reps; } });
      a.blocks = buildBlocks(a.ex);
      save(); closeSheet(); render();
    }));
}

// ---------- stats ----------
function svgEl(w, h, inner, label) { return `<svg class="chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(label)}">${inner}</svg>`; }
function niceTicks(min, max, n = 4) {
  if (min === max) { min -= 1; max += 1; }
  const raw = (max - min) / n, mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 2.5, 5, 10].map(x => x * mag).find(x => x >= raw);
  const lo = Math.floor(min / step) * step, hi = Math.ceil(max / step) * step;
  const t = []; for (let x = lo; x <= hi + 1e-9; x += step) t.push(+x.toFixed(6));
  return t;
}
function lineChart(pts) {
  const W = 340, H = 180, L = 36, R = 10, T = 10, B = 24;
  const ys = pts.map(p => p.y), ticks = niceTicks(Math.min(...ys), Math.max(...ys));
  const y0 = ticks[0], y1 = ticks[ticks.length - 1];
  const x = i => L + (pts.length === 1 ? (W - L - R) / 2 : i * (W - L - R) / (pts.length - 1));
  const y = v => T + (H - T - B) * (1 - (v - y0) / (y1 - y0));
  const grid = ticks.map(t => `<line class="grid" x1="${L}" x2="${W - R}" y1="${y(t)}" y2="${y(t)}"/><text x="${L - 6}" y="${y(t) + 4}" text-anchor="end">${t}</text>`).join('');
  const path = pts.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.y).toFixed(1)}`).join('');
  const dots = pts.map((p, i) => `<circle class="dot" cx="${x(i)}" cy="${y(p.y)}" r="4"/>`).join('');
  const xl = [0, pts.length - 1].filter((v, i, a) => a.indexOf(v) === i).map(i => `<text x="${x(i)}" y="${H - 6}" text-anchor="${pts.length === 1 ? 'middle' : i ? 'end' : 'start'}">${new Date(pts[i].t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</text>`).join('');
  const hits = pts.map((p, i) => `<rect x="${x(i) - 14}" y="${T}" width="28" height="${H - T - B}" fill="transparent" data-i="${i}"/>`).join('');
  return svgEl(W, H, grid + `<line class="hair" id="hair" x1="0" x2="0" y1="${T}" y2="${H - B}" visibility="hidden"/>` + `<path class="ln" d="${path}"/>` + dots + xl + hits, 'Weight over time');
}
function barChart(bars) {
  const W = 340, H = 150, L = 28, R = 6, T = 10, B = 24;
  const max = Math.max(10, ...bars.map(b => b.v));
  const ticks = niceTicks(0, max, 3);
  const top = ticks[ticks.length - 1];
  const bw = (W - L - R) / bars.length;
  const y = v => T + (H - T - B) * (1 - v / top);
  const grid = ticks.map(t => `<line class="grid" x1="${L}" x2="${W - R}" y1="${y(t)}" y2="${y(t)}"/><text x="${L - 6}" y="${y(t) + 4}" text-anchor="end">${t}</text>`).join('');
  const rects = bars.map((b, i) => {
    const h = Math.max(0, y(0) - y(b.v)), bx = L + i * bw + 2, w = bw - 4, r = Math.min(4, h, w / 2);
    const yy = y(b.v);
    const d = h > 0 ? `M${bx},${y(0)} V${yy + r} Q${bx},${yy} ${bx + r},${yy} H${bx + w - r} Q${bx + w},${yy} ${bx + w},${yy + r} V${y(0)} Z` : '';
    return `${d ? `<path class="bar" d="${d}"/>` : ''}<text x="${bx + w / 2}" y="${H - 6}" text-anchor="middle">${esc(b.l)}</text><rect x="${bx}" y="${T}" width="${w}" height="${H - T - B}" fill="transparent" data-i="${i}"/>`;
  }).join('');
  return svgEl(W, H, grid + rects, 'Sets per week');
}
function weekStart(t) { const d = new Date(dayKey(t)); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d.getTime(); }

let statEx = null;
function statsView() {
  if (!S.sessions.length) return `<div class="empty">Finish your first workout and your progress charts show up here.</div>`;
  const now = Date.now(), wk = weekStart(now);
  const thisWeek = S.sessions.filter(s => s.at >= wk);
  const counts = {};
  S.sessions.forEach(s => s.ex.forEach(e => { counts[e.n] = (counts[e.n] || 0) + 1; }));
  const names = Object.keys(counts).sort((a, b) => counts[b] - counts[a] || a.localeCompare(b));
  if (!statEx || !counts[statEx]) statEx = names.find(n => meta(n).primary) || names[0];
  const pts = S.sessions.filter(s => s.ex.some(e => e.n === statEx)).map(s => {
    const e = s.ex.find(e => e.n === statEx);
    const top = e.sets.reduce((b, x) => (x.w > b.w || (x.w === b.w && x.r > b.r)) ? x : b, e.sets[0]);
    return { t: s.at, y: meta(statEx).eq === 'body' && !top.w ? top.r : top.w, r: top.r, w: top.w };
  });
  const bodyMode = meta(statEx).eq === 'body' && pts.every(p => !p.w);
  const first = pts[0], lastP = pts[pts.length - 1];
  const diff = lastP.y - first.y;
  const weeks = [];
  for (let i = 7; i >= 0; i--) {
    const s = wk - i * 7 * 864e5, e = s + 7 * 864e5;
    const sets = S.sessions.filter(x => x.at >= s && x.at < e).reduce((t, x) => t + x.ex.reduce((u, y) => u + y.sets.length, 0), 0);
    weeks.push({ v: sets, l: new Date(s).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' }), s });
  }
  const mus = {};
  Object.keys(MUSCLE_LABEL).forEach(m => mus[m] = 0);
  thisWeek.forEach(s => s.ex.forEach(e => meta(e.n).mus.forEach(m => { mus[m] += e.sets.length; })));
  const mMax = 20;
  const mrows = Object.keys(MUSCLE_LABEL).map(m => `<div class="mrow"><span>${MUSCLE_LABEL[m]}</span><div class="mbar"><div class="band" style="left:${10 / mMax * 100}%;width:${5 / mMax * 100}%"></div><div class="fill" style="width:${Math.min(mus[m], mMax) / mMax * 100}%"></div></div><span class="num">${mus[m]}</span></div>`).join('');
  const streak = (() => { let n = 0; for (let i = 0; i < 52; i++) { const s = wk - i * 7 * 864e5; if (S.sessions.some(x => x.at >= s && x.at < s + 7 * 864e5)) n++; else if (i > 0) break; } return n; })();
  return `
  <div class="tiles">
    <div class="tile"><div class="v">${thisWeek.length}</div><div class="l">Workouts this week</div></div>
    <div class="tile"><div class="v">${S.sessions.length}</div><div class="l">Total workouts</div></div>
    <div class="tile"><div class="v">${streak}</div><div class="l">Week streak</div></div>
  </div>
  <div class="card">
    <div class="chart-title">Progress by exercise</div>
    <div class="chart-sub">${bodyMode ? 'Best reps' : 'Heaviest set'} each workout${pts.length > 1 ? ` · ${diff >= 0 ? '+' : ''}${+diff.toFixed(1)} ${bodyMode ? 'reps' : unit()} since your first log` : ''}</div>
    <select id="exSel">${names.map(n => `<option value="${esc(n)}" ${n === statEx ? 'selected' : ''}>${esc(title(n))}</option>`).join('')}</select>
    <div id="lineWrap">${lineChart(pts)}</div>
    <div class="readout" id="lineRead">Latest: <b>${bodyMode ? lastP.r + ' reps' : lastP.w + ' ' + unit() + ' × ' + lastP.r}</b> on ${fmtDate(lastP.t)}</div>
  </div>
  <div class="card">
    <div class="chart-title">Sets per week</div>
    <div class="chart-sub">Working sets logged, last 8 weeks</div>
    <div id="barWrap">${barChart(weeks)}</div>
    <div class="readout" id="barRead">This week: <b>${weeks[7].v} sets</b></div>
  </div>
  <div class="card">
    <div class="chart-title">Sets per muscle this week</div>
    <div class="chart-sub">Green zone is 10–15 sets, the range the program recommends</div>
    ${mrows}
  </div>`;
}
function bindStats(v) {
  const sel = $('#exSel', v);
  if (!sel) return;
  sel.onchange = () => { statEx = sel.value; render(); };
  const pts = S.sessions.filter(s => s.ex.some(e => e.n === statEx)).map(s => { const e = s.ex.find(e => e.n === statEx); const top = e.sets.reduce((b, x) => (x.w > b.w || (x.w === b.w && x.r > b.r)) ? x : b, e.sets[0]); return { t: s.at, top }; });
  const lw = $('#lineWrap svg', v);
  const showLine = el => {
    const i = +el.dataset.i, p = pts[i]; if (!p) return;
    const hair = $('#hair', lw), r = el.getAttribute('x');
    hair.setAttribute('x1', +r + 14); hair.setAttribute('x2', +r + 14); hair.setAttribute('visibility', 'visible');
    $('#lineRead', v).innerHTML = `<b>${p.top.w ? p.top.w + ' ' + unit() + ' × ' + p.top.r : p.top.r + ' reps'}</b> on ${fmtDate(p.t)}`;
  };
  lw.addEventListener('pointerdown', e => { if (e.target.dataset.i) showLine(e.target); });
  lw.addEventListener('pointermove', e => { if (e.target.dataset.i) showLine(e.target); });
  const bw = $('#barWrap svg', v);
  const bars = Array.from(bw.querySelectorAll('rect[data-i]'));
  const weekVals = () => bars.map(b => b);
  bw.addEventListener('pointerdown', e => showBar(e.target));
  bw.addEventListener('pointermove', e => showBar(e.target));
  function showBar(el) {
    if (!el.dataset || el.dataset.i === undefined) return;
    const i = +el.dataset.i, wk = weekStart(Date.now()) - (7 - i) * 7 * 864e5;
    const sets = S.sessions.filter(x => x.at >= wk && x.at < wk + 7 * 864e5).reduce((t, x) => t + x.ex.reduce((u, y) => u + y.sets.length, 0), 0);
    $('#barRead', v).innerHTML = `Week of ${new Date(wk).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}: <b>${sets} sets</b>`;
    weekVals();
  }
}

// ---------- history ----------
function historyView() {
  if (!S.sessions.length) return `<div class="empty">No workouts yet. Your finished workouts show up here.</div>`;
  return S.sessions.map((s, idx) => ({ s, idx })).reverse().map(({ s, idx }) => {
    const sets = s.ex.reduce((t, e) => t + e.sets.length, 0);
    const vol = s.ex.reduce((t, e) => t + e.sets.reduce((u, x) => u + x.w * x.r, 0), 0);
    return `<details class="card hist"><summary><div class="spread"><b>${esc(s.name)}</b><span class="muted small">${fmtDate(s.at)}</span></div>
      <div class="muted small">${sets} sets · ${Math.round(vol).toLocaleString()} ${unit()} lifted${s.min ? ` · ${s.min} min` : ''}</div></summary>
      <table>${s.ex.map(e => `<tr><td>${esc(title(e.n))}</td><td>${e.sets.map(x => (x.w ? x.w + '×' : '') + x.r).join(', ')}</td></tr>`).join('')}</table>
      <button class="link-btn small" data-del="${idx}" style="color:var(--danger);margin-top:6px">Delete this workout</button></details>`;
  }).join('');
}
function bindHistory(v) {
  v.querySelectorAll('[data-del]').forEach(b => b.onclick = () => confirmSheet('Delete this workout from your history?', 'Delete', () => {
    S.sessions.splice(+b.dataset.del, 1); save(); render();
  }, true));
}

// ---------- settings ----------
function settingsView() {
  const p = prog();
  return `
  <div class="card">
    <label class="lbl" style="margin-top:0">Program</label>
    ${Object.entries(DATA.programs).map(([k, v]) => `<button class="choice ${k === S.program ? 'on' : ''}" data-prog="${k}">${esc(v.title)}<small>${k === 'ul' ? 'Your current split. Each muscle twice a week.' : k === 'fb' ? 'Best if you often miss days. Each muscle 3× a week.' : 'One or two muscle groups per day.'}</small></button>`).join('')}
    <label class="lbl">Program week</label>
    <select id="weekSel">${p.weeks.map((_, i) => `<option value="${i}" ${i === S.week ? 'selected' : ''}>Week ${i + 1}${i < 4 ? ' (strength base)' : ' (modified strength base)'}</option>`).join('')}</select>
    <label class="lbl">Units</label>
    <div class="seg" id="unitSeg"><button data-u="lb" class="${S.units === 'lb' ? 'on' : ''}">lb</button><button data-u="kg" class="${S.units === 'kg' ? 'on' : ''}">kg</button></div>
    <label class="lbl">Appearance</label>
    <div class="seg" id="themeSeg">${['auto', 'light', 'dark'].map(t => `<button data-t="${t}" class="${S.theme === t ? 'on' : ''}">${t[0].toUpperCase() + t.slice(1)}</button>`).join('')}</div>
    <div class="toggle"><span>Pair exercises into supersets</span><input type="checkbox" id="ssTog" ${S.supersets ? 'checked' : ''}></div>
  </div>
  <div class="card">
    <div class="chart-title">Backup</div>
    <p class="muted small" style="margin-top:2px">Your data is stored only on this phone. Save a backup now and then, for example to Files or iCloud Drive.</p>
    <div style="display:grid;gap:8px">
      <button class="btn secondary slim" id="exportBtn">Save backup file</button>
      <button class="btn secondary slim" id="importBtn">Restore from backup</button>
      <input type="file" id="importFile" accept="application/json,.json" hidden>
    </div>
  </div>
  <div class="card">
    <div class="chart-title">How the app decides</div>
    <p class="muted small" style="margin:4px 0 0">Today's workout is the next one you haven't done this week, chosen to rest the muscles you trained last time. Missed days don't matter; it just picks up where you left off. Weight goes up when you hit every rep, as the program recommends. Big lifts (squat, bench, deadlift, overhead press) get warm-up sets and no supersets. Other exercises pair up when they share equipment, so you don't have to walk across the gym.</p>
  </div>
  <button class="btn danger slim" id="resetBtn">Erase all data</button>
  <p class="muted small" style="text-align:center;margin-top:14px">Based on Jeff Nippard's Fundamentals Hypertrophy Program.</p>`;
}
function bindSettings(v) {
  v.querySelectorAll('[data-prog]').forEach(b => b.onclick = () => {
    if (b.dataset.prog === S.program) return;
    confirmSheet(`Switch to ${DATA.programs[b.dataset.prog].title}? Your history is kept.`, 'Switch', () => { S.program = b.dataset.prog; S.week = 0; S.active = null; save(); render(); });
  });
  $('#weekSel', v).onchange = e => { S.week = +e.target.value; save(); toast(`Now on week ${S.week + 1}`); };
  v.querySelectorAll('[data-u]').forEach(b => b.onclick = () => { S.units = b.dataset.u; save(); render(); });
  v.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { S.theme = b.dataset.t; save(); render(); });
  $('#ssTog', v).onchange = e => { S.supersets = e.target.checked; if (S.active) S.active.blocks = buildBlocks(S.active.ex); save(); };
  $('#exportBtn', v).onclick = async () => {
    const blob = new Blob([JSON.stringify(S)], { type: 'application/json' });
    const name = `liftlog-backup-${new Date().toISOString().slice(0, 10)}.json`;
    const file = new File([blob], name, { type: 'application/json' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file] }); return; } catch (e) { if (e.name === 'AbortError') return; } }
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click();
  };
  $('#importBtn', v).onclick = () => $('#importFile', v).click();
  $('#importFile', v).onchange = e => {
    const f = e.target.files[0]; if (!f) return;
    f.text().then(t => {
      const d = JSON.parse(t);
      if (!d || !Array.isArray(d.sessions)) throw new Error('bad');
      confirmSheet(`Restore ${d.sessions.length} workouts? This replaces what's on this phone.`, 'Restore', () => { S = Object.assign(defaults(), d); save(); render(); toast('Backup restored'); });
    }).catch(() => toast("That file isn't a Lift Log backup."));
  };
  $('#resetBtn', v).onclick = () => confirmSheet('Erase all workouts and settings? This cannot be undone.', 'Erase everything', () => { S = defaults(); save(); render(); }, true);
}

// Ask iOS to keep our storage, and register the offline cache.
if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
render();
