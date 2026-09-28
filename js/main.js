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

const defaultReviews = [
  {
    id: 1790327179789,
    author: { hi: "gopal sharma", en: "Gopal Sharma" },
    text: { hi: "sabhi har mahine 10 tarik ko qr pr 200 rupee kre jisse ki mandir ka fund badh jaye", en: "Everyone should contribute via QR by the 10th of every month to support the temple fund." },
    rating: 5
  },
  {
    id: 1,
    author: { hi: "राधा शर्मा", en: "Radha Sharma" },
    text: { hi: "मंदिर की 3D आभासी सेवा बहुत ही सुंदर है। घर बैठे श्री बांके बिहारी जी के दर्शन का असीम आनंद मिला।", en: "The 3D virtual temple seva is breathtaking. Blessed to experience divine darshan of Shree Banke Bihari Ji from home." },
    rating: 5
  },
  {
    id: 2,
    author: { hi: "स्थानीय भक्त", en: "Local Devotee" },
    text: { hi: "बहुत ही शांत और पावन धाम। सैनवा गांव में बिहारी जी के दर्शन कर मन को असीम शांति प्राप्त होती है।", en: "A deeply peaceful and sacred place. Visiting Bihari Ji in Sainwa village brings immense peace of mind." },
    rating: 5
  }
];

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
    const existingIds = new Set(defaultReviews.map(r => r.id));
    const merged = [
      ...localReviews.filter(r => !existingIds.has(r.id)),
      ...defaultReviews
    ];
    currentTopReviews = merged.slice(0, 3);
    renderReviews(currentTopReviews);
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
    const isOpen = nav.classList.toggle('open');
    menuBtn.classList.toggle('is-open', isOpen);
    return;
  }
  // Auto-close menu if open and user clicks outside nav or on any link inside nav
  if (nav && nav.classList.contains('open')) {
    if (!e.target.closest('#mainNav') || e.target.closest('#mainNav a')) {
      nav.classList.remove('open');
      const mb = document.getElementById('menuToggle');
      if (mb) mb.classList.remove('is-open');
    }
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
      hi: `<p><strong>श्री श्याम बिहारी मंदिर, सैनवा :</strong> श्री श्याम बिहारी मंदिर ग्राम सैनवा के सवल-थोक में स्थित है। इस मंदिर के महंत श्री गोपाल बाबा हैं। जो भी भक्त हिंदी महीना भादों अमावस को श्री श्याम कुंड की परिक्रमा कर एवं रास करवाता है, उनकी सभी मनोकामनाएं पूरी होती हैं। यहां अनेकानेक भक्त दूर-दूर से आकर अपनी अनेकों मनोकामना भगवान के सन्मुख रखते हैं। यह मंदिर श्री श्याम कुंड के तट पर बना हुआ है।</p>
<p><strong>पर्व एवं रास की महिमा :</strong> भादों अमावस के दिन यहां बड़ा सुंदर मेले का आयोजन होता है। मेले में विशाल दंगल का आयोजन किया जाता है। मेले के ही उपलक्ष में श्री श्याम बिहारी सेवक दल की ओर से विशाल छप्पन भोग का आयोजन भी किया जाता है। यहां अमावस के दिन रास का विशेष महत्व है, इसलिए इस मेले को "रास का मेला" भी कहा जाता है। इस दिन से श्याम कुंड के मंदिर पर 11 दिनों तक स्वामी श्री ईश्वर चंद जी के श्री श्याम बिहारी रासलीला मंडल द्वारा बहुत ही सुंदर रास का आयोजन किया जाता है।</p>
<p><strong>श्री श्याम कुंड तालाब का पावन इतिहास :</strong> जब भगवान श्री कृष्ण अपने अनन्य भक्तों के साथ गौ चारण करने के लिए आए, तो भगवान के जो सखा थे उनको प्यास लगी। तब भगवान ने अपनी मुरली के द्वारा एक गड्ढा खोदा, उस गड्ढे से समस्त ग्वाल-बालों ने तृप्त होकर जल पिया। उस पावन कुंड की महिमा हमारे बुजुर्ग लोग बताते हैं कि भादों के महीने में अमावस के दिन श्याम कुंड से दूध की धार निकलती है, जिसे बुजुर्गों ने प्रत्यक्ष देखा भी है। अब इस पवित्र कुंड का विस्तार हो चुका है और यह लगभग 8 से 10 बीघा के क्षेत्रफल में बना हुआ है।</p>`,
      en: `<p><strong>Shri Shyam Bihari Mandir, Sainwa :</strong> Situated in Sawal Thok of Village Sainwa, presided by Mahant Shri Gopal Baba. Devotees performing holy parikrama and organizing sacred Raas on Bhado Amavasya at Shri Shyam Kund have all their heartfelt wishes fulfilled. Situated majestically on the banks of Shri Shyam Kund.</p>
<p><strong>Festivals & The Glory of Raas :</strong> A grand fair is celebrated on Bhado Amavasya featuring an exhilarating wrestling championship (Dangal) and a grand Chhappan Bhog hosted by Shri Shyam Bihari Sevak Dal. Celebrated as the 'Raas Ka Mela', Swami Shri Ishwar Chand Ji's troupe performs an 11-day divine Raasleela.</p>
<p><strong>Divine Legend of Shri Shyam Kund :</strong> When Lord Krishna came grazing cows with his companions and they grew thirsty, the Lord created this holy reservoir with his divine flute. Sacred folklore affirms that pure streams of milk flow from Shyam Kund on Bhado Amavasya. Today, the sacred reservoir spans an expansive 8 to 10 bighas.</p>`
    }
  },
  'shyam-bihari': {
    title: { hi: "श्री श्याम बिहारी मंदिर", en: "Shri Shyam Bihari Mandir" },
    img: "assets/deity-main.jpg",
    text: {
      hi: `<p><strong>स्थान व दिव्यता :</strong> यह मंदिर ग्राम सैनवा के पीता-थोक में स्थित है। यह मंदिर भी श्री श्याम कुंड के किनारे पर बना हुआ है। इस मंदिर में भगवान श्री कृष्ण-राधा, श्री राम दरबार एवं माता रानी की दिव्य मूर्तियां विराजमान हैं।</p>
<p><strong>प्राकृतिक सौंदर्य व दैनिक सेवा :</strong> कुंड के किनारे स्थित श्री श्याम कुंड मंदिर के समीप एक सुंदर बगीची एवं सघन वृक्षावली है, जो मन को अलौकिक आनंद व शांति प्रदान करती है। मंदिर के पूज्य पुजारी श्री श्याम नंद बाबा हैं। मंदिर पर प्रतिदिन सुबह और शाम भक्तिमय भजन-कीर्तन व आरती होती है।</p>
<p><strong>पशु-पक्षियों के जलपान हेतु सरोवर :</strong> इस मंदिर के एक तरफ बहुत ही विशाल तालाब बना हुआ है, जो ग्राम के पशुओं एवं पक्षियों के जलपान व तृप्ति के लिए विशेष रूप से समर्पित है।</p>`,
      en: `<p><strong>Sacred Shrine :</strong> Located in Peeta Thok of Village Sainwa, on the holy banks of Shri Shyam Kund. The sanctum enshrines the deities of Shri Krishna-Radha, Shri Ram Darbar, and Mata Rani.</p>
<p><strong>Spiritual Serenity & Daily Seva :</strong> Adjoining the temple is a lush, peaceful garden offering spiritual tranquility. Head priest Shri Shyam Nand Baba conducts daily morning and evening devotional kirtans and aartis.</p>
<p><strong>Natural Reservoir for Wildlife :</strong> Adjacent to the shrine is a large serene pond serving as a vital sanctuary and watering haven for local birds and domestic animals.</p>`
    }
  },
  'bihari-ji': {
    title: { hi: "श्री बिहारी जी मंदिर", en: "Shri Bihari Ji Mandir" },
    img: "assets/deity-main.jpg",
    text: {
      hi: `<p><strong>ग्राम सैनवा का सबसे प्राचीन मंदिर :</strong> यह मंदिर गांव सैनवा के गुलाल-थोक में स्थित है। यहां के महंत श्री चन्नी बाबा पुजारी जी हैं। मान्यता अनुसार यह गांव सैनवा का सबसे प्राचीन मंदिर है। जिस समय हमारा गांव सैनवा बसा, उससे भी पूर्व यह मंदिर यहां स्थित था।</p>
<p><strong>श्री बांके बिहारी सरकार का साक्षात् स्वरूप :</strong> श्री बिहारी जी सरकार का विशेष महत्त्व यह है कि जो वृंदावन में श्री बांके बिहारी सरकार विराजमान हैं, उन्हीं का साक्षात् स्वरूप ग्राम सैनवा में भी था। बहुत पुरानी बात है, एक बार गांव सैनवा में कुछ चोर आए और श्री बिहारी जी सरकार के श्रीविग्रह को चुरा कर ले गए थे। तब बिहारी जी मंदिर पर पुनः जयपुर से दूसरी बिहारी जी की दिव्य मूर्ति लाकर प्राण-प्रतिष्ठा कराई गई एवं विशाल प्रसाद वितरण हुआ।</p>
<p><strong>परिसर एवं सुंदर तालाब :</strong> श्री बिहारी जी सरकार के मंदिर के निकट ही सुंदर वृक्षावली है और मंदिर के निकट एक सुंदर तालाब बना हुआ है, जिसमें गांव के अनेकों पशु-पक्षी आकर जलपान करते हैं।</p>`,
      en: `<p><strong>Most Ancient Sanctuary :</strong> Located in Gulal Thok, Village Sainwa, tended by Mahant Shri Channi Baba Pujari Ji. It is revered as the oldest shrine in Sainwa, predating even the establishment of the village itself.</p>
<p><strong>Living Presence of Vrindavan's Bihari Ji :</strong> The temple shares an unbroken spiritual connection with Vrindavan's Banke Bihari Ji. When the historic deity was stolen in ancient days, a consecrated marble idol was brought from Jaipur with Vedic rituals and grand prasad celebrations.</p>
<p><strong>Surroundings & Holy Pond :</strong> Surrounded by dense trees and a pristine waterbody providing respite and hydration to all surrounding birds and cattle.</p>`
    }
  },
  'tapa-baba': {
    title: { hi: "तपा बाबा मंदिर (सिद्ध चरण धाम)", en: "Tapa Baba Mandir (Siddha Charan Dham)" },
    img: "assets/tapa-baba.jpg",
    text: {
      hi: `<p><strong>सिद्ध तपोभूमि :</strong> ग्राम सैनवा की यह पावन सिद्ध भूमि पूज्य तपा बाबा की कठोर तपस्या, साधना और त्याग का केंद्र रही है।</p>
<p><strong>दिव्य चरण चिह्न दर्शन :</strong> मंदिर में स्थापित पूज्य तपा बाबा के दिव्य चरण चिह्नों पर प्रतिदिन श्रद्धालु पुष्प, रोली, चंदन व जल अर्पित करते हैं। ऐसी मान्यता है कि यहां सच्चे मन व निष्काम भाव से मांगी गई हर मनोकामना पूर्ण होती है और जीवन में शांति व समृद्धि प्राप्त होती है।</p>`,
      en: `<p><strong>Sacred Tapobhoomi :</strong> The hallowed meditation grounds of ascetic saint Pujya Tapa Baba, whose penance sanctified Village Sainwa.</p>
<p><strong>Holy Footprint Sanctuary :</strong> Devotees bow before the consecrated divine marble footprints (Charan Chinha) with offerings of flowers, roli, and water to seek spiritual guidance and the fulfilment of heartfelt wishes.</p>`
    }
  },
  'jahar-veer': {
    title: { hi: "जहार वीर गोगा जी मंदिर", en: "Jahar Veer Goga Ji Mandir" },
    img: "assets/deity-main.jpg",
    text: {
      hi: `<p><strong>स्थापना व निर्माण इतिहास :</strong> ग्राम सैनवा के सवल-थोक में स्थित यह पावन मंदिर श्री श्याम कुंड के तट पर बना हुआ है। श्री श्याम कुंड बाबा के मंदिर पर स्वर्गीय श्री बिशम्बर नाथ जी की प्रेरणा से श्री जाहर वीर गोगा जी मंदिर का निर्माण श्री ब्रजमोहन नाथ जी एवं श्री दिनेश कुमार मास्टर के कर कमलों द्वारा तथा समस्त भक्तों के सहयोग से दिनांक 11 दिसम्बर 2015 को हुआ था।</p>
<p><strong>मूर्ति प्राण-प्रतिष्ठा :</strong> मंदिर में मूर्ति स्थापना दिनांक 12 अगस्त 2016 (आधी भादों नवमी) को कराई गई। इसमें गुरु श्री गोरखनाथ जी, श्री जाहर वीर गोगा जी, काली मैया एवं भैरवनाथ जी की मूर्तियों की स्थापना की गई।</p>
<p><strong>महंत सेवा व वार्षिक महोत्सव :</strong> इस मंदिर के महंत श्री ब्रज मोहन नाथ जी हैं और वे ही नित्य सेवा-पूजा करते हैं। प्रति वर्ष भादों सुदी नवमी को बाबा का भव्य जागरण एवं विशाल भंडारा होता है। यहां पर जो भक्त बाबा से मन्नत मांगते हैं, वह अवश्य पूरी होती है।</p>`,
      en: `<p><strong>Temple Foundation :</strong> Inspired by Late Shri Bishambar Nath, this temple was established through the leadership of Shri Braj Mohan Nath Ji, Shri Dinesh Kumar Master, and the devotion of all villagers on 11 December 2015 on the banks of Shri Shyam Kund in Sawal Thok, Village Sainwa.</p>
<p><strong>Idol Consecration :</strong> Sacred consecration took place on 12 August 2016 (Bhado Navami), enshrining deities of Guru Shri Gorakhnath Ji, Shri Jahar Veer Goga Ji, Kali Maiya, and Bhairavnath Ji.</p>
<p><strong>Priesthood & Grand Annual Festival :</strong> Presided by Mahant Shri Braj Mohan Nath Ji. Every year on Bhado Sudi Navami, a celebrated jagran and grand community feast (bhandara) are organized, fulfilling the vows of all visiting pilgrims.</p>`
    }
  },
  'devi-mata': {
    title: { hi: "देवी माता मंदिर", en: "Devi Mata Mandir" },
    img: "assets/deity-main.jpg",
    text: {
      hi: `<p><strong>प्राचीन शक्ति स्थल :</strong> यह मंदिर गांव सैनवा के अंदास थोक में स्थित है। इस मंदिर का निर्माण दौसौला बाबा ने आज से लगभग 45 वर्ष पहले करवाया था। इस मंदिर की अपनी अलग मान्यता है। मंदिर के प्रांगण में बड़ा सुंदर कुआं और बहुत सुंदर वृक्ष हैं।</p>
<p><strong>कुएं का आध्यात्मिक व औषधीय महत्त्व :</strong> मान्यता है कि कुएं के पावन जल से स्नान करके श्रद्धालु अपने समस्त रोगों जैसे फोड़ा-फुंसी, चर्म रोग एवं दाद इत्यादि से निजात व छुटकारा पा सकते हैं।</p>
<p><strong>नवरात्र जागरण व जात :</strong> मंदिर पर नवरात्रों में भक्तों द्वारा माता रानी का भव्य जागरण कराया जाता है और माता रानी की जात लगती है। अनेकों भक्त माता रानी की जात लगाकर और दर्शन कर अनेकों रोगों से छुटकारा पाते हैं तथा मनोवांछित फल प्राप्त करते हैं।</p>`,
      en: `<p><strong>Sacred Shakti Abode :</strong> Located in Andas Thok, Village Sainwa. Established around 45 years ago by revered Dausola Baba. The sanctuary grounds house a pristine heritage water-well and beautiful shady sacred trees.</p>
<p><strong>Miraculous Well Water :</strong> Devotees strongly believe that bathing in the holy well water relieves various dermatological afflictions, skin ailments, and troubles.</p>
<p><strong>Navratri Celebrations & Jaat :</strong> During Navratri, vibrant night vigils (jagrans) and sacred ceremonial vows ('jaat') take place, attracting pilgrims seeking Mata Rani's healing grace and protection.</p>`
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
    <div class="temple-modal-text"></div>
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

function openTempleModal(key, cardImgSrc) {
  const data = templeData[key];
  if (!data) return;
  const lang = getSavedLang();
  tmImg.src = cardImgSrc || data.img;
  tmTitle.textContent = data.title[lang] || data.title.hi;
  tmText.innerHTML = data.text[lang] || data.text.hi;
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
    const card = btn.closest('.temple-card');
    const cardImg = card ? card.querySelector('.temple-img-wrap img') : null;
    openTempleModal(key, cardImg ? cardImg.src : null);
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
