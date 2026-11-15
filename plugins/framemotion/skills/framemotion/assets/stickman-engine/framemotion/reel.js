/*!
 * FrameMotion additions to the bundled Stickman Kino engine: word timing from a real voice take and
 * the vertical cartoon reel look. Original FrameCore Works code (Apache-2.0); it adds to window.SM and
 * changes no engine file. The reel look follows the stick-figure reel method of
 * artemnovitckii/claude-animation-skills (MIT, Copyright (c) 2026 Artem Novitckii) at
 * 5dbea55c23aa6a5c93dc3cfb5583840513b56b94; no code from it is used.
 * Load after the engine files (sm-core, sm-rig, sm-type, sm-fx, sm-world).
 *
 *   window.SM_WORDS                        measured word times per clip (the builder sets it from words.json);
 *                                          sc.cue(), sc.captions() and sc.reelCaptions() then follow the take
 *   theme "cartoon"                        bright saturated world, warm ink outlines
 *   sc.figure({ character: "bighead" })    big white head with a dotted face, thicker line
 *   sc.reelGround(o)                       ground line raised to 60% so figures stay above the caption band
 *   sc.reelCaptions({ words: 2 })          1 to 2 lowercase words at a time, one on screen at a time
 *   sc.drift(t0, t1, { push, hold })       slow push-in with a seeded handheld drift, optional hold
 *   sc.hit(x, y, t)                        an impact: burst, short shake and a white flash
 *   sc.shadow(thing | figure, o)           a soft contact shadow on the ground that follows a figure
 *   sc.reelLook({ vignette, grain })       vignette and seeded film grain over the frame
 */
(function (root) {
  "use strict";
  const SM = root.SM;
  if (!SM || !SM.Scene || !SM.characters || !SM.VoCues) throw new Error("load the Stickman Kino engine before framemotion/reel.js");

  // ------------------------------------------------------------ word timing from a voice take
  const norm = (w) => String(w).toLowerCase().replace(/[^\p{L}\p{N}']/gu, "");

  /**
   * Replace a clip's estimated word times with measured ones. `measured` is a list of
   * { word, start, end } in seconds from the start of the clip's voice take (Whisper's word timestamps).
   * Words are matched in order, skipping at most three unmatched words on either side; a text word
   * with no match takes the time between its neighbours. Returns how many words matched.
   */
  SM.applyWordTimes = function (vo, measured) {
    const words = vo.words, m = (measured || []).map((w) => ({ w: norm(w.word), a: +w.start, b: +w.end })).filter((w) => w.w && w.b >= w.a);
    if (!words.length || !m.length) return 0;
    let j = 0, hits = 0;
    const times = words.map((tw) => {
      for (let k = j; k < Math.min(m.length, j + 4); k++) {
        if (m[k].w === tw.word || m[k].w.startsWith(tw.word) || tw.word.startsWith(m[k].w)) { j = k + 1; hits++; return { a: m[k].a, b: m[k].b }; }
      }
      return null;
    });
    // fill gaps from the neighbours, so every word keeps an order-preserving time
    for (let i = 0; i < times.length; i++) {
      if (times[i]) continue;
      let p = i - 1; while (p >= 0 && !times[p]) p--;
      let n = i + 1; while (n < times.length && !times[n]) n++;
      const a = p >= 0 ? times[p].b : 0, b = n < times.length ? times[n].a : Math.max(a, m[m.length - 1].b);
      const span = n - p - 1, k = i - p;
      times[i] = { a: a + (b - a) * (k - 1) / span, b: a + (b - a) * k / span };
    }
    // VoCues maps a word to start + dur * (a / total): with total = dur the units are seconds of the take.
    const dur = Math.max(vo.dur, times[times.length - 1].b, 0.001);
    words.forEach((w, i) => { w.a = times[i].a; w.b = times[i].b; });
    vo.dur = dur; vo.total = dur; vo.end = vo.start + dur; vo.measured = true;
    return hits;
  };

  const decorate = SM.decorate;
  SM.decorate = function (sc) {
    const take = root.SM_WORDS && root.SM_WORDS[sc.id];
    if (take) sc.wordMatches = SM.applyWordTimes(sc.vo, take);
    if (decorate) decorate(sc);
  };

  // ------------------------------------------------------------ the cartoon reel look
  SM.themes.cartoon = {
    bg: "#8FD3F4", ink: "#221C22", paper: "#FFFFFF", muted: "#5A5560", soft: "#D9F0FB",
    accents: ["#FF5A4E", "#2E7DF6", "#FFC92E"], font: "Inter", display: "Inter", hand: "Caveat", decor: null, line: 1
  };
  // A head about twice the classic size reads as a character on a phone. headScale makes the figure
  // taller than `size` (the head grows upwards); the line grows with it.
  SM.characters.bighead = { headScale: 1.9, stroke: 0.045, face: "dots" };
  SM.characters.bigheadCap = { headScale: 1.9, stroke: 0.045, face: "dots", hat: "cap", hatColor: "#2E7DF6" };

  const S = SM.Scene.prototype;
  const vertical = (sc) => sc.H > sc.W;

  /** Ground for the reel: higher than the engine's default, so figures stand clear of the caption band. */
  S.reelGround = function (o) {
    o = Object.assign({ style: "grass" }, o || {});
    if (o.y == null) o.y = Math.round(this.H * (vertical(this) ? 0.6 : 0.72));
    return this.ground(o);
  };

  // Caption text for a reel: lowercase, no punctuation, digits and % kept, never a dash.
  SM.reelCaptionText = function (text) {
    return String(text).toLowerCase().replace(/[‒-―-]+/g, " ").replace(/[^\p{L}\p{N}%' ]+/gu, "")
      .replace(/\s+/g, " ").trim();
  };

  /**
   * Short popped captions from the clip's voice, about 70% down a vertical frame (inside a safe area
   * that keeps the bottom 20% free). Exactly one caption is on screen at a time: each one is gone before
   * the next pops in.
   */
  S.reelCaptions = function (o) {
    o = o || {};
    if (!this.vo || !this.vo.text) return [];
    this._captioned = true;
    const y = o.y || this.H * (vertical(this) ? 0.7 : 0.86);
    const size = o.size || (vertical(this) ? 96 : 72);
    const chunks = this.vo.chunks(o.words || 2).map((ch) => Object.assign({}, ch, { text: SM.reelCaptionText(ch.text) })).filter((ch) => ch.text);
    return chunks.map((ch, i) => {
      const next = chunks[i + 1];
      const tx = this.text(ch.text, {
        x: this.cx, y, size, font: "display", weight: 900,
        color: o.color || "#FFFFFF", outline: o.outline || "#221C22", width: this.W * 0.8
      });
      // a thicker outline and a hard drop shadow keep white type readable on a pale sky
      tx.el.style.webkitTextStroke = `${Math.max(3, size * this.u * 0.075)}px ${this._col(o.outline || "#221C22")}`;
      tx.el.style.textShadow = `0 ${Math.round(size * this.u * 0.06)}px 0 ${this._col(o.outline || "#221C22")}`;
      tx.in(ch.a, "pop", 0.12);
      const end = next ? Math.max(ch.a + 0.12, next.a - 0.02) : Math.max(ch.a + 0.4, ch.b + 0.2);
      tx.out(end - 0.06, "fade", 0.06);
      return tx;
    });
  };

  /**
   * Keep the camera alive between t0 and t1: a slow push towards (x, y) with a small handheld drift,
   * in equal steps of about o.step seconds. With o.hold the push reaches its end that many seconds
   * before t1 and holds still. The drift is seeded from the scene id and t0, so every render matches.
   */
  S.drift = function (t0, t1, o) {
    o = o || {};
    const cam = this.camera, s = cam.state;
    const x = o.x == null ? s.fx : o.x, y = o.y == null ? s.fy : o.y;
    const hold = Math.max(0, Math.min(o.hold || 0, (t1 - t0) * 0.5)), end = t1 - hold;
    const k0 = s.k, k1 = k0 * (o.push || 1.06), amp = (o.amp == null ? 10 : o.amp) * this.u;
    const n = Math.max(1, Math.round((end - t0) / (o.step || 0.9))), d = (end - t0) / n;
    const rnd = SM.rng(SM.hash(String(this.id)) + Math.round(t0 * 100));
    for (let i = 0; i < n; i++) {
      const last = i === n - 1;
      cam.focus(x + (last ? 0 : (rnd() - 0.5) * 2 * amp), y + (last ? 0 : (rnd() - 0.5) * 2 * amp), SM.lerp(k0, k1, (i + 1) / n), t0 + i * d, d, "sine.inOut");
    }
    return t1;
  };

  /** An impact as the reel method has it: a burst, a short shake and a white flash on the same frame. */
  S.hit = function (x, y, t, o) {
    o = o || {};
    this.fx.burst(x, y, t, o);
    this.camera.shake(t, o.shake || 0.3, o.amp || 12);
    this.fx.flash(t, { opacity: o.flash == null ? 0.55 : o.flash, d: 0.22 });
    return t + 0.35;
  };

  /**
   * A soft contact shadow on the ground under a figure (following its walk) or a prop.
   * For a prop pass { x }; it stays where it is put.
   */
  S.shadow = function (target, o) {
    o = o || {};
    const isFig = target && typeof target.xAt === "function";
    const w = (o.w || (isFig ? target.H * 0.42 : 140 * this.u)), h = w * 0.16;
    const x0 = isFig ? target.xAt(0) : (o.x == null ? this.cx : o.x);
    const e = SM.el("ellipse", { cx: 0, cy: 0, rx: w / 2, ry: h / 2, fill: this.theme.ink, opacity: o.opacity || 0.18 }, this.world);
    const gy = o.y == null ? this.groundY + h * 0.2 : o.y;
    gsap.set(e, { x: x0, y: gy });
    if (isFig) {
      const step = 0.1, kf = []; let last = 0;
      for (let t = step; t <= this.dur + 1e-6; t += step) { kf.push({ x: target.xAt(t), duration: t - last, ease: "none" }); last = t; }
      if (kf.length) this.tl.to(e, { keyframes: kf }, this.T(0));
    }
    return this.thing(e, { x: x0, y: gy });
  };

  /** Vignette and seeded grain over the whole frame (screen space, above the camera). */
  S.reelLook = function (o) {
    o = Object.assign({ vignette: 0.35, grain: 0.06 }, o || {});
    if (o.vignette) {
      SM.div("fm-vignette", this.stage, { position: "absolute", inset: "0", pointerEvents: "none",
        background: `radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(20,10,20,${o.vignette}) 100%)` });
    }
    if (o.grain) {
      const svg = SM.el("svg", { class: "sm-layer", width: this.W, height: this.H, viewBox: `0 0 ${this.W} ${this.H}` }, this.stage);
      svg.style.opacity = o.grain; svg.style.mixBlendMode = "overlay"; svg.style.pointerEvents = "none";
      const id = "fm-grain-" + this.id, f = SM.el("filter", { id }, SM.el("defs", {}, svg));
      // a new grain pattern every two frames at 30 fps, seeded by the scene and the step; the page starts
      // on the first pattern, so frame 0 is the same whether it is drawn first or after a later frame
      const base = SM.hash(String(this.id)) % 1000;
      const turb = SM.el("feTurbulence", { type: "fractalNoise", baseFrequency: "0.9", numOctaves: "2", seed: String(base) }, f);
      SM.el("rect", { width: this.W, height: this.H, filter: `url(#${id})` }, svg);
      for (let t = 2 / 30, i = 1; t < this.dur; t += 2 / 30, i++) this.tl.set(turb, { attr: { seed: base + i } }, this.T(t));
    }
    return this;
  };
})(typeof window !== "undefined" ? window : globalThis);
