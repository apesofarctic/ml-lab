/* Three lab creatures and a doodle set, drawn as inline SVG so they theme and scale. */
window.CAST = (function () {
  "use strict";

  const L = "#241046";            // outline, same in both themes (sits on bright fills)
  const W = "#FFFFFF";

  /* ---------------------------------------------------------------- eyes & mouths */
  function eyes(kind, cx1, cx2, cy, r) {
    const wink = (x) => `<path d="M${x - r} ${cy} q${r} ${-r * 0.9} ${r * 2} 0" fill="none" stroke="${L}" stroke-width="4" stroke-linecap="round"/>`;
    const dead = (x) => `<g stroke="${L}" stroke-width="4" stroke-linecap="round">
      <line x1="${x - r * .6}" y1="${cy - r * .6}" x2="${x + r * .6}" y2="${cy + r * .6}"/>
      <line x1="${x + r * .6}" y1="${cy - r * .6}" x2="${x - r * .6}" y2="${cy + r * .6}"/></g>`;
    const ball = (x, pr, off) => `<circle cx="${x}" cy="${cy}" r="${r}" fill="${W}" stroke="${L}" stroke-width="3"/>
      <circle cx="${x + (off || 0)}" cy="${cy + (off ? 1 : 0)}" r="${pr}" fill="${L}"/>
      <circle cx="${x - pr * .45}" cy="${cy - pr * .5}" r="${pr * .34}" fill="${W}"/>`;
    const star = (x) => `<circle cx="${x}" cy="${cy}" r="${r}" fill="${W}" stroke="${L}" stroke-width="3"/>
      <path d="M${x} ${cy - r * .75} l${r * .22} ${r * .45} l${r * .5} ${r * .07} l-${r * .38} ${r * .35}
        l${r * .12} ${r * .5} l-${r * .46} -${r * .26} l-${r * .46} ${r * .26} l${r * .12} -${r * .5}
        l-${r * .38} -${r * .35} l${r * .5} -${r * .07} z" fill="${L}"/>`;
    switch (kind) {
      case "happy":  return wink(cx1) + wink(cx2);
      case "wow":    return ball(cx1, r * .62, 0) + ball(cx2, r * .62, 0);
      case "sad":    return ball(cx1, r * .45, -1) + ball(cx2, r * .45, 1);
      case "dead":   return dead(cx1) + dead(cx2);
      case "smug":   return `<path d="M${cx1 - r} ${cy + 2} q${r} ${r * .8} ${r * 2} 0" fill="none" stroke="${L}" stroke-width="4" stroke-linecap="round"/>
                             <path d="M${cx2 - r} ${cy + 2} q${r} ${r * .8} ${r * 2} 0" fill="none" stroke="${L}" stroke-width="4" stroke-linecap="round"/>`;
      case "star":   return star(cx1) + star(cx2);
      default:       return ball(cx1, r * .5, 0) + ball(cx2, r * .5, 0);
    }
  }
  function mouth(kind, cx, cy, w, col) {
    col = col || L;
    switch (kind) {
      case "happy": return `<path d="M${cx - w} ${cy} q${w} ${w * 1.1} ${w * 2} 0 z" fill="${col}" stroke="${L}" stroke-width="3" stroke-linejoin="round"/>`;
      case "wow":   return `<ellipse cx="${cx}" cy="${cy + 2}" rx="${w * .55}" ry="${w * .8}" fill="${col}" stroke="${L}" stroke-width="3"/>`;
      case "sad":   return `<path d="M${cx - w * .8} ${cy + 4} q${w * .8} ${-w * .9} ${w * 1.6} 0" fill="none" stroke="${L}" stroke-width="4" stroke-linecap="round"/>`;
      case "dead":  return `<path d="M${cx - w * .7} ${cy} h${w * 1.4}" stroke="${L}" stroke-width="4" stroke-linecap="round"/>`;
      case "smug":  return `<path d="M${cx - w * .8} ${cy} q${w * .55} ${w * .55} ${w * 1.2} -${w * .3}" fill="none" stroke="${L}" stroke-width="4" stroke-linecap="round"/>`;
      default:      return `<path d="M${cx - w * .7} ${cy} q${w * .7} ${w * .6} ${w * 1.4} 0" fill="none" stroke="${L}" stroke-width="4" stroke-linecap="round"/>`;
    }
  }
  const sweat = (x, y) => `<path d="M${x} ${y} q-5 8 0 11 q5 -3 0 -11z" fill="#8FD4FF" stroke="${L}" stroke-width="2.5"/>`;
  const blush = (x1, x2, y) => `<ellipse cx="${x1}" cy="${y}" rx="7" ry="4" fill="#FF8FB8" opacity=".75"/>
                                <ellipse cx="${x2}" cy="${y}" rx="7" ry="4" fill="#FF8FB8" opacity=".75"/>`;
  const spark = (x, y, s) => `<path d="M${x} ${y - s} l${s * .3} ${s * .7} l${s * .7} ${s * .3} l-${s * .7} ${s * .3}
    l-${s * .3} ${s * .7} l-${s * .3} -${s * .7} l-${s * .7} -${s * .3} l${s * .7} -${s * .3} z" fill="#FFC31E" stroke="${L}" stroke-width="2"/>`;

  /* ---------------------------------------------------------------- the three of them */
  // POISE — the sarcastic lab robot
  function poise(e) {
    const head = { neutral:"#A77BFF", happy:"#A77BFF", wow:"#FFC31E", sad:"#8FD4FF", dead:"#9A8CB8", smug:"#FF6BA6" }[e] || "#A77BFF";
    return `
    <line x1="60" y1="27" x2="60" y2="13" stroke="${L}" stroke-width="5" stroke-linecap="round"/>
    <circle cx="60" cy="9" r="7" fill="${e === "dead" ? "#9A8CB8" : "#FFC31E"}" stroke="${L}" stroke-width="4"/>
    <line x1="46" y1="99" x2="40" y2="112" stroke="${L}" stroke-width="6" stroke-linecap="round"/>
    <line x1="74" y1="99" x2="80" y2="112" stroke="${L}" stroke-width="6" stroke-linecap="round"/>
    <rect x="34" y="79" width="52" height="26" rx="11" fill="${W}" stroke="${L}" stroke-width="4"/>
    <line x1="60" y1="81" x2="60" y2="103" stroke="${L}" stroke-width="3"/>
    <rect x="66" y="87" width="10" height="9" rx="2" fill="#07C4A0" stroke="${L}" stroke-width="3"/>
    <path d="M34 85 q-14 2 -17 14" fill="none" stroke="${L}" stroke-width="6" stroke-linecap="round"/>
    <path d="M86 85 q14 2 17 14" fill="none" stroke="${L}" stroke-width="6" stroke-linecap="round"/>
    <rect x="22" y="27" width="76" height="56" rx="20" fill="${head}" stroke="${L}" stroke-width="4"/>
    <rect x="30" y="35" width="60" height="38" rx="14" fill="#2A1A4D" stroke="${L}" stroke-width="3"/>
    ${eyes(e, 47, 73, 53, 11)}
    ${mouth(e, 60, 68, 11, "#9DE8C4")}
    ${e === "sad" ? sweat(92, 40) : ""}
    ${e === "happy" ? spark(104, 30, 9) + spark(18, 40, 7) : ""}`;
  }

  // BYTE — an anxious little data blob
  function byte(e) {
    const body = { neutral:"#07C4A0", happy:"#2DE0BB", wow:"#FFC31E", sad:"#8FD4FF", dead:"#9A8CB8", smug:"#FF6BA6" }[e] || "#07C4A0";
    const wob = e === "wow" ? "M18 86 q-6 -56 42 -58 q48 2 42 58 q-22 12 -42 12 q-20 0 -42 -12z"
                            : "M20 88 q-4 -54 40 -56 q44 2 40 56 q-20 10 -40 10 q-20 0 -40 -10z";
    return `
    <ellipse cx="60" cy="100" rx="38" ry="7" fill="${L}" opacity=".18"/>
    <path d="${wob}" fill="${body}" stroke="${L}" stroke-width="4" stroke-linejoin="round"/>
    <path d="M28 52 q-11 4 -12 15" fill="none" stroke="${L}" stroke-width="5" stroke-linecap="round"/>
    <path d="M92 52 q11 4 12 15" fill="none" stroke="${L}" stroke-width="5" stroke-linecap="round"/>
    ${eyes(e, 46, 74, 56, 12)}
    ${mouth(e, 60, 74, 10, "#3A1B5C")}
    ${e === "sad" ? sweat(96, 44) : ""}
    ${e === "happy" ? blush(32, 88, 70) : ""}
    ${e === "smug" ? `<path d="M30 34 q-7 -9 -1 -15 q3 6 8 8z" fill="#FF3D81" stroke="${L}" stroke-width="3" stroke-linejoin="round"/>
                      <path d="M90 34 q7 -9 1 -15 q-3 6 -8 8z" fill="#FF3D81" stroke="${L}" stroke-width="3" stroke-linejoin="round"/>` : ""}`;
  }

  // TENSOR — the smug professor cat
  function tensor(e) {
    const fur = { neutral:"#FF9A52", happy:"#FFB26B", wow:"#FFC31E", sad:"#8FD4FF", dead:"#9A8CB8", smug:"#FF6BA6" }[e] || "#FF9A52";
    return `
    <path d="M26 44 l-4 -26 l24 12z" fill="${fur}" stroke="${L}" stroke-width="4" stroke-linejoin="round"/>
    <path d="M94 44 l4 -26 l-24 12z" fill="${fur}" stroke="${L}" stroke-width="4" stroke-linejoin="round"/>
    <path d="M92 92 q22 4 16 -16" fill="none" stroke="${L}" stroke-width="6" stroke-linecap="round"/>
    <rect x="36" y="78" width="48" height="24" rx="11" fill="${W}" stroke="${L}" stroke-width="4"/>
    <circle cx="60" cy="56" r="34" fill="${fur}" stroke="${L}" stroke-width="4"/>
    ${eyes(e, 48, 72, 54, 11)}
    <g stroke="${L}" stroke-width="2.5" stroke-linecap="round">
      <line x1="26" y1="62" x2="10" y2="58"/><line x1="26" y1="66" x2="11" y2="68"/>
      <line x1="94" y1="62" x2="110" y2="58"/><line x1="94" y1="66" x2="109" y2="68"/>
    </g>
    <path d="M57 66 l3 3 l3 -3z" fill="${L}"/>
    ${mouth(e, 60, 73, 9, "#FF8FB8")}
    ${e !== "dead" ? `<g fill="none" stroke="${L}" stroke-width="3">
       <circle cx="48" cy="54" r="15"/><circle cx="72" cy="54" r="15"/><line x1="63" y1="54" x2="57" y2="54"/></g>` : ""}
    ${e === "sad" ? sweat(94, 40) : ""}`;
  }

  const CHARS = { poise: poise, byte: byte, tensor: tensor };
  const NAMES = ["poise", "byte", "tensor"];
  const MOODS = ["neutral", "happy", "wow", "sad", "dead", "smug"];

  function svg(who, emotion, size, cls) {
    const f = CHARS[who] || poise;
    return `<svg class="${cls || ""}" viewBox="0 0 120 120" width="${size || 90}" height="${size || 90}"
      role="img" aria-label="${who}, ${emotion}">${f(emotion || "neutral")}</svg>`;
  }

  /* ---------------------------------------------------------------- doodles */
  const A = 'stroke="currentColor" stroke-width="3.4" fill="none" stroke-linecap="round" stroke-linejoin="round"';
  const ACC = 'stroke="var(--accent-doodle,#FF3D81)" stroke-width="3.4" fill="none" stroke-linecap="round"';
  const DOODLES = {
    scatter: `<g ${A}><path d="M14 72 V14 M14 72 H102"/></g>
      <g fill="var(--accent-doodle,#FF3D81)"><circle cx="30" cy="58" r="5"/><circle cx="44" cy="48" r="5"/>
      <circle cx="58" cy="52" r="5"/><circle cx="72" cy="34" r="5"/><circle cx="88" cy="26" r="5"/></g>`,
    line: `<g ${A}><path d="M14 72 V14 M14 72 H102"/></g><g ${ACC}><path d="M22 64 L94 22"/></g>
      <g fill="currentColor"><circle cx="34" cy="56" r="4"/><circle cx="56" cy="46" r="4"/><circle cx="78" cy="30" r="4"/></g>`,
    curve: `<g ${A}><path d="M14 72 V14 M14 72 H102"/></g><g ${ACC}><path d="M20 24 q28 62 76 6"/></g>`,
    tree: `<g ${A}><circle cx="58" cy="18" r="9"/><circle cx="32" cy="50" r="9"/><circle cx="84" cy="50" r="9"/>
      <circle cx="20" cy="80" r="8"/><circle cx="46" cy="80" r="8"/><path d="M52 25 L38 42 M64 25 L78 42 M27 58 L23 72 M38 58 L43 72"/></g>`,
    cluster: `<g fill="var(--accent-doodle,#FF3D81)"><circle cx="26" cy="30" r="5"/><circle cx="38" cy="22" r="5"/><circle cx="32" cy="42" r="5"/></g>
      <g fill="currentColor"><circle cx="82" cy="58" r="5"/><circle cx="92" cy="46" r="5"/><circle cx="74" cy="46" r="5"/></g>
      <g ${A}><circle cx="32" cy="32" r="22" stroke-dasharray="5 6"/><circle cx="83" cy="50" r="22" stroke-dasharray="5 6"/></g>`,
    neuron: `<g ${A}><circle cx="22" cy="28" r="8"/><circle cx="22" cy="62" r="8"/><circle cx="62" cy="45" r="11"/><circle cx="100" cy="45" r="8"/>
      <path d="M30 30 L52 42 M30 60 L52 49 M73 45 L92 45"/></g>`,
    bars: `<g ${A}><path d="M14 74 H104"/></g>
      <g fill="var(--accent-doodle,#FF3D81)" stroke="currentColor" stroke-width="3">
      <rect x="22" y="48" width="14" height="26"/><rect x="44" y="30" width="14" height="44"/>
      <rect x="66" y="40" width="14" height="34"/><rect x="88" y="58" width="14" height="16"/></g>`,
    target: `<g ${A}><circle cx="58" cy="44" r="30"/><circle cx="58" cy="44" r="18"/></g>
      <circle cx="58" cy="44" r="7" fill="var(--accent-doodle,#FF3D81)"/>
      <g ${A}><path d="M92 12 L66 36"/></g>`,
    warn: `<g ${A}><path d="M58 12 L104 76 H12 Z"/><path d="M58 36 V54"/></g><circle cx="58" cy="64" r="4" fill="var(--accent-doodle,#FF3D81)"/>`,
    gear: `<g ${A}><circle cx="58" cy="44" r="16"/><path d="M58 16 V6 M58 82 V72 M86 44 H96 M20 44 H30
      M78 24 L85 17 M31 71 L38 64 M78 64 L85 71 M31 17 L38 24"/></g>`,
    brain: `<g ${A}><path d="M46 18 q-20 2 -18 18 q-14 10 0 22 q-2 16 18 16 q8 8 14 0 V18 q-6 -8 -14 0z"/>
      <path d="M74 18 q20 2 18 18 q14 10 0 22 q2 16 -18 16 q-8 8 -14 0"/><path d="M60 30 h10 M60 48 h-10 M60 62 h12"/></g>`,
    magnify: `<g ${A}><circle cx="50" cy="38" r="24"/><path d="M68 56 L96 80"/></g><path d="M40 38 h20 M50 28 v20" ${ACC}/>`,
    scales: `<g ${A}><path d="M58 14 V70 M30 70 H86 M22 34 H94 M58 20 L22 34 M58 20 L94 34"/>
      <path d="M8 34 q14 24 28 0z M80 34 q14 24 28 0z"/></g>`,
    split: `<g ${A}><path d="M58 10 V34"/><path d="M58 34 L26 64 M58 34 L90 64"/></g>
      <g fill="var(--accent-doodle,#FF3D81)"><circle cx="26" cy="72" r="8"/><circle cx="90" cy="72" r="8"/></g>`,
    hill: `<g ${A}><path d="M12 76 q24 -58 46 -20 q22 38 48 -22"/></g>
      <circle cx="40" cy="42" r="7" fill="var(--accent-doodle,#FF3D81)" stroke="currentColor" stroke-width="3"/>
      <g ${ACC}><path d="M48 50 l10 12"/></g>`,
    grid: `<g ${A}><rect x="16" y="14" width="88" height="60" rx="5"/><path d="M46 14 V74 M74 14 V74 M16 34 H104 M16 54 H104"/></g>`,
    clock: `<g ${A}><circle cx="58" cy="44" r="30"/><path d="M58 26 V44 L72 52"/></g>`,
    stack: `<g ${A}><rect x="20" y="56" width="76" height="18" rx="4"/><rect x="28" y="36" width="60" height="18" rx="4"/>
      <rect x="36" y="16" width="44" height="18" rx="4"/></g>`
  };
  const DKEYS = Object.keys(DOODLES);

  // pick a doodle from what the section is about
  const RULES = [
    [/gradient|descent|slope|downhill|optimis|learning rate/i, "hill"],
    [/tree|split|entropy|gini|information gain|prune|forest|branch/i, "tree"],
    [/cluster|k-?means|dbscan|hierarch|dendro|segment/i, "cluster"],
    [/neural|neuron|perceptron|backprop|layer|activation/i, "neuron"],
    [/pitfall|mistake|wrong|trap|leak|danger|fail|weakness|caution/i, "warn"],
    [/metric|accuracy|precision|recall|f1|auc|roc|score|confusion/i, "target"],
    [/distribution|histogram|frequenc|count|imbalance|bar/i, "bars"],
    [/regression|linear|fit|least squares|residual|ols/i, "line"],
    [/curve|polynomial|sigmoid|logistic|non-?linear|kernel/i, "curve"],
    [/hyperparameter|tuning|search|grid|cross-?valid|pipeline|deploy/i, "gear"],
    [/intuition|idea|think|understand|why|concept|mental/i, "brain"],
    [/explore|eda|inspect|look|examin|diagnos|understand your data/i, "magnify"],
    [/bias|variance|trade-?off|balance|compare|versus|vs\b/i, "scales"],
    [/ensemble|stack|boost|bag|vote|combine/i, "stack"],
    [/time|online|batch|stream|epoch|iteration|budget/i, "clock"],
    [/matrix|tensor|shape|axis|dimension|array|table|encod/i, "grid"],
    [/classif|decision|boundary|threshold|separat/i, "split"],
    [/data|sample|point|scatter|feature|outlier|scal/i, "scatter"]
  ];
  function doodleFor(text, salt) {
    const t = String(text || "");
    for (const [re, name] of RULES) if (re.test(t)) return name;
    let h = 0;
    for (let i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) | 0;
    return DKEYS[Math.abs(h + (salt || 0)) % DKEYS.length];
  }
  function doodle(name, size) {
    const d = DOODLES[name] || DOODLES.scatter;
    return `<svg class="doodle" viewBox="0 0 118 88" width="${size || 110}" height="${Math.round((size || 110) * 0.75)}"
      aria-hidden="true">${d}</svg>`;
  }

  return { svg, doodle, doodleFor, NAMES, MOODS, DOODLES: DKEYS };
})();
