const TOKEN = localStorage.getItem('eunophy_admin_token') || prompt("Masukkan Admin Token:") || "adminKatalog2026!";
if (TOKEN) localStorage.setItem('eunophy_admin_token', TOKEN);

let catalog = {};
let currentBase64Image = "";
let editBase64Image = "";

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

// Listener Upload Form Tambah
document.getElementById('image_file').addEventListener('change', function (e) {
  const file = e.target.files[0];
  if (!file) return;

  const status = document.getElementById('image_status');
  status.textContent = "Mengompresi HD...";

  processImageToHDWebP(file, (base64) => {
    currentBase64Image = base64;
    const preview = document.getElementById('image_preview');
    preview.src = base64;
    preview.style.display = 'block';
    status.textContent = "Foto siap diupload (HD WebP)";
  });
});

// Listener Upload Form Edit
document.getElementById('edit-image-file').addEventListener('change', function (e) {
  const file = e.target.files[0];
  if (!file) return;

  processImageToHDWebP(file, (base64) => {
    editBase64Image = base64;
    document.getElementById('edit-preview-img').src = base64;
  });
});

// --- AMBIL & TAMPILKAN DATA DARI KV ---
async function loadProducts() {
  try {
    const res = await fetch('/api/products');
    catalog = await res.json();
    renderTable(catalog);
  } catch (err) {
    document.getElementById('table-body').innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px; color:red;">Gagal memuat katalog.</td></tr>`;
  }
}

function renderTable(data) {
  const tbody = document.getElementById('table-body');
  const items = Object.entries(data);
  document.getElementById('total-count').textContent = items.length;

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
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
          Landing Iklan
        </button>
      </td>
      <td>
        <button class="btn btn-copy" onclick="copyLinkText('${origin}/p/${slug}', 'Direct Link Pinterest')" style="display:inline-flex; align-items:center; gap:5px;">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
          </svg>
          Direct
        </button>
      </td>
      <td>
        <div class="action-group">
          <button class="btn btn-edit" onclick="openEditModal('${slug}')" style="display:inline-flex; align-items:center; gap:4px;">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 20h9"></path>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
            </svg>
            Edit
          </button>
          <button class="btn btn-danger" onclick="deleteProduct('${slug}')" style="display:inline-flex; align-items:center; gap:4px;">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
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

// --- SEARCH FILTER DI ADMIN PANEL ---
document.getElementById('search-table').addEventListener('input', (e) => {
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

  // Pilih radio button segment yang sesuai
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
        body: JSON.stringify({ slug: oldSlug })
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
    body: JSON.stringify({ slug })
  });

  if (res.ok) loadProducts();
}

loadProducts();