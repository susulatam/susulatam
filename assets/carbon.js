/* SUSU LATAM — badge de huella digital.
 *
 * El widget original de Website Carbon consultaba la API por la URL de la
 * página donde estaba puesto. Como solo la portada había sido testeada, las
 * subpáginas devolvían "No Result". Acá consultamos siempre el dominio, que
 * sí tiene resultado, así que funciona desde cualquier página.
 *
 * El HTML ya trae el dato verificado escrito. Si la API responde, se
 * actualiza el número y la fecha; si no responde o está limitada, queda el
 * valor de respaldo y nunca se ve un "No Result".
 */
(function () {
  var el = document.querySelector('.carbon-badge');
  if (!el) return;

  var SITE = 'https://susulatam.com/';
  var CACHE_KEY = 'susu-carbon-v1';
  var TTL = 7 * 24 * 60 * 60 * 1000;   // una semana

  var lang = (document.documentElement.lang || 'es').slice(0, 2);
  var T = {
    es: { under: '< 0,01 g de CO₂ por visita', unit: ' g de CO₂ por visita',
          energy: 'Energía sostenible', checked: 'verificado ' },
    en: { under: '< 0.01 g of CO₂ per visit', unit: ' g of CO₂ per visit',
          energy: 'Sustainable energy', checked: 'verified ' },
    pt: { under: '< 0,01 g de CO₂ por visita', unit: ' g de CO₂ por visita',
          energy: 'Energia sustentável', checked: 'verificado ' }
  }[lang] || null;
  if (!T) return;

  var elMain = el.querySelector('.cb-text strong');
  var elSub = el.querySelector('.cb-text span');
  var elGrade = el.querySelector('.cb-grade');

  function fmtDate(d) {
    var p = function (n) { return (n < 10 ? '0' : '') + n; };
    return p(d.getDate()) + '/' + p(d.getMonth() + 1) + '/' + d.getFullYear();
  }

  /* La API cambió de forma alguna vez, así que buscamos el valor en varias
     rutas posibles y descartamos cualquier cosa que no sea un número sano. */
  function extractGrams(d) {
    var candidates = [
      d && d.c,
      d && d.statistics && d.statistics.co2 && d.statistics.co2.renewable &&
        d.statistics.co2.renewable.grams,
      d && d.statistics && d.statistics.co2 && d.statistics.co2.grid &&
        d.statistics.co2.grid.grams
    ];
    for (var i = 0; i < candidates.length; i++) {
      var v = candidates[i];
      if (typeof v === 'number' && isFinite(v) && v >= 0 && v < 100) return v;
    }
    return null;
  }

  function paint(grams, when) {
    if (grams === null) return;

    var texto = grams < 0.01
      ? T.under
      : String(grams.toFixed(2)).replace('.', lang === 'en' ? '.' : ',') + T.unit;
    if (elMain) elMain.textContent = texto;

    if (elSub) elSub.textContent = T.energy + ' · ' + T.checked + fmtDate(new Date(when));

    /* Si algún día el sitio se vuelve pesado, preferimos ocultar la nota
       antes que mostrar una calificación que ya no corresponde. */
    if (elGrade && grams > 0.1) elGrade.style.display = 'none';
  }

  // 1. lo que haya en caché, para pintar al instante
  var cached = null;
  try { cached = JSON.parse(localStorage.getItem(CACHE_KEY)); } catch (e) {}
  if (cached && typeof cached.g === 'number' && Date.now() - cached.t < TTL) {
    paint(cached.g, cached.t);
    return;
  }

  // 2. si no hay caché fresca, se consulta y se guarda
  fetch('https://api.websitecarbon.com/b?url=' + encodeURIComponent(SITE))
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (d) {
      var g = extractGrams(d);
      if (g === null) return;                 // se queda el valor de respaldo
      var now = Date.now();
      try { localStorage.setItem(CACHE_KEY, JSON.stringify({ g: g, t: now })); } catch (e) {}
      paint(g, now);
    })
    .catch(function () { /* sin conexión o límite alcanzado: queda el respaldo */ });
})();
