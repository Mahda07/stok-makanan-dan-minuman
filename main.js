// Array untuk menyimpan data stok
let stock = JSON.parse(localStorage.getItem('stock')) || [];

// Fungsi untuk render tabel
function renderTable() {
    const tbody = document.getElementById('stockBody');
    tbody.innerHTML = '';
    stock.forEach((item, index) => {
        const total = item.quantity * item.price;
        const row = document.createElement('tr');
        row.classList.add('fade-in');
        row.innerHTML = `
            <td>${item.name}</td>
            <td><span class="badge bg-${item.category === 'Makanan' ? 'success' : item.category === 'Minuman' ? 'primary' : 'warning'}">${item.category}</span></td>
            <td>${item.quantity}</td>
            <td>Rp ${item.price.toLocaleString()}</td>
            <td>Rp ${total.toLocaleString()}</td>
            <td>
                <button class="btn btn-sm btn-warning me-2" onclick="editItem(${index})"><i class="fas fa-edit"></i> Edit</button>
                <button class="btn btn-sm btn-danger" onclick="deleteItem(${index})"><i class="fas fa-trash"></i> Hapus</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Fungsi tambah item (Create)
document.getElementById('itemForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const name = document.getElementById('itemName').value;
    const category = document.getElementById('itemCategory').value;
    const quantity = parseInt(document.getElementById('itemQuantity').value);
    const price = parseFloat(document.getElementById('itemPrice').value);
    
    stock.push({ name, category, quantity, price });
    localStorage.setItem('stock', JSON.stringify(stock));
    renderTable();
    this.reset();
    alert('Item berhasil ditambahkan!');
});

// Fungsi edit item (Update)
function editItem(index) {
    const item = stock[index];
    document.getElementById('itemName').value = item.name;
    document.getElementById('itemCategory').value = item.category;
    document.getElementById('itemQuantity').value = item.quantity;
    document.getElementById('itemPrice').value = item.price;
    
    // Ubah tombol submit menjadi update
    const submitBtn = document.querySelector('#itemForm button[type="submit"]');
    submitBtn.innerHTML = '<i class="fas fa-edit"></i> Update';
    submitBtn.onclick = function() {
        stock[index] = {
            name: document.getElementById('itemName').value,
            category: document.getElementById('itemCategory').value,
            quantity: parseInt(document.getElementById('itemQuantity').value),
            price: parseFloat(document.getElementById('itemPrice').value)
        };
        localStorage.setItem('stock', JSON.stringify(stock));
        renderTable();
        document.getElementById('itemForm').reset();
        submitBtn.innerHTML = '<i class="fas fa-save"></i> Simpan';
        submitBtn.onclick = null; // Reset event
        alert('Item berhasil diupdate!');
    };
}

// Fungsi hapus item (Delete)
function deleteItem(index) {
    if (confirm('Yakin ingin menghapus item ini?')) {
        stock.splice(index, 1);
        localStorage.setItem('stock', JSON.stringify(stock));
        renderTable();
        alert('Item berhasil dihapus!');
    }
}

// Render tabel saat halaman load
renderTable();
