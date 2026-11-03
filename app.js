'use strict';
const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

let openingBusy = false;
let openingTimers = [];

// Dev/Test helper

let lastPhotoButton = null;
let audioContext = null;
let musicTimer = null;
let musicOn = false;
let noteIndex = 0;



// ==========================================
// CORE DOM ELEMENTS & NAVIGATION
// ==========================================
const opening = $('#opening');
if (new URLSearchParams(location.search).get('state') === 'opening') {
  opening.classList.add('is-opening');
}
const main = $('#main');
const navigation = $('#section-menu');
const menuToggle = $('#menu-toggle');
const keepsakeCollage = $('#keepsake-collage');
const rsvpForm = $('#rsvp-form');
const wishesForm = $('#wishes-form');

function closeMenu(returnFocus = false) {
  navigation.hidden = true;
  navigation.inert = true;
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.setAttribute('aria-label', 'Buka menu undangan');
  if (returnFocus) menuToggle.focus();
}

menuToggle.addEventListener('click', () => {
  const open = navigation.hidden;
  navigation.hidden = !open;
  navigation.inert = !open;
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute('aria-label', open ? 'Tutup menu undangan' : 'Buka menu undangan');
});

navigation.addEventListener('click', e => {
  if (e.target.closest('a')) closeMenu();
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !navigation.hidden) closeMenu(true);
});

document.addEventListener('click', e => {
  if (!navigation.hidden && !navigation.contains(e.target) && !menuToggle.contains(e.target)) closeMenu();
});

// Optional catalogue greeting; no guest authentication or device tracking.
const guestName = new URLSearchParams(location.search).get('to')?.trim().slice(0, 100);
if (guestName) {
  $$('.guest-name').forEach(el => el.textContent = guestName);
  $('#rsvp-name').value = guestName;
  $('#wish-name').value = guestName;
}

// ==========================================
// OPENING ANIMATION SEQUENCE
// ==========================================
// (opening variables declared at top)

function finishOpening() {
  setTimeout(initScratchReveal, 400);
  opening.classList.add('dismissed');
  document.body.classList.remove('unopened');
  main.inert = false;
  menuToggle.hidden = false;
  closeMenu();
  $('.desktop-art').inert = false;
  $('#music-toggle').hidden = false;
  opening.setAttribute('aria-hidden', 'true');
  opening.inert = true;
  main.focus({ preventScroll: true });
  $$('.hero-bouquet-top, .hero-bouquet-bottom').forEach(el => el.classList.add('visible'));
  openingBusy = false;
}


function openInvitation(skip = false) {
  if (openingBusy && !skip) return;
  openingTimers.forEach(clearTimeout);
  openingTimers = [];
  openingBusy = true;
  const btn = $('#open-invitation');
  if (btn) btn.disabled = true;
  
  // Start music
  if (!musicOn) {
    const musicBtn = $('#music-toggle');
    if (musicBtn) musicBtn.click();
  }
  
  if (skip || reducedMotion.matches) {
    finishOpening();
    return;
  }

  // Step 1: Switch from closed envelope to open envelope with revealed wedding letter
  opening.classList.add('is-opening');

  // Step 2: Allow user ~2.8s to read the revealed card in the open envelope, then gently fade to hero
  openingTimers.push(setTimeout(() => {
    opening.classList.add('dismissed');
  }, 2800));

  // Step 3: Complete transition to hero section
  openingTimers.push(setTimeout(finishOpening, 3500));
}

$('#open-invitation')?.addEventListener('click', () => openInvitation());
$('.envelope-seal')?.addEventListener('click', () => openInvitation());
$('#envelope-seal')?.addEventListener('click', () => openInvitation());
$('.envelope-closed-layer')?.addEventListener('click', () => openInvitation());
$('.letter-card')?.addEventListener('click', () => openInvitation(true));
$('.envelope-open-layer')?.addEventListener('click', () => openInvitation(true));
$('#skip-opening')?.addEventListener('click', () => openInvitation(true));
$('.skip-link')?.addEventListener('click', () => openInvitation(true));

opening.addEventListener('keydown', event => {
  if (event.key === 'Escape') openInvitation(true);
  if (event.key === 'Tab') {
    const targets = $$('button:not([disabled])', opening);
    if (!targets.length) return;
    if (event.shiftKey && document.activeElement === targets[0]) { event.preventDefault(); targets.at(-1).focus(); }
    else if (!event.shiftKey && document.activeElement === targets.at(-1)) { event.preventDefault(); targets[0].focus(); }
  }
});

$('#replay').addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'instant' });
  openingTimers.forEach(clearTimeout);
  openingBusy = false;
  keepsakeCollage?.classList.remove('in-view');
  opening.classList.remove('dismissed', 'opened', 'is-opening', 'card-closing');
  opening.inert = false;
  opening.removeAttribute('aria-hidden');
  main.inert = true;
  closeMenu();
  menuToggle.hidden = true;
  $('.desktop-art').inert = true;
  document.body.classList.add('unopened');
  $('#open-invitation').disabled = false;
  $('#open-invitation').focus();
});

// ==========================================
// SCROLL REVEALS & OBSERVERS
// ==========================================
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.add('visible'); revealObserver.unobserve(entry.target); }
  });
}, { threshold: .08, rootMargin: '0px 0px -15px 0px' });
$$('.reveal, .reveal-scale, .reveal-left, .reveal-right, .hero-bouquet-top, .hero-bouquet-bottom, .couple-knot-ornament, .portrait-flower, .events-peony, .events-tulip, .story-peony, .closing-fan').forEach(el => revealObserver.observe(el));

const navObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const id = entry.target.id;
    const mapped = id === 'quote' ? 'home' : id === 'countdown' ? 'events' : id === 'closing' ? 'wishes' : id;
    $$('.section-menu a').forEach(a => {
      const active = a.getAttribute('href') === '#' + mapped;
      a.classList.toggle('active', active);
      if (active) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current');
    });
  });
}, { rootMargin: '-10% 0px -65% 0px', threshold: 0 });
$$('main section, main footer').forEach(el => navObserver.observe(el));

if (keepsakeCollage) {
  const keepsakeObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        keepsakeCollage.classList.add('in-view');
        keepsakeObserver.unobserve(keepsakeCollage);
      }
    });
  }, { threshold: 0.18, rootMargin: '0px 0px -30px 0px' });
  keepsakeObserver.observe(keepsakeCollage);
}

// ==========================================
// COUNTDOWN TIMER
// ==========================================
const weddingTime = new Date('2028-03-08T10:00:00+07:00').getTime();
function updateCountdown() {
  const total = Math.max(0, Math.floor((weddingTime - Date.now()) / 1000));
  const values = {
    days: Math.floor(total / 86400),
    hours: Math.floor(total / 3600) % 24,
    minutes: Math.floor(total / 60) % 60,
    seconds: total % 60
  };
  for (const [key, val] of Object.entries(values)) {
    const el = $('[data-count="' + key + '"]');
    if (el) el.textContent = String(val).padStart(2, '0');
  }
  if (total === 0) {
    const st = $('#countdown-status');
    if (st) st.textContent = 'Hari bahagia kami telah tiba. Terima kasih atas doa Anda.';
  }
}
updateCountdown();
setInterval(updateCountdown, 1000);

// ==========================================
// UI FEEDBACK (TOAST)
// ==========================================
let toastTimer;
function toast(text) {
  const el = $('#toast');
  if (!el) return;
  el.textContent = text;
  el.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('visible'), 3500);
}

// ==========================================
// PHOTO DIALOG & GIFT
// ==========================================
const photoDialog = $('#photo-dialog');
$$('[data-photo]').forEach(button => button.addEventListener('click', () => {
  lastPhotoButton = button;
  $('#large-photo').src = button.dataset.photo;
  photoDialog.showModal();
}));
$('#close-photo').addEventListener('click', () => photoDialog.close());
photoDialog.addEventListener('click', e => { if (e.target === photoDialog) photoDialog.close(); });
photoDialog.addEventListener('close', () => lastPhotoButton?.focus({ preventScroll: true }));

$('#show-gift').addEventListener('click', () => {
  const details = $('#gift-details');
  details.hidden = !details.hidden;
  $('#show-gift').setAttribute('aria-expanded', String(!details.hidden));
  $('#show-gift').innerHTML = details.hidden ? 'LIHAT WEDDING GIFT <span>＋</span>' : 'TUTUP WEDDING GIFT <span>−</span>';
});

$$('.copy-account').forEach(button => button.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(button.dataset.account);
    toast('Nomor rekening berhasil disalin.');
  } catch {
    toast('Silakan salin nomor yang tertera pada kartu.');
  }
}));

// Catalogue demo data stays in this browser only.
function readStore(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}
function writeStore(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
}
const RSVP_KEY = 'peranakan-bloom.rsvp.v1';
const WISHES_KEY = 'peranakan-bloom.wishes.v1';

function updateGuests() {
  const declined = $('input[name="attendance"]:checked', rsvpForm)?.value === 'no';
  const guestsSelect = $('#rsvp-guests');
  if (guestsSelect) {
    guestsSelect.disabled = declined;
    guestsSelect.closest('form')?.classList.toggle('declined', declined);
  }
}
$$('input[name="attendance"]', rsvpForm).forEach(input => input.addEventListener('change', updateGuests));
updateGuests();

$('#rsvp-name').addEventListener('input', () => $('#rsvp-name').setCustomValidity(''));

const savedRsvp = readStore(RSVP_KEY, null);
if (savedRsvp && typeof savedRsvp.name === 'string') {
  $('#rsvp-name').value = savedRsvp.name.slice(0, 100);
  const attendance = savedRsvp.attendance === 'no' ? 'no' : 'yes';
  $(`input[name="attendance"][value="${attendance}"]`, rsvpForm).checked = true;
  $('#rsvp-guests').value = String(Math.min(4, Math.max(1, Number(savedRsvp.guests) || 1)));
  updateGuests();
}

rsvpForm.addEventListener('submit', event => {
  event.preventDefault();
  if (!rsvpForm.reportValidity()) return;
  const data = new FormData(rsvpForm);
  const name = String(data.get('name') || '').trim();
  if (!name) {
    $('#rsvp-name').setCustomValidity('Mohon isi nama Anda.');
    $('#rsvp-name').reportValidity();
    return;
  }
  const attendance = data.get('attendance') === 'no' ? 'no' : 'yes';
  const guests = attendance === 'yes' ? Math.min(4, Math.max(1, Number(data.get('guests')) || 1)) : 0;
  const saved = writeStore(RSVP_KEY, { name, attendance, guests, updatedAt: new Date().toISOString() });
  const status = $('.form-status', rsvpForm);
  status.classList.toggle('error', !saved);
  status.textContent = saved ? 'Konfirmasi demo tersimpan di browser ini.' : 'Penyimpanan browser tidak tersedia. Konfirmasi belum tersimpan.';
});

function getLocalWishes() {
  const records = readStore(WISHES_KEY, []);
  return Array.isArray(records) ? records.filter(x => typeof x?.name === 'string' && typeof (x?.rsvp_message || x?.message) === 'string').slice(0, 50) : [];
}

function renderWishesList(wishes) {
  const container = $('#guestbook-list');
  if (!container) return;
  container.replaceChildren();

  const valid = Array.isArray(wishes) ? wishes.filter(w => {
    if (!w || typeof w !== 'object') return false;
    const msg = w.rsvp_message || w.rsvpMessage || w.message;
    return typeof w.name === 'string' && typeof msg === 'string' && msg.trim().length > 0;
  }) : [];

  if (!valid.length) {
    const p = document.createElement('p');
    p.className = 'empty-wishes';
    p.textContent = 'Jadilah yang pertama menitipkan doa untuk kami.';
    container.append(p);
    return;
  }

  for (const wish of valid) {
    const article = document.createElement('article');
    article.className = 'wish';
    const message = document.createElement('p');
    const msgText = wish.rsvp_message || wish.rsvpMessage || wish.message;
    message.textContent = '“' + msgText.trim() + '”';
    const foot = document.createElement('footer');
    const name = document.createElement('span');
    name.textContent = wish.name;
    const time = document.createElement('time');
    const date = wish.createdAt ? new Date(wish.createdAt) : null;
    time.textContent = (date && !Number.isNaN(date.getTime()))
      ? date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
      : '';
    foot.append(name, time);
    article.append(message, foot);
    container.append(article);
  }
}

renderWishesList(getLocalWishes());

wishesForm.addEventListener('submit', event => {
  event.preventDefault();
  if (!wishesForm.reportValidity()) return;
  const data = new FormData(wishesForm);
  const name = String(data.get('name') || '').trim();
  const message = String(data.get('message') || '').trim();
  const status = $('.form-status', wishesForm);
  if (!name || message.length < 3) {
    status.textContent = 'Mohon lengkapi nama dan ucapan Anda (minimal 3 karakter).';
    status.classList.add('error');
    return;
  }
  const records = [{ name, message, createdAt: new Date().toISOString() }, ...getLocalWishes()].slice(0, 50);
  const saved = writeStore(WISHES_KEY, records);
  status.classList.toggle('error', !saved);
  if (!saved) {
    status.textContent = 'Penyimpanan browser tidak tersedia. Ucapan belum tersimpan; silakan coba lagi.';
    return;
  }
  renderWishesList(records);
  $('#wish-message').value = '';
  status.textContent = 'Terima kasih! Ucapan demo tersimpan di browser ini.';
  toast('Ucapan tersimpan di browser ini.');
});

// ==========================================
// BACKGROUND MUSIC BOX (AudioContext)
// ==========================================
// (music variables declared at top)
const phrase = [523.25, 659.25, 783.99, 659.25, 587.33, 698.46, 880, 698.46, 523.25, 659.25, 783.99, 1046.5, 880, 783.99, 659.25, 587.33];

function playTone() {
  if (!musicOn || !audioContext) return;
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  osc.type = 'sine';
  osc.frequency.value = phrase[noteIndex++ % phrase.length];
  const now = audioContext.currentTime;
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(.045, now + .025);
  gain.gain.exponentialRampToValueAtTime(.0001, now + 1.7);
  osc.connect(gain);
  gain.connect(audioContext.destination);
  osc.start(now);
  osc.stop(now + 1.8);
}

$('#music-toggle').addEventListener('click', async () => {
  const button = $('#music-toggle');
  try {
    if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
    musicOn = !musicOn;
    if (musicOn) {
      await audioContext.resume();
      playTone();
      musicTimer = setInterval(playTone, 750);
    } else {
      clearInterval(musicTimer);
      await audioContext.suspend();
    }
    button.setAttribute('aria-pressed', String(musicOn));
    button.setAttribute('aria-label', musicOn ? 'Jeda musik' : 'Putar musik');
  } catch {
    musicOn = false;
    toast('Musik tidak tersedia di browser ini.');
  }
});

if (new URLSearchParams(window.location.search).get('opened') === '1') {
  finishOpening();
}


// ==========================================
// SCRATCH TO REVEAL PHOTO (Frame Reveal)
// ==========================================
function initScratchReveal() {
  const canvas = document.getElementById('scratch-canvas');
  const viewport = document.getElementById('reveal-viewport');
  const statusEl = document.getElementById('reveal-status');
  if (!canvas || !viewport) return;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  let isDrawing = false;
  let isRevealed = false;
  let lastX = 0, lastY = 0;
  let strokeCount = 0;

  function resizeAndDraw() {
    const rect = viewport.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.round(rect.width);
    const h = Math.round(rect.height);
    if (!w || !h) return;

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    // Warm ivory / sand gradient background
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#f9f6ee');
    grad.addColorStop(0.5, '#f2ece0');
    grad.addColorStop(1, '#e8ded0');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Subtle paper grain dots
    ctx.fillStyle = 'rgba(148, 116, 92, 0.08)';
    for (let i = 0; i < 350; i++) {
      const rx = Math.random() * w;
      const ry = Math.random() * h;
      ctx.fillRect(rx, ry, 1.5, 1.5);
    }

    // Calligraphic "Scratch here" text matching user reference
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Sparkle diamond icon
    ctx.fillStyle = '#8a7967';
    ctx.font = '12px serif';
    ctx.fillText('✦', w / 2, h / 2 - 24);

    // Script "Scratch here"
    ctx.fillStyle = '#5c4e3f';
    ctx.font = 'italic 500 17px "Playfair Display", "Times New Roman", serif';
    ctx.fillText('Scratch here', w / 2, h / 2 + 2);

    // Small subtitle
    ctx.fillStyle = '#9b8875';
    ctx.font = '600 7px sans-serif';
    ctx.fillText('USAP DI SINI', w / 2, h / 2 + 22);
    ctx.restore();
  }

  // Draw once ready
  if (viewport.offsetWidth > 0) {
    resizeAndDraw();
  } else {
    // Retry when visible
    setTimeout(resizeAndDraw, 300);
  }

  window.addEventListener('resize', () => { if (!isRevealed) resizeAndDraw(); });

  function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX ?? (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
    const clientY = e.clientY ?? (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  }

  function scratch(x, y) {
    ctx.globalCompositeOperation = 'destination-out';
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    ctx.lineWidth = Math.max(30, (canvas.width / dpr) * 0.28);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.stroke();

    lastX = x;
    lastY = y;
    strokeCount++;

    if (strokeCount % 6 === 0) {
      checkPercentRevealed();
    }
  }

  function checkPercentRevealed() {
    if (isRevealed) return;
    try {
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;
      let transparent = 0;
      const step = 8;
      let sampled = 0;

      for (let i = 3; i < data.length; i += 4 * step) {
        sampled++;
        if (data[i] < 128) transparent++;
      }

      const ratio = transparent / sampled;
      if (ratio > 0.42) {
        revealComplete();
      }
    } catch (err) {}
  }

  function revealComplete() {
    if (isRevealed) return;
    isRevealed = true;
    canvas.style.opacity = '0';
    canvas.style.pointerEvents = 'none';
    if (statusEl) {
      statusEl.textContent = 'Cintya & Hans · Captured in love ♡';
      statusEl.style.color = '#94745C';
      statusEl.style.fontWeight = '500';
    }
  }

  canvas.addEventListener('pointerdown', e => {
    if (isRevealed) return;
    isDrawing = true;
    const pos = getPos(e);
    lastX = pos.x;
    lastY = pos.y;
    scratch(pos.x, pos.y);
  });

  window.addEventListener('pointermove', e => {
    if (!isDrawing || isRevealed) return;
    const pos = getPos(e);
    scratch(pos.x, pos.y);
  });

  window.addEventListener('pointerup', () => {
    if (isDrawing) {
      isDrawing = false;
      checkPercentRevealed();
    }
  });

  canvas.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      revealComplete();
    }
  });

  // Call on intersection when section comes into view
  if ('IntersectionObserver' in window) {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !isRevealed && canvas.width === 0) {
          resizeAndDraw();
        }
      });
    }, { threshold: 0.1 });
    const sec = document.getElementById('reveal-photo');
    if (sec) obs.observe(sec);
  }
}

window.addEventListener('DOMContentLoaded', initScratchReveal);
