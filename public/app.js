console.log("App.js Loaded - v1.1");
// Dapur Senja Online Shop Logic
let cart = [];
let menuData = [];

// DOM Elements
const cartToggle = document.getElementById('cartToggle');
const cartDrawer = document.getElementById('cartDrawer');
const cartList = document.getElementById('cartList');
const cartCount = document.querySelector('.cart-count');
const cartTotalAmount = document.getElementById('cartTotalAmount');
const menuGrid = document.querySelector('.menu-grid');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Force CSS Override for cache bypassing
    const style = document.createElement('style');
    style.textContent = `
        .menu-card, .promo-card { background: transparent !important; border: none !important; box-shadow: none !important; }
        .menu-card:hover, .promo-card:hover { transform: translateY(-10px) !important; }
        .section-shell { border: none !important; box-shadow: none !important; border-radius: 0 !important; }
    `;
    document.head.appendChild(style);

    loadSettings();
    loadMenu();
    initYear();
    initReveal();
});

async function loadSettings() {
    try {
        const res = await fetch('/api/settings');
        const settings = await res.json();
        
        const m = (id, key) => { if(document.getElementById(id) && settings[key]) document.getElementById(id).textContent = settings[key]; };
        
        m('heroEyebrow', 'heroEyebrow');
        m('heroTitle', 'heroTitle');
        m('heroLead', 'heroLead');
        m('heroNoteEyebrow', 'heroNoteEyebrow');
        m('heroNoteTitle', 'heroNoteTitle');
        m('heroNoteDesc', 'heroNoteDesc');
        
        m('heroStat1Title', 'heroStat1Title');
        m('heroStat1Desc', 'heroStat1Desc');
        m('heroStat2Title', 'heroStat2Title');
        m('heroStat2Desc', 'heroStat2Desc');
        m('heroStat3Title', 'heroStat3Title');
        m('heroStat3Desc', 'heroStat3Desc');
        
        m('siteName', 'siteName');

        const brandLogoImg = document.getElementById('brandLogoImg');
        const brandMarkText = document.getElementById('brandMarkText');
        if (settings.siteLogo) {
            if (brandLogoImg) { brandLogoImg.src = settings.siteLogo; brandLogoImg.style.display = 'inline-block'; }
            if (brandMarkText) brandMarkText.style.display = 'none';
        } else {
            if (brandLogoImg) brandLogoImg.style.display = 'none';
            if (brandMarkText) {
                brandMarkText.textContent = settings.siteName ? settings.siteName.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase() : 'DS';
                brandMarkText.style.display = 'inline-flex';
            }
        }
        
        m('navHome', 'navHome');
        m('navAbout', 'navAbout');
        m('navMenu', 'navMenu');
        m('navTesti', 'navTesti');
        m('navGallery', 'navGallery');
        m('navContact', 'navContact');

        m('footerSlogan', 'footerSlogan');
        m('aboutEyebrow', 'aboutEyebrow');
        m('aboutTitle', 'aboutTitle');
        m('aboutText', 'aboutText');
        m('aboutTitle2', 'aboutTitle2');
        m('aboutText2', 'aboutText2');
        m('aboutTitle3', 'aboutTitle3');
        m('aboutText3', 'aboutText3');
        m('menuEyebrow', 'menuEyebrow');
        m('menuTitle', 'menuTitle');
        m('promoEyebrow', 'promoEyebrow');
        m('promoTitle', 'promoTitle');
        m('promoText', 'promoText');
        m('promoBadge1', 'promoBadge1');
        m('promoTitle1', 'promoTitle1');
        m('promoText1', 'promoText1');
        m('promoPrice1', 'promoPrice1');
        m('promoBadge2', 'promoBadge2');
        m('promoTitle2', 'promoTitle2');
        m('promoText2', 'promoText2');
        m('promoPrice2', 'promoPrice2');
        m('promoBadge3', 'promoBadge3');
        m('promoTitle3', 'promoTitle3');
        m('promoText3', 'promoText3');
        m('promoPrice3', 'promoPrice3');
        
        m('contactEyebrow', 'contactEyebrow');
        m('contactTitle', 'contactTitle');
        m('contactCard1Title', 'contactCard1Title');
        m('contactAddress', 'contactAddress');
        m('contactHours', 'contactHours');
        m('contactCard2Title', 'contactCard2Title');
        
        m('contactIG', 'contactIGUser');
        m('contactTikTok', 'contactTikTokUser');
        
        const setLink = (id, key) => { if (document.getElementById(id) && settings[key]) document.getElementById(id).href = settings[key]; };
        setLink('contactIG', 'contactIG');
        setLink('contactTikTok', 'contactTikTok');
        
        m('contactCard3Title', 'contactCard3Title');
        m('contactCard3Text', 'contactCard3Text');
        setLink('contactGrabUrl', 'contactGrabUrl');
        setLink('contactGojekUrl', 'contactGojekUrl');
        
        const mapIframe = document.getElementById('contactMapIframe');
        if (mapIframe && settings.contactMapUrl) {
            let mapUrl = settings.contactMapUrl;
            const srcMatch = mapUrl.match(/src="([^"]+)"/);
            if (srcMatch) mapUrl = srcMatch[1];
            mapIframe.src = mapUrl;
        }
        
        m('footerBrand', 'footerBrand');
        
        const fCopyright = document.getElementById('footerCopyright');
        if (fCopyright && settings.footerCopyright) {
            fCopyright.innerHTML = settings.footerCopyright.replace('{year}', new Date().getFullYear());
        }

        // Render Dynamic Blocks
        const blocksContainer = document.getElementById('customBlocksContainer');
        if (blocksContainer && settings.customBlocks && Array.isArray(settings.customBlocks)) {
            blocksContainer.innerHTML = settings.customBlocks.map(block => `
                <section class="section-shell" style="padding-top:4rem; padding-bottom:4rem; text-align:center;">
                    <div class="reveal active" style="max-width: 800px; margin: 0 auto;">
                        ${block.image ? `<img src="${block.image}" alt="${block.title}" style="width:100%; border-radius:12px; margin-bottom:2rem; max-height:400px; object-fit:cover; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">` : ''}
                        <h2>${block.title}</h2>
                        <p style="color:var(--muted); font-size:1.1rem; line-height:1.6;">${block.text}</p>
                    </div>
                </section>
            `).join('');
        }

        initHeroSlideshow(settings.heroImageMain);
        if (document.getElementById('heroImgAccent')) document.getElementById('heroImgAccent').src = settings.heroImageAccent || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80';
        
        // Apply Dynamic Theme Settings
        if (settings.themeBrand) document.documentElement.style.setProperty('--brand', settings.themeBrand);
        if (settings.themeCard) document.documentElement.style.setProperty('--card-bg', settings.themeCard);
        if (settings.themeInk) document.documentElement.style.setProperty('--text-color', settings.themeInk);
        if (settings.themeBg) {
            document.documentElement.style.setProperty('--page-bg', settings.themeBg);
            document.body.style.backgroundColor = settings.themeBg; // override body background explicitly
        }
        
        // Update WhatsApp link if exists
        window.siteSettings = settings;
    } catch (err) {
        console.error('Failed to load settings:', err);
    }
}

function initYear() {
    const yearTarget = document.getElementById("currentYear");
    if (yearTarget) yearTarget.textContent = String(new Date().getFullYear());
}

function initHeroSlideshow(customHeroImage) {
    const container = document.querySelector('.hero-card-main');
    const imgEl = document.getElementById('heroImgMain');
    if (!container || !imgEl) return;
    
    const slides = [
        customHeroImage || "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=1200&q=80", // Chocolate cake
        "https://images.unsplash.com/photo-1587248720327-8eb72564be1e?auto=format&fit=crop&w=1200&q=80", // Slice
        "https://images.unsplash.com/photo-1621236378699-8597faa6a728?auto=format&fit=crop&w=1200&q=80"  // Berry cake
    ];
    
    imgEl.src = slides[0];
    
    const img2 = document.createElement('img');
    img2.src = slides[0];
    img2.style.position = 'absolute';
    img2.style.top = '0';
    img2.style.left = '0';
    img2.style.width = '100%';
    img2.style.height = '100%';
    img2.style.objectFit = 'cover';
    img2.style.transition = 'opacity 1s ease-in-out';
    img2.style.opacity = '0';
    img2.style.zIndex = '2';
    
    container.style.position = 'relative';
    container.appendChild(img2);
    
    let currentSlide = 0;
    
    setInterval(() => {
        const nextSlide = (currentSlide + 1) % slides.length;
        img2.src = slides[nextSlide];
        img2.style.opacity = '1';
        
        setTimeout(() => {
            imgEl.src = slides[nextSlide];
            img2.style.transition = 'none';
            img2.style.opacity = '0';
            setTimeout(() => {
                 img2.style.transition = 'opacity 1s ease-in-out';
            }, 50);
            currentSlide = nextSlide;
        }, 1000);
    }, 4000);
}

async function loadMenu() {
    try {
        const res = await fetch('/api/services');
        const data = await res.json();
        menuData = data.services;
        renderMenu();
    } catch (err) {
        console.error('Failed to load menu:', err);
    }
}

function renderMenu() {
    const grid = document.querySelector('.menu-grid');
    if (!grid) return;
    grid.innerHTML = '';
    
    menuData.forEach(item => {
        const card = document.createElement('article');
        card.className = 'menu-card reveal';
        card.innerHTML = `
            <div class="media-frame">
                <img src="${item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80'}" alt="${item.name}" loading="lazy">
            </div>
            <div class="menu-copy">
                <h3>${item.name}</h3>
                <p>${item.description || ''}</p>
                <div class="menu-meta">
                    <strong>Rp${item.price.toLocaleString('id-ID')}</strong>
                    <button class="add-btn" onclick="addToCart('${item.id}')">Beli +</button>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
    initReveal();
}

// Cart Management
window.toggleCart = () => {
    cartDrawer.classList.toggle('open');
};

cartToggle?.addEventListener('click', toggleCart);

window.addToCart = (id) => {
    const item = menuData.find(i => i.id === id);
    const existing = cart.find(i => i.id === id);
    
    if (existing) {
        existing.qty++;
    } else {
        cart.push({ ...item, qty: 1 });
    }
    
    updateCartUI();
    if (!cartDrawer.classList.contains('open')) toggleCart();
};

function updateCartUI() {
    cartCount.textContent = cart.reduce((acc, i) => acc + i.qty, 0);
    
    if (cart.length === 0) {
        cartList.innerHTML = '<p style="text-align: center; color: #636e72; margin-top: 2rem;">Keranjang Anda masih kosong.</p>';
        cartTotalAmount.textContent = 'Rp0';
        return;
    }
    
    cartList.innerHTML = cart.map(item => `
        <div class="cart-item-row">
            <div>
                <div style="font-weight: 600;">${item.name}</div>
                <div style="font-size: 0.85rem; color: #636e72;">${item.qty} x Rp${item.price.toLocaleString('id-ID')}</div>
            </div>
            <div style="font-weight: 700;">Rp${(item.price * item.qty).toLocaleString('id-ID')}</div>
        </div>
    `).join('');
    
    const total = cart.reduce((acc, i) => acc + (i.price * i.qty), 0);
    cartTotalAmount.textContent = `Rp${total.toLocaleString('id-ID')}`;
}

window.checkoutOrder = async () => {
    if (cart.length === 0) return alert('Keranjang kosong!');
    
    const name = prompt('Masukkan Nama Anda untuk pesanan:');
    if (!name) return;

    const payload = {
        branchId: 'br_yogyakarta_pusat', // Default branch
        customerName: name,
        items: cart.map(i => ({ serviceId: i.id, quantity: i.qty }))
    };

    try {
        const res = await fetch('/api/transactions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            const data = await res.json();
            const waText = `Halo Dapur Senja, saya ingin memesan:\n\n` + 
                cart.map(i => `- ${i.name} (${i.qty}x)`).join('\n') + 
                `\n\nTotal: ${cartTotalAmount.textContent}\nAtas nama: ${name}\nNomor Pesanan: ${data.transaction.invoiceNumber}`;
            
            window.open(`https://wa.me/6281234567890?text=${encodeURIComponent(waText)}`, '_blank');
            cart = [];
            updateCartUI();
            toggleCart();
            alert('Pesanan Anda telah tercatat! Silakan lanjutkan konfirmasi melalui WhatsApp.');
        }
    } catch (err) {
        alert('Gagal mengirim pesanan. Silakan coba lagi.');
    }
};

// Scroll Reveal
function initReveal() {
    const revealItems = document.querySelectorAll(".reveal");
    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("is-visible");
                    observer.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.1 }
    );
    revealItems.forEach((item) => observer.observe(item));
}

// Menu Toggle Mobile
const menuToggle = document.querySelector(".menu-toggle");
const siteNav = document.getElementById("siteNav");
if (menuToggle && siteNav) {
    menuToggle.addEventListener("click", () => {
        document.body.classList.toggle("menu-open");
    });
}
