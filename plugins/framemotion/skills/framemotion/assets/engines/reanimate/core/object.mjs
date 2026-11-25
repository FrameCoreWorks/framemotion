// Objects of the Reanimate engine: SVG pictures with identity, position, opacity, scale and margins
// that change over a scene, and the animators that show and hide them (oDraw, oGrow, oScaleIn, ...).
// FrameCore Works' JavaScript port of Reanimate.Scene.Object (reanimate/reanimate, public domain).
//
// Haskell's lenses become property names: oGet(data, 'leftX'), oSet(data, 'leftX', v) and
// oOver(data, 'leftX', fn). The scene builder gains the object operations: s.oNew(value),
// s.oModify(o, fn), s.oSet(o, key, v), s.oTween(o, dur, (t, data) => data), s.oShowWith(o, oDraw), ...
// A value is an SVG tree, or a Circle, Rectangle or Camera (anything with toSVG()).

import {SceneBuilder, scene} from './scene.mjs';
import {
  animate, mkAnimation, reverseA, signalA, applyE, overEnding, fadeLineOutE, curveS, fromToS,
  getAnimationFrame, Sync, mapA,
} from './animation.mjs';
import {
  mkGroup, mkCircle, mkRect, None, translate, scale, withGroupOpacity, withFillOpacity, withStrokeWidth,
  DEFAULT_STROKE_WIDTH,
} from './svg.mjs';
import {boundingBox, partialSvg, pathify, svgGlyphs} from './paths.mjs';
import {linearLerp} from './geom.mjs';

// ---------------------------------------------------------------------------------------------
// Renderable values

export class Circle { constructor(radius) { this.radius = radius; } toSVG() { return mkCircle(this.radius); } }
export class Rectangle {
  constructor(width, height) { this.width = width; this.height = height; }
  toSVG() { return mkRect(this.width, this.height); }
}
export class Camera { toSVG() { return None; } }
export const toSVG = (value) => (value && typeof value.toSVG === 'function' ? value.toSVG() : value);

// ---------------------------------------------------------------------------------------------
// ObjectData and its lenses

const oScaleApply = (d) => (svg) =>
  translate(-d.scaleOrigin[0], -d.scaleOrigin[1], scale(d.scale, translate(d.scaleOrigin[0], d.scaleOrigin[1], svg)));
const computeBB = (d) => ({...d, bb: boundingBox(oScaleApply(d)(d.svg))});

function newObjectData(value) {
  const svg = toSVG(value);
  return {
    translate: [0, 0], value, svg, context: (x) => x, margin: [0.5, 0.5, 0.5, 0.5], bb: boundingBox(svg),
    opacity: 1, shown: false, zIndex: 1, easing: curveS(2), scale: 1, scaleOrigin: [0, 0],
  };
}

const DERIVED = {
  translateX: [(d) => d.translate[0], (d, v) => ({...d, translate: [v, d.translate[1]]})],
  translateY: [(d) => d.translate[1], (d, v) => ({...d, translate: [d.translate[0], v]})],
  value: [(d) => d.value, (d, v) => computeBB({...d, value: v, svg: toSVG(v)})],
  scale: [(d) => d.scale, (d, v) => computeBB({...d, scale: v})],
  scaleOrigin: [(d) => d.scaleOrigin, (d, v) => computeBB({...d, scaleOrigin: v})],
  svg: [(d) => d.svg, null],
  bb: [(d) => d.bb, null],
  bbMinX: [(d) => d.bb[0], null],
  bbMinY: [(d) => d.bb[1], null],
  bbWidth: [(d) => d.bb[2], null],
  bbHeight: [(d) => d.bb[3], null],
  marginTop: [(d) => d.margin[0], (d, v) => ({...d, margin: [v, d.margin[1], d.margin[2], d.margin[3]]})],
  marginRight: [(d) => d.margin[1], (d, v) => ({...d, margin: [d.margin[0], v, d.margin[2], d.margin[3]]})],
  marginBottom: [(d) => d.margin[2], (d, v) => ({...d, margin: [d.margin[0], d.margin[1], v, d.margin[3]]})],
  marginLeft: [(d) => d.margin[3], (d, v) => ({...d, margin: [d.margin[0], d.margin[1], d.margin[2], v]})],
  topY: [(d) => d.translate[1] + d.bb[1] + d.bb[3] + d.margin[0], null],
  bottomY: [(d) => d.translate[1] + d.bb[1] - d.margin[2], null],
  leftX: [(d) => d.translate[0] + d.bb[0] - d.margin[3], null],
  rightX: [(d) => d.translate[0] + d.bb[0] + d.bb[2] + d.margin[1], null],
  centerXY: [(d) => [d.translate[0] + d.bb[0] + d.bb[2] / 2, d.translate[1] + d.bb[1] + d.bb[3] / 2], null],
};
DERIVED.centerX = [(d) => DERIVED.centerXY[0](d)[0], (d, v) => oSet(d, 'centerXY', [v, DERIVED.centerXY[0](d)[1]])];
DERIVED.centerY = [(d) => DERIVED.centerXY[0](d)[1], (d, v) => oSet(d, 'centerXY', [DERIVED.centerXY[0](d)[0], v])];
// The edge lenses move the object: setting X shifts translate by (new - current).
const shiftY = (key) => (d, v) => ({...d, translate: [d.translate[0], d.translate[1] + (v - DERIVED[key][0](d))]});
const shiftX = (key) => (d, v) => ({...d, translate: [d.translate[0] + (v - DERIVED[key][0](d)), d.translate[1]]});
DERIVED.topY[1] = shiftY('topY');
DERIVED.bottomY[1] = shiftY('bottomY');
DERIVED.leftX[1] = shiftX('leftX');
DERIVED.rightX[1] = shiftX('rightX');
DERIVED.centerXY[1] = (d, [x1, y1]) => {
  const [x, y] = DERIVED.centerXY[0](d);
  return {...d, translate: [d.translate[0] + (x1 - x), d.translate[1] + (y1 - y)]};
};

/** oGet: an object property, stored or derived. */
export function oGet(d, key) {
  if (key in DERIVED) return DERIVED[key][0](d);
  if (!(key in d)) throw new RangeError(`unknown object property "${key}"`);
  return d[key];
}
/** oSet: a copy of the object data with `key` set (value, scale and scaleOrigin recompute the box). */
export function oSet(d, key, v) {
  if (key in DERIVED) {
    const setter = DERIVED[key][1];
    if (!setter) throw new RangeError(`object property "${key}" is read-only`);
    return setter(d, v);
  }
  if (!(key in d)) throw new RangeError(`unknown object property "${key}"`);
  return {...d, [key]: v};
}
/** oOver: set `key` to fn(current value). */
export const oOver = (d, key, fn) => oSet(d, key, fn(oGet(d, key)));

// ---------------------------------------------------------------------------------------------
// Animators: SVG -> Animation

export const oFadeIn = (svg) => animate((t) => withGroupOpacity(t, svg));
export const oFadeOut = (svg) => reverseA(oFadeIn(svg));
export const oGrow = (svg) => animate((t) => scale(t, svg));
export const oShrink = (svg) => reverseA(oGrow(svg));

const svgOrigin = (svg, [ox, oy]) => { const [x, y, w, h] = boundingBox(svg); return [x + w * ox, y + h * oy]; };

function staggerGlyphs(glyphs, delay, fn) {
  // Reanimate fails here with a zero-length animation; say why instead.
  if (glyphs.length === 0) throw new Error('nothing to animate: the picture has no glyphs (empty text or an empty group)');
  return scene((s) => {
    for (const [ctx, , node] of glyphs) {
      s.fork((f) => f.newSpriteA_(Sync.Freeze, fn(ctx(node))));
      s.wait(delay);
    }
  });
}
/** oStagger_: animate each glyph in parallel, each started `delay` seconds after the one before. */
export const oStagger_ = (delay, fn) => (svg) => staggerGlyphs(svgGlyphs(svg), delay, fn);
/** oStaggerRev_: the same in reverse glyph order. */
export const oStaggerRev_ = (delay, fn) => (svg) => staggerGlyphs(svgGlyphs(svg).reverse(), delay, fn);
export const oSim = (fn) => oStagger_(0, fn);
export const oStagger = (fn) => oStagger_(0.2, fn);
export const oStaggerRev = (fn) => oStaggerRev_(0.2, fn);

/** oScaleIn_: each glyph grows from `origin` (fractions of its box) by `easing`, 0.05 s apart. */
export const oScaleIn_ = (easing, origin) => oStagger_(0.05, (svg) => {
  const [cx, cy] = svgOrigin(svg, origin);
  return signalA(easing, mkAnimation(0.3, (t) => translate(cx, cy, scale(t, translate(-cx, -cy, svg)))));
});
export const oScaleIn = oScaleIn_(curveS(2), [0.5, 1]);
export const oScaleOut = (svg) => reverseA(oStaggerRev_(0.05, oScaleIn_(curveS(2), [0.5, 0]))(svg));
export const oScaleOut_ = (easing, origin) => (svg) => reverseA(oStaggerRev_(0.05, oScaleIn_(easing, origin))(svg));

/** oDraw: draw each glyph's outline, then fade its fill in over 0.3 s; glyphs start 0.2 s apart. */
export const oDraw = oStagger((svg) => scene((s) => {
  const fillDur = 0.3;
  for (const [ctx, attr, node] of svgGlyphs(pathify(svg))) {
    const sw = typeof attr.strokeWidth === 'number' ? Math.max(DEFAULT_STROKE_WIDTH, attr.strokeWidth) : DEFAULT_STROKE_WIDTH;
    s.play(mapA(ctx, applyE(overEnding(fillDur, fadeLineOutE(sw)),
      animate((t) => withStrokeWidth(sw, mkGroup([withFillOpacity(0, partialSvg(t, node))]))))));
    s.wait(-fillDur);
    s.newSpriteA_(Sync.Freeze, mkAnimation(fillDur, (t) => withGroupOpacity(t, mkGroup([ctx(node)]))));
  }
}));

// ---------------------------------------------------------------------------------------------
// Objects in scenes

export class SceneObject {
  constructor(sprite, data) { this.sprite = sprite; this.data = data; }
}

Object.assign(SceneBuilder.prototype, {
  /** newObjectPart: an object that is not drawn by the scene itself (draw it with renderObject). */
  newObjectPart(value) {
    const ref = this.newVar(newObjectData(value));
    const sprite = this.newSpritePart((f) => {
      const d = f.get(ref);
      if (!d.shown) return None;
      return translate(d.translate[0], d.translate[1], oScaleApply(d)(withGroupOpacity(d.opacity, mkGroup([d.context(d.svg)]))));
    });
    this.spriteModify(sprite, (f) => ([img]) => [img, f.get(ref).zIndex]);
    return new SceneObject(sprite, ref);
  },
  /** oNew / newObject: an object drawn by the scene (hidden until shown). */
  newObject(value) { const o = this.newObjectPart(value); this.addPartToScene(o.sprite); return o; },
  oNew(value) { return this.newObject(value); },
  oModify(o, fn) { this.modifyVar(o.data, fn); },
  oSet(o, key, v) { this.oModify(o, (d) => oSet(d, key, v)); },
  oRead(o, key) { const d = this.readVar(o.data); return key === undefined ? d : oGet(d, key); },
  /** oTween: change the object over `dur` seconds by fn(eased t, data), with the object's easing now. */
  oTween(o, dur, fn) {
    const ease = this.oRead(o, 'easing');
    this.tweenVar(o.data, dur, (v, t) => fn(ease(t), v));
  },
  /** oTweenV: change the object's value over `dur` seconds by fn(eased t, value). */
  oTweenV(o, dur, fn) { this.oTween(o, dur, (t, d) => oOver(d, 'value', (v) => fn(t, v))); },
  signalO(o, dur, signal) { this.signalS(o.sprite, dur, signal); },
  oShow(o) { this.oSet(o, 'shown', true); },
  oHide(o) { this.oSet(o, 'shown', false); },
  /** oShowWith: show the object, playing animator(svg) on it first. */
  oShowWith(o, animator) {
    this.oSet(o, 'shown', true);
    const init = this.oRead(o, 'svg');
    const ani = animator(init);
    this.oTween(o, ani.duration, (t, d) => ({...d, svg: getAnimationFrame(Sync.Stretch, ani, t, 1)}));
    this.oModify(o, (d) => ({...d, svg: init}));
  },
  /** oHideWith: play animator(svg) on the object, then hide it. */
  oHideWith(o, animator) {
    const init = this.oRead(o, 'svg');
    const ani = animator(init);
    this.oTween(o, ani.duration, (t, d) => ({...d, svg: getAnimationFrame(Sync.Stretch, ani, t, 1)}));
    this.oModify(o, (d) => ({...d, svg: init}));
    this.oSet(o, 'shown', false);
  },
  /** cameraAttach: the camera's position, zoom and zoom origin apply to `obj`. */
  cameraAttach(cam, obj) {
    this.spriteModify(obj.sprite, (f) => ([svg, z]) => {
      const c = f.get(cam.data);
      const [x, y] = c.translate, [ox, oy] = c.scaleOrigin;
      return [translate(-x, -y, translate(ox, oy, scale(c.scale, translate(-ox, -oy, svg)))), z];
    });
  },
  cameraFocus(cam, [nx, ny]) {
    const [ox, oy] = this.oRead(cam, 'scaleOrigin');
    const [tx, ty] = this.oRead(cam, 'translate');
    const k = this.oRead(cam, 'scale');
    const loc = [nx - ((nx - ox) * k + ox - tx), ny - ((ny - oy) * k + oy - ty)];
    this.oModify(cam, (d) => oSet(oSet(d, 'translate', loc), 'scaleOrigin', [nx, ny]));
  },
  cameraSetZoom(cam, k) { this.oSet(cam, 'scale', k); },
  cameraZoom(cam, dur, k) { this.oTween(cam, dur, (t, d) => oOver(d, 'scale', (v) => fromToS(v, k)(t))); },
  cameraSetPan(cam, loc) { this.oSet(cam, 'translate', loc); },
  cameraPan(cam, dur, pos) { this.oTween(cam, dur, (t, d) => oOver(d, 'translate', (v) => linearLerp(t, pos, v))); },
});

/** renderObject: an object's picture inside another sprite's render function (f is that sprite's frame). */
export const renderObject = (o) => o.sprite.frame();
