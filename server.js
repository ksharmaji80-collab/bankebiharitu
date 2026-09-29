import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const reviewsFilePath = path.join(__dirname, 'data', 'reviews.json');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// In-Memory Data Store for Live Interactions
let templeStats = {
  dailyVisitors: 1250,
  yearsOfService: 10,
  diyasOffered: 412,
  flowersShowered: 890,
  bellsRung: 640
};

let devoteeReviews = [
  {
    id: 1,
    author: { hi: "स्थानीय भक्त", en: "Local Devotee" },
    text: { hi: "बहुत ही शांत और पवित्र स्थान। दर्शन कर मन को असीम शांति मिलती है।", en: "A deeply peaceful and sacred place. Darshan here brings immense peace of mind." },
    rating: 5,
    date: "2026-08-28"
  },
  {
    id: 2,
    author: { hi: "राधा शर्मा", en: "Radha Sharma" },
    text: { hi: "मंदिर की 3D आभासी सेवा बहुत ही सुंदर है। घर बैठे दर्शन का लाभ मिला।", en: "The 3D virtual temple seva is breathtaking. Blessed to experience darshan from home." },
    rating: 5,
    date: "2026-08-30"
  },
  {
    id: 3,
    author: { hi: "भक्त परिवार", en: "Devotee Family" },
    text: { hi: "श्री बांके बिहारी जी की कृपा से सभी मनोकामनाएं पूर्ण होती हैं। जय श्री कृष्ण!", en: "By the grace of Banke Bihari Ji, all wishes are fulfilled. Jai Shree Krishna!" },
    rating: 5,
    date: "2026-09-01"
  }
];

// --- REST API ENDPOINTS ---

// 1. Temple Info & Timings API
app.get('/api/temple-info', (req, res) => {
  res.json({
    status: 'success',
    name: { hi: "श्री बांके बिहारी जी मंदिर", en: "Shree Banke Bihari Ji Mandir" },
    location: { hi: "ग्राम सैनवा, छाता, मथुरा (उत्तर प्रदेश)", en: "Village Sainwa, Chhata, Mathura (U.P., India)" },
    timings: [
      { id: 1, label: { hi: "प्रातः आरती", en: "Morning Aarti" }, time: "6:00 AM" },
      { id: 2, label: { hi: "प्रातः दर्शन", en: "Morning Darshan" }, time: "5:00 AM – 12:00 PM" },
      { id: 3, label: { hi: "सायं दर्शन", en: "Evening Darshan" }, time: "4:00 PM – 9:00 PM" },
      { id: 4, label: { hi: "सायं आरती", en: "Evening Aarti" }, time: "7:00 PM" }
    ],
    stats: templeStats
  });
});

// Helper to read reviews from file
function readReviewsFromFile() {
  try {
    if (fs.existsSync(reviewsFilePath)) {
      const data = fs.readFileSync(reviewsFilePath, 'utf8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Error reading reviews.json:', e);
  }
  return devoteeReviews;
}

// 2. Devotee Reviews API (Reads directly from data/reviews.json)
app.get('/api/reviews', (req, res) => {
  const reviews = readReviewsFromFile();
  res.json({ status: 'success', reviews });
});

// 3. Submit New Review API (Saves directly to data/reviews.json on disk)
app.post('/api/reviews', (req, res) => {
  const { authorName, reviewText, rating } = req.body;
  if (!authorName || !reviewText) {
    return res.status(400).json({ status: 'error', message: 'Author name and review text are required.' });
  }

  const reviews = readReviewsFromFile();

  const newReview = {
    id: Date.now(),
    author: { hi: authorName, en: authorName },
    text: { hi: reviewText, en: reviewText },
    rating: parseInt(rating, 10) || 5,
    date: new Date().toISOString().split('T')[0]
  };

  // Add new review at the beginning
  reviews.unshift(newReview);

  // Write directly into data/reviews.json on disk!
  try {
    fs.writeFileSync(reviewsFilePath, JSON.stringify(reviews, null, 2), 'utf8');
  } catch (e) {
    console.error('Error saving to reviews.json:', e);
  }

  res.status(201).json({ status: 'success', review: newReview, totalReviews: reviews.length });
});

// 4. Digital Seva Offering API (Diya, Flower, Bell)
app.post('/api/seva-offering', (req, res) => {
  const { type } = req.body; // 'diya' | 'flower' | 'bell'

  if (type === 'diya') {
    templeStats.diyasOffered += 1;
  } else if (type === 'flower') {
    templeStats.flowersShowered += 1;
  } else if (type === 'bell') {
    templeStats.bellsRung += 1;
  } else {
    return res.status(400).json({ status: 'error', message: 'Invalid seva type' });
  }

  res.json({
    status: 'success',
    type,
    stats: templeStats,
    message: { hi: `आपकी ${type} सेवा स्वीकार की गई!`, en: `Your ${type} seva has been offered!` }
  });
});

// 5. Donation Info API
app.get('/api/donate/info', (req, res) => {
  res.json({
    status: 'success',
    upiId: "yourtemple@upi",
    accountHolder: "Shree Banke Bihari Ji Mandir Trust",
    bank: "State Bank of India (SBI)",
    ifsc: "SBIN000XXXX"
  });
});

// Serve Static Frontend Files (Root directory first so live html/css/js files are loaded)
app.use(express.static(__dirname));
app.use(express.static(path.join(__dirname, 'public')));

// Explicit page routes
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/sevak-dal', (req, res) => res.sendFile(path.join(__dirname, 'sevak-dal.html')));
app.get('/aarti', (req, res) => res.sendFile(path.join(__dirname, 'aarti.html')));
app.get('/gallery', (req, res) => res.sendFile(path.join(__dirname, 'gallery.html')));
app.get('/donate', (req, res) => res.sendFile(path.join(__dirname, 'donate.html')));
app.get('/contact', (req, res) => res.sendFile(path.join(__dirname, 'contact.html')));

// Fallback to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🛕 Temple Node.js Express server is running on http://localhost:${PORT}`);
});
