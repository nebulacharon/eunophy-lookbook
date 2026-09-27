const TOKEN = localStorage.getItem('eunophy_admin_token') || prompt("Masukkan Admin Token:") || "adminKatalog2026!";
if (TOKEN) localStorage.setItem('eunophy_admin_token', TOKEN);

// Storage Data Lokal
let catalog = {};
let looks = {};
let collections = {};

// Temporary State Base64 Images
let currentBase64Image = "";
let editBase64Image = "";
let lookBase64Image = "";
let editLookBase64Image = "";

// State Selected Products untuk Form Look (Create & Edit)
let selectedLookProducts = [];
let editSelectedLookProducts = [];

// --- FUNGSI KOMPRESI HD CANVAS (WEBP QUALITY 0.90) ---
function processImageToHDWebP(file, callback) {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = function (event) {
    const img = new Image();
    img.src = event.target.result;
    img.onload = function () {
      const canvas = document.createElement('canvas');
      const maxDim = 1000;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        }
      } else {
        if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      const optimizedBase64 = canvas.toDataURL('image/webp', 0.90);
      callback(optimizedBase64);
    };
  };
}

// --- TAB NAVIGATION HANDLER ---
function switchAdminTab(tabId) {
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

  if (event && event.target) {
    event.target.classList.add('active');
  }
  const targetTab = document.getElementById(tabId);
  if (targetTab) targetTab.classList.add('active');
}

// --- IMAGE UPLOAD LISTENERS ---
// 1. Upload Form Tambah Produk
document.getElementById('image_file')?.addEventListener('change', function (e) {
  const file = e.target.files[0];
  if (!file) return;

  const status = document.getElementById('image_status');
  if (status) status.textContent = "Mengompresi HD...";

  processImageToHDWebP(file, (base64) => {
    currentBase64Image = base64;
    const preview = document.getElementById('image_preview');
    if (preview) {
      preview.src = base64;
      preview.style.display = 'block';
    }
    if (status) status.textContent = "Foto siap diupload (HD WebP)";
  });
});

// 2. Upload Form Edit Produk
document.getElementById('edit-image-file')?.addEventListener('change', function (e) {
  const file = e.target.files[0];
  if (!file) return;

  processImageToHDWebP(file, (base64) => {
    editBase64Image = base64;
    const preview = document.getElementById('edit-preview-img');
    if (preview) preview.src = base64;
  });
});

// 3. Upload Form Curated Look Hero Image (Create)
document.getElementById('look-image-file')?.addEventListener('change', function (e) {
  const file = e.target.files[0];
  if (!file) return;

  processImageToHDWebP(file, (base64) => {
    lookBase64Image = base64;
    const preview = document.getElementById('look-image-preview');
    if (preview) {
      preview.src = base64;
      preview.style.display = 'block';
    }
  });
});

// 4. Upload Form Curated Look Hero Image (Edit)
document.getElementById('edit-look-image-file')?.addEventListener('change', function (e) {
  const file = e.target.files[0];
  if (!file) return;

  processImageToHDWebP(file, (base64) => {
    editLookBase64Image = base64;
    const preview = document.getElementById('edit-look-preview-img');
    if (preview) preview.src = base64;
  });
});

// --- AMBIL & TAMPILKAN ALL DATA DARI KV ---
async function initDashboardData() {
  await loadProducts();
  await loadCollections();
  await loadLooks();
  setupLookProductSearch();
  setupEditLookProductSearch();
}

// 1. AMBIL DATA PRODUK
async function loadProducts() {
  try {
    const res = await fetch('/api/products?type=catalog');
    catalog = await res.json();
    renderTable(catalog);
  } catch (err) {
    document.getElementById('table-body').innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px; color:red;">Gagal memuat katalog.</td></tr>`;
  }
}

// 2. AMBIL DATA COLLECTIONS
async function loadCollections() {
  try {
    const res = await fetch('/api/products?type=collections');
    collections = await res.json();
    renderCollectionsTable(collections);
    renderCollectionsDropdown();
  } catch (err) {
    console.warn("Gagal memuat collections");
  }
}

// 3. AMBIL DATA LOOKS
async function loadLooks() {
  try {
    const res = await fetch('/api/products?type=looks');
    looks = await res.json();
    renderLooksTable(looks);
  } catch (err) {
    console.warn("Gagal memuat looks");
  }
}

// --- RENDER TABEL PRODUK ITEMS ---
function renderTable(data) {
  const tbody = document.getElementById('table-body');
  const items = Object.entries(data);
  const totalCount = document.getElementById('total-count');
  if (totalCount) totalCount.textContent = items.length;

  if (items.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:24px; color:#94a3b8;">Belum ada produk yang cocok.</td></tr>`;
    return;
  }

  const origin = window.location.origin;

  tbody.innerHTML = items.map(([slug, item]) => `
    <tr>
      <td><img src="${item.image}" class="thumb" onerror="this.src='https://via.placeholder.com/44x58?text=No+Img'"></td>
      <td><strong>${item.title}</strong><br><small style="color:#64748b;">${slug}</small></td>
      <td>
        <span style="display:inline-block; font-size:11px; padding:2px 6px; background:#f1f5f9; border-radius:4px; margin-bottom:3px; text-transform:capitalize;">${item.segment || 'tops'}</span><br>
        <span style="font-size:12px; color:#64748b;">${item.category || '-'}</span>
      </td>
      <td>
        <button class="btn btn-copy" onclick="copyLinkText('${origin}/item/${slug}', 'Link Landing Iklan (Single Page)')" style="display:inline-flex; align-items:center; gap:5px; background:#eff6ff; color:#1d4ed8; border-color:#bfdbfe;">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
          Landing Iklan
        </button>
      </td>
      <td>
        <button class="btn btn-copy" onclick="copyLinkText('${origin}/p/${slug}', 'Direct Link Pinterest')" style="display:inline-flex; align-items:center; gap:5px;">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
          Direct
        </button>
      </td>
      <td>
        <div class="action-group">
          <button class="btn btn-edit" onclick="openEditModal('${slug}')" style="display:inline-flex; align-items:center; gap:4px;">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
            Edit
          </button>
          <button class="btn btn-danger" onclick="deleteProduct('${slug}')" style="display:inline-flex; align-items:center; gap:4px;">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            Hapus
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function copyLinkText(link, typeLabel) {
  navigator.clipboard.writeText(link);
  alert(`${typeLabel} berhasil disalin:\n` + link);
}

// --- SEARCH FILTER DI TABEL PRODUK ---
document.getElementById('search-table')?.addEventListener('input', (e) => {
  const query = e.target.value.toLowerCase().trim();
  const filtered = {};

  Object.entries(catalog).forEach(([slug, item]) => {
    const matchTitle = (item.title || '').toLowerCase().includes(query);
    const matchCategory = (item.category || '').toLowerCase().includes(query);
    const matchSegment = (item.segment || '').toLowerCase().includes(query);
    const matchSlug = slug.toLowerCase().includes(query);
    if (matchTitle || matchCategory || matchSegment || matchSlug) {
      filtered[slug] = item;
    }
  });

  renderTable(filtered);
});

// --- SIMPAN PRODUK BARU ---
async function saveNewProduct() {
  const title = document.getElementById('title').value.trim();
  const category = document.getElementById('category').value.trim();
  const affiliate_url = document.getElementById('affiliate_url').value.trim();
  const selectedSegment = document.querySelector('input[name="main_segment"]:checked')?.value || 'tops';

  if (!title || !affiliate_url) {
    alert("Kode Produk dan Link Shopee wajib diisi!");
    return;
  }

  if (!currentBase64Image) {
    alert("Silakan pilih foto produk terlebih dahulu!");
    return;
  }

  const slug = title.toLowerCase().replace(/[^a-z0-9]/g, '');

  const payload = {
    target: "catalog",
    slug: slug,
    product: {
      title: title,
      segment: selectedSegment,
      category: category || 'Lookbook',
      image: currentBase64Image,
      affiliate_url: affiliate_url
    }
  };

  const btn = document.getElementById('btn-save');
  btn.textContent = "Menyimpan...";
  btn.disabled = true;

  try {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}`
      },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      alert("Produk berhasil ditambahkan!");
      document.getElementById('title').value = '';
      document.getElementById('category').value = '';
      document.getElementById('affiliate_url').value = '';
      document.getElementById('image_file').value = '';
      document.getElementById('image_preview').style.display = 'none';
      document.getElementById('image_status').textContent = '';
      currentBase64Image = "";
      loadProducts();
    } else {
      alert("Gagal menyimpan. Pastikan token admin benar.");
    }
  } catch (err) {
    alert("Terjadi kesalahan jaringan.");
  } finally {
    btn.textContent = "Simpan Koleksi";
    btn.disabled = false;
  }
}

// --- MODAL EDIT PRODUK ---
function openEditModal(slug) {
  const item = catalog[slug];
  if (!item) return;

  document.getElementById('edit-old-slug').value = slug;
  document.getElementById('edit-title').value = item.title || '';
  document.getElementById('edit-category').value = item.category || '';
  document.getElementById('edit-affiliate-url').value = item.affiliate_url || '';
  document.getElementById('edit-preview-img').src = item.image;
  editBase64Image = item.image;

  const segmentToSelect = item.segment || 'tops';
  const radio = document.querySelector(`input[name="edit_main_segment"][value="${segmentToSelect}"]`);
  if (radio) radio.checked = true;

  document.getElementById('edit-modal').classList.add('active');
}

function closeEditModal() {
  document.getElementById('edit-modal').classList.remove('active');
  document.getElementById('edit-image-file').value = '';
}

async function submitProductEdit() {
  const oldSlug = document.getElementById('edit-old-slug').value;
  const newTitle = document.getElementById('edit-title').value.trim();
  const newCategory = document.getElementById('edit-category').value.trim();
  const newAffiliateUrl = document.getElementById('edit-affiliate-url').value.trim();
  const selectedSegment = document.querySelector('input[name="edit_main_segment"]:checked')?.value || 'tops';

  if (!newTitle || !newAffiliateUrl) {
    alert("Kode Produk dan Link Shopee tidak boleh kosong!");
    return;
  }

  const newSlug = newTitle.toLowerCase().replace(/[^a-z0-9]/g, '');

  const payload = {
    target: "catalog",
    slug: newSlug,
    product: {
      title: newTitle,
      segment: selectedSegment,
      category: newCategory || 'Lookbook',
      image: editBase64Image,
      affiliate_url: newAffiliateUrl
    }
  };

  try {
    if (oldSlug !== newSlug) {
      await fetch('/api/products/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${TOKEN}` },
        body: JSON.stringify({ slug: oldSlug, target: 'catalog' })
      });
    }

    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${TOKEN}` },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      alert("Produk berhasil diperbarui!");
      closeEditModal();
      loadProducts();
    } else {
      alert("Gagal memperbarui produk.");
    }
  } catch (err) {
    alert("Terjadi kesalahan jaringan.");
  }
}

// --- HAPUS PRODUK ---
async function deleteProduct(slug) {
  if (!confirm(`Yakin ingin menghapus produk ${slug}?`)) return;

  const res = await fetch('/api/products/delete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TOKEN}`
    },
    body: JSON.stringify({ slug, target: 'catalog' })
  });

  if (res.ok) loadProducts();
}

// =========================================================
// LOGIKA SEARCH & CHIPS PRODUCT PICKER UNTUK CURATED LOOKS
// =========================================================

function setupLookProductSearch() {
  const searchInput = document.getElementById('look-product-search');
  const resultsContainer = document.getElementById('look-product-results');

  if (!searchInput || !resultsContainer) return;

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    if (!query) {
      resultsContainer.style.display = 'none';
      return;
    }

    const matches = Object.entries(catalog).filter(([slug, item]) => {
      const matchTitle = (item.title || '').toLowerCase().includes(query);
      const matchSlug = slug.toLowerCase().includes(query);
      return (matchTitle || matchSlug) && !selectedLookProducts.includes(slug);
    });

    if (matches.length === 0) {
      resultsContainer.innerHTML = `<div class="search-result-item" style="color:#94a3b8;">Tidak ada produk cocok</div>`;
    } else {
      resultsContainer.innerHTML = matches.map(([slug, item]) => `
        <div class="search-result-item" onclick="addLookProduct('${slug}')">
          <img src="${item.image}" style="width:30px; height:40px; object-fit:cover; border-radius:3px;">
          <div>
            <strong>${item.title}</strong> <small style="color:#64748b;">(${slug})</small>
          </div>
        </div>
      `).join('');
    }
    resultsContainer.style.display = 'block';
  });

  document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !resultsContainer.contains(e.target)) {
      resultsContainer.style.display = 'none';
    }
  });
}

function addLookProduct(slug) {
  if (!selectedLookProducts.includes(slug)) {
    selectedLookProducts.push(slug);
    renderLookProductChips();
  }
  document.getElementById('look-product-search').value = '';
  document.getElementById('look-product-results').style.display = 'none';
}

function removeLookProduct(slug) {
  selectedLookProducts = selectedLookProducts.filter(s => s !== slug);
  renderLookProductChips();
}

function renderLookProductChips() {
  const container = document.getElementById('selected-products-container');
  if (!container) return;

  if (selectedLookProducts.length === 0) {
    container.innerHTML = `<span style="color:#94a3b8; font-size:12px;">Belum ada produk yang ditambahkan ke Look ini.</span>`;
    return;
  }

  container.innerHTML = selectedLookProducts.map(slug => {
    const item = catalog[slug] || { title: slug };
    return `
      <div class="product-chip">
        <span>${item.title}</span>
        <button type="button" class="product-chip-remove" onclick="removeLookProduct('${slug}')">&times;</button>
      </div>
    `;
  }).join('');
}

// SETUP UNTUK EDIT LOOK FORM SEARCH & CHIPS
function setupEditLookProductSearch() {
  const searchInput = document.getElementById('edit-look-product-search');
  const resultsContainer = document.getElementById('edit-look-product-results');

  if (!searchInput || !resultsContainer) return;

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    if (!query) {
      resultsContainer.style.display = 'none';
      return;
    }

    const matches = Object.entries(catalog).filter(([slug, item]) => {
      const matchTitle = (item.title || '').toLowerCase().includes(query);
      const matchSlug = slug.toLowerCase().includes(query);
      return (matchTitle || matchSlug) && !editSelectedLookProducts.includes(slug);
    });

    if (matches.length === 0) {
      resultsContainer.innerHTML = `<div class="search-result-item" style="color:#94a3b8;">Tidak ada produk cocok</div>`;
    } else {
      resultsContainer.innerHTML = matches.map(([slug, item]) => `
        <div class="search-result-item" onclick="addEditLookProduct('${slug}')">
          <img src="${item.image}" style="width:30px; height:40px; object-fit:cover; border-radius:3px;">
          <div>
            <strong>${item.title}</strong> <small style="color:#64748b;">(${slug})</small>
          </div>
        </div>
      `).join('');
    }
    resultsContainer.style.display = 'block';
  });

  document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !resultsContainer.contains(e.target)) {
      resultsContainer.style.display = 'none';
    }
  });
}

function addEditLookProduct(slug) {
  if (!editSelectedLookProducts.includes(slug)) {
    editSelectedLookProducts.push(slug);
    renderEditLookProductChips();
  }
  document.getElementById('edit-look-product-search').value = '';
  document.getElementById('edit-look-product-results').style.display = 'none';
}

function removeEditLookProduct(slug) {
  editSelectedLookProducts = editSelectedLookProducts.filter(s => s !== slug);
  renderEditLookProductChips();
}

function renderEditLookProductChips() {
  const container = document.getElementById('edit-selected-products-container');
  if (!container) return;

  if (editSelectedLookProducts.length === 0) {
    container.innerHTML = `<span style="color:#94a3b8; font-size:12px;">Belum ada produk terhubung.</span>`;
    return;
  }

  container.innerHTML = editSelectedLookProducts.map(slug => {
    const item = catalog[slug] || { title: slug };
    return `
      <div class="product-chip">
        <span>${item.title}</span>
        <button type="button" class="product-chip-remove" onclick="removeEditLookProduct('${slug}')">&times;</button>
      </div>
    `;
  }).join('');
}

// Render Dropdown Collections di Form Look
function renderCollectionsDropdown() {
  const selects = [
    document.getElementById('look-collection-select'),
    document.getElementById('edit-look-collection-select')
  ];
  const items = Object.entries(collections);

  selects.forEach(select => {
    if (!select) return;
    select.innerHTML = '<option value="">-- Pilih Koleksi --</option>' + 
      items.map(([colId, col]) => `<option value="${colId}">${col.title}</option>`).join('');
  });
}

// SIMPAN CURATED LOOK BARU
async function saveNewLook() {
  const lookId = document.getElementById('look-id').value.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
  const title = document.getElementById('look-title').value.trim();
  const collectionId = document.getElementById('look-collection-select').value;

  if (!lookId || !title) {
    alert("ID Look dan Judul Look wajib diisi!");
    return;
  }

  if (!lookBase64Image) {
    alert("Silakan upload foto outfit utama (Hero Image)!");
    return;
  }

  const payload = {
    target: "looks",
    id: lookId,
    data: {
      id: lookId,
      title: title,
      collection_id: collectionId || "",
      hero_image: lookBase64Image,
      product_slugs: selectedLookProducts
    }
  };

  try {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${TOKEN}` },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      alert("Curated Look berhasil disimpan!");
      document.getElementById('look-id').value = '';
      document.getElementById('look-title').value = '';
      document.getElementById('look-image-file').value = '';
      document.getElementById('look-image-preview').style.display = 'none';
      lookBase64Image = "";
      selectedLookProducts = [];
      renderLookProductChips();
      loadLooks();
    } else {
      alert("Gagal menyimpan Look.");
    }
  } catch (err) {
    alert("Terjadi kesalahan jaringan.");
  }
}

// RENDER TABEL LOOKS
function renderLooksTable(data) {
  const tbody = document.getElementById('looks-table-body');
  const items = Object.entries(data);
  const origin = window.location.origin;

  if (items.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 20px; color: #94a3b8;">Belum ada Look.</td></tr>`;
    return;
  }

  tbody.innerHTML = items.map(([id, look]) => `
    <tr>
      <td><img src="${look.hero_image}" class="thumb" onerror="this.src='https://via.placeholder.com/44x58'"></td>
      <td><strong>${look.id}</strong></td>
      <td>${look.title}</td>
      <td><span style="font-size:11px; padding:2px 6px; background:#e2e8f0; border-radius:4px;">${look.collection_id || '-'}</span></td>
      <td>${(look.product_slugs || []).length} Item</td>
      <td>
        <div class="action-group">
          <button class="btn btn-copy" onclick="copyLinkText('${origin}/look/${look.id}', 'Link Pinterest Look')">
            Copy
          </button>
          <button class="btn btn-edit" onclick="openEditLookModal('${look.id}')">
            Edit
          </button>
          <button class="btn btn-danger" onclick="deleteLook('${look.id}')">
            Hapus
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

// SEARCH FILTER TABLE LOOKS
document.getElementById('search-looks-table')?.addEventListener('input', (e) => {
  const query = e.target.value.toLowerCase().trim();
  const filtered = {};

  Object.entries(looks).forEach(([id, item]) => {
    const matchTitle = (item.title || '').toLowerCase().includes(query);
    const matchId = id.toLowerCase().includes(query);
    const matchCol = (item.collection_id || '').toLowerCase().includes(query);
    if (matchTitle || matchId || matchCol) {
      filtered[id] = item;
    }
  });

  renderLooksTable(filtered);
});

// MODAL EDIT LOOK
function openEditLookModal(id) {
  const item = looks[id];
  if (!item) return;

  document.getElementById('edit-look-old-id').value = id;
  document.getElementById('edit-look-id').value = id;
  document.getElementById('edit-look-title').value = item.title || '';
  document.getElementById('edit-look-collection-select').value = item.collection_id || '';
  document.getElementById('edit-look-preview-img').src = item.hero_image;
  editLookBase64Image = item.hero_image;

  editSelectedLookProducts = [...(item.product_slugs || [])];
  renderEditLookProductChips();

  document.getElementById('edit-look-modal').classList.add('active');
}

function closeEditLookModal() {
  document.getElementById('edit-look-modal').classList.remove('active');
  document.getElementById('edit-look-image-file').value = '';
}

async function submitLookEdit() {
  const id = document.getElementById('edit-look-id').value;
  const title = document.getElementById('edit-look-title').value.trim();
  const collectionId = document.getElementById('edit-look-collection-select').value;

  if (!title) {
    alert("Judul Look wajib diisi!");
    return;
  }

  const payload = {
    target: "looks",
    id: id,
    data: {
      id: id,
      title: title,
      collection_id: collectionId || "",
      hero_image: editLookBase64Image,
      product_slugs: editSelectedLookProducts
    }
  };

  try {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${TOKEN}` },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      alert("Look berhasil diperbarui!");
      closeEditLookModal();
      loadLooks();
    } else {
      alert("Gagal memperbarui Look.");
    }
  } catch (err) {
    alert("Terjadi kesalahan jaringan.");
  }
}

async function deleteLook(id) {
  if (!confirm(`Yakin ingin menghapus Look ${id}?`)) return;

  const res = await fetch('/api/products/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${TOKEN}` },
    body: JSON.stringify({ slug: id, target: 'looks' })
  });

  if (res.ok) loadLooks();
}

// ==========================================
// LOGIKA COLLECTIONS (UTAMA & FEATURED)
// ==========================================

// SIMPAN COLLECTION UTAMA BARU
async function saveNewCollection() {
  const colId = document.getElementById('col-id').value.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
  const title = document.getElementById('col-title').value.trim();
  const description = document.getElementById('col-desc').value.trim();
  const isFeatured = document.getElementById('col-is-featured').checked;

  if (!colId || !title) {
    alert("ID Koleksi dan Nama Koleksi wajib diisi!");
    return;
  }

  const payload = {
    target: "collections",
    id: colId,
    data: {
      id: colId,
      title: title,
      description: description,
      is_featured: isFeatured
    }
  };

  try {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${TOKEN}` },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      alert("Koleksi Utama berhasil disimpan!");
      document.getElementById('col-id').value = '';
      document.getElementById('col-title').value = '';
      document.getElementById('col-desc').value = '';
      document.getElementById('col-is-featured').checked = true;
      loadCollections();
    } else {
      alert("Gagal menyimpan Koleksi.");
    }
  } catch (err) {
    alert("Terjadi kesalahan jaringan.");
  }
}

// RENDER TABEL COLLECTIONS
function renderCollectionsTable(data) {
  const tbody = document.getElementById('collections-table-body');
  const items = Object.entries(data);

  if (items.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 20px; color: #94a3b8;">Belum ada Koleksi Utama.</td></tr>`;
    return;
  }

  tbody.innerHTML = items.map(([id, col]) => `
    <tr>
      <td><strong>${col.id}</strong></td>
      <td>${col.title}</td>
      <td><small style="color:#64748b;">${col.description || '-'}</small></td>
      <td>
        ${col.is_featured !== false 
          ? `<span class="badge badge-featured">⭐ Featured Slider</span>` 
          : `<span class="badge badge-inactive">Standard</span>`}
      </td>
      <td>
        <div class="action-group">
          <button class="btn btn-edit" onclick="openEditColModal('${col.id}')">Edit</button>
          <button class="btn btn-danger" onclick="deleteCol('${col.id}')">Hapus</button>
        </div>
      </td>
    </tr>
  `).join('');
}

// SEARCH FILTER TABLE COLLECTIONS
document.getElementById('search-collections-table')?.addEventListener('input', (e) => {
  const query = e.target.value.toLowerCase().trim();
  const filtered = {};

  Object.entries(collections).forEach(([id, item]) => {
    const matchTitle = (item.title || '').toLowerCase().includes(query);
    const matchId = id.toLowerCase().includes(query);
    if (matchTitle || matchId) {
      filtered[id] = item;
    }
  });

  renderCollectionsTable(filtered);
});

// MODAL EDIT COLLECTION
function openEditColModal(id) {
  const item = collections[id];
  if (!item) return;

  document.getElementById('edit-col-old-id').value = id;
  document.getElementById('edit-col-id').value = id;
  document.getElementById('edit-col-title').value = item.title || '';
  document.getElementById('edit-col-desc').value = item.description || '';
  document.getElementById('edit-col-is-featured').checked = item.is_featured !== false;

  document.getElementById('edit-col-modal').classList.add('active');
}

function closeEditColModal() {
  document.getElementById('edit-col-modal').classList.remove('active');
}

async function submitColEdit() {
  const id = document.getElementById('edit-col-id').value;
  const title = document.getElementById('edit-col-title').value.trim();
  const description = document.getElementById('edit-col-desc').value.trim();
  const isFeatured = document.getElementById('edit-col-is-featured').checked;

  if (!title) {
    alert("Nama Koleksi wajib diisi!");
    return;
  }

  const payload = {
    target: "collections",
    id: id,
    data: {
      id: id,
      title: title,
      description: description,
      is_featured: isFeatured
    }
  };

  try {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${TOKEN}` },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      alert("Koleksi Utama berhasil diperbarui!");
      closeEditColModal();
      loadCollections();
    } else {
      alert("Gagal memperbarui Koleksi.");
    }
  } catch (err) {
    alert("Terjadi kesalahan jaringan.");
  }
}

async function deleteCol(id) {
  if (!confirm(`Yakin ingin menghapus Koleksi Utama ${id}?`)) return;

  const res = await fetch('/api/products/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${TOKEN}` },
    body: JSON.stringify({ slug: id, target: 'collections' })
  });

  if (res.ok) loadCollections();
}

// Jalankan Inisialisasi Awal
initDashboardData();