// POS System Logic
let currentSession = null;
let cart = [];
let menuData = [];

// Auth Logic
const loginForm = document.getElementById('loginForm');
const loginOverlay = document.getElementById('loginOverlay');

loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = e.target.username.value;
    const password = e.target.password.value;

    const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });

    const data = await res.json();
    if (res.ok) {
        currentSession = data.user;
        loginOverlay.style.display = 'none';
        initPOS();
    } else {
        document.getElementById('loginError').textContent = data.error || 'Login gagal';
    }
});

function logout() {
    fetch('/api/logout', { method: 'POST' }).then(() => window.location.reload());
}

async function initPOS() {
    document.getElementById('cashierName').textContent = `Kasir: ${currentSession.name}`;
    document.getElementById('outletName').textContent = currentSession.branches[0]?.name || 'Dapur Senja POS';
    
    await loadMenu();
    setupCategories();
}

async function loadMenu() {
    const res = await fetch('/api/services');
    const data = await res.json();
    menuData = data.services;
    renderMenu('all');
}

function renderMenu(category) {
    const grid = document.getElementById('menuGrid');
    grid.innerHTML = '';
    
    const filtered = category === 'all' ? menuData : menuData.filter(i => i.category === category);
    
    filtered.forEach(item => {
        const card = document.createElement('div');
        card.className = 'pos-item-card';
        card.innerHTML = `
            <div class="item-img">
                <div class="item-price-tag">Rp${(item.price/1000)}k</div>
            </div>
            <div class="item-info">
                <h4>${item.name}</h4>
            </div>
        `;
        card.onclick = () => addToCart(item);
        grid.appendChild(card);
    });
}

function setupCategories() {
    const tabs = document.querySelectorAll('.cat-tab');
    tabs.forEach(tab => {
        tab.onclick = () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            renderMenu(tab.dataset.cat);
        };
    });
}

// Cart Logic
function addToCart(item) {
    const existing = cart.find(i => i.id === item.id);
    if (existing) {
        existing.qty++;
    } else {
        cart.push({ ...item, qty: 1 });
    }
    renderCart();
}

function updateQty(id, delta) {
    const index = cart.findIndex(i => i.id === id);
    if (index === -1) return;
    
    cart[index].qty += delta;
    if (cart[index].qty <= 0) cart.splice(index, 1);
    renderCart();
}

function renderCart() {
    const container = document.getElementById('cartItems');
    if (cart.length === 0) {
        container.innerHTML = '<div style="text-align: center; color: #b2bec3; margin-top: 3rem;">Keranjang Kosong</div>';
    } else {
        container.innerHTML = cart.map(item => `
            <div class="cart-item">
                <div>
                    <div style="font-weight: 600; font-size: 0.9rem;">${item.name}</div>
                    <div style="color: #636e72; font-size: 0.8rem;">Rp${item.price.toLocaleString('id-ID')}</div>
                </div>
                <div class="qty-controls">
                    <button class="qty-btn" onclick="updateQty('${item.id}', -1)">-</button>
                    <span style="font-weight: 600; min-width: 20px; text-align: center;">${item.qty}</span>
                    <button class="qty-btn" onclick="updateQty('${item.id}', 1)">+</button>
                </div>
            </div>
        `).join('');
    }

    const sub = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
    const tax = sub * 0.1;
    const total = sub + tax;

    document.getElementById('subtotal').textContent = `Rp${sub.toLocaleString('id-ID')}`;
    document.getElementById('tax').textContent = `Rp${tax.toLocaleString('id-ID')}`;
    document.getElementById('total').textContent = `Rp${total.toLocaleString('id-ID')}`;
}

function clearCart() {
    cart = [];
    renderCart();
}

// Checkout
async function handleCheckout() {
    if (cart.length === 0) return alert('Keranjang masih kosong!');
    
    const custName = document.getElementById('custName').value || 'Pelanggan Walk-in';
    const payload = {
        branchId: currentSession.defaultBranchId || currentSession.branchIds[0],
        customerName: custName,
        items: cart.map(i => ({
            serviceId: i.id,
            quantity: i.qty
        }))
    };

    try {
        const res = await fetch('/api/transactions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (res.ok) {
            document.getElementById('invoiceInfo').textContent = `Nomor Invoice: ${data.transaction.invoiceNumber}`;
            document.getElementById('successModal').style.display = 'flex';
        } else {
            alert(data.error || 'Terjadi kesalahan saat checkout');
        }
    } catch (err) {
        alert('Gagal menghubungi server.');
    }
}
