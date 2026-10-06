/* Poise's ML Lab — interactive model labs. Every lab exposes its intermediate values. */
window.LABS = (function () {
  "use strict";

  const CW = 720, CH = 440;
  const css = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim() || "#888";
  const C = () => ({ ink: css("--ink"), soft: css("--ink-soft"), grape: css("--grape"), pink: css("--bubblegum"),
    mint: css("--mint"), sun: css("--sun"), tan: css("--tangerine"), line: css("--line"), surf: css("--surface") });
  const n2 = v => (Math.round(v * 100) / 100).toFixed(2);
  const n3 = v => (Math.round(v * 1000) / 1000).toFixed(3);
  const el = h => { const d = document.createElement("div"); d.innerHTML = h.trim(); return d.firstElementChild; };
  const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");

  /* shared lab shell: canvas left, knobs right, readouts + trace below */
  function shell(host, cfg) {
    host.innerHTML = "";
    host.appendChild(el('<div class="eyebrow">Model lab</div>'));
    host.appendChild(el("<h2 style=\"margin:4px 0 6px\">" + esc(cfg.title) + "</h2>"));
    host.appendChild(el('<p class="prose" style="margin:0 0 14px">' + cfg.blurb + "</p>"));
    const lab = el('<div class="lab"></div>');
    const left = el('<div style="min-width:0"></div>');
    const cv = el('<canvas width="' + CW + '" height="' + (cfg.h || CH) + '"></canvas>');
    left.appendChild(cv);
    const ro = el('<div class="readouts" style="margin-top:12px"></div>');
    left.appendChild(ro);
    const knobs = el('<div class="knobs"></div>');
    lab.appendChild(left); lab.appendChild(knobs); host.appendChild(lab);
    const trace = el('<div style="margin-top:16px"></div>');
    host.appendChild(trace);

    const K = {};
    (cfg.knobs || []).forEach(k => {
      if (k.type === "btn") {
        const b = el('<button class="btn ' + (k.cls || "ghost") + ' sm">' + k.label + "</button>");
        b.addEventListener("click", k.onClick);
        knobs.appendChild(b); K[k.id] = b; return;
      }
      if (k.type === "check") {
        const w = el('<label class="knob" style="display:flex;gap:8px;align-items:center;font-family:var(--display);font-weight:800;font-size:13px">' +
          '<input type="checkbox" ' + (k.val ? "checked" : "") + ' style="width:18px;height:18px;accent-color:var(--grape)"><span>' + k.label + "</span></label>");
        const i = w.querySelector("input");
        i.addEventListener("change", () => cfg.draw());
        knobs.appendChild(w); K[k.id] = { get: () => i.checked }; return;
      }
      const w = el('<div class="knob"><label><span>' + k.label + "</span><b></b></label>" +
        '<input type="range" min="' + k.min + '" max="' + k.max + '" step="' + k.step + '" value="' + k.val + '"></div>');
      const i = w.querySelector("input"), out = w.querySelector("b");
      const upd = () => { out.textContent = (k.fmt || n2)(+i.value); };
      i.addEventListener("input", () => { upd(); cfg.draw(); });
      upd(); knobs.appendChild(w);
      K[k.id] = { get: () => +i.value, set: v => { i.value = v; upd(); } };
    });
    (cfg.notes || []).forEach(t => knobs.appendChild(el('<p style="font-size:12.5px;font-weight:700;color:var(--ink-soft);margin:0">' + t + "</p>")));

    const api = {
      cv: cv, ctx: cv.getContext("2d"), K: K, W: CW, H: cfg.h || CH,
      ro(items) { ro.innerHTML = items.map(i => '<div class="ro' + (i.cls ? " " + i.cls : "") + '"><span>' + i.k + "</span><b>" + i.v + "</b></div>").join(""); },
      trace(title, rows) {
        trace.innerHTML = '<div class="eyebrow">' + title + '</div><div class="trace" style="margin-top:8px">' +
          rows.map((r, i) => (i ? '<div class="arrowdown">↓</div>' : "") +
            '<div class="tstep done"><span class="idx">' + (i + 1) + '</span><div style="min-width:0"><div class="lbl">' +
            r[0] + '</div><div style="font-weight:700;font-family:var(--mono);font-size:13px;overflow-wrap:anywhere">' + r[1] + "</div></div>" +
            (r[2] !== undefined ? '<span class="val">' + r[2] + "</span>" : "") + "</div>").join("") + "</div>";
      },
      html(h) { trace.innerHTML = h; },
      table(head, rows, hotIdx) {
        return '<div class="tablewrap"><table><thead><tr>' + head.map(h => "<th>" + h + "</th>").join("") +
          "</tr></thead><tbody>" + rows.map((r, i) => '<tr' + (hotIdx === i ? ' class="hot"' : "") + ">" +
            r.map(c => "<td>" + c + "</td>").join("") + "</tr>").join("") + "</tbody></table></div>";
      },
      clear() { const c = api.ctx, k = C(); c.clearRect(0, 0, CW, api.H); c.fillStyle = k.surf; c.fillRect(0, 0, CW, api.H); }
    };
    return api;
  }

  /* axis plotter */
  function plot(api, box) {
    const { x0 = 60, y0 = 30, x1 = CW - 24, y1 = api.H - 44 } = box || {};
    const k = C(), c = api.ctx;
    const dom = box.dom, rng = box.rng;
    const sx = v => x0 + (v - dom[0]) / (dom[1] - dom[0]) * (x1 - x0);
    const sy = v => y1 - (v - rng[0]) / (rng[1] - rng[0]) * (y1 - y0);
    const ix = px => dom[0] + (px - x0) / (x1 - x0) * (dom[1] - dom[0]);
    const iy = py => rng[0] + (y1 - py) / (y1 - y0) * (rng[1] - rng[0]);
    c.strokeStyle = k.soft; c.globalAlpha = .22; c.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const yy = y0 + (y1 - y0) * i / 5, xx = x0 + (x1 - x0) * i / 5;
      c.beginPath(); c.moveTo(x0, yy); c.lineTo(x1, yy); c.stroke();
      c.beginPath(); c.moveTo(xx, y0); c.lineTo(xx, y1); c.stroke();
    }
    c.globalAlpha = 1; c.strokeStyle = k.ink; c.lineWidth = 2.5;
    c.beginPath(); c.moveTo(x0, y0); c.lineTo(x0, y1); c.lineTo(x1, y1); c.stroke();
    c.fillStyle = k.soft; c.font = "600 12px ui-monospace,monospace"; c.textAlign = "center";
    for (let i = 0; i <= 5; i++) {
      const v = dom[0] + (dom[1] - dom[0]) * i / 5;
      c.fillText(Math.abs(v) < 100 ? n2(v) : v.toFixed(0), x0 + (x1 - x0) * i / 5, y1 + 17);
    }
    c.textAlign = "right";
    for (let i = 0; i <= 5; i++) {
      const v = rng[0] + (rng[1] - rng[0]) * i / 5;
      c.fillText(Math.abs(v) < 100 ? n2(v) : v.toFixed(0), x0 - 7, y1 - (y1 - y0) * i / 5 + 4);
    }
    c.textAlign = "center"; c.fillStyle = k.ink; c.font = "800 13px system-ui";
    if (box.xl) c.fillText(box.xl, (x0 + x1) / 2, api.H - 6);
    if (box.yl) { c.save(); c.translate(14, (y0 + y1) / 2); c.rotate(-Math.PI / 2); c.fillText(box.yl, 0, 0); c.restore(); }
    return { sx, sy, ix, iy, x0, x1, y0, y1 };
  }
  function dot(c, x, y, r, fill, line) {
    c.beginPath(); c.arc(x, y, r, 0, 7); c.fillStyle = fill; c.fill();
    c.lineWidth = 2.5; c.strokeStyle = line; c.stroke();
  }
  function line(c, a, b, d, e, col, w, dash) {
    c.save(); c.setLineDash(dash || []); c.strokeStyle = col; c.lineWidth = w || 3;
    c.beginPath(); c.moveTo(a, b); c.lineTo(d, e); c.stroke(); c.restore();
  }

  /* ================================================================ 34 linreg */
  function linreg(host, P) {
    const X = [1, 2, 3, 4, 5], Y = [2, 4, 5, 4, 5];
    const mx = 3, my = 4;
    const mOpt = X.reduce((a, x, i) => a + (x - mx) * (Y[i] - my), 0) / X.reduce((a, x) => a + (x - mx) ** 2, 0);
    const cOpt = my - mOpt * mx;
    const api = shell(host, {
      title: "Simple linear regression — drag the line, watch every residual",
      blurb: "Five points. Two numbers to choose. The residual bars are the errors OLS squares and adds up; the loss surface on the right shows where you are in (slope, intercept) space.",
      knobs: [
        { id: "m", label: "slope m", min: -1, max: 3, step: .05, val: 1 },
        { id: "c", label: "intercept c", min: -2, max: 6, step: .05, val: 1 },
        { id: "sq", label: "show squared errors", type: "check", val: true },
        { id: "opt", label: "🎯 Jump to the OLS solution", type: "btn", cls: "mint", onClick: () => { api.K.m.set(mOpt); api.K.c.set(cOpt); draw(); P.say("That is the exact minimum. No search, no learning rate — one formula: covariance over variance.", "chef"); } },
        { id: "bad", label: "😈 BREAK IT: add an outlier", type: "btn", cls: "pink", onClick: () => { out = !out; draw(); P.say(out ? "One point at y=20 and the whole line tilts. That is why squared error and outliers are enemies." : "Outlier gone. The line relaxes.", "evil"); } }
      ],
      notes: ["Residual = y − ŷ. OLS picks the (m, c) that minimises the sum of the squares of those bars — nothing else."],
      draw: () => draw()
    });
    let out = false;
    function draw() {
      const k = C(), c = api.ctx, m = api.K.m.get(), cc = api.K.c.get();
      const xs = out ? X.concat([5.6]) : X, ys = out ? Y.concat([20]) : Y;
      api.clear();
      const rmax = out ? 22 : 7;
      const g = plot(api, { dom: [0, 6.2], rng: [-1, rmax], xl: "x (ad spend, ₹000)", yl: "y (revenue)", x1: CW - 230 });
      // line
      line(c, g.sx(0), g.sy(cc), g.sx(6.2), g.sy(m * 6.2 + cc), k.grape, 4);
      let sse = 0;
      xs.forEach((x, i) => {
        const yh = m * x + cc, e = ys[i] - yh; sse += e * e;
        if (api.K.sq.get()) {
          const side = Math.abs(g.sy(0) - g.sy(e));
          c.fillStyle = k.sun; c.globalAlpha = .4;
          c.fillRect(g.sx(x), Math.min(g.sy(ys[i]), g.sy(yh)), Math.min(side, 70), Math.abs(g.sy(ys[i]) - g.sy(yh)));
          c.globalAlpha = 1;
        }
        line(c, g.sx(x), g.sy(ys[i]), g.sx(x), g.sy(yh), k.pink, 3, [5, 4]);
        dot(c, g.sx(x), g.sy(ys[i]), 7, k.mint, k.line);
        dot(c, g.sx(x), g.sy(yh), 4.5, k.grape, k.line);
      });
      // loss surface (m on x, c on y) as a small heat panel
      const px0 = CW - 205, py0 = 40, pw = 180, ph = 180;
      const L = (mm, ccc) => xs.reduce((a, x, i) => a + (ys[i] - mm * x - ccc) ** 2, 0) / xs.length;
      let lo = 1e9, hi = 0;
      const grid = [];
      for (let j = 0; j < 36; j++) { grid[j] = []; for (let i = 0; i < 36; i++) {
        const v = L(-1 + 4 * i / 35, -2 + 8 * j / 35); grid[j][i] = v; lo = Math.min(lo, v); hi = Math.max(hi, v); } }
      for (let j = 0; j < 36; j++) for (let i = 0; i < 36; i++) {
        const t = Math.pow((grid[j][i] - lo) / (hi - lo), .32);
        c.fillStyle = "hsl(" + (265 - 215 * (1 - t)) + ",78%," + (28 + 52 * t) + "%)";
        c.fillRect(px0 + i * pw / 36, py0 + ph - (j + 1) * ph / 36, pw / 36 + 1, ph / 36 + 1);
      }
      c.strokeStyle = k.ink; c.lineWidth = 2.5; c.strokeRect(px0, py0, pw, ph);
      dot(c, px0 + (m + 1) / 4 * pw, py0 + ph - (cc + 2) / 8 * ph, 6, k.sun, k.line);
      dot(c, px0 + (mOpt + 1) / 4 * pw, py0 + ph - (cOpt + 2) / 8 * ph, 5, k.mint, k.line);
      c.fillStyle = k.ink; c.font = "800 11px system-ui"; c.textAlign = "left";
      c.fillText("loss surface  (m →, c ↑)", px0, py0 - 8);
      c.font = "700 10px system-ui"; c.fillStyle = k.soft;
      c.fillText("● you   ● minimum", px0, py0 + ph + 14);

      const mse = sse / xs.length;
      const ssTot = ys.reduce((a, y) => a + (y - ys.reduce((s, v) => s + v, 0) / ys.length) ** 2, 0);
      api.ro([
        { k: "slope m", v: n2(m) }, { k: "intercept c", v: n2(cc) },
        { k: "SSE", v: n2(sse) }, { k: "MSE", v: n2(mse) },
        { k: "RMSE", v: n2(Math.sqrt(mse)) },
        { k: "R²", v: n3(1 - sse / ssTot), cls: 1 - sse / ssTot > .5 ? "good" : "bad" },
        { k: "best possible SSE", v: n2(xs.reduce((a, x, i) => a + (ys[i] - mOpt * x - cOpt) ** 2, 0)) }
      ]);
      api.html('<div class="eyebrow">Every point, every error — this is the whole of OLS</div><div style="margin-top:8px">' +
        api.table(["x", "y", "ŷ = mx + c", "residual", "squared"],
          xs.map((x, i) => [x, ys[i], n2(m * x + cc), n2(ys[i] - m * x - cc), n2((ys[i] - m * x - cc) ** 2)])) +
        '</div><p style="font-weight:800;margin:10px 0 0">Sum of the last column = SSE = ' + n2(sse) +
        ". OLS minimises exactly that, and the closed form gives m = " + n2(mOpt) + ", c = " + n2(cOpt) + ".</p>");
    }
    draw(); P.say("Move the slope. Watch the pink bars and the dot on the loss surface move together. That dot IS your model.", "brain");
  }

  /* ================================================================ 37 gradient descent */
  function gd(host, P) {
    const X = [1, 2, 3, 4, 5], Y = [2, 4, 5, 4, 5];
    const L = m => X.reduce((a, x, i) => a + (Y[i] - m * x) ** 2, 0) / X.length;
    const dL = m => X.reduce((a, x, i) => a - 2 * x * (Y[i] - m * x), 0) / X.length;
    let m = 0.1, hist = [0.1], steps = 0;
    const api = shell(host, {
      title: "Gradient descent — look at the slope, then yeet yourself downhill",
      blurb: "The curve is the real loss J(m) for those five points, with the intercept fixed at 0. Poise stands on it. Each step computes the slope at his feet and moves him against it.",
      knobs: [
        { id: "lr", label: "learning rate η", min: .005, max: .14, step: .005, val: .03, fmt: n3 },
        { id: "start", label: "start m (then press Reset)", min: -0.5, max: 3, step: .1, val: .1,
          fmt: v => n2(v) },
        { id: "one", label: "▶ One step", type: "btn", cls: "grape", onClick: () => step() },
        { id: "run", label: "⏩ Run 20 steps", type: "btn", cls: "mint", onClick: () => { let i = 0; const t = setInterval(() => { step(true); if (++i >= 20) clearInterval(t); }, 70); } },
        { id: "reset", label: "↺ Reset to start", type: "btn", onClick: () => { m = api.K.start.get(); hist = [m]; steps = 0; draw(); } },
        { id: "boom", label: "😈 BREAK IT: η = 0.14", type: "btn", cls: "pink", onClick: () => { api.K.lr.set(.14); m = api.K.start.get(); hist = [m]; steps = 0; draw(); P.say("Now press One step a few times. Watch it overshoot, land somewhere steeper, and overshoot harder. That is divergence.", "evil"); } }
      ],
      notes: ["The update is literally: new = old − η × slope. Nothing is hidden. If the slope is positive, m goes down; if negative, m goes up."],
      draw: () => draw()
    });
    function step(quiet) {
      const g = dL(m), lr = api.K.lr.get();
      m = m - lr * g; hist.push(m); steps++;
      draw();
      if (!quiet) {
        if (Math.abs(m) > 6) P.say("It diverged. The step was bigger than the valley. Lower η.", "dead");
        else if (Math.abs(g) < .05) P.say("Slope is almost zero. That is what convergence looks like — nothing dramatic, it just stops moving.", "chef");
      }
      if (Math.abs(m) > 20) { m = api.K.start.get(); hist = [m]; P.say("I reset you. The loss went to infinity and I do not want to draw that.", "panic"); draw(); }
    }
    function draw() {
      const k = C(), c = api.ctx; api.clear();
      const lo = -0.6, hi = 3.2;
      const ys = []; for (let i = 0; i <= 200; i++) ys.push(L(lo + (hi - lo) * i / 200));
      const g = plot(api, { dom: [lo, hi], rng: [0, Math.max(28, L(lo))], xl: "m (the parameter)", yl: "J(m)  mean squared error" });
      c.strokeStyle = k.grape; c.lineWidth = 4; c.beginPath();
      ys.forEach((v, i) => { const x = g.sx(lo + (hi - lo) * i / 200); i ? c.lineTo(x, g.sy(v)) : c.moveTo(x, g.sy(v)); });
      c.stroke();
      // path
      c.strokeStyle = k.pink; c.lineWidth = 2.5; c.setLineDash([4, 4]); c.beginPath();
      hist.forEach((h, i) => { i ? c.lineTo(g.sx(h), g.sy(L(h))) : c.moveTo(g.sx(h), g.sy(L(h))); });
      c.stroke(); c.setLineDash([]);
      hist.forEach(h => dot(c, g.sx(h), g.sy(L(h)), 3.5, k.pink, k.line));
      // tangent at m
      const slope = dL(m), d = .45;
      const sc = (g.sy(L(m) + slope * d) - g.sy(L(m))) / (g.sx(m + d) - g.sx(m));
      line(c, g.sx(m - d), g.sy(L(m)) - sc * (g.sx(m) - g.sx(m - d)), g.sx(m + d), g.sy(L(m)) + sc * (g.sx(m + d) - g.sx(m)), k.tan, 3.5);
      // poise on the curve
      const px = g.sx(m), py = g.sy(L(m));
      c.save(); c.translate(px, py - 17);
      c.fillStyle = k.sun; c.strokeStyle = k.line; c.lineWidth = 2.5;
      c.beginPath(); c.roundRect ? c.roundRect(-13, -13, 26, 24, 7) : c.rect(-13, -13, 26, 24); c.fill(); c.stroke();
      c.fillStyle = k.line; c.beginPath(); c.arc(-5, -3, 3.4, 0, 7); c.arc(5, -3, 3.4, 0, 7); c.fill();
      c.beginPath(); c.moveTo(0, -13); c.lineTo(0, -20); c.stroke();
      c.beginPath(); c.arc(0, -22, 3, 0, 7); c.fillStyle = k.pink; c.fill(); c.stroke();
      c.restore();
      c.font = "800 12px system-ui"; c.fillStyle = k.ink; c.textAlign = "center";
      c.fillText(slope > 0 ? "slope +  → go left" : "slope −  → go right", px, py - 40);

      const lr = api.K.lr.get();
      api.ro([
        { k: "step #", v: steps }, { k: "m (old)", v: n3(hist[hist.length - 2] !== undefined ? hist[hist.length - 2] : m) },
        { k: "slope ∂J/∂m", v: n3(slope) }, { k: "η", v: n3(lr) },
        { k: "η × slope", v: n3(lr * slope) }, { k: "m (new)", v: n3(m) },
        { k: "loss J(m)", v: n2(L(m)), cls: L(m) < 2 ? "good" : L(m) > 10 ? "bad" : "" }
      ]);
      api.trace("One update, every operation", [
        ["Current parameter", "m = " + n3(m), ""],
        ["Predictions ŷ = m·x", X.map(x => n2(m * x)).join(", "), ""],
        ["Errors (y − ŷ)", X.map((x, i) => n2(Y[i] - m * x)).join(", "), ""],
        ["Loss  J = mean(error²)", "(" + X.map((x, i) => n2((Y[i] - m * x) ** 2)).join(" + ") + ") / 5", n2(L(m))],
        ["Gradient  ∂J/∂m = mean(−2x·error)", "mean(" + X.map((x, i) => n2(-2 * x * (Y[i] - m * x))).join(", ") + ")", n3(slope)],
        ["Update  new = old − η × slope", n3(m) + " − " + n3(lr) + " × " + n3(slope), n3(m - lr * slope)],
        ["Loss after the step", "J(" + n3(m - lr * slope) + ")", n2(L(m - lr * slope))]
      ]);
    }
    api.K.start.set(.1);
    draw(); P.say("I'm trying to get to the bottom. Do I randomly walk around? No. I look at the slope and move downhill.", "slide");
  }

  /* ================================================================ 40 bias-variance */
  function biasvar(host, P) {
    // true f(x) = 0.6x² - 2x + 3 plus noise; fixed train/test split
    const f = x => 0.6 * x * x - 2 * x + 3;
    let seed = 7;
    const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648 - .5; };
    const TRX = [0.3, 1.1, 1.9, 2.6, 3.4, 4.1, 4.9, 5.6, 6.3, 6.9];
    const TRY = TRX.map(x => f(x) + rnd() * 3.4);
    const TEX = [0.7, 1.5, 2.2, 3.0, 3.8, 4.5, 5.2, 6.0, 6.6];
    const TEY = TEX.map(x => f(x) + rnd() * 3.4);
    function fit(deg) { // normal equations via Gaussian elimination on Vandermonde
      const nd = deg + 1, A = [], b = [];
      for (let i = 0; i < nd; i++) {
        A.push(new Array(nd).fill(0)); b.push(0);
        for (let j = 0; j < nd; j++) A[i][j] = TRX.reduce((a, x) => a + Math.pow(x, i + j), 0);
        b[i] = TRX.reduce((a, x, q) => a + Math.pow(x, i) * TRY[q], 0);
      }
      for (let i = 0; i < nd; i++) {
        let p = i; for (let r = i + 1; r < nd; r++) if (Math.abs(A[r][i]) > Math.abs(A[p][i])) p = r;
        [A[i], A[p]] = [A[p], A[i]]; [b[i], b[p]] = [b[p], b[i]];
        if (Math.abs(A[i][i]) < 1e-12) continue;
        for (let r = 0; r < nd; r++) if (r !== i) { const fr = A[r][i] / A[i][i]; for (let q = i; q < nd; q++) A[r][q] -= fr * A[i][q]; b[r] -= fr * b[i]; }
      }
      return b.map((v, i) => Math.abs(A[i][i]) < 1e-12 ? 0 : v / A[i][i]);
    }
    const ev = (w, x) => w.reduce((a, c, i) => a + c * Math.pow(x, i), 0);
    const mse = (w, xs, ys) => xs.reduce((a, x, i) => a + (ys[i] - ev(w, x)) ** 2, 0) / xs.length;
    const api = shell(host, {
      title: "Bias and variance — watch a model memorise the homework",
      blurb: "Ten training points from a curve plus noise. Raise the polynomial degree and the training error marches to zero while the test error turns around and leaves. That turn is the whole tradeoff.",
      knobs: [
        { id: "deg", label: "polynomial degree", min: 1, max: 9, step: 1, val: 2, fmt: v => v.toFixed(0) },
        { id: "test", label: "show the test points", type: "check", val: true },
        { id: "br", label: "😈 BREAK IT: degree 9", type: "btn", cls: "pink", onClick: () => { api.K.deg.set(9); draw(); P.say("Training error basically zero. Test error enormous. Congratulations: your model memorised the homework instead of learning the subject.", "evil"); } },
        { id: "sw", label: "🎯 Sweet spot (degree 2)", type: "btn", cls: "mint", onClick: () => { api.K.deg.set(2); draw(); P.say("Degree 2 — the same shape as the truth. Low bias, low variance, no drama.", "cool"); } }
      ],
      notes: ["Low training error does not mean low test error. The curve in the right panel is the U everyone draws on a whiteboard; here it is computed from the actual fits."],
      draw: () => draw()
    });
    function draw() {
      const k = C(), c = api.ctx, deg = api.K.deg.get(), w = fit(deg);
      api.clear();
      const g = plot(api, { dom: [0, 7.3], rng: [-4, 16], xl: "x", yl: "y", x1: CW - 220 });
      c.strokeStyle = k.soft; c.lineWidth = 2; c.setLineDash([6, 5]); c.beginPath();
      for (let i = 0; i <= 120; i++) { const x = 7.3 * i / 120; i ? c.lineTo(g.sx(x), g.sy(f(x))) : c.moveTo(g.sx(x), g.sy(f(x))); }
      c.stroke(); c.setLineDash([]);
      c.strokeStyle = k.grape; c.lineWidth = 4; c.beginPath();
      for (let i = 0; i <= 300; i++) {
        const x = 7.3 * i / 300, y = Math.max(-40, Math.min(60, ev(w, x)));
        i ? c.lineTo(g.sx(x), g.sy(y)) : c.moveTo(g.sx(x), g.sy(y));
      }
      c.stroke();
      TRX.forEach((x, i) => dot(c, g.sx(x), g.sy(TRY[i]), 7, k.mint, k.line));
      if (api.K.test.get()) TEX.forEach((x, i) => dot(c, g.sx(x), g.sy(TEY[i]), 6, k.pink, k.line));
      c.fillStyle = k.ink; c.font = "800 11px system-ui"; c.textAlign = "left";
      c.fillText("● train   ● test   – – true function", 66, 22);
      // U curve panel
      const px0 = CW - 196, py0 = 44, pw = 172, ph = 170;
      const tr = [], te = [];
      for (let d = 1; d <= 9; d++) { const ww = fit(d); tr.push(mse(ww, TRX, TRY)); te.push(Math.min(mse(ww, TEX, TEY), 160)); }
      const hi = Math.max.apply(null, te.concat(tr));
      c.strokeStyle = k.ink; c.lineWidth = 2.5; c.strokeRect(px0, py0, pw, ph);
      [[tr, k.mint], [te, k.pink]].forEach(([arr, col]) => {
        c.strokeStyle = col; c.lineWidth = 3; c.beginPath();
        arr.forEach((v, i) => { const x = px0 + pw * i / 8, y = py0 + ph - ph * Math.pow(v / hi, .4);
          i ? c.lineTo(x, y) : c.moveTo(x, y); });
        c.stroke();
        arr.forEach((v, i) => dot(c, px0 + pw * i / 8, py0 + ph - ph * Math.pow(v / hi, .4), 3, col, k.line));
      });
      const xx = px0 + pw * (deg - 1) / 8;
      line(c, xx, py0, xx, py0 + ph, k.sun, 3, [4, 4]);
      c.fillStyle = k.ink; c.font = "800 11px system-ui"; c.textAlign = "left";
      c.fillText("error vs degree", px0, py0 - 8);
      c.font = "700 10px system-ui"; c.fillStyle = k.soft;
      c.fillText("underfit ←      → overfit", px0, py0 + ph + 14);

      const trE = mse(w, TRX, TRY), teE = mse(w, TEX, TEY);
      api.ro([
        { k: "degree", v: deg }, { k: "parameters", v: deg + 1 },
        { k: "train MSE", v: n2(trE), cls: "good" },
        { k: "test MSE", v: n2(teE), cls: teE > trE * 3 ? "bad" : "" },
        { k: "test / train", v: n2(teE / Math.max(trE, 1e-6)) + "×" },
        { k: "verdict", v: deg === 1 ? "underfit" : teE > trE * 3 ? "OVERFIT" : "healthy" }
      ]);
      api.html('<div class="eyebrow">What each degree actually costs</div><div style="margin-top:8px">' +
        api.table(["degree", "params", "train MSE", "test MSE", "gap"],
          tr.map((v, i) => [i + 1, i + 2, n2(v), n2(te[i]), n2(te[i] - v)]), deg - 1) +
        '</div><p style="font-weight:800;margin:10px 0 0">Bias is being consistently wrong in the same direction (degree 1). ' +
        "Variance is changing your mind every time the data changes (degree 9). The best degree is where the gap stops being worth the gain.</p>");
    }
    draw(); P.say("Look! Our model is learning! More! MORE! ...and now it has memorised ten points and understands nothing.", "evil");
  }

  /* ================================================================ 45 logistic */
  function logreg(host, P) {
    const PTS = [[1.2, 1.5, 0], [1.8, 1.1, 0], [2.4, 2.0, 0], [1.4, 2.6, 0], [2.9, 1.3, 0], [2.1, 3.0, 0],
      [4.4, 3.6, 1], [5.1, 4.4, 1], [4.0, 4.9, 1], [5.6, 3.3, 1], [4.8, 5.3, 1], [3.6, 4.3, 1]];
    let sel = 6;
    const sig = z => 1 / (1 + Math.exp(-z));
    const api = shell(host, {
      title: "Logistic regression — from a linear score to a probability",
      blurb: "Click any point to trace it. The straight line is where the linear score z is exactly 0; the sigmoid turns that score into a probability, and only then does the threshold decide a class.",
      knobs: [
        { id: "w1", label: "w₁", min: -3, max: 3, step: .05, val: 1 },
        { id: "w2", label: "w₂", min: -3, max: 3, step: .05, val: 1 },
        { id: "b", label: "bias b", min: -12, max: 6, step: .1, val: -6 },
        { id: "th", label: "threshold", min: .05, max: .95, step: .01, val: .5 },
        { id: "fit", label: "🎯 Fit it (200 GD steps)", type: "btn", cls: "mint", onClick: () => { fitGD(); P.say("That is maximum likelihood by gradient descent — the same update you derived, run 200 times.", "chef"); } },
        { id: "br", label: "😈 BREAK IT: threshold 0.95", type: "btn", cls: "pink", onClick: () => { api.K.th.set(.95); draw(); P.say("Precision up, recall in the bin. The model did not change at all — you just moved a number.", "evil"); } }
      ],
      notes: ["The sigmoid is not a decision. It is a probability. The decision happens when you compare it to a threshold you chose."],
      draw: () => draw()
    });
    function fitGD() {
      let w1 = api.K.w1.get(), w2 = api.K.w2.get(), b = api.K.b.get();
      for (let it = 0; it < 200; it++) {
        let g1 = 0, g2 = 0, gb = 0;
        PTS.forEach(([x, y, t]) => { const e = sig(w1 * x + w2 * y + b) - t; g1 += e * x; g2 += e * y; gb += e; });
        w1 -= .18 * g1 / PTS.length; w2 -= .18 * g2 / PTS.length; b -= .18 * gb / PTS.length;
      }
      api.K.w1.set(Math.max(-3, Math.min(3, w1))); api.K.w2.set(Math.max(-3, Math.min(3, w2))); api.K.b.set(Math.max(-12, Math.min(6, b)));
      draw();
    }
    api.cv.addEventListener("click", ev => {
      const r = api.cv.getBoundingClientRect(), sc = CW / r.width;
      const mx = (ev.clientX - r.left) * sc, my = (ev.clientY - r.top) * sc;
      const g = lastG; if (!g) return;
      let best = -1, bd = 1e9;
      PTS.forEach(([x, y], i) => { const d = (g.sx(x) - mx) ** 2 + (g.sy(y) - my) ** 2; if (d < bd) { bd = d; best = i; } });
      if (bd < 900) { sel = best; draw(); }
    });
    let lastG = null;
    function draw() {
      const k = C(), c = api.ctx, w1 = api.K.w1.get(), w2 = api.K.w2.get(), b = api.K.b.get(), th = api.K.th.get();
      api.clear();
      const g = plot(api, { dom: [0, 6.5], rng: [0, 6.5], xl: "x₁ (hours studied)", yl: "x₂ (past score)", x1: CW - 230 });
      lastG = g;
      // probability shading
      for (let i = 0; i < 44; i++) for (let j = 0; j < 44; j++) {
        const x = 6.5 * i / 44, y = 6.5 * j / 44, p = sig(w1 * x + w2 * y + b);
        c.globalAlpha = .4; c.fillStyle = p > th ? k.grape : k.sun;
        c.globalAlpha = .13 + .3 * Math.abs(p - .5);
        c.fillRect(g.sx(x), g.sy(y + 6.5 / 44), (g.x1 - g.x0) / 44 + 1, (g.y1 - g.y0) / 44 + 1);
      }
      c.globalAlpha = 1;
      // boundary: w1x+w2y+b = logit(th)
      const lg = Math.log(th / (1 - th));
      if (Math.abs(w2) > 1e-6) {
        const yA = (lg - b - w1 * 0) / w2, yB = (lg - b - w1 * 6.5) / w2;
        line(c, g.sx(0), g.sy(yA), g.sx(6.5), g.sy(yB), k.pink, 4);
      }
      let ll = 0, ok = 0;
      PTS.forEach(([x, y, t], i) => {
        const p = sig(w1 * x + w2 * y + b);
        ll -= t ? Math.log(Math.max(p, 1e-9)) : Math.log(Math.max(1 - p, 1e-9));
        if ((p > th ? 1 : 0) === t) ok++;
        dot(c, g.sx(x), g.sy(y), i === sel ? 10 : 7, t ? k.grape : k.sun, k.line);
        if (i === sel) { c.strokeStyle = k.pink; c.lineWidth = 3; c.beginPath(); c.arc(g.sx(x), g.sy(y), 16, 0, 7); c.stroke(); }
      });
      // sigmoid panel
      const px0 = CW - 206, py0 = 56, pw = 180, ph = 150;
      c.strokeStyle = k.ink; c.lineWidth = 2.5; c.strokeRect(px0, py0, pw, ph);
      c.strokeStyle = k.grape; c.lineWidth = 3; c.beginPath();
      for (let i = 0; i <= 90; i++) { const z = -8 + 16 * i / 90, p = sig(z);
        const x = px0 + pw * i / 90, y = py0 + ph - ph * p; i ? c.lineTo(x, y) : c.moveTo(x, y); }
      c.stroke();
      line(c, px0, py0 + ph - ph * th, px0 + pw, py0 + ph - ph * th, k.pink, 2, [4, 4]);
      const sp = PTS[sel], zs = w1 * sp[0] + w2 * sp[1] + b, ps = sig(zs);
      const zx = px0 + pw * (Math.max(-8, Math.min(8, zs)) + 8) / 16;
      line(c, zx, py0, zx, py0 + ph, k.sun, 2.5);
      dot(c, zx, py0 + ph - ph * ps, 6, k.sun, k.line);
      c.fillStyle = k.ink; c.font = "800 11px system-ui"; c.textAlign = "left";
      c.fillText("σ(z) = 1 / (1 + e⁻ᶻ)", px0, py0 - 8);
      c.font = "700 10px system-ui"; c.fillStyle = k.soft;
      c.fillText("z = −8", px0, py0 + ph + 13); c.textAlign = "right"; c.fillText("z = +8", px0 + pw, py0 + ph + 13);

      api.ro([
        { k: "accuracy", v: ok + "/" + PTS.length }, { k: "log loss", v: n3(ll / PTS.length), cls: ll / PTS.length < .3 ? "good" : "" },
        { k: "selected z", v: n2(zs) }, { k: "σ(z)", v: n3(ps) },
        { k: "threshold", v: n2(th) }, { k: "predicted", v: ps > th ? "class 1" : "class 0", cls: (ps > th ? 1 : 0) === sp[2] ? "good" : "bad" },
        { k: "actual", v: "class " + sp[2] }
      ]);
      api.trace("Trace one point: (" + sp[0] + ", " + sp[1] + "), true class " + sp[2], [
        ["Input x₁ × w₁", sp[0] + " × " + n2(w1), n2(sp[0] * w1)],
        ["Input x₂ × w₂", sp[1] + " × " + n2(w2), n2(sp[1] * w2)],
        ["Sum the weighted inputs", n2(sp[0] * w1) + " + " + n2(sp[1] * w2), n2(sp[0] * w1 + sp[1] * w2)],
        ["Add the bias", n2(sp[0] * w1 + sp[1] * w2) + " + " + n2(b), n2(zs)],
        ["Linear score z — still unbounded", "z = " + n2(zs), n2(zs)],
        ["Squash it: σ(z) = 1/(1+e^−z)", "1 / (1 + e^" + n2(-zs) + ")", n3(ps)],
        ["Probability of class 1", n3(ps) + "  (" + (ps * 100).toFixed(1) + "%)", n3(ps)],
        ["Compare to the threshold", n3(ps) + (ps > th ? " > " : " ≤ ") + n2(th), ps > th ? "class 1" : "class 0"],
        ["Its contribution to log loss", sp[2] ? "−ln(" + n3(ps) + ")" : "−ln(" + n3(1 - ps) + ")",
          n3(sp[2] ? -Math.log(Math.max(ps, 1e-9)) : -Math.log(Math.max(1 - ps, 1e-9)))]
      ]);
    }
    draw(); P.say("A linear model will happily output −3.2. You asked for a probability. The sigmoid is the fix, and it is the only new idea here.", "brain");
  }

  /* ================================================================ 55 decision tree split */
  function tree(host, P) {
    // feature = CGPA-ish value, label = placed(1)/not(0)
    const D = [[6.1, 0], [6.4, 0], [6.8, 0], [7.0, 1], [7.2, 0], [7.5, 1], [7.8, 1], [8.0, 1], [8.3, 0], [8.6, 1]];
    const ent = p => (p <= 0 || p >= 1) ? 0 : -(p * Math.log2(p) + (1 - p) * Math.log2(1 - p));
    const gini = p => 2 * p * (1 - p);
    const api = shell(host, {
      title: "Decision trees — why one split beats another, in numbers",
      blurb: "Ten students, one feature, one threshold to choose. Every candidate split is scored by how much impurity it removes. Information gain is just parent impurity minus the weighted average of the children.",
      knobs: [
        { id: "th", label: "split threshold", min: 6.2, max: 8.5, step: .05, val: 7.1 },
        { id: "crit", label: "use entropy (off = Gini)", type: "check", val: true },
        { id: "best", label: "🎯 Find the best split", type: "btn", cls: "mint", onClick: () => { api.K.th.set(bestTh()); draw(); P.say("That is exactly what CART does at every node: try every threshold, keep the one with the highest gain. No cleverness, just a loop.", "chef"); } }
      ],
      notes: ["The child impurities are weighted by |S_v|/|S|. Without the weights the tree would happily isolate one lucky row and call it a pure node."],
      draw: () => draw()
    });
    const imp = p => api.K.crit.get() ? ent(p) : gini(p);
    function score(th) {
      const Lt = D.filter(d => d[0] <= th), Rt = D.filter(d => d[0] > th);
      if (!Lt.length || !Rt.length) return null;
      const pP = D.filter(d => d[1]).length / D.length;
      const pL = Lt.filter(d => d[1]).length / Lt.length, pR = Rt.filter(d => d[1]).length / Rt.length;
      const wl = Lt.length / D.length, wr = Rt.length / D.length;
      const child = wl * imp(pL) + wr * imp(pR);
      return { Lt, Rt, pP, pL, pR, wl, wr, parent: imp(pP), child, gain: imp(pP) - child };
    }
    function bestTh() {
      let b = null, bt = 7;
      for (let t = 6.25; t < 8.6; t += .05) { const s = score(t); if (s && (!b || s.gain > b.gain)) { b = s; bt = t; } }
      return Math.round(bt * 20) / 20;
    }
    function draw() {
      const k = C(), c = api.ctx, th = api.K.th.get(), s = score(th);
      api.clear();
      // gain curve across thresholds
      const g = plot(api, { dom: [6.0, 8.8], rng: [0, .62], xl: "candidate threshold (CGPA)", yl: "information gain", y1: 230 });
      c.strokeStyle = k.grape; c.lineWidth = 3.5; c.beginPath();
      let first = true;
      for (let t = 6.05; t < 8.8; t += .025) {
        const ss = score(t); if (!ss) continue;
        const x = g.sx(t), y = g.sy(ss.gain); first ? (c.moveTo(x, y), first = false) : c.lineTo(x, y);
      }
      c.stroke();
      if (s) { line(c, g.sx(th), g.y0, g.sx(th), g.y1, k.sun, 3, [5, 4]); dot(c, g.sx(th), g.sy(s.gain), 7, k.sun, k.line); }
      // the data strip
      const sy = 300;
      c.fillStyle = k.ink; c.font = "800 12px system-ui"; c.textAlign = "left";
      c.fillText("the ten students, sorted by CGPA  (● placed  ● not placed)", 60, sy - 18);
      D.forEach(([x, y]) => dot(c, g.sx(x), sy, 9, y ? k.mint : k.pink, k.line));
      line(c, g.sx(th), sy - 30, g.sx(th), sy + 30, k.sun, 4);
      c.textAlign = "center"; c.fillStyle = k.ink; c.font = "800 12px system-ui";
      c.fillText("≤ " + n2(th) + "  (" + (s ? s.Lt.length : 0) + " rows)", g.sx(th) - 90, sy + 50);
      c.fillText("> " + n2(th) + "  (" + (s ? s.Rt.length : 0) + " rows)", g.sx(th) + 90, sy + 50);
      // node boxes
      if (s) {
        const box = (x, y, w, h, lbl, p, nn, col) => {
          c.fillStyle = col; c.strokeStyle = k.line; c.lineWidth = 3;
          c.beginPath(); c.roundRect ? c.roundRect(x, y, w, h, 10) : c.rect(x, y, w, h); c.fill(); c.stroke();
          c.fillStyle = "#241046"; c.font = "800 11px system-ui"; c.textAlign = "center";
          c.fillText(lbl, x + w / 2, y + 16);
          c.font = "700 11px ui-monospace,monospace";
          c.fillText("p=" + n2(p) + "  n=" + nn, x + w / 2, y + 31);
          c.fillText((api.K.crit.get() ? "H=" : "G=") + n3(imp(p)), x + w / 2, y + 45);
        };
        box(g.sx(th) - 220, sy + 62, 150, 54, "LEFT child", s.pL, s.Lt.length, k.sun);
        box(g.sx(th) + 70, sy + 62, 150, 54, "RIGHT child", s.pR, s.Rt.length, k.mint);
      }
      const b = score(bestTh());
      api.ro(!s ? [{ k: "split", v: "empty side" }] : [
        { k: "criterion", v: api.K.crit.get() ? "entropy" : "Gini" },
        { k: "parent impurity", v: n3(s.parent) },
        { k: "weighted children", v: n3(s.child) },
        { k: "information gain", v: n3(s.gain), cls: s.gain > .2 ? "good" : "" },
        { k: "best gain available", v: n3(b.gain) },
        { k: "best threshold", v: n2(bestTh()) }
      ]);
      if (!s) { api.html(""); return; }
      api.html('<div class="eyebrow">The gain calculation, written out</div>' +
        '<div class="trace" style="margin-top:8px">' + [
          ["Parent node", "5 placed / 5 not → p = " + n2(s.pP), n3(s.parent)],
          ["Left child (≤ " + n2(th) + ")", s.Lt.filter(d => d[1]).length + " placed of " + s.Lt.length + " → p = " + n2(s.pL), n3(imp(s.pL))],
          ["Right child (> " + n2(th) + ")", s.Rt.filter(d => d[1]).length + " placed of " + s.Rt.length + " → p = " + n2(s.pR), n3(imp(s.pR))],
          ["Weight each child by its size", n2(s.wl) + " × " + n3(imp(s.pL)) + " + " + n2(s.wr) + " × " + n3(imp(s.pR)), n3(s.child)],
          ["Gain = parent − weighted children", n3(s.parent) + " − " + n3(s.child), n3(s.gain)]
        ].map((r, i) => (i ? '<div class="arrowdown">↓</div>' : "") +
          '<div class="tstep done"><span class="idx">' + (i + 1) + '</span><div style="min-width:0"><div class="lbl">' + r[0] +
          '</div><div style="font-weight:700;font-family:var(--mono);font-size:13px">' + r[1] + '</div></div><span class="val">' + r[2] + "</span></div>").join("") +
        "</div><p style=\"font-weight:800;margin:10px 0 0\">Gain is never negative: a split cannot increase the weighted average impurity. A gain of zero means the split told you nothing.</p>");
    }
    draw(); P.say("The tree has fourteen features to choose from. It needs a number that says which split actually made the groups purer. This is that number.", "brain");
  }

  /* ================================================================ 61 random forest */
  function forest(host, P) {
    const PTS = [];
    let sd = 3; const r = () => { sd = (sd * 1103515245 + 12345) % 2147483648; return sd / 2147483648; };
    for (let i = 0; i < 60; i++) { const x = r() * 10, y = r() * 10; PTS.push([x, y, (x + y > 10 ? 1 : 0) ^ (r() < .12 ? 1 : 0)]); }
    let trees = [];
    function buildStump(bag, feats) { // depth-1 stump
      let best = null;
      feats.forEach(fi => {
        for (let t = .5; t < 10; t += .5) {
          const L = bag.filter(p => p[fi] <= t), R = bag.filter(p => p[fi] > t);
          if (!L.length || !R.length) continue;
          const g = s => { const p = s.filter(q => q[2]).length / s.length; return 2 * p * (1 - p); };
          const sc = (L.length * g(L) + R.length * g(R)) / bag.length;
          if (!best || sc < best.sc) best = { fi, t, sc, lp: L.filter(q => q[2]).length / L.length > .5 ? 1 : 0,
            rp: R.filter(q => q[2]).length / R.length > .5 ? 1 : 0 };
        }
      });
      return best;
    }
    function grow(nT, mf) {
      sd = 11; trees = [];
      for (let i = 0; i < nT; i++) {
        const bag = []; const used = new Set();
        for (let j = 0; j < PTS.length; j++) { const idx = Math.floor(r() * PTS.length); bag.push(PTS[idx]); used.add(idx); }
        const feats = mf === 1 ? [r() < .5 ? 0 : 1] : [0, 1];
        const s = buildStump(bag, feats);
        if (s) { s.oob = PTS.filter((_, j) => !used.has(j)); trees.push(s); }
      }
    }
    const pred1 = (s, p) => (p[s.fi] <= s.t ? s.lp : s.rp);
    const api = shell(host, {
      title: "Random forest — ask a lot of mediocre trees and let them vote",
      blurb: "Sixty points, each tree a single depth-1 stump trained on its own bootstrap sample. One stump is bad. The majority vote of many is not.",
      knobs: [
        { id: "nt", label: "number of trees", min: 1, max: 25, step: 1, val: 9, fmt: v => v.toFixed(0) },
        { id: "mf", label: "max_features", min: 1, max: 2, step: 1, val: 1, fmt: v => v == 1 ? "1 (random)" : "2 (all)" },
        { id: "re", label: "🎲 Re-bootstrap", type: "btn", cls: "ghost", onClick: () => { grow(api.K.nt.get(), api.K.mf.get()); draw(); } },
        { id: "one", label: "😈 BREAK IT: one tree only", type: "btn", cls: "pink", onClick: () => { api.K.nt.set(1); grow(1, api.K.mf.get()); draw(); P.say("One stump. High variance — re-bootstrap a few times and watch the boundary jump around. That jumping is what averaging kills.", "evil"); } }
      ],
      notes: ["max_features = 1 forces trees to disagree. Correlated trees average to the same mistake; decorrelated trees average to something better."],
      draw: () => { grow(api.K.nt.get(), api.K.mf.get()); draw(); }
    });
    function draw() {
      const k = C(), c = api.ctx; api.clear();
      const g = plot(api, { dom: [0, 10], rng: [0, 10], xl: "x₁", yl: "x₂", x1: CW - 210 });
      // ensemble vote shading
      for (let i = 0; i < 50; i++) for (let j = 0; j < 50; j++) {
        const x = 10 * i / 50, y = 10 * j / 50;
        const v = trees.reduce((a, s) => a + pred1(s, [x, y]), 0) / Math.max(trees.length, 1);
        c.globalAlpha = .1 + .35 * Math.abs(v - .5) * 2;
        c.fillStyle = v > .5 ? k.grape : k.sun;
        c.fillRect(g.sx(x), g.sy(y + 10 / 50), (g.x1 - g.x0) / 50 + 1, (g.y1 - g.y0) / 50 + 1);
      }
      c.globalAlpha = 1;
      trees.forEach(s => {
        c.globalAlpha = .45;
        if (s.fi === 0) line(c, g.sx(s.t), g.y0, g.sx(s.t), g.y1, k.soft, 2);
        else line(c, g.x0, g.sy(s.t), g.x1, g.sy(s.t), k.soft, 2);
        c.globalAlpha = 1;
      });
      PTS.forEach(([x, y, t]) => dot(c, g.sx(x), g.sy(y), 5.5, t ? k.grape : k.sun, k.line));
      // vote bar for one query point
      const q = [4.6, 5.2];
      dot(c, g.sx(q[0]), g.sy(q[1]), 11, k.pink, k.line);
      const votes = trees.map(s => pred1(s, q));
      const px0 = CW - 194, py0 = 50;
      c.fillStyle = k.ink; c.font = "800 11px system-ui"; c.textAlign = "left";
      c.fillText("votes for the pink point", px0, py0 - 8);
      votes.forEach((v, i) => {
        c.fillStyle = v ? k.grape : k.sun; c.strokeStyle = k.line; c.lineWidth = 2;
        const y = py0 + i * 13;
        c.fillRect(px0, y, 150, 10); c.strokeRect(px0, y, 150, 10);
        c.fillStyle = k.ink; c.font = "700 9px ui-monospace,monospace";
        c.fillText("tree " + (i + 1) + " → " + v, px0 + 155, y + 9);
      });
      const maj = votes.filter(v => v).length;
      // accuracy
      let ok = 0; PTS.forEach(p => { const v = trees.reduce((a, s) => a + pred1(s, p), 0) / trees.length; if ((v > .5 ? 1 : 0) === p[2]) ok++; });
      // oob
      let oobOK = 0, oobN = 0;
      PTS.forEach((p, j) => {
        const vs = trees.filter(s => s.oob.indexOf(p) >= 0).map(s => pred1(s, p));
        if (vs.length) { oobN++; if (((vs.reduce((a, v) => a + v, 0) / vs.length) > .5 ? 1 : 0) === p[2]) oobOK++; }
      });
      api.ro([
        { k: "trees", v: trees.length }, { k: "votes for 1", v: maj + " / " + votes.length },
        { k: "ensemble says", v: maj > votes.length / 2 ? "class 1" : "class 0" },
        { k: "train accuracy", v: (100 * ok / PTS.length).toFixed(0) + "%", cls: "good" },
        { k: "OOB accuracy", v: oobN ? (100 * oobOK / oobN).toFixed(0) + "%" : "—" },
        { k: "single-tree acc.", v: trees[0] ? (100 * PTS.filter(p => pred1(trees[0], p) === p[2]).length / PTS.length).toFixed(0) + "%" : "—", cls: "bad" }
      ]);
      api.html('<div class="eyebrow">What each tree is, and what each one says</div><div style="margin-top:8px">' +
        api.table(["tree", "split on", "threshold", "left→", "right→", "vote for (4.6, 5.2)", "own accuracy"],
          trees.map((s, i) => ["#" + (i + 1), s.fi === 0 ? "x₁" : "x₂", n2(s.t), s.lp, s.rp, pred1(s, q),
            (100 * PTS.filter(p => pred1(s, p) === p[2]).length / PTS.length).toFixed(0) + "%"])) +
        '</div><p style="font-weight:800;margin:10px 0 0">Each row is a weak model. The last column shows none of them is good. ' +
        "The ensemble is better than every single row above it, which is the entire point of bagging.</p>");
    }
    grow(9, 1); draw();
    P.say("Bagged trees still pick the same dominant feature at the root. max_features = 1 forces them to disagree. Disagreement is the product here.", "brain");
  }

  /* ================================================================ 65 adaboost */
  function adaboost(host, P) {
    const D = [[1, 1], [2, 1], [3, 1], [4, 0], [5, 0], [6, 0], [7, 1], [8, 1], [9, 0], [10, 0]];
    let W = D.map(() => 1 / D.length), rounds = [];
    function nextRound() {
      let best = null;
      for (let t = 1.5; t < 10; t += 1) for (const dir of [1, -1]) {
        const pred = x => dir > 0 ? (x <= t ? 1 : 0) : (x <= t ? 0 : 1);
        const err = D.reduce((a, d, i) => a + (pred(d[0]) !== d[1] ? W[i] : 0), 0);
        if (!best || err < best.err) best = { t, dir, err, pred };
      }
      const e = Math.min(Math.max(best.err, 1e-6), .499);
      const alpha = .5 * Math.log((1 - e) / e);
      const wrong = D.map((d, i) => best.pred(d[0]) !== d[1]);
      const newW = W.map((w, i) => w * Math.exp(wrong[i] ? alpha : -alpha));
      const Z = newW.reduce((a, b) => a + b, 0);
      rounds.push({ t: best.t, dir: best.dir, err: e, alpha, wrong, wBefore: W.slice() });
      W = newW.map(w => w / Z);
      draw();
      P.say(rounds.length === 1 ? "Round 1 done. Look at the weights: the rows it got wrong just got heavier. Round 2 has no choice but to care about them."
        : "Round " + rounds.length + ". α = " + n2(alpha) + " — this stump gets that much say in the final vote. Low error, loud voice.", "chef");
    }
    const api = shell(host, {
      title: "AdaBoost — each round has to clean up the last one's mess",
      blurb: "Ten points on a line, two classes, and stumps that can only say \"x ≤ t\". After each round the misclassified points get heavier, so the next stump is forced to attack them.",
      knobs: [
        { id: "go", label: "▶ Run the next round", type: "btn", cls: "grape", onClick: () => nextRound() },
        { id: "r3", label: "⏩ Run 3 rounds", type: "btn", cls: "mint", onClick: () => { nextRound(); nextRound(); nextRound(); } },
        { id: "rs", label: "↺ Reset", type: "btn", onClick: () => { W = D.map(() => 1 / D.length); rounds = []; draw(); } }
      ],
      notes: ["α = ½ ln((1−ε)/ε). A stump with ε near 0.5 gets α near 0 — no say at all. A stump with low error gets a loud vote.",
        "Circle size is that row's current weight. This is boosting's only trick, and it is enough."],
      draw: () => draw(), h: 400
    });
    function draw() {
      const k = C(), c = api.ctx; api.clear();
      const g = plot(api, { dom: [0, 11], rng: [0, 1], xl: "x", yl: "", y0: 40, y1: 150, x1: CW - 24 });
      c.fillStyle = k.ink; c.font = "800 12px system-ui"; c.textAlign = "left";
      c.fillText("point weights (circle area = weight) — ● class 1  ● class 0", 60, 28);
      D.forEach(([x, y], i) => dot(c, g.sx(x), 110, 5 + 46 * W[i], y ? k.mint : k.pink, k.line));
      rounds.forEach((r, i) => {
        const yy = 190 + i * 46;
        if (yy > api.H - 30) return;
        c.fillStyle = k.ink; c.font = "800 12px system-ui"; c.textAlign = "left";
        c.fillText("round " + (i + 1) + ":  x " + (r.dir > 0 ? "≤" : ">") + " " + n2(r.t) + " → class 1" +
          "    ε = " + n2(r.err) + "    α = " + n2(r.alpha), 60, yy - 10);
        line(c, g.sx(r.t), yy, g.sx(r.t), yy + 22, k.sun, 4);
        D.forEach(([x, y], j) => dot(c, g.sx(x), yy + 11, 6, r.wrong[j] ? k.pink : k.mint, k.line));
      });
      const F = x => rounds.reduce((a, r) => a + r.alpha * ((r.dir > 0 ? (x <= r.t) : (x > r.t)) ? 1 : -1), 0);
      const ok = D.filter(d => (F(d[0]) > 0 ? 1 : 0) === d[1]).length;
      api.ro([
        { k: "rounds", v: rounds.length },
        { k: "last ε", v: rounds.length ? n3(rounds[rounds.length - 1].err) : "—" },
        { k: "last α", v: rounds.length ? n2(rounds[rounds.length - 1].alpha) : "—" },
        { k: "ensemble accuracy", v: ok + "/10", cls: ok === 10 ? "good" : ok < 7 ? "bad" : "" },
        { k: "heaviest row", v: "x = " + D[W.indexOf(Math.max.apply(null, W))][0] },
        { k: "weight ratio", v: (Math.max.apply(null, W) / Math.min.apply(null, W)).toFixed(1) + "×" }
      ]);
      api.html('<div class="eyebrow">Weights and the weighted vote, row by row</div><div style="margin-top:8px">' +
        api.table(["x", "true", "weight now"].concat(rounds.map((r, i) => "h" + (i + 1))).concat(["Σ α·h", "final"]),
          D.map(([x, y], i) => [x, y, n3(W[i])].concat(rounds.map(r => (r.dir > 0 ? (x <= r.t) : (x > r.t)) ? 1 : 0))
            .concat([n2(F(x)), (F(x) > 0 ? 1 : 0) === y ? "✅ " + (F(x) > 0 ? 1 : 0) : "❌ " + (F(x) > 0 ? 1 : 0)]))) +
        '</div><p style="font-weight:800;margin:10px 0 0">Averaging independent trees fixes variance. ' +
        "Boosting fixes bias, because each new model is fitted to what the previous ones are still getting wrong.</p>");
    }
    draw(); P.say("No round here is clever. Each one is a single threshold. The sequence is what does the work.", "evil");
  }

  /* ================================================================ 71 knn */
  function knn(host, P) {
    const PTS = [[2, 2, 0], [2, 1, 0], [1, 1, 0], [1.5, 2.6, 0], [2.8, 1.6, 0], [3.2, 3.1, 0],
      [6, 6, 1], [6.5, 5.2, 1], [5.4, 6.4, 1], [7, 5.6, 1], [5.8, 4.4, 1], [6.8, 7, 1],
      [4.4, 4.0, 1], [3.8, 3.4, 0]];
    let q = [4.2, 3.6], drag = false;
    const api = shell(host, {
      title: "KNN — tell me who your neighbours are",
      blurb: "Drag the big pink point anywhere. There is no training here at all: every prediction is a sort of distances computed from scratch, which is exactly why KNN is slow at prediction time and instant at fit time.",
      knobs: [
        { id: "k", label: "k", min: 1, max: 9, step: 2, val: 3, fmt: v => v.toFixed(0) },
        { id: "scale", label: "😈 BREAK IT: unscale x₂ (×50)", type: "check", val: false },
        { id: "k1", label: "k = 1 (noisy)", type: "btn", cls: "ghost", onClick: () => { api.K.k.set(1); draw(); P.say("k = 1 means one weird neighbour decides everything. Flexible, and extremely gullible.", "confused"); } },
        { id: "k9", label: "k = 9 (blurred)", type: "btn", cls: "ghost", onClick: () => { api.K.k.set(9); draw(); P.say("k = 9 smooths the boundary until it stops noticing small real clusters. Pick your poison.", "cool"); } }
      ],
      notes: ["Unscale one axis and the distance metric stops caring about the other one entirely. KNN lives and dies on scaling."],
      draw: () => draw()
    });
    function pos(ev) {
      const r = api.cv.getBoundingClientRect(), sc = CW / r.width;
      return [(ev.clientX - r.left) * sc, (ev.clientY - r.top) * sc];
    }
    let lastG = null;
    const move = ev => {
      if (!drag || !lastG) return;
      const [mx, my] = pos(ev.touches ? ev.touches[0] : ev);
      q = [Math.max(0, Math.min(8, lastG.ix(mx))), Math.max(0, Math.min(8, lastG.iy(my)))];
      draw(); ev.preventDefault();
    };
    api.cv.addEventListener("pointerdown", ev => { drag = true; move(ev); });
    addEventListener("pointermove", move);
    addEventListener("pointerup", () => { drag = false; });
    function draw() {
      const k = C(), c = api.ctx, K = api.K.k.get(), sc2 = api.K.scale.get() ? 50 : 1;
      api.clear();
      const g = plot(api, { dom: [0, 8], rng: [0, 8], xl: "x₁ (scaled)", yl: "x₂", x1: CW - 230 });
      lastG = g;
      const ds = PTS.map((p, i) => ({ i, p, d: Math.hypot(p[0] - q[0], (p[1] - q[1]) * sc2) })).sort((a, b) => a.d - b.d);
      const nn = ds.slice(0, K);
      const rad = nn[nn.length - 1].d / (sc2 > 1 ? sc2 : 1);
      c.strokeStyle = k.pink; c.lineWidth = 2.5; c.setLineDash([6, 5]);
      c.beginPath(); c.arc(g.sx(q[0]), g.sy(q[1]), Math.abs(g.sx(rad) - g.sx(0)), 0, 7); c.stroke(); c.setLineDash([]);
      nn.forEach(o => line(c, g.sx(q[0]), g.sy(q[1]), g.sx(o.p[0]), g.sy(o.p[1]), k.pink, 2, [3, 3]));
      PTS.forEach((p, i) => {
        const isNN = nn.some(o => o.i === i);
        dot(c, g.sx(p[0]), g.sy(p[1]), isNN ? 9 : 6, p[2] ? k.grape : k.sun, k.line);
        if (isNN) { c.strokeStyle = k.pink; c.lineWidth = 3; c.beginPath(); c.arc(g.sx(p[0]), g.sy(p[1]), 13, 0, 7); c.stroke(); }
      });
      dot(c, g.sx(q[0]), g.sy(q[1]), 12, k.pink, k.line);
      const v1 = nn.filter(o => o.p[2] === 1).length, v0 = K - v1;
      // vote panel
      const px0 = CW - 206, py0 = 56;
      c.fillStyle = k.ink; c.font = "800 11px system-ui"; c.textAlign = "left";
      c.fillText("the k nearest, in order", px0, py0 - 8);
      nn.forEach((o, i) => {
        const y = py0 + i * 20;
        dot(c, px0 + 8, y + 6, 6, o.p[2] ? k.grape : k.sun, k.line);
        c.fillStyle = k.ink; c.font = "700 11px ui-monospace,monospace";
        c.fillText("d = " + n2(o.d) + "   → class " + o.p[2], px0 + 22, y + 10);
      });
      c.font = "800 13px system-ui"; c.fillStyle = k.ink;
      c.fillText("vote:  " + v1 + " × class 1   vs   " + v0 + " × class 0", px0, py0 + K * 20 + 18);
      c.fillText("→ predict class " + (v1 > v0 ? 1 : 0), px0, py0 + K * 20 + 38);

      api.ro([
        { k: "query", v: n2(q[0]) + ", " + n2(q[1]) }, { k: "k", v: K },
        { k: "votes class 1", v: v1 }, { k: "votes class 0", v: v0 },
        { k: "prediction", v: "class " + (v1 > v0 ? 1 : 0), cls: "good" },
        { k: "confidence", v: Math.round(100 * Math.max(v1, v0) / K) + "%" },
        { k: "distances computed", v: PTS.length }
      ]);
      api.html('<div class="eyebrow">Every distance, sorted — this is the entire algorithm</div><div style="margin-top:8px">' +
        api.table(["rank", "neighbour", "Δx₁", "Δx₂" + (sc2 > 1 ? " × 50" : ""), "distance", "class", "in the k?"],
          ds.map((o, i) => [i + 1, "(" + n2(o.p[0]) + ", " + n2(o.p[1]) + ")", n2(o.p[0] - q[0]),
            n2((o.p[1] - q[1]) * sc2), n2(o.d), o.p[2], i < K ? "✅" : ""]), K - 1) +
        '</div><p style="font-weight:800;margin:10px 0 0">Nothing was fitted. To predict one point KNN computed ' + PTS.length +
        " distances and sorted them. On a million rows that is a million distances, per prediction.</p>");
    }
    draw(); P.say("No training. No parameters. Just distances and a vote. It is the laziest algorithm that works.", "cool");
  }

  /* ================================================================ 72 svm */
  function svm(host, P) {
    const PTS = [[1.5, 2.2, -1], [2.1, 1.4, -1], [1.1, 3.1, -1], [2.8, 2.6, -1], [2.3, 3.6, -1],
      [5.4, 5.2, 1], [6.2, 4.3, 1], [4.8, 6.1, 1], [6.6, 5.9, 1], [5.0, 4.4, 1]];
    const api = shell(host, {
      title: "SVM — infinitely many lines separate these points. One is best.",
      blurb: "Rotate and shift the boundary. The dashed lines are the margins; the circled points are the ones touching them. Only those points matter — move any other point and the solution does not change at all.",
      knobs: [
        { id: "ang", label: "boundary angle", min: 0, max: 179, step: 1, val: 135, fmt: v => v.toFixed(0) + "°" },
        { id: "off", label: "offset", min: -4, max: 4, step: .05, val: 0 },
        { id: "max", label: "🎯 Maximise the margin", type: "btn", cls: "mint", onClick: () => { best(); P.say("That is the maximal-margin hyperplane. The widest street you can drive between the two classes.", "chef"); } },
        { id: "thin", label: "😈 BREAK IT: thin margin", type: "btn", cls: "pink", onClick: () => { api.K.ang.set(100); api.K.off.set(1.5); draw(); P.say("Still separates the training data perfectly. Also one noisy new point away from being wrong. Training accuracy is not the goal.", "evil"); } }
      ],
      notes: ["Margin width = 2/‖w‖. Maximising the margin is the same thing as minimising ‖w‖ subject to every point being correctly classified by at least 1."],
      draw: () => draw()
    });
    function marginOf(a, o) {
      const th = a * Math.PI / 180, w = [Math.cos(th), Math.sin(th)];
      const mid = [3.8, 3.8];
      const b = -(w[0] * (mid[0] + o * w[0]) + w[1] * (mid[1] + o * w[1]));
      let mn = 1e9, ok = true;
      PTS.forEach(p => {
        const f = w[0] * p[0] + w[1] * p[1] + b;
        if (Math.sign(f) !== p[2]) ok = false;
        mn = Math.min(mn, Math.abs(f));
      });
      return { w, b, mn, ok };
    }
    function best() {
      let bst = null;
      for (let a = 0; a < 180; a++) for (let o = -4; o <= 4; o += .05) {
        const m = marginOf(a, o);
        if (m.ok && (!bst || m.mn > bst.mn)) bst = { a, o, mn: m.mn };
      }
      if (bst) { api.K.ang.set(bst.a); api.K.off.set(Math.round(bst.o * 20) / 20); }
      draw();
    }
    function draw() {
      const k = C(), c = api.ctx, a = api.K.ang.get(), o = api.K.off.get();
      const { w, b, mn, ok } = marginOf(a, o);
      api.clear();
      const g = plot(api, { dom: [0, 8], rng: [0, 8], xl: "x₁", yl: "x₂", x1: CW - 210 });
      const yOf = (x, sh) => (-b - w[0] * x + sh) / (w[1] || 1e-6);
      const draw1 = (sh, col, wd, dash) => {
        if (Math.abs(w[1]) < .08) { const xx = (-b + sh) / w[0]; line(c, g.sx(xx), g.y0, g.sx(xx), g.y1, col, wd, dash); return; }
        line(c, g.sx(0), g.sy(yOf(0, sh)), g.sx(8), g.sy(yOf(8, sh)), col, wd, dash);
      };
      c.save(); c.beginPath(); c.rect(g.x0, g.y0, g.x1 - g.x0, g.y1 - g.y0); c.clip();
      draw1(mn, k.soft, 2.5, [7, 5]); draw1(-mn, k.soft, 2.5, [7, 5]);
      draw1(0, ok ? k.grape : k.pink, 4.5);
      c.restore();
      PTS.forEach(p => {
        const f = w[0] * p[0] + w[1] * p[1] + b, sv = Math.abs(Math.abs(f) - mn) < 1e-6 + .02;
        dot(c, g.sx(p[0]), g.sy(p[1]), sv ? 9 : 6.5, p[2] > 0 ? k.grape : k.sun, k.line);
        if (sv) { c.strokeStyle = k.pink; c.lineWidth = 3.5; c.beginPath(); c.arc(g.sx(p[0]), g.sy(p[1]), 14, 0, 7); c.stroke(); }
      });
      c.fillStyle = k.ink; c.font = "800 12px system-ui"; c.textAlign = "left";
      c.fillText(ok ? "separates both classes ✓" : "misclassifies at least one point ✗", 66, 24);
      const nw = Math.hypot(w[0], w[1]) / Math.max(mn, 1e-6);
      api.ro([
        { k: "angle", v: a + "°" }, { k: "separates?", v: ok ? "yes" : "no", cls: ok ? "good" : "bad" },
        { k: "closest distance", v: n3(mn) }, { k: "margin width 2/‖w‖", v: n3(2 * mn) },
        { k: "‖w‖ (scaled)", v: n3(nw) },
        { k: "support vectors", v: PTS.filter(p => Math.abs(Math.abs(w[0] * p[0] + w[1] * p[1] + b) - mn) < .02).length }
      ]);
      api.html('<div class="eyebrow">Signed distance of every point from the boundary</div><div style="margin-top:8px">' +
        api.table(["point", "class", "w·x + b", "|distance|", "role"],
          PTS.map(p => { const f = w[0] * p[0] + w[1] * p[1] + b;
            return ["(" + p[0] + ", " + p[1] + ")", p[2] > 0 ? "+1" : "−1", n3(f), n3(Math.abs(f)),
              Math.abs(Math.abs(f) - mn) < .02 ? "🔴 support vector" : Math.sign(f) !== p[2] ? "❌ misclassified" : "ignored"]; })) +
        '</div><p style="font-weight:800;margin:10px 0 0">Most rows say "ignored". Delete them and refit and you get the identical boundary. ' +
        "That is what makes SVMs memory-efficient and what the name means.</p>");
    }
    draw(); P.say("Infinitely many lines separate these perfectly on the training data. They will not perform equally on new data. Width is the tiebreaker.", "brain");
  }

  /* ================================================================ 75 naive bayes */
  function bayes(host, P) {
    // tiny spam corpus
    const WORDS = ["free", "meeting", "winner", "project", "click", "deadline"];
    const COUNT = { // [in spam, in ham]
      free: [8, 1], meeting: [1, 9], winner: [7, 0], project: [1, 11], click: [9, 2], deadline: [0, 8]
    };
    const NS = 12, NH = 18, V = WORDS.length;
    let on = { free: 1, meeting: 0, winner: 0, project: 0, click: 1, deadline: 0 };
    const api = shell(host, {
      title: "Naive Bayes — multiply the evidence, then normalise",
      blurb: "A 30-email corpus: 12 spam, 18 ham. Toggle the words present in a new email. Every number below comes from counting, plus Laplace smoothing so a zero count cannot annihilate the whole product.",
      knobs: WORDS.map(w => ({ id: w, label: 'word "' + w + '" present', type: "check", val: on[w] }))
        .concat([{ id: "k", label: "Laplace α", min: 0, max: 2, step: .1, val: 1, fmt: n2 },
          { id: "z", label: "😈 BREAK IT: α = 0", type: "btn", cls: "pink", onClick: () => { api.K.k.set(0); api.K.deadline && draw(); P.say('Set α to 0 and tick "deadline" — it never appears in spam, so P(spam|email) collapses to exactly zero no matter what else is in the email. One unseen word vetoes everything.', "evil"); } }]),
      notes: ["Naive means it assumes words are independent given the class. They are not. It works anyway, because for ranking you only need the right winner, not the right probability."],
      draw: () => draw(), h: 300
    });
    function draw() {
      const k = C(), c = api.ctx, al = api.K.k.get();
      WORDS.forEach(w => { on[w] = api.K[w].get() ? 1 : 0; });
      api.clear();
      const pS = NS / (NS + NH), pH = NH / (NS + NH);
      let lS = Math.log(pS), lH = Math.log(pH);
      const rows = WORDS.map(w => {
        const ps = (COUNT[w][0] + al) / (NS + 2 * al), ph = (COUNT[w][1] + al) / (NH + 2 * al);
        const useS = on[w] ? ps : 1 - ps, useH = on[w] ? ph : 1 - ph;
        lS += Math.log(Math.max(useS, 1e-300)); lH += Math.log(Math.max(useH, 1e-300));
        return [w, on[w] ? "present" : "absent", COUNT[w][0] + "/" + NS, COUNT[w][1] + "/" + NH, n3(useS), n3(useH)];
      });
      const mx = Math.max(lS, lH), eS = Math.exp(lS - mx), eH = Math.exp(lH - mx);
      const post = eS / (eS + eH);
      // bar chart
      const bw = 190, bx = 90, by = 70;
      c.fillStyle = k.ink; c.font = "800 13px system-ui"; c.textAlign = "left";
      c.fillText("posterior P(class | this email)", bx, by - 16);
      [["SPAM", post, k.pink], ["HAM", 1 - post, k.mint]].forEach(([lbl, v, col], i) => {
        const y = by + i * 54;
        c.fillStyle = k.ink; c.font = "800 12px system-ui"; c.fillText(lbl, bx, y + 16);
        c.strokeStyle = k.line; c.lineWidth = 3;
        c.fillStyle = col; c.fillRect(bx + 60, y, Math.max(2, bw * 2 * v), 24);
        c.strokeRect(bx + 60, y, bw * 2, 24);
        c.fillStyle = k.ink; c.font = "800 13px ui-monospace,monospace";
        c.fillText((v * 100).toFixed(2) + "%", bx + 60 + bw * 2 + 12, y + 18);
      });
      c.fillStyle = k.ink; c.font = "800 15px system-ui";
      c.fillText("verdict: " + (post > .5 ? "SPAM 🚨" : "HAM ✅") + "   (log-odds " + n2(lS - lH) + ")", bx, by + 150);
      c.font = "700 11px system-ui"; c.fillStyle = k.soft;
      c.fillText("logs are used because multiplying 6 small probabilities underflows to 0 fast", bx, by + 175);

      api.ro([
        { k: "prior P(spam)", v: n3(pS) }, { k: "log P(spam)+Σ", v: n2(lS) },
        { k: "log P(ham)+Σ", v: n2(lH) }, { k: "log-odds", v: n2(lS - lH) },
        { k: "P(spam | email)", v: n3(post), cls: post > .5 ? "bad" : "good" },
        { k: "α (smoothing)", v: n2(al) }
      ]);
      api.html('<div class="eyebrow">Every likelihood, counted from the corpus</div><div style="margin-top:8px">' +
        api.table(["word", "in this email", "spam count", "ham count", "P(·|spam)", "P(·|ham)"], rows) +
        '</div><div class="trace" style="margin-top:14px">' + [
          ["Start from the priors", "log(12/30) = " + n2(Math.log(pS)) + "   vs   log(18/30) = " + n2(Math.log(pH))],
          ["Add one log-likelihood per word", "Σ over the six words above"],
          ["Totals", "spam " + n2(lS) + "   ham " + n2(lH)],
          ["Normalise (softmax of two numbers)", "e^" + n2(lS - mx) + " / (e^" + n2(lS - mx) + " + e^" + n2(lH - mx) + ")"],
          ["Posterior", n3(post)]
        ].map((r, i) => (i ? '<div class="arrowdown">↓</div>' : "") +
          '<div class="tstep done"><span class="idx">' + (i + 1) + '</span><div style="min-width:0"><div class="lbl">' + r[0] +
          '</div><div style="font-weight:700;font-family:var(--mono);font-size:13px;overflow-wrap:anywhere">' + r[1] + "</div></div></div>").join("") +
        '</div><p style="font-weight:800;margin:12px 0 0">Modelling how 50,000 words co-occur needs more data than exists. ' +
        "Assuming they do not co-occur at all needs one count per word. That is the trade, and it is usually worth it.</p>");
    }
    draw(); P.say("The independence assumption is a lie. A useful, extremely fast lie.", "evil");
  }

  /* ================================================================ 76 k-means */
  function kmeans(host, P) {
    const PTS = [];
    let sd = 5; const r = () => { sd = (sd * 1103515245 + 12345) % 2147483648; return sd / 2147483648; };
    [[2, 2], [7, 2.5], [4.5, 7]].forEach(ctr => { for (let i = 0; i < 16; i++) PTS.push([ctr[0] + (r() - .5) * 3, ctr[1] + (r() - .5) * 3]); });
    let cen = [], asg = [], iter = 0, phase = "assign", hist = [];
    function seed(K) { sd = Math.floor(Math.random() * 1e6) + 1; cen = []; for (let i = 0; i < K; i++) cen.push([r() * 9 + .5, r() * 9 + .5]); asg = PTS.map(() => -1); iter = 0; phase = "assign"; hist = []; }
    function assign() {
      asg = PTS.map(p => { let b = 0, bd = 1e9; cen.forEach((c, i) => { const d = (c[0] - p[0]) ** 2 + (c[1] - p[1]) ** 2; if (d < bd) { bd = d; b = i; } }); return b; });
      phase = "update";
    }
    function update() {
      cen = cen.map((c, i) => {
        const m = PTS.filter((_, j) => asg[j] === i);
        return m.length ? [m.reduce((a, p) => a + p[0], 0) / m.length, m.reduce((a, p) => a + p[1], 0) / m.length] : c;
      });
      iter++; hist.push(inertia()); phase = "assign";
    }
    const inertia = () => PTS.reduce((a, p, j) => asg[j] < 0 ? a : a + (p[0] - cen[asg[j]][0]) ** 2 + (p[1] - cen[asg[j]][1]) ** 2, 0);
    const api = shell(host, {
      title: "K-Means — two steps, repeated until nothing moves",
      blurb: "48 unlabelled points. Step 1 assigns every point to its nearest centroid. Step 2 moves every centroid to the mean of its members. That is the whole algorithm, and the inertia below can only go down.",
      knobs: [
        { id: "k", label: "K", min: 2, max: 5, step: 1, val: 3, fmt: v => v.toFixed(0) },
        { id: "st", label: "▶ Next step", type: "btn", cls: "grape", onClick: () => { phase === "assign" ? assign() : update(); draw();
          P.say(phase === "update" ? "Assigned. Every point now belongs to whoever is nearest. Nothing has moved yet." : "Centroids moved to the mean of their members. Inertia: " + n2(inertia()) + ". It cannot go up.", "cool"); } },
        { id: "run", label: "⏩ Run to convergence", type: "btn", cls: "mint", onClick: () => { for (let i = 0; i < 24; i++) { assign(); update(); } draw(); P.say("Converged after a handful of iterations. Hit re-seed a few times and watch it land somewhere different — that is why sklearn runs it 10 times and keeps the best.", "chef"); } },
        { id: "sd", label: "🎲 Re-seed centroids", type: "btn", cls: "pink", onClick: () => { seed(api.K.k.get()); draw(); } }
      ],
      notes: ["Inertia is the sum of squared distances to each point's own centroid. The elbow method plots it against K and looks for where the gain flattens."],
      draw: () => { if (cen.length !== api.K.k.get()) seed(api.K.k.get()); draw(); }
    });
    function draw() {
      const k = C(), c = api.ctx, K = api.K.k.get();
      if (cen.length !== K) seed(K);
      api.clear();
      const cols = [k.grape, k.sun, k.mint, k.pink, k.tan];
      const g = plot(api, { dom: [0, 10], rng: [0, 10], xl: "x₁", yl: "x₂", x1: CW - 200 });
      PTS.forEach((p, j) => {
        if (asg[j] >= 0) line(c, g.sx(p[0]), g.sy(p[1]), g.sx(cen[asg[j]][0]), g.sy(cen[asg[j]][1]), cols[asg[j] % 5], 1.2);
      });
      PTS.forEach((p, j) => dot(c, g.sx(p[0]), g.sy(p[1]), 5.5, asg[j] >= 0 ? cols[asg[j] % 5] : k.soft, k.line));
      cen.forEach((cc, i) => {
        c.save(); c.translate(g.sx(cc[0]), g.sy(cc[1])); c.rotate(Math.PI / 4);
        c.fillStyle = cols[i % 5]; c.strokeStyle = k.line; c.lineWidth = 3.5;
        c.fillRect(-9, -9, 18, 18); c.strokeRect(-9, -9, 18, 18); c.restore();
      });
      // inertia history
      const px0 = CW - 186, py0 = 52, pw = 162, ph = 120;
      c.strokeStyle = k.ink; c.lineWidth = 2.5; c.strokeRect(px0, py0, pw, ph);
      c.fillStyle = k.ink; c.font = "800 11px system-ui"; c.textAlign = "left";
      c.fillText("inertia per iteration", px0, py0 - 8);
      if (hist.length > 1) {
        const hi = Math.max.apply(null, hist);
        c.strokeStyle = k.pink; c.lineWidth = 3; c.beginPath();
        hist.forEach((v, i) => { const x = px0 + pw * i / (hist.length - 1), y = py0 + ph - ph * v / hi; i ? c.lineTo(x, y) : c.moveTo(x, y); });
        c.stroke();
        hist.forEach((v, i) => dot(c, px0 + pw * i / (hist.length - 1), py0 + ph - ph * v / hi, 3.5, k.pink, k.line));
      }
      api.ro([
        { k: "K", v: K }, { k: "iteration", v: iter },
        { k: "next step", v: phase === "assign" ? "① assign" : "② move centroids" },
        { k: "inertia", v: n2(inertia()), cls: "good" },
        { k: "cluster sizes", v: cen.map((_, i) => asg.filter(a => a === i).length).join(" / ") },
        { k: "unassigned", v: asg.filter(a => a < 0).length }
      ]);
      api.html('<div class="eyebrow">Centroids, members and their contribution to inertia</div><div style="margin-top:8px">' +
        api.table(["cluster", "centroid x₁", "centroid x₂", "members", "its share of inertia"],
          cen.map((cc, i) => { const m = PTS.filter((_, j) => asg[j] === i);
            return [i + 1, n2(cc[0]), n2(cc[1]), m.length,
              n2(m.reduce((a, p) => a + (p[0] - cc[0]) ** 2 + (p[1] - cc[1]) ** 2, 0))]; })) +
        '</div><p style="font-weight:800;margin:10px 0 0">K-Means assumes round clusters of similar size. ' +
        "Re-seed a few times and you will eventually get a bad split that it is perfectly happy with — it is a local minimum, not the answer.</p>");
    }
    seed(3); draw();
    P.say("100,000 customers, no labels, four segments by Friday. This is that, 48 points at a time.", "brain");
  }

  /* ================================================================ 33 pca */
  function pca(host, P) {
    const PTS = [];
    let sd = 9; const r = () => { sd = (sd * 1103515245 + 12345) % 2147483648; return sd / 2147483648 - .5; };
    for (let i = 0; i < 40; i++) { const t = r() * 7; PTS.push([5 + t + r() * 1.6, 5 + .72 * t + r() * 1.6]); }
    const api = shell(host, {
      title: "PCA — find the direction the data actually varies in",
      blurb: "Forty correlated points. PCA centres them, computes the 2×2 covariance matrix, and takes its eigenvectors. The first one is the direction of greatest variance; projecting onto it is the dimension reduction.",
      knobs: [
        { id: "ctr", label: "centre the data (subtract the mean)", type: "check", val: true },
        { id: "proj", label: "show the projection onto PC1", type: "check", val: true },
        { id: "ang", label: "try your own direction", min: 0, max: 179, step: 1, val: 36, fmt: v => v.toFixed(0) + "°" },
        { id: "best", label: "🎯 Snap to PC1", type: "btn", cls: "mint", onClick: () => { api.K.ang.set(Math.round(pc1ang())); draw(); P.say("That angle is not a guess — it is the eigenvector of the covariance matrix with the larger eigenvalue. Variance along it is maximal, and no other direction beats it.", "chef"); } }
      ],
      notes: ["Variance along your chosen direction is shown live. Drag the angle around: you cannot beat PC1. That maximum is what the eigenvector is."],
      draw: () => draw()
    });
    const mean = [PTS.reduce((a, p) => a + p[0], 0) / PTS.length, PTS.reduce((a, p) => a + p[1], 0) / PTS.length];
    function cov() {
      let xx = 0, yy = 0, xy = 0;
      PTS.forEach(p => { const a = p[0] - mean[0], b = p[1] - mean[1]; xx += a * a; yy += b * b; xy += a * b; });
      const n = PTS.length - 1; return [xx / n, xy / n, yy / n];
    }
    function eig() { // symmetric 2x2
      const [a, b, d] = cov();
      const tr = a + d, det = a * d - b * b;
      const l1 = tr / 2 + Math.sqrt(Math.max(0, tr * tr / 4 - det)), l2 = tr - l1;
      const v1 = Math.abs(b) > 1e-9 ? [l1 - d, b] : [1, 0];
      const nn = Math.hypot(v1[0], v1[1]);
      return { l1, l2, v1: [v1[0] / nn, v1[1] / nn] };
    }
    const pc1ang = () => { const e = eig(); let a = Math.atan2(e.v1[1], e.v1[0]) * 180 / Math.PI; return (a + 180) % 180; };
    function draw() {
      const k = C(), c = api.ctx, ctr = api.K.ctr.get(), th = api.K.ang.get() * Math.PI / 180;
      const u = [Math.cos(th), Math.sin(th)];
      api.clear();
      const off = ctr ? mean : [0, 0];
      const dm = ctr ? [-6, 6] : [0, 12];
      const g = plot(api, { dom: dm, rng: dm, xl: ctr ? "x₁ − mean" : "x₁", yl: ctr ? "x₂ − mean" : "x₂", x1: CW - 200 });
      const e = eig();
      const Q = PTS.map(p => [p[0] - off[0], p[1] - off[1]]);
      if (ctr) { line(c, g.sx(dm[0]), g.sy(0), g.sx(dm[1]), g.sy(0), k.soft, 1.5, [4, 4]); line(c, g.sx(0), g.sy(dm[0]), g.sx(0), g.sy(dm[1]), k.soft, 1.5, [4, 4]); }
      // your direction
      const o = ctr ? [0, 0] : mean;
      line(c, g.sx(o[0] - u[0] * 9), g.sy(o[1] - u[1] * 9), g.sx(o[0] + u[0] * 9), g.sy(o[1] + u[1] * 9), k.sun, 4);
      // PC1 / PC2
      const v1 = e.v1, v2 = [-v1[1], v1[0]];
      line(c, g.sx(o[0] - v1[0] * 9), g.sy(o[1] - v1[1] * 9), g.sx(o[0] + v1[0] * 9), g.sy(o[1] + v1[1] * 9), k.grape, 3, [8, 5]);
      line(c, g.sx(o[0] - v2[0] * 4), g.sy(o[1] - v2[1] * 4), g.sx(o[0] + v2[0] * 4), g.sy(o[1] + v2[1] * 4), k.mint, 3, [8, 5]);
      // points + projections onto chosen direction
      let vr = 0;
      Q.forEach((q, i) => {
        const t = q[0] * u[0] + q[1] * u[1]; vr += t * t;
        const pr = [o[0] + u[0] * t, o[1] + u[1] * t];
        if (api.K.proj.get()) {
          line(c, g.sx(q[0] + (ctr ? 0 : 0)), g.sy(q[1]), g.sx(pr[0]), g.sy(pr[1]), k.pink, 1.3, [3, 3]);
          dot(c, g.sx(pr[0]), g.sy(pr[1]), 3.5, k.pink, k.line);
        }
        dot(c, g.sx(q[0]), g.sy(q[1]), 5.5, k.grape, k.line);
      });
      vr /= PTS.length - 1;
      c.fillStyle = k.ink; c.font = "800 11px system-ui"; c.textAlign = "left";
      c.fillText("— your direction   – – PC1   – – PC2   ● projections", 66, 24);
      const [a, b, d] = cov();
      api.ro([
        { k: "variance along yours", v: n3(vr) },
        { k: "λ₁ (PC1 variance)", v: n3(e.l1), cls: "good" },
        { k: "λ₂ (PC2 variance)", v: n3(e.l2) },
        { k: "PC1 angle", v: pc1ang().toFixed(0) + "°" },
        { k: "explained by PC1", v: (100 * e.l1 / (e.l1 + e.l2)).toFixed(1) + "%" },
        { k: "you vs PC1", v: (100 * vr / e.l1).toFixed(1) + "%", cls: vr / e.l1 > .99 ? "good" : "bad" }
      ]);
      api.html('<div class="eyebrow">The covariance matrix, and what comes out of it</div><div style="margin-top:8px">' +
        api.table(["", "x₁", "x₂"], [["x₁", n3(a), n3(b)], ["x₂", n3(b), n3(d)]]) +
        '</div><div class="trace" style="margin-top:14px">' + [
          ["① Centre", "subtract the mean (" + n2(mean[0]) + ", " + n2(mean[1]) + ") from every row"],
          ["② Covariance", "trace = " + n3(a + d) + ",  determinant = " + n3(a * d - b * b)],
          ["③ Eigenvalues", "λ = tr/2 ± √(tr²/4 − det) → " + n3(e.l1) + " and " + n3(e.l2)],
          ["④ Eigenvector for λ₁", "direction (" + n3(e.v1[0]) + ", " + n3(e.v1[1]) + ") = " + pc1ang().toFixed(0) + "°"],
          ["⑤ Project", "z = x·v₁ — one number replaces two, keeping " + (100 * e.l1 / (e.l1 + e.l2)).toFixed(1) + "% of the variance"]
        ].map((r, i) => (i ? '<div class="arrowdown">↓</div>' : "") +
          '<div class="tstep done"><span class="idx">' + (i + 1) + '</span><div style="min-width:0"><div class="lbl">' + r[0] +
          '</div><div style="font-weight:700;font-family:var(--mono);font-size:13px;overflow-wrap:anywhere">' + r[1] + "</div></div></div>").join("") +
        "</div><p style=\"font-weight:800;margin:12px 0 0\">PCA is unsupervised: it never saw a target. It keeps the directions with the most variance, " +
        "which is not always the directions that predict your label. Those are different things.</p>");
    }
    draw(); P.say("Two hundred correlated features, two axes you can plot, and you are not allowed to delete 198 columns at random. This is the fix.", "brain");
  }

  /* ================================================================ bonus: neural net */
  function nn(host, P) {
    // 2 inputs -> 2 hidden (sigmoid) -> 1 output (sigmoid), BCE loss
    let W1 = [[.7, .2], [-.4, .6]], b1 = [.1, -.2], W2 = [.9, -.5], b2 = .05;
    let target = 1, steps = 0;
    const sig = z => 1 / (1 + Math.exp(-z));
    const api = shell(host, {
      title: "Neural network — forward pass and backprop, every number on screen",
      blurb: "Two inputs, two hidden neurons, one output. Nothing here is a black box: each multiplication, each sum, each activation and each gradient is printed. Change an input and watch the change travel.",
      knobs: [
        { id: "x1", label: "x₁", min: -3, max: 3, step: .1, val: 2 },
        { id: "x2", label: "x₂", min: -3, max: 3, step: .1, val: 3 },
        { id: "lr", label: "learning rate η", min: .05, max: 2, step: .05, val: .5 },
        { id: "tg", label: "target y", min: 0, max: 1, step: 1, val: 1, fmt: v => v.toFixed(0) },
        { id: "bp", label: "⬅️ One backprop step", type: "btn", cls: "grape", onClick: () => { back(); } },
        { id: "run", label: "⏩ 50 steps", type: "btn", cls: "mint", onClick: () => { for (let i = 0; i < 50; i++) back(true); draw(); P.say("Loss is now " + n3(fwd().loss) + ". Fifty repetitions of exactly the arithmetic in the table. That is training.", "chef"); } },
        { id: "rs", label: "↺ Reset weights", type: "btn", onClick: () => { W1 = [[.7, .2], [-.4, .6]]; b1 = [.1, -.2]; W2 = [.9, -.5]; b2 = .05; steps = 0; draw(); } }
      ],
      notes: ["∂L/∂z₂ = ŷ − y for a sigmoid output with binary cross-entropy. That cancellation is the reason this loss is used and squared error is not."],
      draw: () => draw(), h: 420
    });
    function fwd() {
      const x = [api.K.x1.get(), api.K.x2.get()];
      const z1 = [W1[0][0] * x[0] + W1[0][1] * x[1] + b1[0], W1[1][0] * x[0] + W1[1][1] * x[1] + b1[1]];
      const a1 = z1.map(sig);
      const z2 = W2[0] * a1[0] + W2[1] * a1[1] + b2;
      const yh = sig(z2);
      const y = api.K.tg.get();
      const loss = -(y * Math.log(Math.max(yh, 1e-9)) + (1 - y) * Math.log(Math.max(1 - yh, 1e-9)));
      return { x, z1, a1, z2, yh, y, loss };
    }
    function back(quiet) {
      const f = fwd();
      const dz2 = f.yh - f.y;
      const dW2 = [dz2 * f.a1[0], dz2 * f.a1[1]], db2 = dz2;
      const da1 = [dz2 * W2[0], dz2 * W2[1]];
      const dz1 = [da1[0] * f.a1[0] * (1 - f.a1[0]), da1[1] * f.a1[1] * (1 - f.a1[1])];
      const lr = api.K.lr.get();
      const dW1 = [[dz1[0] * f.x[0], dz1[0] * f.x[1]], [dz1[1] * f.x[0], dz1[1] * f.x[1]]];
      W2 = [W2[0] - lr * dW2[0], W2[1] - lr * dW2[1]]; b2 -= lr * db2;
      W1 = [[W1[0][0] - lr * dW1[0][0], W1[0][1] - lr * dW1[0][1]], [W1[1][0] - lr * dW1[1][0], W1[1][1] - lr * dW1[1][1]]];
      b1 = [b1[0] - lr * dz1[0], b1[1] - lr * dz1[1]];
      steps++;
      if (!quiet) { draw(); P.say("Loss went " + n3(f.loss) + " → " + n3(fwd().loss) + ". Every weight moved against its own gradient. Backprop is the chain rule and nothing else.", "brain"); }
    }
    function draw() {
      const k = C(), c = api.ctx; api.clear();
      const f = fwd();
      const L = [[90, 140], [90, 280]], H = [[330, 140], [330, 280]], O = [570, 210];
      const node = (p, fill, top, bot) => {
        dot(c, p[0], p[1], 34, fill, k.line);
        c.fillStyle = "#241046"; c.font = "800 13px ui-monospace,monospace"; c.textAlign = "center";
        c.fillText(top, p[0], p[1] - 3); c.font = "700 11px ui-monospace,monospace";
        c.fillText(bot, p[0], p[1] + 14);
      };
      const edge = (a, b, w, val) => {
        const col = w > 0 ? k.mint : k.pink;
        c.strokeStyle = col; c.lineWidth = Math.min(9, 1.5 + Math.abs(w) * 3.4);
        c.beginPath(); c.moveTo(a[0] + 34, a[1]); c.lineTo(b[0] - 34, b[1]); c.stroke();
        const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
        c.fillStyle = k.surf; c.strokeStyle = k.line; c.lineWidth = 2;
        c.beginPath(); c.roundRect ? c.roundRect(mx - 44, my - 13, 88, 26, 7) : c.rect(mx - 44, my - 13, 88, 26);
        c.fill(); c.stroke();
        c.fillStyle = k.ink; c.font = "800 10.5px ui-monospace,monospace"; c.textAlign = "center";
        c.fillText("w=" + n2(w), mx, my - 2); c.fillText(val, mx, my + 10);
      };
      [0, 1].forEach(i => [0, 1].forEach(j =>
        edge(L[j], H[i], W1[i][j], n2(f.x[j]) + "×" + n2(W1[i][j]) + "=" + n2(f.x[j] * W1[i][j]))));
      [0, 1].forEach(i => edge(H[i], O, W2[i], n2(f.a1[i]) + "×" + n2(W2[i]) + "=" + n2(f.a1[i] * W2[i])));
      node(L[0], k.sun, "x₁", n2(f.x[0])); node(L[1], k.sun, "x₂", n2(f.x[1]));
      node(H[0], k.grape, "σ=" + n2(f.a1[0]), "z=" + n2(f.z1[0]));
      node(H[1], k.grape, "σ=" + n2(f.a1[1]), "z=" + n2(f.z1[1]));
      node(O, k.mint, "ŷ=" + n3(f.yh), "z=" + n2(f.z2));
      c.fillStyle = k.ink; c.font = "800 12px system-ui"; c.textAlign = "center";
      c.fillText("inputs", 90, 60); c.fillText("hidden layer (sigmoid)", 330, 60); c.fillText("output", 570, 60);
      c.fillText("target y = " + f.y + "    loss = " + n3(f.loss), 330, api.H - 18);
      c.textAlign = "left"; c.font = "700 11px system-ui"; c.fillStyle = k.soft;
      c.fillText("green edge = positive weight, pink = negative, thickness = |w|", 24, api.H - 40);

      const dz2 = f.yh - f.y;
      const da1 = [dz2 * W2[0], dz2 * W2[1]];
      const dz1 = [da1[0] * f.a1[0] * (1 - f.a1[0]), da1[1] * f.a1[1] * (1 - f.a1[1])];
      api.ro([
        { k: "z₂", v: n3(f.z2) }, { k: "ŷ = σ(z₂)", v: n3(f.yh), cls: Math.abs(f.yh - f.y) < .2 ? "good" : "bad" },
        { k: "loss (BCE)", v: n3(f.loss) }, { k: "∂L/∂z₂ = ŷ−y", v: n3(dz2) },
        { k: "∂L/∂w₂₁", v: n3(dz2 * f.a1[0]) }, { k: "∂L/∂z₁₁", v: n3(dz1[0]) },
        { k: "steps taken", v: steps }
      ]);
      api.trace("Forward pass, then backward pass — every operation", [
        ["x₁ × w₁₁", n2(f.x[0]) + " × " + n2(W1[0][0]), n2(f.x[0] * W1[0][0])],
        ["x₂ × w₁₂", n2(f.x[1]) + " × " + n2(W1[0][1]), n2(f.x[1] * W1[0][1])],
        ["sum + bias → z₁₁", n2(f.x[0] * W1[0][0]) + " + " + n2(f.x[1] * W1[0][1]) + " + " + n2(b1[0]), n2(f.z1[0])],
        ["activation σ(z₁₁) → a₁₁", "1 / (1 + e^" + n2(-f.z1[0]) + ")", n3(f.a1[0])],
        ["second hidden neuron, same way", "z₁₂ = " + n2(f.z1[1]) + " → a₁₂", n3(f.a1[1])],
        ["output sum + bias → z₂", n2(f.a1[0]) + "×" + n2(W2[0]) + " + " + n2(f.a1[1]) + "×" + n2(W2[1]) + " + " + n2(b2), n2(f.z2)],
        ["prediction ŷ = σ(z₂)", "1 / (1 + e^" + n2(-f.z2) + ")", n3(f.yh)],
        ["loss  −[y·ln ŷ + (1−y)·ln(1−ŷ)]", "y = " + f.y, n3(f.loss)],
        ["⬅ backward: ∂L/∂z₂ = ŷ − y", n3(f.yh) + " − " + f.y, n3(dz2)],
        ["∂L/∂w₂ = ∂L/∂z₂ × a₁", n3(dz2) + " × [" + n3(f.a1[0]) + ", " + n3(f.a1[1]) + "]",
          n3(dz2 * f.a1[0]) + ", " + n3(dz2 * f.a1[1])],
        ["chain into the hidden layer: ∂L/∂a₁ = ∂L/∂z₂ × w₂", "[" + n3(da1[0]) + ", " + n3(da1[1]) + "]", ""],
        ["through the sigmoid: × a(1−a)", "[" + n3(dz1[0]) + ", " + n3(dz1[1]) + "]", ""],
        ["∂L/∂w₁₁ = ∂L/∂z₁₁ × x₁", n3(dz1[0]) + " × " + n2(f.x[0]), n3(dz1[0] * f.x[0])],
        ["update every weight: w ← w − η·∂L/∂w", "η = " + n2(api.K.lr.get()), "press the button"]
      ]);
    }
    draw(); P.say("Input changed → weighted value changed → activation changed → prediction changed → loss changed. Follow it left to right, then watch it come back.", "brain");
  }

  return { linreg, gd, biasvar, logreg, tree, forest, adaboost, knn, svm, bayes, kmeans, pca, nn };
})();
