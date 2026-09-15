export function renderHeader(activePage) {
  const link = (page, href, hi, en) =>
    `<a href="${href}" class="${activePage === page ? 'active' : ''}" data-hi="${hi}" data-en="${en}">${hi}</a>`;

  return `
    <div class="header-inner">
      <a href="index.html" class="logo-mark">
        <img src="/assets/logoimage.png" alt="Shree Banke Bihari Ji Mandir logo" class="logo-img">
        <span class="logo-text">
          <span class="logo-hi" data-hi="श्री बांके बिहारी जी मंदिर" data-en="Shree Banke Bihari Ji Mandir">श्री बांके बिहारी जी मंदिर</span>
          <span class="logo-sub" data-hi="सैनवा, छाता, मथुरा" data-en="Sainwa, Chhata, Mathura">सैनवा, छाता, मथुरा</span>
        </span>
      </a>

      <nav class="main-nav" id="mainNav">
        ${link('home', 'index.html', 'होम', 'Home')}
        ${link('gallery', 'gallery.html', 'गैलरी', 'Gallery')}
        ${link('blogs', 'blogs.html', 'ब्लॉग', 'Blogs')}
        ${link('donate', 'donate.html', 'दान करें', 'Donate')}
        ${link('contact', 'contact.html', 'संपर्क', 'Contact')}
      </nav>

      <div class="header-actions">
        <button class="lang-toggle" id="langToggle" aria-label="Toggle language">
          <span class="lang-option" data-lang="hi">हिं</span>
          <span class="lang-divider">/</span>
          <span class="lang-option" data-lang="en">EN</span>
        </button>
        <a href="donate.html" class="btn-donate" data-hi="दान करें" data-en="Donate Now">दान करें</a>
        <button class="menu-toggle" id="menuToggle" aria-label="Menu">
          <span></span><span></span><span></span>
        </button>
      </div>
    </div>
  `;
}

export function renderFooter() {
  return `
    <div class="footer-top">
      <div class="footer-brand">
        <img src="/assets/logoimage.png" alt="Temple logo" class="footer-logo">
        <p data-hi="“श्री बांके बिहारी जी के चरणों में समर्पित — भक्ति, सेवा और मानव कल्याण।”" data-en="“Devoted to the feet of Shree Banke Bihari Ji — devotion, service and human welfare.”">
          "श्री बांके बिहारी जी के चरणों में समर्पित — भक्ति, सेवा और मानव कल्याण।"
        </p>
      </div>

      <div class="footer-col">
        <h4 data-hi="त्वरित लिंक" data-en="Quick Links">त्वरित लिंक</h4>
        <a href="index.html" data-hi="होम" data-en="Home">होम</a>
        <a href="gallery.html" data-hi="गैलरी" data-en="Gallery">गैलरी</a>
        <a href="blogs.html" data-hi="ब्लॉग" data-en="Blog">ब्लॉग</a>
        <a href="donate.html" data-hi="दान करें" data-en="Donate">दान करें</a>
      </div>

      <div class="footer-col">
        <h4 data-hi="दर्शन समय" data-en="Timings">दर्शन समय</h4>
        <p data-hi="प्रातः आरती: 6:00 AM" data-en="Morning Aarti: 6:00 AM">प्रातः आरती: 6:00 AM</p>
        <p data-hi="सायं आरती: 7:00 PM" data-en="Evening Aarti: 7:00 PM">सायं आरती: 7:00 PM</p>
        <p data-hi="दर्शन: 5 AM – 12 PM, 4 PM – 9 PM" data-en="Darshan: 5 AM – 12 PM, 4 PM – 9 PM">दर्शन: 5 AM – 12 PM, 4 PM – 9 PM</p>
      </div>

      <div class="footer-col">
        <h4 data-hi="संपर्क करें" data-en="Get in Touch">संपर्क करें</h4>
        <p data-hi="फ़ोन: +91-XXXXXXXXXX" data-en="Phone: +91-XXXXXXXXXX">फ़ोन: +91-XXXXXXXXXX</p>
        <p data-hi="ईमेल: info@yourtemple.com" data-en="Email: info@yourtemple.com">ईमेल: info@yourtemple.com</p>
        <p data-hi="पता: श्री बांके बिहारी जी मंदिर, सैनवा, छाता, मथुरा (भारत)" data-en="Address: Shree Banke Bihari Ji Mandir, Sainwa, Chhata, Mathura (India)">पता: श्री बांके बिहारी जी मंदिर, सैनवा, छाता, मथुरा (भारत)</p>
      </div>
    </div>

    <div class="footer-bottom">
      <p data-hi="© 2026 श्री बांके बिहारी जी मंदिर. सर्वाधिकार सुरक्षित।" data-en="© 2026 Shree Banke Bihari Ji Mandir. All rights reserved.">© 2026 श्री बांके बिहारी जी मंदिर. सर्वाधिकार सुरक्षित।</p>
    </div>
  `;
}
