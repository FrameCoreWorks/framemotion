// Closed outlines of SVG shapes for the Reanimate engine: FrameCore Works' JavaScript port of the
// parts of Reanimate.PolyShape and Reanimate.Morph.Common (toShapes) that balloon uses, from
// reanimate/reanimate (public domain), on cubicbezier's curve functions (core/cubicbezier.mjs).
// A shape is a list of cubic curves; holes are joined to their outline with a cut, as in Reanimate.
import {toLineCommands, extractPath, svgGlyphs, lowerTransformations, pathify} from './paths.mjs';
import {SCREEN_WIDTH} from './svg.mjs';
import {bezierIntersection, closest, colinear, evalBezier, interpolateVector, quadToCubic, splitBezier, vectorDistance} from './cubicbezier.mjs';
import {mkPolygon, pIsCCW} from './polygon.mjs';
import {fromDouble} from './rational.mjs';

const polyShapeTolerance = SCREEN_WIDTH / 25600;
const ptEq = (a, b) => a[0] === b[0] && a[1] === b[1];
const curveEq = (a, b) => a.every((p, i) => ptEq(p, b[i]));
const shapeEq = (a, b) => a.length === b.length && a.every((c, i) => curveEq(c, b[i]));

// A ClosedPath is [[point, join]] with join null (JoinLine) or [c1, c2] (JoinCurve).
/** closedPathCurves: the cubic curves of a closed path; a straight join gets control points at 1/3 and 2/3. */
function closedPathCurves(path) {
  if (!path.length) return [];
  return path.map(([p0, join], i) => {
    const p1 = i + 1 < path.length ? path[i + 1][0] : path[0][0];
    return join ? [p0, join[0], join[1], p1] : [p0, interpolateVector(p0, p1, 1 / 3), interpolateVector(p0, p1, 2 / 3), p1];
  });
}
/** curvesToClosed: every curve becomes a curved join from its start. */
const curvesToClosed = (curves) => curves.map(([p0, p1, p2]) => [p0, [p1, p2]]);

/** cmdsToPolyShapes: line commands split into closed outlines (each a list of cubic curves). */
function cmdsToPolyShapes(cmds) {
  if (!cmds.length) return [];
  const bad = () => { throw new Error(`Reanimate.PolyShape: Invalid commands: ${JSON.stringify(cmds)}`); };
  if (cmds[0].k !== 'move') bad();
  const out = [];
  let from = cmds[0].p, acc = [];
  const finalize = () => { if (acc.length) out.push(acc); acc = []; };
  let i = 1;
  while (i < cmds.length) {
    const cmd = cmds[i];
    if (cmd.k === 'move') { finalize(); from = cmd.p; i++; continue; }
    if (cmd.k === 'end') {
      const nxt = cmds[i + 1];
      if (nxt && nxt.k !== 'move') bad();
      if (!ptEq(from, cmd.p)) acc.push([from, null]);
      finalize();
      if (!nxt) { i++; continue; }
      from = nxt.p;
      i += 2;
      continue;
    }
    if (cmd.ps.length === 1) { acc.push([from, null]); from = cmd.ps[0]; i++; continue; }
    const ps = cmd.ps.length === 2 ? quadToCubic([from, ...cmd.ps]).slice(1) : cmd.ps;
    if (ps.length !== 3) bad();
    acc.push([from, [ps[0], ps[1]]]);
    from = ps[2];
    i++;
  }
  finalize();
  return out.map(closedPathCurves);
}
const svgToPolyShapes = (glyph) => cmdsToPolyShapes(toLineCommands(extractPath(glyph)));

const polyShapeOrigin = (curves) => (curves.length ? curves[0][0] : [0, 0]);
const nub = (pts) => pts.filter((p, i) => pts.findIndex((q) => ptEq(p, q)) === i);
/** isInsideOf: rays from lhs's first point up-right and down-left both cross rhs an odd number of times. */
function isInsideOf(lhs, rhs) {
  const origin = polyShapeOrigin(lhs), limit = 1000;
  const rayUp = [origin, origin, origin, [limit, limit]], rayDown = [origin, origin, origin, [-limit, -limit]];
  const hits = (ray) => nub(rhs.flatMap((bs) => bezierIntersection(bs, ray, polyShapeTolerance).map(([t]) => evalBezier(bs, t))));
  return hits(rayUp).length % 2 === 1 && hits(rayDown).length % 2 === 1;
}

/** plGroupShapes: outlines with the holes directly inside them. */
function plGroupShapes(shapes) {
  const parents = (self, list) => list.filter((s) => !shapeEq(s, self)).filter((s) => isInsideOf(self, s));
  const out = [];
  let list = shapes.slice(), guard = 0;
  while (list.length) {
    const [s, ...rest] = list;
    if (parents(s, rest).length === 0) {
      const holes = [], nonHoles = [];
      for (const x of rest) {
        const ps = parents(x, list);
        (ps.length === 1 && shapeEq(ps[0], s) ? holes : nonHoles).push(x);
      }
      out.push({parent: s, holes});
      list = nonHoles;
      guard = 0;
    } else {
      list = [...rest, s];
      if (++guard > list.length * list.length + 1) throw new Error('plGroupShapes: outlines nest in a cycle');
    }
  }
  return out;
}

/** cutSingleHole: join a hole to the outline with a straight cut from the outline's nearest point. */
function cutSingleHole(parent, child) {
  const [pHead, ...pTail] = parent;
  const childOrigin = polyShapeOrigin(child);
  const pParam = closest(pHead, childOrigin, polyShapeTolerance);
  const [a2p, p2b] = splitBezier(pHead, pParam);
  const p = evalBezier(pHead, pParam);
  const p2x = [p, p, p, childOrigin], x2p = [childOrigin, childOrigin, childOrigin, p];
  const curves = [p2b, ...pTail, a2p, p2x, ...child, x2p];
  return [vectorDistance(childOrigin, p), closedPathCurves(curvesToClosed(curves))];
}
function mergePolyShapeHole(parent, child) {
  const n = parent.length;
  const options = Array.from({length: n}, (_, i) => cutSingleHole(closedPathCurves(curvesToClosed([...parent.slice(i), ...parent.slice(0, i)])), child));
  let best = options[0];
  for (const o of options) if (o[0] < best[0]) best = o;   // sortOn fst, then head: the first of the lowest
  return best[1];
}
const mergePolyShapeHoles = ({parent, holes}) => holes.reduce(mergePolyShapeHole, parent);

/** plPolygonify: the outline as points, halving each curve until it is flat within tol. */
function plPolygonify(tol, curves) {
  const out = [curves[0][0]];
  const worker = (c) => {
    if (ptEq(c[3], c[0])) return;
    if (colinear(c, tol)) { out.push(c[3]); return; }
    const [lhs, rhs] = splitBezier(c, 0.5);
    worker(lhs);
    worker(rhs);
  };
  curves.forEach(worker);
  return out;
}
/** plToPolygon: the outline as an exact counter-clockwise polygon (the repeated last point dropped). */
function plToPolygon(tol, curves) {
  const pts = plPolygonify(tol, curves).slice(0, -1).map(([x, y]) => [fromDouble(x), fromDouble(y)]);
  const p = mkPolygon(pts);
  return pIsCCW(p) ? p : mkPolygon(pts.slice().reverse());
}

/** toShapes: each glyph's outlines as [inherited attributes, polygon]. */
export function toShapes(tol, src) {
  return svgGlyphs(lowerTransformations(pathify(src))).flatMap(([, attrs, glyph]) =>
    plGroupShapes(svgToPolyShapes(glyph)).map(mergePolyShapeHoles).map((shape) => [attrs, plToPolygon(tol, shape)]));
}
