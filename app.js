/* Poise's ML Lab — state, mascot, router, lessons, arena */
(function () {
  "use strict";

  const BUDGET_MS = 20 * 3600 * 1000;
  const KEY = "poise-ml-v2";
  const DEEP = { "33":"pca", "34":"linreg", "37":"gd", "40":"biasvar", "45":"logreg",
    "55":"tree", "61":"forest", "65":"adaboost", "71":"knn", "72":"svm", "75":"bayes", "76":"kmeans" };
  const TREATS = ["🍪","🍩","🧁","🍓","🍕","🍜","🧋","🍫","🥨","🍮","🍡","🥞"];

  let DATA = null, WHY = null, ELI = null, DERIV = {}, S = null, route = "map", cur = "01";

  /* ---------------------------------------------------------------- storage */
  const blank = () => ({ stages:{}, done:{}, q:{}, treats:0, used:0, running:true, cur:"01",
    seenBadges:[], xp:0, level:1, streak:0, rail:0 });
  function load() {
    try { const r = localStorage.getItem(KEY); S = r ? Object.assign(blank(), JSON.parse(r)) : blank(); }
    catch (e) { S = blank(); }
    cur = S.cur || "01";
  }
  function save() { try { S.cur = cur; localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }

  /* ---------------------------------------------------------------- mascot */
  const LINES = {
    right: ["Okayyy, Professor Einstein.", "Look who's suddenly understanding gradients.",
      "WHO GAVE YOU THIS MUCH BRAIN POWER?", "Correct. I was about to doubt your entire academic career.",
      "Right. Annoyingly right.", "Fine. FINE. That was good.", "Correct, and you didn't even hesitate. Show-off.",
      "I checked twice. Still correct. Infuriating.", "That's the answer I'd have given. Obviously.",
      "Someone has been doing the reading. Disgusting behaviour.",
      "Correct. I'm updating my priors about you.", "You got it. I'm not emotional. YOU'RE emotional.",
      "Textbook. Literally. That's what the textbook says.", "Clean answer. No waffle. Chef's kiss."],
    wrong: ["Interesting choice. Unfortunately, the laws of mathematics disagree.",
      "That answer was so wrong my neurons resigned.", "Bro... what did you just do to that equation?",
      "I need a moment to process this.", "No. But you said it with such confidence.",
      "That is a sentence. Those are words. It is not the answer.",
      "Somewhere, a statistician felt a chill and doesn't know why.",
      "Bold. Incorrect, but bold.", "I'm going to pretend I didn't see that one.",
      "The good news: you can only go up from here.",
      "That's the kind of answer that gets a model deployed on a Friday.",
      "Nope. Not even in a parallel universe with different axioms."],
    again: ["We have discussed this. My little silicon heart is hurting.",
      "This is twice now. I am keeping a list.", "Same mistake. Beautiful consistency, terrible accuracy.",
      "You and this concept need to sit down and talk.",
      "I'd call this overfitting to the wrong answer.",
      "At this point the mistake is a feature of your worldview."],
    hard: ["Okay. Nobody panic. Including me.",
      "Deep breath. We are about to enter the forbidden land of partial derivatives.",
      "This one looks scary. That's because it is. But we're going to bully it until it makes sense.",
      "I have prepared emotionally for this section. Mostly.",
      "If this gets ugly, remember: the algebra is scared of you too.",
      "Rolling up my little sleeves. Here we go.",
      "Three lines of algebra stand between you and understanding. Only three. Probably.",
      "I'm going to explain this slowly, mostly for my own benefit."],
    donetopic: ["BOOM. One concept deleted from existence.", "Respect. That one had hands.",
      "Logged. Filed. Understood. Next victim.", "One down. I'm telling the other topics you're coming.",
      "That concept has been thoroughly inconvenienced.", "Another one folded like a cheap hypothesis.",
      "Consider that topic emotionally damaged.", "Done. I'd high-five you but physics."],
    fast: ["Hold on... you're actually cooking.", "Three in a row? Slow down, I have to look busy.",
      "You're speedrunning. I approve and I'm slightly threatened.",
      "This pace is frankly suspicious. Are you sleeping?",
      "At this rate you'll finish before my next snack break."],
    behind: ["BESTIE. We have {n} topics left.", "Not to alarm you, but the clock is winning. {n} to go.",
      "{n} topics. I've located the fire extinguisher.",
      "{n} left and the clock does not care about your feelings.",
      "I'm not panicking. I'm pre-panicking. {n} to go."],
    idle: ["I learned nothing from this cookie but I deserve it.",
      "Ask me about eigenvectors. Actually don't, I just ate.",
      "Fun fact: I was trained on data. Like you, but with worse snacks.",
      "If you stare at the loss curve long enough it stares back.",
      "I once overfitted so hard I predicted my own birthday wrong.",
      "My antenna isn't functional. It's a fashion statement.",
      "Somewhere a p-value is being tortured until it confesses.",
      "I'd explain backprop again but I can see you're busy.",
      "Normalise your features. Also your sleep schedule.",
      "The lab coat does nothing. I just like the aesthetic.",
      "Every time you skip the derivation, a tree overfits."]
  };
  /* Per-lesson flavour: picked from the topic number, so every lesson reads
     differently but the same lesson is stable across visits. */
  const FLAVOUR = {
    why: ["So... we need a method. Not vibes. A method.",
      "You could do this by hand. You will not enjoy it.",
      "Notice nobody has said a definition yet. That's deliberate.",
      "Every method exists because something simpler broke first.",
      "Hold that problem in your head. The maths is just the answer to it.",
      "This is the part people skip, then wonder why nothing makes sense later.",
      "Real problem first. Greek letters when they've earned it.",
      "If you can't say what goes wrong without this, you don't need it yet.",
      "Someone hit this wall, got annoyed, and invented the fix. That's the whole story.",
      "The problem is the interesting bit. The solution is just bookkeeping.",
      "Read that twice. The rest of the page is a reaction to it.",
      "Nobody wakes up wanting an algorithm. They want a problem to go away."],
    theory: ["Fancy equation. Simple idea. Say it in English and you've won.",
      "Every symbol here is carrying its own weight. Point at each one.",
      "If a line looks like magic, it's because a step is missing. Find it.",
      "Derivations are just stubbornness with notation.",
      "You're allowed to be slow here. Slow is how this one goes in.",
      "Follow it with a pen or don't follow it at all.",
      "This is where the equation stops being decoration.",
      "The chain rule does most of the heavy lifting. As usual.",
      "Don't memorise the result. Memorise why it couldn't have been anything else.",
      "Each line follows from the last. No leaps. Check me on it.",
      "Mathematics is just arguing very carefully.",
      "If you can rebuild this from the first line, you own it."],
    pit: ["These are the mistakes that survive to production. Learn them cheaply here.",
      "Everyone makes at least one of these. Usually in an interview.",
      "This list is written in other people's tears.",
      "Knowing the failure modes is most of knowing the method.",
      "The method is easy. Not breaking it is the skill.",
      "I've seen every one of these happen. Twice.",
      "Read these now so you recognise them at 2am later.",
      "A model that fails loudly is a gift. These fail quietly."],
    code: ["Short code. Every line earns its place. Tap them.",
      "The library hides the maths. You already know what's underneath.",
      "Notice how little code the idea actually needs.",
      "This is the part everyone copies without reading. Don't.",
      "Four lines of sklearn, forty of understanding.",
      "If a line surprises you, that's a gap worth closing."],
    done: ["Right. Section cleared. Keep moving.",
      "That's that bit handled.", "Good. Next.",
      "Filed under 'things you now know'.", "Onward."]
  };
  function hashN(n) { let h = 0; const s = String(n); for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); }
  function flavour(n, pool, offset) {
    const p = FLAVOUR[pool] || FLAVOUR.done;
    return p[(hashN(n) + (offset || 0) * 7) % p.length];
  }

  const MOODMAP = { neutral:"neutral", cool:"smug", fire:"happy", confused:"confused",
    dead:"dead", cry:"sad", chef:"happy", evil:"smug", brain:"wow", slide:"happy",
    panic:"wow", king:"happy", happy:"happy", wow:"wow", smug:"smug", sad:"sad" };
  const ANIM = { fire:"st-hype", dead:"st-dead", panic:"st-panic", slide:"st-slide", king:"st-hype", chef:"st-hype" };
  let bubbleTimer = null, dockWho = "poise";

  const Poise = {
    say(text, mood) {
      const t = document.getElementById("bubble-txt"), b = document.getElementById("bubble");
      if (t) t.textContent = text;
      if (b) b.classList.remove("quiet");
      this.face(mood || "neutral");
      clearTimeout(bubbleTimer);
      bubbleTimer = setTimeout(() => {
        Poise.face("neutral");
        const bb = document.getElementById("bubble");
        if (bb) bb.classList.add("quiet");      // tuck away so it never blocks the pager
      }, 7000);
    },
    face(mood) {
      const host = document.getElementById("poise");
      if (!host) return;
      const m = MOODMAP[mood] || (CAST.MOODS.indexOf(mood) >= 0 ? mood : "neutral");
      host.className = ANIM[mood] || "st-bob";
      host.innerHTML = CAST.svg(dockWho, m === "confused" ? "sad" : m, 92);
    },
    cast(who) { dockWho = who; this.face("neutral"); },
    pick(kind, mood, vars) {
      const pool = LINES[kind] || LINES.idle;
      let s = pool[Math.floor(Math.random() * pool.length)];
      if (vars) Object.keys(vars).forEach(k => { s = s.replace("{" + k + "}", vars[k]); });
      this.say(s, mood);
    }
  };
  window.Poise = Poise;

  /* ---------------------------------------------------------------- maths */
  const GREEK = { alpha:"α",beta:"β",gamma:"γ",delta:"δ",Delta:"Δ",epsilon:"ε",varepsilon:"ε",zeta:"ζ",
    eta:"η",theta:"θ",Theta:"Θ",iota:"ι",kappa:"κ",lambda:"λ",Lambda:"Λ",mu:"μ",nu:"ν",xi:"ξ",pi:"π",Pi:"Π",
    rho:"ρ",sigma:"σ",Sigma:"Σ",tau:"τ",upsilon:"υ",phi:"φ",Phi:"Φ",chi:"χ",psi:"ψ",omega:"ω",Omega:"Ω",
    infty:"∞",times:"×",cdot:"·",div:"÷",pm:"±",mp:"∓",sum:"Σ",prod:"Π",partial:"∂",nabla:"∇",
    approx:"≈",sim:"∼",propto:"∝",neq:"≠",ne:"≠",ge:"≥",geq:"≥",le:"≤",leq:"≤",ll:"≪",gg:"≫",
    to:"→",rightarrow:"→",Rightarrow:"⇒",leftarrow:"←",mapsto:"↦",in:"∈",notin:"∉",subset:"⊂",subseteq:"⊆",
    cup:"∪",cap:"∩",emptyset:"∅",forall:"∀",exists:"∃",top:"⊤",perp:"⊥",ell:"ℓ",
    supset:"⊃",supseteq:"⊇",equiv:"≡",simeq:"≃",leftrightarrow:"↔",Leftrightarrow:"⇔",
    Longrightarrow:"⟹",Longleftrightarrow:"⟺",longleftrightarrow:"⟷",impliedby:"⟸",
    downarrow:"↓",uparrow:"↑",Downarrow:"⇓",Uparrow:"⇑",nearrow:"↗",searrow:"↘",swarrow:"↙",nwarrow:"↖",
    lesssim:"≲",gtrsim:"≳",checkmark:"✓",oplus:"⊕",ominus:"⊖",otimes:"⊗",odot:"⊙",
    subsetneq:"⊊",supsetneq:"⊋",parallel:"∥",angle:"∠",triangle:"△",square:"□",
    aleph:"ℵ",hbar:"ℏ",Re:"ℜ",Im:"ℑ",wp:"℘",partialdiff:"∂",surd:"√",neg:"¬",lnot:"¬",
    longrightarrow:"⟶",implies:"⟹",iff:"⟺",setminus:"\\",ast:"∗",star:"⋆",dagger:"†",
    lfloor:"⌊",rfloor:"⌋",lceil:"⌈",rceil:"⌉",langle:"⟨",rangle:"⟩",vdots:"⋮",ddots:"⋱",
    binom:"",choose:"",lim:"lim",sup:"sup",inf:"inf",deg:"deg",gcd:"gcd",Pr:"Pr",
    int:"∫",sqrt:"√",cdots:"⋯",ldots:"…",dots:"…",prime:"′",circ:"∘",textrupee:"₹",degree:"°",
    log:"log",ln:"ln",exp:"exp",min:"min",max:"max",argmin:"argmin",argmax:"argmax",sin:"sin",cos:"cos",
    tan:"tan",det:"det",diag:"diag",Var:"Var",Cov:"Cov",E:"E",tr:"tr",mathbb:"",mathbf:"",mathrm:"",boldsymbol:""
  };
  const BIGOPS = { sum:"\u03a3", prod:"\u03a0", int:"\u222b", bigcup:"\u22c3", bigcap:"\u22c2",
    lim:"lim", max:"max", min:"min", argmax:"argmax", argmin:"argmin", sup:"sup", inf:"inf" };
  const UPRIGHT = /^(log|ln|exp|sin|cos|tan|cot|sec|csc|sinh|cosh|tanh|det|dim|ker|deg|gcd|arg|max|min|lim|sup|inf|mod|Var|Cov|Corr|Pr|MSE|RMSE|MAE|SSE|SST|SSR|TP|FP|TN|FN|IG|AUC|ROC|OLS|KL|if|else|otherwise|and|or|not|where|for|all|true|false)$/;
  const REL = "=≈≠≤≥∼≡∝→←↦⟹⟸⟺↔∈∉⊂⊆⊃⊇≲≳≪≫";
  const BIN = "+−×·÷±∓∪∩⊕⊗";
  function spaced(ch) {
    if (REL.indexOf(ch) >= 0) return '<span class="rel">' + esc(ch) + "</span>";
    if (BIN.indexOf(ch) >= 0) return '<span class="bin">' + esc(ch) + "</span>";
    return null;
  }
  function esc(s) { return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }
  function optarg(s, i) { // s[i] === "[" -> [content, indexAfter]
    if (s[i] !== "[") return ["", i];
    let d = 0;
    for (let j = i; j < s.length; j++) {
      if (s[j] === "[") d++;
      else if (s[j] === "]") { d--; if (!d) return [s.slice(i + 1, j), j + 1]; }
    }
    return ["", i];
  }
  function atom(s, i) { // next TeX argument: {group}, \command, or one character
    if (s[i] === "{") return brace(s, i);
    const m = /^\\([a-zA-Z]+)/.exec(s.slice(i));
    if (m) return [m[0], i + m[0].length];
    return [s[i] || "", i + 1];
  }
  function brace(s, i) { // s[i] === "{" -> [content, indexAfter]
    let d = 0;
    for (let j = i; j < s.length; j++) {
      if (s[j] === "{") d++;
      else if (s[j] === "}") { d--; if (!d) return [s.slice(i + 1, j), j + 1]; }
    }
    return [s.slice(i + 1), s.length];
  }
  function tex(src) {
    let s = String(src), out = "";
    for (let i = 0; i < s.length;) {
      const c = s[i];
      if (c === "\\") {
        const m = /^\\([a-zA-Z]+)/.exec(s.slice(i));
        if (!m) { // non-letter escape: \| \{ \_ \% \, and friends
          const lit = { "|":"‖", "{":"{", "}":"}", "_":"_", "%":"%", "&":"&", "#":"#",
            "$":"$", ",":" ", ";":" ", ":":" ", "!":"", " ":" " }[s[i + 1]];
          out += lit === undefined ? "" : esc(lit);
          i += 2; continue;
        }
        const cmd = m[1]; i += m[0].length;
        while (s[i] === " ") i++;          // a control word eats the space after it
        if (cmd === "begin" || cmd === "end") { // matrices / cases inside display math
          let envName = "";
          if (s[i] === "{") { [envName, i] = brace(s, i); }
          if (cmd === "begin") {
            const close = s.indexOf("\\end{" + envName + "}", i);
            const inner = close < 0 ? s.slice(i) : s.slice(i, close);
            i = close < 0 ? s.length : close + ("\\end{" + envName + "}").length;
            const open = /bmatrix|array|matrix/.test(envName) ? "[" : /pmatrix/.test(envName) ? "(" : /cases/.test(envName) ? "{" : "";
            out += '<span class="matrix"' + (open ? ' data-open="' + open + '"' : "") + ">" +
              inner.split("\\\\").filter(r => r.trim()).map(r =>
                "<span>" + r.split("&").map(cl => "<i>" + tex(cl.trim()) + "</i>").join("") + "</span>").join("") + "</span>";
          }
          continue;
        }
        if (cmd === "boxed") {
          let a; if (s[i] === "{") { [a, i] = brace(s, i); } else { a = ""; }
          out += '<span class="boxed">' + tex(a) + "</span>"; continue;
        }
        if (cmd === "frac" || cmd === "dfrac" || cmd === "tfrac") {
          let a, b;
          [a, i] = atom(s, i);
          while (s[i] === " ") i++;
          [b, i] = atom(s, i);
          out += '<span class="frac"><span class="num">' + tex(a) + '</span><span class="den">' + tex(b) + "</span></span>";
        } else if (cmd === "sqrt") {
          let a; [a, i] = atom(s, i);
          out += "√<span style=\"border-top:1.5px solid currentColor\">" + tex(a) + "</span>";
        } else if (cmd === "bar" || cmd === "hat" || cmd === "vec" || cmd === "tilde") {
          let a; [a, i] = atom(s, i);
          const mk = { bar:"̄", hat:"̂", vec:"⃗", tilde:"̃" }[cmd];
          out += tex(a) + mk;
        } else if (cmd === "text" || cmd === "mathrm" || cmd === "mathbf" || cmd === "operatorname" || cmd === "mathbb") {
          let a; if (s[i] === "{") { [a, i] = brace(s, i); } else { a = ""; }
          a.split("$").forEach((part, k) => {
            if (k % 2) out += tex(part);
            else if (part) out += '<span class="mtext">' + esc(part) + "</span>";
          });
        } else if (cmd === "left" || cmd === "right" || cmd === "big" || cmd === "Big" || cmd === "quad" || cmd === "qquad") {
          out += cmd === "quad" || cmd === "qquad" ? "&nbsp;&nbsp;" : "";
        } else if (cmd === "underbrace" || cmd === "overbrace") {
          let a, lab = "";
          [a, i] = atom(s, i);
          if (s[i] === "_" || s[i] === "^") { i++; [lab, i] = atom(s, i); }
          out += '<span class="ubrace' + (cmd === "overbrace" ? " over" : "") + '"><span class="ub-body">' +
            tex(a) + '</span><span class="ub-brace">' + (cmd === "overbrace" ? "⏞" : "⏟") +
            '</span><span class="ub-lbl">' + tex(lab) + "</span></span>";
        } else if (cmd === "mathcal" || cmd === "mathscr" || cmd === "mathfrak") {
          let a; [a, i] = atom(s, i);
          out += '<span class="cal">' + esc(a) + "</span>";
        } else if (cmd === "boldsymbol" || cmd === "mathbfit") {
          let a; [a, i] = atom(s, i);
          out += '<span class="mbold">' + tex(a) + "</span>";
        } else if (cmd === "binom" || cmd === "dbinom" || cmd === "tbinom") {
          let a, b;
          [a, i] = atom(s, i);
          [b, i] = atom(s, i);
          out += '<span class="binom"><span>' + tex(a) + "</span><span>" + tex(b) + "</span></span>";
        } else if (cmd === "cancel" || cmd === "sout" || cmd === "xcancel") {
          let a; [a, i] = atom(s, i);
          out += '<span class="xout">' + tex(a) + "</span>";
        } else if (cmd === "phantom" || cmd === "hphantom" || cmd === "vphantom") {
          let a; [a, i] = atom(s, i);
          out += '<span style="visibility:hidden">' + tex(a) + "</span>";
        } else if (cmd === "xrightarrow" || cmd === "xleftarrow" || cmd === "overset" || cmd === "underset") {
          let lab = "", a = "";
          if (s[i] === "[") { const o = optarg(s, i); lab = o[0]; i = o[1]; }
          if (s[i] === "{") { [a, i] = brace(s, i); }
          if (cmd === "overset" || cmd === "underset") {
            let b = ""; if (s[i] === "{") { [b, i] = brace(s, i); }
            out += '<span class="stack' + (cmd === "underset" ? " under" : "") + '"><span class="st-lbl">' +
              tex(a) + '</span><span class="st-base">' + tex(b) + "</span></span>";
          } else {
            out += '<span class="stack"><span class="st-lbl">' + tex(lab || a) +
              '</span><span class="st-base">' + (cmd === "xleftarrow" ? "⟵" : "⟶") + "</span></span>";
          }
        } else if (cmd === "widehat" || cmd === "widetilde" || cmd === "overline" || cmd === "underline") {
          let a; [a, i] = atom(s, i);
          const cls = cmd === "widehat" ? "w-hat" : cmd === "widetilde" ? "w-til"
            : cmd === "overline" ? "w-over" : "w-under";
          out += '<span class="' + cls + '">' + tex(a) + "</span>";
        } else if (cmd === "displaystyle" || cmd === "textstyle" || cmd === "scriptstyle" ||
                   cmd === "limits" || cmd === "nolimits" || cmd === "notag" || cmd === "nonumber" ||
                   cmd === "midscore" || cmd === "allowbreak") {
          /* layout hints with no visual meaning here */
        } else if (cmd === "mid") {
          out += '<span class="mid">|</span>';
        } else if (BIGOPS[cmd]) {
          let sub = "", sup = "";
          while (s[i] === "_" || s[i] === "^") {
            const which = s[i]; i++;
            let a;
            if (s[i] === "{") { [a, i] = brace(s, i); }
            else if (s[i] === "\\") { const mm = /^\\([a-zA-Z]+)/.exec(s.slice(i)); a = mm ? mm[0] : s[i]; i += a.length; }
            else { a = s[i] || ""; i++; }
            if (which === "_") sub = a; else sup = a;
          }
          out += '<span class="bigop"><span class="lim">' + (sup ? tex(sup) : "") + "</span>" +
            '<span class="op">' + BIGOPS[cmd] + "</span>" +
            '<span class="lim">' + (sub ? tex(sub) : "") + "</span></span>";
        } else if (GREEK.hasOwnProperty(cmd)) {
          out += spaced(GREEK[cmd]) || GREEK[cmd];
        } else { out += esc(cmd); }
      } else if (c === "^" || c === "_") {
        const tag = c === "^" ? "sup" : "sub";
        i++;
        let a;
        if (s[i] === "{") { [a, i] = brace(s, i); }
        else if (s[i] === "\\") { const m = /^\\([a-zA-Z]+)/.exec(s.slice(i)); a = m ? m[0] : s[i]; i += a.length; }
        else { a = s[i] || ""; i++; }
        out += "<" + tag + ">" + tex(a) + "</" + tag + ">";
      } else if (c === "{" || c === "}") { i++; }
      else if (c === "$") { i++; }
      else if (/[A-Za-z]/.test(c)) {
        const w = /^[A-Za-z]+/.exec(s.slice(i))[0];
        out += UPRIGHT.test(w) ? '<span class="mup">' + w + "</span>" : "<i>" + esc(w) + "</i>";
        i += w.length;
      }
      else { out += spaced(c) || esc(c); i++; }
    }
    return out;
  }
  // Prose that may carry $inline$ and $$display$$ maths, plus newlines.
  function rich(src) {
    if (!src) return "";
    const s = String(src);
    let out = "", i = 0;
    while (i < s.length) {
      const d = s.indexOf("$$", i), one = s.indexOf("$", i);
      if (d >= 0 && d === one) {                       // display maths
        const close = s.indexOf("$$", d + 2);
        if (close < 0) { out += plain(s.slice(i)); break; }
        const dm = s.slice(d + 2, close);
        out += plain(s.slice(i, d)) +
          '<span class="mblock"><span>' + tex(dm) + "</span></span>" + EXPLAIN.panel(dm);
        i = close + 2;
      } else if (one >= 0) {                            // inline maths
        const close = s.indexOf("$", one + 1);
        if (close < 0) { out += plain(s.slice(i)); break; }
        out += plain(s.slice(i, one)) +
          '<span class="m">' + tex(s.slice(one + 1, close)) + "</span>";
        i = close + 1;
      } else { out += plain(s.slice(i)); break; }
    }
    return out;
  }
  function plain(t) {
    return esc(t)
      .replace(/\n\n+/g, "</p><p>").replace(/\n/g, " ")
      .replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>")
      .replace(/(^|[\s(\u2014-])\*([^*\n]+)\*(?=[\s.,;:)\u2014!?]|$)/g, "$1<em>$2</em>");
  }
  // display maths: the whole string is maths, so never route it through the prose path
  function mblock(src) {
    if (!src) return "";
    const isTex = /\\|\^|_\{/.test(src);
    const lines = String(src).split("\n").map(l => l.trim()).filter(Boolean);
    const body = lines.map(l => "<span>" + (isTex ? tex(l) : rich(l)) + "</span>").join("");
    return '<div class="mblock">' + body + "</div>";
  }

  /* ---------------------------------------------------------------- helpers */
  const $ = sel => document.querySelector(sel);
  const el = (h) => { const d = document.createElement("div"); d.innerHTML = h.trim(); return d.firstElementChild; };
  const list = () => DATA.parts.reduce((a, p) => a.concat(p.topics), []);
  const T = n => DATA.topics[n];
  const isDone = n => !!S.done[n];
  const doneCount = () => list().filter(isDone).length;
  const partOf = n => DATA.parts.find(p => p.topics.indexOf(n) >= 0) || DATA.parts[0];
  function nextTopic(n) { const L = list(), i = L.indexOf(n); return i >= 0 && i < L.length - 1 ? L[i + 1] : null; }
  function firstUnfinished() { const L = list(); return L.find(n => !isDone(n)) || L[L.length - 1]; }
  function fmt(ms) {
    ms = Math.max(0, ms); const s = Math.floor(ms / 1000);
    return [Math.floor(s / 3600), Math.floor(s / 60) % 60, s % 60].map((v, i) => i ? String(v).padStart(2, "0") : v).join(":");
  }

  /* ---------------------------------------------------------------- time budget */
  let lastTick = Date.now();
  function tick() {
    const now = Date.now(), dt = now - lastTick; lastTick = now;
    if (S.running && !document.hidden && dt < 5000) S.used += dt;
    paintClock();
    if (Math.random() < 0.004) save();
  }
  function paintClock() {
    const left = BUDGET_MS - S.used, remaining = list().length - doneCount();
    $("#clk-left").textContent = fmt(left);
    $("#clk-used").textContent = fmt(S.used) + " used";
    $("#clk-bar").style.width = Math.min(100, (S.used / BUDGET_MS) * 100) + "%";
    const perTopic = remaining ? left / remaining / 60000 : 0;
    $("#clk-need").textContent = remaining ? perTopic.toFixed(1) + " min/topic for the remaining " + remaining : "All 83 done.";
    // pace: expected progress if time spent linearly
    const expected = (S.used / BUDGET_MS) * list().length, delta = doneCount() - expected;
    const cls = delta > 2 ? "ahead" : delta < -3 ? "behind" : "ontrack";
    $("#clk-pace").innerHTML = '<span class="pace ' + cls + '">' +
      (cls === "ahead" ? "🟢 Ahead" : cls === "behind" ? "🔴 Behind" : "🟡 On track") + "</span>";
    $("#clk-bar").style.background = cls === "behind" ? "var(--bubblegum)" : cls === "ahead" ? "var(--mint)" : "var(--sun)";
  }
  let nagged = 0;
  function maybeNag() {
    const expected = (S.used / BUDGET_MS) * list().length;
    if (doneCount() - expected < -4 && Date.now() - nagged > 600000) {
      nagged = Date.now();
      Poise.pick("behind", "panic", { n: list().length - doneCount() });
    }
  }

  /* ------------------------------------------------- idle nudges (bored detection) */
  const BORED = [
    ["Still there? Blink twice.", "confused"],
    ["I've been staring at this page for a while now. Together. In silence.", "neutral"],
    ["Not to rush you, but the gradient isn't going to descend itself.", "smug"],
    ["I counted the pixels on this screen. Twice. Your move.", "dead"],
    ["If you're re-reading that sentence, it's not you. It's the sentence.", "confused"],
    ["Psst. The Next button is right there. It's lonely.", "happy"],
    ["I had a snack while you were thinking. I regret nothing.", "happy"],
    ["Fun fact: staring harder does not reduce the loss.", "smug"],
    ["This is the longest anyone has looked at this paragraph. Including me.", "wow"],
    ["Take a sip of water. I'll hold the equation.", "neutral"],
    ["Have you tried turning the concept off and on again?", "smug"],
    ["I'm not saying you're stuck. I'm saying I've aged.", "dead"],
    ["Breaking news: local learner achieves total stillness.", "wow"],
    ["If you've drifted off, the model also overfits in silence.", "sad"],
    ["I support your decision to think. I just wish it were louder.", "neutral"]
  ];
  let lastPoke = Date.now(), boredTimer = null, boredCount = 0;
  function poke() { lastPoke = Date.now(); }
  window.poke = poke;
  function boredTick() {
    if (document.hidden) return;
    const idle = Date.now() - lastPoke;
    if (idle > 52000) {
      const [txt, mood] = BORED[(boredCount++) % BORED.length];
      const who = CAST.NAMES[boredCount % 3];
      popToast(who, mood, txt);
      lastPoke = Date.now() + Math.random() * 20000;
    }
  }
  function popToast(who, mood, txt) {
    document.querySelectorAll(".toast").forEach(e => e.remove());
    const t = el('<div class="toast">' + CAST.svg(who, mood, 60) +
      '<div><span class="who">' + who.toUpperCase() + "</span><p>" + esc(txt) + "</p></div>" +
      '<button class="tclose" aria-label="dismiss">\u00d7</button></div>');
    document.body.appendChild(t);
    t.querySelector(".tclose").addEventListener("click", () => t.remove());
    setTimeout(() => t.classList.add("bye"), 8000);
    setTimeout(() => t.remove(), 8600);
  }
  window.popToast = popToast;

  /* ---------------------------------------------------------------- confetti */
  function confetti() {
    const c = $("#confetti"); if (!c) return;
    c.hidden = false; c.width = innerWidth; c.height = innerHeight;
    const g = c.getContext("2d"), cols = ["#FF3D81","#FFC31E","#07C4A0","#7B2FF2","#FF6B2C"];
    const P = Array.from({ length: 110 }, () => ({
      x: innerWidth / 2 + (Math.random() - .5) * 240, y: innerHeight * .45,
      vx: (Math.random() - .5) * 15, vy: -Math.random() * 17 - 4,
      r: 4 + Math.random() * 7, a: Math.random() * 6, c: cols[Math.floor(Math.random() * 5)]
    }));
    let f = 0;
    (function loop() {
      g.clearRect(0, 0, c.width, c.height);
      P.forEach(p => {
        p.vy += .45; p.x += p.vx; p.y += p.vy; p.a += .16;
        g.save(); g.translate(p.x, p.y); g.rotate(p.a);
        g.fillStyle = p.c; g.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * .65); g.restore();
      });
      if (++f < 115) requestAnimationFrame(loop); else { g.clearRect(0, 0, c.width, c.height); c.hidden = true; }
    })();
  }

  /* ---------------------------------------------------------------- badges */
  const BADGES = [
    { id:"linalg", ico:"🏅", nm:"I Survived Linear Algebra", hint:"Finish Part I", test:() => DATA.parts[0].topics.every(isDone) },
    { id:"janitor", ico:"🧹", nm:"Data Janitor", hint:"Finish Feature Engineering", test:() => DATA.parts[1].topics.every(isDone) },
    { id:"goblin", ico:"⛰️", nm:"Gradient Goblin", hint:"Both gradient descent topics", test:() => isDone("37") && isDone("38") },
    { id:"police", ico:"🚔", nm:"Overfitting Police", hint:"Bias-variance + all 3 regularisers", test:() => ["40","41","42","43"].every(isDone) },
    { id:"entropy", ico:"🌀", nm:"Entropy Enjoyer", hint:"Decision tree splitting", test:() => isDone("55") },
    { id:"tree", ico:"🌳", nm:"Tree Hugger", hint:"All four decision-tree topics", test:() => ["54","55","56","57"].every(isDone) },
    { id:"svm", ico:"📐", nm:"Support Vector Simp", hint:"All three SVM topics", test:() => ["72","73","74"].every(isDone) },
    { id:"pca", ico:"🎨", nm:"PCA Picasso", hint:"Curse of dimensionality + PCA", test:() => isDone("32") && isDone("33") },
    { id:"bayes", ico:"🎲", nm:"I Actually Understand Bayes", hint:"Naive Bayes", test:() => isDone("75") },
    { id:"boost", ico:"🚀", nm:"Boosting Believer", hint:"AdaBoost through LightGBM", test:() => ["65","67","68","69"].every(isDone) },
    { id:"loss", ico:"💥", nm:"Loss Function Destroyer", hint:"30 Arena questions right", test:() => qStats().right >= 30 },
    { id:"lab", ico:"🔬", nm:"Lab Rat", hint:"Open all 13 model labs", test:() => Object.keys(S.stages).filter(k => S.stages[k] && S.stages[k].lab).length >= 13 },
    { id:"nofc", ico:"🃏", nm:"83 Topics. Zero Flashcards.", hint:"Finish everything", test:() => list().every(isDone) },
    { id:"menace", ico:"👑", nm:"ML MENACE", hint:"Everything, plus 100 Arena questions", test:() => list().every(isDone) && qStats().right >= 100 }
  ];
  function qStats() {
    let right = 0, wrong = 0, seen = 0;
    Object.keys(S.q).forEach(k => { seen++; right += S.q[k].r || 0; wrong += S.q[k].w || 0; });
    return { right, wrong, seen };
  }
  function checkBadges() {
    BADGES.forEach(b => {
      if (b.test() && S.seenBadges.indexOf(b.id) < 0) {
        S.seenBadges.push(b.id); save(); confetti();
        Poise.say("BADGE UNLOCKED: " + b.nm + ". I'd clap but my hands are drawn on.", b.id === "menace" ? "king" : "fire");
      }
    });
  }

  /* ---------------------------------------------------------------- stage marking */
  function mark(n, key) {
    S.stages[n] = S.stages[n] || {};
    if (!S.stages[n][key]) { S.stages[n][key] = 1; save(); }
  }
  const STAGEKEYS = ["why","intuition","theory","numeric","trace","lab","hook","code","quiz"];
  function stagesDone(n) {
    const st = S.stages[n] || {};
    return Object.keys(st).filter(k => k[0] !== "_");
  }
  function stagesTotal(n) {
    const st = S.stages[n] || {};
    if (st._t) return st._t;
    const t = T(n);
    return 6 + (DEEP[n] ? 1 : 0) + (t.walk ? 1 : 0) + (t.q.length ? 1 : 0);
  }

  /* ---------------------------------------------------------------- views */
  function go(r, n) {
    route = r; if (n) cur = n;
    document.querySelectorAll(".navbtn[data-route]").forEach(b => b.setAttribute("aria-current", b.dataset.route === r));
    save(); render(); window.scrollTo({ top: 0, behavior: "instant" });
  }
  window.go = go;

  function render() {
    const v = $("#view");
    v.innerHTML = "";
    if (route === "map") v.appendChild(viewMap());
    else if (route === "lesson") v.appendChild(viewLesson(cur));
    else if (route === "labs") v.appendChild(viewLabs());
    else if (route === "arena") v.appendChild(viewArena());
    else if (route === "trophy") v.appendChild(viewTrophy());
    else if (route === "done") v.appendChild(viewFinale());
    paintClock(); maybeNag();
  }

  const PARTDOODLE = { I:"brain", II:"grid", III:"line", IV:"split", V:"tree", VI:"target", VII:"cluster", VIII:"gear" };

  /* ---- map ---- */
  function viewMap() {
    const L = list(), nx = firstUnfinished();
    const wrap = el('<div></div>');
    wrap.appendChild(el(
      '<div class="card" style="background:var(--grape);color:#fff;margin-bottom:20px">' +
      '<div class="hero-cast">' + CAST.svg("poise","happy",96) + CAST.svg("byte","wow",82) + CAST.svg("tensor","smug",88) + "</div>" +
      '<div class="eyebrow" style="color:#fff;opacity:.75">The campaign</div>' +
      '<h1 style="font-size:clamp(26px,5vw,40px);margin:4px 0 8px">' + doneCount() + " / " + L.length + " concepts defeated</h1>" +
      '<p style="margin:0;max-width:60ch;font-weight:700">Nine stages per topic: why it exists, intuition, theory, the derivation, a tiny numerical example you can check by hand, a step-by-step trace, pitfalls, the code, and the Arena. Twelve topics also get a full interactive lab.</p>' +
      '<div style="display:flex;gap:9px;flex-wrap:wrap;margin-top:14px">' +
      '<button class="btn" id="go-next">' + (doneCount() ? "▶ Continue: " + nx + " " + T(nx).t : "▶ Start at the beginning") + "</button>" +
      '<button class="btn ghost" onclick="go(\'arena\')">🏆 Arena</button></div></div>'));

    const grid = el('<div class="mapgrid"></div>');
    DATA.parts.forEach(p => {
      const row = el('<div class="partrow"></div>');
      const pdone = p.topics.filter(isDone).length;
      row.appendChild(el('<h3><span class="pdoodle" style="color:' + p.color + '">' + CAST.doodle(PARTDOODLE[p.id] || "scatter", 54) + "</span>" +
        esc(p.name) + ' <span class="chip" style="margin-left:auto">' + pdone + "/" + p.topics.length + "</span></h3>"));
      const isl = el('<div class="islands"></div>');
      p.topics.forEach(n => {
        const t = T(n), prev = L[L.indexOf(n) - 1];
        const locked = !isDone(n) && prev && !isDone(prev) && n !== nx;
        const cls = ["island"];
        if (isDone(n)) cls.push("done"); else if (n === nx) cls.push("cur"); else if (locked) cls.push("locked");
        if (DEEP[n]) cls.push("deep");
        const b = el('<button class="' + cls.join(" ") + '"><span class="no">' + n + (DEEP[n] ? " · 🔬" : "") +
          '</span><span class="nm">' + esc(t.t) + '</span><span class="st">' +
          (isDone(n) ? "🌟" : n === nx ? "⭐" : locked ? "🔒" : "🌱") + "</span></button>");
        b.addEventListener("click", () => {
          if (locked) Poise.say("Going off-script? Bold. I respect it and also disagree.", "confused");
          go("lesson", n);
        });
        isl.appendChild(b);
      });
      row.appendChild(isl);
      grid.appendChild(row);
    });
    wrap.appendChild(grid);
    setTimeout(() => { const b = $("#go-next"); if (b) b.addEventListener("click", () => go("lesson", nx)); }, 0);
    return wrap;
  }

  /* ---- lesson ---- */
  function stage(num, key, title, bodyHTML, n, opts) {
    opts = opts || {};
    const open = opts.open !== false;
    const d = el('<details class="stage stage-' + num + '"' + (open ? " open" : "") + '>' +
      '<summary><span class="num">' + num + '</span><span>' + title + '</span><span class="tick"></span></summary>' +
      '<div class="body"></div></details>');
    d.querySelector(".body").innerHTML = bodyHTML;
    const tickEl = d.querySelector(".tick");
    const paint = () => { tickEl.textContent = (S.stages[n] || {})[key] ? "✅" : "⬜"; };
    paint();
    d.addEventListener("toggle", () => { if (d.open && !opts.manual) { mark(n, key); paint(); paintTopicHeader(n); } });
    if (open && !opts.manual) { mark(n, key); paint(); }
    d._paint = paint;
    return d;
  }

  let headerRefresh = () => {};
  function paintTopicHeader(n) { headerRefresh(); }

  function groupSections(blocks) {
    const out = []; let cur = { title: null, blocks: [] };
    (blocks || []).forEach(b => {
      if (b.k === "h" && b.lvl <= 2) {
        if (cur.title || cur.blocks.length) out.push(cur);
        cur = { title: b.t, blocks: [] };
      } else cur.blocks.push(b);
    });
    if (cur.title || cur.blocks.length) out.push(cur);
    return out;
  }
  function collectCode(blocks, acc) {
    (blocks || []).forEach(b => {
      if (b.k === "code") acc.push(b.t);
      else if (b.k === "box") collectCode(b.blocks, acc);
    });
    return acc;
  }

  /* --------------------------------------------------- focus mode: one page at a time */
  let PAGER = null;

  function viewLesson(n) {
    const t = T(n), p = partOf(n), wrap = el("<div></div>");
    const why = (WHY[n] || t.idea);

    const head = el('<div class="lesson-head">' +
      '<div class="lh-top"><div style="min-width:0">' +
      '<div class="eyebrow">' + esc(p.name) + " · Topic " + n + " of 83" + (DEEP[n] ? " · 🔬 lab" : "") + "</div>" +
      '<h1>' + esc(t.t) + "</h1></div>" +
      '<div class="lh-cast" id="lh-cast"></div></div>' +
      '<div class="pbar" id="pbar"></div>' +
      '<div class="pmeta"><span id="pcount">…</span><span id="pxp"></span></div>' +
      "</div>");
    wrap.appendChild(head);

    const page = el('<div class="page" id="page"></div>');
    wrap.appendChild(page);

    const nav = el('<div class="pager">' +
      '<button class="btn ghost" id="pg-prev">← Back</button>' +
      '<div class="pg-mid" id="pg-mid"></div>' +
      '<button class="btn" id="pg-next">Next →</button></div>');
    wrap.appendChild(nav);

    getFull(n).then(doc => {
      const secs = doc ? groupSections(doc.blocks) : [];
      const allCode = doc ? collectCode(doc.blocks, []) : (t.code ? [t.code] : []);
      const pages = [];

      const e5 = (ELI && ELI[n]) || null;
      if (e5) pages.push({ key: "eli5", title: "Explain it like I'm five", kicker: "no jargon, no symbols",
        doodle: "brain",
        html: '<div class="eli5">' + CAST.svg("byte", "happy", 104) +
          '<div class="eli5-txt"><p>' + rich(e5.a) + "</p>" +
          (e5.hook ? '<div class="hook big"><div class="eyebrow">\ud83e\udde0 The one line to keep</div><b>' +
            rich(e5.hook) + "</b></div>" : "") + "</div></div>" +
          says("Right. Now that you actually get it, here is how grown-ups write it down.", "cool") });

      pages.push({ key: "why", title: "Why does this exist?", kicker: "the problem",
        doodle: CAST.doodleFor(t.t + " " + why, 1),
        html: (doc && doc.abstract ? '<div class="nabstract"><div class="eyebrow">What this topic covers</div><p>' +
            rich(doc.abstract) + "</p></div>" : "") +
          '<div class="lead">' + rich(why) + "</div>" +
          says(flavour(n, "why"), "confused") });

      pages.push({ key: "intuition", title: "Intuition first", kicker: "no maths yet",
        doodle: "brain",
        html: '<div class="lead">' + rich(t.intuition || t.idea) + "</div>" +
          '<div class="hook"><div class="eyebrow">In one line</div><b>' + rich(t.idea) + "</b></div>" });

      secs.forEach((sec, i) => {
        const title = (sec.title || "").trim();
        if (/^code$/i.test(title)) return;
        if (/interview|questions you will/i.test(title)) return;
        const inner = sec.blocks.filter(b => b.k !== "code");
        if (!inner.length) return;
        const txt = title + " " + inner.map(b => b.t || "").join(" ").slice(0, 400);
        pages.push({ key: "sec" + i, title: title || "Notes", kicker: "from the notes",
          doodle: CAST.doodleFor(txt, i),
          html: '<div class="notes">' + renderBlocks(inner, 0) + "</div>" +
            (i % 2 ? says(flavour(n, "theory", i), "cry") : "") });
      });

      if (t.walk) pages.push({ key: "numeric", title: "Do it by hand, once", kicker: "small enough to check with a pen",
        doodle: "grid",
        html: '<div class="lead">Here is the smallest possible version of this method. The table below is the whole dataset \u2014 ' +
          'that is deliberate, because you can check every number yourself. Press the button to do one step at a time, ' +
          'and read what changed before moving on.</div><div id="walk-' + n + '"></div>',
        mount: () => mountWalk(n, t) });

      pages.push({ key: "trace", title: "Trace it", kicker: "every operation, in order",
        doodle: "split", html: '<div id="trace-' + n + '"></div>', mount: () => mountTrace(n, t) });

      if (DEEP[n]) pages.push({ key: "lab", title: "Model lab", kicker: "move things, watch numbers move",
        doodle: "gear",
        html: '<div id="lab-' + n + '"><button class="btn grape big" id="labgo-' + n + '">🔬 Open the lab</button></div>',
        mount: () => {
          const b = document.getElementById("labgo-" + n);
          if (b) b.addEventListener("click", () => {
            const host = document.getElementById("lab-" + n);
            host.innerHTML = "";
            window.LABS[DEEP[n]](host, Poise);
            mark(n, "lab"); checkBadges();
          });
        } });

      let hk = "";
      if (t.hook) hk += '<div class="hook big"><div class="eyebrow">🧠 Memory hook</div><b>' + rich(t.hook) + "</b></div>";
      const pits = (t.pitfalls || []).concat(t.pit && (t.pitfalls || []).indexOf(t.pit) < 0 ? [t.pit] : []);
      if (pits.length) hk += '<div class="eyebrow" style="margin-top:18px">Where people get this wrong</div><ul class="notes">' +
        pits.map(x => "<li>" + rich(x) + "</li>").join("") + "</ul>";
      if (t.tip) hk += says(rich(t.tip).replace(/<[^>]+>/g, ""), "cool");
      pages.push({ key: "hook", title: "Memory hook & failure modes", kicker: "what to actually remember",
        doodle: "warn", html: hk });

      if (allCode.length) pages.push({ key: "code", title: "See it in Python", kicker: "tap any line",
        doodle: "gear", html: '<div id="code-' + n + '"></div>', mount: () => mountCode(n, allCode) });

      if (t.q.length) pages.push({ key: "quiz", title: "Arena", kicker: t.q.length + " questions you will actually be asked",
        doodle: "target", html: '<div id="quiz-' + n + '"></div>',
        mount: () => mountQuiz(document.getElementById("quiz-" + n),
          t.q.map((q, i) => ({ q: q, n: n, i: i })), () => { mark(n, "quiz"); }) });

      pages.push({ key: "done", title: "Concept defeated", kicker: "that is the whole topic",
        doodle: "target", html: '<div id="fin-' + n + '"></div>', mount: () => mountFinish(n, t) });

      S.stages[n] = S.stages[n] || {};
      S.stages[n]._t = pages.length; save();

      PAGER = { n: n, pages: pages, at: 0 };
      const want = (S.stages[n] || {})._at;
      PAGER.at = Math.min(typeof want === "number" ? want : 0, pages.length - 1);
      paintPage();
    });

    setTimeout(() => {
      document.getElementById("pg-prev").addEventListener("click", () => step(-1));
      document.getElementById("pg-next").addEventListener("click", () => step(1));
    }, 0);
    return wrap;
  }

  function step(d) {
    if (!PAGER) return;
    const to = PAGER.at + d;
    if (to < 0) { go("map"); return; }
    if (to >= PAGER.pages.length) { go("lesson", nextTopic(PAGER.n) || PAGER.n); return; }
    const fresh = !(S.stages[PAGER.n] || {})[PAGER.pages[to].key];   // is the page we land on new?
    PAGER.at = to;
    S.stages[PAGER.n]._at = to; save();
    paintPage(d > 0 ? "fwd" : "back", fresh);
  }
  window.step = step;

  function paintPage(dir, reward) {
    if (!PAGER) return;
    const { n, pages, at } = PAGER, pg = pages[at], t = T(n);
    mark(n, pg.key);

    const page = document.getElementById("page");
    if (!page) return;
    page.className = "page " + (dir === "back" ? "in-back" : "in-fwd");
    page.innerHTML =
      '<div class="page-head">' + CAST.doodle(pg.doodle, 112) +
      '<div><div class="eyebrow">' + esc(pg.kicker) + "</div><h2>" + rich(pg.title) + "</h2></div></div>" +
      '<div class="page-body">' + pg.html + "</div>";
    if (pg.mount) setTimeout(pg.mount, 0);

    // progress bar + counters
    const bar = document.getElementById("pbar");
    bar.innerHTML = pages.map((q, i) =>
      '<button class="seg' + (i < at ? " past" : i === at ? " now" : "") +
      ((S.stages[n] || {})[q.key] ? " seen" : "") + '" title="' + esc(String(q.title).replace(/\$/g, "")) + '" data-i="' + i + '"></button>').join("");
    bar.querySelectorAll(".seg").forEach(b => b.addEventListener("click", () => {
      PAGER.at = +b.dataset.i; S.stages[n]._at = PAGER.at; save(); paintPage("fwd");
    }));
    document.getElementById("pcount").textContent = "Section " + (at + 1) + " of " + pages.length;
    document.getElementById("pxp").innerHTML = '<span class="xp">⭐ ' + (S.xp || 0) + " XP</span>" +
      (S.streak > 1 ? '<span class="xp fire">🔥 ' + S.streak + "</span>" : "");

    const prev = document.getElementById("pg-prev"), next = document.getElementById("pg-next");
    prev.textContent = at === 0 ? "← Map" : "← Back";
    next.textContent = at === pages.length - 1 ? "Next topic →" : "Next →";
    document.getElementById("pg-mid").innerHTML =
      '<div class="pg-dots">' + pages.map((q, i) => '<i class="' + (i === at ? "on" : i < at ? "done" : "") + '"></i>').join("") + "</div>";

    // the cast member watching this page
    const who = CAST.NAMES[(hashN(n) + at) % 3];
    const mood = ["neutral", "happy", "smug", "wow", "neutral", "happy"][at % 6];
    document.getElementById("lh-cast").innerHTML = CAST.svg(who, mood, 74, "lh-sprite");

    if (reward) gainXP(10);
    document.querySelector(".main").scrollIntoView({ behavior: "instant", block: "start" });
    window.scrollTo({ top: 0, behavior: "instant" });
    poke();
  }

  /* reward loop: XP, levels, streaks, and a different flourish each time */
  function gainXP(amount) {
    S.xp = (S.xp || 0) + amount;
    const lvlBefore = S.level || 1, lvl = Math.floor(Math.sqrt((S.xp || 0) / 40)) + 1;
    S.streak = (S.streak || 0) + 1;
    S.level = lvl; save();
    const el2 = document.getElementById("pxp");
    if (el2) el2.innerHTML = '<span class="xp pop">⭐ ' + S.xp + " XP</span>" +
      (S.streak > 1 ? '<span class="xp fire">🔥 ' + S.streak + "</span>" : "");
    floatText("+" + amount + " XP");
    if (lvl > lvlBefore) { confetti(); banner("LEVEL " + lvl, "You levelled up. Poise is pretending not to be impressed."); }
    else if (S.streak % 5 === 0) { confetti(); banner(S.streak + " IN A ROW", "Streak intact. Do not look down."); }
    else {
      const flair = ["✨", "🌟", "💥", "🎉", "🚀", "🧠"];
      sparkBurst(flair[S.streak % flair.length]);
    }
  }
  function floatText(txt) {
    const f = el('<div class="floatxp">' + txt + "</div>");
    document.body.appendChild(f);
    setTimeout(() => f.remove(), 1300);
  }
  function sparkBurst(emoji) {
    for (let i = 0; i < 7; i++) {
      const s = el('<div class="spark">' + emoji + "</div>");
      s.style.left = (45 + Math.random() * 10) + "vw";
      s.style.top = (55 + Math.random() * 10) + "vh";
      s.style.setProperty("--dx", ((Math.random() - .5) * 320).toFixed(0) + "px");
      s.style.setProperty("--dy", (-120 - Math.random() * 180).toFixed(0) + "px");
      s.style.animationDelay = (i * 0.03) + "s";
      document.body.appendChild(s);
      setTimeout(() => s.remove(), 1200);
    }
  }
  function banner(big, small) {
    const b = el('<div class="banner"><div class="bn-big">' + esc(big) + '</div><div class="bn-small">' + esc(small) + "</div></div>");
    document.body.appendChild(b);
    setTimeout(() => b.remove(), 2100);
  }
  window.gainXP = gainXP;

  function mountFinish(n, t) {
    const host = document.getElementById("fin-" + n); if (!host) return;
    const was = isDone(n);
    host.innerHTML = "";
    const card = el('<div class="finish">' +
      '<div class="fin-cast">' + CAST.svg("poise", "happy", 108) + CAST.svg("byte", "wow", 92) + CAST.svg("tensor", "smug", 100) + "</div>" +
      (t.hook ? '<div class="hook big"><div class="eyebrow">🧠 Keep this one line</div><b>' + rich(t.hook) + "</b></div>" : "") +
      '<div class="checklist">' + stagesDone(n).length + " of " + stagesTotal(n) + " sections read</div>" +
      '<div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin-top:16px">' +
      '<button class="btn mint big" id="fin-go">🎉 Mark concept defeated</button>' +
      '<button class="btn ghost" onclick="go(\'map\')">🗺️ Map</button></div></div>');
    host.appendChild(card);
    card.querySelector("#fin-go").addEventListener("click", () => {
      if (!was) { S.done[n] = 1; S.treats++; gainXP(40); save(); }
      confetti(); checkBadges();
      banner("CONCEPT DEFEATED", t.t);
      Poise.pick("donetopic", "chef");
      const nx = nextTopic(n);
      card.querySelector("#fin-go").textContent = "✓ Defeated";
      if (nx) setTimeout(() => go("lesson", nx), 1400);
      else setTimeout(() => go("done"), 1400);
    });
  }

  /* unpack an equation into word-shaped parts */
  function unpack(f) {
    const eq = String(f).split(";")[0];
    const sides = eq.split(/←|=/);
    if (sides.length < 2) return "";
    return '<div class="card flat" style="background:var(--surface-2);border-style:dashed;margin-top:14px">' +
      '<div class="eyebrow">Fancy equation, simple idea</div>' +
      '<div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:8px;font-family:var(--display);font-weight:800">' +
      '<span class="chip" style="background:var(--sun)">' + rich(sides[0].trim()) + "</span><span>=</span>" +
      sides.slice(1).join("=").split(/(?=[−+])/).map(p => '<span class="chip">' + rich(p.trim()) + "</span>").join('<span>·</span>') +
      "</div>" + says("Read it left to right, out loud. If you can say it in English, you know it.", "cool") + "</div>";
  }

  const SAYWHO = { cool:"poise", fire:"poise", confused:"byte", dead:"byte", cry:"byte",
    chef:"tensor", evil:"tensor", brain:"tensor", panic:"byte", king:"poise" };
  function says(txt, mood) {
    const who = SAYWHO[mood] || "poise";
    return '<div class="says"><span class="face">' + CAST.svg(who, MOODMAP[mood] || "neutral", 64) +
      '</span><div><span class="who">' + who + '</span><p>' + txt + "</p></div></div>";
  }

  /* ---- walkthrough (④) ---- */
  function mountWalk(n, t) {
    const host = document.getElementById("walk-" + n); if (!host) return;
    const w = t.walk, steps = w.steps || [];
    let at = 0;
    host.innerHTML = "";
    if (w.data) {
      const tw = el('<div class="tablewrap" style="margin-bottom:14px"></div>');
      tw.innerHTML = "<table><thead><tr>" + w.data.head.map(h => "<th>" + esc(h) + "</th>").join("") +
        "</tr></thead><tbody>" + w.data.rows.map(r => "<tr>" + r.map(c => "<td>" + esc(c) + "</td>").join("") + "</tr>").join("") + "</tbody></table>";
      host.appendChild(tw);
    }
    const box = el('<div class="trace"></div>');
    steps.forEach((s, i) => box.appendChild(el('<div class="tstep" data-i="' + i + '"><span class="idx">' + (i + 1) +
      '</span><span class="lbl" style="font-family:var(--body);font-weight:700">' + rich(s) + "</span></div>")));
    host.appendChild(box);
    const bar = el('<div style="display:flex;gap:9px;flex-wrap:wrap;margin-top:14px">' +
      '<button class="btn" id="w-next">NEXT STEP →</button><button class="btn ghost sm" id="w-all">Show all</button>' +
      '<button class="btn ghost sm" id="w-reset">↺</button></div>');
    host.appendChild(bar);
    if (t.example) host.appendChild(el('<div class="card flat" style="background:var(--surface-2);margin-top:14px;border-style:dashed">' +
      '<div class="eyebrow">Numbers to check by hand</div><div class="prose" style="margin-top:4px"><p>' + rich(t.example) + "</p></div></div>"));

    const paint = () => {
      box.querySelectorAll(".tstep").forEach((s, i) => {
        s.classList.toggle("live", i === at - 1);
        s.classList.toggle("done", i < at - 1);
      });
      document.getElementById("w-next").disabled = at >= steps.length;
    };
    paint();
    bar.querySelector("#w-next").addEventListener("click", () => {
      at++; paint();
      if (at >= steps.length) { Poise.say("That's the whole calculation. No library did any of that for you.", "chef"); mark(n, "numeric"); headerRefresh(); }
      else Poise.say(["Keep going.","Check that number yourself before you believe me.","Mhm. And then?","This is the part people skip. Don't."][at % 4], "neutral");
    });
    bar.querySelector("#w-all").addEventListener("click", () => { at = steps.length; paint(); });
    bar.querySelector("#w-reset").addEventListener("click", () => { at = 0; paint(); });
  }

  /* ---- trace (⑤) ---- */
  function mountTrace(n, t) {
    const host = document.getElementById("trace-" + n); if (!host) return;
    const steps = (t.steps && t.steps.length ? t.steps : [t.idea]).map((s, i) => ({ lbl: "Step " + (i + 1), txt: s }));
    host.innerHTML = "";
    host.appendChild(el('<div class="prose"><p>Trace mode slows the method down to one operation per click. Nothing here is a black box: every line is something you could do with a pen.</p></div>'));
    const box = el('<div class="trace"></div>');
    steps.forEach((s, i) => {
      if (i) box.appendChild(el('<div class="arrowdown">↓</div>'));
      box.appendChild(el('<div class="tstep" data-i="' + i + '"><span class="idx">' + (i + 1) +
        '</span><div style="min-width:0"><div class="lbl">' + s.lbl + '</div><div style="font-weight:700">' + rich(s.txt) + "</div></div></div>"));
    });
    host.appendChild(box);
    const bar = el('<div style="display:flex;gap:9px;margin-top:14px;flex-wrap:wrap">' +
      '<button class="btn pink" id="t-step">👁️ TRACE IT</button><button class="btn ghost sm" id="t-reset">↺</button></div>');
    host.appendChild(bar);
    let at = 0;
    const paint = () => box.querySelectorAll(".tstep").forEach((s, i) => {
      s.classList.toggle("live", i === at - 1); s.classList.toggle("done", i < at - 1);
    });
    bar.querySelector("#t-step").addEventListener("click", () => {
      at = at >= steps.length ? 1 : at + 1; paint();
      document.getElementById("t-step").textContent = at >= steps.length ? "↺ Again" : "👁️ Next operation";
      if (at >= steps.length) Poise.say("Input to output, nothing skipped. That is the whole model.", "cool");
    });
    bar.querySelector("#t-reset").addEventListener("click", () => { at = 0; paint(); document.getElementById("t-step").textContent = "👁️ TRACE IT"; });
  }

  /* ---- code (⑧) ---- */
  const NOTES = [
    [/\.fit\(/, "This is where the model learns. Everything before was shopping; this is cooking."],
    [/\.predict_proba\(/, "Probabilities, not labels. You still have to pick a threshold."],
    [/\.predict\(/, "Now we ask it. It will answer confidently whether or not it should."],
    [/\.transform\(/, "Applies the numbers it learned on train. Note: transform, not fit_transform."],
    [/fit_transform\(/, "Learns the statistics AND applies them — training data only, or you have leaked."],
    [/train_test_split/, "The split. Do this before anything that learns from data."],
    [/cross_val|KFold|StratifiedKFold/, "Several splits instead of one lucky one."],
    [/GridSearch|RandomizedSearch|optuna/, "Searching hyperparameters. This is where your afternoon goes."],
    [/np\.(sum|mean|dot)\(/, "The actual arithmetic from the derivation above."],
    [/StandardScaler|MinMaxScaler|RobustScaler/, "Scaling. Fit on train only. I will keep saying this."],
    [/Pipeline|ColumnTransformer/, "Bundles preprocessing with the model so it cannot drift apart."],
    [/for .*(epoch|range)/, "The training loop. Each pass nudges the parameters downhill."],
    [/-= *lr|-= *eta|learning_rate/, "new = old − step × slope. The whole of gradient descent."],
    [/score\(|accuracy_score|mean_squared_error|r2_score|f1_score|roc_auc/, "The verdict. One number that hides a lot of detail."],
    [/import /, "Imports. Boring but note which module each thing lives in — interviewers ask."]
  ];
  function hilite(line) {
    // Tokenise into placeholders FIRST, so later regexes can never match the
    // markup this function itself inserted (e.g. the word "class" in class="cm").
    const store = [];
    const hold = html => String.fromCharCode(0xE000 + store.push(html) - 1);
    let s = esc(line);
    // strings before comments, so a # inside a string is not treated as a comment
    s = s.replace(/("""[\s\S]*?"""|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g,
      m => hold('<span class="st">' + m + "</span>"));
    s = s.replace(/#.*$/, m => hold('<span class="cm">' + m + "</span>"));
    s = s.replace(/\b(import|from|def|return|for|in|if|else|elif|while|class|as|with|not|and|or|None|True|False|lambda|print|try|except|finally|raise|yield|assert|global|pass|break|continue|is)\b/g,
      m => hold('<span class="kw">' + m + "</span>"));
    s = s.replace(/\b(\d+\.?\d*(e-?\d+)?)\b/g, m => hold('<span class="nu">' + m + "</span>"));
    s = s.replace(/\b([A-Za-z_][\w]*)(?=\()/g, m => hold('<span class="fn">' + m + "</span>"));
    return s.replace(/[\uE000-\uF8FF]/g, ch => store[ch.charCodeAt(0) - 0xE000] || "");
  }
  function mountCode(n, listings) {
    const host = document.getElementById("code-" + n); if (!host) return;
    host.innerHTML = "";
    host.appendChild(el('<div class="prose"><p>Highlighted lines are tappable \u2014 Poise says what that line is doing.' +
      (listings.length > 1 ? " This topic ships " + listings.length + " listings." : "") + "</p></div>"));
    listings.forEach((src, li) => {
      if (li) host.appendChild(el('<div class="eyebrow" style="margin-top:18px">Listing ' + (li + 1) + "</div>"));
      const pre = el('<pre class="code"></pre>');
      src.split("\n").forEach(ln => {
        const note = (NOTES.find(([re]) => re.test(ln)) || [])[1];
        const sp = el('<span class="ln' + (note ? " tappable" : "") + '">' + (hilite(ln) || "&nbsp;") + "</span>");
        if (note) sp.addEventListener("click", () => {
          host.querySelectorAll(".ln.on").forEach(e => e.classList.remove("on"));
          sp.classList.add("on"); Poise.say(note, "cool");
        });
        pre.appendChild(sp);
      });
      host.appendChild(pre);
    });
  }

  /* ---- quiz engine (shared by lesson ⑨ and the Arena) ---- */
  function mountQuiz(host, items, onDone) {
    if (!host) return;
    let i = 0;
    const card = el('<div></div>');
    host.innerHTML = "";
    host.appendChild(card);
    function paint() {
      if (i >= items.length) {
        card.innerHTML = '<div class="qcard"><h3>Set cleared.</h3><p style="font-weight:700">' +
          items.length + ' questions, answered honestly. That is the part that counts.</p>' +
          '<button class="btn mint" id="q-again">↺ Run it again</button></div>';
        card.querySelector("#q-again").addEventListener("click", () => { i = 0; paint(); });
        if (onDone) onDone();
        Poise.say("Set cleared. Self-graded, so no cheating — you'd only be lying to a robot.", "chef");
        return;
      }
      const it = items[i], key = it.n + ":" + it.i, prev = S.q[key] || { r:0, w:0 };
      card.innerHTML =
        '<div class="scorebar"><span class="chip">' + (i + 1) + " / " + items.length + "</span>" +
        '<span class="chip">Topic ' + it.n + " · " + esc(T(it.n).t) + "</span>" +
        (prev.w ? '<span class="chip" style="background:var(--bubblegum);color:#fff">missed ' + prev.w + "×</span>" : "") +
        (prev.r ? '<span class="chip" style="background:var(--mint)">got it ' + prev.r + "×</span>" : "") + "</div>" +
        '<div class="qcard"><div class="qtext">' + rich(it.q.q) + "</div>" +
        '<p style="font-weight:700;color:var(--ink-soft);margin:10px 0 6px">Answer it out loud or in the box. Then reveal and grade yourself honestly.</p>' +
        '<textarea id="q-mine" rows="3" placeholder="your answer (optional, never saved)" ' +
        'style="width:100%;font-family:var(--body);font-size:15px;padding:10px;border:3px solid var(--line);border-radius:12px;background:var(--surface-2);color:var(--ink);min-width:0"></textarea>' +
        '<div style="display:flex;gap:9px;flex-wrap:wrap;margin-top:10px"><button class="btn grape" id="q-rev">Reveal the answer</button>' +
        '<button class="btn ghost sm" id="q-skip">Skip →</button></div>' +
        '<div id="q-ans" hidden></div></div>';
      card.querySelector("#q-skip").addEventListener("click", () => { i++; paint(); });
      card.querySelector("#q-rev").addEventListener("click", () => {
        const box = card.querySelector("#q-ans");
        box.hidden = false;
        box.innerHTML = '<div class="answer"><h4>Model answer</h4><div class="prose" style="margin-top:6px"><p>' +
          rich(it.q.a) + '</p></div></div>' +
          '<div style="display:flex;gap:9px;flex-wrap:wrap;margin-top:12px">' +
          '<button class="btn mint" id="q-got">✅ I had that</button>' +
          '<button class="btn pink" id="q-miss">❌ I missed it</button>' +
          '<button class="btn ghost sm" onclick="go(\'lesson\',\'' + it.n + '\')">Re-read topic ' + it.n + "</button></div>";
        card.querySelector("#q-rev").disabled = true;
        box.querySelector("#q-got").addEventListener("click", () => grade(key, true));
        box.querySelector("#q-miss").addEventListener("click", () => grade(key, false));
      });
    }
    function grade(key, ok) {
      S.q[key] = S.q[key] || { r:0, w:0 };
      if (ok) { S.q[key].r++; Poise.pick(S.q[key].r > 1 ? "right" : "right", qStats().right % 7 === 0 ? "fire" : "cool"); }
      else { S.q[key].w++; S.q[key].w >= 2 ? Poise.pick("again", "dead") : Poise.pick("wrong", "confused"); }
      save(); checkBadges(); i++; paint();
    }
    paint();
  }

  /* ---- full notes: the complete source document, block by block ---- */
  const BOXMETA = {
    keyidea:      { ico:"🔑", nm:"Key idea",      col:"var(--sun)" },
    intuition:    { ico:"💡", nm:"Intuition",     col:"var(--mint)" },
    mathbox:      { ico:"∑",  nm:"The maths",     col:"var(--grape)" },
    pitfall:      { ico:"⚠️", nm:"Pitfall",       col:"var(--bubblegum)" },
    noteb:        { ico:"📝", nm:"Note",          col:"var(--tangerine)" },
    workedexample:{ ico:"🔢", nm:"Worked example",col:"var(--mint)" },
    interview:    { ico:"🎤", nm:"Interview corner", col:"var(--grape)" }
  };
  // A derivation with a written narration: goal + plan first, then every equation
  // carries a note saying what that line does and why it is there.
  function narrate(box, nar) {
    let step = 0;
    const body = (box.blocks || []).map(b => {
      if (b.k !== "math") return renderBlocks([b], 1);
      const note = nar.steps[step];
      const label = "Step " + (step + 1);
      step++;
      return '<div class="dstep">' +
        '<div class="dstep-n">' + label + "</div>" +
        '<div class="dstep-m">' + mblock(b.t) + "</div>" +
        (note ? '<div class="dstep-why">' + rich(note) + "</div>" : "") + "</div>";
    }).join("");
    return '<div class="darg">' +
      '<div class="darg-row"><span class="darg-k">What we want</span><p>' + rich(nar.goal) + "</p></div>" +
      '<div class="darg-row"><span class="darg-k">How we get it</span><p>' + rich(nar.plan) + "</p></div>" +
      "</div>" + body +
      (nar.payoff ? '<div class="dpay"><span class="darg-k">So what</span><p>' + rich(nar.payoff) + "</p></div>" : "");
  }

  const FULLCACHE = {};
  function getFull(n) {
    if (FULLCACHE[n]) return Promise.resolve(FULLCACHE[n]);
    return fetch("data/full/" + n + ".json").then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d) {                       // number the derivations in document order
          let i = 0;
          (function walk(bl) {
            (bl || []).forEach(b => {
              if (b.k === "box") {
                if (b.kind === "mathbox") b._key = n + ":" + (i++);
                walk(b.blocks);
              }
            });
          })(d.blocks);
        }
        FULLCACHE[n] = d; return d;
      }).catch(() => null);
  }
  function renderBlocks(bl, depth) {
    return (bl || []).map(b => {
      if (b.k === "h") return "<h" + Math.min(b.lvl, 4) + ' class="nh nh' + b.lvl + '">' + rich(b.t) + "</h" + Math.min(b.lvl, 4) + ">";
      if (b.k === "p") return '<p>' + rich(b.t) + "</p>";
      if (b.k === "math") return mblock(b.t) + EXPLAIN.panel(b.t);
      if (b.k === "ul") return "<ul>" + b.items.map(x => "<li>" + rich(x) + "</li>").join("") + "</ul>";
      if (b.k === "ol") return "<ol>" + b.items.map(x => "<li>" + rich(x) + "</li>").join("") + "</ol>";
      if (b.k === "code") return '<pre class="code">' + b.t.split("\n").map(l => '<span class="ln">' + (hilite(l) || "&nbsp;") + "</span>").join("") + "</pre>";
      if (b.k === "fig") return b.missing ? "" :
        '<figure class="nfig"><img src="' + esc(b.src) + '" alt="' + esc(b.cap || "figure") + '" loading="lazy">' +
        (b.cap ? "<figcaption>" + rich(b.cap) + "</figcaption>" : "") + "</figure>";
      if (b.k === "table") {
        const head = (b.head || []).some(h => h) ?
          "<thead><tr>" + b.head.map(h => "<th>" + rich(h) + "</th>").join("") + "</tr></thead>" : "";
        return '<div class="tablewrap" style="margin:14px 0">' + "<table>" + head + "<tbody>" +
          b.rows.map(r => "<tr>" + r.map(c => "<td>" + rich(c) + "</td>").join("") + "</tr>").join("") +
          "</tbody></table></div>";
      }
      if (b.k === "box") {
        const m = BOXMETA[b.kind] || { ico:"•", nm:b.kind, col:"var(--grape)" };
        const nar = b._key && DERIV[b._key];
        return '<section class="nbox nbox-' + b.kind + '" style="--bc:' + m.col + '">' +
          '<div class="nbox-h"><span>' + m.ico + "</span>" + rich(b.t || m.nm) + "</div>" +
          '<div class="nbox-b">' + (nar ? narrate(b, nar) : renderBlocks(b.blocks, (depth || 0) + 1)) +
          "</div></section>";
      }
      return "";
    }).join("");
  }
  const LABDOODLE = { linreg:"line", gd:"hill", biasvar:"scales", logreg:"curve", tree:"tree",
    forest:"tree", adaboost:"stack", knn:"scatter", svm:"split", bayes:"bars", kmeans:"cluster",
    pca:"grid", nn:"neuron" };

  /* ---- labs page ---- */
  function viewLabs() {
    const wrap = el('<div></div>');
    wrap.appendChild(el('<div class="card" style="margin-bottom:18px"><div class="eyebrow">Model labs</div>' +
      '<h1 style="margin:5px 0 8px">Thirteen things you can actually break</h1>' +
      '<p class="prose" style="margin:0">Every lab shows the intermediate values, not just the output. Change an input and watch the weighted sum, the activation, the loss and the parameters each move in turn.</p></div>'));
    const grid = el('<div class="badgegrid"></div>');
    const items = Object.keys(DEEP).map(n => ({ id: DEEP[n], n: n, nm: T(n).t }))
      .concat([{ id:"nn", n:null, nm:"Neural Network & Backpropagation (bonus)" }]);
    items.forEach(it => {
      const b = el('<div class="badge labcard" style="text-align:left"><span class="ico">' + CAST.doodle(LABDOODLE[it.id] || "gear", 86) + "</span>" +
        '<div class="nm">' + esc(it.nm) + "</div>" +
        '<div class="hint">' + (it.n ? "Topic " + it.n : "Not in the 83 — here because you cannot learn backprop from prose") + "</div>" +
        '<button class="btn sm grape" style="margin-top:9px">Open lab</button></div>');
      b.querySelector("button").addEventListener("click", () => {
        const host = el('<div class="card" style="margin-top:18px"></div>');
        wrap.appendChild(host);
        window.LABS[it.id](host, Poise);
        if (it.n) { mark(it.n, "lab"); }
        S.stages["nn"] = S.stages["nn"] || {}; if (it.id === "nn") S.stages["nn"].lab = 1;
        save(); checkBadges();
        host.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      grid.appendChild(b);
    });
    wrap.appendChild(grid);
    Poise.say("Pick one and start moving sliders. Reading about gradient descent is not the same as sliding down it.", "brain");
    return wrap;
  }

  /* ---- arena ---- */
  function viewArena() {
    const wrap = el('<div></div>');
    const st = qStats();
    const all = [];
    list().forEach(n => T(n).q.forEach((q, i) => all.push({ q:q, n:n, i:i })));
    wrap.appendChild(el('<div class="card" style="background:var(--bubblegum);color:#fff;margin-bottom:18px">' +
      '<div class="hero-cast">' + CAST.svg("tensor","smug",92) + CAST.svg("byte","sad",78) + "</div>" +
      '<div class="eyebrow" style="color:#fff;opacity:.8">Knowledge Arena</div>' +
      '<h1 style="margin:5px 0 8px">' + all.length + " real interview questions</h1>" +
      '<p style="margin:0;font-weight:700;max-width:62ch">These are open questions, not multiple choice — answer in your own words, then reveal and grade yourself. Nothing here is a flashcard: each answer is a full explanation you can argue with.</p>' +
      '<div class="chips" style="margin-top:12px"><span class="chip" style="background:#fff">✅ ' + st.right + " had it</span>" +
      '<span class="chip" style="background:#fff">❌ ' + st.wrong + " missed</span>" +
      '<span class="chip" style="background:#fff">' + st.seen + " / " + all.length + " attempted</span></div></div>"));

    const ctl = el('<div class="card" style="margin-bottom:18px"><div class="eyebrow">Build a set</div>' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end;margin-top:8px">' +
      '<label style="font-weight:800;font-size:13px">Scope<br><select id="a-scope" style="font:inherit;padding:8px;border:3px solid var(--line);border-radius:10px;background:var(--surface-2);color:var(--ink);max-width:260px"></select></label>' +
      '<label style="font-weight:800;font-size:13px">Pool<br><select id="a-pool" style="font:inherit;padding:8px;border:3px solid var(--line);border-radius:10px;background:var(--surface-2);color:var(--ink)">' +
      '<option value="all">Everything</option><option value="new">Not yet attempted</option><option value="missed">Previously missed</option></select></label>' +
      '<label style="font-weight:800;font-size:13px">Length<br><select id="a-len" style="font:inherit;padding:8px;border:3px solid var(--line);border-radius:10px;background:var(--surface-2);color:var(--ink)">' +
      '<option value="10">10</option><option value="20">20</option><option value="0">everything</option></select></label>' +
      '<button class="btn grape" id="a-go">⚔️ Enter the Arena</button></div></div>');
    wrap.appendChild(ctl);
    const sc = ctl.querySelector("#a-scope");
    sc.innerHTML = '<option value="*">All 83 topics</option>' +
      DATA.parts.map(p => '<option value="p:' + p.id + '">Part ' + p.id + " — " + esc(p.name) + "</option>").join("") +
      list().map(n => '<option value="t:' + n + '">' + n + " · " + esc(T(n).t) + "</option>").join("");
    const host = el('<div></div>');
    wrap.appendChild(host);
    ctl.querySelector("#a-go").addEventListener("click", () => {
      const scope = sc.value, pool = ctl.querySelector("#a-pool").value, len = +ctl.querySelector("#a-len").value;
      let sel = all.filter(x => scope === "*" || (scope.startsWith("p:") ? partOf(x.n).id === scope.slice(2) : x.n === scope.slice(2)));
      if (pool === "new") sel = sel.filter(x => !S.q[x.n + ":" + x.i]);
      if (pool === "missed") sel = sel.filter(x => (S.q[x.n + ":" + x.i] || {}).w);
      if (!sel.length) { Poise.say("Empty set. Either you've done them all or you filtered too hard.", "confused"); return; }
      sel = sel.sort(() => Math.random() - .5);
      if (len) sel = sel.slice(0, len);
      mountQuiz(host, sel, null);
      host.scrollIntoView({ behavior: "smooth", block: "start" });
      Poise.say(sel.length + " questions. No multiple choice, so you cannot guess your way out.", "evil");
    });
    Poise.say("The Arena is separate from the lessons on purpose. Learn there, get tested here.", "neutral");
    return wrap;
  }

  /* ---- trophy ---- */
  function viewTrophy() {
    const wrap = el('<div></div>'), st = qStats();
    const labs = Object.keys(S.stages).filter(k => S.stages[k] && S.stages[k].lab).length;
    wrap.appendChild(el('<div class="card" style="margin-bottom:18px">' +
      '<div class="hero-cast dark">' + CAST.svg("poise","smug",88) + CAST.svg("tensor","happy",84) + "</div>" +
      '<div class="eyebrow">The shelf</div>' +
      '<h1 style="margin:5px 0 12px">Badges, treats and receipts</h1>' +
      '<div class="statgrid">' + [
        ["Concepts defeated", doneCount() + " / 83"], ["Stages completed", list().reduce((a, n) => a + stagesDone(n).length, 0)],
        ["Labs opened", labs + " / 13"], ["Questions had", st.right], ["Questions missed", st.wrong],
        ["Time used", fmt(S.used)]
      ].map(([k, v]) => '<div class="ro"><span>' + k + "</span><b>" + v + "</b></div>").join("") + "</div></div>"));
    wrap.appendChild(el('<div class="card" style="margin-bottom:18px"><div class="eyebrow">Treats Poise has earned</div>' +
      '<div class="treats" style="margin-top:8px">' + (S.treats ? Array.from({ length: S.treats }, (_, i) => TREATS[i % TREATS.length]).join("") : "nothing yet — finish a topic") + "</div>" +
      '<p style="font-weight:700;margin:10px 0 0">“I learned nothing from this cookie but I deserve it.”</p></div>'));
    const grid = el('<div class="badgegrid"></div>');
    BADGES.forEach(b => {
      const got = S.seenBadges.indexOf(b.id) >= 0 || b.test();
      grid.appendChild(el('<div class="badge' + (got ? "" : " lock") + '"><span class="ico">' + b.ico + "</span>" +
        '<div class="nm">' + esc(b.nm) + '</div><div class="hint">' + esc(b.hint) + "</div></div>"));
    });
    wrap.appendChild(grid);
    if (list().every(isDone)) {
      const b = el('<button class="btn grape" style="margin-top:18px">👑 See the finale</button>');
      b.addEventListener("click", () => go("done"));
      wrap.appendChild(b);
    }
    Poise.say(S.treats > 5 ? "Look at my treats. I earned exactly none of them." : "Finish a topic and I get a snack. That is the arrangement.", "cool");
    return wrap;
  }

  /* ---- finale ---- */
  function viewFinale() {
    const st = qStats();
    confetti();
    Poise.face("king");
    Poise.say("You just speedran Machine Learning. I am legally required to inform you that I am now jealous of your brain.", "king");
    return el('<div class="card" style="background:var(--sun);color:var(--on-bright);text-align:center">' +
      '<div class="hero-cast">' + CAST.svg("poise","happy",120) + CAST.svg("byte","happy",104) + CAST.svg("tensor","wow",112) + "</div>" +
      '<div class="eyebrow" style="color:#241046">ML campaign complete</div>' +
      '<div class="big">83 / 83</div><h2 style="margin:10px 0 18px">Concepts understood</h2>' +
      '<div class="statgrid" style="text-align:left">' + [
        ["Derivations walked", list().filter(n => (S.stages[n] || {}).theory).length],
        ["Models traced", list().filter(n => (S.stages[n] || {}).trace).length],
        ["Labs opened", Object.keys(S.stages).filter(k => S.stages[k] && S.stages[k].lab).length + " / 13"],
        ["Questions answered", st.right + st.wrong], ["Badges", S.seenBadges.length + " / " + BADGES.length],
        ["Treats", S.treats], ["Time used", fmt(S.used)], ["Flashcards made", "0"]
      ].map(([k, v]) => '<div class="ro"><span>' + k + "</span><b>" + v + "</b></div>").join("") + "</div>" +
      '<p style="font-weight:800;font-size:18px;margin:20px 0 0">“You just speedran Machine Learning.”</p></div>');
  }

  /* ---- topic completion ---- */
  function completeTopic(n, wrap) {
    const t = T(n), was = isDone(n);
    S.done[n] = 1;
    if (!was) { S.treats++; save(); confetti(); }
    headerRefresh(); checkBadges();
    const streak = list().slice(Math.max(0, list().indexOf(n) - 2), list().indexOf(n) + 1).every(isDone);
    const panel = el('<div class="card" style="background:var(--mint);margin-top:18px;border-width:4px">' +
      '<div class="eyebrow" style="color:#241046">🎉 Concept defeated</div>' +
      '<h2 style="margin:5px 0 12px;color:#241046">' + esc(t.t).toUpperCase() + "</h2>" +
      '<div class="checklist" style="color:var(--on-bright)">' +
        [["why","Why it exists"],["intuition","Intuition"],["numeric","Numerical example"],
         ["trace","Model trace"],["lab","Model lab"],["hook","Memory hook"],["code","Code"],["quiz","Arena"]]
        .filter(kv => (kv[0] !== "lab" || DEEP[n]) && (kv[0] !== "numeric" || t.walk) && (kv[0] !== "quiz" || t.q.length))
        .map(kv => "<div>" + ((S.stages[n] || {})[kv[0]] ? "\u2713 " : "\u25fb ") + kv[1] + "</div>").join("") +
        "<div>" + stagesDone(n).length + " of " + stagesTotal(n) + " sections opened</div></div>" +
      (t.hook ? '<div class="hook" style="margin-top:12px"><div class="eyebrow">🧠 Memory hook</div><b>' + rich(t.hook) + "</b></div>" : "") +
      '<p style="color:#241046;font-weight:800;margin:12px 0 0">' + TREATS[(S.treats - 1 + TREATS.length) % TREATS.length] + " Poise earned a treat.</p>" +
      '<div style="display:flex;gap:9px;flex-wrap:wrap;margin-top:14px">' +
      (nextTopic(n) ? '<button class="btn" id="c-next">NEXT TOPIC →</button>' : '<button class="btn" id="c-fin">👑 Finale</button>') +
      '<button class="btn ghost" onclick="go(\'map\')">🗺️ Map</button></div></div>');
    const old = wrap.querySelector(".completepanel"); if (old) old.remove();
    panel.classList.add("completepanel");
    wrap.appendChild(panel);
    panel.scrollIntoView({ behavior: "smooth", block: "center" });
    const nb = panel.querySelector("#c-next");
    if (nb) nb.addEventListener("click", () => go("lesson", nextTopic(n)));
    const fb = panel.querySelector("#c-fin"); if (fb) fb.addEventListener("click", () => go("done"));
    if (list().every(isDone)) { setTimeout(() => go("done"), 900); return; }
    if (streak && !was) Poise.pick("fast", "fire");
    else Poise.pick("donetopic", DEEP[n] ? "chef" : "fire");
  }

  /* ---------------------------------------------------------------- boot */
  function wire() {
    document.querySelectorAll(".navbtn[data-route]").forEach(b =>
      b.addEventListener("click", () => go(b.dataset.route, b.dataset.route === "lesson" ? cur : null)));
    $("#clk-toggle").addEventListener("click", e => {
      S.running = !S.running; save();
      e.currentTarget.textContent = S.running ? "⏸ Pause" : "▶ Resume";
      Poise.say(S.running ? "Clock running. Go." : "Clock paused. I'll pretend I didn't see that.", S.running ? "neutral" : "confused");
    });
    $("#clk-reset").addEventListener("click", () => {
      S.used = 0; save(); paintClock();
      Poise.say("Twenty hours back on the clock. Fresh start, same brain.", "cool");
    });
    $("#theme-btn").addEventListener("click", () => {
      const r = document.documentElement;
      const now = r.getAttribute("data-theme");
      const dark = now ? now === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
      r.setAttribute("data-theme", dark ? "light" : "dark");
      Poise.say(dark ? "Lights on. Bold choice for someone studying at this hour." : "Dark mode. Correct.", "cool");
    });
    document.getElementById("poise").addEventListener("click", () => {
      dockWho = CAST.NAMES[(CAST.NAMES.indexOf(dockWho) + 1) % 3];   // tap to swap who is on duty
      Poise.pick("idle", ["cool","confused","brain","evil","cry"][Math.floor(Math.random() * 5)]);
    });
    addEventListener("keydown", e => {
      if (e.target.matches("input,textarea,select")) return;
      if (route === "lesson" && (e.key === "ArrowRight" || e.key === "ArrowLeft")) {
        step(e.key === "ArrowRight" ? 1 : -1); e.preventDefault(); return;
      }
      const map = { "1":"map", "2":"lesson", "3":"labs", "4":"arena", "5":"trophy" };
      if (map[e.key]) go(map[e.key], e.key === "2" ? cur : null);
    });
    $("#clk-toggle").textContent = S.running ? "⏸ Pause" : "▶ Resume";

    const railBtn = $("#rail-toggle");
    const applyRail = () => {
      document.body.classList.toggle("rail-closed", !!S.rail);
      railBtn.setAttribute("aria-expanded", S.rail ? "false" : "true");
      railBtn.textContent = S.rail ? "☰" : "✕";
    };
    railBtn.addEventListener("click", () => { S.rail = S.rail ? 0 : 1; save(); applyRail(); poke(); });
    applyRail();

    ["pointerdown", "keydown", "wheel", "touchstart"].forEach(ev =>
      addEventListener(ev, poke, { passive: true }));
    setInterval(boredTick, 7000);
    setInterval(tick, 1000);
  }

  Promise.all([fetch("data/topics.json").then(r => r.json()),
               fetch("data/why.json").then(r => r.json()),
               fetch("data/eli5.json").then(r => r.json()).catch(() => ({})),
               fetch("data/derivations.json").then(r => r.json()).catch(() => ({}))])
    .then(([d, w, e, dv]) => {
      DATA = d; WHY = w; ELI = e || {}; DERIV = dv || {};
      WHY["03b"] = WHY["03b"] || "Your training file is 40 GB and your laptop has 16 GB of RAM. The algorithm is fine; the loading is the problem.";
      load(); wire(); checkBadges();
      const h = (location.hash || "").replace("#", "");
      go(["map","lesson","labs","arena","trophy"].indexOf(h) >= 0 ? h : "map");
      Poise.say(doneCount() ? "Back. " + (list().length - doneCount()) + " topics still standing." : "Right. 83 topics, 20 hours, zero flashcards. Start at ① WHY — never a definition first.", "cool");
    })
    .catch(e => { $("#view").innerHTML = '<div class="card"><h2>Content failed to load</h2><p>' + esc(e.message) + "</p></div>"; });
})();
