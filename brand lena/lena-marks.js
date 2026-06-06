/* lena-marks.js — fonte única da marca Lena.
   A marca: selo squircle terracota + "L" cujo pé sobe num sorriso terminando
   no ponto de presença em sálvia (luz de "online"). Fusão das direções B + C.
   Recolore-se por contexto via atributos data-*. */

(function () {
  // Geometria canônica (viewBox 0 0 100 100)
  var L = 'M37 28 V64 H56';
  var SW = 12.5;
  var DOT = { cx: 72, cy: 64, r: 6.4 };

  var PAL = {
    terra: '#D9613A', terraUp: '#E8784E', cream: '#FBF3E7', cafe: '#241B15',
    cafeDk: '#1B130D', salvia: '#4E9E78', ambar: '#F2A93C', ameixa: '#8A5A9C',
  };

  function glyphInner(letter, dot) {
    return '<path d="' + L + '" fill="none" stroke="' + letter + '" stroke-width="' + SW +
      '" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<circle cx="' + DOT.cx + '" cy="' + DOT.cy + '" r="' + DOT.r + '" fill="' + dot + '"/>';
  }

  // Builders → string SVG (viewBox 100). size em px.
  var Marks = {
    selo: function (o) {
      o = o || {};
      var tile = o.tile || PAL.terra, letter = o.letter || PAL.cream, dot = o.dot || PAL.salvia;
      return svg(o.size, '<rect x="5" y="5" width="90" height="90" rx="28" fill="' + tile + '"/>' + glyphInner(letter, dot));
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

  window.LenaMarks = { Marks: Marks, PAL: PAL, L: L, SW: SW, DOT: DOT, render: render };
  if (document.readyState !== 'loading') render();
  else document.addEventListener('DOMContentLoaded', function () { render(); });
})();
