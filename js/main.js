/* ==========================================================
   Your works — replace src/alt with your own images later.
   (Unsplash placeholders are used for now.)
   ========================================================== */
const projectImages = [
  { src: 'images/salon-1.jpg', alt: 'Салон красоты — главный экран', group: 'salon' },
  { src: 'images/salon-2.jpg', alt: 'Салон красоты — преимущества', group: 'salon' },
  { src: 'images/salon-3.jpg', alt: 'Салон красоты — услуги', group: 'salon' },
  { src: 'images/salon-4.jpg', alt: 'Салон красоты — адреса', group: 'salon' },
  { src: 'images/salon-5.jpg', alt: 'Салон красоты — бренды и контакты', group: 'salon' },
  { src: 'images/infographics-1.jpg', alt: 'Инфографика — главная', group: 'infographics' },
  { src: 'images/infographics-2.jpg', alt: 'Инфографика — эволюция iPhone', group: 'infographics' },
  { src: 'images/infographics-3.jpg', alt: 'Инфографика — постеры в интерьере', group: 'infographics' },
  { src: 'images/infographics-4.jpg', alt: 'Инфографика — история Figma', group: 'infographics' },
  { src: 'images/posters-1.jpg', alt: 'Постеры — мини-коллекция', group: 'posters' },
  { src: 'images/posters-2.jpg', alt: 'Постеры — архитектурная серия', group: 'posters' },
  { src: 'images/posters-3.jpg', alt: 'Постер Construction — крупно', group: 'posters' },
  { src: 'images/posters-4.jpg', alt: 'Постеры — цветовые варианты', group: 'posters' },
];

const projectGroups = {
  salon: { title: 'Сайт салона красоты', text: 'Премиальный сайт: услуги, мастера, адреса и онлайн-запись.' },
  infographics: { title: 'Инфографика', text: 'Большие визуальные истории: от эволюции iPhone до истории Figma.' },
  posters: { title: 'Постеры', text: 'Серия архитектурных постеров и их цветовые варианты.' },
};

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const lerp = (a, b, t) => a + (b - a) * t;
const isMobile = () => window.matchMedia('(max-width: 768px)').matches;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ==========================================================
   1. HERO — infinite belt on the inside of a 3D cylinder
   Each tile = 16 vertical slices. A slice at belt position s
   (px from centre) gets angle θ = s / R:
       transform: rotateY(-θ) translateZ(-R)
   The stage is pushed forward by R so the centre is at z = 0.
   ========================================================== */
const SLICES = 16;
const SPEED = 55;      // px per second, right → left
const GAP = 22;        // px between tiles
const MAX_ANGLE = 1.2; // rad of belt kept alive on each side (~69°)

const cylinder = document.querySelector('[data-cylinder]');
const stage = document.querySelector('[data-cylinder-stage]');

const belt = {
  tiles: [], R: 0, tw: 0, th: 0, sw: 0, pitch: 0, length: 0, visible: true,
};

const imageAt = (seq) => projectImages[((seq % projectImages.length) + projectImages.length) % projectImages.length];

// natural aspect ratios, loaded once, so tiles can "cover" without stretching
const ratios = new Map();
function loadRatio(src) {
  if (ratios.has(src)) return;
  ratios.set(src, 0);
  const img = new Image();
  img.onload = () => {
    ratios.set(src, img.naturalWidth / img.naturalHeight);
    belt.tiles.filter((t) => imageAt(t.seq).src === src).forEach(setTileImage);
  };
  img.src = src;
}
projectImages.forEach((p) => loadRatio(p.src));

function setTileImage(tile) {
  const item = imageAt(tile.seq);
  const ratio = ratios.get(item.src) || belt.tw / belt.th;
  const tileRatio = belt.tw / belt.th;
  let w = belt.tw, h = belt.th;
  if (ratio > tileRatio) w = belt.th * ratio; else h = belt.tw / ratio;   // cover
  const ox = (belt.tw - w) / 2;
  const oy = 0;                                                            // keep the top of each page visible
  const url = `url("${item.src}")`;
  tile.slices.forEach((slice, k) => {
    slice.style.backgroundImage = url;
    slice.style.backgroundSize = `${w}px ${h}px`;
    slice.style.backgroundPosition = `${ox - k * belt.sw}px ${oy}px`;
  });
}

function buildBelt() {
  const W = cylinder.clientWidth;
  if (!W) return;
  const mobile = isMobile();

  // Softer curve on mobile: bigger radius + more distant camera
  belt.R = mobile ? W * 1.15 : W * 0.62;
  cylinder.style.perspective = `${belt.R * (mobile ? 2.6 : 1.7)}px`;

  belt.tw = clamp(W * (mobile ? 0.6 : 0.26), 200, 440);
  belt.th = Math.round(belt.tw * 0.625);
  belt.sw = belt.tw / SLICES;
  belt.pitch = belt.tw + GAP;

  const count = Math.max(6, Math.ceil((2 * MAX_ANGLE * belt.R) / belt.pitch));
  belt.length = count * belt.pitch;

  stage.textContent = '';
  stage.style.transform = `translateZ(${belt.R}px)`;
  belt.tiles = [];

  for (let i = 0; i < count; i++) {
    const tile = { seq: i, pos: -belt.length / 2 + (i + 0.5) * belt.pitch, slices: [] };
    for (let k = 0; k < SLICES; k++) {
      const el = document.createElement('div');
      el.className = 'slice' + (k === 0 ? ' slice--first' : '') + (k === SLICES - 1 ? ' slice--last' : '');
      el.style.left = `${-belt.sw / 2}px`;
      el.style.top = `${-belt.th / 2}px`;
      el.style.width = `${belt.sw + 1}px`;           // +1px overlap hides seams
      el.style.height = `${belt.th}px`;
      stage.appendChild(el);
      tile.slices.push(el);
    }
    setTileImage(tile);
    belt.tiles.push(tile);
  }
  renderBelt();
}

function renderBelt() {
  const { R, sw, tw } = belt;
  for (const tile of belt.tiles) {
    for (let k = 0; k < SLICES; k++) {
      const s = tile.pos + (k + 0.5) * sw - tw / 2;  // arc position of this slice
      const theta = s / R;
      const el = tile.slices[k];
      if (Math.abs(theta) > 1.45) { el.style.visibility = 'hidden'; continue; }
      el.style.visibility = 'visible';
      el.style.transform = `rotateY(${(-theta).toFixed(4)}rad) translateZ(${-R}px)`;
    }
  }
}

function stepBelt(dt) {
  const half = belt.length / 2;
  for (const tile of belt.tiles) {
    tile.pos -= SPEED * dt;
    // tile fully out of view on the left → jump to the right end, show the next image
    if (tile.pos < -half) {
      tile.pos += belt.length;
      tile.seq += belt.tiles.length;
      setTileImage(tile);
    }
  }
  renderBelt();
}

let lastTime = 0;
function beltLoop(now) {
  const dt = Math.min(0.05, (now - lastTime) / 1000 || 0);
  lastTime = now;
  if (belt.visible && !document.hidden) stepBelt(dt);
  requestAnimationFrame(beltLoop);
}

if (cylinder && stage) {
  new ResizeObserver(buildBelt).observe(cylinder);
  new IntersectionObserver(([e]) => { belt.visible = e.isIntersecting; }).observe(cylinder);
  buildBelt();
  if (!reduceMotion) requestAnimationFrame(beltLoop);
}

/* ==========================================================
   2. SCROLL — card tilts from rotateX(20deg) to flat
   ========================================================== */
const section = document.querySelector('[data-scroll-stage]');
const card = document.querySelector('[data-scroll-card]');
const header = document.querySelector('[data-scroll-header]');

let target = 0;
let current = 0;
let scrollRaf = 0;

function readScroll() {
  const vh = window.innerHeight;
  const top = section.getBoundingClientRect().top;
  // 0 when the card top enters the bottom of the screen, 1 when it reaches 25% from the top
  target = clamp((vh - top) / (vh * 0.75), 0, 1);
  if (!scrollRaf) scrollRaf = requestAnimationFrame(tickScroll);
}

function applyScroll(p) {
  const mobile = isMobile();
  const rx = mobile ? 10 : 20;
  const s0 = mobile ? 0.88 : 0.9;
  card.style.setProperty('--rx', `${(rx * (1 - p)).toFixed(2)}deg`);
  card.style.setProperty('--s', lerp(s0, 1, p).toFixed(4));
  card.style.setProperty('--ty', `${lerp(60, -20, p).toFixed(1)}px`);
  header.style.setProperty('--header-y', `${(-40 * p).toFixed(1)}px`);
}

function tickScroll() {
  current = reduceMotion ? target : lerp(current, target, 0.14);
  if (Math.abs(target - current) < 0.0005) current = target;
  applyScroll(current);
  scrollRaf = current === target ? 0 : requestAnimationFrame(tickScroll);
}

if (section && card) {
  window.addEventListener('scroll', readScroll, { passive: true });
  window.addEventListener('resize', readScroll);
  current = target = 0;
  readScroll();
}

/* ---------- Project switcher inside the card ---------- */
const mainImg = document.querySelector('[data-card-image]');
const titleEl = document.querySelector('[data-card-title]');
const thumbsEl = document.querySelector('[data-card-thumbs]');

let currentProject = -1;
function selectProject(i) {
  const item = projectImages[i];
  const first = currentProject === -1;
  currentProject = i;
  titleEl.textContent = item.alt;
  thumbsEl.querySelectorAll('.thumb').forEach((t, n) => t.setAttribute('aria-selected', String(n === i)));
  const swap = () => {
    mainImg.src = item.src;
    mainImg.alt = item.alt;
    mainImg.classList.remove('is-out');
  };
  if (first || reduceMotion) return swap();
  mainImg.classList.add('is-out');                 // fade + slight zoom out, then swap
  setTimeout(swap, 220);
}

if (mainImg && thumbsEl) {
  projectImages.forEach((item, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'thumb';
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-label', item.alt);
    btn.innerHTML = `<img src="${item.src}" alt="" loading="lazy">`;
    btn.addEventListener('click', () => selectProject(i));
    thumbsEl.appendChild(btn);
  });
  selectProject(0);
}

/* ==========================================================
   3. GALLERY — grouped works, 3D hover tilt, reveal, lightbox
   ========================================================== */
const gallery = document.querySelector('[data-gallery]');
const lightbox = document.querySelector('[data-lightbox]');
const lbImg = document.querySelector('[data-lightbox-img]');
const lbCaption = document.querySelector('[data-lightbox-caption]');
let lbIndex = 0;

function openLightbox(i) {
  lbIndex = (i + projectImages.length) % projectImages.length;
  lbImg.src = projectImages[lbIndex].src;
  lbImg.alt = projectImages[lbIndex].alt;
  lbCaption.textContent = projectImages[lbIndex].alt;
  if (!lightbox.open) lightbox.showModal();
}

if (gallery && lightbox) {
  const canHover = window.matchMedia('(hover: hover)').matches && !reduceMotion;

  Object.entries(projectGroups).forEach(([key, info]) => {
    const block = document.createElement('div');
    block.className = 'work-group';
    block.innerHTML = `<div class="work-group__head"><h3>${info.title}</h3><p>${info.text}</p></div><div class="work-grid"></div>`;
    const grid = block.querySelector('.work-grid');

    projectImages.forEach((item, i) => {
      if (item.group !== key) return;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'work';
      btn.setAttribute('aria-label', `Открыть: ${item.alt}`);
      btn.innerHTML = `<span class="work__img"><img src="${item.src}" alt="${item.alt}" loading="lazy"></span><span class="work__caption">${item.alt}</span>`;
      btn.style.transitionDelay = `${(grid.children.length % 3) * 90}ms`;
      btn.addEventListener('click', () => openLightbox(i));

      if (canHover) {
        btn.addEventListener('pointermove', (e) => {
          const r = btn.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width - 0.5;
          const py = (e.clientY - r.top) / r.height - 0.5;
          btn.style.setProperty('--ry', `${(px * 12).toFixed(2)}deg`);
          btn.style.setProperty('--rx', `${(-py * 10).toFixed(2)}deg`);
          btn.style.setProperty('--gx', `${((px + 0.5) * 100).toFixed(1)}%`);
          btn.style.setProperty('--gy', `${((py + 0.5) * 100).toFixed(1)}%`);
        });
        btn.addEventListener('pointerleave', () => {
          btn.style.setProperty('--rx', '0deg');
          btn.style.setProperty('--ry', '0deg');
        });
      }
      grid.appendChild(btn);
    });
    gallery.appendChild(block);
  });

  // Reveal on scroll: cards rise and un-tilt once when they enter the viewport
  const works = gallery.querySelectorAll('.work');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    works.forEach((w) => w.classList.add('is-in'));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.1 });
    works.forEach((w) => io.observe(w));
  }

  // Lightbox controls
  document.querySelector('[data-lightbox-close]').addEventListener('click', () => lightbox.close());
  document.querySelector('[data-lightbox-prev]').addEventListener('click', () => openLightbox(lbIndex - 1));
  document.querySelector('[data-lightbox-next]').addEventListener('click', () => openLightbox(lbIndex + 1));
  lightbox.addEventListener('click', (e) => { if (e.target === lightbox) lightbox.close(); });
  lightbox.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') openLightbox(lbIndex - 1);
    if (e.key === 'ArrowRight') openLightbox(lbIndex + 1);
  });
}

/* ==========================================================
   4. Reveal for services / about + eagle tilt
   ========================================================== */
const revealEls = document.querySelectorAll('.reveal');
if (reduceMotion || !('IntersectionObserver' in window)) {
  revealEls.forEach((el) => el.classList.add('is-in'));
} else {
  const revealIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('is-in'); revealIO.unobserve(e.target); }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
  revealEls.forEach((el, i) => { el.style.transitionDelay = `${(i % 3) * 90}ms`; revealIO.observe(el); });
}

const tiltArt = document.querySelector('[data-tilt]');
if (tiltArt && !reduceMotion && window.matchMedia('(hover: hover)').matches) {
  tiltArt.addEventListener('pointermove', (e) => {
    const r = tiltArt.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    tiltArt.style.setProperty('--ry', `${(px * 16).toFixed(2)}deg`);
    tiltArt.style.setProperty('--rx', `${(-py * 14).toFixed(2)}deg`);
  });
  tiltArt.addEventListener('pointerleave', () => {
    tiltArt.style.setProperty('--rx', '0deg');
    tiltArt.style.setProperty('--ry', '0deg');
  });
}
