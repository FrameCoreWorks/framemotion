// The SVG tree of the Reanimate engine: nodes, draw attributes, constructors and the printer.
// FrameCore Works' JavaScript port of Reanimate.Svg.Constructors (reanimate/reanimate, public
// domain), of the node model and XML printer of reanimate-svg's svg-tree (BSD-3-Clause) and of
// Text.XML.Light's ppElement (GaloisInc/xml, BSD-3-Clause), so a frame prints the same SVG text as
// Reanimate. Nodes are plain frozen-by-convention objects: every
// function returns a new node and never changes its argument. No DOM, clock or network.

import {NAMED_COLORS} from './named-colors.mjs';

export const SCREEN_WIDTH = 16;
export const SCREEN_HEIGHT = 9;
export const SCREEN_TOP = SCREEN_HEIGHT / 2;
export const SCREEN_BOTTOM = -SCREEN_HEIGHT / 2;
export const SCREEN_LEFT = -SCREEN_WIDTH / 2;
export const SCREEN_RIGHT = SCREEN_WIDTH / 2;
export const DEFAULT_DPI = 96;
export const DEFAULT_STROKE_WIDTH = 0.05;

// ---------------------------------------------------------------------------------------------
// Nodes

export const None = Object.freeze({kind: 'none'});
const KINDS_WITH_ATTRS = new Set(['group', 'defs', 'path', 'circle', 'ellipse', 'rect', 'line', 'polyline', 'polygon', 'text', 'image', 'use', 'clipPath']);
export const isNone = (t) => !t || t.kind === 'none';

export const mkGroup = (children) => ({kind: 'group', attrs: {}, children: children.slice()});
export const mkDefinitions = (children) => ({kind: 'defs', attrs: {}, children: children.slice()});
export const mkCircle = (r) => ({kind: 'circle', attrs: {}, cx: 0, cy: 0, r});
export const mkEllipse = (rx, ry) => ({kind: 'ellipse', attrs: {}, cx: 0, cy: 0, rx, ry});
export const mkRect = (width, height) => ({kind: 'rect', attrs: {}, x: -width / 2, y: -height / 2, width, height, rx: 0, ry: 0});
export const mkLine = ([x1, y1], [x2, y2]) => ({kind: 'line', attrs: {}, x1, y1, x2, y2});
export const mkPath = (d) => ({kind: 'path', attrs: {}, d: d.slice()});
export const mkPathString = (str) => mkPath(parsePath(str));
export const mkUse = (name) => ({kind: 'use', attrs: {}, name});
export const mkClipPath = (id, children) => withId(id, {kind: 'clipPath', attrs: {}, children: children.slice()});
export const mkPolyline = (points) => ({kind: 'polyline', attrs: {}, points: points.map((p) => [p[0], p[1]])});
export const mkPolygon = (points) => ({kind: 'polygon', attrs: {}, points: points.map((p) => [p[0], p[1]])});

export function mkLinePath(points) {
  if (!points.length) return mkGroup([]);
  const [[x, y], ...rest] = points;
  return mkPath([{c: 'M', abs: true, args: [[x, y]]}, {c: 'L', abs: true, args: rest.map((p) => [p[0], p[1]])}]);
}
export function mkLinePathClosed(points) {
  if (!points.length) return mkGroup([]);
  const [[x, y], ...rest] = points;
  return mkPath([{c: 'M', abs: true, args: [[x, y]]}, {c: 'L', abs: true, args: rest.map((p) => [p[0], p[1]])}, {c: 'Z'}]);
}

/** mkText: SVG text 2 units high, centred on the origin, flipped back upright for Reanimate's y-up canvas. */
export function mkText(str) {
  const text = {kind: 'text', attrs: {fontSize: 2}, content: [String(str)]};
  return setAttr(flipYAxis(text), 'textAnchor', 'middle');
}

/** An image node; `href` is a URL or data URI. */
export const mkImage = ({x = 0, y = 0, width, height, href, preserveAspectRatio = null}) =>
  ({kind: 'image', attrs: {}, x, y, width, height, href, preserveAspectRatio});

/** A nested SVG document (svg-tree's SvgTree). */
export const svgTree = (doc) => ({kind: 'svg', doc: {viewBox: null, width: null, height: null, preserveAspectRatio: null, ...doc}});

// ---------------------------------------------------------------------------------------------
// Draw attributes. Keys follow svg-tree's DrawAttributes; values are plain numbers, strings,
// arrays and textures ({rgba: [r, g, b, a]}, {ref: id} or 'none').

export function setAttr(t, key, value) {
  if (!t || !KINDS_WITH_ATTRS.has(t.kind)) return t;
  return {...t, attrs: {...t.attrs, [key]: value}};
}
export const getAttr = (t, key) => (t && t.attrs ? t.attrs[key] : undefined);

/**
 * mkColor: a named SVG colour; "none" is no paint (Reanimate's `mkColor "none" = FillNone`), an unknown
 * name falls back to aliceblue (240, 248, 255) as in Reanimate.Svg.Constructors. Only the table's own
 * keys count, so "constructor" or "__proto__" are unknown names, not prototype members.
 */
export function mkColor(name) {
  if (name === 'none') return 'none';
  const c = Object.hasOwn(NAMED_COLORS, name) ? NAMED_COLORS[name] : null;
  return {rgba: c ? c.slice() : [240, 248, 255, 255]};
}
export const pixel = (r, g, b, a = 255) => ({rgba: [r, g, b, a].map((v) => Math.max(0, Math.min(255, Math.round(v))))});

export const withStrokeColor = (color, t) => setAttr(t, 'stroke', mkColor(color));
export const withStrokeColorPixel = (px, t) => setAttr(t, 'stroke', {rgba: px.slice()});
export const withStrokeOpacity = (o, t) => setAttr(t, 'strokeOpacity', o);
export const withStrokeDashArray = (arr, t) => setAttr(t, 'strokeDashArray', arr.slice());
export const withStrokeLineJoin = (join, t) => setAttr(t, 'strokeLineJoin', join);
export const withFillColor = (color, t) => setAttr(t, 'fill', mkColor(color));
export const withFillColorPixel = (px, t) => setAttr(t, 'fill', {rgba: px.slice()});
export const withFillOpacity = (o, t) => setAttr(t, 'fillOpacity', o);
export const withGroupOpacity = (o, t) => setAttr(t, 'opacity', o);
export const withStrokeWidth = (w, t) => setAttr(t, 'strokeWidth', w);
export const withId = (id, t) => setAttr(t, 'id', id);
export const withClipPathRef = (ref, t) => setAttr(mkGroup([t]), 'clipPath', ref);

// ---------------------------------------------------------------------------------------------
// Transformations ({t: 'translate', x, y}, {t: 'scale', x, y?}, {t: 'rotate', a, c?}, {t: 'matrix', m},
// {t: 'skewX', a}, {t: 'skewY', a}). Each wraps the node in a new group, as Reanimate does.

export const withTransformations = (list, t) => setAttr(mkGroup([t]), 'transform', list.slice());
export const translate = (x, y, t) => withTransformations([{t: 'translate', x, y}], t);
export const rotate = (a, t) => withTransformations([{t: 'rotate', a}], t);
export const rotateAround = (a, [x, y], t) => withTransformations([{t: 'rotate', a, c: [x, y]}], t);
export const scale = (a, t) => withTransformations([{t: 'scale', x: a}], t);
export const scaleXY = (x, y, t) => withTransformations([{t: 'scale', x, y}], t);
export const flipXAxis = (t) => scaleXY(-1, 1, t);
export const flipYAxis = (t) => scaleXY(1, -1, t);

/** svg-tree's mapTree: rebuild children first, then apply `fn` to every node, root last. */
export function mapTree(fn, t) {
  if (!t) return t;
  if (t.kind === 'group' || t.kind === 'defs') return fn({...t, children: t.children.map((c) => mapTree(fn, c))});
  return fn(t);
}

/** withViewBox: draw `child` in its own viewport `[x, y, w, h]` stretched over the whole screen. */
export const withViewBox = (vbox, child) => translate(-SCREEN_WIDTH / 2, -SCREEN_HEIGHT / 2,
  svgTree({viewBox: vbox.slice(), width: SCREEN_WIDTH, height: SCREEN_HEIGHT, elements: [child], preserveAspectRatio: 'none'}));

export const mkBackground = (color) => withFillOpacity(1, withStrokeWidth(0, withFillColor(color, mkRect(SCREEN_WIDTH, SCREEN_HEIGHT))));
export const mkBackgroundPixel = (px) => withFillOpacity(1, withStrokeWidth(0, withFillColorPixel(px, mkRect(SCREEN_WIDTH, SCREEN_HEIGHT))));

/** gridLayout: rows of nodes, each row spread evenly over the screen width. */
export function gridLayout(rows) {
  const rowSep = SCREEN_HEIGHT / rows.length;
  const out = [];
  rows.forEach((row, nRow) => {
    const colSep = SCREEN_WIDTH / row.length;
    row.forEach((elt, nCol) => out.push(translate(-SCREEN_WIDTH / 2 + colSep * nCol + colSep * 0.5, SCREEN_HEIGHT / 2 - rowSep * nRow - rowSep * 0.5, elt)));
  });
  return mkGroup(out);
}

// ---------------------------------------------------------------------------------------------
// Path data: commands are {c, abs, args} with c in M L H V C S Q T A Z (svg-tree's PathCommand).
// M/L/T args are points, H/V numbers, C [a, b, c] triples, S and Q [a, b] pairs and A
// [rx, ry, angle, largeArc, sweep, to].

const NUMBER = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/;
export function parsePath(str) {
  const out = [];
  let i = 0;
  const s = String(str);
  const skip = () => { while (i < s.length && /[\s,]/.test(s[i])) i++; };
  const num = () => {
    skip();
    const m = NUMBER.exec(s.slice(i));
    if (!m) throw new Error(`path: number expected at ${i} in "${s}"`);
    i += m[0].length;
    return parseFloat(m[0]);
  };
  const flag = () => { skip(); const ch = s[i++]; if (ch !== '0' && ch !== '1') throw new Error(`path: flag expected at ${i - 1}`); return ch === '1'; };
  const more = () => { skip(); return i < s.length && /[0-9+\-.]/.test(s[i]); };
  const pt = () => [num(), num()];
  while (true) {
    skip();
    if (i >= s.length) break;
    const letter = s[i++];
    const c = letter.toUpperCase();
    const abs = letter === c;
    const args = [];
    const repeat = (read) => { do args.push(read()); while (more()); };
    switch (c) {
      case 'M': case 'L': case 'T': repeat(pt); break;
      case 'H': case 'V': repeat(num); break;
      case 'C': repeat(() => [pt(), pt(), pt()]); break;
      case 'S': case 'Q': repeat(() => [pt(), pt()]); break;
      case 'A': repeat(() => [num(), num(), num(), flag(), flag(), pt()]); break;
      case 'Z': out.push({c: 'Z'}); continue;
      default: throw new Error(`path: unknown command "${letter}"`);
    }
    out.push({c, abs, args});
  }
  return out;
}

// ---------------------------------------------------------------------------------------------
// Printer (svg-tree's xmlOfTree and ppDocument, numbers with six decimals and trailing zeros dropped)

/** ppD: fixed six decimals, trailing zeros and a trailing dot dropped. */
export function ppD(v) {
  let s = (Object.is(v, -0) ? 0 : v).toFixed(6);
  if (s.includes('.')) s = s.replace(/0+$/, '').replace(/\.$/, '');
  return s;
}
/** ppF: opacities are single-precision floats in svg-tree. */
export const ppF = (v) => ppD(Math.fround(v));

const hex2 = (v) => v.toString(16).toUpperCase().padStart(2, '0');
const texture = (tx) => (tx === 'none' ? 'none' : tx.ref ? `url(#${tx.ref})` : `#${hex2(tx.rgba[0])}${hex2(tx.rgba[1])}${hex2(tx.rgba[2])}`);
const ref = (r) => (r === 'none' ? 'none' : `url(#${r})`);

export function serializeTransformation(tr) {
  switch (tr.t) {
    case 'matrix': return `matrix(${tr.m.map(ppD).join(', ')})`;
    case 'translate': return `translate(${ppD(tr.x)}, ${ppD(tr.y)})`;
    case 'scale': return tr.y === undefined ? `scale(${ppD(tr.x)})` : `scale(${ppD(tr.x)}, ${ppD(tr.y)})`;
    case 'rotate': return tr.c ? `rotate(${ppD(tr.a)}, ${ppD(tr.c[0])}, ${ppD(tr.c[1])})` : `rotate(${ppD(tr.a)})`;
    case 'skewX': return `skewX(${ppD(tr.a)})`;
    case 'skewY': return `skewY(${ppD(tr.a)})`;
    default: return '';
  }
}

const sp = (p) => `${ppD(p[0])},${ppD(p[1])}`;
export function serializeCommand(cmd) {
  if (cmd.c === 'Z') return 'Z';
  const letter = cmd.abs ? cmd.c : cmd.c.toLowerCase();
  switch (cmd.c) {
    case 'M': case 'L': case 'T': return letter + cmd.args.map(sp).join(' ');
    case 'H': case 'V': return letter + cmd.args.map(ppD).join(' ');
    case 'C': case 'S': case 'Q': return letter + cmd.args.map((g) => g.map(sp).join(' ')).join(' ');
    case 'A': return letter + cmd.args.map(([rx, ry, a, l, s, to]) => `${ppD(rx)} ${ppD(ry)} ${ppD(a)} ${l ? 1 : 0} ${s ? 1 : 0} ${sp(to)}`).join(' ');
    default: throw new Error(`unknown path command ${cmd.c}`);
  }
}
/**
 * serializeCommands: the path data. A command with no arguments (mkLinePathClosed of one point writes
 * "L" with nothing after it) is invalid SVG; browsers draw the path up to it and log an error, so the
 * path is written up to it instead, which draws the same without the error.
 */
export function serializeCommands(cmds) {
  const end = cmds.findIndex((c) => c.c !== 'Z' && Array.isArray(c.args) && c.args.length === 0);
  return (end < 0 ? cmds : cmds.slice(0, end)).map(serializeCommand).join(' ');
}

// The order of drawAttributesList in svg-tree; each prints only when set.
const DRAW_ATTRIBUTES = [
  ['strokeWidth', 'stroke-width', ppD], ['stroke', 'stroke', texture], ['fill', 'fill', texture],
  ['strokeLineCap', 'stroke-linecap', String], ['strokeLineJoin', 'stroke-linejoin', String],
  ['strokeMiterLimit', 'stroke-miterlimit', ppD],
  ['transform', 'transform', (l) => l.map(serializeTransformation).join(' ')],
  ['opacity', 'opacity', ppF], ['fillOpacity', 'fill-opacity', ppF], ['strokeOpacity', 'stroke-opacity', ppF],
  ['fontSize', 'font-size', ppD], ['fontFamily', 'font-family', (l) => l.join(', ')],
  ['fillRule', 'fill-rule', String], ['clipRule', 'clip-rule', String], ['mask', 'mask', ref],
  ['class', 'class', (l) => (l.length ? l.join(' ') : null)], ['id', 'id', String],
  ['strokeDashOffset', 'stroke-dashoffset', ppD], ['strokeDashArray', 'stroke-dasharray', (l) => l.map(ppD).join(', ')],
  ['textAnchor', 'text-anchor', String], ['clipPath', 'clip-path', ref],
  ['markerEnd', 'marker-end', ref], ['markerStart', 'marker-start', ref], ['markerMid', 'marker-mid', ref],
  ['filter', 'filter', ref],
];
const escAttr = (v) => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
const escText = (v) => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function drawAttrs(attrs) {
  const out = [];
  for (const [key, name, fmt] of DRAW_ATTRIBUTES) {
    const v = attrs?.[key];
    if (v === undefined || v === null) continue;
    const s = fmt(v);
    if (s !== null) out.push([name, s]);
  }
  return out;
}
const nonZero = (name, v) => (v === 0 || v === undefined || v === null ? [] : [[name, ppD(v)]]);

/** [tag, attributes, children (trees), xml content] of a node, or null for None. */
function element(t) {
  switch (t.kind) {
    case 'none': return null;
    case 'group': return ['g', drawAttrs(t.attrs), t.children];
    case 'defs': return ['defs', drawAttrs(t.attrs), t.children];
    case 'clipPath': return ['clipPath', drawAttrs(t.attrs), t.children];
    case 'path': return ['path', [...drawAttrs(t.attrs), ...(t.d.length ? [['d', serializeCommands(t.d)]] : [])], []];
    case 'circle': return ['circle', [...drawAttrs(t.attrs), ...nonZero('cx', t.cx), ...nonZero('cy', t.cy), ...nonZero('r', t.r)], []];
    case 'ellipse': return ['ellipse', [...drawAttrs(t.attrs), ...nonZero('cx', t.cx), ...nonZero('cy', t.cy), ...nonZero('rx', t.rx), ...nonZero('ry', t.ry)], []];
    case 'rect': return ['rect', [...drawAttrs(t.attrs), ['width', ppD(t.width)], ['height', ppD(t.height)], ...nonZero('x', t.x), ...nonZero('y', t.y), ...nonZero('rx', t.rx), ...nonZero('ry', t.ry)], []];
    case 'line': return ['line', [...drawAttrs(t.attrs), ...nonZero('x1', t.x1), ...nonZero('y1', t.y1), ...nonZero('x2', t.x2), ...nonZero('y2', t.y2)], []];
    case 'polyline': case 'polygon': return [t.kind, [...drawAttrs(t.attrs), ...(t.points.length ? [['points', t.points.map(sp).join(' ')]] : [])], []];
    case 'use': return ['use', [...drawAttrs(t.attrs), ['xlink:href', `#${t.name}`]], []];
    case 'image': return ['image', [...drawAttrs(t.attrs), ['width', ppD(t.width)], ['height', ppD(t.height)], ...nonZero('x', t.x), ...nonZero('y', t.y), ['xlink:href', t.href],
      ...(t.preserveAspectRatio ? [['preserveAspectRatio', t.preserveAspectRatio]] : [])], []];
    case 'text': return ['text', drawAttrs(t.attrs), null, {text: t.content.join(''), empty: t.content.length === 0}];
    case 'svg': return ['svg', documentAttrs(t.doc), null, {elements: t.doc.elements}];
    default: throw new Error(`cannot print a "${t.kind}" node`);
  }
}

function documentAttrs(doc) {
  const out = [];
  if (doc.viewBox) out.push(['viewBox', doc.viewBox.map(ppD).join(' ')]);
  out.push(['xmlns', 'http://www.w3.org/2000/svg'], ['xmlns:xlink', 'http://www.w3.org/1999/xlink'], ['version', '1.1']);
  if (doc.width !== null && doc.width !== undefined) out.push(['width', ppD(doc.width)]);
  if (doc.height !== null && doc.height !== undefined) out.push(['height', ppD(doc.height)]);
  if (doc.preserveAspectRatio) out.push(['preserveAspectRatio', doc.preserveAspectRatio]);
  return out;
}

const tagStart = (tag, attrs) => `<${tag}${attrs.length ? ' ' + attrs.map(([k, v]) => `${k}="${escAttr(v)}"`).join(' ') : ''}`;

// xml-light's ppElement, used by svg-tree for nodes whose XML has content but no tree children
// (text and nested documents). Lines are joined without the newline, as Reanimate's tests print them.
function ppXml(t, indent) {
  const el = element(t);
  if (!el) return '';
  const [tag, attrs, , content] = el;
  const head = indent + tagStart(tag, attrs);
  if (content?.text !== undefined) return content.empty ? `${head} />` : `${head}>${escText(content.text)}</${tag}>`;
  const kids = content ? content.elements : (el[2] ?? []);
  const shown = kids.filter((k) => !isNone(k));
  if (!shown.length) return `${head} />`;
  return `${head}>${shown.map((k) => ppXml(k, indent + '  ')).join('')}${indent}</${tag}>`;
}

/** svg-tree's ppTree: one node as SVG text. */
export function ppTree(t) {
  const el = element(t);
  if (!el) return '';
  const [tag, attrs, children, content] = el;
  if (content) return ppXml(t, '');
  if (!children.length) return `${tagStart(tag, attrs)} />`;
  return `${tagStart(tag, attrs)}>${children.map(ppTree).join('')}</${tag}>`;
}

/**
 * renderSvg: a whole frame on Reanimate's 16 × 9 canvas (y up, stroke width 0.05), as SVG text.
 * `width` and `height` set the document size in pixels (null leaves them out, as Reanimate's tests do).
 * `screen` is FrameMotion's addition for reels: the canvas in units, centred on the origin, such as
 * [9, 16] for a 9:16 film (Reanimate's own canvas is always [16, 9]).
 */
export function renderSvg(t, {width = null, height = null, screen = [SCREEN_WIDTH, SCREEN_HEIGHT]} = {}) {
  const root = withStrokeWidth(DEFAULT_STROKE_WIDTH, scaleXY(1, -1, t));
  const doc = {viewBox: [-screen[0] / 2, -screen[1] / 2, screen[0], screen[1]], width, height, preserveAspectRatio: 'none'};
  return `${tagStart('svg', documentAttrs(doc))}>${ppTree(root)}</svg>`;
}
