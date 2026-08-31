const TOKEN = prompt("Masukkan Admin Token:") || "adminKatalog2026!";
let catalog = {};

async function loadProducts() {
  const res = await fetch('/api/products');
  catalog = await res.json();
  renderTable();
}

function renderTable() {
  const tbody = document.getElementById('table-body');
  const items = Object.entries(catalog);

  if (items.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:20px;">Belum ada data.</td></tr>`;
    return;
  }

  const origin = window.location.origin;

  tbody.innerHTML = items.map(([slug, item]) => `
    <tr>
      <td><img src="${item.image}" class="thumb" onerror="this.src='https://via.placeholder.com/40x52'"></td>
      <td><strong>${item.title}</strong><br><small style="color:#64748b;">${slug}</small></td>
      <td>${item.category || '-'}</td>
      <td>
        <button class="btn btn-copy" onclick="copyDirectLink('${origin}/p/${slug}')">📋 Copy Direct</button>
      </td>
      <td>
        <button class="btn btn-danger" onclick="deleteProduct('${slug}')">Hapus</button>
      </td>
    </tr>
  `).join('');
}

async function saveProduct() {
  const title = document.getElementById('title').value.trim();
  const category = document.getElementById('category').value;
  const image = document.getElementById('image').value.trim();
  const affiliate_url = document.getElementById('affiliate_url').value.trim();

  if (!title || !affiliate_url) {
    alert("Kode Produk dan Link Shopee wajib diisi!");
    return;
  }

  const slug = title.toLowerCase().replace(/[^a-z0-9]/g, '');

  const payload = {
    slug: slug,
    product: { title, category, image, affiliate_url }
  };

  const res = await fetch('/api/products', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TOKEN}`
    },
    body: JSON.stringify(payload)
  });

  if (res.ok) {
    alert("Produk berhasil disimpan!");
    document.getElementById('title').value = '';
    document.getElementById('image').value = '';
    document.getElementById('affiliate_url').value = '';
    loadProducts();
  } else {
    alert("Gagal menyimpan. Cek token admin.");
  }
}

async function deleteProduct(slug) {
  if (!confirm(`Hapus produk ${slug}?`)) return;

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

function copyDirectLink(link) {
  navigator.clipboard.writeText(link);
  alert("Direct Link tersalin:\n" + link);
}

loadProducts();