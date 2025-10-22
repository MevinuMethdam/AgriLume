// frontend/js/my_requests.js

document.addEventListener('DOMContentLoaded', () => {
    const BACKEND_URL = 'http://127.0.0.1:5000';
    const requestsListDiv = document.getElementById('my-requests-list');

    async function loadMyRequests(showWelcome = false) {
        if (!requestsListDiv) return;

        try {
            const response = await fetch(`${BACKEND_URL}/api/myrequests`, { credentials: 'include' });

            if (response.status === 401) { 
                if (typeof showNotification !== 'undefined') {
                    showNotification('ඇණවුම් බැලීමට කරුණාකර පිවිසෙන්න.', true);
                } else {
                    alert('ඇණවුම් බැලීමට කරුණාකර පිවිසෙන්න.');
                }
                setTimeout(() => { window.location.href = 'login.html'; }, 1500);
                return;
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.message || 'ඔබගේ ඉල්ලීම් ලබා ගැනීමට අසමත් විය.';
                throw new Error(errorMessage);
            }

            const requests = await response.json();
            requestsListDiv.innerHTML = '';

            if (showWelcome && typeof showNotification !== 'undefined') {
                showNotification('ආයුබෝවන්! ඔබගේ ඇනවුම් ඉල්ලීම් ලබා ගන්නා ලදී.');
            }

            if (requests.length === 0) {
                requestsListDiv.innerHTML = '<p>ඔබ තවම කිසිදු ඉල්ලීමක් කර නොමැත.</p>';
                return;
            }

            const table = document.createElement('table');
            table.classList.add('fade-in');
            table.innerHTML = `
                <thead>
                    <tr>
                        <th>නිෂ්පාදනය</th>
                        <th>ඉල්ලූ ප්‍රමාණය</th>
                        <th>දිනය</th>
                        <th>තත්ත්වය</th>
                        <th>රූපය</th>
                    </tr>
                </thead>
                <tbody></tbody>
            `;
            const tbody = table.querySelector('tbody');

            requests.forEach(req => {
                const row = tbody.insertRow();
                const imageUrl = req.product_image_url && req.product_image_url.trim() !== ''
                    ? req.product_image_url
                    : 'https://placehold.co/50x50?text=No+Img';

                row.innerHTML = `
                    <td>${req.product_name}</td>
                    <td>${req.requested_quantity}</td>
                    <td>${new Date(req.requested_at).toLocaleString('si-LK', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })}</td>
                    <td class="status-${req.status.toLowerCase()}">${req.status}</td>
                    <td><img src="${imageUrl}" alt="${req.product_name}" 
                        style="width: 50px; height: 50px; object-fit: cover; border-radius: 5px;"></td>
                `;
            });

            requestsListDiv.appendChild(table);

        } catch (error) {
            console.error('Error loading requests:', error);
            requestsListDiv.innerHTML = `<p style="color:red;">දෝෂයක් සිදුවිය: ${error.message}</p>`;
            if (typeof showNotification !== 'undefined') {
                showNotification(`ඉල්ලීම් ලබා ගැනීමට නොහැකි විය: ${error.message}`, true);
            }
        }
    }

    loadMyRequests(true);
});
