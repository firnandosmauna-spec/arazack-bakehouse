// Admin Dashboard Logic
let currentSession = null;

// Auth Check
const loginForm = document.getElementById('loginForm');
const loginOverlay = document.getElementById('loginOverlay');
const loginError = document.getElementById('loginError');

loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = e.target.username.value;
    const password = e.target.password.value;

    try {
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await res.json();
        if (res.ok) {
            currentSession = data.user;
            loginOverlay.style.display = 'none';
            loadData();
        } else {
            loginError.textContent = data.error || 'Login gagal';
        }
    } catch (err) {
        loginError.textContent = 'Terjadi kesalahan jaringan.';
    }
});

function logout() {
    fetch('/api/logout', { method: 'POST' }).then(() => {
        window.location.reload();
    });
}

// Tab Management
const tabs = document.querySelectorAll('.nav-item[data-tab]');
tabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
        e.preventDefault();
        const target = tab.getAttribute('data-tab');
        
        document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
        document.getElementById(target + 'Tab').style.display = 'block';
        
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        if (target === 'menu') loadMenu();
        if (target === 'orders') loadOrders();
        if (target === 'settings') {
            loadSettings();
            const iframe = document.getElementById('livePreview');
            if(iframe) iframe.contentWindow.location.reload();
        }
    });
});

let currentSiteSettings = {};

async function loadSettings() {
    const res = await fetch('/api/settings');
    currentSiteSettings = await res.json();
    
    const m = (id, key) => { if(document.getElementById(id)) document.getElementById(id).value = currentSiteSettings[key] || ''; };
    
    m('setSiteName', 'siteName');
    m('setSiteLogo', 'siteLogo');
    m('setWA', 'whatsappNumber');
    
    m('setFooterSlogan', 'footerSlogan');
    
    m('setNavHome', 'navHome');
    m('setNavAbout', 'navAbout');
    m('setNavMenu', 'navMenu');
    m('setNavTesti', 'navTesti');
    m('setNavGallery', 'navGallery');
    m('setNavContact', 'navContact');
    
    m('setHeroEyebrow', 'heroEyebrow');
    m('setHeroTitle', 'heroTitle');
    m('setHeroLead', 'heroLead');
    m('setHeroImageMain', 'heroImageMain');
    m('setHeroImageAccent', 'heroImageAccent');
    m('setHeroNoteEyebrow', 'heroNoteEyebrow');
    m('setHeroNoteTitle', 'heroNoteTitle');
    m('setHeroNoteDesc', 'heroNoteDesc');
    
    m('setHeroStat1Title', 'heroStat1Title');
    m('setHeroStat1Desc', 'heroStat1Desc');
    m('setHeroStat2Title', 'heroStat2Title');
    m('setHeroStat2Desc', 'heroStat2Desc');
    m('setHeroStat3Title', 'heroStat3Title');
    m('setHeroStat3Desc', 'heroStat3Desc');
    
    m('setAboutEyebrow', 'aboutEyebrow');
    m('setAboutTitle', 'aboutTitle');
    m('setAboutTitle1', 'aboutTitle1');
    m('setAboutText', 'aboutText');
    m('setAboutTitle2', 'aboutTitle2');
    m('setAboutText2', 'aboutText2');
    m('setAboutTitle3', 'aboutTitle3');
    m('setAboutText3', 'aboutText3');
    
    m('setMenuEyebrow', 'menuEyebrow');
    m('setMenuTitle', 'menuTitle');
    
    m('setPromoEyebrow', 'promoEyebrow');
    m('setPromoTitle', 'promoTitle');
    m('setPromoText', 'promoText');
    
    m('setPromoBadge1', 'promoBadge1'); m('setPromoTitle1', 'promoTitle1'); m('setPromoText1', 'promoText1'); m('setPromoPrice1', 'promoPrice1');
    m('setPromoBadge2', 'promoBadge2'); m('setPromoTitle2', 'promoTitle2'); m('setPromoText2', 'promoText2'); m('setPromoPrice2', 'promoPrice2');
    m('setPromoBadge3', 'promoBadge3'); m('setPromoTitle3', 'promoTitle3'); m('setPromoText3', 'promoText3'); m('setPromoPrice3', 'promoPrice3');
    
    m('setContactEyebrow', 'contactEyebrow');
    m('setContactTitle', 'contactTitle');
    m('setContactCard1Title', 'contactCard1Title');
    m('setContactAddress', 'contactAddress');
    m('setContactHours', 'contactHours');
    m('setContactCard2Title', 'contactCard2Title');
    m('setContactIGUser', 'contactIGUser');
    m('setContactIG', 'contactIG');
    m('setContactTikTokUser', 'contactTikTokUser');
    m('setContactTikTok', 'contactTikTok');
    m('setContactCard3Title', 'contactCard3Title');
    m('setContactCard3Text', 'contactCard3Text');
    m('setContactGrabUrl', 'contactGrabUrl');
    m('setContactGojekUrl', 'contactGojekUrl');
    m('setContactMapUrl', 'contactMapUrl');
    
    m('setFooterBrand', 'footerBrand');
    m('setFooterCopyright', 'footerCopyright');
    
    // Default colors if not set
    m('setThemeBrand', 'themeBrand'); if(!currentSiteSettings.themeBrand) document.getElementById('setThemeBrand').value = '#9d4528';
    m('setThemeCard', 'themeCard'); if(!currentSiteSettings.themeCard) document.getElementById('setThemeCard').value = '#ffffff';
    m('setThemeInk', 'themeInk'); if(!currentSiteSettings.themeInk) document.getElementById('setThemeInk').value = '#2b211d';
    m('setThemeBg', 'themeBg'); if(!currentSiteSettings.themeBg) document.getElementById('setThemeBg').value = '#fcfaf7';
    
    customBlocksData = currentSiteSettings.customBlocks || [];
    renderCustomBlocksAdmin();
    updateAdminSidebarBrand(currentSiteSettings.siteName || 'Dapur Senja', currentSiteSettings.siteLogo);
}

function updateAdminSidebarBrand(name, logoUrl) {
    const elName = document.getElementById('adminSidebarName');
    const elInit = document.getElementById('adminSidebarInitial');
    const elLogo = document.getElementById('adminSidebarLogoImg');
    
    if (elName) elName.textContent = name;
    
    if (logoUrl) {
        if (elLogo) { elLogo.src = logoUrl; elLogo.style.display = 'inline-block'; }
        if (elInit) elInit.style.display = 'none';
    } else {
        if (elLogo) elLogo.style.display = 'none';
        if (elInit) {
            const initials = name ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'DS';
            elInit.textContent = initials;
            elInit.style.display = 'inline-flex';
        }
    }
}

let customBlocksData = [];

function renderCustomBlocksAdmin() {
    const editor = document.getElementById('customBlocksEditor');
    if (!editor) return;
    editor.innerHTML = '';
    customBlocksData.forEach((block, index) => {
        const div = document.createElement('div');
        div.style = 'background:#f8f9fa; padding:12px; border-radius:6px; margin-bottom:12px; position:relative; border:1px solid #dfe6e9;';
        div.innerHTML = `
            <button type="button" style="position:absolute; right:12px; top:12px; background:#ff7675; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; font-size:12px;" onclick="removeCustomBlock(${index})">Hapus</button>
            <div class="form-group-small" style="padding-right: 50px;"><label>Judul Blok</label><input type="text" value="${block.title || ''}" oninput="updateCustomBlock(${index}, 'title', this.value)"></div>
            <div class="form-group-small"><label>Isi Teks</label><textarea rows="2" oninput="updateCustomBlock(${index}, 'text', this.value)">${block.text || ''}</textarea></div>
            <div class="form-group-small"><label>URL Gambar (Opsional)</label><input type="text" value="${block.image || ''}" oninput="updateCustomBlock(${index}, 'image', this.value)"></div>
        `;
        editor.appendChild(div);
    });
    updateLivePreview();
}

window.addCustomBlock = function() {
    customBlocksData.push({ title: 'Bagian Baru', text: 'Tuliskan deskripsi atau informasi tambahan di sini.', image: '' });
    renderCustomBlocksAdmin();
}

window.removeCustomBlock = function(index) {
    if(confirm('Yakin ingin menghapus blok ini?')) {
        customBlocksData.splice(index, 1);
        renderCustomBlocksAdmin();
    }
}

window.updateCustomBlock = function(index, field, value) {
    customBlocksData[index][field] = value;
    updateLivePreview();
}

const settingsForm = document.getElementById('settingsForm');
settingsForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const v = (id) => document.getElementById(id)?.value;
    
    currentSiteSettings = {
        siteName: v('setSiteName'),
        siteLogo: v('setSiteLogo'),
        whatsappNumber: v('setWA'),
        
        footerSlogan: v('setFooterSlogan'),
        
        navHome: v('setNavHome'),
        navAbout: v('setNavAbout'),
        navMenu: v('setNavMenu'),
        navTesti: v('setNavTesti'),
        navGallery: v('setNavGallery'),
        navContact: v('setNavContact'),
        
        heroEyebrow: v('setHeroEyebrow'),
        heroTitle: v('setHeroTitle'),
        heroLead: v('setHeroLead'),
        heroImageMain: v('setHeroImageMain'),
        heroImageAccent: v('setHeroImageAccent'),
        heroNoteEyebrow: v('setHeroNoteEyebrow'),
        heroNoteTitle: v('setHeroNoteTitle'),
        heroNoteDesc: v('setHeroNoteDesc'),
        
        heroStat1Title: v('setHeroStat1Title'),
        heroStat1Desc: v('setHeroStat1Desc'),
        heroStat2Title: v('setHeroStat2Title'),
        heroStat2Desc: v('setHeroStat2Desc'),
        heroStat3Title: v('setHeroStat3Title'),
        heroStat3Desc: v('setHeroStat3Desc'),
        
        aboutEyebrow: v('setAboutEyebrow'),
        aboutTitle: v('setAboutTitle'),
        aboutTitle1: v('setAboutTitle1'),
        aboutText: v('setAboutText'),
        aboutTitle2: v('setAboutTitle2'),
        aboutText2: v('setAboutText2'),
        aboutTitle3: v('setAboutTitle3'),
        aboutText3: v('setAboutText3'),
        
        menuEyebrow: v('setMenuEyebrow'),
        menuTitle: v('setMenuTitle'),
        
        promoEyebrow: v('setPromoEyebrow'),
        promoTitle: v('setPromoTitle'),
        promoText: v('setPromoText'),
        
        promoBadge1: v('setPromoBadge1'), promoTitle1: v('setPromoTitle1'), promoText1: v('setPromoText1'), promoPrice1: v('setPromoPrice1'),
        promoBadge2: v('setPromoBadge2'), promoTitle2: v('setPromoTitle2'), promoText2: v('setPromoText2'), promoPrice2: v('setPromoPrice2'),
        promoBadge3: v('setPromoBadge3'), promoTitle3: v('setPromoTitle3'), promoText3: v('setPromoText3'), promoPrice3: v('setPromoPrice3'),
        
        contactEyebrow: v('setContactEyebrow'),
        contactTitle: v('setContactTitle'),
        contactCard1Title: v('setContactCard1Title'),
        contactAddress: v('setContactAddress'),
        contactHours: v('setContactHours'),
        contactCard2Title: v('setContactCard2Title'),
        contactIGUser: v('setContactIGUser'),
        contactIG: v('setContactIG'),
        contactTikTokUser: v('setContactTikTokUser'),
        contactTikTok: v('setContactTikTok'),
        contactCard3Title: v('setContactCard3Title'),
        contactCard3Text: v('setContactCard3Text'),
        contactGrabUrl: v('setContactGrabUrl'),
        contactGojekUrl: v('setContactGojekUrl'),
        contactMapUrl: v('setContactMapUrl'),
        
        footerBrand: v('setFooterBrand'),
        footerCopyright: v('setFooterCopyright'),
        
        themeBrand: v('setThemeBrand'),
        themeCard: v('setThemeCard'),
        themeInk: v('setThemeInk'),
        themeBg: v('setThemeBg'),
        
        customBlocks: customBlocksData
    };

    const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentSiteSettings)
    });

    if (res.ok) {
        alert('Pengaturan berhasil disimpan!');
        document.getElementById('livePreview').contentWindow.location.reload();
    } else {
        alert('Gagal menyimpan pengaturan.');
    }
});

function updateLivePreview() {
    const frameDoc = document.getElementById('livePreview').contentDocument;
    if (!frameDoc) return;

    const setVal = (id, val) => {
        const el = frameDoc.getElementById(id);
        if (el && val !== undefined && val !== null) el.textContent = val;
    };
    const setImg = (id, val) => {
        const el = frameDoc.getElementById(id);
        if (el && val) el.src = val;
    };

    const v = (id) => document.getElementById(id)?.value;

    const logoUrl = v('setSiteLogo');
    const brandLogoImg = frameDoc.getElementById('brandLogoImg');
    const brandMarkText = frameDoc.getElementById('brandMarkText');
    
    if (logoUrl) {
        if (brandLogoImg) { brandLogoImg.src = logoUrl; brandLogoImg.style.display = 'inline-block'; }
        if (brandMarkText) brandMarkText.style.display = 'none';
    } else {
        if (brandLogoImg) brandLogoImg.style.display = 'none';
        if (brandMarkText) brandMarkText.style.display = 'inline-flex';
        setVal('brandMarkText', v('setSiteName') ? v('setSiteName').split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase() : 'DS');
    }

    setVal('heroEyebrow', v('setHeroEyebrow'));
    setVal('heroTitle', v('setHeroTitle'));
    setVal('heroLead', v('setHeroLead'));
    setVal('siteName', v('setSiteName'));
    setVal('footerSlogan', v('setFooterSlogan'));
    setVal('footerBrand', v('setFooterBrand'));
    
    const fCopyright = frameDoc.getElementById('footerCopyright');
    if (fCopyright && v('setFooterCopyright')) {
        fCopyright.innerHTML = v('setFooterCopyright').replace('{year}', new Date().getFullYear());
    }
    
    setVal('navHome', v('setNavHome'));
    setVal('navAbout', v('setNavAbout'));
    setVal('navMenu', v('setNavMenu'));
    setVal('navTesti', v('setNavTesti'));
    setVal('navGallery', v('setNavGallery'));
    setVal('navContact', v('setNavContact'));

    setImg('heroImgMain', v('setHeroImageMain'));
    setImg('heroImgAccent', v('setHeroImageAccent'));
    setVal('heroNoteEyebrow', v('setHeroNoteEyebrow'));
    setVal('heroNoteTitle', v('setHeroNoteTitle'));
    setVal('heroNoteDesc', v('setHeroNoteDesc'));
    
    setVal('heroStat1Title', v('setHeroStat1Title'));
    setVal('heroStat1Desc', v('setHeroStat1Desc'));
    setVal('heroStat2Title', v('setHeroStat2Title'));
    setVal('heroStat2Desc', v('setHeroStat2Desc'));
    setVal('heroStat3Title', v('setHeroStat3Title'));
    setVal('heroStat3Desc', v('setHeroStat3Desc'));
    

    setVal('aboutEyebrow', v('setAboutEyebrow'));
    setVal('aboutTitle', v('setAboutTitle'));
    setVal('aboutTitle1', v('setAboutTitle1'));
    setVal('aboutText', v('setAboutText'));
    setVal('aboutTitle2', v('setAboutTitle2'));
    setVal('aboutText2', v('setAboutText2'));
    setVal('aboutTitle3', v('setAboutTitle3'));
    setVal('aboutText3', v('setAboutText3'));

    setVal('menuEyebrow', v('setMenuEyebrow'));
    setVal('menuTitle', v('setMenuTitle'));

    setVal('promoEyebrow', v('setPromoEyebrow'));
    setVal('promoTitle', v('setPromoTitle'));
    setVal('promoText', v('setPromoText'));

    setVal('promoBadge1', v('setPromoBadge1'));
    setVal('promoTitle1', v('setPromoTitle1'));
    setVal('promoText1', v('setPromoText1'));
    setVal('promoPrice1', v('setPromoPrice1'));

    setVal('promoBadge2', v('setPromoBadge2'));
    setVal('promoTitle2', v('setPromoTitle2'));
    setVal('promoText2', v('setPromoText2'));
    setVal('promoPrice2', v('setPromoPrice2'));

    setVal('promoBadge3', v('setPromoBadge3'));
    setVal('promoTitle3', v('setPromoTitle3'));
    setVal('promoText3', v('setPromoText3'));
    setVal('promoPrice3', v('setPromoPrice3'));

    setVal('contactEyebrow', v('setContactEyebrow'));
    setVal('contactTitle', v('setContactTitle'));
    setVal('contactCard1Title', v('setContactCard1Title'));
    setVal('contactAddress', v('setContactAddress'));
    setVal('contactHours', v('setContactHours'));
    setVal('contactCard2Title', v('setContactCard2Title'));
    
    setVal('contactIG', v('setContactIGUser'));
    setVal('contactTikTok', v('setContactTikTokUser'));
    
    const setIframeLink = (id, val) => { if (frameDoc.getElementById(id) && val) frameDoc.getElementById(id).href = val; };
    setIframeLink('contactIG', v('setContactIG'));
    setIframeLink('contactTikTok', v('setContactTikTok'));
    
    setVal('contactCard3Title', v('setContactCard3Title'));
    setVal('contactCard3Text', v('setContactCard3Text'));
    setIframeLink('contactGrabUrl', v('setContactGrabUrl'));
    setIframeLink('contactGojekUrl', v('setContactGojekUrl'));
    
    const mapIframe = frameDoc.getElementById('contactMapIframe');
    if (mapIframe && v('setContactMapUrl')) {
        let mapUrl = v('setContactMapUrl');
        const srcMatch = mapUrl.match(/src="([^"]+)"/);
        if (srcMatch) mapUrl = srcMatch[1];
        mapIframe.src = mapUrl;
    }
    
    // Inject Dynamic Blocks
    const blocksContainer = frameDoc.getElementById('customBlocksContainer');
    if (blocksContainer) {
        blocksContainer.innerHTML = customBlocksData.map(block => `
            <section class="section-shell" style="padding-top:4rem; padding-bottom:4rem; text-align:center;">
                <div class="reveal active" style="max-width: 800px; margin: 0 auto;">
                    ${block.image ? `<img src="${block.image}" alt="${block.title}" style="width:100%; border-radius:12px; margin-bottom:2rem; max-height:400px; object-fit:cover; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">` : ''}
                    <h2>${block.title}</h2>
                    <p style="color:var(--muted); font-size:1.1rem; line-height:1.6;">${block.text}</p>
                </div>
            </section>
        `).join('');
    }
    
    // Inject Theme CSS variables into iframe
    frameDoc.documentElement.style.setProperty('--brand', v('setThemeBrand'));
    frameDoc.documentElement.style.setProperty('--card-bg', v('setThemeCard'));
    frameDoc.documentElement.style.setProperty('--text-color', v('setThemeInk'));
    frameDoc.documentElement.style.setProperty('--page-bg', v('setThemeBg'));
    // Make text contrast properly on card if needed by simply overriding background
}

document.querySelectorAll('#settingsForm input, #settingsForm textarea').forEach(input => {
    input.addEventListener('input', (e) => {
        updateLivePreview();
        if (e.target.id === 'setSiteName' || e.target.id === 'setSiteLogo') {
            const name = document.getElementById('setSiteName')?.value || 'Dapur Senja';
            const logo = document.getElementById('setSiteLogo')?.value;
            updateAdminSidebarBrand(name, logo);
        }
    });
});

// Inline Editor inside Iframe
function setupIframeEditor() {
    const frameDoc = document.getElementById('livePreview').contentDocument;
    if (!frameDoc) return;

    const style = frameDoc.createElement('style');
    style.innerHTML = `
        .admin-editable { position: relative; transition: all 0.2s; border-radius: 4px; }
        .admin-editable:hover { box-shadow: inset 0 0 0 3px #00a8ff; cursor: pointer; background: rgba(0, 168, 255, 0.05); }
        .admin-editable::after {
            content: '✏️ Klik untuk Edit';
            position: absolute;
            top: 0; left: 0;
            background: #00a8ff; color: white;
            font-size: 12px; font-weight: bold; font-family: sans-serif;
            padding: 4px 10px; border-radius: 0 0 8px 0;
            opacity: 0; pointer-events: none;
            transition: opacity 0.2s;
            z-index: 1000;
        }
        .admin-editable:hover::after { opacity: 1; }
        
        .admin-editable-img { position: relative; display: inline-block; transition: all 0.2s; }
        .admin-editable-img:hover { outline: 4px solid #00a8ff; outline-offset: -4px; cursor: pointer; filter: brightness(0.9); }
    `;
    frameDoc.head.appendChild(style);

    const editableTexts = [
        { id: 'siteName', inputId: 'setSiteName', panelId: 'panel-nav' },
        { id: 'footerSlogan', inputId: 'setFooterSlogan', panelId: 'panel-nav' },
        
        { id: 'navHome', inputId: 'setNavHome', panelId: 'panel-nav' },
        { id: 'navAbout', inputId: 'setNavAbout', panelId: 'panel-nav' },
        { id: 'navMenu', inputId: 'setNavMenu', panelId: 'panel-nav' },
        { id: 'navTesti', inputId: 'setNavTesti', panelId: 'panel-nav' },
        { id: 'navGallery', inputId: 'setNavGallery', panelId: 'panel-nav' },
        { id: 'navContact', inputId: 'setNavContact', panelId: 'panel-nav' },

        { id: 'heroEyebrow', inputId: 'setHeroEyebrow', panelId: 'panel-hero' },
        { id: 'heroTitle', inputId: 'setHeroTitle', panelId: 'panel-hero' },
        { id: 'heroLead', inputId: 'setHeroLead', panelId: 'panel-hero' },
        { id: 'heroNoteEyebrow', inputId: 'setHeroNoteEyebrow', panelId: 'panel-hero' },
        { id: 'heroNoteTitle', inputId: 'setHeroNoteTitle', panelId: 'panel-hero' },
        { id: 'heroNoteDesc', inputId: 'setHeroNoteDesc', panelId: 'panel-hero' },
        
        { id: 'aboutEyebrow', inputId: 'setAboutEyebrow', panelId: 'panel-about' },
        { id: 'aboutTitle', inputId: 'setAboutTitle', panelId: 'panel-about' },
        { id: 'aboutTitle1', inputId: 'setAboutTitle1', panelId: 'panel-about' },
        { id: 'aboutText', inputId: 'setAboutText', panelId: 'panel-about' },
        { id: 'aboutTitle2', inputId: 'setAboutTitle2', panelId: 'panel-about' },
        { id: 'aboutText2', inputId: 'setAboutText2', panelId: 'panel-about' },
        { id: 'aboutTitle3', inputId: 'setAboutTitle3', panelId: 'panel-about' },
        { id: 'aboutText3', inputId: 'setAboutText3', panelId: 'panel-about' },
        
        { id: 'menuEyebrow', inputId: 'setMenuEyebrow', panelId: 'panel-menu' },
        { id: 'menuTitle', inputId: 'setMenuTitle', panelId: 'panel-menu' },
        
        { id: 'promoEyebrow', inputId: 'setPromoEyebrow', panelId: 'panel-promo' },
        { id: 'promoTitle', inputId: 'setPromoTitle', panelId: 'panel-promo' },
        { id: 'promoText', inputId: 'setPromoText', panelId: 'panel-promo' },
        
        { id: 'promoBadge1', inputId: 'setPromoBadge1', panelId: 'panel-promo' },
        { id: 'promoTitle1', inputId: 'setPromoTitle1', panelId: 'panel-promo' },
        { id: 'promoText1', inputId: 'setPromoText1', panelId: 'panel-promo' },
        { id: 'promoPrice1', inputId: 'setPromoPrice1', panelId: 'panel-promo' },
        
        { id: 'promoBadge2', inputId: 'setPromoBadge2', panelId: 'panel-promo' },
        { id: 'promoTitle2', inputId: 'setPromoTitle2', panelId: 'panel-promo' },
        { id: 'promoText2', inputId: 'setPromoText2', panelId: 'panel-promo' },
        { id: 'promoPrice2', inputId: 'setPromoPrice2', panelId: 'panel-promo' },
        
        { id: 'promoBadge3', inputId: 'setPromoBadge3', panelId: 'panel-promo' },
        { id: 'promoTitle3', inputId: 'setPromoTitle3', panelId: 'panel-promo' },
        { id: 'promoText3', inputId: 'setPromoText3', panelId: 'panel-promo' },
        { id: 'promoPrice3', inputId: 'setPromoPrice3', panelId: 'panel-promo' },

        { id: 'contactEyebrow', inputId: 'setContactEyebrow', panelId: 'panel-contact' },
        { id: 'contactTitle', inputId: 'setContactTitle', panelId: 'panel-contact' },
        { id: 'contactCard1Title', inputId: 'setContactCard1Title', panelId: 'panel-contact' },
        { id: 'contactAddress', inputId: 'setContactAddress', panelId: 'panel-contact' },
        { id: 'contactHours', inputId: 'setContactHours', panelId: 'panel-contact' },
        { id: 'contactCard2Title', inputId: 'setContactCard2Title', panelId: 'panel-contact' }
    ];

    editableTexts.forEach(mapping => {
        const el = frameDoc.getElementById(mapping.id);
        if (el) {
            el.classList.add('admin-editable');
            el.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (mapping.panelId && mapping.inputId) {
                    window.parent.openEditorFor(mapping.inputId, mapping.panelId);
                }
            });
        }
    });

    const editableImages = [
        { id: 'heroImgMain', inputId: 'setHeroImageMain', panelId: 'panel-hero' },
        { id: 'heroImgAccent', inputId: 'setHeroImageAccent', panelId: 'panel-hero' }
    ];

    editableImages.forEach(mapping => {
        const el = frameDoc.getElementById(mapping.id);
        if (el) {
            el.classList.add('admin-editable-img');
            el.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (mapping.panelId && mapping.inputId) {
                    window.parent.openEditorFor(mapping.inputId, mapping.panelId);
                }
            });
        }
    });
}

document.getElementById('livePreview')?.addEventListener('load', setupIframeEditor);

function toggleSettingsForm() {
    const form = document.getElementById('settingsFormContainer');
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
}

window.toggleWpPanel = function(panelId) {
    document.querySelectorAll('.wp-panel').forEach(p => p.classList.remove('active'));
    if(panelId) {
        document.getElementById(panelId).classList.add('active');
    }
}

window.openEditorFor = function(inputId, panelId) {
    const form = document.getElementById('settingsFormContainer');
    form.style.display = 'block'; // Force open
    
    if(panelId) toggleWpPanel(panelId);
    
    const input = document.getElementById(inputId);
    if (input) {
        input.scrollIntoView({ behavior: 'smooth', block: 'center' });
        input.focus();
        // Highlight animation
        input.style.transition = 'box-shadow 0.3s';
        input.style.boxShadow = '0 0 0 4px rgba(0, 168, 255, 0.4)';
        setTimeout(() => {
            input.style.boxShadow = 'none';
        }, 1500);
    }
}

// Data Loading
async function loadData() {
    loadMenu();
    loadOrders();
}

async function loadMenu() {
    const res = await fetch('/api/services');
    const { services } = await res.json();
    const tbody = document.getElementById('menuTableBody');
    tbody.innerHTML = '';

    services.forEach(item => {
        const tr = document.createElement('tr');
        const badgeClass = item.category === 'Minuman' ? 'badge-drink' : 'badge-food';
        tr.innerHTML = `
            <td><strong>${item.name}</strong></td>
            <td><span class="badge-pills ${badgeClass}">${item.category}</span></td>
            <td>Rp${item.price.toLocaleString('id-ID')}</td>
            <td><span style="color: #00b894;">● Aktif</span></td>
            <td>
                <button class="btn-action btn-edit" onclick='editMenu(${JSON.stringify(item)})'>Edit</button>
                <button class="btn-action btn-delete" onclick="deleteMenu('${item.id}')">Hapus</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function loadOrders() {
    const res = await fetch('/api/transactions');
    const { transactions } = await res.json();
    const tbody = document.getElementById('ordersTableBody');
    tbody.innerHTML = '';

    transactions.forEach(trx => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><code>${trx.invoiceNumber}</code></td>
            <td>${trx.customerName}</td>
            <td>${trx.branchName}</td>
            <td><strong>Rp${trx.total.toLocaleString('id-ID')}</strong></td>
            <td><span class="badge-pills" style="background: #fff9db; color: #f08c00;">${trx.status}</span></td>
        `;
        tbody.appendChild(tr);
    });
}

// CRUD Operations
const menuModal = document.getElementById('menuModal');
const menuForm = document.getElementById('menuForm');

function openAddModal() {
    document.getElementById('modalTitle').textContent = 'Tambah Menu Baru';
    document.getElementById('menuId').value = 'menu_' + Date.now();
    document.getElementById('menuName').value = '';
    document.getElementById('menuPrice').value = '';
    document.getElementById('menuDesc').value = '';
    menuModal.style.display = 'flex';
}

window.editMenu = function(item) {
    document.getElementById('modalTitle').textContent = 'Edit Menu';
    document.getElementById('menuId').value = item.id;
    document.getElementById('menuName').value = item.name;
    document.getElementById('menuCategory').value = item.category;
    document.getElementById('menuPrice').value = item.price;
    document.getElementById('menuDesc').value = item.description || '';
    menuModal.style.display = 'flex';
}

window.closeModal = function() {
    menuModal.style.display = 'none';
}

menuForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
        id: document.getElementById('menuId').value,
        name: document.getElementById('menuName').value,
        category: document.getElementById('menuCategory').value,
        price: Number(document.getElementById('menuPrice').value),
        description: document.getElementById('menuDesc').value,
        unit: document.getElementById('menuCategory').value === 'Minuman' ? 'gelas' : 'porsi',
        turnaroundMinutes: 15
    };

    const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });

    if (res.ok) {
        closeModal();
        loadMenu();
    } else {
        const err = await res.json();
        alert(err.error || 'Gagal menyimpan menu');
    }
});

window.deleteMenu = async function(id) {
    if (!confirm('Apakah Anda yakin ingin menghapus menu ini?')) return;

    const res = await fetch(`/api/services/${id}`, { method: 'DELETE' });
    if (res.ok) {
        loadMenu();
    } else {
        const err = await res.json();
        alert(err.error || 'Gagal menghapus menu');
    }
}
