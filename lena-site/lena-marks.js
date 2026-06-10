/* lena-marks.js — fonte única da marca Lena.
   A marca: selo squircle terracota + "L" cujo pé sobe num sorriso terminando
   no ponto de presença em sálvia (luz de "online"). Fusão das direções B + C.
   Recolore-se por contexto via atributos data-*. */

(function () {
  // Geometria canônica (viewBox 0 0 100 100) — contorno exato extraído do selo
  // original (prototipos-gitignore/Lena-logo-v02.png): a cauda afina e sobe
  // até encaixar na bolinha, então a letra é um path PREENCHIDO, não stroke.
  var L = 'M31.1 20.9 C31.5 20.9 39.6 20.9 39.9 20.9 C40.2 21.0 40.5 21.1 40.7 21.2 C40.9 21.4 41.3 21.7 41.3 22.0 C41.3 22.3 41.4 59.3 41.4 60.2 C41.4 61.0 41.6 61.9 42.0 62.7 C42.3 63.5 42.8 64.5 43.4 65.2 C44.0 65.9 44.8 66.5 45.6 66.9 C46.4 67.4 47.5 67.8 48.5 68.1 C49.6 68.4 50.9 68.6 52.1 68.6 C53.2 68.6 55.6 68.4 56.7 68.3 C57.7 68.2 58.6 67.9 59.6 67.5 C60.5 67.2 61.7 66.7 62.6 66.0 C63.6 65.4 65.0 64.2 65.8 63.3 C66.7 62.4 67.9 60.3 67.9 60.3 C67.9 60.3 68.6 60.1 69.0 60.2 C69.3 60.3 70.3 61.1 71.0 61.3 C71.8 61.6 72.5 61.8 73.3 61.9 C74.0 62.0 75.7 62.0 75.7 62.0 C75.7 62.0 76.0 63.7 75.8 64.5 C75.7 65.3 75.1 66.2 74.7 67.0 C74.2 67.8 72.8 69.9 71.7 71.1 C70.6 72.4 69.1 73.7 67.8 74.7 C66.5 75.6 65.0 76.4 63.6 77.1 C62.2 77.8 60.6 78.3 59.1 78.7 C57.5 79.0 55.2 79.4 53.2 79.4 C51.3 79.5 48.4 79.3 46.6 79.1 C44.8 78.8 42.7 78.2 41.3 77.7 C39.9 77.2 38.6 76.5 37.4 75.6 C36.2 74.8 34.8 73.6 33.8 72.3 C32.7 71.0 31.5 68.5 31.1 67.7 C30.7 66.9 30.5 66.0 30.3 65.1 C30.2 64.2 29.7 62.0 29.7 60.4 C29.6 58.8 29.6 22.4 29.7 22.1 C29.7 21.8 29.9 21.5 30.1 21.3 C30.4 21.1 30.8 21.0 31.1 20.9 Z';
  var DOT = { cx: 73, cy: 55.6, r: 4.85 };

  var PAL = {
    terra: '#E35B2E', terraUp: '#E8784E', cream: '#FDF3E6', cafe: '#241B15',
    cafeDk: '#1B130D', salvia: '#599372', ambar: '#F2A93C', ameixa: '#8A5A9C',
  };

  function glyphInner(letter, dot) {
    return '<path d="' + L + '" fill="' + letter + '"/>' +
      '<circle cx="' + DOT.cx + '" cy="' + DOT.cy + '" r="' + DOT.r + '" fill="' + dot + '"/>';
  }

  // Builders → string SVG (viewBox 100). size em px.
  var Marks = {
    selo: function (o) {
      o = o || {};
      var tile = o.tile || PAL.terra, letter = o.letter || PAL.cream, dot = o.dot || PAL.salvia;
      return svg(o.size, '<rect x="5" y="5" width="90" height="90" rx="25" fill="' + tile + '"/>' + glyphInner(letter, dot));
    },
    circle: function (o) {
      o = o || {};
      var tile = o.tile || PAL.terra, letter = o.letter || PAL.cream, dot = o.dot || PAL.salvia;
      return svg(o.size, '<circle cx="50" cy="50" r="47" fill="' + tile + '"/>' + glyphInner(letter, dot));
    },
    glyph: function (o) { // L isolado, sem recipiente
      o = o || {};
      var letter = o.letter || PAL.terra, dot = o.dot || PAL.salvia;
      return svg(o.size, glyphInner(letter, dot));
    },
  };

  function svg(size, inner) {
    var s = size || 96;
    return '<svg width="' + s + '" height="' + s + '" viewBox="0 0 100 100" fill="none" ' +
      'xmlns="http://www.w3.org/2000/svg" style="display:block">' + inner + '</svg>';
  }

  // Auto-render: <span data-mark="selo" data-size="64" data-variant="escuro"></span>
  var VAR = {
    primary: {}, // padrão (terracota/creme/sálvia) — serve em fundo claro e escuro
    escuro: { tile: PAL.terraUp }, // selo realçado p/ fundo quase-preto
    invert: { tile: PAL.cream, letter: PAL.terra, dot: PAL.salvia }, // selo creme sobre terracota
    glifoCreme: { letter: PAL.cream },
  };

  function render(root) {
    (root || document).querySelectorAll('[data-mark]').forEach(function (el) {
      if (el.dataset.done) return;
      var kind = el.dataset.mark;
      var o = Object.assign({}, VAR[el.dataset.variant] || {});
      o.size = parseFloat(el.dataset.size) || 64;
      if (el.dataset.tile) o.tile = el.dataset.tile;
      if (el.dataset.letter) o.letter = el.dataset.letter;
      if (el.dataset.dot) o.dot = el.dataset.dot;
      if (Marks[kind]) { el.innerHTML = Marks[kind](o); el.dataset.done = '1'; }
    });
  }

  window.LenaMarks = { Marks: Marks, PAL: PAL, L: L, DOT: DOT, render: render };
  if (document.readyState !== 'loading') render();
  else document.addEventListener('DOMContentLoaded', function () { render(); });
})();
