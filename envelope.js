/**
 * envelope.js
 * ============================================================
 * Luxury envelope opening sequence — Jefferson & Kari
 *
 * openEnvelope() es llamado por guest-lookup.js una vez que
 * el invitado confirma su nombre. Se expone como window.envelopeOpen.
 *
 * Animation timeline (desde que se llama openEnvelope):
 *   t =    0 ms  El sobre oculta el botón "Ingresar"
 *   t =  200 ms  Flap comienza a abrirse
 *   t =  900 ms  Invitación comienza a emerger
 *   t = 1800 ms  Overlay del sobre comienza a desvanecerse
 *   t = 1900 ms  Invitación se expande a pantalla completa
 *   t = 3000 ms  Scroll desbloqueado · música · overlay eliminado
 * ============================================================
 */

(function () {
  'use strict';

  /* ----------------------------------------------------------
     Accessibility: respect prefers-reduced-motion.
  ---------------------------------------------------------- */
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    // Exponer función vacía para que guest-lookup.js no falle
    window.envelopeOpen = function () {
      const inv = document.getElementById('invitation-reveal');
      if (inv) {
        inv.style.opacity      = '1';
        inv.style.transform    = 'none';
        inv.style.pointerEvents = 'all';
      }
      document.body.classList.remove('env-locked');
    };
    return;
  }

  /* ----------------------------------------------------------
     DOM references
  ---------------------------------------------------------- */
  const overlay    = document.getElementById('envelope-overlay');
  const flap       = document.getElementById('envelope-flap');
  const hint       = document.getElementById('open-hint');
  const invitation = document.getElementById('invitation-reveal');
  const audio      = document.getElementById('wedding-music');

  if (!overlay || !invitation) return;

  /* ----------------------------------------------------------
     Lock scrolling mientras el sobre es visible
  ---------------------------------------------------------- */
  document.body.classList.add('env-locked');

  /* ----------------------------------------------------------
     Audio helper: fade 0 → 1 en `duration` ms
  ---------------------------------------------------------- */
  function fadeInAudio(duration) {
    if (!audio) return;
    const src = audio.querySelector('source');
    if (!src || !src.src) return;

    audio.volume = 0;
    audio.play().catch(() => {});

    const tickMs = 50;
    const step   = tickMs / duration;
    const ticker = setInterval(() => {
      audio.volume = Math.min(1, audio.volume + step);
      if (audio.volume >= 1) clearInterval(ticker);
    }, tickMs);
  }

  /* ----------------------------------------------------------
     Secuencia principal de apertura — expuesta globalmente
     para que guest-lookup.js la llame tras verificar el nombre.
  ---------------------------------------------------------- */
  function openEnvelope() {
    // Ocultar hint y el botón "Ingresar"
    if (hint) {
      hint.style.transition = 'opacity 200ms ease';
      hint.style.opacity    = '0';
    }
    const seal = document.getElementById('wax-seal');
    if (seal) {
      seal.style.transition = 'opacity 200ms ease, transform 200ms ease';
      seal.style.opacity    = '0';
      seal.style.pointerEvents = 'none';
    }

    // Flap se abre (200 ms)
    setTimeout(() => {
      if (flap) flap.classList.add('flap-open');
    }, 200);

    // Invitación emerge (900 ms)
    setTimeout(() => {
      invitation.classList.add('env-emerging');
    }, 900);

    // Sobre comienza a desvanecerse (1800 ms)
    setTimeout(() => {
      overlay.classList.add('env-fade-out');
    }, 1800);

    // Invitación se expande (1900 ms)
    setTimeout(() => {
      invitation.classList.remove('env-emerging');
      invitation.classList.add('env-expanded');
    }, 1900);

    // Limpieza final (3000 ms)
    setTimeout(() => {
      overlay.style.display = 'none';
      document.body.classList.remove('env-locked');
      window.scrollTo({ top: 0, behavior: 'instant' });
      fadeInAudio(3000);
      window.dispatchEvent(new Event('scroll'));
    }, 3000);
  }

  /* Exponer para guest-lookup.js */
  window.envelopeOpen = openEnvelope;

})();
