// The base URL for our backend API
const BACKEND_URL = 'http://127.0.0.1:5000';

/**
 * Displays a temporary notification message on the screen using CSS classes.
 * @param {string} message The message to display.
 * @param {boolean} isError If true, the message will be styled as an error.
 */
function showNotification(message, isError = false) {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.className = `notification ${isError ? 'error' : 'success'}`;
    document.body.appendChild(notification);
    setTimeout(() => notification.classList.add('show'), 10);
    setTimeout(() => {
        notification.classList.remove('show');
        notification.addEventListener('transitionend', () => notification.remove());
    }, 3000);
}

const requestModal = document.getElementById('requestModal');
const closeButton = document.querySelector('.close-button');

function closeModal() {
    if (requestModal) {
        requestModal.style.display = 'none';
        const quantityInput = document.getElementById('request-quantity');
        const messageArea = document.getElementById('modal-message-area');
        const submitButton = document.getElementById('request-form')?.querySelector('button[type="submit"]');
        if(quantityInput) quantityInput.value = '';
        if(messageArea) messageArea.textContent = '';
        if(submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = 'ඉල්ලීම ඉදිරිපත් කරන්න';
        }
    }
}


if (closeButton) {
    closeButton.addEventListener('click', closeModal);
}

window.addEventListener('click', (event) => {
    if (event.target == requestModal) {
        closeModal();
    }
});

document.addEventListener('DOMContentLoaded', function() {

    async function updateUserStatus() {
        
        const userStatusSpan = document.getElementById('user-status');
        if (!userStatusSpan) return;
        try {
            const response = await fetch(`${BACKEND_URL}/api/check_session`, { credentials: 'include' });
            const data = await response.json();
            if (data.logged_in) {
                let userLinks = `
                    <a href="my_requests.html">මගේ ඉල්ලීම්</a> |
                    <a href="messages.html">පණිවිඩ</a> |
                `;
                if (data.user.is_seller) {
                    userLinks += `<a href="seller_dashboard.html">විකුණුම්කරුගේ පුවරුව</a> |`;
                }
                userStatusSpan.innerHTML = `
                    <span class="welcome-text">ආයුබෝවන්, ${data.user.full_name}</span> &nbsp; | &nbsp;
                    ${userLinks}
                    <a href="#" id="logout-btn" style="cursor: pointer;">ඉවත් වන්න</a>
                `;
                document.getElementById('logout-btn').addEventListener('click', async (e) => {
                    e.preventDefault();
                    await fetch(`${BACKEND_URL}/api/logout`, { method: 'POST', credentials: 'include' });
                    localStorage.removeItem('user'); 
                    localStorage.removeItem('pendingRequest'); 
                    window.location.href = 'index.html';
                });
            } else {
                userStatusSpan.innerHTML = `<a href="login.html" class="login-btn">ඇතුල් වන්න</a>`;
            }
        } catch (error) {
            console.error('Error checking session:', error);
            userStatusSpan.innerHTML = `<a href="login.html" class="login-btn">ඇතුල් වන්න</a>`;
        }
    }

    async function loadProducts() {
        const productGrid = document.getElementById('product-grid');
        if (!productGrid) return;

        try {
            const response = await fetch(`${BACKEND_URL}/api/products`, { credentials: 'include' });
            if (!response.ok) throw new Error('Network response was not ok');
            const products = await response.json();
            productGrid.innerHTML = '';

            if (products.length === 0) {
                productGrid.innerHTML = '<p>There are no products to display at the moment.</p>';
                return;
            }

products.forEach(product => {
    const productCard = document.createElement('div');
    productCard.className = 'product-card'; 
    const imageUrl = product.image_url || 'https://placehold.co/600x400/27ae60/FFFFFF?text=Agrilume';

productCard.innerHTML = `
    <img src="${imageUrl}" class="product-image" alt="${product.name}" onerror="this.onerror=null;this.src='https://placehold.co/600x400?text=Image+Error';">
    <div class="product-content">
        
        <h3 class="product-title">${product.name}</h3> 
        
        <p class="product-price">Rs. ${parseFloat(product.price).toFixed(2)}</p>
        
        <p class="product-info">Available: ${product.quantity}</p> 
        
        <button class="btn-product request-btn" data-product-id="${product.id}">
            <i class="fas fa-shopping-basket"></i>
            <span>ඇනවුමක් ඉල්ලන්න</span>
        </button>
        
    </div>
`;
    productGrid.appendChild(productCard);
});
        } catch (error) {
            console.error('Failed to load products:', error);
            productGrid.innerHTML = '<p>Could not load products. Please try again later.</p>';
        }
    }

    document.body.addEventListener('click', function(event) {
        
        const requestButton = event.target.closest('.request-btn');
        if (requestButton) {
            const productId = requestButton.dataset.productId;
            openRequestModal(productId);
        }
    });

    const modal = document.getElementById('requestModal');
    const requestForm = document.getElementById('request-form');

    async function openRequestModal(productId) {

        try {
            const userResponse = await fetch(`${BACKEND_URL}/api/check_session`, { credentials: 'include' });
            const userData = await userResponse.json();
            if (userData.logged_in && userData.user.is_seller) {
                showNotification('විකුණුම්කරුවන්ට ඇණවුම් ඉල්ලා සිටිය නොහැක.', true);
                return; 
            }
        } catch (error) {
           console.error("Error checking seller status:", error);
           
        }

        try {
            const response = await fetch(`${BACKEND_URL}/api/product/${productId}`);
            if (!response.ok) throw new Error('Product not found');
            const product = await response.json();

            const modalProductDetails = document.getElementById('modal-product-details');
            modalProductDetails.innerHTML = `<p><strong>නිෂ්පාදනය:</strong> ${product.name}</p>
                                             <p><strong>පවතින ප්‍රමාණය:</strong> ${product.quantity}</p>`;

            requestForm.dataset.productId = productId;
            requestForm.dataset.availableQuantity = product.quantity;
            modal.style.display = 'block';

        } catch (error) {
            console.error("Error opening modal:", error);
            showNotification("Could not load product details.", true);
        }
    }

    if (requestForm) {
        requestForm.addEventListener('submit', async function(event) {
            event.preventDefault(); 

            const quantityInput = this.querySelector('#request-quantity');
            const submitButton = this.querySelector('button[type="submit"]');
            const messageArea = this.parentElement.querySelector('#modal-message-area');

            quantityInput.classList.remove('input-error');
            submitButton.disabled = false;
            messageArea.textContent = '';

            function parseQuantity(str) {
                if (!str) return 0;
                const numericStr = str.replace(/[^0-9.]/g, '');
                return parseFloat(numericStr) || 0;
            }

            const availableQtyString = this.dataset.availableQuantity;
            const requestedQtyString = quantityInput.value;

            const availableNum = parseQuantity(availableQtyString);
            const requestedNum = parseQuantity(requestedQtyString);

            if (requestedNum <= 0) {
                messageArea.textContent = 'කරුණාකර 0 ට වඩා වැඩි, වලංගු ප්‍රමාණයක් ඇතුළත් කරන්න.';
                messageArea.style.color = 'red';
                quantityInput.classList.add('input-error');
                return;
            }

            if (requestedNum > availableNum) {
                messageArea.textContent = `ඉල්ලූ ප්‍රමාණය (${requestedQtyString}) පවතින ප්‍රමාණයට (${availableQtyString}) වඩා වැඩිය!`;
                messageArea.style.color = 'red';
                quantityInput.classList.add('input-error');
                return;
            }

            const productId = this.dataset.productId;
            const pendingRequest = {
                action: 'pendingRequestAfterModal', 
                productId: productId,
                quantity: requestedQtyString
            };
            localStorage.setItem('pendingRequest', JSON.stringify(pendingRequest));

            submitButton.disabled = true;
            messageArea.textContent = 'ඉල්ලීම සම්පූර්ණ කිරීමට කරුණාකර ලොග් වන්න...';
            messageArea.style.color = 'blue';

            setTimeout(() => {
                 window.location.href = 'login.html';
            }, 1500); 

        });
    }

    updateUserStatus(); 
    loadProducts();     

}); 