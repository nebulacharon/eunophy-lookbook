// State Lokal Aplikasi
var allCatalog = typeof allCatalog !== 'undefined' ? allCatalog : {};
var allLooks = typeof allLooks !== 'undefined' ? allLooks : {};
var allCollections = typeof allCollections !== 'undefined' ? allCollections : {};

var currentViewMode = typeof currentViewMode !== 'undefined' ? currentViewMode : 'looks';
var currentSegment = typeof currentSegment !== 'undefined' ? currentSegment : 'all';
var currentCollection = typeof currentCollection !== 'undefined' ? currentCollection : 'all';

// Element DOM Getter Helper
function getSearchInput() { return document.getElementById('search-input'); }
function getHero() { return document.querySelector('.hero-section'); }

// Helper 1: Membersihkan Judul dari Kode Ganda
function cleanTitle(title, code) {
  if (!title) return '';
  if (!code) return title;
  const reg = new RegExp(`^${code.replace('-', '\\-?')}\\s*`, 'i');
  return title.replace(reg, '').trim();
}

// Helper 2: Menyisipkan Strip pada Kode Produk
function formatCode(rawCode) {
  if (!rawCode) return '';
  const cleaned = rawCode.toUpperCase().trim();
  if (cleaned.startsWith('EUN') && !cleaned.startsWith('EUN-')) {
    return cleaned.replace('EUN', 'EUN-');
  }
  return cleaned;
}

// Helper 3: Mencari Look Tanpa Terpengaruh Huruf Besar/Kecil (Case-Insensitive)
function findLookById(targetId) {
  if (!targetId || !allLooks) return null;
  const cleanTarget = targetId.trim().toLowerCase();
  
  // Direct match
  if (allLooks[targetId]) return allLooks[targetId];
  
  // Case-insensitive search
  const foundKey = Object.keys(allLooks).find(key => key.toLowerCase() === cleanTarget);
  return foundKey ? allLooks[foundKey] : null;
}

// 1. INISIALISASI & AMBIL DATA
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
    switchViewMode(currentViewMode);
    
    // Cek apakah user membuka via URL spesifik (e.g. /look/lk-0001)
    checkDirectUrlLook();
  } catch (err) {
    if (container) {
      container.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:40px; color:#e11d48;">Gagal memuat katalog koleksi.</div>`;
    }
  }
}

// 2. SWITCH VIEW MODE (Curated Looks VS All Items)
function switchViewMode(mode) {
  currentViewMode = mode;

  const btnLooks = document.getElementById('btn-view-looks');
  const btnCatalog = document.getElementById('btn-view-catalog');
  const colBar = document.getElementById('collections-bar');
  const catNav = document.getElementById('category-nav');

  if (btnLooks) btnLooks.classList.toggle('active', mode === 'looks');
  if (btnCatalog) btnCatalog.classList.toggle('active', mode === 'catalog');

  if (mode === 'looks') {
    if (colBar) colBar.style.display = 'flex';
    if (catNav) catNav.style.display = 'none';
  } else {
    if (colBar) colBar.style.display = 'none';
    if (catNav) catNav.style.display = 'flex';
  }

  applyFilterAndRender();
}

// 3. RENDER COLLECTIONS BAR
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

// 4. LOGIKA FILTER & RENDER GRID
function applyFilterAndRender() {
  const searchInput = getSearchInput();
  const query = searchInput ? searchInput.value.toLowerCase().trim() : '';

  if (query.length > 0) {
    if (currentViewMode === 'looks') {
      renderLooksSearch(query);
    } else {
      renderCatalogGrid(query);
    }
  } else if (currentViewMode === 'looks') {
    renderLooksGrid();
  } else {
    renderCatalogGrid();
  }
}

// Helper khusus untuk menangani pencarian khusus di tab Curated Looks
function renderLooksSearch(query) {
  const container = document.getElementById('grid-container');
  if (!container) return;

  container.className = 'lookbook-grid';

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

  if (matchedLooks.length === 0) {
    container.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:40px; color:#888;">Tidak ada Look yang cocok dengan "${query}".</div>`;
    triggerGridAnimation(container);
    return;
  }

  container.innerHTML = matchedLooks.map(look => renderLookCardHTML(look)).join('');
  triggerGridAnimation(container);
}

// Helper Animasi Mulus & Soft
function triggerGridAnimation(container) {
  container.classList.remove('fade-in-content');
  requestAnimationFrame(() => {
    container.classList.add('fade-in-content');
  });
}

// Render Grid / Slider Curated Looks
function renderLooksGrid(query = '') {
  const container = document.getElementById('grid-container');
  if (!container) return;

  let looksList = Object.values(allLooks);

  if (currentCollection !== 'all') {
    looksList = looksList.filter(look => look.collection_id === currentCollection);

    if (looksList.length === 0) {
      container.className = 'lookbook-grid';
      container.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:40px; color:#888;">Belum ada Curated Look di koleksi ini.</div>`;
      triggerGridAnimation(container);
      return;
    }

    container.className = 'lookbook-grid';
    container.innerHTML = looksList.map(look => renderLookCardHTML(look)).join('');
    triggerGridAnimation(container);
    return;
  }

  // MODE "ALL COLLECTIONS": Horizontal Slider
  container.className = 'collections-section-list';
  const collectionsList = Object.values(allCollections);

  if (collectionsList.length === 0 && looksList.length === 0) {
    container.innerHTML = `<div style="text-align:center; padding:40px; color:#888;">Belum ada Curated Look yang sesuai.</div>`;
    triggerGridAnimation(container);
    return;
  }

  let html = '';

  collectionsList.forEach(col => {
    const colLooks = looksList.filter(look => look.collection_id === col.id);

    if (colLooks.length > 0) {
      html += `
        <div class="collection-row">
          <div class="collection-row-header">
            <div class="title-with-hint">
              <h3 class="collection-row-title">${col.title}</h3>
              <span class="scroll-hint">Geser untuk jelajahi →</span>
            </div>
            <button class="btn-see-all" onclick="selectCollection('${col.id}')">Lihat Semua ↗</button>
          </div>
          
          <div class="slider-wrapper">
            <button class="slider-arrow arrow-left" aria-label="Scroll Left" onclick="scrollSlider('${col.id}', -320)">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            
            <div class="horizontal-slider" id="slider-${col.id}">
              ${colLooks.map(look => renderLookCardHTML(look)).join('')}
            </div>

            <button class="slider-arrow arrow-right" aria-label="Scroll Right" onclick="scrollSlider('${col.id}', 320)">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          </div>
        </div>
      `;
    }
  });

  const orphanLooks = looksList.filter(look => !look.collection_id);
  if (orphanLooks.length > 0) {
    html += `
      <div class="collection-row">
        <div class="collection-row-header">
          <div class="title-with-hint">
            <h3 class="collection-row-title">Other Looks</h3>
            <span class="scroll-hint">Geser untuk jelajahi →</span>
          </div>
        </div>
        <div class="slider-wrapper">
          <button class="slider-arrow arrow-left" aria-label="Scroll Left" onclick="scrollSlider('orphan', -320)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <div class="horizontal-slider" id="slider-orphan">
            ${orphanLooks.map(look => renderLookCardHTML(look)).join('')}
          </div>
          <button class="slider-arrow arrow-right" aria-label="Scroll Right" onclick="scrollSlider('orphan', 320)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        </div>
      </div>
    `;
  }

  container.innerHTML = html;
  triggerGridAnimation(container);
}

// Fungsi Helper Scroll Horizontal
function scrollSlider(collectionId, distance) {
  const slider = document.getElementById(`slider-${collectionId}`);
  if (slider) {
    slider.scrollBy({ left: distance, behavior: 'smooth' });
  }
}

// Helper Template Kartu Look
function renderLookCardHTML(look) {
  const itemCount = (look.product_slugs || []).length;
  const lookCode = formatCode(look.id || '');
  const lookTitle = cleanTitle(look.title, lookCode);

  return `
    <div class="lookbook-card" onclick="openLookDetailModal('${look.id}')" style="cursor:pointer;">
      <div class="img-container">
        <img src="${look.hero_image}" alt="${look.title}" loading="lazy" onerror="this.src='https://via.placeholder.com/400x533?text=No+Image'">
        <div class="overlay-info">
          <span class="overlay-code">${lookCode}</span>
          <span class="overlay-action">Lihat ${itemCount} Style Items ↗</span>
        </div>
      </div>
      <div class="card-bottom">
        <span class="product-title">${lookTitle}</span>
        <span class="category-tag">${itemCount} Items</span>
      </div>
    </div>
  `;
}

// Render Grid Catalog Items
function renderCatalogGrid(query = '') {
  const container = document.getElementById('grid-container');
  if (!container) return;

  container.className = 'lookbook-grid';

  let itemsList = Object.entries(allCatalog);

  if (currentSegment !== 'all') {
    itemsList = itemsList.filter(([slug, item]) => {
      const itemSegment = (item.segment || 'tops').toLowerCase();
      return itemSegment === currentSegment;
    });
  }

  if (query.length > 0) {
    itemsList = itemsList.filter(([slug, item]) => {
      const matchTitle = (item.title || '').toLowerCase().includes(query);
      const matchSubCat = (item.category || '').toLowerCase().includes(query);
      const matchSlug = slug.toLowerCase().includes(query);
      const matchId = (item.id || '').toLowerCase().includes(query);
      return matchTitle || matchSubCat || matchSlug || matchId;
    });
  }

  if (itemsList.length === 0) {
    const msg = query ? `Tidak ada item yang cocok dengan "${query}"` : 'Belum ada produk yang cocok.';
    container.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:40px; color:#888;">${msg}</div>`;
    triggerGridAnimation(container);
    return;
  }

  container.innerHTML = itemsList.map(([slug, item]) => {
    const itemCode = formatCode(item.id || slug);
    const itemTitle = cleanTitle(item.title, itemCode);

    return `
      <a href="${item.affiliate_url}" class="lookbook-card" target="_blank" rel="noopener noreferrer">
        <div class="img-container">
          <img src="${item.image}" alt="${item.title}" loading="lazy" onerror="this.src='https://via.placeholder.com/400x533?text=No+Image'">
          <div class="overlay-info">
            <span class="overlay-code">${itemCode}</span>
            <span class="overlay-action">Klik untuk beli di Shopee ↗</span>
          </div>
        </div>
        <div class="card-bottom">
          <span class="product-title">${itemTitle}</span>
          <span class="category-tag">${item.category || item.segment || 'Item'}</span>
        </div>
      </a>
    `;
  }).join('');

  triggerGridAnimation(container);
}

// 5. MODAL DETAIL LOOK (FIXED SCROLL & CLOSE BUTTON)
function openLookDetailModal(lookId) {
  const look = findLookById(lookId);

  if (!look) {
    console.warn(`Look dengan ID '${lookId}' tidak ditemukan.`);
    return;
  }

  const modal = document.getElementById('detail-modal');
  const body = document.getElementById('modal-content-body');
  
  if (!modal || !body) return;

  // Kunci scroll halaman belakang secara ketat
  document.body.classList.add('no-scroll');
  document.body.style.overflow = 'hidden';

  const attachedProducts = (look.product_slugs || [])
    .map(slug => allCatalog[slug])
    .filter(Boolean);

  const lookCode = formatCode(look.id || '');
  const lookTitle = cleanTitle(look.title, lookCode);

  // Render HTML Modal beserta Tombol Close (X)
  body.innerHTML = `
    <button class="modal-close" onclick="closeDetailModal()" aria-label="Tutup Modal" style="position: absolute; top: 12px; right: 12px; background: #f1f5f9; border: none; font-size: 20px; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; z-index: 10; color: #475569;">&times;</button>
    
    <div style="position: relative; padding-bottom: 12px; margin-bottom: 16px; border-bottom: 1px solid #e2e8f0;">
      <h2 style="font-family:'Cormorant Garamond', serif; font-size: 22px; margin: 0 36px 6px 0; color:#0f172a; line-height: 1.2;">${lookTitle}</h2>
      
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;">
        <span style="font-size: 12px; color: #64748b; font-weight: 500;">ID Style: ${lookCode}</span>
        
        <button onclick="shareLookLink('${look.id}', '${lookTitle}')" class="btn-share-native" style="display: inline-flex; align-items: center; gap: 6px; background: #f8fafc; border: 1px solid #cbd5e0; padding: 4px 10px; border-radius: 20px; font-size: 11.5px; cursor: pointer; font-weight: 500; color: #334155;">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
          Bagikan
        </button>
      </div>
    </div>

    <div class="modal-body-scrollable" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px;">
      <div style="position: relative;">
        <img src="${look.hero_image}" alt="${lookTitle}" style="width:100%; border-radius:8px; object-fit:cover; display:block;">
        <div id="mobile-hint-scroll" class="mobile-scroll-floating-hint">
          Scroll kebawah untuk melihat items ↓
        </div>
      </div>

      <div>
        <h4 style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; margin-bottom: 10px;">Items in this look:</h4>
        <div style="display: flex; flex-direction: column; gap: 10px;">
          ${attachedProducts.length === 0 ? '<p style="font-size:12px; color:#94a3b8;">Belum ada item terhubung.</p>' : ''}
          ${attachedProducts.map(prod => {
            const pCode = formatCode(prod.id || '');
            const pTitle = cleanTitle(prod.title, pCode);
            return `
              <div style="display: flex; align-items: center; gap: 10px; padding: 8px; border: 1px solid #f1f5f9; border-radius: 8px; background: #fff;">
                <img src="${prod.image}" alt="${pTitle}" style="width: 48px; height: 60px; object-fit: cover; border-radius: 4px;">
                <div style="flex: 1; min-width: 0;">
                  <strong style="display: block; font-size: 12.5px; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${pCode} -${pTitle}</strong>
                  <span style="font-size: 10.5px; color: #64748b; text-transform: capitalize;">${prod.segment || 'tops'}</span>
                </div>
                <a href="${prod.affiliate_url}" target="_blank" rel="noopener noreferrer" style="font-size: 11px; padding: 6px 12px; background: #0f172a; color: #fff; text-decoration: none; border-radius: 6px; white-space: nowrap; font-weight: 500;">
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

  // Update URL tanpa memicu navigasi ulang
  if (window.location.pathname !== `/look/${look.id}`) {
    window.history.pushState({ modalOpen: true }, '', `/look/${look.id}`);
  }

  const scrollableContainer = modal.querySelector('.modal-container');
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

// FUNGSI CLOSE MODAL
function closeDetailModal() {
  const modal = document.getElementById('detail-modal');
  if (modal) modal.classList.remove('active');
  
  // Kembalikan scroll body
  document.body.classList.remove('no-scroll');
  document.body.style.overflow = '';

  if (window.location.pathname !== '/') {
    window.history.pushState({}, '', '/');
  }
}

async function shareLookLink(lookId, lookTitle) {
  const shareUrl = `${window.location.origin}/look/${lookId}`;
  if (navigator.share) {
    try {
      await navigator.share({
        title: lookTitle || 'Eunophy Curated Look',
        text: `Lihat inspirasi outfit "${lookTitle || 'Look'}" di Eunophy:`,
        url: shareUrl
      });
    } catch (err) {}
  } else if (navigator.clipboard) {
    navigator.clipboard.writeText(shareUrl).then(() => {
      alert("Link look berhasil disalin ke clipboard!");
    });
  } else {
    prompt("Salin link look berikut:", shareUrl);
  }
}

function checkDirectUrlLook() {
  const path = window.location.pathname;
  if (path.startsWith('/look/')) {
    const rawLookId = path.split('/look/')[1];
    if (rawLookId) {
      openLookDetailModal(rawLookId);
    }
  }
}

// Setup Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  // Tutup modal jika klik di area backdrop hitam luar
  window.addEventListener('click', (e) => {
    const modal = document.getElementById('detail-modal');
    if (e.target === modal) closeDetailModal();
  });

  // Handler Tombol Back Browser di HP
  window.addEventListener('popstate', () => {
    const modal = document.getElementById('detail-modal');
    if (modal && modal.classList.contains('active')) {
      closeDetailModal();
    }
  });

  document.addEventListener('click', (e) => {
    if (e.target.matches('.modal-close, .close-btn, #modal-close')) {
      closeDetailModal();
    }
  });

  document.querySelectorAll('.cat-pill').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.cat-pill').forEach((b) => b.classList.remove('active'));
      e.currentTarget.classList.add('active');
      currentSegment = e.currentTarget.dataset.segment;
      applyFilterAndRender();
    });
  });

  const searchInput = getSearchInput();
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      const hero = getHero();

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

  // Jalankan Inisialisasi Utama
  initApp();
});