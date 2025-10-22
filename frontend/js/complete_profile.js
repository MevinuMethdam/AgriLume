// frontend/js/complete_profile.js

const BACKEND_URL = 'http://127.0.0.1:5000';

function showNotification(message, isError = false) {
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
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

document.addEventListener('DOMContentLoaded', () => {
    const profileForm = document.getElementById('complete-profile-form');
    const messageArea = document.getElementById('message-area');
    const phoneInput = document.getElementById('phone_number');
    const addressInput = document.getElementById('address');
    const submitButton = profileForm.querySelector('button[type="submit"]');

    if (!profileForm) {
        console.error('Profile form not found!');
        return;
    }

    const currentUserJSON = localStorage.getItem('user');
    if (currentUserJSON) {
        try {
            const currentUser = JSON.parse(currentUserJSON);
            
            if (currentUser.phone_number && currentUser.phone_number !== "0000000000") {
                phoneInput.value = currentUser.phone_number;
            }
            if (currentUser.address && currentUser.address !== "Not Provided") {
                addressInput.value = currentUser.address;
            }
        } catch (e) {
            console.error("Error parsing user data from localStorage", e);
        }
    }


    profileForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        messageArea.textContent = ''; 
        submitButton.disabled = true; 

        const phoneValue = phoneInput.value.trim();
        const addressValue = addressInput.value.trim();

        const phonePattern = /^[0-9]{10}$/;
        if (!phoneValue || !phonePattern.test(phoneValue)) {
            messageArea.textContent = 'Please enter a valid 10-digit phone number.';
            messageArea.style.color = '#ffcdd2'; 
            phoneInput.focus();
            submitButton.disabled = false; 
            return;
        }

        if (!addressValue) {
            messageArea.textContent = 'Please enter your address.';
            messageArea.style.color = '#ffcdd2';
            addressInput.focus();
            submitButton.disabled = false; 
            return;
        }

        // Send data to backend 
        messageArea.textContent = 'Updating profile...';
        messageArea.style.color = 'lightblue';

        try {
            const response = await fetch(`${BACKEND_URL}/api/update-profile`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone_number: phoneValue,
                    address: addressValue
                }),
                credentials: 'include' 
            });

            const result = await response.json();

            if (response.ok) {
                
                if (result.user) {
                    localStorage.setItem('user', JSON.stringify(result.user));
                }

                showNotification('Profile updated successfully!', false);
                messageArea.textContent = ''; 

                const urlParams = new URLSearchParams(window.location.search);
                const nextPage = urlParams.get('next'); 

                window.location.href = nextPage || 'my_requests.html'; 

            } else {
                
                messageArea.textContent = `Error: ${result.message || 'Could not update profile.'}`;
                messageArea.style.color = '#ffcdd2';
                submitButton.disabled = false; 
            }

        } catch (error) {
            console.error('Error updating profile:', error);
            messageArea.textContent = 'An network error occurred. Please try again.';
            messageArea.style.color = '#ffcdd2';
            submitButton.disabled = false; 
        }
    });
});