/* Cabinet d'Orthoptie de Clément Maupomé — petits scripts du site */
(function () {
  'use strict';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Les yeux qui suivent la souris (ou le doigt) ---------- */
  var eyes = Array.prototype.slice.call(document.querySelectorAll('.eye'));
  if (eyes.length && !reduce) {
    var MAX = 6.5, pending = null;
    function look(x, y) {
      eyes.forEach(function (eye) {
        var r = eye.getBoundingClientRect();
        var dx = x - (r.left + r.width / 2), dy = y - (r.top + r.height / 2);
        var d = Math.sqrt(dx * dx + dy * dy) || 1;
        var k = Math.min(MAX, d / 18) / d;
        eye.querySelector('.pupil').style.transform = 'translate(' + (dx * k).toFixed(2) + 'px,' + (dy * k).toFixed(2) + 'px)';
      });
    }
    function queue(x, y) {
      if (pending) return;
      pending = requestAnimationFrame(function () { pending = null; look(x, y); });
    }
    window.addEventListener('pointermove', function (e) { queue(e.clientX, e.clientY); }, { passive: true });
    window.addEventListener('touchstart', function (e) { var t = e.touches[0]; if (t) queue(t.clientX, t.clientY); }, { passive: true });
    document.addEventListener('mouseleave', function () {
      eyes.forEach(function (eye) { eye.querySelector('.pupil').style.transform = ''; });
    });
    (function blink() {
      setTimeout(function () {
        eyes.forEach(function (e) { e.classList.add('blink'); });
        setTimeout(function () { eyes.forEach(function (e) { e.classList.remove('blink'); }); blink(); }, 130);
      }, 2800 + Math.random() * 4200);
    })();
  }

  /* ---------- Préférences d'affichage (texte agrandi / contraste) ---------- */
  var root = document.documentElement;
  function store(key, on) { try { localStorage.setItem(key, on ? '1' : '0'); } catch (e) {} }
  document.querySelectorAll('.switch[data-pref]').forEach(function (btn) {
    var cls = btn.getAttribute('data-pref');
    btn.setAttribute('aria-pressed', root.classList.contains(cls) ? 'true' : 'false');
    btn.addEventListener('click', function () {
      var on = !root.classList.contains(cls);
      root.classList.toggle(cls, on);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      store(cls, on);
    });
  });

  /* ---------- Menus déroulants : accessibilité, spécialités, menu mobile ---------- */
  function setupToggle(btn, target, openClass) {
    if (!btn || !target) return;
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = !target.classList.contains(openClass);
      closeAll(target);
      target.classList.toggle(openClass, open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }
  var toggles = [];
  function closeAll(except) {
    toggles.forEach(function (t) {
      if (t.target !== except && t.target.classList.contains(t.cls)) {
        t.target.classList.remove(t.cls);
        t.btn.setAttribute('aria-expanded', 'false');
      }
    });
  }
  [
    ['.a11y-btn', '.a11y-panel', 'open'],
    ['.dd-btn', '.dd', 'open'],
    ['.burger', '.site-nav', 'open']
  ].forEach(function (s) {
    var btn = document.querySelector(s[0]), target = document.querySelector(s[1]);
    if (btn && target) { toggles.push({ btn: btn, target: target, cls: s[2] }); setupToggle(btn, target, s[2]); }
  });
  document.addEventListener('click', function (e) {
    toggles.forEach(function (t) {
      if (t.cls === 'open' && t.target.classList.contains('site-nav')) return; // le menu mobile se ferme avec son bouton
      if (!t.target.contains(e.target)) { t.target.classList.remove(t.cls); t.btn.setAttribute('aria-expanded', 'false'); }
    });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeAll(null);
  });

  /* ---------- Signes d'alerte : les petits yeux miment chaque signe ---------- */
  var signs = Array.prototype.slice.call(document.querySelectorAll('.sign[data-mime]'));
  if (signs.length && !reduce) {
    var play = function (li) {
      li.classList.remove('play'); void li.offsetWidth; li.classList.add('play');
      clearTimeout(li._t); li._t = setTimeout(function () { li.classList.remove('play'); }, 2700);
    };
    signs.forEach(function (li) {
      li.addEventListener('mouseenter', function () { play(li); });
      li.addEventListener('focus', function () { play(li); });
      li.addEventListener('touchstart', function () { play(li); }, { passive: true });
    });
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            io.disconnect();
            signs.forEach(function (li, i) { setTimeout(function () { play(li); }, 400 + i * 1100); });
          }
        });
      }, { threshold: 0.5 });
      io.observe(signs[0].parentNode);
    }
  }

  /* ---------- Dessin BéBé Vision : le regard va vers la carte la plus visible ---------- */
  var bb = document.querySelector('.bb-wrap');
  if (bb && !reduce) {
    var bbPlay = function () { bb.classList.remove('play'); void bb.offsetWidth; bb.classList.add('play'); };
    bb.addEventListener('mouseenter', bbPlay);
    bb.addEventListener('touchstart', bbPlay, { passive: true });
    if ('IntersectionObserver' in window) {
      var bio = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { bio.disconnect(); setTimeout(bbPlay, 300); } }, { threshold: 0.6 });
      bio.observe(bb);
    }
  }

  /* ---------- Carte : chargée seulement si on clique (pas de traceur tiers par défaut) ---------- */
  var mapBtn = document.querySelector('[data-load-map]');
  if (mapBtn) {
    mapBtn.addEventListener('click', function () {
      var frame = mapBtn.closest('.map-frame');
      var iframe = document.createElement('iframe');
      iframe.src = mapBtn.getAttribute('data-load-map');
      iframe.title = 'Carte OpenStreetMap : localisation du cabinet';
      iframe.loading = 'lazy';
      frame.innerHTML = '';
      frame.appendChild(iframe);
      frame.classList.add('loaded');
    });
  }
})();
