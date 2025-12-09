// main.js
// Firebase Firestore instance
const db = firebase.firestore();
const inventoryCollection = db.collection('inventory');


// Elemen DOM
const itemForm = document.getElementById('itemForm');
const itemName = document.getElementById('itemName');
const itemCategory = document.getElementById('itemCategory');
const itemQuantity = document.getElementById('itemQuantity');
const itemUnit = document.getElementById('itemUnit');
const itemMinStock = document.getElementById('itemMinStock');
const itemLocation = document.getElementById('itemLocation');
const itemId = document.getElementById('itemId');
const cancelEdit = document.getElementById('cancelEdit');
const inventoryTableBody = document.getElementById('inventoryTableBody');
const filterButtons = document.querySelectorAll('.filter-btn');
const notification = document.getElementById('notification');
const notificationText = document.getElementById('notification-text');

// Statistik
const totalItemsEl = document.getElementById('total-items');
const lowStockEl = document.getElementById('low-stock');
const categoriesCountEl = document.getElementById('categories-count');
const summaryFoodEl = document.getElementById('summary-food');
const summaryDrinkEl = document.getElementById('summary-drink');
const summaryKitchenEl = document.getElementById('summary-kitchen');
const summaryLowEl = document.getElementById('summary-low');
const summaryTotalEl = document.getElementById('summary-total');

// Variabel global
let currentFilter = 'all';
let inventoryData = [];

// Fungsi untuk menampilkan notifikasi
function showNotification(message, type = 'success') {
    notificationText.textContent = message;
    
    // Hapus semua kelas notifikasi sebelumnya
    notification.classList.remove('notification-success', 'notification-error', 'notification-warning');
    
    // Tambah kelas sesuai jenis notifikasi
    if (type === 'success') {
        notification.classList.add('notification-success');
    } else if (type === 'error') {
        notification.classList.add('notification-error');
    } else if (type === 'warning') {
        notification.classList.add('notification-warning');
    }
    
    // Tampilkan notifikasi
    notification.classList.add('show');
    
    // Sembunyikan setelah 3 detik
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Fungsi untuk memuat data dari Firebase
function loadInventoryData() {
    inventoryTableBody.innerHTML = `
        <tr>
            <td colspan="6" class="loading">
                <div class="loading-spinner"></div>
                <p>Memuat data inventory...</p>
            </td>
        </tr>
    `;
    
    inventoryCollection.orderBy('createdAt', 'desc').onSnapshot((snapshot) => {
        inventoryData = [];
        let foodCount = 0;
        let drinkCount = 0;
        let kitchenCount = 0;
        let lowStockCount = 0;
        
        snapshot.forEach(doc => {
            const item = {
                id: doc.id,
                ...doc.data()
            };
            inventoryData.push(item);
            
            // Hitung statistik
            if (item.category === 'food') foodCount++;
            if (item.category === 'drink') drinkCount++;
            if (item.category === 'kitchen') kitchenCount++;
            if (item.quantity < item.minStock) lowStockCount++;
        });
        
        // Perbarui statistik
        totalItemsEl.textContent = inventoryData.length;
        lowStockEl.textContent = lowStockCount;
        categoriesCountEl.textContent = 3; // Selalu 3 kategori
        
        // Perbarui ringkasan
        summaryFoodEl.textContent = `${foodCount} item`;
        summaryDrinkEl.textContent = `${drinkCount} item`;
        summaryKitchenEl.textContent = `${kitchenCount} item`;
        summaryLowEl.textContent = `${lowStockCount} item`;
        summaryTotalEl.textContent = `${inventoryData.length} item`;
        
        // Tampilkan data di tabel
        renderInventoryTable();
    }, (error) => {
        console.error("Error loading inventory data: ", error);
        showNotification("Gagal memuat data inventory", "error");
    });
}

// Fungsi untuk merender tabel inventory
function renderInventoryTable() {
    if (inventoryData.length === 0) {
        inventoryTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-state">
                    <i class="fas fa-box-open"></i>
                    <h3>Inventory Kosong</h3>
                    <p>Tambah item baru untuk mengelola stok dapur Anda</p>
                </td>
            </tr>
        `;
        return;
    }
    
    // Filter data berdasarkan filter aktif
    let filteredData = inventoryData;
    
    if (currentFilter !== 'all') {
        if (currentFilter === 'low') {
            filteredData = inventoryData.filter(item => item.quantity < item.minStock);
        } else {
            filteredData = inventoryData.filter(item => item.category === currentFilter);
        }
    }
    
    // Buat baris tabel
    let tableRows = '';
    
    filteredData.forEach(item => {
        const isLowStock = item.quantity < item.minStock;
        const stockClass = isLowStock ? 'stock-low' : 'stock-ok';
        
        // Tentukan kategori badge
        let categoryBadge = '';
        if (item.category === 'food') {
            categoryBadge = '<span class="category-badge category-food">Makanan</span>';
        } else if (item.category === 'drink') {
            categoryBadge = '<span class="category-badge category-drink">Minuman</span>';
        } else if (item.category === 'kitchen') {
            categoryBadge = '<span class="category-badge category-kitchen">Dapur</span>';
        }
        
        tableRows += `
            <tr>
                <td>${item.name}</td>
                <td>${categoryBadge}</td>
                <td class="${stockClass}">${item.quantity} / ${item.minStock}</td>
                <td>${item.unit}</td>
                <td>${item.location || '-'}</td>
                <td class="actions">
                    <button class="btn btn-small btn-warning edit-btn" data-id="${item.id}">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-small btn-danger delete-btn" data-id="${item.id}">
                        <i class="fas fa-trash"></i> Hapus
                    </button>
                </td>
            </tr>
        `;
    });
    
    inventoryTableBody.innerHTML = tableRows;
    
    // Tambah event listener untuk tombol edit dan hapus
    document.querySelectorAll('.edit-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const itemId = e.currentTarget.getAttribute('data-id');
            editItem(itemId);
        });
    });
    
    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const itemId = e.currentTarget.getAttribute('data-id');
            deleteItem(itemId);
        });
    });
}

// Fungsi untuk menambah atau memperbarui item
itemForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Validasi input
    if (!itemName.value.trim() || !itemCategory.value || !itemQuantity.value || !itemUnit.value.trim() || !itemMinStock.value) {
        showNotification('Harap isi semua bidang yang diperlukan', 'warning');
        return;
    }
    
    const itemData = {
        name: itemName.value.trim(),
        category: itemCategory.value,
        quantity: parseInt(itemQuantity.value),
        unit: itemUnit.value.trim(),
        minStock: parseInt(itemMinStock.value),
        location: itemLocation.value.trim(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    try {
        if (itemId.value) {
            // Update item yang sudah ada
            await inventoryCollection.doc(itemId.value).update(itemData);
            showNotification('Item berhasil diperbarui!', 'success');
        } else {
            // Tambah item baru
            itemData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            await inventoryCollection.add(itemData);
            showNotification('Item berhasil ditambahkan!', 'success');
        }
        
        // Reset form
        resetForm();
    } catch (error) {
        console.error("Error saving item: ", error);
        showNotification('Gagal menyimpan item', 'error');
    }
});

// Fungsi untuk mengedit item
function editItem(id) {
    const item = inventoryData.find(item => item.id === id);
    
    if (item) {
        itemName.value = item.name;
        itemCategory.value = item.category;
        itemQuantity.value = item.quantity;
        itemUnit.value = item.unit;
        itemMinStock.value = item.minStock;
        itemLocation.value = item.location || '';
        itemId.value = item.id;
        
        // Ubah tombol submit
        const submitButton = itemForm.querySelector('button[type="submit"]');
        submitButton.innerHTML = '<i class="fas fa-sync-alt"></i> Perbarui Item';
        submitButton.classList.remove('btn-primary');
        submitButton.classList.add('btn-success');
        
        // Tampilkan tombol batal
        cancelEdit.style.display = 'inline-flex';
        
        // Scroll ke form
        itemName.focus();
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }
}

// Fungsi untuk menghapus item
async function deleteItem(id) {
    if (!confirm('Apakah Anda yakin ingin menghapus item ini?')) {
        return;
    }
    
    try {
        await inventoryCollection.doc(id).delete();
        showNotification('Item berhasil dihapus!', 'success');
    } catch (error) {
        console.error("Error deleting item: ", error);
        showNotification('Gagal menghapus item', 'error');
    }
}

// Fungsi untuk mereset form
function resetForm() {
    itemForm.reset();
    itemId.value = '';
    
    // Kembalikan tombol submit ke kondisi awal
    const submitButton = itemForm.querySelector('button[type="submit"]');
    submitButton.innerHTML = '<i class="fas fa-save"></i> Simpan Item';
    submitButton.classList.remove('btn-success');
    submitButton.classList.add('btn-primary');
    
    // Sembunyikan tombol batal
    cancelEdit.style.display = 'none';
}

// Event listener untuk tombol batal edit
cancelEdit.addEventListener('click', resetForm);

// Event listener untuk filter
filterButtons.forEach(button => {
    button.addEventListener('click', () => {
        // Hapus kelas aktif dari semua tombol
        filterButtons.forEach(btn => btn.classList.remove('active'));
        
        // Tambah kelas aktif ke tombol yang diklik
        button.classList.add('active');
        
        // Atur filter aktif
        currentFilter = button.getAttribute('data-filter');
        
        // Render ulang tabel
        renderInventoryTable();
    });
});

// Fungsi untuk menginisialisasi data contoh (hanya untuk pengembangan)
async function initializeSampleData() {
    // Cek apakah sudah ada data
    const snapshot = await inventoryCollection.get();
    
    if (snapshot.empty) {
        // Tambah data contoh jika database kosong
        const sampleItems = [
            {
                name: "Tepung Terigu",
                category: "food",
                quantity: 5,
                unit: "kg",
                minStock: 3,
                location: "Lemari 1",
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            },
            {
                name: "Minyak Goreng",
                category: "kitchen",
                quantity: 2,
                unit: "liter",
                minStock: 3,
                location: "Rak 2",
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            },
            {
                name: "Susu UHT",
                category: "drink",
                quantity: 10,
                unit: "kotak",
                minStock: 5,
                location: "Kulkas",
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            },
            {
                name: "Gula Pasir",
                category: "kitchen",
                quantity: 1,
                unit: "kg",
                minStock: 2,
                location: "Lemari 1",
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            },
            {
                name: "Telur Ayam",
                category: "food",
                quantity: 20,
                unit: "butir",
                minStock: 12,
                location: "Kulkas",
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }
        ];
        
        // Tambah data contoh ke Firebase
        const promises = sampleItems.map(item => inventoryCollection.add(item));
        await Promise.all(promises);
        
        console.log("Data contoh berhasil ditambahkan");
    }
}

// Inisialisasi aplikasi saat halaman dimuat
document.addEventListener('DOMContentLoaded', () => {
    // Untuk pengembangan: hapus komentar baris berikut untuk menambahkan data contoh
    // initializeSampleData();
    
    // Muat data inventory
    loadInventoryData();
    
    // Tampilkan pesan selamat datang
    setTimeout(() => {
        showNotification("Selamat datang di Inventory Dapur! Data dimuat dari Firebase.", "success");
    }, 1000);
});