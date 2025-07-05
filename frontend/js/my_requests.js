document.addEventListener('DOMContentLoaded', () => {
    const BACKEND_URL = 'http://127.0.0.1:5000';
    const requestsListDiv = document.getElementById('my-requests-list');

    async function loadMyRequests() {
        if (!requestsListDiv) return;

        try {
            const response = await fetch(`${BACKEND_URL}/api/myrequests`, { credentials: 'include' });

            if (response.status === 401) { // Not logged in
                alert('Please log in to see your requests.');
                window.location.href = 'login.html';
                return;
            }

            if (!response.ok) {
                throw new Error('Failed to fetch your requests.');
            }

            const requests = await response.json();
            requestsListDiv.innerHTML = '';

            if (requests.length === 0) {
                requestsListDiv.innerHTML = '<p>You have not made any requests yet.</p>';
                return;
            }

            const table = document.createElement('table');
            table.innerHTML = `
                <thead>
                    <tr>
                        <th>Product</th>
                        <th>Requested Quantity</th>
                        <th>Date</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody></tbody>
            `;
            const tbody = table.querySelector('tbody');

            requests.forEach(req => {
                const row = tbody.insertRow();
                // Add a class to the status cell for styling
                row.innerHTML = `
                    <td>${req.product_name}</td>
                    <td>${req.requested_quantity}</td>
                    <td>${new Date(req.requested_at).toLocaleString()}</td>
                    <td class="status-${req.status.toLowerCase()}">${req.status}</td>
                `;
            });

            requestsListDiv.appendChild(table);

        } catch (error) {
            console.error('Error loading requests:', error);
            requestsListDiv.innerHTML = `<p style="color:red;">${error.message}</p>`;
        }
    }

    loadMyRequests();
});

