import { TempleScene3D } from './scene3d.js';

// --- 1. INITIALIZE 3D SCENE & ENGINE ---
let temple3D = null;
const canvasContainer = document.getElementById('webgl-canvas-container');
if (canvasContainer) {
  temple3D = new TempleScene3D('webgl-canvas-container');
}

// --- 2. MULTILINGUAL SWITCHER (HI / EN) ---
const htmlEl = document.documentElement;

function getSavedLang() {
  try { return localStorage.getItem('templeLang') || 'hi'; }
  catch (e) { return 'hi'; }
}

let currentTopReviews = [];

function setLanguage(lang) {
  document.querySelectorAll('[data-hi][data-en]').forEach(el => {
    el.textContent = el.getAttribute('data-' + lang);
  });
  document.querySelectorAll('.lang-option').forEach(opt => {
    opt.classList.toggle('active', opt.getAttribute('data-lang') === lang);
  });
  htmlEl.setAttribute('lang', lang);
  try { localStorage.setItem('templeLang', lang); } catch (e) {}
  if (currentTopReviews.length > 0) {
    renderReviews(currentTopReviews);
  }
}

document.addEventListener('click', (e) => {
  if (e.target.closest('#langToggle')) {
    const current = htmlEl.getAttribute('lang') === 'hi' ? 'hi' : 'en';
    setLanguage(current === 'hi' ? 'en' : 'hi');
  }
});

// --- 3. LOCAL FILE-BASED REVIEWS & TEMPLE STATS ---

function getTempleStats() {
  try {
    const saved = localStorage.getItem('templeStats');
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return {
    dailyVisitors: 250,
    yearsOfService: 70,
    diyasOffered: 108
  };
}

function saveTempleStats(stats) {
  try {
    localStorage.setItem('templeStats', JSON.stringify(stats));
  } catch (e) {}
}

function initTempleStats() {
  const stats = getTempleStats();
  updateStatCounter('statVisitors', stats.dailyVisitors, '+');
  updateStatCounter('statYears', stats.yearsOfService, '+');
  updateStatCounter('statDiyas', stats.diyasOffered, '+');
}

function updateStatCounter(elementId, targetVal, suffix = '') {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.setAttribute('data-count', targetVal);
  el.setAttribute('data-suffix', suffix);
  let start = 0;
  const duration = 1200;
  const startTime = performance.now();
  function tick(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    el.textContent = Math.round(targetVal * progress) + suffix;
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

function getLocalSubmittedReviews() {
  try {
    const raw = localStorage.getItem('userSubmittedReviews');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

// Fetch Top 3 Reviews from local data/reviews.json & merge with user submissions
async function loadTopReviews() {
  const localReviews = getLocalSubmittedReviews();
  try {
    const res = await fetch('data/reviews.json?t=' + Date.now());
    if (!res.ok) throw new Error('Could not fetch data/reviews.json');
    const allFileReviews = await res.json();

    const existingIds = new Set(allFileReviews.map(r => r.id));
    const merged = [
      ...localReviews.filter(r => !existingIds.has(r.id)),
      ...allFileReviews
    ];
    currentTopReviews = merged.slice(0, 3);
    renderReviews(currentTopReviews);
  } catch (err) {
    console.log('Using local/fallback reviews:', err);
    if (localReviews.length > 0) {
      currentTopReviews = localReviews.slice(0, 3);
      renderReviews(currentTopReviews);
    }
  }
}

function renderReviews(reviews) {
  const container = document.getElementById('reviews-grid-mount');
  if (!container || !reviews.length) return;

  const lang = getSavedLang();

  container.innerHTML = reviews.map(r => {
    const authorText = typeof r.author === 'object' ? (r.author[lang] || r.author.hi) : r.author;
    const reviewText = typeof r.text === 'object' ? (r.text[lang] || r.text.hi) : r.text;
    const stars = '★'.repeat(r.rating || 5);

    return `
      <div class="review-card reveal in-view">
        <div class="review-stars">${stars}</div>
        <p>${reviewText}</p>
        <span class="review-author">— ${authorText}</span>
      </div>
    `;
  }).join('');
}

// Local Seva Offering Handler (Updates local counters & localStorage)
function offerSevaLocal(type) {
  const stats = getTempleStats();
  if (type === 'diya') {
    stats.diyasOffered = (stats.diyasOffered || 108) + 1;
    saveTempleStats(stats);
    updateStatCounter('statDiyas', stats.diyasOffered, '+');
  }
}

// --- 5. EVENT LISTENERS FOR 3D SEVAS & INTERACTION ---
document.addEventListener('click', (e) => {
  // Mobile menu
  const menuBtn = e.target.closest('#menuToggle');
  const nav = document.getElementById('mainNav');
  if (menuBtn && nav) {
    nav.classList.toggle('open');
    menuBtn.classList.toggle('is-open');
    return;
  }
  if (nav && nav.classList.contains('open') && e.target.closest('#mainNav a')) {
    nav.classList.remove('open');
  }

  // 3D Seva Actions with Visual Feedback
  const diyaBtn = e.target.closest('#btnOfferDiya') || e.target.closest('#btnOfferDiyaHero');
  const flowerBtn = e.target.closest('#btnFlowerShower') || e.target.closest('#btnFlowerShowerHero');
  const bellBtn = e.target.closest('#btnRingBell') || e.target.closest('#btnRingBellHero');

  if (diyaBtn) {
    if (temple3D) temple3D.spawnDiya();
    addButtonAnimation(diyaBtn, 'diyaBurn');
    createDiyaFlameEffect();
    offerSevaLocal('diya');
  } else if (flowerBtn) {
    if (temple3D) temple3D.showerFlowers();
    addButtonAnimation(flowerBtn, 'flowerFall');
    createFlowerShowerEffect();
    offerSevaLocal('flower');
  } else if (bellBtn) {
    if (temple3D) temple3D.ringBell();
    addButtonAnimation(bellBtn, 'bellSwing');
    playBellSound();
    offerSevaLocal('bell');
  }
});

// Function to add button animation
function addButtonAnimation(btn, animationType) {
  if (!btn) return;
  btn.classList.add('active');
  // Set timeout based on animation type
  const duration = animationType === 'diyaBurn' ? 1500 : animationType === 'flowerFall' ? 1200 : 800;
  setTimeout(() => {
    btn.classList.remove('active');
  }, duration);
}

// Function to create diya flame effect on screen
function createDiyaFlameEffect() {
  const diyaContainer = document.createElement('div');
  diyaContainer.style.cssText = `
    position: fixed;
    left: 50%;
    top: 30%;
    transform: translateX(-50%);
    z-index: 9999;
    pointer-events: none;
    font-size: 80px;
    animation: diyaFlame 1.5s ease-out forwards;
    filter: drop-shadow(0 0 20px rgba(232,114,12,0.9));
  `;
  diyaContainer.innerHTML = '🪔';
  document.body.appendChild(diyaContainer);
  
  setTimeout(() => {
    diyaContainer.remove();
  }, 1500);
}

// Function to create flower shower effect on screen
function createFlowerShowerEffect() {
  const flowers = ['🌸', '🌺', '🌼', '🌻', '💐'];
  const flowerCount = 12;
  
  for (let i = 0; i < flowerCount; i++) {
    setTimeout(() => {
      const flower = document.createElement('div');
      const randomFlower = flowers[Math.floor(Math.random() * flowers.length)];
      const startX = Math.random() * window.innerWidth;
      const duration = 2 + Math.random() * 1;
      const delay = i * 0.1;
      
      flower.style.cssText = `
        position: fixed;
        left: ${startX}px;
        top: -50px;
        z-index: 9999;
        pointer-events: none;
        font-size: ${40 + Math.random() * 30}px;
        opacity: 1;
        animation: flowerShower ${duration}s linear ${delay}s forwards;
        filter: drop-shadow(0 2px 4px rgba(243,203,92,0.6));
      `;
      flower.innerHTML = randomFlower;
      document.body.appendChild(flower);
      
      setTimeout(() => {
        flower.remove();
      }, (duration + delay) * 1000);
    }, i * 50);
  }
}

// Function to play temple bell sound (professional)
function playBellSound() {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const time = audioContext.currentTime;
    
    // Create multiple oscillators for rich bell tone
    const osc1 = audioContext.createOscillator();
    const osc2 = audioContext.createOscillator();
    const osc3 = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const gainOsc2 = audioContext.createGain();
    const gainOsc3 = audioContext.createGain();
    
    // Connect to destination
    osc1.connect(gain);
    osc2.connect(gainOsc2);
    osc3.connect(gainOsc3);
    gain.connect(audioContext.destination);
    gainOsc2.connect(audioContext.destination);
    gainOsc3.connect(audioContext.destination);
    
    // Main bell tone (fundamental frequency)
    osc1.frequency.setValueAtTime(350, time);
    osc1.frequency.exponentialRampToValueAtTime(250, time + 0.1);
    osc1.frequency.linearRampToValueAtTime(240, time + 2);
    
    // Harmonic 1 (upper tone)
    osc2.frequency.setValueAtTime(650, time);
    osc2.frequency.exponentialRampToValueAtTime(500, time + 0.15);
    osc2.frequency.linearRampToValueAtTime(480, time + 1.5);
    
    // Harmonic 2 (bell resonance)
    osc3.frequency.setValueAtTime(450, time);
    osc3.frequency.exponentialRampToValueAtTime(350, time + 0.2);
    osc3.frequency.linearRampToValueAtTime(330, time + 1.8);
    
    // Main amplitude envelope
    gain.gain.setValueAtTime(0.4, time);
    gain.gain.exponentialRampToValueAtTime(0.05, time + 2);
    
    // Harmonic amplitudes
    gainOsc2.gain.setValueAtTime(0.15, time);
    gainOsc2.gain.exponentialRampToValueAtTime(0.02, time + 1.5);
    
    gainOsc3.gain.setValueAtTime(0.1, time);
    gainOsc3.gain.exponentialRampToValueAtTime(0.01, time + 1.8);
    
    // Start and stop all oscillators
    osc1.start(time);
    osc2.start(time);
    osc3.start(time);
    osc1.stop(time + 2);
    osc2.stop(time + 1.5);
    osc3.stop(time + 1.8);
  } catch (e) {
    console.log('Bell sound could not be played');
  }
}

// Toast Notification
function showNotification(msg) {
  let toast = document.querySelector('.toast-notify');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast-notify';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2600);
}

// --- 6. SUBMIT NEW REVIEW FORM (DEVOTEES FEEDBACK) ---
const reviewForm = document.getElementById('reviewForm');
if (reviewForm) {
  reviewForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nameInput = document.getElementById('reviewAuthor');
    const textInput = document.getElementById('reviewText');
    const ratingSelect = document.getElementById('reviewRating');

    const authorName = nameInput.value.trim();
    const reviewText = textInput.value.trim();
    const rating = ratingSelect ? parseInt(ratingSelect.value, 10) : 5;

    if (!authorName || !reviewText) return;

    const newReview = {
      id: Date.now(),
      author: { hi: authorName, en: authorName },
      text: { hi: reviewText, en: reviewText },
      rating: rating,
      date: new Date().toISOString().split('T')[0]
    };

    // 1. Try to save to data/reviews.json on disk via server (if running)
    try {
      await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorName,
          reviewText,
          rating
        })
      });
    } catch (err) {
      // Running in static mode without server
    }

    // 2. Save in localStorage so it stays in browser across page reloads
    try {
      const localReviews = getLocalSubmittedReviews();
      localReviews.unshift(newReview);
      localStorage.setItem('userSubmittedReviews', JSON.stringify(localReviews));
    } catch (err) {}

    // 3. Immediately display this review on index.html at the top!
    currentTopReviews.unshift(newReview);
    currentTopReviews = currentTopReviews.slice(0, 3);
    renderReviews(currentTopReviews);

    // 4. Show success notification
    const lang = getSavedLang();
    const msg = lang === 'hi'
      ? '🙏 आपकी समीक्षा मुख्य पृष्ठ पर जोड़ दी गई है!'
      : '🙏 Your review has been added to the page!';

    showNotification(msg);
    nameInput.value = '';
    textInput.value = '';
  });
}

// --- 7. CAMERA SHIFT ON SECTION SCROLL & NAV CLICK ---
const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting && temple3D) {
      const sectionId = entry.target.getAttribute('id') || 'home';
      temple3D.setCameraView(sectionId);
    }
  });
}, { threshold: 0.3 });

document.querySelectorAll('section[id]').forEach(sec => sectionObserver.observe(sec));

// --- 8. SCROLL PROGRESS & HEADER SHADOW ---
const header = document.querySelector('.site-header');
const progress = document.querySelector('.scroll-progress');

function onScroll() {
  if (header) header.classList.toggle('scrolled', window.scrollY > 12);
  if (progress) {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.width = max > 0 ? `${(window.scrollY / max) * 100}%` : '0%';
  }
}
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// --- 9. LIGHTBOX MODAL & IMAGE TILT ---
const galleryImages = document.querySelectorAll('.gallery-tile img, .gallery-tile-full img, .portrait-img, .about-img');
if (galleryImages.length > 0) {
  const lightbox = document.createElement('div');
  lightbox.className = 'lightbox-modal';
  lightbox.setAttribute('aria-hidden', 'true');
  lightbox.innerHTML = `
    <div class="lightbox-overlay"></div>
    <div class="lightbox-content">
      <button class="lightbox-close" aria-label="Close image">&times;</button>
      <img src="" alt="Full view" class="lightbox-img">
      <p class="lightbox-caption"></p>
    </div>
  `;
  document.body.appendChild(lightbox);

  const lbImg = lightbox.querySelector('.lightbox-img');
  const lbCaption = lightbox.querySelector('.lightbox-caption');
  const closeBtn = lightbox.querySelector('.lightbox-close');
  const overlay = lightbox.querySelector('.lightbox-overlay');

  function openLightbox(src, alt) {
    lbImg.src = src;
    lbImg.alt = alt || 'Shree Banke Bihari Ji Mandir';
    lbCaption.textContent = alt || '';
    lightbox.classList.add('active');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox.classList.remove('active');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  galleryImages.forEach(img => {
    img.style.cursor = 'pointer';
    img.addEventListener('click', (e) => {
      e.stopPropagation();
      openLightbox(img.src, img.alt);
    });
  });

  closeBtn.addEventListener('click', closeLightbox);
  overlay.addEventListener('click', closeLightbox);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && lightbox.classList.contains('active')) {
      closeLightbox();
    }
  });
}

// --- 10. OUR TEMPLES MODAL DIALOG ---
const templeData = {
  'shyam-kund': {
    title: { hi: "श्री श्याम कुंड बाबा मंदिर", en: "Shri Shyam Kund Baba Mandir" },
    img: "assets/shyam-kund.jpg",
    text: {
      hi: "श्री श्याम बिहारी मंदिर ग्राम सैनवा के सवल-थोक में स्थित है। इस मंदिर के महंत श्री गोपाल बाबा हैं। जो भी भक्त हिंदी महीना भादों अमावस को श्री श्याम कुंड की परिक्रमा कर एवं रास करवाता है, उनकी सभी मनोकामनाएं पूरी होती हैं। यहां अनेकानेक भक्त दूर-दूर से आकर अपनी अनेकों मनोकामना भगवान के सन्मुख रखते हैं। यह मंदिर श्री श्याम कुंड के तट पर बना हुआ है।",
      en: "Shri Shyam Bihari Mandir is situated in Sawal Thok of Village Sainwa, presided by Mahant Shri Gopal Baba. Devotees performing parikrama and holy Raas on Bhado Amavasya at Shri Shyam Kund have all their heartfelt wishes fulfilled. Devotees visit from far and wide to offer prayers at this divine shrine situated on the banks of holy Shyam Kund."
    }
  },
  'shyam-bihari': {
    title: { hi: "श्री श्याम बिहारी मंदिर", en: "Shri Shyam Bihari Mandir" },
    img: "assets/deity-main.jpg",
    text: {
      hi: "यह मंदिर ग्राम सैनवा के पीता थोक में स्थित है। यह मंदिर भी श्री श्याम कुंड के किनारे पर बना हुआ है। इस मंदिर में श्री कृष्ण, राधा, राम दरबार और माता रानी की दिव्य मूर्तियां विराजमान हैं। यहां की संध्या आरती का अलौकिक दृश्य मन मोह लेता है।",
      en: "Located in Peeta Thok, Village Sainwa, adjoining the sacred Shri Shyam Kund. The sanctum enshrines Lord Krishna, Radha Rani, Ram Darbar, and Mata Rani. The tranquil evening aarti here offers immense peace of mind."
    }
  },
  'tapa-baba': {
    title: { hi: "तपा बाबा मंदिर (सिद्ध चरण धाम)", en: "Tapa Baba Mandir (Siddha Charan Dham)" },
    img: "assets/tapa-baba.jpg",
    text: {
      hi: "ग्राम सैनवा की यह पावन सिद्ध तपोभूमि पूज्य तपा बाबा की कठोर तपस्या और साधना का केंद्र रही है। मंदिर में स्थापित पूज्य तपा बाबा के दिव्य चरण चिह्नों पर प्रतिदिन श्रद्धालु पुष्प, रोली व जल अर्पित करते हैं। ऐसी मान्यता है कि यहां सच्चे मन से मांगी गई हर मनोकामना पूर्ण होती है।",
      en: "This revered sacred ground in Village Sainwa is the spiritual sanctuary of Pujya Tapa Baba's penance. The holy sanctum preserves his divine marble footprints (charan chinha), where pilgrims offer daily flowers and prayers for fulfilment of heartfelt desires."
    }
  },
  'jahar-veer': {
    title: { hi: "श्री जाहर वीर मंदिर", en: "Shri Jahar Veer Mandir" },
    img: "assets/deity-main.jpg",
    text: {
      hi: "यह मंदिर ग्राम सैनवा के सयाल थोक में स्थित है। श्री श्याम कुंड बाबा के मंदिर पर संतों की प्रेरणा से श्री जाहर वीर गोगा जी महाराज का मंदिर निर्माण दिसंबर 2015 को हुआ था। यहां विशेष रूप से श्रद्धालु मनोकामना व रक्षा हेतु शीश नवाते हैं।",
      en: "Situated in Sayal Thok of Village Sainwa near Shri Shyam Kund. Constructed in December 2015 inspired by holy saints, dedicated to Shri Jahar Veer Goga Ji Maharaj for pilgrim protection and fulfillment of vows."
    }
  },
  'devi-mata': {
    title: { hi: "देवी माता का मंदिर", en: "Devi Mata Ka Mandir" },
    img: "assets/deity-main.jpg",
    text: {
      hi: "यह मंदिर गांव सैनवा के अंदया थोक में स्थित है। इस मंदिर का निर्माण दौलतिया बाबा ने करवाया था। इस मंदिर का निर्माण ४५ वर्ष पहले हुआ था। इस मंदिर की अपनी अलग मान्यता है। मंदिर के प्रांगण में बड़ा सुंदर कुआं और बहुत सुंदर वृक्ष है जो श्रद्धालुओं को शीतलता और शांति प्रदान करता है।",
      en: "Located in Andaya Thok, Village Sainwa. Constructed approximately 45 years ago by Doulatiya Baba. Renowned for its unique spiritual tradition, featuring a pristine ancient well and verdant heritage trees in the courtyard."
    }
  }
};

const templeModal = document.createElement('div');
templeModal.className = 'temple-modal';
templeModal.innerHTML = `
  <div class="temple-modal-overlay"></div>
  <div class="temple-modal-dialog">
    <button class="temple-modal-close" aria-label="Close">&times;</button>
    <img src="" alt="Temple" class="temple-modal-img">
    <h3 class="temple-modal-title"></h3>
    <p class="temple-modal-text"></p>
    <button class="btn-primary" id="btnTempleModalClose" style="width: 100%;">पूर्ण विवरण बंद करें / Close</button>
  </div>
`;
document.body.appendChild(templeModal);

const tmOverlay = templeModal.querySelector('.temple-modal-overlay');
const tmClose = templeModal.querySelector('.temple-modal-close');
const tmBtnClose = templeModal.querySelector('#btnTempleModalClose');
const tmImg = templeModal.querySelector('.temple-modal-img');
const tmTitle = templeModal.querySelector('.temple-modal-title');
const tmText = templeModal.querySelector('.temple-modal-text');

function openTempleModal(key) {
  const data = templeData[key];
  if (!data) return;
  const lang = getSavedLang();
  tmImg.src = data.img;
  tmTitle.textContent = data.title[lang] || data.title.hi;
  tmText.textContent = data.text[lang] || data.text.hi;
  templeModal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeTempleModal() {
  templeModal.classList.remove('active');
  document.body.style.overflow = '';
}

tmClose.addEventListener('click', closeTempleModal);
tmOverlay.addEventListener('click', closeTempleModal);
tmBtnClose.addEventListener('click', closeTempleModal);

document.addEventListener('click', (e) => {
  const btn = e.target.closest('.btn-view-temple');
  if (btn) {
    const key = btn.getAttribute('data-temple');
    openTempleModal(key);
  }
});


// Back-to-top button
const topBtn = document.createElement('button');
topBtn.className = 'back-top';
topBtn.type = 'button';
topBtn.setAttribute('aria-label', 'Back to top');
topBtn.innerHTML = '↑';
document.body.appendChild(topBtn);
window.addEventListener('scroll', () => topBtn.classList.toggle('show', window.scrollY > 400), { passive: true });
topBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

// Page Loader Hide & Initial Data Fetch
window.addEventListener('load', () => {
  setTimeout(() => document.querySelector('.page-loader')?.classList.add('hide'), 400);
  setLanguage(getSavedLang());
  initTempleStats();
  loadTopReviews();
});
