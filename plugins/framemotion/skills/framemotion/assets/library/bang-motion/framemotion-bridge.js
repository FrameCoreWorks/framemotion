// FrameMotion bridge for bang-motion pages (FrameCore Works, Apache-2.0).
// Paste inline at the end of a page built from a bang-motion starter (Bang Tutorial, MIT),
// after the starter's own script. It exposes the page's GSAP timeline to FrameMotion's
// capture-html.mjs, which seeks window.renderFrame(t) frame by frame at any fps
// (including 30000/1001) instead of bang-motion's 60 fps puppeteer export.
(function () {
  function opener() { return window.OPENER; }
  window.ready = new Promise(function (resolve) {
    (function wait() {
      var o = opener();
      var clipsOk = !o || !o.clipsReady || o.clipsReady();
      if (o && o.ready && clipsOk) resolve();
      else requestAnimationFrame(wait);
    })();
  });
  window.renderFrame = function (t) {
    var o = opener();
    if (!o) throw new Error('window.OPENER missing: build the page from a bang-motion starter');
    o.tl.pause();
    var done = o.seekFrame ? o.seekFrame(t) : (o.seek ? o.seek(t) : o.tl.time(t, false));
    return Promise.resolve(done).then(function () {
      return new Promise(function (r) { requestAnimationFrame(function () { requestAnimationFrame(r); }); });
    });
  };
})();
