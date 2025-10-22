// frontend/js/auth.js

const BACKEND_URL_AUTH = 'http://127.0.0.1:5000';

/**
 * Displays a temporary notification message on the screen using CSS classes.
 * @param {string} message The message to display.
 * @param {boolean} isError If true, the message will be styled as an error.
 */
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

async function handleCredentialResponse(response) {
    const id_token = response.credential;
    const messageArea = document.getElementById('message-area');
    const BACKEND_URL = BACKEND_URL_AUTH; 

    if (messageArea) {
        messageArea.textContent = 'Signing in with Google...';
        messageArea.style.color = 'blue';
    }

    try {
        const backendResponse = await fetch(`${BACKEND_URL}/api/google-login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: id_token }),
            credentials: 'include',
        });

        const result = await backendResponse.json();
        if (messageArea) messageArea.textContent = result.message;

        if (backendResponse.ok) {
            if (messageArea) messageArea.style.color = 'green';
            
            localStorage.setItem('user', JSON.stringify(result.user));
            const loggedInUser = result.user; 

            setTimeout(() => {
                
                const pendingRequestJSON = localStorage.getItem('pendingRequest');
                if (pendingRequestJSON) {
                    const pendingRequest = JSON.parse(pendingRequestJSON);
                    if (pendingRequest.action === 'pendingRequestAfterModal' && pendingRequest.productId && pendingRequest.quantity) {
                        localStorage.removeItem('pendingRequest');
                        (async () => {
                            try {
                                const reqResponse = await fetch(`${BACKEND_URL}/api/requests/add`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        product_id: pendingRequest.productId,
                                        quantity: pendingRequest.quantity
                                    }),
                                    credentials: 'include',
                                });
                                const reqResult = await reqResponse.json();
                                if (reqResponse.ok) {
                                     showNotification('Login successful & your request has been submitted!', false);
                                     
                                     const needsCompletionAfterReq = (loggedInUser.phone_number === "0000000000" || loggedInUser.phone_number === null ||
                                                                   loggedInUser.address === "Not Provided" || loggedInUser.address === null);
                                     if (needsCompletionAfterReq) {
                                         window.location.href = 'complete_profile.html?next=my_requests.html';
                                     } else {
                                         window.location.href = 'my_requests.html';
                                     }
                                } else {
                                     showNotification(`Login successful, but failed to submit request: ${reqResult.message}`, true);
                                     window.location.href = 'products.html'; 
                                }
                            } catch (error) {
                                showNotification('Login successful, but an error occurred submitting the request.', true);
                                window.location.href = 'products.html'; 
                            }
                        })();
                        return; 
                    } else {
                         localStorage.removeItem('pendingRequest'); 
                    }
                }

                const needsCompletion = (loggedInUser.phone_number === "0000000000" || loggedInUser.phone_number === null ||
                                         loggedInUser.address === "Not Provided" || loggedInUser.address === null);

                if (needsCompletion) {
                    
                    const nextUrl = (loggedInUser.is_seller) ? 'seller_dashboard.html' : 'my_requests.html';
                    window.location.href = `complete_profile.html?next=${encodeURIComponent(nextUrl)}`; 
                    return; 
                }

                if (loggedInUser.is_seller) {
                    window.location.href = 'seller_dashboard.html';
                } else {
                    window.location.href = 'my_requests.html';
                }
            }, 500); 

        } else {
            if (messageArea) messageArea.style.color = 'red';
            localStorage.removeItem('user'); 
        }
    } catch (error) {
        console.error('Google Sign-In Error:', error);
        if (messageArea) {
            messageArea.textContent = 'An error occurred during Google sign-in.';
            messageArea.style.color = 'red';
        }
        localStorage.removeItem('user'); 
    }
}


document.addEventListener('DOMContentLoaded', () => {
    const BACKEND_URL = BACKEND_URL_AUTH; 

    const registerForm = document.getElementById('register-form');
    const loginForm = document.getElementById('login-form');
    const messageArea = document.getElementById('message-area');

    if (registerForm) {
        
         registerForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const password = document.getElementById('password');
            const confirmPassword = document.getElementById('confirm_password');
            const registerMessageArea = document.getElementById('message-area');
            registerMessageArea.textContent = '';
            registerMessageArea.style.color = '#ffcdd2';

            const requiredFields = ['full_name', 'email', 'phone_number', 'address', 'gender', 'password'];
            for (const fieldName of requiredFields) {
                const field = document.getElementById(fieldName);
                if (!field.value.trim()) {
                     registerMessageArea.textContent = `Please fill in the '${field.previousElementSibling?.textContent || fieldName}' field.`;
                     field.focus();
                     return;
                }
            }
            const phoneInput = document.getElementById('phone_number');
            const phonePattern = /^[0-9]{10}$/;
            if (!phonePattern.test(phoneInput.value)) {
                registerMessageArea.textContent = 'Phone number must be exactly 10 digits.';
                phoneInput.focus();
                return;
            }
            if (password.value !== confirmPassword.value) {
                registerMessageArea.textContent = 'Passwords do not match!';
                confirmPassword.focus();
                return;
            }
            if (password.value.length < 6) {
                 registerMessageArea.textContent = 'Password must be at least 6 characters long.';
                 password.focus();
                 return;
            }

            registerMessageArea.textContent = 'Registering...';
            registerMessageArea.style.color = 'lightblue';

            const formData = new FormData(registerForm);
            const data = Object.fromEntries(formData.entries());
            delete data.confirm_password;

            try {
                const response = await fetch(`${BACKEND_URL}/api/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                });
                const result = await response.json();
                if (registerMessageArea) {
                    registerMessageArea.textContent = result.message;
                    if (response.ok) {
                        registerMessageArea.style.color = 'lightgreen';
                        setTimeout(() => { window.location.href = 'login.html'; }, 2000);
                    } else {
                        registerMessageArea.style.color = '#ffcdd2';
                    }
                }
            } catch (error) {
                console.error('Registration Error:', error);
                if (registerMessageArea) {
                    registerMessageArea.textContent = 'An error occurred. Please try again.';
                    registerMessageArea.style.color = '#ffcdd2';
                }
            }
        });
    }

    if (loginForm) {
        const loginMessageArea = messageArea; 
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
                if (loginMessageArea) loginMessageArea.textContent = result.message;

                if (response.ok) {
                    if (loginMessageArea) loginMessageArea.style.color = 'green';
                    
                    localStorage.setItem('user', JSON.stringify(result.user));
                    const loggedInUser = result.user; 

                    setTimeout(() => {
                        
                        const pendingRequestJSON = localStorage.getItem('pendingRequest');
                        if (pendingRequestJSON) {
                            
                            const pendingRequest = JSON.parse(pendingRequestJSON);
                            if (pendingRequest.action === 'pendingRequestAfterModal' && pendingRequest.productId && pendingRequest.quantity) {
                                localStorage.removeItem('pendingRequest');
                                (async () => {
                                    try {
                                        const reqResponse = await fetch(`${BACKEND_URL}/api/requests/add`, {
                                             method: 'POST',
                                             headers: { 'Content-Type': 'application/json' },
                                             body: JSON.stringify({
                                                 product_id: pendingRequest.productId,
                                                 quantity: pendingRequest.quantity
                                             }),
                                             credentials: 'include',
                                        });
                                        const reqResult = await reqResponse.json();
                                        if (reqResponse.ok) {
                                             showNotification('Login successful & your request has been submitted!', false);
                                             
                                             const needsCompletionAfterReq = (loggedInUser.phone_number === "0000000000" || loggedInUser.phone_number === null ||
                                                                           loggedInUser.address === "Not Provided" || loggedInUser.address === null);
                                             if (needsCompletionAfterReq) {
                                                 window.location.href = `complete_profile.html?next=${encodeURIComponent('my_requests.html')}`;
                                             } else {
                                                 window.location.href = 'my_requests.html';
                                             }
                                        } else {
                                             showNotification(`Login successful, but failed to submit request: ${reqResult.message}`, true);
                                             window.location.href = 'products.html';
                                        }
                                    } catch (error) {
                                        showNotification('Login successful, but an error occurred submitting the request.', true);
                                        window.location.href = 'products.html';
                                    }
                                })();
                                return; 
                            } else {
                                 localStorage.removeItem('pendingRequest');
                            }
                        }

                        const needsCompletion = (loggedInUser.phone_number === "0000000000" || loggedInUser.phone_number === null ||
                                                 loggedInUser.address === "Not Provided" || loggedInUser.address === null);

                        if (needsCompletion) {
                            const nextUrl = (loggedInUser.is_seller) ? 'seller_dashboard.html' : 'my_requests.html';
                            window.location.href = `complete_profile.html?next=${encodeURIComponent(nextUrl)}`; 
                            return; 
                        }

                        if (loggedInUser.is_seller) {
                            window.location.href = 'seller_dashboard.html';
                        } else {
                            window.location.href = 'my_requests.html';
                        }
                    }, 500); 

                } else {
                    if (loginMessageArea) loginMessageArea.style.color = 'red';
                    localStorage.removeItem('user'); 
                }
            } catch (error) {
                console.error('Login Error:', error);
                if (loginMessageArea) {
                    loginMessageArea.textContent = 'An error occurred during login. Please try again.';
                    loginMessageArea.style.color = 'red';
                }
                localStorage.removeItem('user'); 
            }
        });
    }
}); 