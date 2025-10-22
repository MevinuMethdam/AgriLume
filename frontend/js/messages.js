// This script should only run on messages.html
document.addEventListener('DOMContentLoaded', () => {
    if (!document.querySelector('.messaging-wrapper')) {
        return; 
    }

    const BACKEND_URL = 'http://127.0.0.1:5000';
    const conversationsListDiv = document.getElementById('conversations-list-items');
    const chatHeaderDiv = document.getElementById('chat-header');
    const messagesAreaDiv = document.getElementById('messages-area');
    const messageForm = document.getElementById('message-form');
    const messageInput = document.getElementById('message-input');
    const noChatPlaceholder = document.querySelector('.no-chat-selected');

    let currentUserId = null;
    let activeConversationUserId = null;

    async function getCurrentUser() {
        try {
            const response = await fetch(`${BACKEND_URL}/api/check_session`, { credentials: 'include' });
            const data = await response.json();
            if (data.logged_in) {
                currentUserId = data.user.id;
                loadConversations();
            } else {
                showNotification('Please log in to view messages.', true);
                setTimeout(() => window.location.href = 'login.html', 2000);
            }
        } catch (error) {
            console.error('Error getting user session:', error);
        }
    }

    async function loadConversations() {
        try {
            const response = await fetch(`${BACKEND_URL}/api/messages/conversations`, { credentials: 'include' });
            const conversations = await response.json();
            conversationsListDiv.innerHTML = '';
            if (conversations.length === 0) {
                conversationsListDiv.innerHTML = '<p style="padding: 15px; color: #868e96;">No conversations found.</p>';
                return;
            }
            conversations.forEach(user => {
                const convoItem = document.createElement('div');
                convoItem.className = 'conversation-item';
                convoItem.dataset.userId = user.id;

                const avatar = document.createElement('div');
                avatar.className = 'avatar';
                avatar.textContent = user.full_name.charAt(0).toUpperCase(); 

                const nameDiv = document.createElement('div');
                nameDiv.className = 'user-name';
                nameDiv.textContent = user.full_name;

                convoItem.appendChild(avatar);
                convoItem.appendChild(nameDiv);

                convoItem.onclick = () => loadMessageHistory(user.id, user.full_name);
                conversationsListDiv.appendChild(convoItem);
            });
        } catch (error) {
            console.error('Error loading conversations:', error);
            conversationsListDiv.innerHTML = '<p style="padding: 15px; color: #e74c3c;">Failed to load conversations.</p>';
        }
    }

    async function loadMessageHistory(otherUserId, otherUserName) {
        activeConversationUserId = otherUserId;
        chatHeaderDiv.textContent = `Chat with ${otherUserName}`;
        messageForm.style.display = 'flex';
        if(noChatPlaceholder) noChatPlaceholder.style.display = 'none'; 
        messagesAreaDiv.innerHTML = '<p style="text-align:center; color: #868e96;">Loading messages...</p>';

        document.querySelectorAll('.conversation-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.userId == otherUserId) {
                item.classList.add('active');
            }
        });

        try {
            const response = await fetch(`${BACKEND_URL}/api/messages/history/${otherUserId}`, { credentials: 'include' });
            const messages = await response.json();
            messagesAreaDiv.innerHTML = ''; 
            if(messages.length === 0) {
                 messagesAreaDiv.innerHTML = '<p style="text-align:center; color: #868e96;">No messages yet. Say hello!</p>';
            } else {
                messages.forEach(msg => {
                    appendMessage(msg.content, msg.sender_id === currentUserId, false); 
                });
            }
            scrollToBottom();
        } catch (error) {
            console.error('Error loading message history:', error);
            messagesAreaDiv.innerHTML = '<p style="text-align:center; color: #e74c3c;">Could not load messages.</p>';
        }
    }
    
    function appendMessage(content, isSent, withAnimation = true) {
        const msgDiv = document.createElement('div');
        msgDiv.className = 'message';
        if (!withAnimation) {
            msgDiv.style.animation = 'none';
        }
        msgDiv.classList.add(isSent ? 'sent' : 'received');
        msgDiv.textContent = content;
        messagesAreaDiv.appendChild(msgDiv);
    }

    function scrollToBottom() {
        messagesAreaDiv.scrollTop = messagesAreaDiv.scrollHeight;
    }

    if (messageForm) {
        messageForm.addEventListener('submit', async (e) => {
            e.preventDefault(); 
            const content = messageInput.value.trim();
            if (!content || !activeConversationUserId) return;

            if(messagesAreaDiv.querySelector('p')) {
                messagesAreaDiv.innerHTML = '';
            }

            appendMessage(content, true, true);
            scrollToBottom();
            
            const sentContent = messageInput.value;
            messageInput.value = '';

            const messageData = {
                receiver_id: activeConversationUserId,
                content: sentContent
            };

            try {
                const response = await fetch(`${BACKEND_URL}/api/messages/send`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(messageData),
                    credentials: 'include'
                });
                if (!response.ok) {
                    const lastMessage = messagesAreaDiv.lastChild;
                    if(lastMessage && lastMessage.classList.contains('sent')) {
                        lastMessage.style.background = '#e74c3c';
                        lastMessage.textContent += " (Failed)";
                    }
                }
            } catch (error) {
                const lastMessage = messagesAreaDiv.lastChild;
                if(lastMessage && lastMessage.classList.contains('sent')) {
                    lastMessage.style.background = '#e74c3c';
                    lastMessage.textContent += " (Error)";
                }
                console.error('Error sending message:', error);
            }
        });
    }

    getCurrentUser();
});