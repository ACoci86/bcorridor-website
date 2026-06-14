/* ============================================================
   B Corridor — page behaviour
   Loaded with `defer`, so the DOM is ready and Leaflet (loaded
   just before this file) is already available as window.L.
   ============================================================ */

/* ───────────── Announcement bar dismiss ───────────── */
(function () {
  const bar = document.querySelector('.announce');
  const close = document.querySelector('.announce-close');
  if (!bar || !close) return;

  close.addEventListener('click', () => {
    bar.classList.add('is-hidden');
    document.body.classList.add('announce-closed');
  });
})();

/* ───────────── Hero video: keep it playing ───────────── */
(function () {
  const video = document.querySelector('.hero-video');
  if (!video) return;

  // Respect reduced-motion: keep the static poster, don't autoplay the video.
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    video.removeAttribute('autoplay');
    video.pause();
    return;
  }

  video.muted = true;
  video.setAttribute('playsinline', '');
  video.setAttribute('webkit-playsinline', '');

  function play() {
    if (!video.paused) return;
    const p = video.play();
    if (p && typeof p.catch === 'function') p.catch(() => {});
  }

  if (video.readyState >= 2) play();
  else video.addEventListener('canplay', play, { once: true });

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) play();
  });
})();

/* ───────────── Header: sticky glass state + mobile menu ───────────── */
(function () {
  const header = document.querySelector('.site-header');
  const menuButton = document.querySelector('.mobile-menu');
  const navLinks = document.querySelector('.nav-links');

  /* Toggle the glass background once the page has scrolled a little. */
  let ticking = false;
  let scrolled = null;

  function update() {
    const next = window.scrollY > 12;
    if (header && next !== scrolled) {
      header.classList.toggle('is-scrolled', next);
      scrolled = next;
    }
    ticking = false;
  }
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }
  update();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* Accessible mobile menu. */
  function setMenu(open) {
    navLinks?.classList.toggle('is-open', open);
    header?.classList.toggle('menu-is-open', open);
    document.body.classList.toggle('menu-open', open);
    menuButton?.setAttribute('aria-expanded', String(open));
    menuButton?.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }

  menuButton?.addEventListener('click', () => {
    setMenu(!navLinks?.classList.contains('is-open'));
  });
  navLinks?.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => setMenu(false));
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setMenu(false);
  });
})();

/* ───────────── "Did you know?" live species fact (iNaturalist) ───────────── */
(function () {
  const card = document.getElementById('factCard');
  if (!card) return;

  const factBody = document.getElementById('factBody');
  const factImage = document.getElementById('factImage');
  const factLink = document.getElementById('factLink');
  const factRefresh = document.getElementById('factRefresh');
  const factMeta = document.getElementById('factMeta');
  const factList = document.getElementById('factList');

  const FALLBACKS = [
    {
      name: 'Honey bee',
      fact: 'A single honey bee colony can pollinate millions of flowers, helping fruit, seed and wildflower communities thrive.',
      image: 'https://images.unsplash.com/photo-1568526381923-caf3fd520382?w=400&q=80',
      url: 'https://en.wikipedia.org/wiki/Honey_bee',
      quickFacts: [
        { label: 'Name', value: 'Honey bee' },
        { label: 'Type', value: 'Insect' },
        { label: 'Observed in', value: 'Ireland' }
      ],
      meta: { source: 'Fallback example' }
    },
    {
      name: 'Monarch butterfly',
      fact: 'Monarch butterflies are famous long-distance migrants, linking gardens, meadows and overwintering habitats across huge distances.',
      image: 'https://images.unsplash.com/photo-1452570053594-1b985d6ea890?w=400&q=80',
      url: 'https://en.wikipedia.org/wiki/Monarch_butterfly',
      quickFacts: [
        { label: 'Name', value: 'Monarch butterfly' },
        { label: 'Type', value: 'Insect' },
        { label: 'Observed in', value: 'Ireland' }
      ],
      meta: { source: 'Fallback example' }
    }
  ];

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function titleCase(value) {
    return String(value || '')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  function uniqueFacts(facts) {
    const seen = new Set();
    return facts
      .filter((item) => item && item.label && item.value)
      .map((item) => ({ label: String(item.label).trim(), value: String(item.value).trim() }))
      .filter((item) => item.value && item.value.toLowerCase() !== 'unknown')
      .filter((item) => {
        const key = item.label.toLowerCase() + ':' + item.value.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 4);
  }

  function factTypeIconSrc(value) {
    const type = String(value || '').toLowerCase();
    if (type.includes('plant') || type.includes('flora')) return 'assets/plant.svg';
    if (type.includes('bird') || type.includes('aves')) return 'assets/bird.svg';
    if (type.includes('insect') || type.includes('pollinator') || type.includes('bee') || type.includes('butterfly') || type.includes('moth')) return 'assets/dragonfly.svg';
    return '';
  }

  function factIconSrc(item) {
    const label = String(item?.label || '').toLowerCase();
    if (label === 'name') return 'assets/tag.svg';
    if (label === 'type') return factTypeIconSrc(item.value);
    if (label === 'observed in') return 'assets/ireland.svg';
    return '';
  }

  function factIconClass(item) {
    const label = String(item?.label || '').toLowerCase();
    const value = String(item?.value || '').toLowerCase();
    if (label === 'name') return ' fact-row-icon--name';
    if (label === 'type' && value.includes('bird')) return ' fact-row-icon--bird';
    return '';
  }

  function renderFactIcon(item) {
    const iconSrc = factIconSrc(item);
    if (!iconSrc) return '';

    return '<span class="fact-row-icon' + factIconClass(item) + '" aria-hidden="true">' +
      '<img src="' + iconSrc + '" alt="" loading="lazy" decoding="async">' +
    '</span>';
  }

  function renderQuickFacts(facts) {
    if (!factList) return;
    const usableFacts = uniqueFacts(facts);

    factList.innerHTML = usableFacts.map((item) => {
      const icon = renderFactIcon(item);
      const itemClass = icon ? 'fact-item fact-item--with-icon' : 'fact-item';
      // species names can arrive lower-case from iNaturalist — always show Title Case
      const value = item.label.toLowerCase() === 'name' ? titleCase(item.value) : item.value;

      return '<li class="' + itemClass + '">' +
        icon +
        '<span class="fact-term">' + escapeHtml(item.label) + '</span>' +
        '<span class="fact-desc">' + escapeHtml(value) + '</span>' +
      '</li>';
    }).join('');
  }

  function renderMeta(meta = {}) {
    if (!factMeta) return;

    if (meta.source === 'Fallback example') {
      factMeta.textContent = 'Source: curated fallback example';
      return;
    }

    const parts = ['Source: iNaturalist', 'Wikipedia'];
    if (meta.photoCredit) parts.push('Photo: ' + meta.photoCredit);
    if (meta.license) parts.push(meta.license.toUpperCase());
    factMeta.textContent = parts.join(' · ');
  }

  function render(name, fact, imageUrl, url, quickFacts = [], meta = {}) {
    const displayName = name ? titleCase(name) : 'Species';
    factBody.textContent = fact || '';
    factLink.href = url || '#';
    renderQuickFacts(quickFacts);
    renderMeta(meta);

    const probe = new Image();
    probe.onload = () => { factImage.src = imageUrl; factImage.alt = displayName; };
    probe.onerror = () => console.warn('Fact image failed:', imageUrl);
    probe.src = imageUrl;
  }

  function trimToSentences(text) {
    const summary = String(text || '').replace(/<[^>]+>/g, '').trim();
    const sentences = summary.match(/[^.!?]+[.!?]+/g) || [summary];
    let fact = (sentences[0] || summary).trim();
    if (fact.length < 90 && sentences[1]) fact += ' ' + sentences[1].trim();
    if (fact.length > 200) fact = fact.substring(0, 197).trim() + '…';
    return fact;
  }

  function inferRole(taxon) {
    const iconic = taxon?.iconic_taxon_name;

    if (iconic === 'Aves') return 'Bird';
    if (iconic === 'Insecta') return 'Insect';
    if (iconic === 'Plantae') return 'Plant';
    return titleCase(iconic || taxon?.rank || 'Species');
  }

  function shortPlace(place) {
    if (!place) return '';
    const parts = String(place).split(',').map((part) => part.trim()).filter(Boolean);
    const cleaned = parts.filter((part) => !/^ireland$/i.test(part));
    if (cleaned.length === 0) return '';
    return cleaned.slice(0, 2).join(', ');
  }

  function observedPlace(obs) {
    const place = shortPlace(obs?.place_guess);
    if (place) return place;
    if (Array.isArray(obs?.geojson?.coordinates) && obs.geojson.coordinates.length >= 2) {
      const [lng, lat] = obs.geojson.coordinates;
      if (Number.isFinite(lat) && Number.isFinite(lng)) return lat.toFixed(3) + ', ' + lng.toFixed(3);
    }
    return '';
  }

  function conservationLabel(status) {
    if (!status) return '';
    const code = status.status || status.iucn || status.status_name;
    const labels = {
      LC: 'Least concern',
      NT: 'Near threatened',
      VU: 'Vulnerable',
      EN: 'Endangered',
      CR: 'Critically endangered',
      EW: 'Extinct in the wild',
      EX: 'Extinct'
    };
    return labels[code] || titleCase(status.status_name || code || '');
  }

  function buildQuickFacts(full, obs) {
    const taxon = full || obs?.taxon || {};
    const commonName = taxon.preferred_common_name || obs?.taxon?.preferred_common_name || taxon.name;
    const observedIn = observedPlace(obs);

    return uniqueFacts([
      commonName && { label: 'Name', value: commonName },
      { label: 'Type', value: inferRole(taxon) },
      observedIn && { label: 'Observed in', value: observedIn }
    ]);
  }

  async function fetchWithTimeout(url, ms) {
    const ctrl = new AbortController();
    const id = setTimeout(() => ctrl.abort(), ms);
    try {
      const res = await fetch(url, { signal: ctrl.signal });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return await res.json();
    } finally {
      clearTimeout(id);
    }
  }

  async function loadFact() {
    factRefresh.classList.add('spinning');
    try {
      const MAX_TRIES = 4;
      for (let attempt = 0; attempt < MAX_TRIES; attempt++) {
        const obsUrl = 'https://api.inaturalist.org/v1/observations' +
          '?photos=true&quality_grade=research&geo=true' +
          '&iconic_taxa=Plantae,Insecta,Aves' +
          '&swlat=51.3&swlng=-10.7&nelat=55.4&nelng=-5.4' +
          '&order_by=random&per_page=50';

        const obsData = await fetchWithTimeout(obsUrl, 8000);
        const usable = (obsData.results || []).filter((o) => {
          if (!o.taxon || !o.taxon.id || !o.photos || o.photos.length === 0) return false;
          if (!['Plantae', 'Insecta', 'Aves'].includes(o.taxon.iconic_taxon_name)) return false;
          return Boolean(observedPlace(o));
        });
        if (usable.length === 0) continue;

        const shuffled = usable.sort(() => Math.random() - 0.5);
        for (let i = 0; i < Math.min(5, shuffled.length); i++) {
          const obs = shuffled[i];
          try {
            const taxonData = await fetchWithTimeout(
              'https://api.inaturalist.org/v1/taxa/' + obs.taxon.id, 6000
            );
            const full = taxonData.results && taxonData.results[0];
            if (!full || !full.wikipedia_summary) continue;

            const commonName = full.preferred_common_name ||
              obs.taxon.preferred_common_name || full.name;
            if (!commonName) continue;

            const photo = obs.photos[0];
            const photoUrl = photo.url.replace(/\/square\./, '/medium.');
            const fact = trimToSentences(full.wikipedia_summary);
            const wikiUrl = full.wikipedia_url || 'https://www.inaturalist.org/taxa/' + full.id;
            const quickFacts = buildQuickFacts(full, obs);

            render(commonName, fact, photoUrl, wikiUrl, quickFacts, {
              photoCredit: photo.attribution || obs.user?.login || '',
              license: photo.license_code || ''
            });
            return;
          } catch (innerErr) {
            console.warn('Taxon fetch failed:', innerErr);
          }
        }
      }
      throw new Error('No suitable species found');
    } catch (err) {
      console.error('iNaturalist load failed:', err);
      const item = FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)];
      render(item.name, item.fact, item.image, item.url, item.quickFacts, item.meta);
    } finally {
      factRefresh.classList.remove('spinning');
    }
  }

  factRefresh.addEventListener('click', loadFact);

  // Paint a fallback instantly, then try to load a live fact.
  render(
    FALLBACKS[0].name,
    FALLBACKS[0].fact,
    FALLBACKS[0].image,
    FALLBACKS[0].url,
    FALLBACKS[0].quickFacts,
    FALLBACKS[0].meta
  );
  loadFact();
})();

/* ───────────── Honeycomb scroll-triggered entry ───────────── */
(function () {
  const honeycomb = document.querySelector('.honeycomb');
  if (!honeycomb) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion || !('IntersectionObserver' in window)) {
    honeycomb.classList.add('in-view');
    return;
  }

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        honeycomb.classList.add('in-view');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -10% 0px' });

  observer.observe(honeycomb);
})();

/* ───────────── "Did you know?" section — fade in from the left on scroll ───────────── */
(function () {
  const section = document.querySelector('.fact-section');
  if (!section) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion || !('IntersectionObserver' in window)) {
    section.classList.add('is-revealed');   // no animation: just show it
    return;
  }

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        section.classList.add('is-revealed');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2, rootMargin: '0px 0px -10% 0px' });

  observer.observe(section);
})();

/* ───────────── "Learn more" arrow nudge on click ───────────── */
document.querySelector('.learn-more')?.addEventListener('click', (e) => {
  const arrow = e.currentTarget.querySelector('.arrow');
  arrow?.animate(
    [{ transform: 'translateX(0)' }, { transform: 'translateX(8px)' }, { transform: 'translateX(0)' }],
    { duration: 400, easing: 'ease-out' }
  );
});

/* ───────────── Quote rotator ───────────── */
(function () {
  const quotes = [
    { text: 'We may rebuild our cathedrals and our castles, but we cannot rebuild a meadow once it is lost.', author: 'John Feehan, Irish ecologist & author' },
    { text: 'The bog is more than a landscape: it is the slowest archive we have, and what we lose from it we lose forever.', author: 'Tim Robinson, Irish writer & cartographer' },
    { text: "Ireland's hedgerows are our linear forests. They thread the country together, and if we let them go, the country comes apart.", author: 'Éanna Ní Lamhna, Irish biologist & broadcaster' },
    { text: 'Pollinators ask very little of us: a strip of clover, a corner left unmown, a single native tree. That is all it takes to begin.', author: 'All-Ireland Pollinator Plan' },
    { text: 'We have inherited a wild Ireland of great beauty. We must hand it on richer than we found it.', author: 'Michael Viney, Irish Times nature columnist' }
  ];

  const content = document.querySelector('.quote-content');
  const textEl = document.querySelector('.quote-text');
  const authorEl = document.querySelector('.quote-author');
  const section = document.querySelector('.quote-section');
  if (!content || !textEl || !authorEl) return;

  const FADE_MS = 450;
  const ROTATE_MS = 7000;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let current = 0;
  let intervalId = null;
  let isAnimating = false;

  function show(index) {
    if (isAnimating || index === current) return;
    isAnimating = true;
    current = index;

    const swap = () => {
      textEl.textContent = quotes[index].text;
      authorEl.innerHTML = '&ndash; ' + quotes[index].author;
    };

    if (reduceMotion) { swap(); isAnimating = false; return; }

    content.classList.add('is-fading');
    setTimeout(() => {
      swap();
      content.classList.remove('is-fading');
      setTimeout(() => { isAnimating = false; }, FADE_MS);
    }, FADE_MS);
  }

  function next() { show((current + 1) % quotes.length); }
  function start() { stop(); intervalId = setInterval(next, ROTATE_MS); }
  function stop() { if (intervalId) { clearInterval(intervalId); intervalId = null; } }

  section?.addEventListener('mouseenter', stop);
  section?.addEventListener('mouseleave', start);

  start();
})();

/* ───────────── B Corridor interactive trail map (Leaflet) ───────────── */
(function () {
  const mapEl = document.getElementById('bcorridor-map');
  if (!mapEl) return;

  if (!window.L) {
    console.error('[B Corridor map] Leaflet failed to load.');
    mapEl.innerHTML =
      '<div style="display:flex;align-items:center;justify-content:center;height:100%;' +
      'padding:24px;text-align:center;font-family:var(--font-body);color:var(--forest);">' +
      'Map could not load. Please check your internet connection.</div>';
    return;
  }

  /* Stop coordinates (from the project KMZ). */
  const stops = [
    {
      num: 1,
      coords: [52.2532157, -7.0999275],
      name: 'Churchyard',
      fullName: 'St Joseph & St Benildus Catholic Church',
      subtitle: 'Pollinator patch',
      info: "Trailhead. Follow the churchyard's example by creating a pollinator patch with flowers rich in pollen and nectar.",
      image: 'assets/stop-churchyard.webp',
      imageAlt: 'Pollinator patch in the churchyard',
      why: 'Pollinator patches create stepping stones of nectar for bees, butterflies and hoverflies across the city.'
    },
    {
      num: 2,
      coords: [52.251957, -7.0796828],
      name: 'River Oaks',
      fullName: 'River Walk Oaks',
      subtitle: 'Native trees',
      info: 'A single oak can support hundreds of insects, birds, mammals, lichens and mosses. Collect acorns in autumn to plant new oaks.',
      image: 'assets/stop-riveroaks.webp',
      imageAlt: 'Native oak by the river walk',
      why: 'Native oaks are biodiversity powerhouses, feeding and sheltering wildlife through every season.'
    },
    {
      num: 3,
      coords: [52.2519308, -7.0764212],
      name: 'Meadow',
      fullName: 'Maypark Meadow',
      subtitle: 'No-mow habitat',
      info: "Letting grass grow long is one of the simplest ways to help biodiversity. Try 'No Mow May' in your own garden.",
      image: 'assets/stop-meadow.webp',
      imageAlt: 'Wildflower meadow with long grass',
      why: 'No-mow meadows give insects food, shelter and safe movement between larger habitats.'
    },
    {
      num: 4,
      coords: [52.2541474, -7.0733957],
      name: 'River Suir',
      fullName: 'River Suir bat-watching stretch',
      subtitle: 'Bat watching',
      info: 'Visit at dusk to see bats swooping over the trail. A single bat can eat thousands of insects in one night.',
      image: 'assets/stop-riversuir.webp',
      imageAlt: 'Bat over the River Suir at dusk',
      why: 'Healthy river edges create feeding corridors for bats and birds that rely on insects over the water.'
    },
    {
      num: 5,
      coords: [52.2491491, -7.0683746],
      name: 'Wild Bees',
      fullName: 'Ballinakill / Wild bee territory',
      subtitle: 'Nesting range',
      info: 'Look for wild bees along the trail. Many native bees stay close to their nest, so small connected habitats matter.',
      image: 'assets/stop-wildbees.webp',
      imageAlt: 'Wild bees on a hand',
      why: 'Small nesting and feeding places close together help wild bees travel, feed and reproduce.'
    },
    {
      num: 6,
      coords: [52.2368832, -7.0593174],
      name: 'Wetlands',
      fullName: 'Knockboy Wetlands',
      subtitle: 'Water wildlife',
      info: 'Wetlands support birds, mammals, frogs and countless insects. You can help by creating a pond in your garden, however small.',
      image: 'assets/stop-wetlands.webp',
      imageAlt: 'Seal in the wetlands',
      why: 'Wetlands slow water, support insects and provide safe cover for birds, amphibians and mammals.'
    }
  ];

  /* Warm the cache for every stop photo. They're only referenced from
     this script (not in the HTML), so the browser can't discover them
     up front — without this, the image visibly pops in the first time
     each stop is opened. Fetch them quietly in the background once the
     page is idle so switching stops is instant. */
  (function prefetchStopImages() {
    const warm = () => stops.forEach((s) => {
      if (s.image) { const img = new Image(); img.src = s.image; }
    });
    if ('requestIdleCallback' in window) {
      requestIdleCallback(warm, { timeout: 3000 });
    } else {
      window.addEventListener('load', () => setTimeout(warm, 600));
    }
  })();

  /* Route: through the stops, then on to St Mary's Church, Ballygunner. */
  const stMarysChurch = [52.2310221, -7.061961];
  const corridorRoute = [...stops.map((s) => s.coords), stMarysChurch];

  /* Corridor boundary polygon (from the project KMZ). */
  const corridorArea = [
    [52.25554, -7.0974779], [52.2553824, -7.1025419], [52.2541214, -7.1034003], [52.2520196, -7.1028853],
    [52.2477108, -7.0965338], [52.2466072, -7.0876932], [52.245924, -7.0833159], [52.2452409, -7.0803976],
    [52.2442949, -7.0765353], [52.2426657, -7.0744753], [52.2402481, -7.0713854], [52.2368842, -7.0659781],
    [52.2348342, -7.0638323], [52.2321007, -7.0652056], [52.2287363, -7.0648623], [52.228158, -7.05688],
    [52.2307865, -7.0549917], [52.2337303, -7.0577383], [52.2364637, -7.0562792], [52.2408262, -7.058425],
    [52.2430336, -7.0597983], [52.2461342, -7.0603133], [52.2473429, -7.0626307], [52.2482363, -7.0657206],
    [52.2498127, -7.0666647], [52.251862, -7.0666647], [52.2534909, -7.0664072], [52.2552773, -7.0672655],
    [52.2560654, -7.0688963], [52.2558552, -7.0721579], [52.2544892, -7.0771361], [52.2527553, -7.0828867],
    [52.2516518, -7.0860625], [52.2521247, -7.0924998], [52.2538587, -7.0955897], [52.25554, -7.0974779]
  ];

  const map = L.map('bcorridor-map', { scrollWheelZoom: false, tap: true });

  const STADIA_API_KEY = 'ab3ecc7e-fefb-4d3a-81f6-9c8fcda8432a';
  const stadiaQuery = STADIA_API_KEY ? '?api_key=' + encodeURIComponent(STADIA_API_KEY) : '';
  const stadiaAttribution = '&copy; <a href="https://www.stadiamaps.com/" target="_blank" rel="noopener">Stadia Maps</a> &copy; <a href="https://stamen.com/" target="_blank" rel="noopener">Stamen Design</a> &copy; <a href="https://openmaptiles.org/" target="_blank" rel="noopener">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors';

  const softTerrainLayer = L.tileLayer(
    'https://tiles.stadiamaps.com/tiles/stamen_terrain/{z}/{x}/{y}{r}.png' + stadiaQuery,
    {
      minZoom: 0,
      maxZoom: 18,
      detectRetina: true,
      className: 'map-tiles--soft-terrain',
      attribution: stadiaAttribution
    }
  );

  const aerialLayer = L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    {
      maxZoom: 19,
      className: 'map-tiles--aerial',
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community'
    }
  );

  softTerrainLayer.addTo(map);

  L.control.layers(
    {
      'Soft terrain': softTerrainLayer,
      'Aerial imagery': aerialLayer
    },
    null,
    { collapsed: true, position: 'topright' }
  ).addTo(map);

  /* Corridor area — dashed boundary with a subtle fill. Brown on the
     terrain map; switched to white over aerial imagery for contrast. */
  const corridorPolygon = L.polygon(corridorArea, {
    color: '#896c4b', weight: 2.4, dashArray: '8 6',
    fill: true, fillColor: '#896c4b', fillOpacity: 0.05, interactive: false
  }).addTo(map);

  function numberedIcon(n) {
    return L.divIcon({
      className: 'bcorridor-marker',
      html: '<div class="bcorridor-marker-pin"><span>' + n + '</span></div>',
      iconSize: [34, 34], iconAnchor: [17, 17], popupAnchor: [0, -20]
    });
  }

  const markersByStop = new Map();
  const mapPanel = document.getElementById('full-map');
  const stopButtons = Array.from(document.querySelectorAll('.stop-button[data-stop]'));
  const detailEl = document.getElementById('stop-detail');
  const detailClose = detailEl?.querySelector('[data-stop-close]');
  const detailHandle = detailEl?.querySelector('[data-stop-handle]');
  const detailEyebrow = detailEl?.querySelector('[data-stop-eyebrow]');
  const detailTitle = detailEl?.querySelector('[data-stop-title]');
  const detailSubtitle = detailEl?.querySelector('[data-stop-subtitle]');
  const detailInfo = detailEl?.querySelector('[data-stop-info]');
  const detailImage = detailEl?.querySelector('[data-stop-image]');
  const detailWhy = detailEl?.querySelector('[data-stop-why]');

  const prevButton = document.querySelector('[data-stop-prev]');
  const nextButton = document.querySelector('[data-stop-next]');
  let activeStopNumber = '1';

  stops.forEach((stop) => {
    const marker = L.marker(stop.coords, { icon: numberedIcon(stop.num), title: stop.num + '. ' + stop.fullName })
      .addTo(map);
    marker.stopNumber = String(stop.num);
    marker.on('click', () => {
      setActiveStop(String(stop.num), { focusMap: false });
    });
    markersByStop.set(String(stop.num), marker);
  });

  function updateStopDetail(stop) {
    if (!stop || !detailEl) return;
    if (detailEyebrow) detailEyebrow.textContent = 'Stop ' + String(stop.num).padStart(2, '0');
    if (detailTitle) detailTitle.textContent = stop.name;
    if (detailSubtitle) detailSubtitle.textContent = stop.subtitle;
    if (detailInfo) detailInfo.textContent = stop.info;
    if (detailImage) {
      detailImage.src = stop.image;
      detailImage.alt = stop.imageAlt || stop.name;
    }
    if (detailWhy) detailWhy.textContent = stop.why || '';
  }

  /* Show/hide the stop story panel. Toggling the panel changes the map
     column width, so Leaflet needs its size recalculated afterwards.
     On phones the panel is a bottom sheet that slides up and can be
     dragged down (or tapped via the × / handle) to dismiss. */
  const mqSheet = window.matchMedia('(max-width: 820px)');

  function syncMapSize() {
    requestAnimationFrame(() => { try { map.invalidateSize(); } catch (e) {} });
  }
  function isMobileMapSheet() {
    return mqSheet.matches || window.matchMedia('(pointer: coarse)').matches;
  }

  function openDetail() {
    if (!mapPanel) return;
    if (detailEl) {
      detailEl.hidden = false;
      detailEl.style.transition = '';
      detailEl.style.transform = '';
    }
    if (mapPanel.classList.contains('is-detail-open')) return;
    mapPanel.classList.add('is-detail-open');
    syncMapSize();
  }

  function closeDetail() {
    if (!mapPanel) return;
    if (mqSheet.matches && detailEl && mapPanel.classList.contains('is-detail-open')) {
      // slide the sheet down, then remove it from the layout
      detailEl.style.transition = 'transform .28s ease';
      detailEl.style.transform = 'translateY(100%)';
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        detailEl.removeEventListener('transitionend', finish);
        mapPanel.classList.remove('is-detail-open');
        detailEl.style.transition = '';
        detailEl.style.transform = '';
        detailEl.hidden = true;
        syncMapSize();
      };
      detailEl.addEventListener('transitionend', finish);
      setTimeout(finish, 360);   // fallback if transitionend never fires
    } else {
      mapPanel.classList.remove('is-detail-open');
      if (detailEl) {
        detailEl.style.transition = '';
        detailEl.style.transform = '';
        detailEl.hidden = true;
      }
      syncMapSize();
    }
  }

  function maybeScrollToDetail() {
    // On phones the stop story is a fixed bottom sheet. Calling
    // scrollIntoView() on that sheet can make Mobile Safari jump down
    // to the stop-description DOM position, so only scroll on desktop.
    if (!mqSheet.matches) {
      detailEl?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }
  detailClose?.addEventListener('click', closeDetail);

  /* Drag-to-dismiss for the mobile bottom sheet.
     The sheet can be pulled down from ANYWHERE inside it — handle, photo,
     text, buttons — not just the grab handle. If the sheet's content is
     scrolled, downward swipes first scroll back to the top as usual, and
     only start pulling the sheet once scrollTop reaches 0. A simple tap
     (no movement) only closes the sheet when it lands on the handle. */
  (function setupSheetDrag() {
    if (!detailEl) return;
    let startY = 0, deltaY = 0, dragging = false, moved = false, fromHandle = false;

    function begin(y, viaHandle) {
      dragging = true; moved = false; deltaY = 0;
      startY = y; fromHandle = viaHandle;
      detailEl.style.transition = 'none';
    }

    function track(y, e) {
      if (!dragging) return;
      const dy = y - startY;
      if (!fromHandle) {
        // From the sheet body: only start pulling when the content is
        // scrolled to the top and the finger moves downward. Otherwise
        // keep re-anchoring so native scrolling works untouched.
        if (detailEl.scrollTop > 0 || (dy <= 0 && deltaY === 0)) {
          startY = y;
          return;
        }
      }
      deltaY = Math.max(0, dy);
      if (deltaY > 3) moved = true;
      if (deltaY > 0 && e && e.cancelable) e.preventDefault();   // stop scroll while pulling
      detailEl.style.transform = 'translateY(' + deltaY + 'px)';
    }

    function finish() {
      if (!dragging) return;
      dragging = false;
      detailEl.style.transition = 'transform .28s ease';
      const threshold = Math.min(160, detailEl.offsetHeight * 0.28);
      if (deltaY > threshold) {
        closeDetail();                      // dragged far enough — dismiss
      } else if (!moved && fromHandle) {
        closeDetail();                      // a tap on the handle also closes
      } else {
        detailEl.style.transform = 'translateY(0)';   // snap back
      }
      deltaY = 0;
    }

    /* Grab handle — pointer events with capture, as before. */
    if (detailHandle) {
      detailHandle.addEventListener('pointerdown', (e) => {
        if (!mqSheet.matches) return;
        begin(e.clientY, true);
        try { detailHandle.setPointerCapture(e.pointerId); } catch (err) {}
      });
      detailHandle.addEventListener('pointermove', (e) => track(e.clientY, e));
      detailHandle.addEventListener('pointerup', finish);
      detailHandle.addEventListener('pointercancel', finish);
    }

    /* Whole sheet — touch events so dragging works from any point. */
    detailEl.addEventListener('touchstart', (e) => {
      if (!mqSheet.matches) return;
      if (e.target.closest('[data-stop-handle]')) return;   // handle uses pointer logic above
      begin(e.touches[0].clientY, false);
    }, { passive: true });
    detailEl.addEventListener('touchmove', (e) => {
      if (!dragging) return;
      track(e.touches[0].clientY, e);
    }, { passive: false });
    detailEl.addEventListener('touchend', finish);
    detailEl.addEventListener('touchcancel', finish);
  })();

  function setActiveStop(stopNumber, options = {}) {
    const stop = stops.find((s) => String(s.num) === String(stopNumber));
    if (!stop) return;
    activeStopNumber = String(stopNumber);
    stopButtons.forEach((b) => {
      const isActive = b.dataset.stop === String(stopNumber);
      b.classList.toggle('is-active', isActive);
      b.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      if (isActive && options.scrollStrip !== false) b.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    });
    markersByStop.forEach((marker, num) => {
      if (marker._icon) marker._icon.classList.toggle('is-active', num === String(stopNumber));
    });
    updateStopDetail(stop);
    if (options.open !== false) openDetail();
    if (options.focusMap !== false) {
      const marker = markersByStop.get(String(stopNumber));
      if (marker) map.flyTo(marker.getLatLng(), 15, { duration: 0.65 });
    }
  }

  stopButtons.forEach((button) => {
    button.setAttribute('aria-pressed', button.classList.contains('is-active') ? 'true' : 'false');
    button.addEventListener('click', () => {
      setActiveStop(button.dataset.stop);
      maybeScrollToDetail();
    });
  });

  function moveStop(delta) {
    const currentIndex = stops.findIndex((s) => String(s.num) === String(activeStopNumber));
    const nextIndex = (currentIndex + delta + stops.length) % stops.length;
    const nextStop = stops[nextIndex];
    setActiveStop(String(nextStop.num));
    maybeScrollToDetail();
  }

  prevButton?.addEventListener('click', () => moveStop(-1));
  nextButton?.addEventListener('click', () => moveStop(1));

  // Preselect the trailhead stop and fill its card, but keep the story
  // panel CLOSED on every device — the header invites the visitor to
  // "tap a marker or stop card to open its story", so nothing should
  // pop up on its own when the page loads.
  setActiveStop('1', { focusMap: false, open: false, scrollStrip: false });
  closeDetail();
  // If the page is restored from the back/forward cache (common on
  // mobile), make sure the sheet is closed again.
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) closeDetail();
  });

  map.fitBounds(L.latLngBounds(corridorArea), { padding: [30, 30] });
  // on phones the fit-to-corridor zoom reads as too far out — pull in one step
  if (window.matchMedia('(max-width: 640px)').matches) {
    map.setZoom(map.getZoom() + 1);
  }

  /* Remember the initial view and add a "reset view" button to the map. */
  const homeCenter = map.getCenter();
  const homeZoom = map.getZoom();
  const resetControl = L.control({ position: 'topleft' });
  resetControl.onAdd = function () {
    const wrap = L.DomUtil.create('div', 'leaflet-bar map-reset-control');
    const btn = L.DomUtil.create('a', 'map-reset-button', wrap);
    btn.href = '#';
    btn.title = 'Reset map view';
    btn.setAttribute('role', 'button');
    btn.setAttribute('aria-label', 'Reset map to initial view');
    btn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M3 12a9 9 0 1 0 3-6.7"/><polyline points="3 4 3 9 8 9"/></svg>';
    L.DomEvent.disableClickPropagation(wrap);
    L.DomEvent.on(btn, 'click', function (e) {
      L.DomEvent.stop(e);
      map.flyTo(homeCenter, homeZoom, { duration: 0.6 });
    });
    return wrap;
  };
  resetControl.addTo(map);

  /* Route line: try OSRM walking directions so it follows streets;
     fall back to straight segments if routing is unavailable. */
  const routeStyle = { color: '#896c4b', weight: 5, opacity: 0.95, dashArray: '1 10', lineCap: 'round', lineJoin: 'round' };
  let lineColor = '#896c4b';        // brown on terrain, white over aerial imagery
  let routeLayer = L.polyline(corridorRoute, routeStyle).addTo(map);

  /* Over aerial imagery the brown dotted route and dashed boundary are
     nearly invisible — switch them to white, and back to brown on terrain. */
  map.on('baselayerchange', (e) => {
    lineColor = (e.layer === aerialLayer) ? '#ffffff' : '#896c4b';
    corridorPolygon.setStyle({ color: lineColor, fillColor: lineColor });
    routeLayer.setStyle({ color: lineColor });
  });

  (async function fetchStreetRoute() {
    // the straight `corridorRoute` line is already drawn above; we only swap it
    // for the street-following geometry if OSRM responds in time.
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const coordStr = corridorRoute.map((c) => c[1] + ',' + c[0]).join(';');
      const url = 'https://router.project-osrm.org/route/v1/foot/' + coordStr + '?overview=full&geometries=geojson';
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      if (data && data.code === 'Ok' && data.routes && data.routes[0]) {
        const path = data.routes[0].geometry.coordinates.map((c) => [c[1], c[0]]);
        map.removeLayer(routeLayer);
        routeLayer = L.polyline(path, Object.assign({}, routeStyle, { color: lineColor })).addTo(map);
      }
    } catch (err) {
      console.warn('[B Corridor map] OSRM routing unavailable, keeping straight-line route:', err);
    } finally {
      clearTimeout(timeout);
    }
  })();

/* (trail download/print removed — replaced by an "Open in Google Maps" link) */

  // Mission polaroid carousel — cycle which image sits in the featured slot
  (() => {
    const group = document.querySelector('.mission-illustration');
    if (!group) return;
    const polaroids = Array.from(group.querySelectorAll('.polaroid'));
    if (polaroids.length < 2) return;

    const SLOTS = ['is-slot-1', 'is-slot-2', 'is-slot-3'];
    const initialMap = {
      'polaroid--main':   'is-slot-1',
      'polaroid--coast':  'is-slot-2',
      'polaroid--flower': 'is-slot-3',
    };
    polaroids.forEach((p) => {
      for (const [mod, slot] of Object.entries(initialMap)) {
        if (p.classList.contains(mod)) p.classList.add(slot);
      }
    });

    // Video polaroids are user-triggered. The play button sits over the
    // clip and the video can only start while its card is the uncovered,
    // top-most one (is-slot-3, the highest z-index slot). When a card is
    // covered by another it pauses and the play button reappears. The
    // user can also tap the clip itself to pause/resume it.
    const UNCOVERED_SLOT = 'is-slot-3';
    const isUncovered = (p) => p.classList.contains(UNCOVERED_SLOT);
    const playVideo = (video) => {
      const play = video.play();
      if (play && typeof play.catch === 'function') play.catch(() => {});
    };

    const syncVideos = () => {
      polaroids.forEach((p) => {
        const video = p.querySelector('video');
        const btn = p.querySelector('.polaroid-play');
        if (!video || !btn) return;
        if (!isUncovered(p)) video.pause();
        btn.hidden = !(isUncovered(p) && video.paused);
      });
    };

    polaroids.forEach((p) => {
      const video = p.querySelector('video');
      const btn = p.querySelector('.polaroid-play');
      if (!video || !btn) return;
      btn.addEventListener('click', () => playVideo(video));
      // Tap the clip to toggle: pause anytime, resume only while uncovered.
      video.addEventListener('click', () => {
        if (video.paused) {
          if (isUncovered(p)) playVideo(video);
        } else {
          video.pause();
        }
      });
      video.addEventListener('play', () => { btn.hidden = true; });
      video.addEventListener('pause', syncVideos);
    });

    const rotate = (dir) => {
      const current = polaroids.map((p) => SLOTS.findIndex((s) => p.classList.contains(s)));
      polaroids.forEach((p, i) => {
        p.classList.remove(...SLOTS);
        const next = (current[i] + dir + SLOTS.length) % SLOTS.length;
        p.classList.add(SLOTS[next]);
      });
      syncVideos();
    };

    syncVideos();

    group.querySelector('.polaroid-nav--prev')?.addEventListener('click', () => rotate(-1));
    group.querySelector('.polaroid-nav--next')?.addEventListener('click', () => rotate(1));
  })();
})();

/* ───────────── "A Connected Landscape" — fit on one line ─────────────
   The heading must stay on a single line at the standard heading size,
   shrinking only as much as the device actually requires. Measuring the
   rendered text (rather than guessing from font metrics) works for any
   viewport and also while fallback fonts are showing. */
(function fitLandscapeHeading() {
  const h2 = document.querySelector('.landscape-copy h2');
  if (!h2) return;

  function fit() {
    h2.style.fontSize = '';                       // back to the stylesheet size
    const container = h2.closest('.landscape-inner') || h2.parentElement;
    const available = Math.min(h2.clientWidth || Infinity, container.clientWidth);
    const needed = h2.scrollWidth;
    if (needed > available && needed > 0) {
      const current = parseFloat(getComputedStyle(h2).fontSize);
      const next = Math.max(16, current * (available / needed) * 0.97);
      h2.style.fontSize = next.toFixed(2) + 'px';
    }
  }

  fit();
  window.addEventListener('resize', fit);
  window.addEventListener('orientationchange', fit);
  window.addEventListener('load', fit);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
})();

/* ───────────── CMS article blocks: video embeds + image carousels ─────────────
   Generated news pages may contain:
     <div class="article-embed" data-embed="https://www.youtube.com/embed/…"></div>
     <div class="article-carousel"><img><img>…</div>
   This enhances them in the browser. Guarded — no-ops on pages without them. */
(function enhanceArticleBlocks() {
  // video embeds
  document.querySelectorAll('.article-embed[data-embed]').forEach((el) => {
    const url = el.getAttribute('data-embed');
    if (!url || el.querySelector('iframe')) return;
    const f = document.createElement('iframe');
    f.src = url;
    f.loading = 'lazy';
    f.title = 'Video';
    f.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    f.allowFullscreen = true;
    el.appendChild(f);
  });

  // image carousels
  document.querySelectorAll('.article-carousel').forEach((car) => {
    const imgs = Array.from(car.querySelectorAll(':scope > img'));
    if (imgs.length < 2) return; // single image: leave stacked
    car.classList.add('is-ready');

    const track = document.createElement('div');
    track.className = 'article-carousel__track';
    imgs.forEach((im) => {
      const slide = document.createElement('div');
      slide.className = 'article-carousel__slide';
      slide.appendChild(im);
      const cap = im.getAttribute('data-caption');
      if (cap) {
        const c = document.createElement('div');
        c.className = 'article-carousel__caption';
        c.textContent = cap;
        slide.appendChild(c);
      }
      track.appendChild(slide);
    });
    car.innerHTML = '';
    car.appendChild(track);

    let idx = 0;
    const dotsWrap = document.createElement('div');
    dotsWrap.className = 'article-carousel__dots';
    const dots = imgs.map((_, i) => {
      const d = document.createElement('button');
      d.type = 'button';
      d.className = 'article-carousel__dot';
      d.setAttribute('aria-label', 'Image ' + (i + 1));
      d.addEventListener('click', () => go(i));
      dotsWrap.appendChild(d);
      return d;
    });
    function go(n) {
      idx = (n + imgs.length) % imgs.length;
      track.style.transform = `translateX(-${idx * 100}%)`;
      dots.forEach((d, i) => d.classList.toggle('is-active', i === idx));
    }
    [['prev', '‹', 'Previous image', -1], ['next', '›', 'Next image', 1]].forEach(([cls, txt, label, dir]) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'article-carousel__nav article-carousel__nav--' + cls;
      b.setAttribute('aria-label', label);
      b.textContent = txt;
      b.addEventListener('click', () => go(idx + dir));
      car.appendChild(b);
    });
    car.appendChild(dotsWrap);

    let startX = null;
    track.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; }, { passive: true });
    track.addEventListener('touchend', (e) => {
      if (startX == null) return;
      const dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 40) go(idx + (dx < 0 ? 1 : -1));
      startX = null;
    });

    go(0);
  });
})();

/* ───────────── News page: category filter + real pagination ─────────────
   Cards carry data-category; tabs/sidebar carry data-filter. Shows 3 posts
   per page; page buttons are generated only for pages that exist, Prev/Next
   work, and the "…" jumps. Guarded — only runs on the News page. */
(function newsFilterPagination() {
  const grid = document.querySelector('.blog-posts');
  if (!grid) return;
  const cards = Array.from(grid.querySelectorAll('.post-card[data-category]'));
  if (!cards.length) return;

  const PAGE_SIZE = 3;
  const triggers = Array.from(document.querySelectorAll('.blog-filter__item[data-filter], .cat-link[data-filter]'));
  const pager = grid.querySelector('.blog-pagination');

  // live counts in the sidebar/tabs
  const counts = { all: cards.length };
  cards.forEach((c) => { const k = c.getAttribute('data-category'); if (k) counts[k] = (counts[k] || 0) + 1; });
  document.querySelectorAll('[data-count]').forEach((el) => { el.textContent = counts[el.getAttribute('data-count')] || 0; });

  const empty = document.createElement('p');
  empty.className = 'post-empty-filter';
  empty.textContent = 'No posts in this category yet.';
  empty.style.display = 'none';
  if (pager) grid.insertBefore(empty, pager); else grid.appendChild(empty);

  let filter = 'all';
  let page = 1;

  const filtered = () => cards.filter((c) => filter === 'all' || c.getAttribute('data-category') === filter);

  // which page tokens to show: 1, …, current-1, current, current+1, …, last
  function pageItems(current, total) {
    const wanted = [...new Set([1, total, current - 1, current, current + 1])]
      .filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
    const items = [];
    wanted.forEach((p, i) => {
      items.push({ type: 'page', n: p });
      if (i < wanted.length - 1) {
        const gap = wanted[i + 1] - p;
        if (gap === 2) items.push({ type: 'page', n: p + 1 });
        else if (gap > 2) items.push({ type: 'gap', jump: Math.round((p + wanted[i + 1]) / 2) });
      }
    });
    return items;
  }

  function btn(cls, html, label, onClick, active) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = cls;
    b.innerHTML = html;
    if (label) b.setAttribute('aria-label', label);
    if (active) { b.classList.add('is-active'); b.setAttribute('aria-current', 'page'); }
    b.addEventListener('click', onClick);
    pager.appendChild(b);
  }

  function renderPager(total) {
    if (!pager) return;
    pager.innerHTML = '';
    if (total <= 1) { pager.hidden = true; return; }
    pager.hidden = false;
    if (page > 1) btn('blog-pagination__nav', '&lsaquo; Prev', 'Previous page', () => goTo(page - 1));
    pageItems(page, total).forEach((it) => {
      if (it.type === 'page') btn('blog-pagination__page', String(it.n), 'Page ' + it.n, () => goTo(it.n), it.n === page);
      else btn('blog-pagination__ellipsis', '&hellip;', 'Jump to page ' + it.jump, () => goTo(it.jump));
    });
    if (page < total) btn('blog-pagination__nav', 'Next &rsaquo;', 'Next page', () => goTo(page + 1));
  }

  function render(scroll) {
    const list = filtered();
    const total = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
    page = Math.min(Math.max(page, 1), total);
    const start = (page - 1) * PAGE_SIZE;

    cards.forEach((c) => { c.style.display = 'none'; });
    list.slice(start, start + PAGE_SIZE).forEach((c) => { c.style.display = ''; });

    empty.style.display = list.length === 0 ? '' : 'none';
    triggers.forEach((t) => t.classList.toggle('is-active', t.getAttribute('data-filter') === filter));
    renderPager(total);

    if (scroll) (document.querySelector('.blog-filter') || grid).scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function goTo(p) { page = p; render(true); }
  function setFilter(f) { filter = f; page = 1; render(true); }

  triggers.forEach((t) => t.addEventListener('click', (e) => { e.preventDefault(); setFilter(t.getAttribute('data-filter')); }));

  render(false);
})();
