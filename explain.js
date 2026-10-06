/* Turns an equation into plain English: a symbol legend plus a structural reading.
   Everything here is a glossary lookup on symbols that are actually present —
   it never invents a claim about the maths. */
window.EXPLAIN = (function () {
  "use strict";

  // pattern -> [symbol shown, plain meaning]. First match wins, order matters.
  const SYM = [
    [/\\sum/,            ["Σ", "add up all of them, one row at a time"]],
    [/\\prod/,           ["Π", "multiply all of them together"]],
    [/\\int/,            ["∫", "add up over a smooth range instead of a list"]],
    [/\\nabla/,          ["∇", "the slope in every direction at once — which way is uphill"]],
    [/\\partial/,        ["∂", "how much this changes if you nudge just that one thing"]],
    [/\\hat\s*\{?y/,     ["ŷ", "what the model guessed"]],
    [/\\hat\s*\{?\\?(beta|theta|w|p|mu|sigma)/, ["the hat ^", "the estimated version — our best guess at the true value"]],
    [/\\eta\b/,          ["η", "learning rate — how big a step we take each time"]],
    [/\\alpha\b/,        ["α", "a dial you choose: step size, penalty strength, or a model's voting power"]],
    [/\\lambda\b/,       ["λ", "how hard we punish the model for being complicated"]],
    [/\\theta\b/,        ["θ", "the numbers the model is learning"]],
    [/\\varepsilon|\\epsilon/, ["ε", "the error — how often it gets things wrong"]],
    [/\\sigma\s*\(/,     ["σ( )", "the squasher: turns any number into something between 0 and 1"]],
    [/\\sigma\b/,        ["σ", "spread — how far values sit from the average"]],
    [/\\mu\b/,           ["μ", "the average"]],
    [/\\rho\b/,          ["ρ", "how strongly two things move together"]],
    [/\\gamma\b/,        ["γ", "a dial controlling reach or discount"]],
    [/\\beta\b/,         ["β", "the weights — how much each input counts"]],
    [/\\pi\b/,           ["π", "a proportion or probability"]],
    [/\\log_2/,          ["log₂", "how many yes/no questions it takes", "log"]],
    [/\\log|\\ln/,       ["log", "turns multiplying into adding, and squashes huge numbers down", "log"]],
    [/\\exp|e\^/,        ["e^", "grows fast; undoes a log"]],
    [/\\sqrt/,           ["√", "undoes a square, bringing the units back to normal"]],
    [/\\top|\^T\b/,      ["ᵀ", "flip the table on its side so the shapes line up"]],
    [/\\\|.*\\\||\\lVert/, ["‖ ‖", "the length of the arrow — how big the whole thing is"]],
    [/\\mid|\\vert/,     ["|", "\"given that\" — we already know the thing on the right"]],
    [/\\in\b/,           ["∈", "is one of"]],
    [/\\approx/,         ["≈", "roughly equal"]],
    [/\\propto/,         ["∝", "grows in step with"]],
    [/\\argmax|\\arg\s*\\max/, ["argmax", "the choice that makes it biggest", "arg"]],
    [/\\argmin|\\arg\s*\\min/, ["argmin", "the choice that makes it smallest", "arg"]],
    [/\\max\b/,          ["max", "whichever is biggest", "arg"]],
    [/\\min\b/,          ["min", "whichever is smallest", "arg"]],
    [/\\mathbb\s*\{?1|\\mathbf\s*\{?1/, ["1[ ]", "counts 1 when the thing inside is true, 0 when it is false"]],
    [/\\binom/,          ["(n k)", "how many ways to pick k things out of n"]],
    [/\\leftarrow/,      ["←", "replace the left with the right — this is an update, not a fact"]],
    [/\\to\b|\\rightarrow/, ["→", "becomes, or heads towards"]],
    [/\\Rightarrow|\\implies/, ["⟹", "therefore"]],
    [/\\infty/,          ["∞", "grows without ever stopping"]],
    [/\bP\s*\(/,         ["P( )", "the chance of the thing in the brackets"]],
    [/\bE\s*[\[\(]/,     ["E[ ]", "the long-run average"]],
    [/\\text\{?MSE|\bMSE\b/, ["MSE", "average squared miss — big mistakes hurt much more than small ones"]],
    [/\bRMSE\b/,         ["RMSE", "like MSE but back in the original units"]],
    [/\bR\^2|R\^\{2\}/,  ["R²", "the share of the wobble in y that the model explains"]],
    [/\bw\b|\bw_/,       ["w", "the weights — how much each input counts"]],
    [/\bb\b(?!ig)/,      ["b", "the bias — a baseline shift up or down"]],
  ];

  // reads the shape of the statement, not its meaning
  function shape(src) {
    const s = String(src);
    if (/\\leftarrow|\\gets/.test(s))
      return "This is an <b>update</b>: work out the right-hand side, then overwrite the left-hand side with it. Repeat.";
    if (/\\partial.*=\s*0|\\nabla.*=\s*0/.test(s))
      return "This sets the slope to <b>zero</b>. Flat ground means we are at the bottom — that is how the formula below gets found.";
    if (/\\boxed/.test(s))
      return "Boxed means <b>this is the one to remember</b>. The lines around it are the working that produced it.";
    if (/\\argmin|\\argmax/.test(s))
      return "This does not compute a number. It <b>picks the option</b> that scores best.";
    if (/^[^=]*=\s*-?\\frac/.test(s) || /=\s*\\d?frac/.test(s))
      return "A fraction on the right: the top is the total, the bottom is what we divide by — so this is an <b>average or a share</b>.";
    if (/\\sum/.test(s))
      return "The Σ means <b>go row by row</b> through the data, work out the bit after it, and add all the results up.";
    const eq = s.split("=");
    if (eq.length > 1)
      return "Read it as a sentence: <b>the thing on the left is exactly the thing on the right</b>. Everything after the first = is just a recipe for the name on the left.";
    return "";
  }

  function legend(src) {
    const s = String(src), seen = [], out = [];
    for (const row of SYM) {
      if (out.length >= 6) break;
      const re = row[0], sym = row[1][0], mean = row[1][1], family = row[1][2] || sym;
      if (re.test(s) && seen.indexOf(family) < 0) { seen.push(family); out.push([sym, mean]); }
    }
    return out;
  }

  /* html for the explainer under an equation; "" when there is nothing useful to say */
  function panel(src, id) {
    const leg = legend(src), sh = shape(src);
    if (!leg.length && !sh) return "";
    return '<details class="eqx"><summary><span>🔍</span> What this is actually saying</summary>' +
      '<div class="eqx-b">' +
      (sh ? '<p class="eqx-shape">' + sh + "</p>" : "") +
      (leg.length ? '<dl class="eqx-leg">' + leg.map(([sym, mean]) =>
        "<dt>" + sym + "</dt><dd>" + mean + "</dd>").join("") + "</dl>" : "") +
      "</div></details>";
  }

  return { panel: panel, legend: legend, shape: shape };
})();
