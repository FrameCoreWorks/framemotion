// A textured sphere drawn without a ray tracer, for the Reanimate engine (FrameCore Works' own code).
// Reanimate's showcase film renders a sphere with POV-Ray: an orthographic camera at z = -10, a sphere
// of radius 2 at the origin with a uv-mapped image, rotated <0, s, 0> and then <-30, 0, 0>, a
// transparent background and ambient light only. Orthographic rays and a single sphere need no ray
// tracer: each pixel inside the disc hits the sphere at a front point and a back point, which are
// turned back into the sphere's own frame and looked up in the texture. With ambient light only every
// point has its texture's colour; a partly transparent texture shows the back half through the front,
// as POV-Ray's image_map with an alpha channel does. Antialiasing is supersampling; POV-Ray's gamma is not modelled.
import {newImage} from './geoprojection.mjs';

const rad = (d) => d / 180 * Math.PI;

/**
 * renderSphere({texture, rotY, rotX, radius, pxPerUnit}): an RGBA image {width, height, data} of the
 * sphere, 2 * radius units wide, pxPerUnit pixels per unit, transparent outside the disc; each pixel
 * averages samples x samples points (POV-Ray's +A antialiasing, approximated).
 * texture(u, v) gives [r, g, b, a] (0..255) for POV-Ray's spherical uv (Sphere::UVCoord): u = 0..1 once
 * round the y axis, from +x towards +z, v = 0 at the south pole to 1 at the north pole. rotY and rotX are POV-Ray's rotate angles in
 * degrees (left-handed: rotating +y towards +z is positive about x), applied y first.
 */
export function renderSphere({texture, rotY = 0, rotX = 0, radius = 2, pxPerUnit = 100, samples = 2}) {
  const size = Math.round(2 * radius * pxPerUnit), img = newImage(size, size);
  const cy = Math.cos(rad(rotY)), sy = Math.sin(rad(rotY)), cx = Math.cos(rad(rotX)), sx = Math.sin(rad(rotX));
  // world = Rx(rotX) * Ry(rotY) * object, so object = Ry(-rotY) * Rx(-rotX) * world.
  const lookup = (x, y, z) => {
    const y1 = y * cx + z * sx, z1 = -y * sx + z * cx;       // Rx(-rotX)
    const x2 = x * cy - z1 * sy, z2 = x * sy + z1 * cy;      // Ry(-rotY)
    const u = ((Math.atan2(z2, x2) / (2 * Math.PI)) % 1 + 1) % 1;   // POV-Ray's Sphere::UVCoord
    const v = 0.5 + Math.asin(Math.max(-1, Math.min(1, y1 / radius))) / Math.PI;
    return texture(u, v);
  };
  const n = Math.max(1, Math.round(samples)), sub = 1 / (n * pxPerUnit);
  for (let j = 0; j < size; j++) {
    for (let i = 0; i < size; i++) {
      let r = 0, g = 0, b = 0, alpha = 0;   // premultiplied sums over the n x n samples of the pixel
      for (let sj = 0; sj < n; sj++) {
        const y = radius - j / pxPerUnit - (sj + 0.5) * sub;
        for (let si = 0; si < n; si++) {
          const x = i / pxPerUnit + (si + 0.5) * sub - radius, rr = radius * radius - x * x - y * y;
          if (rr < 0) continue;
          const z = Math.sqrt(rr);
          const [fr, fg, fb, fa] = lookup(x, y, -z), [br, bg, bb, ba] = lookup(x, y, z);
          const a = fa / 255, w = (ba / 255) * (1 - a);   // the front over the back
          r += fr * a + br * w; g += fg * a + bg * w; b += fb * a + bb * w; alpha += a + w;
        }
      }
      if (alpha <= 0) continue;
      const k = (i + j * size) * 4;
      img.data[k] = r / alpha;
      img.data[k + 1] = g / alpha;
      img.data[k + 2] = b / alpha;
      img.data[k + 3] = (alpha / (n * n)) * 255;
    }
  }
  return img;
}

/**
 * sphereLines({lines, rotY, rotX, radius, segments}): curves drawn on the texture, given in uv as
 * arrays of [u, v], placed on the turned sphere and cut to their visible (front) parts; returns arrays
 * of screen points [x, y] in units, the sphere centred at the origin.
 */
export function sphereLines({lines, rotY = 0, rotX = 0, radius = 2}) {
  const cy = Math.cos(rad(rotY)), sy = Math.sin(rad(rotY)), cx = Math.cos(rad(rotX)), sx = Math.sin(rad(rotX));
  const place = ([u, v]) => {
    const theta = u * 2 * Math.PI, lat = (v - 0.5) * Math.PI;
    const x0 = radius * Math.cos(lat) * Math.cos(theta), y0 = radius * Math.sin(lat), z0 = radius * Math.cos(lat) * Math.sin(theta);
    const x1 = x0 * cy + z0 * sy, z1 = -x0 * sy + z0 * cy;   // Ry(rotY)
    const y2 = y0 * cx - z1 * sx, z2 = y0 * sx + z1 * cx;    // Rx(rotX)
    return [x1, y2, z2];
  };
  const out = [];
  for (const line of lines) {
    let run = [];
    for (const p of line.map(place)) {
      if (p[2] <= 0) run.push([p[0], p[1]]);
      else { if (run.length > 1) out.push(run); run = []; }
    }
    if (run.length > 1) out.push(run);
  }
  return out;
}
