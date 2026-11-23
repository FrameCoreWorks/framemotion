// Paths, partial drawing and bounding boxes of the Reanimate engine.
// FrameCore Works' JavaScript port of Reanimate.Svg.LineCommand, Reanimate.Svg (pathify,
// lowerTransformations, simplify, glyph helpers) and Reanimate.Svg.BoundingBox from
// reanimate/reanimate (public domain). No DOM, clock or network.

import {evalBezier, bezierSubsegment, quadToCubic, arcLength, distance, linearLerp, mkMatrix, mulMatrix, transformPoint, IDENTITY} from './geom.mjs';
import {mkGroup, mapTree, None, isNone, DEFAULT_DPI} from './svg.mjs';

// LineCommand: {k: 'move', p} | {k: 'bezier', ps: [1 to 3 points after the current point]} | {k: 'end', p}

/** lineToPath: line commands back to absolute SVG path commands. */
export function lineToPath(cmds) {
  return cmds.map((cmd) => {
    if (cmd.k === 'move') return {c: 'M', abs: true, args: [cmd.p]};
    if (cmd.k === 'end') return {c: 'Z'};
    if (cmd.ps.length === 3) return {c: 'C', abs: true, args: [cmd.ps]};
    if (cmd.ps.length === 2) return {c: 'Q', abs: true, args: [cmd.ps]};
    if (cmd.ps.length === 1) return {c: 'L', abs: true, args: [cmd.ps[0]]};
    throw new Error('lineToPath: invalid bezier curve');
  });
}

const cmdToControlPoint = (cmd) => (cmd && cmd.k === 'bezier' ? cmd.ps[cmd.ps.length - 2] : null);

const calculateVectorAngle = (ux, uy, vx, vy) => {
  const ta = Math.atan2(uy, ux), tb = Math.atan2(vy, vx);
  return tb >= ta ? tb - ta : Math.PI * 2 - (ta - tb);
};

/** convertSvgArc: an elliptical arc as cubic Bézier pieces of at most a quarter turn each. */
export function convertSvgArc([x0, y0], radiusX, radiusY, angle, largeArcFlag, sweepFlag, [x, y]) {
  if (x0 === x && y0 === y) return [];
  if (radiusX === 0 && radiusY === 0) return [{k: 'bezier', ps: [[x, y]]}];
  const sinPhi = Math.sin((angle * Math.PI) / 180), cosPhi = Math.cos((angle * Math.PI) / 180);
  const x1dash = (cosPhi * (x0 - x)) / 2 + (sinPhi * (y0 - y)) / 2;
  const y1dash = (-sinPhi * (x0 - x)) / 2 + (cosPhi * (y0 - y)) / 2;
  const numerator = radiusX * radiusX * radiusY * radiusY - radiusX * radiusX * y1dash * y1dash - radiusY * radiusY * x1dash * x1dash;
  const s = Math.sqrt(1 - numerator / (radiusX * radiusX * radiusY * radiusY));
  const rx = numerator < 0 ? radiusX * s : radiusX;
  const ry = numerator < 0 ? radiusY * s : radiusY;
  const root = numerator < 0 ? 0
    : ((largeArcFlag && sweepFlag) || (!largeArcFlag && !sweepFlag) ? -1 : 1)
      * Math.sqrt(numerator / (radiusX * radiusX * y1dash * y1dash + radiusY * radiusY * x1dash * x1dash));
  const cxdash = (root * rx * y1dash) / ry;
  const cydash = (-root * ry * x1dash) / rx;
  const cx = cosPhi * cxdash - sinPhi * cydash + (x0 + x) / 2;
  const cy = sinPhi * cxdash + cosPhi * cydash + (y0 + y) / 2;
  const theta1 = calculateVectorAngle(1, 0, (x1dash - cxdash) / rx, (y1dash - cydash) / ry);
  const dthetaRaw = calculateVectorAngle((x1dash - cxdash) / rx, (y1dash - cydash) / ry, (-x1dash - cxdash) / rx, (-y1dash - cydash) / ry);
  const dtheta = !sweepFlag && dthetaRaw > 0 ? dthetaRaw - 2 * Math.PI : sweepFlag && dthetaRaw < 0 ? dthetaRaw + 2 * Math.PI : dthetaRaw;
  const segments = Math.ceil(Math.abs(dtheta / (Math.PI / 2)));
  const delta = dtheta / segments;
  const t = ((8 / 3) * Math.sin(delta / 4) * Math.sin(delta / 4)) / Math.sin(delta / 2);
  const out = [];
  let startX = x0, startY = y0, th1 = theta1;
  for (let n = segments; n > 0; n--) {
    const cos1 = Math.cos(th1), sin1 = Math.sin(th1), th2 = th1 + delta, cos2 = Math.cos(th2), sin2 = Math.sin(th2);
    const ex = cosPhi * rx * cos2 - sinPhi * ry * sin2 + cx;
    const ey = sinPhi * rx * cos2 + cosPhi * ry * sin2 + cy;
    const dx1 = t * (-cosPhi * rx * sin1 - sinPhi * ry * cos1), dy1 = t * (-sinPhi * rx * sin1 + cosPhi * ry * cos1);
    const dxe = t * (cosPhi * rx * sin2 + sinPhi * ry * cos2), dye = t * (sinPhi * rx * sin2 - cosPhi * ry * cos2);
    out.push({k: 'bezier', ps: [[startX + dx1, startY + dy1], [ex + dxe, ey + dye], [ex, ey]]});
    startX = ex; startY = ey; th1 = th2;
  }
  return out;
}

/** toLineCommands: any SVG path commands as absolute moves, Bézier pieces of degree 1 to 3 and closes. */
export function toLineCommands(path) {
  let pos = [0, 0];
  let startPos = [0, 0];
  let prev = null;   // the last line command, for smooth curves' mirrored control points
  const out = [];
  const absolute = (abs, from, p) => (abs ? p : [from[0] + p[0], from[1] + p[1]]);
  const mirror = (c, p) => [c[0] * 2 - p[0], c[1] * 2 - p[1]];
  for (const cmd of path) {
    const lcmds = [];
    switch (cmd.c) {
      case 'M':
        if (cmd.abs) { if (!cmd.args.length) break; pos = cmd.args[cmd.args.length - 1]; }
        else pos = cmd.args.reduce((a, p) => [a[0] + p[0], a[1] + p[1]], pos);
        lcmds.push({k: 'move', p: pos});
        break;
      case 'L':
        for (const to of cmd.args) { pos = absolute(cmd.abs, pos, to); lcmds.push({k: 'bezier', ps: [pos]}); }
        break;
      case 'H':
        for (const x of cmd.args) { pos = [cmd.abs ? x : pos[0] + x, pos[1]]; lcmds.push({k: 'bezier', ps: [pos]}); }
        break;
      case 'V':
        for (const y of cmd.args) { pos = [pos[0], cmd.abs ? y : pos[1] + y]; lcmds.push({k: 'bezier', ps: [pos]}); }
        break;
      case 'C':
        for (const [a, b, c] of cmd.args) {
          const from = pos;
          const ps = [a, b, c].map((p) => absolute(cmd.abs, from, p));
          pos = ps[2];
          lcmds.push({k: 'bezier', ps});
        }
        break;
      case 'S': {
        let last = prev;
        for (const [c2, to] of cmd.args) {
          const from = pos;
          pos = absolute(cmd.abs, from, to);
          const ctrl = cmdToControlPoint(last);
          const c1 = ctrl ? mirror(from, ctrl) : absolute(cmd.abs, from, c2);
          const cmdOut = {k: 'bezier', ps: [c1, absolute(cmd.abs, from, c2), pos]};
          lcmds.push(cmdOut);
          last = cmdOut;
        }
        break;
      }
      case 'Q':
        for (const [a, b] of cmd.args) {
          const from = pos;
          const ps = [a, b].map((p) => absolute(cmd.abs, from, p));
          pos = ps[1];
          lcmds.push({k: 'bezier', ps});
        }
        break;
      case 'T': {
        let last = prev;
        for (const to of cmd.args) {
          const from = pos;
          pos = absolute(cmd.abs, from, to);
          const ctrl = cmdToControlPoint(last);
          const c1 = ctrl ? mirror(from, ctrl) : from;
          const cmdOut = {k: 'bezier', ps: [c1, pos]};
          lcmds.push(cmdOut);
          last = cmdOut;
        }
        break;
      }
      case 'A':
        for (const [rx, ry, angle, large, sweep, to] of cmd.args) {
          const from = pos;
          pos = absolute(cmd.abs, from, to);
          lcmds.push(...convertSvgArc(from, rx, ry, angle, large, sweep, pos));
        }
        break;
      case 'Z':
        pos = startPos;
        lcmds.push({k: 'end', p: startPos});
        break;
      default: throw new Error(`toLineCommands: unknown command ${cmd.c}`);
    }
    if (lcmds.length === 1 && lcmds[0].k === 'move') startPos = lcmds[0].p;
    out.push(...lcmds);
    prev = lcmds.length ? lcmds[lcmds.length - 1] : null;
  }
  return out;
}

function rpointsToCubic(lst) {
  if (lst.length === 2) return [lst[0], lst[0], lst[1], lst[1]];
  if (lst.length === 3) return quadToCubic(lst);
  if (lst.length === 4) return lst;
  throw new Error(`rpointsToBezier: invalid list of ${lst.length} points`);
}

/** Lengths of each line command from a starting point (lineLength run through the list). */
function lineLengths(cmds) {
  let from = [0, 0];
  return cmds.map((cmd) => {
    let len;
    if (cmd.k === 'move') { len = 0; from = cmd.p; }
    else if (cmd.k === 'end') { len = distance(from, cmd.p); from = cmd.p; }
    else if (cmd.ps.length === 1) { len = distance(from, cmd.ps[0]); from = cmd.ps[0]; }
    else { len = arcLength(rpointsToCubic([from, ...cmd.ps]), 1, 0.0001); from = cmd.ps[cmd.ps.length - 1]; }
    return len;
  });
}
export const totalLength = (cmds) => lineLengths(cmds).reduce((a, b) => a + b, 0);

function adjustLineLength(alpha, from, cmd) {
  if (cmd.k === 'bezier') return {k: 'bezier', ps: bezierSubsegment([from, ...cmd.ps], 0, alpha).slice(1)};
  if (cmd.k === 'move') return cmd;
  return {k: 'bezier', ps: [linearLerp(alpha, cmd.p, from)]};
}

/** partialLine: the first `alpha` of a path by length; the cut piece is split by its curve parameter. */
export function partialLine(alpha, cmds) {
  const lens = lineLengths(cmds);
  const target = lens.reduce((a, b) => a + b, 0) * alpha;
  const out = [];
  let d = 0, from = [0, 0];
  for (let i = 0; i < cmds.length; i++) {
    const cmd = cmds[i], len = lens[i];
    const frac = (target - d) / len;
    if (len === 0 || frac >= 1) {
      out.push(cmd);
      d += len;
      from = cmd.k === 'move' || cmd.k === 'end' ? cmd.p : cmd.ps[cmd.ps.length - 1];
      continue;
    }
    out.push(adjustLineLength(frac, from, cmd));
    break;
  }
  return out;
}

/** lineToPoints: `n` points spread evenly by length along the path (the end of each partial path). */
export function lineToPoints(n, cmds) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const last = partialLine(i / n, cmds).at(-1);
    if (last && last.k === 'bezier') out.push(last.ps[last.ps.length - 1]);
  }
  return out;
}

/** partialSvg: every path in the tree drawn up to `alpha` of its length (1 or more leaves it whole). */
export function partialSvg(alpha, t) {
  if (alpha >= 1) return t;
  return mapTree((n) => (n.kind === 'path' ? {...n, d: lineToPath(partialLine(alpha, toLineCommands(n.d)))} : n), t);
}

const unpack = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

/** pathify: rectangles, lines, circles, ellipses, polylines and polygons become paths (attributes kept). */
export function pathify(t) {
  return mapTree((n) => {
    const p = (d, extra = {}) => ({kind: 'path', attrs: {...n.attrs, ...extra}, d});
    switch (n.kind) {
      case 'rect': {
        if ([n.x, n.y, n.width, n.height].some((v) => unpack(v) === null)) return n;
        return p([{c: 'M', abs: true, args: [[n.x, n.y]]}, {c: 'H', abs: false, args: [n.width]}, {c: 'V', abs: false, args: [n.height]},
          {c: 'H', abs: false, args: [-n.width]}, {c: 'Z'}], {strokeLineCap: 'square'});
      }
      case 'line':
        return p([{c: 'M', abs: true, args: [[n.x1, n.y1]]}, {c: 'L', abs: true, args: [[n.x2, n.y2]]}]);
      case 'circle':
        return p([{c: 'M', abs: true, args: [[n.cx - n.r, n.cy]]},
          {c: 'A', abs: false, args: [[n.r, n.r, 0, true, false, [n.r * 2, 0]], [n.r, n.r, 0, true, false, [-n.r * 2, 0]]]}]);
      case 'polyline':
        return p(n.points.length ? [{c: 'M', abs: true, args: [n.points[0]]}, {c: 'L', abs: true, args: n.points.slice(1)}] : []);
      case 'polygon':
        return p([...(n.points.length ? [{c: 'M', abs: true, args: [n.points[0]]}, {c: 'L', abs: true, args: n.points.slice(1)}] : []), {c: 'Z'}]);
      case 'ellipse':
        return p([{c: 'M', abs: true, args: [[n.cx - n.rx, n.cy]]},
          {c: 'A', abs: false, args: [[n.rx, n.ry, 0, true, false, [n.rx * 2, 0]], [n.rx, n.ry, 0, true, false, [-n.rx * 2, 0]]]}]);
      default: return n;
    }
  }, t);
}

export const mapSvgPaths = (fn, t) => mapTree((n) => (n.kind === 'path' ? {...n, d: fn(n.d)} : n), t);
export const mapSvgLines = (fn, t) => mapSvgPaths((d) => lineToPath(fn(toLineCommands(d))), t);
export const mapSvgPoints = (fn, t) => mapSvgLines((cmds) => cmds.map((c) => (c.k === 'bezier' ? {k: 'bezier', ps: c.ps.map(fn)} : {k: c.k, p: fn(c.p)})), t);
export const svgPointsToRadians = (t) => mapSvgPoints(([x, y]) => [(x / 180) * Math.PI, (y / 180) * Math.PI], t);

const matrixToTransformation = (m) => ({t: 'matrix', m: m.slice()});

/** lowerTransformations: bake group transforms into path points (other shapes are pathified first). */
export function lowerTransformations(t) {
  const updPath = (m, d) => lineToPath(toLineCommands(d).map((c) => (c.k === 'bezier' ? {k: 'bezier', ps: c.ps.map((p) => transformPoint(m, p))} : {k: c.k, p: transformPoint(m, c.p)})));
  const worker = (hasPathified, m, n) => {
    const m2 = mulMatrix(m, mkMatrix(n.attrs?.transform));
    switch (n.kind) {
      case 'path': { const attrs = {...n.attrs}; delete attrs.transform; return {...n, attrs, d: updPath(m2, n.d)}; }
      case 'group': { const attrs = {...n.attrs}; delete attrs.transform; return {...n, attrs, children: n.children.map((c) => worker(hasPathified, m2, c))}; }
      case 'line': {
        const [x1, y1] = transformPoint(m, [n.x1, n.y1]), [x2, y2] = transformPoint(m, [n.x2, n.y2]);
        return {...n, x1, y1, x2, y2};
      }
      case 'clipPath': case 'defs': return n;
      default:
        if (hasPathified) return {...mkGroup([n]), attrs: {transform: [matrixToTransformation(m)]}};
        return worker(true, m, pathify(n));
    }
  };
  return worker(false, IDENTITY.slice(), t);
}

const drawAttrsEmpty = (attrs) => !attrs || Object.keys(attrs).length === 0;

/** simplify: drop None and empty groups and flatten groups without attributes. */
export function simplify(root) {
  const dropNulls = (n) => {
    if (isNone(n)) return [];
    if ((n.kind === 'defs' || n.kind === 'group') && n.children.length === 0) return [];
    return [n];
  };
  const worker = (n) => {
    if (isNone(n)) return [];
    if (n.kind === 'defs') return dropNulls({...n, children: n.children.flatMap(worker)});
    if (n.kind === 'group') {
      if (drawAttrsEmpty(n.attrs)) return n.children.flatMap(worker).flatMap(dropNulls);
      return dropNulls({...n, children: n.children.flatMap(worker)});
    }
    return dropNulls(n);
  };
  const out = worker(root);
  return out.length === 0 ? None : out.length === 1 ? out[0] : mkGroup(out);
}

/** removeGroups: the leaves of a tree, each carrying the draw attributes of its groups. */
export function removeGroups(root) {
  const dropNulls = (n) => (isNone(n) || ((n.kind === 'defs' || n.kind === 'group') && n.children.length === 0) ? [] : [n]);
  const worker = (attr, n) => {
    if (isNone(n)) return [];
    if (n.kind === 'defs') return dropNulls({...n, children: n.children.flatMap((c) => worker({}, c))});
    if (n.kind === 'group') {
      if (drawAttrsEmpty(n.attrs)) return n.children.flatMap((c) => worker(attr, c)).flatMap(dropNulls);
      return n.children.flatMap((c) => worker(mergeAttrs(attr, n.attrs), c));
    }
    return dropNulls(n.attrs ? {...n, attrs: {...attr}} : n);
  };
  return worker({}, root);
}

/** DrawAttributes' monoid: the right-hand side wins where it is set (Last semantics). */
export const mergeAttrs = (a, b) => ({...a, ...Object.fromEntries(Object.entries(b ?? {}).filter(([, v]) => v !== undefined))});

/** extractPath: all path commands of a tree with transforms baked in. */
export function extractPath(t) {
  const worker = (n) => (n.kind === 'group' ? n.children.flatMap(worker) : n.kind === 'path' ? n.d : []);
  return worker(simplify(lowerTransformations(pathify(t))));
}

const GLYPH_KINDS = new Set(['path', 'circle', 'polyline', 'polygon', 'ellipse', 'line', 'rect']);

/** withSubglyphs: apply `fn` to the shapes whose depth-first index is in `targets`. */
export function withSubglyphs(targets, fn, t) {
  let n = 0;
  const set = new Set(targets);
  const worker = (node) => {
    if (node.kind === 'group') return {...node, children: node.children.map(worker)};
    if (GLYPH_KINDS.has(node.kind)) { const i = n++; return set.has(i) ? fn(node) : node; }
    return node;
  };
  return worker(t);
}

/** splitGlyphs: [the other shapes, the shapes in `targets`], each still inside its groups. */
export function splitGlyphs(targets, t) {
  let n = 0;
  const set = new Set(targets);
  const l = [], r = [];
  const worker = (acc, node) => {
    if (node.kind === 'group') { node.children.forEach((c) => worker((sub) => acc({...node, children: [sub]}), c)); return; }
    if (GLYPH_KINDS.has(node.kind)) { const i = n++; (set.has(i) ? r : l).unshift(acc(node)); return; }
    if (node.kind === 'defs') return;
    l.unshift(acc(node));
  };
  worker((x) => x, t);
  return [mkGroup(l), mkGroup(r)];
}

/** svgGlyphs: every leaf as [a function that puts a node back in its groups, inherited attributes, the leaf]. */
export function svgGlyphs(t) {
  const worker = (acc, attr, node) => {
    if (isNone(node)) return [];
    if (node.kind === 'group') return node.children.flatMap((c) => worker((sub) => acc({...node, children: [sub]}), mergeAttrs(node.attrs, attr), c));
    return [[acc, mergeAttrs(node.attrs, attr), node]];
  };
  return worker((x) => x, {}, t);
}

// ---------------------------------------------------------------------------------------------
// Bounding boxes (Reanimate.Svg.BoundingBox): curves are sampled at 11 points, circles at 21.

function linePoints(cmds) {
  const out = [];
  let from = [0, 0];
  for (const c of cmds) {
    if (c.k === 'move') from = c.p;
    else if (c.k === 'end') { out.push(c.p); from = c.p; }
    else if (c.ps.length === 1) { out.push(c.ps[0]); from = c.ps[0]; }
    else {
      const curve = [from, ...c.ps];
      for (let i = 0; i <= 10; i++) out.push(evalBezier(curve, (1 / 10) * i));
      from = c.ps[c.ps.length - 1];
    }
  }
  return out;
}

const ellipsePoints = (x, y, xr, yr) => {
  const out = [];
  // Haskell's [0, pi/10 .. 2*pi] enumerates while the value is at most 2*pi + pi/20.
  for (let k = 0; ; k++) { const a = k * (Math.PI / 10); if (a > 2 * Math.PI + Math.PI / 20) break; out.push([x + xr * Math.cos(a), y + yr * Math.sin(a)]); }
  return out;
};
const rectPoints = ([x, y], w, h) => (w === null || w === undefined || h === null || h === undefined ? [[x, y]] : [[x, y], [x + w, y], [x + w, y + h], [x, y + h]]);

export function svgBoundingPoints(t) {
  if (!t) return [];
  const m = mkMatrix(t.attrs?.transform);
  let pts;
  switch (t.kind) {
    case 'group': pts = t.children.flatMap(svgBoundingPoints); break;
    case 'path': pts = linePoints(toLineCommands(t.d)); break;
    case 'circle': pts = ellipsePoints(t.cx, t.cy, t.r, t.r); break;
    case 'ellipse': pts = ellipsePoints(t.cx, t.cy, t.rx, t.ry); break;
    case 'polyline': pts = t.points; break;
    case 'line': pts = [[t.x1, t.y1], [t.x2, t.y2]]; break;
    case 'rect': pts = rectPoints([t.x, t.y], t.width, t.height); break;
    case 'image': pts = rectPoints([t.x, t.y], t.width, t.height); break;
    case 'svg': pts = rectPoints([0, 0], t.doc.width, t.doc.height); break;
    default: pts = [];
  }
  return pts.map((p) => transformPoint(m, p));
}

/** boundingBox: [x, y, width, height] of a tree; [0, 0, 0, 0] when it has no measurable shape. */
export function boundingBox(t) {
  const pts = svgBoundingPoints(t);
  if (!pts.length) return [0, 0, 0, 0];
  let [minx, miny] = pts[0], [maxx, maxy] = pts[0];
  for (const [x, y] of pts) { minx = Math.min(minx, x); miny = Math.min(miny, y); maxx = Math.max(maxx, x); maxy = Math.max(maxy, y); }
  return [minx, miny, maxx - minx, maxy - miny];
}
export const svgWidth = (t) => boundingBox(t)[2];
export const svgHeight = (t) => boundingBox(t)[3];
export {DEFAULT_DPI};
