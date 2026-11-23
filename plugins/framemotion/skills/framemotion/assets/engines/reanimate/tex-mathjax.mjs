// Plugs MathJax 3.2.2 (Apache-2.0, loaded by the page from ../node_modules/mathjax/es5/tex-svg-full.js)
// into the Reanimate engine as its TeX renderer. FrameCore Works code. MathJax is configured before it
// loads (see index.html) with no glyph cache, so every glyph is an inline path, and with no menu or
// speech, so nothing loads later.
import {setTexRenderer} from './core/latex.mjs';

const toElement = (node) => ({
  name: node.nodeName.toLowerCase(),
  attrs: Object.fromEntries([...(node.attributes ?? [])].map((a) => [a.name, a.value])),
  children: [...node.childNodes].filter((c) => c.nodeType === 1).map(toElement),
  text: node.nodeName.toLowerCase() === 'text' ? node.textContent : undefined,
});

const MISSING = 'MathJax is not loaded, so TeX text cannot be drawn: install the engines\' packages ' +
  '(npm ci in assets/engines, which brings mathjax 3.2.2) and load ../node_modules/mathjax/es5/tex-svg-full.js';

/**
 * Wait for MathJax and plug it in; resolves to true. Without MathJax (its script missing or broken)
 * it resolves to false and plugs in a renderer that throws MISSING, so only a frame that draws TeX
 * fails, with that message, instead of silently drawing plain text.
 */
export async function useMathJax(win = globalThis) {
  const mj = win.MathJax;
  let failure = null;
  if (mj?.startup?.promise) await mj.startup.promise.catch((err) => { failure = err; });
  if (failure || typeof mj?.tex2svg !== 'function') {
    const message = failure ? `MathJax failed to start (${failure?.message ?? failure}), so TeX text cannot be drawn` : MISSING;
    setTexRenderer(() => { throw new Error(message); });
    return false;
  }
  setTexRenderer((tex, {display}) => toElement(mj.tex2svg(tex, {display}).querySelector('svg')));
  return true;
}
