// State Lokal Aplikasi
let allCatalog = {};
let allLooks = {};
let allCollections = {};

let currentViewMode = 'looks'; // 'looks' atau 'catalog'
let currentSegment = 'all';
let currentCollection = 'all';

const searchInput = document.getElementById('search-input');
const hero = document.querySelector('.hero-section');

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
  } catch (err) {
    if (container) {
      container.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:40px; color:#e11d48;">Gagal memuat katalog koleksi.</div>`;
    }
  }
}

// --- 2. SWITCH VIEW MODE (LOOKS VS CATALOG ITEMS) ---
function switchViewMode(mode) {
  currentViewMode = mode;

  // Toggle kelas tombol UI switcher
  const btnLooks = document.getElementById('btn-view-looks');
  const btnCatalog = document.getElementById('btn-view-catalog');
  const catNav = document.getElementById('category-nav');

  if (btnLooks) btnLooks.classList.toggle('active', mode === 'looks');
  if (btnCatalog) btnCatalog.classList.toggle('active', mode === 'catalog');

  // Kategori segmen (Tops, Bottoms, dll.) hanya ditampilkan secara fokus saat mode 'catalog'
  if (catNav) {
    catNav.style.display = (mode === 'catalog') ? 'flex' : 'none';
  }

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

  if (currentViewMode === 'looks') {
    renderLooksGrid(query);
  } else {
    renderCatalogGrid(query);
  }
}

// A. Render Grid Curated Looks
function renderLooksGrid(query) {
  const container = document.getElementById('grid-container');
  if (!container) return;

  let looksList = Object.values(allLooks);

  // Filter berdasarkan Koleksi (Collection ID)
  if (currentCollection !== 'all') {
    looksList = looksList.filter(look => look.collection_id === currentCollection);
  }

  // Filter berdasarkan Pencarian (Search Input)
  if (query) {
    looksList = looksList.filter(look => {
      const matchTitle = (look.title || '').toLowerCase().includes(query);
      const matchId = (look.id || '').toLowerCase().includes(query);

      // Cek apakah produk atomik di dalamnya cocok dengan pencarian
      const matchProduct = (look.product_slugs || []).some(slug => {
        const prod = allCatalog[slug];
        return prod && ((prod.title || '').toLowerCase().includes(query) || slug.toLowerCase().includes(query));
      });

      return matchTitle || matchId || matchProduct;
    });
  }

  if (looksList.length === 0) {
    container.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:40px; color:#888;">Belum ada Curated Look yang sesuai.</div>`;
    return;
  }

  container.innerHTML = looksList.map(look => {
    const itemCount = (look.product_slugs || []).length;
    return `
      <div class="lookbook-card" onclick="openLookDetailModal('${look.id}')" style="cursor:pointer;">
        <div class="img-container">
          <img src="${look.hero_image}" alt="${look.title}" loading="lazy" onerror="this.src='https://via.placeholder.com/400x533?text=No+Image'">
          <div class="overlay-info">
            <span class="overlay-code">${look.title}</span>
            <span class="overlay-action">
              Lihat ${itemCount} Style Items ↗
            </span>
          </div>
        </div>
        <div class="card-bottom">
          <span class="product-code">${look.title}</span>
          <span class="category-tag">${itemCount} Items Outfit</span>
        </div>
      </div>
    `;
  }).join('');
}

// B. Render Grid Catalog Items (Produk Atomik)
function renderCatalogGrid(query) {
  const container = document.getElementById('grid-container');
  if (!container) return;

  const filtered = {};

  Object.entries(allCatalog).forEach(([slug, item]) => {
    const itemSegment = (item.segment || 'tops').toLowerCase();
    const matchSegment = (currentSegment === 'all') || (itemSegment === currentSegment);

    const matchTitle = (item.title || '').toLowerCase().includes(query);
    const matchSubCat = (item.category || '').toLowerCase().includes(query);
    const matchSlug = slug.toLowerCase().includes(query);

    if (matchSegment && (matchTitle || matchSubCat || matchSlug)) {
      filtered[slug] = item;
    }
  });

  const items = Object.entries(filtered);

  if (items.length === 0) {
    container.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:40px; color:#888;">Belum ada produk yang cocok.</div>`;
    return;
  }

  container.innerHTML = items.map(([slug, item]) => `
    <a href="${item.affiliate_url}" class="lookbook-card" target="_blank" rel="noopener noreferrer">
      <div class="img-container">
        <img src="${item.image}" alt="${item.title}" loading="lazy" onerror="this.src='https://via.placeholder.com/400x533?text=No+Image'">
        <div class="overlay-info">
          <span class="overlay-code">${item.title}</span>
          <span class="overlay-action">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <path d="M16 10a4 4 0 0 1-8 0"></path>
            </svg>
            Klik untuk beli di Shopee ↗
          </span>
        </div>
      </div>
      <div class="card-bottom">
        <span class="product-code">${item.title}</span>
        <span class="category-tag">${item.category || 'Lookbook'}</span>
      </div>
    </a>
  `).join('');
}

// --- 5. MODAL POPUP DETAIL LOOK ---
function openLookDetailModal(lookId) {
  const look = allLooks[lookId];
  if (!look) return;

  const modal = document.getElementById('detail-modal');
  const body = document.getElementById('modal-content-body');
  if (!modal || !body) return;

  const attachedProducts = (look.product_slugs || [])
    .map(slug => allCatalog[slug])
    .filter(Boolean);

  body.innerHTML = `
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px;">
      <div>
        <img src="${look.hero_image}" alt="${look.title}" style="width:100%; border-radius:8px; object-fit:cover;">
      </div>
      <div>
        <h2 style="font-family:'Cormorant Garamond', serif; font-size: 28px; margin-bottom: 8px;">${look.title}</h2>
        <p style="font-size: 12px; color: #64748b; margin-bottom: 20px;">ID Style: ${look.id}</p>
        
        <h4 style="font-size: 14px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">Items in this look:</h4>
        
        <div style="display: flex; flex-direction: column; gap: 12px; max-height: 320px; overflow-y: auto;">
          ${attachedProducts.length === 0 ? '<p style="font-size:12px; color:#94a3b8;">Belum ada item terhubung.</p>' : ''}
          ${attachedProducts.map(prod => `
            <div style="display: flex; align-items: center; gap: 12px; padding: 8px; border: 1px solid #f1f5f9; border-radius: 6px;">
              <img src="${prod.image}" alt="${prod.title}" style="width: 50px; height: 65px; object-fit: cover; border-radius: 4px;">
              <div style="flex: 1;">
                <strong style="display: block; font-size: 13px;">${prod.title}</strong>
                <span style="font-size: 11px; color: #64748b; text-transform: capitalize;">${prod.segment || 'tops'}</span>
              </div>
              <a href="${prod.affiliate_url}" target="_blank" rel="noopener noreferrer" style="font-size: 11px; padding: 6px 12px; background: #0f172a; color: #fff; text-decoration: none; border-radius: 4px; white-space: nowrap;">
                Shopee ↗
              </a>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;

  modal.classList.add('active');
}

function closeDetailModal() {
  const modal = document.getElementById('detail-modal');
  if (modal) modal.classList.remove('active');
}

// Close Modal saat klik di luar modal card
window.addEventListener('click', (e) => {
  const modal = document.getElementById('detail-modal');
  if (e.target === modal) {
    closeDetailModal();
  }
});

// --- 6. EVENT LISTENERS ---
// Event Listener Tab Kategori Pill (Segment)
document.querySelectorAll('.cat-pill').forEach((btn) => {
  btn.addEventListener('click', (e) => {
    document.querySelectorAll('.cat-pill').forEach((b) => b.classList.remove('active'));
    e.currentTarget.classList.add('active');
    currentSegment = e.currentTarget.dataset.segment;
    applyFilterAndRender();
  });
});

// Event Listener Search Realtime + Auto-Collapse Hero
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