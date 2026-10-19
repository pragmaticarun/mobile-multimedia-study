/* Study site progress tracking (stored only in this browser's localStorage). */
(function () {
  const KEY = "mmstudy.progress.v1";
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || { weeks: {}, items: {} }; } catch (e) { return { weeks: {}, items: {} }; } };
  const save = (s) => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} };
  const state = load();
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  /* ---------- Home page ---------- */
  function initHome() {
    const cards = $$(".card[data-week]");
    if (!cards.length) return;
    let done = 0;
    cards.forEach((c) => {
      const w = c.dataset.week;
      if (state.weeks[w]) {
        done++;
        c.classList.add("completed");
        const b = $(".badge", c);
        if (b && c.dataset.available === "1") { b.className = "badge b-done"; b.textContent = "COMPLETED ✓"; }
      }
    });
    const total = cards.length;
    const el = $("#stat-done");
    if (el) el.textContent = `${done} / ${total}`;
    const bar = $("#bar-done");
    if (bar) bar.style.width = `${(100 * done) / total}%`;
  }

  /* ---------- Week page ---------- */
  function initWeek() {
    const art = $("article.content[data-week]");
    if (!art) return;
    const week = art.dataset.week;

    // Mark-complete button
    const btn = $("#mark-done");
    const paint = () => {
      if (!btn) return;
      const d = !!state.weeks[week];
      btn.textContent = d ? "✓ Week completed" : "Mark week as completed";
      btn.classList.toggle("done", d);
    };
    if (btn) btn.addEventListener("click", () => {
      if (state.weeks[week]) delete state.weeks[week]; else state.weeks[week] = new Date().toISOString().slice(0, 10);
      save(state); paint(); updateItems();
    });
    paint();

    // Exercise / section checkboxes
    const heads = $$("h3[id^='exercise-'], h2[id='self-test'], h2[id$='-self-test']", art);
    heads.forEach((h) => {
      const id = `${week}:${h.id}`;
      const lab = document.createElement("label");
      lab.className = "ex-check";
      const cb = document.createElement("input");
      cb.type = "checkbox"; cb.checked = !!state.items[id];
      cb.addEventListener("change", () => { if (cb.checked) state.items[id] = 1; else delete state.items[id]; save(state); updateItems(); });
      lab.appendChild(cb); lab.appendChild(document.createTextNode(" done"));
      h.appendChild(lab);
    });
    function updateItems() {
      const n = heads.filter((h) => state.items[`${week}:${h.id}`]).length;
      const out = $("#items-progress");
      if (out) out.textContent = `${n} of ${heads.length} exercises/self-test done`;
      $$(".toc a").forEach((a) => {
        const id = a.getAttribute("href").slice(1);
        const old = $(".chk", a); if (old) old.remove();
        if (state.items[`${week}:${id}`]) { const s = document.createElement("span"); s.className = "chk"; s.textContent = "✓"; a.appendChild(s); }
      });
    }
    updateItems();

    // Answer key: hidden until revealed
    const ak = $(".answer-key", art);
    if (ak) {
      ak.classList.add("hidden");
      const r = document.createElement("button");
      r.className = "btn secondary reveal"; r.type = "button"; r.textContent = "Show answers";
      r.addEventListener("click", () => { const h = ak.classList.toggle("hidden"); r.textContent = h ? "Show answers" : "Hide answers"; });
      const h2 = $("h2", ak); if (h2) h2.after(r); else ak.prepend(r);
    }

    // Reading progress bar + active TOC entry
    const bar = $(".readbar");
    const onScroll = () => {
      const r = art.getBoundingClientRect();
      const total = art.offsetHeight - window.innerHeight;
      const p = Math.min(1, Math.max(0, -r.top / (total > 0 ? total : 1)));
      if (bar) bar.style.width = `${(p * 100).toFixed(1)}%`;
    };
    window.addEventListener("scroll", onScroll, { passive: true }); onScroll();
    if ("IntersectionObserver" in window) {
      const links = new Map($$(".toc a").map((a) => [a.getAttribute("href").slice(1), a]));
      const obs = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) { links.forEach((a) => a.classList.remove("active")); const a = links.get(e.target.id); if (a) a.classList.add("active"); }
        });
      }, { rootMargin: "-10% 0px -80% 0px" });
      $$("h2[id], h3[id]", art).forEach((h) => obs.observe(h));
    }
  }

  document.addEventListener("DOMContentLoaded", () => { initHome(); initWeek(); });
})();
