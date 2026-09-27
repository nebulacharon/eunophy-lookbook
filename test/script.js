function toggleModal() {
    const modal = document.getElementById('test-modal');
    if (modal) {
      modal.classList.toggle('active');
      console.log("Status modal di-toggle:", modal.classList.contains('active'));
    }
  }
  
  // Otomatis buka modal saat halaman dimuat untuk tes render
  window.addEventListener('DOMContentLoaded', () => {
    console.log("Halaman test berhasil dimuat sepenuhnya.");
  });