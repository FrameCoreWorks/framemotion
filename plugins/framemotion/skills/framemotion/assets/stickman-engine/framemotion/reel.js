/*!
 * FrameMotion additions to the bundled Stickman Kino engine: the vertical cartoon reel look.
 * Original FrameCore Works code (Apache-2.0). It adds to window.SM and changes no engine file.
 * The look follows the stick-figure reel method of artemnovitckii/claude-animation-skills (MIT,
 * Copyright (c) 2026 Artem Novitckii) at 5dbea55c23aa6a5c93dc3cfb5583840513b56b94; no code from it.
 * Load after the engine files: sm-core, sm-rig, sm-type and sm-fx must be present.
 *
 *   theme "cartoon"                       bright saturated world, warm ink outlines
 *   sc.figure({ character: "bighead" })   big white head with a dotted face, thicker line
 *   sc.reelCaptions({ words: 2 })         1 to 2 lowercase words from the clip's voice, popped
 *   sc.drift(t0, t1, { push: 1.06 })      slow push-in with a seeded handheld drift
 */
(function (root) {
  "use strict";
  const SM = root.SM;
  if (!SM || !SM.Scene || !SM.characters) throw new Error("load the Stickman Kino engine before framemotion/reel.js");

  SM.themes.cartoon = {
    bg: "#8FD3F4", ink: "#221C22", paper: "#FFFFFF", muted: "#5A5560", soft: "#D9F0FB",
    accents: ["#FF5A4E", "#2E7DF6", "#FFC92E"], font: "Inter", display: "Inter", hand: "Caveat", decor: null, line: 1
  };
  // A head about 1.6 times the classic size reads as a character on a phone; the line grows with it.
  SM.characters.bighead = { headScale: 1.6, stroke: 0.042, face: "dots" };
  SM.characters.bigheadCap = { headScale: 1.6, stroke: 0.042, face: "dots", hat: "cap", hatColor: "#2E7DF6" };

  const S = SM.Scene.prototype;

  // Caption text for a reel: lowercase, no punctuation, digits and % kept, never a dash.
  SM.reelCaptionText = function (text) {
    return String(text).toLowerCase().replace(/[‒-―-]+/g, " ").replace(/[^\p{L}\p{N}%' ]+/gu, "")
      .replace(/\s+/g, " ").trim();
  };

  /** Short popped captions from the clip's voice, in the band below the ground line (about 82% down a vertical frame). */
  S.reelCaptions = function (o) {
    o = o || {};
    if (!this.vo || !this.vo.text) return [];
    this._captioned = true;
    const y = o.y || this.H * (this.H > this.W ? 0.82 : 0.9);
    return this.vo.chunks(o.words || 2).map((ch) => {
      const text = SM.reelCaptionText(ch.text);
      if (!text) return null;
      const tx = this.text(text, {
        x: this.cx, y, size: o.size || (this.H > this.W ? 96 : 72), font: "display", weight: 800,
        color: o.color || "#FFFFFF", outline: o.outline || "#221C22", width: this.W * 0.8
      });
      tx.in(ch.a, "pop", 0.14);
      tx.out(Math.max(ch.a + 0.25, ch.b), "fade", 0.08);
      return tx;
    }).filter(Boolean);
  };

  /**
   * Keep the camera alive between t0 and t1: a slow push towards (x, y) with a small handheld drift.
   * The drift is seeded from the scene id and t0, so every render of the scene moves the same way.
   */
  S.drift = function (t0, t1, o) {
    o = o || {};
    const cam = this.camera, s = cam.state;
    const x = o.x == null ? s.fx : o.x, y = o.y == null ? s.fy : o.y;
    const k0 = s.k, k1 = k0 * (o.push || 1.06), amp = (o.amp == null ? 10 : o.amp) * this.u;
    const step = o.step || 0.9, rnd = SM.rng(SM.hash(String(this.id)) + Math.round(t0 * 100));
    let t = t0;
    while (t < t1 - 1e-6) {
      const d = Math.min(step, t1 - t), u = (t + d - t0) / (t1 - t0);
      const last = t + d >= t1 - 1e-6;
      cam.focus(x + (last ? 0 : (rnd() - 0.5) * 2 * amp), y + (last ? 0 : (rnd() - 0.5) * 2 * amp), SM.lerp(k0, k1, u), t, d, "sine.inOut");
      t += d;
    }
    return t1;
  };
})(typeof window !== "undefined" ? window : globalThis);
