/**
 * guest-lookup.js
 * ============================================================
 * Lista de invitados + verificación de nombre.
 *
 * Flujo:
 *  1. El botón "Ingresar" del sobre abre el overlay de búsqueda.
 *  2. El invitado escribe su nombre → sugerencias en tiempo real.
 *  3. Selecciona su nombre → mensaje personalizado de bienvenida.
 *  4. Clic en "Abrir invitación" → cierra overlay y dispara
 *     window.envelopeOpen() (expuesto por envelope.js).
 *  5. Si el nombre no está → mensaje de error amigable.
 * ============================================================
 */

(function () {
  'use strict';

  /* ----------------------------------------------------------
     Lista de invitados { name, passes }
  ---------------------------------------------------------- */
  const GUESTS = [
    { name: 'Benito Corbera',            passes: 2 },
    { name: 'Marco Corbera',             passes: 2 },
    { name: 'Leo Corbera',               passes: 2 },
    { name: 'Nelly Corbera',             passes: 1 },
    { name: 'Jorge Corbera',             passes: 2 },
    { name: 'Maria del Carmen Corbera',  passes: 3 },
    { name: 'Elena Corbera',             passes: 2 },
    { name: 'Edward Espino',             passes: 2 },
    { name: 'Henry Espino',              passes: 2 },
    { name: 'Wilson Corbera',            passes: 4 },
    { name: 'Mario Nunura',              passes: 2 },
    { name: 'Percy Hernandez',           passes: 2 },
    { name: 'Irma Obregon',              passes: 1 },
    { name: 'Renato Hernandez',          passes: 1 },
    { name: 'Carolina Rojas',            passes: 2 },
    { name: 'Victoria Obregon',          passes: 2 },
    { name: 'Jesus Rojas',               passes: 1 },
    { name: 'Cesar Obregon',             passes: 3 },
    { name: 'Freder Obregon',            passes: 4 },
    { name: 'Ronny Rojas',               passes: 2 },
    { name: 'Laura Hernandez',           passes: 2 },
    { name: 'Claudia Hernandez',         passes: 2 },
    { name: 'Rick Hernandez',            passes: 2 },
    { name: 'Lleny Silva',               passes: 1 },
    { name: 'Pablo Hernandez',           passes: 1 },
    { name: 'Deibby Silva',              passes: 1 },
    { name: 'Pablo Cesar Hernandez',     passes: 5 },
    { name: 'Wendy Hernandez',           passes: 2 },
    { name: 'Gladys Hernandez',                  passes: 1 },
    { name: 'Zoila Hernandez',                   passes: 1 },
    { name: 'Freddy Hernandez',                  passes: 2 },
    { name: 'Laura Pilar Hernandez',             passes: 2 },
    { name: 'Silvia Hernandez',                  passes: 2 },
    { name: 'Edward Lavado',                     passes: 2 },
    { name: 'Brandon Yalles',                    passes: 2 },
    { name: 'Carmen Rivera',                     passes: 1 },
    { name: 'Jesus Yeltsin Santos',              passes: 1 },
    { name: 'Jorge Omar Fernandez de Paredes',   passes: 2 },
    { name: 'Milagros Chavez',           passes: 2 },
    { name: 'Benjamin Valencia',         passes: 1 },
    { name: 'Adriana Oliva',             passes: 2 },
    { name: 'Jessica Vidal',             passes: 2 },
    { name: 'Pierina Fasanando',         passes: 1 },
    { name: 'Annel Loyola',              passes: 1 },
    { name: 'Nicole Espinoza',           passes: 2 },
    { name: 'Sheyla Zapata',             passes: 2 },
    { name: 'Mariame Chavez',            passes: 2 },
    { name: 'Cesar Caldas',              passes: 2 },
    { name: 'Luis Mendieta',             passes: 2 },
    { name: 'Alfredo Gonzales',          passes: 2 },
    { name: 'Katia Cruz',                passes: 2 },
    { name: 'Elizabeth Quispe',          passes: 2 },
    { name: 'Teresa Huallpa',            passes: 2 },
    { name: 'Valeria Ramirez',           passes: 1 },
    { name: 'Kalil Caceres',             passes: 1 },
    { name: 'Manuel Zapata',             passes: 2 },
    { name: 'Rafael Espinoza',           passes: 2 },
    { name: 'Omar Quispe',               passes: 1 },
    { name: 'Juan Camara',               passes: 1 },
    { name: 'Jonathan Zapata',           passes: 1 },
  ];

  /* ----------------------------------------------------------
     DOM refs
  ---------------------------------------------------------- */
  const enterBtn      = document.getElementById('wax-seal');       // botón "Ingresar" del sobre
  const overlay       = document.getElementById('guest-lookup-overlay');
  const input         = document.getElementById('guest-input');
  const suggestionBox = document.getElementById('gl-suggestions');
  const glBtn         = document.getElementById('gl-btn');
  const resultDiv     = document.getElementById('gl-result');

  if (!enterBtn || !overlay) return;

  /* ----------------------------------------------------------
     Estado
  ---------------------------------------------------------- */
  let selectedGuest = null; // { name, passes } cuando se elige de la lista

  /* ----------------------------------------------------------
     Helpers
  ---------------------------------------------------------- */

  /** Normaliza texto para comparación: minúsculas sin tildes */
  function normalize(str) {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  /** Resalta la parte que coincide con la búsqueda */
  function highlight(name, query) {
    const norm  = normalize(name);
    const idx   = norm.indexOf(normalize(query));
    if (idx === -1) return name;
    return (
      name.slice(0, idx) +
      '<mark>' + name.slice(idx, idx + query.length) + '</mark>' +
      name.slice(idx + query.length)
    );
  }

  /** Texto de pases en español */
  function passesText(n) {
    return n === 1 ? 'Pase para <strong>1</strong> persona' : `Pase para <strong>${n}</strong> personas`;
  }

  /* ----------------------------------------------------------
     Autocompletado
  ---------------------------------------------------------- */
  function showSuggestions(query) {
    if (!query || query.trim().length < 2) {
      hideSuggestions();
      return;
    }

    const matches = GUESTS.filter(g =>
      normalize(g.name).includes(normalize(query))
    ).slice(0, 8);

    if (matches.length === 0) {
      hideSuggestions();
      return;
    }

    suggestionBox.innerHTML = matches
      .map(g =>
        `<div class="gl-suggestion" data-name="${g.name}" data-passes="${g.passes}">
           ${highlight(g.name, query)}
         </div>`
      )
      .join('');

    suggestionBox.classList.add('visible');

    // Click en sugerencia
    suggestionBox.querySelectorAll('.gl-suggestion').forEach(el => {
      el.addEventListener('mousedown', (e) => {
        e.preventDefault(); // evitar que el input pierda foco antes
        selectGuest(el.dataset.name, parseInt(el.dataset.passes, 10));
      });
    });
  }

  function hideSuggestions() {
    suggestionBox.classList.remove('visible');
    suggestionBox.innerHTML = '';
  }

  function selectGuest(name, passes) {
    selectedGuest  = { name, passes };
    input.value    = name;
    hideSuggestions();
  }

  /* ----------------------------------------------------------
     Mostrar resultado
  ---------------------------------------------------------- */
  /** Genera los campos de acompañantes en la sección RSVP */
  function buildCompanionFields(passes) {
    const container = document.getElementById('rsvp-companions');
    if (!container) return;
    const count = passes - 1;
    if (count <= 0) { container.innerHTML = ''; return; }

    container.innerHTML = Array.from({ length: count }, (_, i) => {
      const num   = count > 1 ? ` ${i + 1}` : '';
      const label = `Nombre del acompañante${num}`;
      return `
        <div class="companion-group space-y-3">
          <label class="flex items-center gap-2 cursor-pointer select-none w-fit">
            <input type="checkbox" class="companion-skip accent-[#5f5e2b] w-4 h-4 cursor-pointer" data-target="companion-${i + 1}"/>
            <span class="font-body-md text-[10px] text-tertiary uppercase tracking-widest">No llevaré acompañante${num}</span>
          </label>
          <div class="relative">
            <input
              class="companion-input peer w-full bg-transparent border-0 border-b border-primary/30 py-3 px-0 focus:ring-0 focus:border-primary text-sm font-body-md transition-opacity"
              id="companion-${i + 1}" placeholder=" " type="text" autocomplete="off"/>
            <label
              class="absolute top-3 left-0 text-tertiary text-xs uppercase tracking-widest transition-all peer-focus:-top-4 peer-focus:text-[10px] peer-[:not(:placeholder-shown)]:-top-4"
              for="companion-${i + 1}">${label}</label>
          </div>
        </div>`;
    }).join('');

    // Lógica de bloqueo del checkbox
    container.querySelectorAll('.companion-skip').forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        const input = document.getElementById(checkbox.dataset.target);
        if (checkbox.checked) {
          input.disabled = true;
          input.value    = '';
          input.style.opacity = '0.35';
        } else {
          input.disabled = false;
          input.style.opacity = '1';
        }
      });
    });
  }

  function showSuccess(guest) {
    window.confirmedGuestName   = guest.name;   // disponible para el botón RSVP
    window.confirmedGuestPasses = guest.passes;
    buildCompanionFields(guest.passes);
    resultDiv.className = 'visible success';
    resultDiv.innerHTML = `
      <div class="gl-result-box">
        <p class="gl-result-greeting">
          Hola, <strong>${guest.name}</strong>, nos llena de alegría poder compartir contigo este capítulo tan importante de nuestras vidas. Hemos preparado con mucho amor esta invitación especial, esperando que formes parte de nuestra historia.
        </p>
        <p class="gl-result-passes">${passesText(guest.passes)}</p>
        <p class="gl-result-notice"><strong>Evento exclusivo para adultos.</strong></p>
        <button id="gl-continue-btn">Abrir mi invitación</button>
      </div>`;

    document.getElementById('gl-continue-btn').addEventListener('click', () => {
      // Cerrar overlay y abrir el sobre
      overlay.classList.add('gl-fade-out');
      overlay.classList.remove('gl-visible');
      setTimeout(() => {
        overlay.style.display = 'none';
        if (typeof window.envelopeOpen === 'function') {
          window.envelopeOpen();
        }
      }, 500);
    });
  }

  function showError() {
    selectedGuest = null;
    resultDiv.className = 'visible error';
    resultDiv.innerHTML = `
      <div class="gl-result-box">
        <p class="gl-result-msg">
          Hola, no pudimos encontrarte en la lista.<br/><br/>
          Si crees que es un error, por favor comunícate con los novios.
        </p>
      </div>`;
  }

  /* ----------------------------------------------------------
     Buscar al presionar "Ingresar"
  ---------------------------------------------------------- */
  function handleLookup() {
    hideSuggestions();

    // Si ya se seleccionó de la lista, usar ese
    if (selectedGuest) {
      showSuccess(selectedGuest);
      return;
    }

    // Intentar coincidencia exacta (ignorando tildes y mayúsculas)
    const query = input.value.trim();
    const found = GUESTS.find(g => normalize(g.name) === normalize(query));

    if (found) {
      selectGuest(found.name, found.passes);
      showSuccess(found);
    } else {
      showError();
    }
  }

  /* ----------------------------------------------------------
     Eventos del input
  ---------------------------------------------------------- */
  input.addEventListener('input', () => {
    selectedGuest = null;       // limpiar selección previa si el usuario escribe de nuevo
    resultDiv.className = '';   // ocultar resultado anterior
    resultDiv.innerHTML = '';
    showSuggestions(input.value.trim());
  });

  input.addEventListener('blur', () => {
    // Pequeño delay para que el click en sugerencia se procese primero
    setTimeout(hideSuggestions, 150);
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); handleLookup(); }
    if (e.key === 'Escape') { hideSuggestions(); }
  });

  glBtn.addEventListener('click', handleLookup);

  /* ----------------------------------------------------------
     Abrir overlay al hacer clic en "Ingresar" del sobre
  ---------------------------------------------------------- */
  enterBtn.addEventListener('click', () => {
    overlay.style.display = 'flex';
    // forzar reflow para que la transición funcione
    overlay.getBoundingClientRect();
    overlay.classList.add('gl-visible');
    setTimeout(() => input.focus(), 300);
  });

})();
