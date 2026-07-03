/* =========================================================
   WEDDING INVITATION — JAVASCRIPT
   Fixed: Video lag — heavy animations delayed until
   after intro video finishes playing
========================================================= */

'use strict';

// ─── Guest List ───────────────────────────────────────────
const GUEST_LIST = {
  '001': 'Kasun Perera',
  '002': 'Nimali Silva',
  '003': 'Tharaka Fernando',
  '004': 'Sachini Jayasinghe',
  '005': 'Pradeep Wijesinghe',
  '006': 'Dilshan Rajapaksha',
  '007': 'Thilini Wickramasinghe',
  '008': 'Ruwan Bandara',
  '009': 'Chamari Dissanayake',
  '010': 'Saman Kumara',
};

// ─── Wedding Date ─────────────────────────────────────────
const WEDDING_DATE = new Date('2026-11-15T18:00:00');

// ─── DOM Helper ───────────────────────────────────────────
const $ = (id) => document.getElementById(id);

// ─── Global References ────────────────────────────────────
const petalCanvas    = $('petalCanvas');
const sparkleCanvas  = $('sparkleCanvas');
const confettiCanvas = $('confettiCanvas');
const bgMusic        = $('localAudioPlayer');
const musicBtn       = $('musicBtn');

// ─── Resize throttle ──────────────────────────────────────
let resizeRAF = null;
window.addEventListener('resize', () => {
  if (resizeRAF) return;
  resizeRAF = requestAnimationFrame(() => {
    resizeRAF = null;
    onResize();
  });
});

/* =========================================================
   INITIALIZATION
   KEY: Only video + countdown start immediately.
   Petals, sparkles, butterflies start AFTER video ends.
   This gives video 100% CPU during playback.
========================================================= */
function init() {
  readGuestFromURL();
  setupIntroVideo();
  initCountdown(); // lightweight — safe to run immediately
}

/* =========================================================
   START HEAVY ANIMATIONS
   Called ONLY after intro video finishes
========================================================= */
function startHeavyAnimations() {
  initPetalSystem();
  initSparkleSystem();
  initButterflySystem();
  initScrollReveal();
  initMusicButton();
  initVideoSection();
}

/* =========================================================
   INTRO VIDEO SETUP
========================================================= */
function setupIntroVideo() {
  const overlay    = $('introVideoOverlay');
  const video      = $('introVideoPlayer');
  const tapOverlay = $('introTapOverlay');

  // Hide loading screen immediately
  hideLoadingScreen();

  // No video element found — skip straight to hero
  if (!overlay || !video) {
    startHeavyAnimations();
    loadHeroBgVideo();
    startHeroAnimation();
    return;
  }

  // Make sure hero video is NOT loading yet
  const heroBgVideo = $('heroBgVideo');
  if (heroBgVideo) {
    heroBgVideo.preload = 'none';
  }

  // ── Check for slow connection ────────────────
  const connection =
    navigator.connection      ||
    navigator.mozConnection   ||
    navigator.webkitConnection;

  const isSlowConnection = connection && (
    connection.saveData      === true     ||
    connection.effectiveType === '2g'     ||
    connection.effectiveType === 'slow-2g'
  );

  if (isSlowConnection) {
    console.warn('Slow connection — skipping intro video.');
    skipIntroVideo();
    return;
  }

  // ── Play video muted first (autoplay allowed) ─
  video.muted = true;

  video.play().catch((err) => {
    console.warn('Muted autoplay blocked:', err);
    skipIntroVideo();
  });

  // ── Tap to unmute ────────────────────────────
  if (tapOverlay) {
    tapOverlay.addEventListener('click', function handleTap() {
      video.muted       = false;
      video.currentTime = 0;

      video.play().catch(() => {
        // Sound blocked — keep muted and continue
        video.muted = true;
      });

      tapOverlay.classList.add('hidden');
      tapOverlay.removeEventListener('click', handleTap);
    });
  }

  // ── Stall detection — skip if frozen 8s ─────
  let stallTimer = null;

  video.addEventListener('waiting', () => {
    stallTimer = setTimeout(() => {
      console.warn('Video stalled 8s — skipping.');
      finishIntroVideo();
    }, 8000);
  });

  video.addEventListener('playing', () => {
    if (stallTimer) {
      clearTimeout(stallTimer);
      stallTimer = null;
    }
  });

  // ── Error handler ────────────────────────────
  video.addEventListener('error', () => {
    console.warn('Video error — skipping.');
    if (stallTimer) clearTimeout(stallTimer);
    finishIntroVideo();
  });

  // ── Video ended → start everything ──────────
  video.addEventListener('ended', () => {
    if (stallTimer) clearTimeout(stallTimer);
    finishIntroVideo();
  }, { once: true });

  // ── Hard safety limit: 40 seconds ───────────
  const safetyTimer = setTimeout(() => {
    console.warn('Safety timeout — skipping intro.');
    if (stallTimer) clearTimeout(stallTimer);
    finishIntroVideo();
  }, 40000);

  video.addEventListener('ended', () => {
    clearTimeout(safetyTimer);
  }, { once: true });
}

/* ─── Skip intro (slow network or error) ──── */
function skipIntroVideo() {
  const overlay = $('introVideoOverlay');
  if (overlay) {
    overlay.classList.add('hidden');
    setTimeout(() => overlay.remove(), 500);
  }
  startHeavyAnimations();
  loadHeroBgVideo();
  startHeroAnimation();
}

/* ─── Finish intro normally ──────────────── */
function finishIntroVideo() {
  const overlay = $('introVideoOverlay');
  if (overlay) {
    overlay.classList.add('hidden');
    setTimeout(() => overlay.remove(), 2000);
  }

  const intro = $('introAnimation');
  if (intro) intro.style.display = 'none';

  // Start heavy animations NOW — video is done
  startHeavyAnimations();

  // Load hero video after short delay
  setTimeout(() => {
    loadHeroBgVideo();
  }, 300);

  // Start hero entrance
  setTimeout(() => {
    startHeroAnimation();
  }, 500);
}

/* ─── Load hero video (only after intro ends) */
function loadHeroBgVideo() {
  const heroBgVideo = $('heroBgVideo');
  if (!heroBgVideo) return;

  // Only inject source once
  if (heroBgVideo.querySelector('source')) return;

  const source  = document.createElement('source');
  source.src    = 'images/video3.mp4';
  source.type   = 'video/mp4';
  heroBgVideo.appendChild(source);

  heroBgVideo.muted      = true;
  heroBgVideo.loop       = true;
  heroBgVideo.preload    = 'auto';
  heroBgVideo.playsinline = true;

  heroBgVideo.load();
  heroBgVideo.play().catch(() => {
    console.warn('Hero video play failed.');
  });
}

/* ─── Hide loading screen ─────────────────── */
function hideLoadingScreen() {
  const loader = $('loadingScreen');
  if (loader) {
    loader.classList.add('hidden');
    setTimeout(() => loader.remove(), 800);
  }
}

/* =========================================================
   HERO ENTRANCE ANIMATION
========================================================= */
function startHeroAnimation() {
  setTimeout(() => {
    const charWrap = document.querySelector('.hero-characters-wrap');
    if (charWrap) charWrap.classList.add('entered');
  }, 400);

  setTimeout(() => {
    const ring = $('ringCenter');
    if (ring) ring.classList.add('visible');
  }, 1700);

  setTimeout(() => {
    const content = $('heroContent');
    const banner  = $('welcomeBanner');
    if (content) content.classList.add('visible');
    if (banner)  banner.classList.add('visible');
  }, 2000);
}

/* =========================================================
   PERSONALIZED GUEST NAME
========================================================= */
function readGuestFromURL() {
  const params    = new URLSearchParams(window.location.search);
  const id        = params.get('id') || '';
  const guestName = GUEST_LIST[id] || 'Dear Guest';

  const heroName = $('heroGuestName');
  const invName  = $('invGuestName');
  if (heroName) heroName.textContent = guestName;
  if (invName)  invName.textContent  = guestName;
}

/* =========================================================
   OPEN INVITATION
========================================================= */
function openInvitation() {
  if (bgMusic) {
    bgMusic.volume = 0.45;
    bgMusic.play().catch(() => {});
    if (musicBtn) musicBtn.classList.add('playing');
  }

  const main = $('mainContent');
  if (main) {
    main.classList.remove('hidden');
    main.style.opacity    = '0';
    main.style.transition = 'opacity 0.8s ease';
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        main.style.opacity = '1';
      });
    });
  }

  const btn = $('openInvitationBtn');
  if (btn) btn.style.display = 'none';

  const scrollHint = $('scrollHint');
  if (scrollHint) {
    scrollHint.style.opacity = '1';
    setTimeout(() => {
      const inv = $('invitation');
      if (inv) inv.scrollIntoView({ behavior: 'smooth' });
    }, 600);
  }

  initConfetti();
}

/* =========================================================
   PETAL SYSTEM
========================================================= */
const PETAL_COUNT  = 25; // reduced from 35 for performance
let   petals       = [];
let   petalCtx, petalW, petalH;
let   petalAnimating = false;

const PETAL_SHAPES = ['💮', '❀', '✿'];
const PETAL_COLORS = [
  'rgba(255, 99,  132, 0.85)',
  'rgba(54,  162, 235, 0.85)',
  'rgba(255, 206,  86, 0.85)',
  'rgba(75,  192, 192, 0.85)',
  'rgba(153, 102, 255, 0.85)',
  'rgba(255, 159,  64, 0.85)',
  'rgba(255, 105, 180, 0.85)',
];

function initPetalSystem() {
  if (!petalCanvas || petalAnimating) return;
  petalAnimating = true;
  petalCtx = petalCanvas.getContext('2d');
  resizePetalCanvas();
  for (let i = 0; i < PETAL_COUNT; i++) {
    petals.push(createPetal(true));
  }
  animatePetals();
}

function resizePetalCanvas() {
  if (!petalCanvas) return;
  petalW = petalCanvas.width  = window.innerWidth;
  petalH = petalCanvas.height = window.innerHeight;
}

function createPetal(randomY = false) {
  return {
    x:        Math.random() * window.innerWidth,
    y:        randomY ? Math.random() * -window.innerHeight : -40,
    size:     Math.random() * 20 + 15,
    speedY:   Math.random() * 0.6 + 0.3,
    speedX:   (Math.random() - 0.5) * 0.4,
    drift:    Math.random() * Math.PI * 2,
    driftSpd: Math.random() * 0.01 + 0.004,
    opacity:  Math.random() * 0.5 + 0.4,
    rotation: Math.random() * Math.PI * 2,
    rotSpd:   (Math.random() - 0.5) * 0.02,
    color:    PETAL_COLORS[Math.floor(Math.random() * PETAL_COLORS.length)],
    emoji:    PETAL_SHAPES[Math.floor(Math.random() * PETAL_SHAPES.length)],
  };
}

function animatePetals() {
  if (!petalCtx) return;
  petalCtx.clearRect(0, 0, petalW, petalH);

  for (let i = 0; i < petals.length; i++) {
    const p = petals[i];
    p.drift    += p.driftSpd;
    p.rotation += p.rotSpd;
    p.x += p.speedX + Math.sin(p.drift) * 0.6;
    p.y += p.speedY;

    if (p.y > petalH + 40) {
      petals[i] = createPetal(false);
      continue;
    }

    petalCtx.save();
    petalCtx.globalAlpha = p.opacity;
    petalCtx.font        = `${p.size}px serif`;
    petalCtx.translate(p.x, p.y);
    petalCtx.rotate(p.rotation);
    petalCtx.shadowColor = p.color;
    petalCtx.shadowBlur  = 4;
    petalCtx.fillText(p.emoji, -p.size / 2, p.size / 2);
    petalCtx.restore();
  }

  requestAnimationFrame(animatePetals);
}

/* =========================================================
   BUTTERFLY SYSTEM
========================================================= */
function initButterflySystem() {
  const container = $('butterflyContainer');
  if (!container) return;

  // Reduced from 15 to 8 for better mobile performance
  for (let i = 0; i < 8; i++) {
    createButterfly(container);
  }
}

function createButterfly(container) {
  const butterfly     = document.createElement('div');
  butterfly.className = 'butterfly';

  const isBlue = Math.random() > 0.5;
  const fill1  = isBlue ? 'rgba(173,216,230,0.8)' : 'rgba(255,182,193,0.8)';
  const fill2  = isBlue ? 'rgba(135,206,235,0.6)' : 'rgba(255,105,180,0.6)';
  const stroke = isBlue ? '#4a90e2' : '#ff1493';

  butterfly.innerHTML = `
    <svg viewBox="0 0 100 100" width="100%" height="100%">
      <g class="bfly-wing-l">
        <path d="M50,50 C20,30 10,10 5,40 C0,70 30,80 50,50 Z"
              fill="${fill1}" stroke="${stroke}" stroke-width="1.5"/>
        <path d="M50,50 C30,60 20,80 25,95 C30,110 45,90 50,50 Z"
              fill="${fill2}" stroke="${stroke}" stroke-width="1"/>
      </g>
      <g class="bfly-wing-r">
        <path d="M50,50 C80,30 90,10 95,40 C100,70 70,80 50,50 Z"
              fill="${fill1}" stroke="${stroke}" stroke-width="1.5"/>
        <path d="M50,50 C70,60 80,80 75,95 C70,110 55,90 50,50 Z"
              fill="${fill2}" stroke="${stroke}" stroke-width="1"/>
      </g>
      <path d="M48,30 C48,20 45,15 42,10 M52,30 C52,20 55,15 58,10"
            stroke="${stroke}" stroke-width="1.5"
            fill="none" stroke-linecap="round"/>
      <ellipse cx="50" cy="50" rx="3" ry="15" fill="#333"/>
    </svg>
  `;

  const startY   = Math.random() * 100;
  const duration = Math.random() * 15 + 15;
  const delay    = Math.random() * 10;
  const size     = Math.random() * 18 + 18;

  butterfly.style.top               = `${startY}vh`;
  butterfly.style.width             = `${size}px`;
  butterfly.style.height            = `${size}px`;
  butterfly.style.animationDuration = `${duration}s`;
  butterfly.style.animationDelay    = `${delay}s`;

  container.appendChild(butterfly);
}

/* =========================================================
   SPARKLE SYSTEM
========================================================= */
const SPARKLE_COUNT = 40; // reduced from 55
let   sparkles      = [];
let   sparkCtx, sparkW, sparkH;
let   sparkAnimating = false;

function initSparkleSystem() {
  if (!sparkleCanvas || sparkAnimating) return;
  sparkAnimating = true;
  sparkCtx = sparkleCanvas.getContext('2d');
  resizeSparkleCanvas();
  for (let i = 0; i < SPARKLE_COUNT; i++) {
    sparkles.push(createSparkle());
  }
  animateSparkles();
}

function resizeSparkleCanvas() {
  if (!sparkleCanvas) return;
  sparkW = sparkleCanvas.width  = window.innerWidth;
  sparkH = sparkleCanvas.height = window.innerHeight;
}

function createSparkle() {
  return {
    x:        Math.random() * window.innerWidth,
    y:        Math.random() * window.innerHeight,
    r:        Math.random() * 1.6 + 0.4,
    alpha:    Math.random(),
    alphaDir: Math.random() > 0.5 ? 1 : -1,
    speed:    Math.random() * 0.015 + 0.006,
    color:    `hsl(${40 + Math.random() * 20}, 85%, 70%)`,
  };
}

function animateSparkles() {
  if (!sparkCtx) return;
  sparkCtx.clearRect(0, 0, sparkW, sparkH);

  for (const s of sparkles) {
    s.alpha += s.speed * s.alphaDir;
    if (s.alpha >= 1 || s.alpha <= 0) {
      s.alphaDir *= -1;
      if (s.alpha <= 0) {
        s.x = Math.random() * sparkW;
        s.y = Math.random() * sparkH;
      }
    }

    sparkCtx.save();
    sparkCtx.globalAlpha = Math.max(0, s.alpha);
    sparkCtx.fillStyle   = s.color;
    sparkCtx.shadowBlur  = 5;
    sparkCtx.shadowColor = s.color;

    const cx = s.x, cy = s.y, r = s.r;
    sparkCtx.beginPath();
    sparkCtx.moveTo(cx,           cy - r * 3  );
    sparkCtx.lineTo(cx + r * 0.5, cy - r * 0.5);
    sparkCtx.lineTo(cx + r * 3,   cy          );
    sparkCtx.lineTo(cx + r * 0.5, cy + r * 0.5);
    sparkCtx.lineTo(cx,           cy + r * 3  );
    sparkCtx.lineTo(cx - r * 0.5, cy + r * 0.5);
    sparkCtx.lineTo(cx - r * 3,   cy          );
    sparkCtx.lineTo(cx - r * 0.5, cy - r * 0.5);
    sparkCtx.closePath();
    sparkCtx.fill();
    sparkCtx.restore();
  }

  requestAnimationFrame(animateSparkles);
}

/* =========================================================
   COUNTDOWN TIMER
========================================================= */
const prevValues = {
  days: null, hours: null, minutes: null, seconds: null,
};

function initCountdown() {
  updateCountdown();
  setInterval(updateCountdown, 1000);
}

function updateCountdown() {
  const now  = new Date();
  const diff = WEDDING_DATE - now;

  if (diff <= 0) {
    ['cdDays','cdHours','cdMinutes','cdSeconds'].forEach(id => {
      const el = $(id);
      if (el) el.textContent = '00';
    });
    return;
  }

  const days    = Math.floor(diff / 86400000);
  const hours   = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000)  / 60000);
  const seconds = Math.floor((diff % 60000)    / 1000);

  tickValue('cdDays',    days,    prevValues, 'days');
  tickValue('cdHours',   hours,   prevValues, 'hours');
  tickValue('cdMinutes', minutes, prevValues, 'minutes');
  tickValue('cdSeconds', seconds, prevValues, 'seconds');
}

function tickValue(elId, value, prev, key) {
  const el = $(elId);
  if (!el) return;
  const str = String(value).padStart(2, '0');
  if (prev[key] !== str) {
    el.textContent = str;
    el.classList.remove('tick');
    void el.offsetWidth;
    el.classList.add('tick');
    prev[key] = str;
  }
}

/* =========================================================
   GALLERY CAROUSEL
========================================================= */
function initGallery(trackId, prevId, nextId, dotsId, count) {
  const track    = $(trackId);
  const prevBtn  = $(prevId);
  const nextBtn  = $(nextId);
  const dotsWrap = $(dotsId);
  if (!track) return;

  let current    = 0;
  let startX     = 0;
  let isDragging = false;

  for (let i = 0; i < count; i++) {
    const dot = document.createElement('button');
    dot.className = 'gallery-dot' + (i === 0 ? ' active' : '');
    dot.setAttribute('role', 'tab');
    dot.setAttribute('aria-label', `Slide ${i + 1}`);
    dot.addEventListener('click', () => goTo(i));
    if (dotsWrap) dotsWrap.appendChild(dot);
  }

  function goTo(idx) {
    current = (idx + count) % count;
    track.style.transform = `translateX(-${current * 100}%)`;
    if (dotsWrap) {
      dotsWrap.querySelectorAll('.gallery-dot').forEach((d, i) => {
        d.classList.toggle('active', i === current);
      });
    }
  }

  if (prevBtn) prevBtn.addEventListener('click', () => goTo(current - 1));
  if (nextBtn) nextBtn.addEventListener('click', () => goTo(current + 1));

  const parent = track.parentElement;
  parent.addEventListener('touchstart', (e) => {
    startX     = e.touches[0].clientX;
    isDragging = true;
  }, { passive: true });

  parent.addEventListener('touchend', (e) => {
    if (!isDragging) return;
    isDragging = false;
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 40) goTo(dx < 0 ? current + 1 : current - 1);
  });

  setInterval(() => goTo(current + 1), 5000);
}

/* =========================================================
   SCROLL REVEAL
========================================================= */
function initScrollReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        if (entry.target.id === 'thankyou') {
          startConfetti();
        }
      }
    });
  }, { threshold: 0.12 });

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

/* =========================================================
   MUSIC BUTTON
========================================================= */
function initMusicButton() {
  if (!musicBtn || !bgMusic) return;

  musicBtn.addEventListener('click', () => {
    if (bgMusic.paused) {
      bgMusic.play().catch(() => {});
      musicBtn.classList.add('playing');
    } else {
      bgMusic.pause();
      musicBtn.classList.remove('playing');
    }
  });
}

/* =========================================================
   VIDEO SECTION (YouTube)
========================================================= */
function initVideoSection() {
  const playBtn = $('videoPlayBtn');
  const poster  = $('videoPoster');
  const wrap    = $('ytVideoWrap');
  if (!playBtn || !poster || !wrap) return;

  playBtn.addEventListener('click', () => {
    poster.style.display = 'none';
    wrap.classList.remove('hidden');

    wrap.innerHTML = `
      <iframe
        width="100%" height="100%"
        src="https://www.youtube.com/embed/-FbOu9h0LFM?autoplay=1&mute=0&controls=1&rel=0&showinfo=0&modestbranding=1"
        frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen
        style="position:absolute;top:0;left:0;width:100%;height:100%;"
      ></iframe>
    `;

    if (bgMusic && !bgMusic.paused) {
      bgMusic.pause();
      if (musicBtn) musicBtn.classList.remove('playing');
    }
  });
}

/* =========================================================
   CONFETTI
========================================================= */
let confettiCtx,
    confettiParticles = [],
    confettiRunning   = false;

function initConfetti() {
  if (!confettiCanvas) return;
  confettiCtx = confettiCanvas.getContext('2d');
  resizeConfetti();
}

function resizeConfetti() {
  if (!confettiCanvas) return;
  const parent = confettiCanvas.parentElement;
  confettiCanvas.width  = parent.offsetWidth;
  confettiCanvas.height = parent.offsetHeight;
}

function startConfetti() {
  if (!confettiCtx || confettiRunning) return;
  confettiRunning = true;
  resizeConfetti();

  const colors = [
    '#c9a84c','#e4c064','#f5d98b',
    '#fff','#b8860b','#ffd700',
    '#4169e1','#1e3a8a',
  ];

  for (let i = 0; i < 80; i++) {
    confettiParticles.push({
      x:      Math.random() * confettiCanvas.width,
      y:      -10,
      w:      Math.random() * 8 + 4,
      h:      Math.random() * 4 + 2,
      color:  colors[Math.floor(Math.random() * colors.length)],
      rot:    Math.random() * Math.PI * 2,
      rotSpd: (Math.random() - 0.5) * 0.1,
      vy:     Math.random() * 2 + 1,
      vx:     (Math.random() - 0.5) * 1.2,
      alpha:  1,
    });
  }
  animateConfetti();
}

function animateConfetti() {
  if (!confettiCtx || !confettiRunning) return;
  confettiCtx.clearRect(
    0, 0,
    confettiCanvas.width,
    confettiCanvas.height
  );

  confettiParticles = confettiParticles.filter(p => p.alpha > 0.05);

  for (const p of confettiParticles) {
    p.y   += p.vy;
    p.x   += p.vx;
    p.rot += p.rotSpd;
    if (p.y > confettiCanvas.height * 0.7) p.alpha -= 0.012;

    confettiCtx.save();
    confettiCtx.globalAlpha = p.alpha;
    confettiCtx.fillStyle   = p.color;
    confettiCtx.translate(p.x, p.y);
    confettiCtx.rotate(p.rot);
    confettiCtx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    confettiCtx.restore();
  }

  if (confettiParticles.length > 0) {
    requestAnimationFrame(animateConfetti);
  } else {
    confettiRunning = false;
  }
}

/* =========================================================
   SHARE INVITATION
========================================================= */
function shareInvitation() {
  const url   = window.location.href;
  const title = 'You are invited! — Ashan & Dilini Wedding';
  const text  = 'We warmly invite you to celebrate the wedding of Ashan & Dilini. 15th November 2026.';

  if (navigator.share) {
    navigator.share({ title, text, url }).catch(() => {});
  } else {
    navigator.clipboard.writeText(url).then(() => {
      alert('Invitation link copied to clipboard!');
    }).catch(() => {
      prompt('Copy this link to share:', url);
    });
  }
}

/* =========================================================
   RESIZE HANDLER
========================================================= */
function onResize() {
  resizePetalCanvas();
  resizeSparkleCanvas();
  resizeConfetti();
}

/* =========================================================
   BOOT
========================================================= */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}