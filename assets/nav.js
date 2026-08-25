/* SUSU LATAM — comportamiento de los menús desplegables de la barra superior.
   Un solo panel abierto a la vez; se cierra al hacer clic afuera o con Escape. */
(function () {
  var menus = Array.prototype.slice.call(document.querySelectorAll('.ui-menu'));

  function closeAll(except) {
    menus.forEach(function (m) {
      if (m === except) return;
      m.classList.remove('open');
      var b = m.querySelector('.ui-trigger');
      if (b) b.setAttribute('aria-expanded', 'false');
    });
  }

  menus.forEach(function (menu) {
    var btn = menu.querySelector('.ui-trigger');
    if (!btn) return;
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var willOpen = !menu.classList.contains('open');
      closeAll(menu);
      menu.classList.toggle('open', willOpen);
      btn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
    });
  });

  document.addEventListener('click', function () { closeAll(null); });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeAll(null);
  });
})();
