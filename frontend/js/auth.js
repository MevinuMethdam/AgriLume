// frontend/js/auth.js

// This function needs to be in the global scope so the Google library can call it.
async function handleCredentialResponse(response) {
    // The ID token is now in response.credential
    const id_token = response.credential;
    const messageArea = document.getElementById('message-area');
    const BACKEND_URL = 'http://127.0.0.1:5000'; // Define backend URL here as well

    if (!messageArea) {
        console.error("Message area not found!");
        return;
    }

    messageArea.textContent = 'Signing in with Google...';
    messageArea.style.color = 'blue';

    try {
        // Send the token to your backend
        const backendResponse = await fetch(`${BACKEND_URL}/api/google-login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token: id_token }),
            credentials: 'include',
        });

        const result = await backendResponse.json();
        messageArea.textContent = result.message;

        if (backendResponse.ok) {
            messageArea.style.color = 'green';
            localStorage.setItem('user', JSON.stringify(result.user));
            setTimeout(() => {
                // Redirect to the main page on successful login/registration
                window.location.href = 'index.html';
            }, 1500);
        } else {
            messageArea.style.color = 'red';
        }
    } catch (error) {
        console.error('Google Sign-In Error:', error);
        messageArea.textContent = 'An error occurred during Google sign-in.';
        messageArea.style.color = 'red';
    }
}


document.addEventListener('DOMContentLoaded', () => {
    const BACKEND_URL = 'http://127.0.0.1:5000';

    const registerForm = document.getElementById('register-form');
    const loginForm = document.getElementById('login-form');
    const messageArea = document.getElementById('message-area');

    // --- Registration Logic (Email/Password) ---
    if (registerForm) {
        registerForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const formData = new FormData(registerForm);
            const data = Object.fromEntries(formData.entries());
            try {
                const response = await fetch(`${BACKEND_URL}/api/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                });
                const result = await response.json();
                if (messageArea) {
                    messageArea.textContent = result.message;
                    if (response.ok) {
                        messageArea.style.color = 'green';
                        setTimeout(() => { window.location.href = 'login.html'; }, 2000);
                    } else {
                        messageArea.style.color = 'red';
                    }
                }
            } catch (error) {
                if (messageArea) {
                    messageArea.textContent = 'An error occurred. Please try again.';
                    messageArea.style.color = 'red';
                }
            }
        });
    }

    // --- Login Logic (Email/Password) ---
    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const formData = new FormData(loginForm);
            const data = Object.fromEntries(formData.entries());
            try {
                const response = await fetch(`${BACKEND_URL}/api/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                    credentials: 'include',
                });
                const result = await response.json();
                if (messageArea) {
                    messageArea.textContent = result.message;
                    if (response.ok) {
                        messageArea.style.color = 'green';
                        localStorage.setItem('user', JSON.stringify(result.user));
                        setTimeout(() => { window.location.href = 'index.html'; }, 1500);
                    } else {
                        messageArea.style.color = 'red';
                    }
                }
            } catch (error) {
                console.error('Login Error:', error);
                if (messageArea) {
                    messageArea.textContent = 'An error occurred. Please try again.';
                    messageArea.style.color = 'red';
                }
            }
        });
    }
});

