/**
 * ==Ghostyle3D==
 * @name         UV Band Stripes
 * @version      0.1.0
 * @author       NINA
 * @description  Variante di UV Stripes con cutoff a banda: disegna solo N strisce contigue centrate sul volto, con offset configurabile lungo l'asse del pattern.
 * ==/Ghostyle3D==
 *
 * Plugin Ghostyle3D di tipo "UV-space". Estende `uv-stripes.js` aggiungendo:
 *   - `totalWidth`: numero di strisce contigue da disegnare (1..20)
 *   - `offset`: spostamento del centro della banda lungo l'asse del pattern,
 *     in unità di periodi (negativo o positivo). 0 = banda centrata sul naso.
 *
 * Implementazione: lavoriamo sulla "fase non-modulata" `proj/period - offset`.
 * Se il modulo supera `totalWidth/2`, il pixel è fuori dalla banda → null.
 */

export const params = [
   { name: 'angle',      type: 'range',  label: 'Angolo (rad)',       min: 0,   max: Math.PI, step: 0.01, default: 0.37 },
   { name: 'width',      type: 'range',  label: 'Larghezza stripe',   min: 3,   max: 60,      step: 0.5,  default: 21 },
   { name: 'totalWidth', type: 'range',  label: 'N° stripe visibili', min: 1,   max: 20,      step: 1,    default: 3 },
   { name: 'offset',     type: 'range',  label: 'Offset (periodi)',   min: -10, max: 10,      step: 0.1,  default: 0 },
   { name: 'nColors',    type: 'range',  label: 'N° colori',          min: 2,   max: 4,       step: 1,    default: 3 },
   { name: 'alpha',      type: 'range',  label: 'Opacità',            min: 0,   max: 1,       step: 0.01, default: 0.4 },
   { name: 'gap',        type: 'bool',   label: 'Gap trasparente',    default: true },
   { name: 'mode',       type: 'select', label: 'Modalità',           options: ['stripe', 'chevron'], default: 'chevron' },
   { name: 'color1',     type: 'color',  label: 'Colore 1',           default: '#ffffff' },
   { name: 'color2',     type: 'color',  label: 'Colore 2',           default: '#0000dc' },
   { name: 'color3',     type: 'color',  label: 'Colore 3',           default: '#00ffff' },
   { name: 'color4',     type: 'color',  label: 'Colore 4',           default: '#ffdc3c' }
];

export const region = {
   include: 'skin'
};

function sampleBandStripe(u, v, params, palette) {
   const period = Math.max(0.005, params.width / 100);
   const cu = u - 0.5;
   const cv = v - 0.5;
   const projU = params.mode === 'chevron' ? Math.abs(cu) : cu;
   const proj = projU * Math.cos(params.angle) + cv * Math.sin(params.angle);

   // Fase non-modulata in unità di periodi, con offset come spostamento del centro.
   const unwrapped = (proj / period) - params.offset;
   if (Math.abs(unwrapped) > params.totalWidth / 2) return null;

   // Phase ciclica in [0,1) per indicizzare la palette dentro la banda.
   let phase = unwrapped - Math.floor(unwrapped);
   const total = params.gap ? params.nColors + 1 : params.nColors;
   const idx = Math.floor(phase * total);
   if (params.gap && idx === params.nColors) return null;
   return palette[idx % params.nColors];
}

export function paintUV(ctx, params) {
   const w = ctx.canvas.width;
   const h = ctx.canvas.height;
   const palette = [params.color1, params.color2, params.color3, params.color4];
   const aByte = Math.round(params.alpha * 255);
   const img = ctx.createImageData(w, h);
   const data = img.data;
   for (let py = 0; py < h; py++) {
      const v = (py + 0.5) / h;
      for (let px = 0; px < w; px++) {
         const u = (px + 0.5) / w;
         const col = sampleBandStripe(u, v, params, palette);
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
