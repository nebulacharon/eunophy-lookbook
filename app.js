// State Lokal Aplikasi
let allCatalog = {};
let allLooks = {};
let allCollections = {};

let currentViewMode = 'looks'; // 'looks' atau 'catalog'
let currentSegment = 'all';
let currentCollection = 'all';

const searchInput = document.getElementById('search-input');
const hero = document.querySelector('.hero-section');

// --- Helper untuk membersihkan Judul dari Kode ganda ---
function cleanTitle(title, code) {
  if (!title) return '';
  if (!code) return title;
  const reg = new RegExp(`^${code}\\s*`, 'i');
  return title.replace(reg, '').trim();
}

// --- 1. INISIALISASI & AMBIL DATA DARI KV ---
async function initApp() {
  const container = document.getElementById('grid-container');
  try {
    const [catRes, looksRes, colRes] = await Promise.all([
      fetch('/api/products?type=catalog'),
      fetch('/api/products?type=looks'),
      fetch('/api/products?type=collections')
    ]);

    allCatalog = await catRes.json();
    allLooks = await looksRes.json();
    allCollections = await colRes.json();

    renderCollectionsBar();
    applyFilterAndRender();
    checkDirectUrlLook();
  } catch (err) {
    if (container) {
      container.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:40px; color:#e11d48;">Gagal memuat katalog koleksi.</div>`;
    }
  }
}

// --- 2. SWITCH VIEW MODE (LOOKS VS CATALOG ITEMS) ---
function switchViewMode(mode) {
  currentViewMode = mode;

  const btnLooks = document.getElementById('btn-view-looks');
  const btnCatalog = document.getElementById('btn-view-catalog');
  const colBar = document.getElementById('collections-bar');

  if (btnLooks) btnLooks.classList.toggle('active', mode === 'looks');
  if (btnCatalog) btnCatalog.classList.toggle('active', mode === 'catalog');

  // Bar koleksi hanya tampil di mode 'looks'
  if (colBar) {
    colBar.style.display = (mode === 'looks') ? 'flex' : 'none';
  }

  // Catatan: Kategori Nav (Tops, Bottoms, dll) TETAP DITAMPILKAN secara konsisten.

  applyFilterAndRender();
}

// --- 3. RENDER COLLECTIONS CHIP BAR ---
function renderCollectionsBar() {
  const bar = document.getElementById('collections-bar');
  if (!bar) return;

  const items = Object.values(allCollections);
  if (items.length === 0) {
    bar.style.display = 'none';
    return;
  }

  bar.innerHTML = `
    <button class="col-chip ${currentCollection === 'all' ? 'active' : ''}" onclick="selectCollection('all')">All Collections</button>
    ${items.map(col => `
      <button class="col-chip ${currentCollection === col.id ? 'active' : ''}" onclick="selectCollection('${col.id}')">${col.title}</button>
    `).join('')}
  `;
}

function selectCollection(colId) {
  currentCollection = colId;
  renderCollectionsBar();
  applyFilterAndRender();
}

// --- 4. LOGIKA FILTER UNIVERSAL & RENDER GRID ---
function applyFilterAndRender() {
  const query = searchInput ? searchInput.value.toLowerCase().trim() : '';

  if (query.length > 0) {
    renderGlobalSearchResults(query);
  } else if (currentViewMode === 'looks') {
    renderLooksGrid();
  } else {
    renderCatalogGrid();
  }
}

// A. Render Grid Curated Looks
function renderLooksGrid() {
  const container = document.getElementById('grid-container');
  if (!container) return;

  let looksList = Object.values(allLooks);

  if (currentCollection !== 'all') {
    looksList = looksList.filter(look => look.collection_id === currentCollection);
  }

  if (looksList.length === 0) {
    container.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:40px; color:#888;">Belum ada Curated Look yang sesuai.</div>`;
    return;
  }

  container.innerHTML = looksList.map(look => {
    const itemCount = (look.product_slugs || []).length;
    const lookCode = (look.id || '').toUpperCase();
    const lookTitle = cleanTitle(look.title, lookCode);

    return `
      <div class="lookbook-card" onclick="openLookDetailModal('${look.id}')" style="cursor:pointer;">
        <div class="img-container">
          <img src="${look.hero_image}" alt="${look.title}" loading="lazy" onerror="this.src='https://via.placeholder.com/400x533?text=No+Image'">
          <div class="overlay-info">
            <span class="overlay-code">${lookCode} - ${lookTitle}</span>
            <span class="overlay-action">Lihat ${itemCount} Style Items ↗</span>
          </div>
        </div>
        <div class="card-bottom" style="display:flex; justify-content:space-between; align-items:flex-start; margin-top:8px;">
          <div style="display:flex; flex-direction:column; gap:2px;">
            <strong style="font-size:11px; color:#64748b; letter-spacing:0.5px; text-transform:uppercase;">${lookCode}</strong>
            <span style="font-family:'Cormorant Garamond', serif; font-size:16px; font-weight:600; color:#0f172a; line-height:1.2;">${lookTitle}</span>
          </div>
          <span class="category-tag" style="white-space:nowrap; font-size:11px; color:#94a3b8; margin-top:2px;">${itemCount} Items</span>
        </div>
      </div>
    `;
  }).join('');
}

// B. Render Grid Catalog Items (Single Item)
function renderCatalogGrid() {
  const container = document.getElementById('grid-container');
  if (!container) return;

  const filtered = {};

  Object.entries(allCatalog).forEach(([slug, item]) => {
    const itemSegment = (item.segment || 'tops').toLowerCase();
    const matchSegment = (currentSegment === 'all') || (itemSegment === currentSegment);

    if (matchSegment) {
      filtered[slug] = item;
    }
  });

  const items = Object.entries(filtered);

  if (items.length === 0) {
    container.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:40px; color:#888;">Belum ada produk yang cocok.</div>`;
    return;
  }

  container.innerHTML = items.map(([slug, item]) => {
    const itemCode = (item.id || slug).toUpperCase();
    const itemTitle = cleanTitle(item.title, itemCode);

    return `
      <a href="${item.affiliate_url}" class="lookbook-card" target="_blank" rel="noopener noreferrer" style="text-decoration:none;">
        <div class="img-container">
          <img src="${item.image}" alt="${item.title}" loading="lazy" onerror="this.src='https://via.placeholder.com/400x533?text=No+Image'">
          <div class="overlay-info">
            <span class="overlay-code">${itemTitle}</span>
            <span class="overlay-action">Klik untuk beli di Shopee ↗</span>
          </div>
        </div>
        <div class="card-bottom" style="display:flex; justify-content:space-between; align-items:flex-start; margin-top:8px;">
          <div style="display:flex; flex-direction:column; gap:2px;">
            <strong style="font-size:11px; color:#64748b; letter-spacing:0.5px; text-transform:uppercase;">${itemCode}</strong>
            <span style="font-family:'Cormorant Garamond', serif; font-size:16px; font-weight:600; color:#0f172a; line-height:1.2;">${itemTitle}</span>
          </div>
          <span class="category-tag" style="white-space:nowrap; font-size:11px; color:#94a3b8; margin-top:2px; text-transform:capitalize;">${item.category || item.segment || 'Item'}</span>
        </div>
      </a>
    `;
  }).join('');
}

// C. Pencarian Cerdas Global
function renderGlobalSearchResults(query) {
  const container = document.getElementById('grid-container');
  if (!container) return;

  const matchedLooks = Object.values(allLooks).filter(look => {
    const matchTitle = (look.title || '').toLowerCase().includes(query);
    const matchId = (look.id || '').toLowerCase().includes(query);
    const matchCol = (look.collection_id || '').toLowerCase().includes(query);

    const matchProduct = (look.product_slugs || []).some(slug => {
      const prod = allCatalog[slug];
      return prod && ((prod.title || '').toLowerCase().includes(query) || slug.toLowerCase().includes(query));
    });

    return matchTitle || matchId || matchCol || matchProduct;
  });

  const matchedCatalog = Object.entries(allCatalog).filter(([slug, item]) => {
    const matchTitle = (item.title || '').toLowerCase().includes(query);
    const matchSubCat = (item.category || '').toLowerCase().includes(query);
    const matchSlug = slug.toLowerCase().includes(query);
    return matchTitle || matchSubCat || matchSlug;
  });

  if (matchedLooks.length === 0 && matchedCatalog.length === 0) {
    container.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:40px; color:#888;">Tidak ada hasil untuk "${query}".</div>`;
    return;
  }

  let html = '';

  // Render Hasil Looks
  matchedLooks.forEach(look => {
    const itemCount = (look.product_slugs || []).length;
    const lookCode = (look.id || '').toUpperCase();
    const lookTitle = cleanTitle(look.title, lookCode);

    html += `
      <div class="lookbook-card" onclick="openLookDetailModal('${look.id}')" style="cursor:pointer;">
        <div class="img-container" style="position:relative;">
          <img src="${look.hero_image}" alt="${look.title}" loading="lazy" onerror="this.src='https://via.placeholder.com/400x533?text=No+Image'">
          <span style="position:absolute; top:8px; right:8px; background:#0f172a; color:#fff; font-size:10px; font-weight:700; padding:3px 6px; border-radius:4px; z-index:2;">LOOK / COLLECTION</span>
          <div class="overlay-info">
            <span class="overlay-code">${lookCode} - ${lookTitle}</span>
            <span class="overlay-action">Lihat ${itemCount} Style Items ↗</span>
          </div>
        </div>
        <div class="card-bottom" style="display:flex; justify-content:space-between; align-items:flex-start; margin-top:8px;">
          <div style="display:flex; flex-direction:column; gap:2px;">
            <strong style="font-size:11px; color:#64748b; letter-spacing:0.5px; text-transform:uppercase;">${lookCode}</strong>
            <span style="font-family:'Cormorant Garamond', serif; font-size:16px; font-weight:600; color:#0f172a; line-height:1.2;">${lookTitle}</span>
          </div>
          <span class="category-tag" style="white-space:nowrap; font-size:11px; color:#94a3b8; margin-top:2px;">${itemCount} Items</span>
        </div>
      </div>
    `;
  });

  // Render Hasil Catalog Items
  matchedCatalog.forEach(([slug, item]) => {
    const itemCode = (item.id || slug).toUpperCase();
    const itemTitle = cleanTitle(item.title, itemCode);

    html += `
      <a href="${item.affiliate_url}" class="lookbook-card" target="_blank" rel="noopener noreferrer" style="text-decoration:none;">
        <div class="img-container" style="position:relative;">
          <img src="${item.image}" alt="${item.title}" loading="lazy" onerror="this.src='https://via.placeholder.com/400x533?text=No+Image'">
          <span style="position:absolute; top:8px; right:8px; background:#e2e8f0; color:#1e293b; font-size:10px; font-weight:700; padding:3px 6px; border-radius:4px; z-index:2;">SINGLE ITEM</span>
          <div class="overlay-info">
            <span class="overlay-code">${itemTitle}</span>
            <span class="overlay-action">Klik untuk beli di Shopee ↗</span>
          </div>
        </div>
        <div class="card-bottom" style="display:flex; justify-content:space-between; align-items:flex-start; margin-top:8px;">
          <div style="display:flex; flex-direction:column; gap:2px;">
            <strong style="font-size:11px; color:#64748b; letter-spacing:0.5px; text-transform:uppercase;">${itemCode}</strong>
            <span style="font-family:'Cormorant Garamond', serif; font-size:16px; font-weight:600; color:#0f172a; line-height:1.2;">${itemTitle}</span>
          </div>
          <span class="category-tag" style="white-space:nowrap; font-size:11px; color:#94a3b8; margin-top:2px; text-transform:capitalize;">${item.category || item.segment || 'Item'}</span>
        </div>
      </a>
    `;
  });

  container.innerHTML = html;
}

// --- 5. MODAL POPUP DETAIL LOOK ---
function openLookDetailModal(lookId) {
  const look = allLooks[lookId];
  if (!look) return;

  const modal = document.getElementById('detail-modal');
  const body = document.getElementById('modal-content-body');
  if (!modal || !body) return;

  // 🔒 Kunci Scroll Body Utama saat modal terbuka
  document.body.classList.add('no-scroll');

  const attachedProducts = (look.product_slugs || [])
    .map(slug => allCatalog[slug])
    .filter(Boolean);

  const lookCode = (look.id || '').toUpperCase();
  const lookTitle = cleanTitle(look.title, lookCode);

  body.innerHTML = `
    <!-- Header Modal -->
    <div style="position: relative; padding-bottom: 16px; margin-bottom: 20px; border-bottom: 1px solid #e2e8f0;">
      <h2 style="font-family:'Cormorant Garamond', serif; font-size: 24px; margin: 0 40px 6px 0; color:#0f172a; line-height: 1.2;">${lookTitle}</h2>
      
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;">
        <span style="font-size: 12px; color: #64748b; font-weight: 500;">ID Style: ${lookCode}</span>
        
        <button onclick="shareLookLink('${look.id}', '${lookTitle}')" class="btn-share-native" style="display: inline-flex; align-items: center; gap: 6px; background: #f8fafc; border: 1px solid #cbd5e0; padding: 5px 12px; border-radius: 20px; font-size: 12px; cursor: pointer; font-weight: 500; color: #334155;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
          Bagikan
        </button>
      </div>
    </div>

    <!-- Body Modal Grid dengan Tambahan Bottom Padding untuk Scroll HP -->
    <div class="modal-body-scrollable" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; max-height: 75vh; overflow-y: auto; padding-bottom: 40px;">
      <!-- Hero Image Wrapper -->
      <div style="position: relative;">
        <img src="${look.hero_image}" alt="${lookTitle}" style="width:100%; border-radius:8px; object-fit:cover; display:block;">
        
        <!-- Animasi Floating Scroll khusus Mobile -->
        <div id="mobile-hint-scroll" class="mobile-scroll-floating-hint">
          Scroll kebawah untuk melihat items ↓
        </div>
      </div>

      <!-- Items Section -->
      <div>
        <h4 style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; margin-bottom: 12px;">Items in this look:</h4>
        
        <div style="display: flex; flex-direction: column; gap: 12px;">
          ${attachedProducts.length === 0 ? '<p style="font-size:12px; color:#94a3b8;">Belum ada item terhubung.</p>' : ''}
          ${attachedProducts.map(prod => {
            const pCode = (prod.id || '').toUpperCase();
            const pTitle = cleanTitle(prod.title, pCode);
            return `
              <div style="display: flex; align-items: center; gap: 12px; padding: 10px; border: 1px solid #f1f5f9; border-radius: 8px; background: #fff;">
                <img src="${prod.image}" alt="${pTitle}" style="width: 50px; height: 65px; object-fit: cover; border-radius: 6px;">
                <div style="flex: 1;">
                  <strong style="display: block; font-size: 13px; color: #0f172a;">${pTitle}</strong>
                  <span style="font-size: 11px; color: #64748b; text-transform: capitalize;">${prod.segment || 'tops'}</span>
                </div>
                <a href="${prod.affiliate_url}" target="_blank" rel="noopener noreferrer" style="font-size: 11px; padding: 7px 14px; background: #0f172a; color: #fff; text-decoration: none; border-radius: 6px; white-space: nowrap; font-weight: 500;">
                  Shopee ↗
                </a>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    </div>
  `;

  modal.classList.add('active');

  // Mengubah URL browser menjadi /look/lk-0001
  window.history.pushState({}, '', `/look/${look.id}`);

  // Event Scroll Listener untuk menyembunyikan hint mobile
  const scrollableContainer = body.querySelector('.modal-body-scrollable');
  const hintEl = body.querySelector('#mobile-hint-scroll');
  
  if (scrollableContainer && hintEl) {
    scrollableContainer.addEventListener('scroll', () => {
      if (scrollableContainer.scrollTop > 20) {
        hintEl.style.opacity = '0';
        setTimeout(() => { hintEl.style.display = 'none'; }, 300);
      }
    }, { once: true });
  }
}

// Tutup Modal & Lepas Kunci Scroll Body Utama
function closeDetailModal() {
  const modal = document.getElementById('detail-modal');
  if (modal) modal.classList.remove('active');
  
  // 🔓 Buka kembali Scroll Body Utama
  document.body.classList.remove('no-scroll');

  if (window.location.pathname.startsWith('/look/')) {
    window.history.pushState({}, '', '/');
  }
}

// Fitur Share Native
async function shareLookLink(lookId, lookTitle) {
  const shareUrl = `${window.location.origin}/look/${lookId}`;
  
  if (navigator.share) {
    try {
      await navigator.share({
        title: lookTitle || 'Eunophy Curated Look',
        text: `Lihat inspirasi outfit "${lookTitle || 'Look'}" di Eunophy:`,
        url: shareUrl
      });
    } catch (err) {
      // User membatalkan dialog share
    }
  } else if (navigator.clipboard) {
    navigator.clipboard.writeText(shareUrl).then(() => {
      alert("Link look berhasil disalin ke clipboard!");
    });
  } else {
    prompt("Salin link look berikut:", shareUrl);
  }
}

// Memeriksa URL saat Pertama Kali Dibuka (Direct Link Handler)
function checkDirectUrlLook() {
  const path = window.location.pathname;
  if (path.startsWith('/look/')) {
    const lookId = path.split('/look/')[1];
    if (lookId && allLooks[lookId]) {
      setTimeout(() => openLookDetailModal(lookId), 250);
    }
  }
}

// Event Close Modal saat Klik Backdrop
window.addEventListener('click', (e) => {
  const modal = document.getElementById('detail-modal');
  if (e.target === modal) {
    closeDetailModal();
  }
});

// Event Tombol Close Modal Asli
document.addEventListener('click', (e) => {
  if (e.target.matches('.modal-close, .close-btn, #modal-close')) {
    closeDetailModal();
  }
});

// --- 6. EVENT LISTENERS CATEGORY & SEARCH ---
document.querySelectorAll('.cat-pill').forEach((btn) => {
  btn.addEventListener('click', (e) => {
    document.querySelectorAll('.cat-pill').forEach((b) => b.classList.remove('active'));
    e.currentTarget.classList.add('active');
    currentSegment = e.currentTarget.dataset.segment;
    applyFilterAndRender();
  });
});

if (searchInput) {
  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();

    if (hero) {
      if (query.length > 0) {
        hero.classList.add('hidden-search');
        if (currentSegment !== 'all') {
          currentSegment = 'all';
          document.querySelectorAll('.cat-pill').forEach((b) => {
            b.classList.toggle('active', b.dataset.segment === 'all');
          });
        }
      } else {
        hero.classList.remove('hidden-search');
      }
    }

    applyFilterAndRender();
  });
}

// Inisialisasi Aplikasi
initApp();