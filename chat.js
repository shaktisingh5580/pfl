// Import Socket.io client and Firebase libraries
import io from 'socket.io-client';
import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';

// Initialize Socket.io connection
const socket = io('http://localhost:3000');

// Firebase references
const auth = firebase.auth();
const db = firebase.firestore();

// DOM elements
const chatMessages = document.getElementById('chat-messages');
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');
const userList = document.getElementById('user-list');

// Current user data
let currentUser = null;
let userData = null;

// Listen for authentication state changes
auth.onAuthStateChanged(user => {
    if (user) {
        currentUser = user;
        
        // Get user data from Firestore
        db.collection('users').doc(user.uid).get()
            .then(doc => {
                if (doc.exists) {
                    userData = doc.data();
                    
                    // Connect to Socket.io with user data
                    socket.emit('user:connect', {
                        userId: user.uid,
                        name: userData.name || 'Anonymous',
                        timestamp: new Date().toISOString()
                    });
                    
                    // Load chat history
                    loadChatHistory();
                } else {
                    console.error("User document doesn't exist");
                    window.location.href = 'profile.html';
                }
            })
            .catch(error => {
                console.error("Error getting user data:", error);
            });
    } else {
        // Redirect to login if not logged in
        window.location.href = 'login.html';
    }
});

// Load chat history from Firestore
function loadChatHistory() {
    db.collection('messages')
        .orderBy('timestamp', 'asc')
        .limit(50)
        .get()
        .then(snapshot => {
            snapshot.forEach(doc => {
                const message = doc.data();
                displayMessage(message);
            });
            
            // Scroll to bottom after loading messages
            scrollToBottom();
        })
        .catch(error => {
            console.error("Error loading chat history:", error);
        });
}

// Display a message in the chat
function displayMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.className = `message ${message.userId === currentUser.uid ? 'sent' : 'received'}`;
    
    const time = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    messageElement.innerHTML = `
        <div class="message-info">
            <span class="message-sender">${message.userName}</span>
            <span class="message-time">${time}</span>
        </div>
        <div class="message-bubble">
            <div class="message-text">${message.text}</div>
        </div>
    `;
    
    chatMessages.appendChild(messageElement);
    scrollToBottom();
}

// Scroll chat to bottom
function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Send a message
messageForm.addEventListener('submit', e => {
    e.preventDefault();
    
    const text = messageInput.value.trim();
    if (!text) return;
    
    const message = {
        userId: currentUser.uid,
        userName: userData.name || 'Anonymous',
        text: text,
        timestamp: new Date().toISOString()
    };
    
    // Send message to Socket.io server
    socket.emit('message:send', message);
    
    // Clear input
    messageInput.value = '';
});

// Socket.io event listeners
socket.on('connect', () => {
    console.log('Connected to Socket.io server');
});

socket.on('message:receive', message => {
    // Save message to Firestore
    db.collection('messages').add(message)
        .then(() => {
            console.log("Message saved to Firestore");
        })
        .catch(error => {
            console.error("Error saving message:", error);
        });
    
    // Display message
    displayMessage(message);
});

socket.on('users:update', users => {
    // Update user list
    userList.innerHTML = '';
    
    users.forEach(user => {
        const userElement = document.createElement('li');
        userElement.className = 'user-item online';
        userElement.textContent = user.name;
        userList.appendChild(userElement);
    });
});

socket.on('disconnect', () => {
    console.log('Disconnected from Socket.io server');
});

// Handle page unload
window.addEventListener('beforeunload', () => {
    if (currentUser) {
        socket.emit('user:disconnect', {
            userId: currentUser.uid
        });
    }
});
