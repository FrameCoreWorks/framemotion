// Plugs MathJax 3.2.2 (Apache-2.0, the engines' node_modules/mathjax, its es5/node-main.js) into the
// Reanimate engine in Node, with the engine page's settings (see index.html), so Node draws TeX with
// the same glyph outlines as the page. FrameCore Works code. Examples that compute with glyph
// outlines (the Fourier pi, demo_tangent's "s") need a TeX renderer; this one serves tests and Node.
import {createRequire} from 'node:module';
import {setTexRenderer} from './core/latex.mjs';

let started = null;

/** Start MathJax in Node once and plug it in; resolves to true, or rejects if mathjax is not installed. */
export function useMathJaxNode() {
  started ??= (async () => {
    const require = createRequire(import.meta.url);
    const MathJax = await require('mathjax').init({
      loader: {load: ['input/tex-full', 'output/svg']},
      svg: {fontCache: 'none'}, startup: {typeset: false},
      tex: {packages: {'[-]': ['noerrors', 'noundefined']}, formatError: (jax, err) => { throw err; }},
    });
    const A = MathJax.startup.adaptor;
    const toElement = (node) => {
      const name = A.kind(node).toLowerCase();
      return {
        name,
        attrs: Object.fromEntries(A.allAttributes(node).map((a) => [a.name, a.value])),
        children: A.childNodes(node).filter((c) => !A.kind(c).startsWith('#')).map(toElement),
        text: name === 'text' ? A.textContent(node) : undefined,
      };
    };
    setTexRenderer((tex, {display}) => toElement(A.firstChild(MathJax.tex2svg(tex, {display}))));
    return true;
  })();
  return started;
}
