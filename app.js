let catalogData = {};
let currentSegment = 'all';

const searchInput = document.getElementById('search-input');
const hero = document.querySelector('.hero-section');

async function loadCatalog() {
  const container = document.getElementById('grid-container');
  try {
    const res = await fetch('/api/products');
    catalogData = await res.json();
    applyFilter();
  } catch (err) {
    container.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:40px;">Gagal memuat katalog.</div>`;
  }
}

function renderCards(data) {
  const container = document.getElementById('grid-container');
  const items = Object.entries(data);

  if (items.length === 0) {
    container.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:40px; color:#888;">Belum ada koleksi produk.</div>`;
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

// Logika Gabungan: Filter Segmen + Search Input Universal
function applyFilter() {
  const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
  const filtered = {};

  Object.entries(catalogData).forEach(([slug, item]) => {
    // Cocokkan main segment (jika belum diset di data lama, fallback ke 'tops')
    const itemSegment = (item.segment || 'tops').toLowerCase();
    const matchSegment = (currentSegment === 'all') || (itemSegment === currentSegment);

    const matchTitle = (item.title || '').toLowerCase().includes(query);
    const matchSubCat = (item.category || '').toLowerCase().includes(query);
    const matchSlug = slug.toLowerCase().includes(query);

    if (matchSegment && (matchTitle || matchSubCat || matchSlug)) {
      filtered[slug] = item;
    }
  });

  renderCards(filtered);
}

// Event Listener Tab Kategori Pill
document.querySelectorAll('.cat-pill').forEach((btn) => {
  btn.addEventListener('click', (e) => {
    document.querySelectorAll('.cat-pill').forEach((b) => b.classList.remove('active'));
    e.currentTarget.classList.add('active');
    currentSegment = e.currentTarget.dataset.segment;
    applyFilter();
  });
});

// Event Listener Search Realtime + Smooth Auto-Collapse Hero
if (searchInput) {
  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();

    if (hero) {
      if (query.length > 0) {
        hero.classList.add('hidden-search');
        // Reset tab pill ke 'All' saat pencarian aktif agar hasil menyeluruh
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

    applyFilter();
  });
}

loadCatalog();