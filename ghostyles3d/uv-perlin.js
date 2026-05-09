/**
 * ==Ghostyle3D==
 * @name         UV Periodic
 * @version      0.3.0
 * @author       NINA
 * @description  Strisce/chevron oblique disegnate sul volto in spazio UV canonico (port da viso/StripePaletteRenderer).
 * ==/Ghostyle3D==
 *
 * Plugin Ghostyle3D di tipo "UV-space": disegna un pattern in coordinate UV
 * canoniche su un canvas quadrato (textureSize × textureSize). Il framework
 * (Ghostati.UvRenderer) si occupa del warp triangolo-per-triangolo sul volto,
 * della cache della texture e del backface culling.
 *
 * Le stripe risultano continue tra triangoli adiacenti perché due vertici
 * condivisi hanno UV identica, quindi l'interpolazione lineare matcha sull'edge.
 */



export const params = [
   { name: 'frequency',    type: 'range',  label: 'frequency',    min: 0,    max: 255, step: 1, default: 128 },
   { name: 'phase',  type: 'range',  label: 'phase',       min: 0,    max: 128,       step: 1,    default: 0 },
   { name: 'alpha',    type: 'range',  label: 'Opacità',         min: 0,    max: 1,       step: 0.01, default: 0.4 },
   { name: 'gap',      type: 'bool',   label: 'Gap trasparente', default: true },
   { name: 'mode',     type: 'select', label: 'Modalità',        options: ['stripe', 'chevron'], default: 'chevron' }
];

export const region = {
    include: ['skin']
};

const COLORS = [
   [255, 255, 255],
   [0, 0, 220],
   [0, 255, 255],
   [255, 220, 60]
];

function sampleStripe(u, v, p) {
   const period = Math.max(0.005, p.width / 100);
   const cu = u - 0.5;
   const cv = v - 0.5;
   const projU = p.mode === 'chevron' ? Math.abs(cu) : cu;
   const proj = projU * Math.cos(p.angle) + cv * Math.sin(p.angle);
   let phase = (proj / period) % 1;
   if (phase < 0) phase += 1;
   const total = p.gap ? p.nColors + 1 : p.nColors;
   const idx = Math.floor(phase * total);
   if (p.gap && idx === p.nColors) return null;
   return COLORS[idx % p.nColors];
}

function scale (number, inMin, inMax, outMin, outMax) {
	return (number - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
}


function drawPeriodic(u, v, p) {
    let u_sine = Math.sin(u*360*p.frequency+p.phase-v);
    let v_sine = Math.sin(v*360*p.frequency+p.phase-u);
    return (u_sine < 0 ? COLORS[2] : (v_sine < 0 ? COLORS[1] : null) )
}

export function paintUV(ctx, params) {
   const w = ctx.canvas.width;
   const h = ctx.canvas.height;
    console.log("width height", w, h)
   const p = {
      frequency:   params.frequency   ?? 0.5,
      phase:   params.phase   ?? 21,
      alpha:   params.alpha   ?? 0.4,
      gap:     params.gap     ?? true,
      mode:    params.mode    ?? 'chevron'
   };
   const aByte = Math.round(p.alpha * 255);
   const img = ctx.createImageData(w, h);
   const data = img.data;
   for (let py = 0; py < h; py++) {
      const v = (py + 0.5) / h;
      for (let px = 0; px < w; px++) {
         const u = (px + 0.5) / w;
         const col = drawPeriodic(u, v, p);
         const idx = (py * w + px) * 4;
         if (col) {
            data[idx]     = col[0];
            data[idx + 1] = col[1];
            data[idx + 2] = col[2];
            data[idx + 3] = aByte;
         } else {
            data[idx + 3] = 0;
         }
      }
   }
   ctx.putImageData(img, 0, 0);
}
