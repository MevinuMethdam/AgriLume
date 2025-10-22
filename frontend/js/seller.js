// frontend/js/seller.js

document.addEventListener('DOMContentLoaded', () => {
    const BACKEND_URL = 'http://127.0.0.1:5000';
    const addProductForm = document.getElementById('add-product-form');
    const messageArea = document.getElementById('message-area');
    const productListDiv = document.getElementById('product-list');
    const userStatusSpan = document.getElementById('user-status'); 
    const requestsListDiv = document.getElementById('incoming-requests-list');

    const editModal = document.getElementById('editProductModal');
    const editForm = document.getElementById('edit-product-form');
    const editMessageArea = document.getElementById('edit-message-area');
    const closeModalBtn = editModal.querySelector('.close-button');

function showSellerNotification(message, isError = false) {
    if (typeof showNotification === 'function') {
        showNotification(message, isError);
    } else {  
        console.error('showNotification function is not available. Message:', message);
    }
}

    async function checkSellerStatus() {
        try {
            const response = await fetch(`${BACKEND_URL}/api/check_session`, { credentials: 'include' });
            const data = await response.json();
            if (!data.logged_in || !data.user.is_seller) {
                showSellerNotification('ඔබට මෙම පිටුව බැලීමට අවසර නැත.', true);
                setTimeout(() => { window.location.href = 'index.html'; }, 1500);
            } else {
                
            }
        } catch (error) {
            console.error('Authorization check failed:', error);
            showSellerNotification('අවසර පරීක්ෂාව අසාර්ථක විය. කරුණාකර නැවත පිවිසෙන්න.', true);
            setTimeout(() => { window.location.href = 'login.html'; }, 1500); 
        }
    }

    async function loadProducts() {
        try {
            const response = await fetch(`${BACKEND_URL}/api/products`, { credentials: 'include' });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'නිෂ්පාදන ලබා ගැනීමට අසමත් විය.');
            }
            const products = await response.json();
            productListDiv.innerHTML = '';
            if (products.length === 0) {
                productListDiv.innerHTML = '<p>ඔබ තවම කිසිදු නිෂ්පාදනයක් එකතු කර නොමැත.</p>'; 
                return;
            }
            products.forEach(p => {
                const productItem = document.createElement('div');
                productItem.className = 'product-item';
                const imageUrl = p.image_url ? `${p.image_url}` : 'https://placehold.co/50x50?text=No+Img';
                
                productItem.innerHTML = `
                    <div class="product-details">
                        <img src="${imageUrl}" alt="${p.name}" width="50" height="50" style="vertical-align: middle; margin-right: 10px; border-radius: 5px; object-fit: cover;">
                        <strong>${p.name}</strong> - මිල: රු.${parseFloat(p.price).toFixed(2)} | ප්‍රමාණය: ${p.quantity}
                    </div>
                    <div class="product-actions">
                        <button class="action-btn edit" data-id="${p.id}" data-name="${p.name}" data-price="${p.price}" data-quantity="${p.quantity}">සංස්කරණය කරන්න</button>
                        <button class="action-btn reject" data-id="${p.id}">මකන්න</button>
                    </div>
                `;
                productListDiv.appendChild(productItem);
            });
        } catch (error) {
            console.error('Failed to load products:', error);
            productListDiv.innerHTML = `<p style="color: red;">නිෂ්පාදන ගෙන ඒමට නොහැකි විය: ${error.message}</p>`; 
            showSellerNotification(`නිෂ්පාදන ගෙන ඒමට නොහැකි විය: ${error.message}`, true); 
        }
    }

    async function loadRequests() {
        if (!requestsListDiv) return;
        try {
            const response = await fetch(`${BACKEND_URL}/api/requests`, { credentials: 'include' });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'ඉල්ලීම් ලබා ගැනීමට අසමත් විය'); 
            }
            const requests = await response.json();
            requestsListDiv.innerHTML = '';
            if (requests.length === 0) {
                requestsListDiv.innerHTML = '<p>තවම පැමිණි ඉල්ලීම් නොමැත.</p>'; 
                return;
            }
            const table = document.createElement('table');
            table.innerHTML = `
                <thead>
                    <tr>
                        <th>ගැනුම්කරුගේ නම</th>
                        <th>දුරකථන අංකය</th>
                        <th>නිෂ්පාදනය</th>
                        <th>ඉල්ලූ ප්‍රමාණය</th>
                        <th>දිනය</th>
                        <th>තත්ත්වය</th>
                        <th>ක්‍රියා</th>
                        <th>රූපය</th> </tr>
                </thead>
                <tbody></tbody>
            `;
            const tbody = table.querySelector('tbody');
            requests.forEach(req => {
                const row = tbody.insertRow();
                
                const productImageUrl = req.product_image_url ? `${req.product_image_url}` : 'https://placehold.co/50x50?text=No+Img';

                row.innerHTML = `
                    <td>${req.buyer_name}</td>
                    <td>${req.buyer_contact}</td>
                    <td>${req.product_name}</td>
                    <td>${req.requested_quantity}</td>
                    <td>${new Date(req.requested_at).toLocaleString('si-LK', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                    <td><strong>${req.status}</strong></td>
                    <td>
                        ${req.status === 'Pending' ? `
                        <button class="action-btn confirm" data-id="${req.request_id}">තහවුරු කරන්න</button>
                        <button class="action-btn reject" data-id="${req.request_id}">ප්‍රතික්ෂේප කරන්න</button>
                        ` : `<span>-</span>`}
                    </td>
                    <td><img src="${productImageUrl}" alt="${req.product_name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 5px;"></td>
                `;
            });
            requestsListDiv.appendChild(table);
        } catch (error) {
            console.error('Failed to load requests:', error);
            requestsListDiv.innerHTML = `<p style="color: red;">දෝෂයක්: ${error.message}</p>`;
            showSellerNotification(`ඉල්ලීම් ලබා ගැනීමට නොහැකි විය: ${error.message}`, true); 
        }
    }

    productListDiv.addEventListener('click', async (e) => {
        const target = e.target;
        const productId = target.dataset.id;

        if (target.classList.contains('reject')) { 
            if (!confirm('ඔබට මෙම නිෂ්පාදනය ස්ථිරවම මකා දැමීමට අවශ්‍ය බව සහතිකද?')) return; 
            try {
                const response = await fetch(`${BACKEND_URL}/api/products/delete/${productId}`, {
                    method: 'DELETE',
                    credentials: 'include'
                });
                const result = await response.json();
                showSellerNotification(result.message, !response.ok); 
                if (response.ok) loadProducts();
            } catch (error) {
                console.error('Error deleting product:', error);
                showSellerNotification('මකා දැමීමේදී දෝෂයක් සිදුවිය.', true); 
            }
        }

        if (target.classList.contains('edit')) {
            document.getElementById('edit-product-id').value = productId;
            document.getElementById('edit-name').value = target.dataset.name;
            document.getElementById('edit-price').value = target.dataset.price;
            document.getElementById('edit-quantity').value = target.dataset.quantity;
            editModal.style.display = 'block';
            editMessageArea.textContent = ''; 
        }
    });

    closeModalBtn.onclick = () => { editModal.style.display = 'none'; };
    window.onclick = (event) => {
        if (event.target == editModal) {
            editModal.style.display = 'none';
        }
    };

    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const productId = document.getElementById('edit-product-id').value;
        const updatedData = {
            name: document.getElementById('edit-name').value,
            price: document.getElementById('edit-price').value,
            quantity: document.getElementById('edit-quantity').value,
        };

        try {
            const response = await fetch(`${BACKEND_URL}/api/products/update/${productId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedData),
                credentials: 'include'
            });
            const result = await response.json();
            editMessageArea.textContent = result.message;
            if (response.ok) {
                editMessageArea.style.color = 'green';
                showSellerNotification('නිෂ්පාදනය සාර්ථකව යාවත්කාලීන කරන ලදී.', false); 
                setTimeout(() => {
                    editModal.style.display = 'none';
                    editMessageArea.textContent = '';
                    loadProducts();
                }, 1500);
            } else {
                editMessageArea.style.color = 'red';
                showSellerNotification(result.message || 'නිෂ්පාදනය යාවත්කාලීන කිරීමේදී දෝෂයක් සිදුවිය.', true); 
            }
        } catch (error) {
            console.error('Error updating product:', error);
            editMessageArea.textContent = 'දෝෂයක් ඇතිවිය.'; 
            editMessageArea.style.color = 'red';
            showSellerNotification('නිෂ්පාදනය යාවත්කාලීන කිරීමේදී දෝෂයක් සිදුවිය.', true); 
        }
    });

    
    requestsListDiv.addEventListener('click', async (e) => {
        const target = e.target;
        if (target.classList.contains('action-btn')) {
            const requestId = target.dataset.id;
            const newStatus = target.classList.contains('confirm') ? 'Confirmed' : 'Rejected';
            
            if (!confirm(`ඔබට මෙම ඉල්ලීම "${newStatus === 'Confirmed' ? 'තහවුරු' : 'ප්‍රතික්ෂේප'}" කිරීමට අවශ්‍ය බව සහතිකද?`)) { // Translated confirmation
                return;
            }

            try {
                const response = await fetch(`${BACKEND_URL}/api/requests/update/${requestId}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: newStatus }),
                    credentials: 'include'
                });
                if (response.ok) {
                    showSellerNotification(`ඉල්ලීම ${requestId} සාර්ථකව ${newStatus === 'Confirmed' ? 'තහවුරු කරන ලදී.' : 'ප්‍රතික්ෂේප කරන ලදී.'}`, false); // Translated
                    loadRequests(); 
                    loadProducts(); 
                } else {
                    const errorData = await response.json();
                    showSellerNotification(`දෝෂයක්: ${errorData.message}`, true); 
                }
            } catch (error) {
                console.error('Error updating request status:', error);
                showSellerNotification('තත්ත්වය යාවත්කාලීන කිරීමේදී දෝෂයක් සිදුවිය.', true); 
            }
        }
    });

    addProductForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('name', document.getElementById('name').value);
        formData.append('price', document.getElementById('price').value);
        formData.append('quantity', document.getElementById('quantity').value);
        const imageFile = document.getElementById('image').files[0];
        if (!imageFile) {
            messageArea.textContent = 'කරුණාකර රූප ගොනුවක් තෝරන්න.'; 
            messageArea.style.color = 'red';
            return;
        }
        formData.append('image', imageFile);
        messageArea.textContent = 'උඩුගත කරමින් පවතී...'; 
        messageArea.style.color = 'blue';
        try {
            const response = await fetch(`${BACKEND_URL}/api/products/add`, {
                method: 'POST',
                body: formData,
                credentials: 'include',
            });
            const result = await response.json();
            messageArea.textContent = result.message;
            if (response.ok) {
                messageArea.style.color = 'green';
                addProductForm.reset();
                loadProducts();
                showSellerNotification(`නිෂ්පාදනය '${document.getElementById('name').value}' සාර්ථකව එකතු කරන ලදී.`, false); 
            } else {
                messageArea.style.color = 'red';
                showSellerNotification(result.message || 'නිෂ්පාදනය එකතු කිරීමේදී දෝෂයක් සිදුවිය.', true); 
            }
        } catch (error) {
            console.error('Error adding product:', error);
            messageArea.textContent = 'උඩුගත කිරීමේදී දෝෂයක් සිදුවිය.'; 
            messageArea.style.color = 'red';
            showSellerNotification('නිෂ්පාදනය එකතු කිරීමේදී දෝෂයක් සිදුවිය.', true); 
        }
    });

    checkSellerStatus();
    loadProducts();
    loadRequests();
});