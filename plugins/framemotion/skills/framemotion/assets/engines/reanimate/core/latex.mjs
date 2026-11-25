// TeX in the Reanimate engine: latex, latexAlign and math draw typeset text as glyph outlines.
// Reanimate (reanimate/reanimate, public domain) runs LaTeX and dvisvgm for this; FrameMotion has no
// external programs, so a TeX renderer is plugged in instead: the engine page plugs in MathJax 3.2.2
// (Apache-2.0, its TeX fonts are Computer Modern outlines), see ../tex-mathjax.mjs. As in Reanimate
// without its external programs (pNoExternals), with no renderer the text is drawn with mkText.
//
// The renderer returns an element tree {name, attrs, children}; it becomes engine nodes the way
// Reanimate post-processes dvisvgm's SVG (replaceUses, unbox, scale, lowerTransformations, simplify),
// with one em of the font = 1 unit, as Reanimate's 10 pt LaTeX output scaled by 0.1 is.

import {mkGroup, mkPathString, mkRect, mkText, withTransformations, scaleXY, None} from './svg.mjs';
import {lowerTransformations, simplify} from './paths.mjs';

let renderer = null;
const cache = new Map();
const CACHE_LIMIT = 512;   // distinct TeX strings kept; the oldest is dropped first

/** setTexRenderer(fn): fn(tex, {display}) -> {name, attrs, children} of the renderer's SVG, or null to unplug. */
export function setTexRenderer(fn) { renderer = fn; cache.clear(); }
export const hasTexRenderer = () => renderer !== null;

/** Parse an SVG transform attribute into the engine's transformation list. */
export function parseTransform(str) {
  const out = [];
  for (const [, name, args] of String(str ?? '').matchAll(/(\w+)\s*\(([^)]*)\)/g)) {
    const n = args.split(/[\s,]+/).filter(Boolean).map(Number);
    if (name === 'translate') out.push({t: 'translate', x: n[0], y: n[1] ?? 0});
    else if (name === 'scale') out.push({t: 'scale', x: n[0], y: n[1] ?? n[0]});
    else if (name === 'rotate') out.push(n.length >= 3 ? {t: 'rotate', a: n[0], c: [n[1], n[2]]} : {t: 'rotate', a: n[0]});
    else if (name === 'matrix') out.push({t: 'matrix', m: n.slice(0, 6)});
    else if (name === 'skewX' || name === 'skewY') out.push({t: name, a: n[0]});
  }
  return out;
}

const num = (v) => (v === undefined || v === null || v === '' ? 0 : parseFloat(v));

/**
 * One renderer element as engine nodes (drawing attributes are dropped, as dvisvgm writes none).
 * MathJax writes a character its TeX fonts lack as <text> in a system font; LaTeX would stop on it, so
 * it is collected in `missing` and reported rather than dropped. Errors and equation tags are refused.
 */
function convert(el, missing) {
  const a = el.attrs ?? {};
  if (a['data-mml-node'] === 'merror') throw new Error(`TeX error: ${a['data-mjx-error'] ?? a.title ?? 'unknown'}`);
  if (a['data-mml-node'] === 'mlabeledtr' || 'data-labels' in a) throw new Error('TeX: equation tags (\\tag, numbered environments) are not supported; use align* without tags');
  if (el.name === 'text') { missing.push(a['data-c'] ?? el.text ?? '?'); return None; }
  const kids = () => (el.children ?? []).map((c) => convert(c, missing)).filter((n) => n !== None);
  let node;
  switch (el.name) {
    case 'svg': case 'g': case 'a': node = mkGroup(kids()); break;
    case 'path': node = el.attrs.d ? mkPathString(el.attrs.d) : None; break;
    case 'rect': {
      const w = num(el.attrs.width), h = num(el.attrs.height);
      node = {...mkRect(w, h), x: num(el.attrs.x), y: num(el.attrs.y)};
      break;
    }
    default: node = None;   // defs, title, metadata, text fallbacks: not glyph outlines
  }
  if (node === None) return None;
  const tr = parseTransform(el.attrs.transform);
  if (el.name === 'svg' && (el.attrs.x || el.attrs.y)) tr.unshift({t: 'translate', x: num(el.attrs.x), y: num(el.attrs.y)});
  return tr.length ? withTransformations(tr, node) : node;
}

/**
 * The renderer's root is MathJax's <svg> whose first group flips font coordinates (y up) to SVG (y down).
 * Reanimate flips dvisvgm's SVG back with scaleXY 0.1 (-0.1); here the flip is dropped and 1000 font
 * units (one em) become 1 unit.
 */
function toTree(root, tex) {
  const body = root.children ?? [];
  const missing = [];
  const tree = simplify(lowerTransformations(scaleXY(0.001, 0.001, mkGroup(body.map((c) => {
    if (c.name === 'g' && /scale\(\s*1\s*,\s*-1\s*\)/.test(c.attrs.transform ?? '')) {
      return mkGroup((c.children ?? []).map((k) => convert(k, missing)).filter((n) => n !== None));
    }
    return scaleXY(1, -1, convert(c, missing));
  })))));
  if (missing.length) {
    throw new Error(`TeX fonts have no glyph for ${[...new Set(missing)].map((c) => `"${c}"`).join(', ')} in "${tex}"; draw that text with mkText instead`);
  }
  return tree;
}

function render(tex, display, fallback) {
  if (!renderer) return mkText(fallback);
  const key = `${display ? 'D' : 'I'}${tex}`;
  if (!cache.has(key)) {
    if (cache.size >= CACHE_LIMIT) cache.delete(cache.keys().next().value);
    cache.set(key, toTree(renderer(tex, {display}), fallback));
  }
  return cache.get(key);
}

// LaTeX reads accented letters as a letter plus an accent; MathJax's text mode knows the same accent
// commands, so a letter that splits (NFD) into an ASCII letter and these marks is written that way.
// This covers ó ś ć ń ź ż and the accents of other Latin alphabets. MathJax 3.2.2 has no \\l, \\k (ogonek)
// or \\c (cedilla) in text mode, so ą ę ł ç and the like have no glyph and are reported.
const ACCENTS = {'\u0300': '`', '\u0301': "'", '\u0302': '^', '\u0303': '~', '\u0304': '=', '\u0306': 'u',
  '\u0307': '.', '\u0308': '"', '\u030B': 'H', '\u030C': 'v'};
/** textAccents: accented letters as TeX accent commands, other characters unchanged. */
export function textAccents(str) {
  return [...String(str)].map((ch) => {
    const [base, ...marks] = [...ch.normalize('NFD')];
    if (!marks.length || !/^[A-Za-z]$/.test(base) || !marks.every((m) => Object.hasOwn(ACCENTS, m))) return ch;
    return marks.reduce((acc, m) => `{\\${ACCENTS[m]}{${acc}}}`, base);
  }).join('');
}

/** latex: LaTeX text mode (math between $ signs), as Reanimate's `latex`. */
export const latex = (str) => render(`\\text{${textAccents(str)}}`, false, str);
/** math: an inline formula, as Reanimate's `latex ("$" <> str <> "$")`. */
export const math = (str) => render(str, false, `$${str}$`);
/** latexAlign: lines in an align* environment, as Reanimate's `latexAlign`. */
export const latexAlign = (str) => render(`\\begin{align*}${str}\\end{align*}`, true, str);
