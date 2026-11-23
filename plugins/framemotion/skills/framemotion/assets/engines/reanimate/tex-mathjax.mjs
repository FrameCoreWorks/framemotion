// Plugs MathJax 3.2.2 (Apache-2.0, loaded by the page from ../node_modules/mathjax/es5/tex-svg-full.js)
// into the Reanimate engine as its TeX renderer. FrameCore Works code. MathJax is configured before it
// loads (see index.html) with no glyph cache, so every glyph is an inline path, and with no menu or
// speech, so nothing loads later.
import {setTexRenderer} from './core/latex.mjs';

const toElement = (node) => ({
  name: node.nodeName.toLowerCase(),
  attrs: Object.fromEntries([...(node.attributes ?? [])].map((a) => [a.name, a.value])),
  children: [...node.childNodes].filter((c) => c.nodeType === 1).map(toElement),
});

/** Wait for MathJax and plug it in; resolves to true, or false when MathJax is not on the page. */
export async function useMathJax(win = globalThis) {
  const mj = win.MathJax;
  if (!mj || !mj.startup) return false;
  await mj.startup.promise;
  setTexRenderer((tex, {display}) => toElement(mj.tex2svg(tex, {display}).querySelector('svg')));
  return true;
}
