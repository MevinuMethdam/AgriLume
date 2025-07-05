// frontend/js/main.js

/**
 * Displays a temporary notification message on the screen.
 * @param {string} message The message to display.
 * @param {boolean} isError If true, the message will be styled as an error.
 */
function showNotification(message, isError = false) {
    const notification = document.createElement('div');
    notification.textContent = message;
    
    // Basic styling for the notification
    notification.style.position = 'fixed';
    notification.style.bottom = '20px';
    notification.style.left = '50%';
    notification.style.transform = 'translateX(-50%)';
    notification.style.padding = '12px 20px';
    notification.style.borderRadius = '8px';
    notification.style.color = 'white';
    notification.style.backgroundColor = isError ? '#e74c3c' : '#2ecc71'; // Red for error, green for success
    notification.style.zIndex = '1000';
    notification.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
    notification.style.transition = 'opacity 0.5s';
    
    document.body.appendChild(notification);
    
    // Fade out and remove the notification after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 500); // Wait for fade out transition to finish
    }, 3000);
}


document.addEventListener('DOMContentLoaded', function() {
    const BACKEND_URL = 'http://127.0.0.1:5000';

    // This function runs on ALL pages to update the navigation bar
    async function updateUserStatus() {
        const userStatusSpan = document.getElementById('user-status');
        if (!userStatusSpan) return;

        try {
            const response = await fetch(`${BACKEND_URL}/api/check_session`, { credentials: 'include' });
            const data = await response.json();

            if (data.logged_in) {
                let userLinks = `
                    <a href="my_requests.html">My Requests</a> |
                    <a href="messages.html">Messages</a> |
                `;
                if (data.user.is_seller) {
                    userLinks += `<a href="seller_dashboard.html">Seller Dashboard</a> |`;
                }
                userStatusSpan.innerHTML = `
                    <span style="color: #333;">Welcome, ${data.user.full_name}</span> &nbsp; | &nbsp;
                    ${userLinks}
                    <a href="#" id="logout-btn" style="cursor: pointer;">Logout</a>
                `;
                document.getElementById('logout-btn').addEventListener('click', async (e) => {
                    e.preventDefault();
                    await fetch(`${BACKEND_URL}/api/logout`, { method: 'POST', credentials: 'include' });
                    localStorage.removeItem('user');
                    window.location.href = 'index.html';
                });
            } else {
                userStatusSpan.innerHTML = `<a href="login.html">Login</a>`;
            }
        } catch (error) {
            console.error('Error checking session:', error);
            userStatusSpan.innerHTML = `<a href="login.html">Login</a>`;
        }
    }

    // This function ONLY runs on pages with a product grid (like index.html)
    async function loadProducts() {
        const productGrid = document.getElementById('product-grid');
        if (!productGrid) return;

        try {
            const response = await fetch(`${BACKEND_URL}/api/products`);
            if (!response.ok) throw new Error('Network response was not ok');
            const products = await response.json();
            productGrid.innerHTML = '';
            products.forEach(product => {
                const productCard = document.createElement('div');
                productCard.className = 'product-card';
                const imageUrl = product.image_url || 'https://placehold.co/600x400/27ae60/FFFFFF?text=Agrilume';
                productCard.innerHTML = `
                    <img src="${imageUrl}" alt="${product.name}" onerror="this.onerror=null;this.src='https://placehold.co/600x400?text=Image+Error';">
                    <h3>${product.name}</h3>
                    <p class="price">Price: Rs. ${parseFloat(product.price).toFixed(2)}</p>
                    <p class="quantity">Available: ${product.quantity}</p>
                    <p class="date">Last Updated: ${new Date(product.updated_at).toLocaleDateString()}</p>
                    <button onclick="requestProduct(${product.id})">Request Order</button>
                `;
                productGrid.appendChild(productCard);
            });
        } catch (error) {
            console.error('Failed to load products:', error);
            productGrid.innerHTML = '<p>Could not load products. Please try again later.</p>';
        }
    }

    // --- Run functions when the page loads ---
    updateUserStatus();
    loadProducts();
});

// This global function is for the "Request Order" button on the product cards
async function requestProduct(productId) {
    const user = localStorage.getItem('user');
    if (!user) {
        showNotification('Please log in to request an order.', true);
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);
        return;
    }

    const modal = document.getElementById('requestModal');
    const closeBtn = document.querySelector('.close-button');
    const modalDetails = document.getElementById('modal-product-details');
    const requestForm = document.getElementById('request-form');
    const messageArea = document.getElementById('modal-message-area');
    const BACKEND_URL = 'http://127.0.0.1:5000';

    try {
        // --- IMPROVEMENT: Fetch only the specific product, not the whole list ---
        const response = await fetch(`${BACKEND_URL}/api/product/${productId}`);
        if (!response.ok) {
            throw new Error('Product not found');
        }
        const product = await response.json();

        modalDetails.innerHTML = `<h4>${product.name}</h4><p>Price: Rs. ${parseFloat(product.price).toFixed(2)}</p>`;
        modal.style.display = 'block';

        closeBtn.onclick = () => { modal.style.display = 'none'; if(messageArea) messageArea.textContent = ''; };
        window.onclick = (event) => {
            if (event.target == modal) {
                modal.style.display = 'none';
                if(messageArea) messageArea.textContent = '';
            }
        };

        requestForm.onsubmit = async (e) => {
            e.preventDefault();
            const requestedQuantity = document.getElementById('request-quantity').value;
            const requestData = { product_id: productId, quantity: requestedQuantity };
            try {
                const reqResponse = await fetch(`${BACKEND_URL}/api/requests/add`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(requestData),
                    credentials: 'include',
                });
                const result = await reqResponse.json();
                messageArea.textContent = result.message;
                if (reqResponse.ok) {
                    messageArea.style.color = 'green';
                    requestForm.reset();
                    setTimeout(() => { modal.style.display = 'none'; messageArea.textContent = ''; }, 2000);
                } else {
                    messageArea.style.color = 'red';
                }
            } catch (error) {
                messageArea.textContent = 'An error occurred. Please try again.';
                messageArea.style.color = 'red';
            }
        };
    } catch (error) {
        console.error("Error in requestProduct:", error);
        showNotification("Could not process the request. Please try again.", true);
    }
}

