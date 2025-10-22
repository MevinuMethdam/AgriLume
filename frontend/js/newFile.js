document.addEventListener('DOMContentLoaded', function () {
    const BACKEND_URL = 'http://127.0.0.1:5000';

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
                productGrid.innerHTML = '<p>තවම කිසිදු නිෂ්පාදනයක් එකතු කර නොමැත.</p>';
                return;
            }

            products.forEach(product => {
                const productCard = document.createElement('div');
                productCard.className = 'product-card'; 

                const imageUrl = product.image_url ? `${product.image_url}` : 'https://placehold.co/600x400/27ae60/FFFFFF?text=Agrilume';

                productCard.innerHTML = `
                <img src="${imageUrl}" alt="${product.name}" class="product-image" onerror="this.onerror=null;this.src='https://placehold.co/600x400?text=Image+Error';">
                <div class="product-content">
                    <h3 class="product-title">${product.name}</h3>
                    <div class="product-details">
                        <p class="product-price"><strong>මිල:</strong> රු. ${parseFloat(product.price).toFixed(2)}</p>
                        <p class="product-quantity"><strong>ප්‍රමාණය:</strong> ${product.quantity}</p>
                    </div>
                    <p class="product-updated-date"><em>යාවත්කාලීන කළේ: ${new Date(product.updated_at).toLocaleDateString('si-LK')}</em></p>
                    <button class="btn-product request-btn" data-product-id="${product.id}">ඇනවුමක් ඉල්ලන්න</button>
                </div>
            `;
                productGrid.appendChild(productCard);
            });
        } catch (error) {
            console.error('Failed to load products:', error);
            productGrid.innerHTML = '<p>නිෂ්පාදන ගෙන ඒමට නොහැකි විය. කරුණාකර පසුව උත්සහ කරන්න.</p>';
        }
    }

    updateUserStatus();
    loadProducts(); 
});
