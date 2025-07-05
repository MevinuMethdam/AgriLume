document.addEventListener('DOMContentLoaded', () => {
    const BACKEND_URL = 'http://127.0.0.1:5000';
    const addProductForm = document.getElementById('add-product-form');
    const messageArea = document.getElementById('message-area');
    const productListDiv = document.getElementById('product-list');
    const userStatusSpan = document.getElementById('user-status');
    const requestsListDiv = document.getElementById('incoming-requests-list');

    // --- Edit Modal Elements ---
    const editModal = document.getElementById('editProductModal');
    const editForm = document.getElementById('edit-product-form');
    const editMessageArea = document.getElementById('edit-message-area');
    const closeModalBtn = editModal.querySelector('.close-button');

    async function checkSellerStatus() {
        try {
            const response = await fetch(`${BACKEND_URL}/api/check_session`, { credentials: 'include' });
            const data = await response.json();
            if (!data.logged_in || !data.user.is_seller) {
                alert('You are not authorized to view this page.');
                window.location.href = 'index.html';
            } else {
                userStatusSpan.innerHTML = `<span>Welcome, ${data.user.full_name} (Seller)</span>`;
            }
        } catch (error) {
            console.error('Authorization check failed:', error);
            window.location.href = 'index.html';
        }
    }

    async function loadProducts() {
        try {
            const response = await fetch(`${BACKEND_URL}/api/products`);
            const products = await response.json();
            productListDiv.innerHTML = '';
            if (products.length === 0) {
                productListDiv.innerHTML = '<p>You have not added any products yet.</p>';
                return;
            }
            products.forEach(p => {
                const productItem = document.createElement('div');
                productItem.className = 'product-item';
                const imageUrl = p.image_url ? `<img src="${p.image_url}" alt="${p.name}" width="50" style="vertical-align: middle; margin-right: 10px;">` : '';
                
                productItem.innerHTML = `
                    <div class="product-details">
                        ${imageUrl}
                        <strong>${p.name}</strong> - Price: Rs.${parseFloat(p.price).toFixed(2)} | Quantity: ${p.quantity}
                    </div>
                    <div class="product-actions">
                        <button class="action-btn edit" data-id="${p.id}" data-name="${p.name}" data-price="${p.price}" data-quantity="${p.quantity}">Edit</button>
                        <button class="action-btn reject" data-id="${p.id}">Delete</button>
                    </div>
                `;
                productListDiv.appendChild(productItem);
            });
        } catch (error) {
            console.error('Failed to load products:', error);
            productListDiv.innerHTML = '<p>Could not load your products.</p>';
        }
    }

    // --- UPDATED AND COMPLETED loadRequests function ---
    async function loadRequests() {
        if (!requestsListDiv) return;
        try {
            const response = await fetch(`${BACKEND_URL}/api/requests`, { credentials: 'include' });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch requests');
            }
            const requests = await response.json();
            requestsListDiv.innerHTML = '';
            if (requests.length === 0) {
                requestsListDiv.innerHTML = '<p>No incoming requests yet.</p>';
                return;
            }
            const table = document.createElement('table');
            table.innerHTML = `
                <thead>
                    <tr>
                        <th>Buyer Name</th>
                        <th>Contact</th>
                        <th>Product</th>
                        <th>Requested Qty</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody></tbody>
            `;
            const tbody = table.querySelector('tbody');
            requests.forEach(req => {
                const row = tbody.insertRow();
                row.innerHTML = `
                    <td>${req.buyer_name}</td>
                    <td>${req.buyer_contact}</td>
                    <td>${req.product_name}</td>
                    <td>${req.requested_quantity}</td>
                    <td>${new Date(req.requested_at).toLocaleString()}</td>
                    <td><strong>${req.status}</strong></td>
                    <td>
                        ${req.status === 'Pending' ? `
                        <button class="action-btn confirm" data-id="${req.request_id}">Confirm</button>
                        <button class="action-btn reject" data-id="${req.request_id}">Reject</button>
                        ` : `<span>-</span>`}
                    </td>
                `;
            });
            requestsListDiv.appendChild(table);
        } catch (error) {
            console.error('Failed to load requests:', error);
            requestsListDiv.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
        }
    }

    // --- Event Listeners ---

    // Listener for Product List actions (Edit and Delete)
    productListDiv.addEventListener('click', async (e) => {
        const target = e.target;
        const productId = target.dataset.id;

        // Handle DELETE action
        if (target.classList.contains('reject')) {
            if (!confirm('Are you sure you want to permanently delete this product?')) return;
            try {
                const response = await fetch(`${BACKEND_URL}/api/products/delete/${productId}`, {
                    method: 'DELETE',
                    credentials: 'include'
                });
                const result = await response.json();
                alert(result.message);
                if (response.ok) loadProducts();
            } catch (error) {
                alert('An error occurred while deleting.');
            }
        }

        // Handle EDIT action
        if (target.classList.contains('edit')) {
            document.getElementById('edit-product-id').value = productId;
            document.getElementById('edit-name').value = target.dataset.name;
            document.getElementById('edit-price').value = target.dataset.price;
            document.getElementById('edit-quantity').value = target.dataset.quantity;
            editModal.style.display = 'block';
        }
    });

    // Listener for closing the Edit Modal
    closeModalBtn.onclick = () => { editModal.style.display = 'none'; };
    window.onclick = (event) => {
        if (event.target == editModal) {
            editModal.style.display = 'none';
        }
    };

    // Listener for submitting the Edit Form
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
                setTimeout(() => {
                    editModal.style.display = 'none';
                    editMessageArea.textContent = '';
                    loadProducts();
                }, 1500);
            } else {
                editMessageArea.style.color = 'red';
            }
        } catch (error) {
            editMessageArea.textContent = 'An error occurred.';
            editMessageArea.style.color = 'red';
        }
    });

    // Listener for Request List actions (Confirm/Reject)
    requestsListDiv.addEventListener('click', async (e) => {
        if (e.target.classList.contains('action-btn')) {
            const requestId = e.target.dataset.id;
            const newStatus = e.target.classList.contains('confirm') ? 'Confirmed' : 'Rejected';
            try {
                const response = await fetch(`${BACKEND_URL}/api/requests/update/${requestId}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: newStatus }),
                    credentials: 'include'
                });
                if (response.ok) loadRequests();
                else {
                    const errorData = await response.json();
                    alert(`Error: ${errorData.message}`);
                }
            } catch (error) {
                alert('An error occurred while updating the status.');
            }
        }
    });

    // Listener for Add Product Form
    addProductForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('name', document.getElementById('name').value);
        formData.append('price', document.getElementById('price').value);
        formData.append('quantity', document.getElementById('quantity').value);
        const imageFile = document.getElementById('image').files[0];
        if (!imageFile) {
            messageArea.textContent = 'Please select an image file.';
            messageArea.style.color = 'red';
            return;
        }
        formData.append('image', imageFile);
        messageArea.textContent = 'Uploading...';
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
            } else {
                messageArea.style.color = 'red';
            }
        } catch (error) {
            messageArea.textContent = 'An error occurred during upload.';
            messageArea.style.color = 'red';
        }
    });

    // --- Initial setup ---
    checkSellerStatus();
    loadProducts();
    loadRequests();
});
