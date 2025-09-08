// متغيرات عامة
let socket;
let currentUser = null;
let currentRoom = 1;
let currentPrivateChat = null;
let isRecording = false;
let mediaRecorder = null;
let recordedChunks = [];
let currentTheme = 'dark';
let notifications = [];
let stories = [];
let friends = [];
let blockedUsers = [];

// الرموز التعبيرية
const emojis = [
    '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
    '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
    '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩',
    '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
    '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬',
    '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗',
    '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯',
    '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐',
    '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈',
    '👿', '👹', '👺', '🤡', '💩', '👻', '💀', '☠️', '👽', '👾',
    '🤖', '🎃', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿',
    '😾', '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎',
    '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟'
];

// الرتب المتاحة
const RANKS = {
    visitor: { name: 'زائر', emoji: '👋', level: 0, color: '#888' },
    bronze: { name: 'عضو برونزي', emoji: '🥉', level: 1, color: '#cd7f32' },
    silver: { name: 'عضو فضي', emoji: '🥈', level: 2, color: '#c0c0c0' },
    gold: { name: 'عضو ذهبي', emoji: '🥇', level: 3, color: '#ffd700' },
    trophy: { name: 'كأس', emoji: '🏆', level: 4, color: '#ff6b35' },
    diamond: { name: 'عضو الماس', emoji: '💎', level: 5, color: '#b9f2ff' },
    prince: { name: 'برنس', emoji: '👑', level: 6, color: 'linear-gradient(45deg, #ffd700, #ff6b35)' }
};

// تهيئة التطبيق
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    loadTheme();
    checkAuthStatus();
});

// تهيئة التطبيق
function initializeApp() {
    // إخفاء جميع الشاشات
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    // عرض شاشة تسجيل الدخول
    document.getElementById('loginScreen').classList.add('active');
    
    // تهيئة الرموز التعبيرية
    initializeEmojiPicker();
    
    // تحديث الوقت كل دقيقة
    setInterval(updateTimeStamps, 60000);
}

// إعداد مستمعي الأحداث
function setupEventListeners() {
    // نماذج تسجيل الدخول
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
    document.getElementById('guestForm').addEventListener('submit', handleGuestLogin);
    
    // إدخال الرسائل
    document.getElementById('messageInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    document.getElementById('privateMessageInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendPrivateMessage();
        }
    });
    
    // رفع الملفات
    document.getElementById('imageInput').addEventListener('change', handleImageUpload);
    document.getElementById('privateImageInput').addEventListener('change', handlePrivateImageUpload);
    document.getElementById('fileInput').addEventListener('change', handleFileUpload);
    
    // إغلاق المودالات عند النقر خارجها
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            closeAllModals();
        }
    });
    
    // اختصارات لوحة المفاتيح
    document.addEventListener('keydown', handleKeyboardShortcuts);
}

// التحقق من حالة المصادقة
function checkAuthStatus() {
    const token = localStorage.getItem('chatToken');
    if (token) {
        // التحقق من صحة الرمز المميز
        fetch('/api/user/profile', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => {
            if (response.ok) {
                return response.json();
            } else {
                throw new Error('Invalid token');
            }
        })
        .then(user => {
            currentUser = user;
            showMainScreen();
            connectSocket();
        })
        .catch(error => {
            console.error('Auth check failed:', error);
            localStorage.removeItem('chatToken');
            showLoginScreen();
        });
    } else {
        showLoginScreen();
    }
}

// عرض شاشة تسجيل الدخول
function showLoginScreen() {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById('loginScreen').classList.add('active');
}

// عرض الشاشة الرئيسية
function showMainScreen() {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById('mainScreen').classList.add('active');
    
    // تحديث معلومات المستخدم في الواجهة
    updateUserInterface();
    
    // تحميل البيانات الأولية
    loadInitialData();
}

// تحديث واجهة المستخدم
function updateUserInterface() {
    if (!currentUser) return;
    
    // تحديث معلومات المستخدم في الشريط العلوي
    const headerUserName = document.getElementById('headerUserName');
    const headerUserRank = document.getElementById('headerUserRank');
    const headerUserAvatar = document.getElementById('headerUserAvatar');
    
    if (headerUserName) headerUserName.textContent = currentUser.display_name;
    if (headerUserRank) {
        const rank = RANKS[currentUser.rank] || RANKS.visitor;
        headerUserRank.textContent = `${rank.emoji} ${rank.name}`;
        headerUserRank.style.color = rank.color;
    }
    if (headerUserAvatar && currentUser.profile_image1) {
        headerUserAvatar.src = currentUser.profile_image1;
    }
    
    // إظهار/إخفاء أزرار الإدارة
    const adminButtons = document.querySelectorAll('.admin-only');
    const ownerButtons = document.querySelectorAll('.owner-only');
    const moderatorButtons = document.querySelectorAll('.moderator-only');
    
    if (currentUser.role === 'admin' || currentUser.email === 'njdj9985@mail.com') {
        adminButtons.forEach(btn => btn.style.display = 'block');
        moderatorButtons.forEach(btn => btn.style.display = 'block');
    }
    
    if (currentUser.email === 'njdj9985@mail.com') {
        ownerButtons.forEach(btn => btn.style.display = 'block');
    }
    
    if (currentUser.role === 'moderator') {
        moderatorButtons.forEach(btn => btn.style.display = 'block');
    }
    
    // تعيين دور المستخدم في body
    document.body.setAttribute('data-user-role', currentUser.role);
}

// تحميل البيانات الأولية
function loadInitialData() {
    loadRooms();
    loadMessages(currentRoom);
    loadOnlineUsers();
    loadNews();
    loadStories();
    loadFriends();
}

// اتصال Socket.IO
function connectSocket() {
    socket = io();
    
    // الانضمام للشات
    socket.emit('join', {
        userId: currentUser.id,
        displayName: currentUser.display_name,
        rank: currentUser.rank,
        email: currentUser.email,
        roomId: currentRoom
    });
    
    // استقبال الرسائل الجديدة
    socket.on('newMessage', handleNewMessage);
    socket.on('newPrivateMessage', handleNewPrivateMessage);
    socket.on('messageDeleted', handleMessageDeleted);
    socket.on('privateMessageDeleted', handlePrivateMessageDeleted);
    
    // تحديث قائمة المستخدمين
    socket.on('roomUsersList', updateOnlineUsers);
    socket.on('userList', updateOnlineUsers);
    
    // الأخبار والقصص
    socket.on('newNews', handleNewNews);
    socket.on('newStory', handleNewStory);
    
    // إشعارات الإدارة
    socket.on('userBanned', handleUserBanned);
    socket.on('userMuted', handleUserMuted);
    socket.on('userUpdated', handleUserUpdated);
    
    // إشعارات عامة
    socket.on('notification', handleNotification);
    socket.on('error', handleSocketError);
}

// معالجة تسجيل الدخول
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        showError('يرجى إدخال البريد الإلكتروني وكلمة المرور');
        return;
    }
    
    showLoading(true);
    
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('chatToken', data.token);
            currentUser = data.user;
            showMainScreen();
            connectSocket();
            showToast('تم تسجيل الدخول بنجاح', 'success');
        } else {
            showError(data.error || 'خطأ في تسجيل الدخول');
        }
    } catch (error) {
        console.error('Login error:', error);
        showError('خطأ في الاتصال بالخادم');
    } finally {
        showLoading(false);
    }
}

// معالجة إنشاء حساب
async function handleRegister(e) {
    e.preventDefault();
    
    const displayName = document.getElementById('registerDisplayName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    
    if (!email || !password) {
        showError('يرجى إدخال جميع البيانات المطلوبة');
        return;
    }
    
    if (password.length < 6) {
        showError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
        return;
    }
    
    showLoading(true);
    
    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password, display_name: displayName })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('chatToken', data.token);
            currentUser = data.user;
            showMainScreen();
            connectSocket();
            showToast('تم إنشاء الحساب بنجاح', 'success');
        } else {
            showError(data.error || 'خطأ في إنشاء الحساب');
        }
    } catch (error) {
        console.error('Register error:', error);
        showError('خطأ في الاتصال بالخادم');
    } finally {
        showLoading(false);
    }
}

// معالجة دخول الزائر
async function handleGuestLogin(e) {
    e.preventDefault();
    
    const name = document.getElementById('guestName').value;
    const age = document.getElementById('guestAge').value;
    const gender = document.getElementById('guestGender').value;
    
    if (!name || !age || !gender) {
        showError('يرجى إدخال جميع البيانات المطلوبة');
        return;
    }
    
    // إنشاء مستخدم زائر مؤقت
    currentUser = {
        id: Date.now(),
        display_name: name,
        email: `guest_${Date.now()}@temp.com`,
        role: 'guest',
        rank: 'visitor',
        age: parseInt(age),
        gender: gender,
        isGuest: true
    };
    
    showMainScreen();
    connectSocket();
    showToast('مرحباً بك كزائر', 'info');
}

// تحميل الغرف
async function loadRooms() {
    try {
        const response = await fetch('/api/rooms', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('chatToken')}`
            }
        });
        
        if (response.ok) {
            const rooms = await response.json();
            displayRooms(rooms);
        }
    } catch (error) {
        console.error('Error loading rooms:', error);
    }
}

// عرض الغرف
function displayRooms(rooms) {
    const roomsList = document.getElementById('roomsList');
    if (!roomsList) return;
    
    roomsList.innerHTML = '';
    
    rooms.forEach(room => {
        const roomElement = document.createElement('div');
        roomElement.className = `room-item ${room.id === currentRoom ? 'active' : ''}`;
        roomElement.onclick = () => switchRoom(room.id);
        
        roomElement.innerHTML = `
            <div class="room-icon">
                ${room.background_image ? 
                    `<img src="${room.background_image}" alt="${room.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">` :
                    '🏠'
                }
            </div>
            <div class="room-info">
                <div class="room-name">${room.name}</div>
                ${room.description ? `<div class="room-description">${room.description}</div>` : ''}
            </div>
        `;
        
        roomsList.appendChild(roomElement);
    });
}

// تبديل الغرفة
function switchRoom(roomId) {
    if (roomId === currentRoom) return;
    
    currentRoom = roomId;
    
    // تحديث الواجهة
    document.querySelectorAll('.room-item').forEach(item => {
        item.classList.remove('active');
    });
    
    document.querySelector(`[onclick="switchRoom(${roomId})"]`)?.classList.add('active');
    
    // تحميل رسائل الغرفة الجديدة
    loadMessages(roomId);
    
    // إشعار Socket.IO بتغيير الغرفة
    if (socket) {
        socket.emit('changeRoom', roomId);
    }
    
    // تحديث اسم الغرفة في الواجهة
    updateCurrentRoomName(roomId);
}

// تحديث اسم الغرفة الحالية
async function updateCurrentRoomName(roomId) {
    try {
        const response = await fetch('/api/rooms', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('chatToken')}`
            }
        });
        
        if (response.ok) {
            const rooms = await response.json();
            const room = rooms.find(r => r.id === roomId);
            if (room) {
                document.getElementById('currentRoomName').textContent = room.name;
            }
        }
    } catch (error) {
        console.error('Error updating room name:', error);
    }
}

// تحميل الرسائل
async function loadMessages(roomId) {
    try {
        const response = await fetch(`/api/messages/${roomId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('chatToken')}`
            }
        });
        
        if (response.ok) {
            const messages = await response.json();
            displayMessages(messages);
        }
    } catch (error) {
        console.error('Error loading messages:', error);
    }
}

// عرض الرسائل
function displayMessages(messages) {
    const container = document.getElementById('messagesContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    messages.forEach(message => {
        const messageElement = createMessageElement(message);
        container.appendChild(messageElement);
    });
    
    // التمرير إلى أسفل
    container.scrollTop = container.scrollHeight;
}

// إنشاء عنصر رسالة
function createMessageElement(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${message.user_id === currentUser?.id ? 'own' : ''}`;
    messageDiv.setAttribute('data-message-id', message.id);
    
    const rank = RANKS[message.rank] || RANKS.visitor;
    const timeString = formatTime(message.timestamp);
    
    let messageContent = '';
    
    if (message.message) {
        messageContent = `<div class="message-text">${escapeHtml(message.message)}</div>`;
    }
    
    if (message.image_url) {
        messageContent += `<div class="message-media">
            <img src="${message.image_url}" alt="صورة" class="message-image" onclick="openImageModal('${message.image_url}')">
        </div>`;
    }
    
    if (message.voice_url) {
        messageContent += `<div class="message-media">
            <audio controls class="message-audio">
                <source src="${message.voice_url}" type="audio/webm">
                متصفحك لا يدعم تشغيل الملفات الصوتية
            </audio>
        </div>`;
    }
    
    messageDiv.innerHTML = `
        <img src="${message.profile_image1 || getDefaultAvatar(message.display_name)}" alt="${message.display_name}" class="message-avatar">
        <div class="message-content" ${message.message_background ? `style="background-image: url(${message.message_background})"` : ''}>
            <div class="message-header">
                <span class="message-author">${escapeHtml(message.display_name)}</span>
                <span class="message-rank rank-${message.rank}" style="color: ${rank.color}">${rank.emoji} ${rank.name}</span>
                <span class="message-time">${timeString}</span>
                ${message.user_id === currentUser?.id || currentUser?.role === 'admin' ? 
                    `<button class="message-delete-btn" onclick="deleteMessage(${message.id})" title="حذف الرسالة">
                        <i class="fas fa-trash"></i>
                    </button>` : ''
                }
            </div>
            ${messageContent}
        </div>
    `;
    
    return messageDiv;
}

// إرسال رسالة
function sendMessage() {
    const input = document.getElementById('messageInput');
    const message = input.value.trim();
    
    if (!message || !socket) return;
    
    socket.emit('sendMessage', {
        message: message,
        roomId: currentRoom
    });
    
    input.value = '';
}

// معالجة الرسالة الجديدة
function handleNewMessage(message) {
    const container = document.getElementById('messagesContainer');
    if (!container) return;
    
    const messageElement = createMessageElement(message);
    container.appendChild(messageElement);
    
    // التمرير إلى أسفل
    container.scrollTop = container.scrollHeight;
    
    // تشغيل صوت الإشعار
    playNotificationSound();
    
    // إظهار إشعار إذا كان المستخدم في غرفة أخرى
    if (message.room_id !== currentRoom) {
        showToast(`رسالة جديدة في ${getRoomName(message.room_id)}`, 'info');
    }
}

// إرسال رسالة خاصة
function sendPrivateMessage() {
    const input = document.getElementById('privateMessageInput');
    const message = input.value.trim();
    
    if (!message || !socket || !currentPrivateChat) return;
    
    socket.emit('sendPrivateMessage', {
        message: message,
        receiverId: currentPrivateChat.id
    });
    
    input.value = '';
}

// معالجة الرسالة الخاصة الجديدة
function handleNewPrivateMessage(message) {
    // إضافة الرسالة إلى الدردشة الخاصة إذا كانت مفتوحة
    if (currentPrivateChat && 
        (message.user_id === currentPrivateChat.id || message.receiver_id === currentPrivateChat.id)) {
        const container = document.getElementById('privateChatMessages');
        if (container) {
            const messageElement = createPrivateMessageElement(message);
            container.appendChild(messageElement);
            container.scrollTop = container.scrollHeight;
        }
    }
    
    // إظهار إشعار
    if (message.user_id !== currentUser?.id) {
        showToast(`رسالة خاصة من ${message.display_name}`, 'info');
        playNotificationSound();
        
        // زيادة عداد الإشعارات
        updateNotificationCount();
    }
}

// إنشاء عنصر رسالة خاصة
function createPrivateMessageElement(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${message.user_id === currentUser?.id ? 'own' : ''}`;
    messageDiv.setAttribute('data-message-id', message.id);
    
    const rank = RANKS[message.rank] || RANKS.visitor;
    const timeString = formatTime(message.timestamp);
    
    let messageContent = '';
    
    if (message.message) {
        messageContent = `<div class="message-text">${escapeHtml(message.message)}</div>`;
    }
    
    if (message.image_url) {
        messageContent += `<div class="message-media">
            <img src="${message.image_url}" alt="صورة" class="message-image" onclick="openImageModal('${message.image_url}')">
        </div>`;
    }
    
    if (message.voice_url) {
        messageContent += `<div class="message-media">
            <audio controls class="message-audio">
                <source src="${message.voice_url}" type="audio/webm">
                متصفحك لا يدعم تشغيل الملفات الصوتية
            </audio>
        </div>`;
    }
    
    messageDiv.innerHTML = `
        <img src="${message.profile_image1 || getDefaultAvatar(message.display_name)}" alt="${message.display_name}" class="message-avatar">
        <div class="message-content">
            <div class="message-header">
                <span class="message-author">${escapeHtml(message.display_name)}</span>
                <span class="message-rank rank-${message.rank}" style="color: ${rank.color}">${rank.emoji} ${rank.name}</span>
                <span class="message-time">${timeString}</span>
                ${message.user_id === currentUser?.id ? 
                    `<button class="message-delete-btn" onclick="deletePrivateMessage(${message.id})" title="حذف الرسالة">
                        <i class="fas fa-trash"></i>
                    </button>` : ''
                }
            </div>
            ${messageContent}
        </div>
    `;
    
    return messageDiv;
}

// حذف رسالة
async function deleteMessage(messageId) {
    if (!confirm('هل أنت متأكد من حذف هذه الرسالة؟')) return;
    
    try {
        const response = await fetch(`/api/messages/${messageId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('chatToken')}`
            }
        });
        
        if (response.ok) {
            // إشعار Socket.IO بحذف الرسالة
            if (socket) {
                socket.emit('deleteMessage', { messageId, roomId: currentRoom });
            }
            
            showToast('تم حذف الرسالة', 'success');
        } else {
            const data = await response.json();
            showError(data.error || 'خطأ في حذف الرسالة');
        }
    } catch (error) {
        console.error('Error deleting message:', error);
        showError('خطأ في الاتصال بالخادم');
    }
}

// معالجة حذف الرسالة
function handleMessageDeleted(messageId) {
    const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
    if (messageElement) {
        messageElement.remove();
    }
}

// حذف رسالة خاصة
async function deletePrivateMessage(messageId) {
    if (!confirm('هل أنت متأكد من حذف هذه الرسالة؟')) return;
    
    try {
        const response = await fetch(`/api/messages/${messageId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('chatToken')}`
            }
        });
        
        if (response.ok) {
            // إشعار Socket.IO بحذف الرسالة الخاصة
            if (socket) {
                socket.emit('deletePrivateMessage', { 
                    messageId, 
                    receiverId: currentPrivateChat?.id 
                });
            }
            
            showToast('تم حذف الرسالة', 'success');
        } else {
            const data = await response.json();
            showError(data.error || 'خطأ في حذف الرسالة');
        }
    } catch (error) {
        console.error('Error deleting private message:', error);
        showError('خطأ في الاتصال بالخادم');
    }
}

// معالجة حذف الرسالة الخاصة
function handlePrivateMessageDeleted(messageId) {
    const messageElement = document.querySelector(`#privateChatMessages [data-message-id="${messageId}"]`);
    if (messageElement) {
        messageElement.remove();
    }
}

// تحميل المستخدمين المتصلين
async function loadOnlineUsers() {
    try {
        const response = await fetch('/api/users', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('chatToken')}`
            }
        });
        
        if (response.ok) {
            const users = await response.json();
            displayOnlineUsers(users);
        }
    } catch (error) {
        console.error('Error loading online users:', error);
    }
}

// عرض المستخدمين المتصلين
function displayOnlineUsers(users) {
    const container = document.getElementById('onlineUsersList');
    if (!container) return;
    
    container.innerHTML = '';
    
    users.forEach(user => {
        if (user.id === currentUser?.id) return; // تجاهل المستخدم الحالي
        
        const userElement = document.createElement('div');
        userElement.className = 'user-item';
        userElement.onclick = () => openPrivateChat(user);
        
        const rank = RANKS[user.rank] || RANKS.visitor;
        
        userElement.innerHTML = `
            <img src="${user.profile_image1 || getDefaultAvatar(user.display_name)}" alt="${user.display_name}" class="user-avatar">
            <div class="user-details">
                <div class="user-display-name">${escapeHtml(user.display_name)}</div>
                <div class="user-status rank-${user.rank}" style="color: ${rank.color}">
                    ${rank.emoji} ${rank.name}
                </div>
            </div>
        `;
        
        container.appendChild(userElement);
    });
}

// تحديث المستخدمين المتصلين
function updateOnlineUsers(users) {
    displayOnlineUsers(users);
}

// فتح دردشة خاصة
async function openPrivateChat(user) {
    currentPrivateChat = user;
    
    // تحديث واجهة الدردشة الخاصة
    document.getElementById('privateChatUserName').textContent = user.display_name;
    document.getElementById('privateChatAvatar').src = user.profile_image1 || getDefaultAvatar(user.display_name);
    
    // تحميل الرسائل الخاصة
    await loadPrivateMessages(user.id);
    
    // عرض المودال
    document.getElementById('privateChatModal').classList.add('show');
}

// تحميل الرسائل الخاصة
async function loadPrivateMessages(userId) {
    try {
        const response = await fetch(`/api/private-messages/${userId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('chatToken')}`
            }
        });
        
        if (response.ok) {
            const messages = await response.json();
            displayPrivateMessages(messages);
        }
    } catch (error) {
        console.error('Error loading private messages:', error);
    }
}

// عرض الرسائل الخاصة
function displayPrivateMessages(messages) {
    const container = document.getElementById('privateChatMessages');
    if (!container) return;
    
    container.innerHTML = '';
    
    messages.forEach(message => {
        const messageElement = createPrivateMessageElement(message);
        container.appendChild(messageElement);
    });
    
    // التمرير إلى أسفل
    container.scrollTop = container.scrollHeight;
}

// إغلاق الدردشة الخاصة
function closePrivateChatModal() {
    document.getElementById('privateChatModal').classList.remove('show');
    currentPrivateChat = null;
}

// تبديل حجم الدردشة الخاصة
function togglePrivateChatSize() {
    const modal = document.getElementById('privateChatModal');
    modal.classList.toggle('maximized');
}

// معالجة رفع الصور
function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
        showError('يرجى اختيار ملف صورة صحيح');
        return;
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB
        showError('حجم الصورة يجب أن يكون أقل من 5 ميجابايت');
        return;
    }
    
    uploadImage(file, false);
}

// معالجة رفع الصور الخاصة
function handlePrivateImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
        showError('يرجى اختيار ملف صورة صحيح');
        return;
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB
        showError('حجم الصورة يجب أن يكون أقل من 5 ميجابايت');
        return;
    }
    
    uploadImage(file, true);
}

// رفع صورة
async function uploadImage(file, isPrivate = false) {
    const formData = new FormData();
    formData.append('image', file);
    
    showLoading(true);
    
    try {
        const response = await fetch('/api/upload-image', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('chatToken')}`
            },
            body: formData
        });
        
        if (response.ok) {
            const data = await response.json();
            
            if (isPrivate && currentPrivateChat) {
                socket.emit('sendPrivateMessage', {
                    image_url: data.image_url,
                    receiverId: currentPrivateChat.id
                });
            } else {
                socket.emit('sendMessage', {
                    image_url: data.image_url,
                    roomId: currentRoom
                });
            }
            
            showToast('تم رفع الصورة بنجاح', 'success');
        } else {
            const data = await response.json();
            showError(data.error || 'خطأ في رفع الصورة');
        }
    } catch (error) {
        console.error('Error uploading image:', error);
        showError('خطأ في رفع الصورة');
    } finally {
        showLoading(false);
    }
}

// معالجة رفع الملفات
function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 10 * 1024 * 1024) { // 10MB
        showError('حجم الملف يجب أن يكون أقل من 10 ميجابايت');
        return;
    }
    
    uploadFile(file);
}

// رفع ملف
async function uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    showLoading(true);
    
    try {
        const response = await fetch('/api/upload-file', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('chatToken')}`
            },
            body: formData
        });
        
        if (response.ok) {
            const data = await response.json();
            
            socket.emit('sendMessage', {
                file_url: data.file_url,
                file_name: file.name,
                file_size: file.size,
                roomId: currentRoom
            });
            
            showToast('تم رفع الملف بنجاح', 'success');
        } else {
            const data = await response.json();
            showError(data.error || 'خطأ في رفع الملف');
        }
    } catch (error) {
        console.error('Error uploading file:', error);
        showError('خطأ في رفع الملف');
    } finally {
        showLoading(false);
    }
}

// تبديل تسجيل الصوت
function toggleVoiceRecording() {
    if (isRecording) {
        stopVoiceRecording();
    } else {
        startVoiceRecording();
    }
}

// بدء تسجيل الصوت
async function startVoiceRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        mediaRecorder = new MediaRecorder(stream);
        recordedChunks = [];
        
        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                recordedChunks.push(event.data);
            }
        };
        
        mediaRecorder.onstop = () => {
            const blob = new Blob(recordedChunks, { type: 'audio/webm' });
            uploadVoiceMessage(blob);
            
            // إيقاف جميع المسارات
            stream.getTracks().forEach(track => track.stop());
        };
        
        mediaRecorder.start();
        isRecording = true;
        
        // تحديث واجهة المستخدم
        const voiceBtn = document.getElementById('voiceBtn');
        if (voiceBtn) {
            voiceBtn.classList.add('recording');
            voiceBtn.innerHTML = '<i class="fas fa-stop"></i>';
        }
        
        showToast('بدأ التسجيل...', 'info');
        
    } catch (error) {
        console.error('Error starting voice recording:', error);
        showError('خطأ في الوصول للميكروفون');
    }
}

// إيقاف تسجيل الصوت
function stopVoiceRecording() {
    if (mediaRecorder && isRecording) {
        mediaRecorder.stop();
        isRecording = false;
        
        // تحديث واجهة المستخدم
        const voiceBtn = document.getElementById('voiceBtn');
        if (voiceBtn) {
            voiceBtn.classList.remove('recording');
            voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
        }
        
        showToast('تم إيقاف التسجيل', 'info');
    }
}

// رفع رسالة صوتية
async function uploadVoiceMessage(blob) {
    const formData = new FormData();
    formData.append('voice', blob, 'voice-message.webm');
    
    showLoading(true);
    
    try {
        const response = await fetch('/api/upload-voice', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('chatToken')}`
            },
            body: formData
        });
        
        if (response.ok) {
            const data = await response.json();
            
            socket.emit('sendMessage', {
                voice_url: data.voice_url,
                roomId: currentRoom
            });
            
            showToast('تم إرسال الرسالة الصوتية', 'success');
        } else {
            const data = await response.json();
            showError(data.error || 'خطأ في رفع الرسالة الصوتية');
        }
    } catch (error) {
        console.error('Error uploading voice message:', error);
        showError('خطأ في رفع الرسالة الصوتية');
    } finally {
        showLoading(false);
    }
}

// تبديل تسجيل الصوت الخاص
function togglePrivateVoiceRecording() {
    if (isRecording) {
        stopPrivateVoiceRecording();
    } else {
        startPrivateVoiceRecording();
    }
}

// بدء تسجيل الصوت الخاص
async function startPrivateVoiceRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        mediaRecorder = new MediaRecorder(stream);
        recordedChunks = [];
        
        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                recordedChunks.push(event.data);
            }
        };
        
        mediaRecorder.onstop = () => {
            const blob = new Blob(recordedChunks, { type: 'audio/webm' });
            uploadPrivateVoiceMessage(blob);
            
            // إيقاف جميع المسارات
            stream.getTracks().forEach(track => track.stop());
        };
        
        mediaRecorder.start();
        isRecording = true;
        
        showToast('بدأ التسجيل...', 'info');
        
    } catch (error) {
        console.error('Error starting private voice recording:', error);
        showError('خطأ في الوصول للميكروفون');
    }
}

// إيقاف تسجيل الصوت الخاص
function stopPrivateVoiceRecording() {
    if (mediaRecorder && isRecording) {
        mediaRecorder.stop();
        isRecording = false;
        showToast('تم إيقاف التسجيل', 'info');
    }
}

// رفع رسالة صوتية خاصة
async function uploadPrivateVoiceMessage(blob) {
    const formData = new FormData();
    formData.append('voice', blob, 'voice-message.webm');
    
    showLoading(true);
    
    try {
        const response = await fetch('/api/upload-voice', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('chatToken')}`
            },
            body: formData
        });
        
        if (response.ok) {
            const data = await response.json();
            
            if (currentPrivateChat) {
                socket.emit('sendPrivateMessage', {
                    voice_url: data.voice_url,
                    receiverId: currentPrivateChat.id
                });
            }
            
            showToast('تم إرسال الرسالة الصوتية', 'success');
        } else {
            const data = await response.json();
            showError(data.error || 'خطأ في رفع الرسالة الصوتية');
        }
    } catch (error) {
        console.error('Error uploading private voice message:', error);
        showError('خطأ في رفع الرسالة الصوتية');
    } finally {
        showLoading(false);
    }
}

// عرض الأقسام
function showSection(sectionName) {
    // إخفاء جميع الأقسام
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // إزالة الفئة النشطة من جميع الأزرار
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // عرض القسم المحدد
    document.getElementById(`${sectionName}Section`).classList.add('active');
    
    // تفعيل الزر المحدد
    document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');
    
    // تحميل البيانات حسب القسم
    switch (sectionName) {
        case 'news':
            loadNews();
            break;
        case 'stories':
            loadStories();
            break;
        case 'friends':
            loadFriends();
            break;
        case 'help':
            // لا حاجة لتحميل بيانات إضافية
            break;
    }
}

// تحميل الأخبار
async function loadNews() {
    try {
        const response = await fetch('/api/news', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('chatToken')}`
            }
        });
        
        if (response.ok) {
            const news = await response.json();
            displayNews(news);
        }
    } catch (error) {
        console.error('Error loading news:', error);
    }
}

// عرض الأخبار
function displayNews(newsItems) {
    const container = document.getElementById('newsFeed');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (newsItems.length === 0) {
        container.innerHTML = '<div class="no-content">لا توجد أخبار حالياً</div>';
        return;
    }
    
    newsItems.forEach(news => {
        const newsElement = createNewsElement(news);
        container.appendChild(newsElement);
    });
}

// إنشاء عنصر خبر
function createNewsElement(news) {
    const newsDiv = document.createElement('div');
    newsDiv.className = 'news-item';
    newsDiv.setAttribute('data-news-id', news.id);
    
    const timeString = formatTime(news.timestamp);
    const likesCount = news.likes ? news.likes.length : 0;
    const isLiked = news.likes ? news.likes.some(like => like.user_id === currentUser?.id) : false;
    
    let mediaContent = '';
    if (news.media) {
        if (news.media.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
            mediaContent = `<div class="news-media">
                <img src="${news.media}" alt="صورة الخبر" onclick="openImageModal('${news.media}')">
            </div>`;
        } else if (news.media.match(/\.(mp4|webm|ogg)$/i)) {
            mediaContent = `<div class="news-media">
                <video controls>
                    <source src="${news.media}" type="video/mp4">
                    متصفحك لا يدعم تشغيل الفيديو
                </video>
            </div>`;
        }
    }
    
    newsDiv.innerHTML = `
        <div class="news-header-info">
            <img src="${news.profile_image1 || getDefaultAvatar(news.display_name)}" alt="${news.display_name}" class="news-author-avatar">
            <div class="news-author-info">
                <h4>${escapeHtml(news.display_name)}</h4>
                <div class="news-time">${timeString}</div>
            </div>
        </div>
        <div class="news-content">${escapeHtml(news.content)}</div>
        ${mediaContent}
        <div class="news-actions">
            <button class="news-action-btn ${isLiked ? 'liked' : ''}" onclick="toggleNewsLike(${news.id})">
                <i class="fas fa-heart"></i>
                <span>${likesCount}</span>
            </button>
            <button class="news-action-btn" onclick="shareNews(${news.id})">
                <i class="fas fa-share"></i>
                مشاركة
            </button>
            ${currentUser?.email === 'njdj9985@mail.com' ? 
                `<button class="news-action-btn" onclick="deleteNews(${news.id})">
                    <i class="fas fa-trash"></i>
                    حذف
                </button>` : ''
            }
        </div>
    `;
    
    return newsDiv;
}

// معالجة خبر جديد
function handleNewNews(news) {
    const container = document.getElementById('newsFeed');
    if (!container) return;
    
    // إزالة رسالة "لا توجد أخبار" إذا كانت موجودة
    const noContent = container.querySelector('.no-content');
    if (noContent) {
        noContent.remove();
    }
    
    const newsElement = createNewsElement(news);
    container.insertBefore(newsElement, container.firstChild);
    
    showToast('خبر جديد تم نشره', 'info');
}

// تبديل إعجاب الخبر
async function toggleNewsLike(newsId) {
    try {
        const response = await fetch(`/api/news/${newsId}/like`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('chatToken')}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            updateNewsLikes(newsId, data.likes, data.isLiked);
        }
    } catch (error) {
        console.error('Error toggling news like:', error);
    }
}

// تحديث إعجابات الخبر
function updateNewsLikes(newsId, likes, isLiked) {
    const newsElement = document.querySelector(`[data-news-id="${newsId}"]`);
    if (!newsElement) return;
    
    const likeBtn = newsElement.querySelector('.news-action-btn');
    const likeCount = likeBtn.querySelector('span');
    
    likeBtn.classList.toggle('liked', isLiked);
    likeCount.textContent = likes.length;
}

// مشاركة خبر
function shareNews(newsId) {
    if (navigator.share) {
        navigator.share({
            title: 'خبر من شات وتين العقرب',
            url: `${window.location.origin}/news/${newsId}`
        });
    } else {
        // نسخ الرابط إلى الحافظة
        const url = `${window.location.origin}/news/${newsId}`;
        navigator.clipboard.writeText(url).then(() => {
            showToast('تم نسخ رابط الخبر', 'success');
        });
    }
}

// حذف خبر
async function deleteNews(newsId) {
    if (!confirm('هل أنت متأكد من حذف هذا الخبر؟')) return;
    
    try {
        const response = await fetch(`/api/news/${newsId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('chatToken')}`
            }
        });
        
        if (response.ok) {
            const newsElement = document.querySelector(`[data-news-id="${newsId}"]`);
            if (newsElement) {
                newsElement.remove();
            }
            showToast('تم حذف الخبر', 'success');
        }
    } catch (error) {
        console.error('Error deleting news:', error);
        showError('خطأ في حذف الخبر');
    }
}

// فتح مودال نشر خبر
function openNewsPostModal() {
    document.getElementById('newsPostModal').classList.add('show');
}

// إغلاق مودال نشر خبر
function closeNewsPostModal() {
    document.getElementById('newsPostModal').classList.remove('show');
    document.getElementById('newsContentInput').value = '';
    document.getElementById('newsMediaInput').value = '';
}

// نشر خبر
async function postNews() {
    const content = document.getElementById('newsContentInput').value.trim();
    const mediaFile = document.getElementById('newsMediaInput').files[0];
    
    if (!content && !mediaFile) {
        showError('يرجى إدخال محتوى أو اختيار ملف');
        return;
    }
    
    const formData = new FormData();
    if (content) formData.append('content', content);
    if (mediaFile) formData.append('media', mediaFile);
    
    showLoading(true);
    
    try {
        const response = await fetch('/api/news', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('chatToken')}`
            },
            body: formData
        });
        
        if (response.ok) {
            const news = await response.json();
            closeNewsPostModal();
            showToast('تم نشر الخبر بنجاح', 'success');
            
            // إشعار Socket.IO بالخبر الجديد
            if (socket) {
                socket.emit('newNews', news);
            }
        } else {
            const data = await response.json();
            showError(data.error || 'خطأ في نشر الخبر');
        }
    } catch (error) {
        console.error('Error posting news:', error);
        showError('خطأ في نشر الخبر');
    } finally {
        showLoading(false);
    }
}

// تحميل القصص
async function loadStories() {
    try {
        const response = await fetch('/api/stories', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('chatToken')}`
            }
        });
        
        if (response.ok) {
            const stories = await response.json();
            displayStories(stories);
        }
    } catch (error) {
        console.error('Error loading stories:', error);
    }
}

// عرض القصص
function displayStories(storiesData) {
    const container = document.getElementById('storiesContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (storiesData.length === 0) {
        container.innerHTML = '<div class="no-content">لا توجد قصص حالياً</div>';
        return;
    }
    
    storiesData.forEach(story => {
        const storyElement = createStoryElement(story);
        container.appendChild(storyElement);
    });
}

// إنشاء عنصر قصة
function createStoryElement(story) {
    const storyDiv = document.createElement('div');
    storyDiv.className = 'story-item';
    storyDiv.onclick = () => viewStory(story);
    
    const timeString = formatTime(story.timestamp);
    
    let mediaElement = '';
    if (story.image) {
        mediaElement = `<img src="${story.image}" alt="قصة ${story.display_name}">`;
    } else if (story.video) {
        mediaElement = `<video><source src="${story.video}" type="video/mp4"></video>`;
    }
    
    storyDiv.innerHTML = `
        ${mediaElement}
        <div class="story-overlay">
            <div class="story-author">${escapeHtml(story.display_name)}</div>
            <div class="story-time">${timeString}</div>
        </div>
    `;
    
    return storyDiv;
}

// عرض قصة
function viewStory(story) {
    document.getElementById('storyUserName').textContent = story.display_name;
    document.getElementById('storyUserAvatar').src = story.profile_image1 || getDefaultAvatar(story.display_name);
    document.getElementById('storyTime').textContent = formatTime(story.timestamp);
    
    const storyImage = document.getElementById('storyImage');
    const storyVideo = document.getElementById('storyVideo');
    const storyText = document.getElementById('storyText');
    
    // إخفاء جميع عناصر الوسائط
    storyImage.style.display = 'none';
    storyVideo.style.display = 'none';
    
    if (story.image) {
        storyImage.src = story.image;
        storyImage.style.display = 'block';
    } else if (story.video) {
        storyVideo.src = story.video;
        storyVideo.style.display = 'block';
    }
    
    if (story.text) {
        storyText.textContent = story.text;
        storyText.style.display = 'block';
    } else {
        storyText.style.display = 'none';
    }
    
    // عرض المودال
    document.getElementById('viewStoryModal').classList.add('show');
    
    // بدء شريط التقدم
    startStoryProgress();
}

// بدء شريط تقدم القصة
function startStoryProgress() {
    const progressBar = document.getElementById('storyProgress');
    let progress = 0;
    const duration = 5000; // 5 ثوان
    const interval = 50; // تحديث كل 50ms
    const increment = (interval / duration) * 100;
    
    const progressInterval = setInterval(() => {
        progress += increment;
        progressBar.style.width = `${progress}%`;
        
        if (progress >= 100) {
            clearInterval(progressInterval);
            closeViewStoryModal();
        }
    }, interval);
    
    // حفظ المعرف لإمكانية إيقافه
    progressBar.dataset.intervalId = progressInterval;
}

// إغلاق عارض القصة
function closeViewStoryModal() {
    const modal = document.getElementById('viewStoryModal');
    modal.classList.remove('show');
    
    // إيقاف شريط التقدم
    const progressBar = document.getElementById('storyProgress');
    const intervalId = progressBar.dataset.intervalId;
    if (intervalId) {
        clearInterval(intervalId);
        progressBar.style.width = '0%';
    }
    
    // إيقاف الفيديو إذا كان يعمل
    const storyVideo = document.getElementById('storyVideo');
    if (storyVideo) {
        storyVideo.pause();
        storyVideo.currentTime = 0;
    }
}

// فتح مودال إضافة قصة
function openAddStoryModal() {
    document.getElementById('addStoryModal').classList.add('show');
}

// إغلاق مودال إضافة قصة
function closeAddStoryModal() {
    document.getElementById('addStoryModal').classList.remove('show');
    document.getElementById('storyMediaInput').value = '';
    document.getElementById('storyTextInput').value = '';
}

// إضافة قصة
async function addStory() {
    const mediaFile = document.getElementById('storyMediaInput').files[0];
    const text = document.getElementById('storyTextInput').value.trim();
    
    if (!mediaFile && !text) {
        showError('يرجى اختيار صورة/فيديو أو إدخال نص');
        return;
    }
    
    const formData = new FormData();
    if (mediaFile) formData.append('media', mediaFile);
    if (text) formData.append('text', text);
    
    showLoading(true);
    
    try {
        const response = await fetch('/api/stories', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('chatToken')}`
            },
            body: formData
        });
        
        if (response.ok) {
            const story = await response.json();
            closeAddStoryModal();
            showToast('تم إضافة القصة بنجاح', 'success');
            
            // إشعار Socket.IO بالقصة الجديدة
            if (socket) {
                socket.emit('newStory', story);
            }
        } else {
            const data = await response.json();
            showError(data.error || 'خطأ في إضافة القصة');
        }
    } catch (error) {
        console.error('Error adding story:', error);
        showError('خطأ في إضافة القصة');
    } finally {
        showLoading(false);
    }
}

// معالجة قصة جديدة
function handleNewStory(story) {
    const container = document.getElementById('storiesContainer');
    if (!container) return;
    
    // إزالة رسالة "لا توجد قصص" إذا كانت موجودة
    const noContent = container.querySelector('.no-content');
    if (noContent) {
        noContent.remove();
    }
    
    const storyElement = createStoryElement(story);
    container.insertBefore(storyElement, container.firstChild);
    
    showToast('قصة جديدة تم إضافتها', 'info');
}

// تحميل الأصدقاء
async function loadFriends() {
    try {
        const response = await fetch('/api/all-users-chat', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('chatToken')}`
            }
        });
        
        if (response.ok) {
            const users = await response.json();
            displayFriends(users);
        }
    } catch (error) {
        console.error('Error loading friends:', error);
    }
}

// عرض الأصدقاء
function displayFriends(users) {
    const container = document.getElementById('friendsContent');
    if (!container) return;
    
    // تصفية المستخدمين (إزالة المستخدم الحالي)
    const filteredUsers = users.filter(user => user.id !== currentUser?.id);
    
    container.innerHTML = '';
    
    if (filteredUsers.length === 0) {
        container.innerHTML = '<div class="no-content">لا يوجد مستخدمون</div>';
        return;
    }
    
    filteredUsers.forEach(user => {
        const friendElement = createFriendElement(user);
        container.appendChild(friendElement);
    });
}

// إنشاء عنصر صديق
function createFriendElement(user) {
    const friendDiv = document.createElement('div');
    friendDiv.className = 'friend-item';
    
    const rank = RANKS[user.rank] || RANKS.visitor;
    const statusText = user.is_online ? 'متصل الآن' : 'غير متصل';
    const statusClass = user.is_online ? 'online' : 'offline';
    
    let userInfo = '';
    if (user.age) userInfo += `العمر: ${user.age} `;
    if (user.gender) userInfo += `الجنس: ${user.gender} `;
    if (user.marital_status) userInfo += `الحالة: ${user.marital_status}`;
    
    friendDiv.innerHTML = `
        <div class="friend-info">
            <img src="${user.profile_image1 || getDefaultAvatar(user.display_name)}" alt="${user.display_name}" class="friend-avatar">
            <div class="friend-details">
                <h4>${escapeHtml(user.display_name)}</h4>
                <div class="friend-status ${statusClass}">${statusText}</div>
                <div class="friend-rank rank-${user.rank}" style="color: ${rank.color}">
                    ${rank.emoji} ${rank.name}
                </div>
                ${userInfo ? `<div class="friend-info-text">${userInfo}</div>` : ''}
                ${user.about_me ? `<div class="friend-about">${escapeHtml(user.about_me)}</div>` : ''}
            </div>
        </div>
        <div class="friend-actions">
            <button class="friend-action-btn message-btn" onclick="openPrivateChat(${JSON.stringify(user).replace(/"/g, '&quot;')})">
                <i class="fas fa-comment"></i> رسالة
            </button>
            <button class="friend-action-btn profile-btn" onclick="viewUserProfile(${user.id})">
                <i class="fas fa-user"></i> الملف الشخصي
            </button>
        </div>
    `;
    
    return friendDiv;
}

// عرض تبويبات الأصدقاء
function showFriendsTab(tabName) {
    // تحديث الأزرار
    document.querySelectorAll('.friends-tabs .tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    event.target.classList.add('active');
    
    // تحميل المحتوى حسب التبويب
    switch (tabName) {
        case 'all':
            loadFriends();
            break;
        case 'friends':
            loadActualFriends();
            break;
        case 'requests':
            loadFriendRequests();
            break;
    }
}

// تحميل الأصدقاء الفعليين
async function loadActualFriends() {
    try {
        const response = await fetch('/api/friends', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('chatToken')}`
            }
        });
        
        if (response.ok) {
            const friends = await response.json();
            displayActualFriends(friends);
        }
    } catch (error) {
        console.error('Error loading actual friends:', error);
    }
}

// عرض الأصدقاء الفعليين
function displayActualFriends(friends) {
    const container = document.getElementById('friendsContent');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (friends.length === 0) {
        container.innerHTML = '<div class="no-content">لا يوجد أصدقاء حالياً</div>';
        return;
    }
    
    friends.forEach(friend => {
        const friendElement = createActualFriendElement(friend);
        container.appendChild(friendElement);
    });
}

// إنشاء عنصر صديق فعلي
function createActualFriendElement(friend) {
    const friendDiv = document.createElement('div');
    friendDiv.className = 'friend-item';
    
    const rank = RANKS[friend.rank] || RANKS.visitor;
    
    friendDiv.innerHTML = `
        <div class="friend-info">
            <img src="${friend.profile_image1 || getDefaultAvatar(friend.display_name)}" alt="${friend.display_name}" class="friend-avatar">
            <div class="friend-details">
                <h4>${escapeHtml(friend.display_name)}</h4>
                <div class="friend-rank rank-${friend.rank}" style="color: ${rank.color}">
                    ${rank.emoji} ${rank.name}
                </div>
            </div>
        </div>
        <div class="friend-actions">
            <button class="friend-action-btn message-btn" onclick="openPrivateChat(${JSON.stringify(friend).replace(/"/g, '&quot;')})">
                <i class="fas fa-comment"></i> رسالة
            </button>
            <button class="friend-action-btn remove-btn" onclick="removeFriend(${friend.id})">
                <i class="fas fa-user-minus"></i> إزالة
            </button>
        </div>
    `;
    
    return friendDiv;
}

// تحميل طلبات الصداقة
async function loadFriendRequests() {
    try {
        const response = await fetch('/api/friend-requests', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('chatToken')}`
            }
        });
        
        if (response.ok) {
            const requests = await response.json();
            displayFriendRequests(requests);
        }
    } catch (error) {
        console.error('Error loading friend requests:', error);
    }
}

// عرض طلبات الصداقة
function displayFriendRequests(requests) {
    const container = document.getElementById('friendsContent');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (requests.length === 0) {
        container.innerHTML = '<div class="no-content">لا توجد طلبات صداقة</div>';
        return;
    }
    
    requests.forEach(request => {
        const requestElement = createFriendRequestElement(request);
        container.appendChild(requestElement);
    });
}

// إنشاء عنصر طلب صداقة
function createFriendRequestElement(request) {
    const requestDiv = document.createElement('div');
    requestDiv.className = 'friend-item';
    
    const rank = RANKS[request.rank] || RANKS.visitor;
    
    requestDiv.innerHTML = `
        <div class="friend-info">
            <img src="${request.profile_image1 || getDefaultAvatar(request.display_name)}" alt="${request.display_name}" class="friend-avatar">
            <div class="friend-details">
                <h4>${escapeHtml(request.display_name)}</h4>
                <div class="friend-rank rank-${request.rank}" style="color: ${rank.color}">
                    ${rank.emoji} ${rank.name}
                </div>
                <div class="friend-status">طلب صداقة</div>
            </div>
        </div>
        <div class="friend-actions">
            <button class="friend-action-btn accept-btn" onclick="acceptFriendRequest(${request.id})">
                <i class="fas fa-check"></i> قبول
            </button>
            <button class="friend-action-btn decline-btn" onclick="declineFriendRequest(${request.id})">
                <i class="fas fa-times"></i> رفض
            </button>
        </div>
    `;
    
    return requestDiv;
}

// قبول طلب صداقة
async function acceptFriendRequest(requestId) {
    try {
        const response = await fetch(`/api/friend-requests/${requestId}/accept`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('chatToken')}`
            }
        });
        
        if (response.ok) {
            showToast('تم قبول طلب الصداقة', 'success');
            loadFriendRequests(); // إعادة تحميل الطلبات
        }
    } catch (error) {
        console.error('Error accepting friend request:', error);
        showError('خطأ في قبول طلب الصداقة');
    }
}

// رفض طلب صداقة
async function declineFriendRequest(requestId) {
    try {
        const response = await fetch(`/api/friend-requests/${requestId}/decline`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('chatToken')}`
            }
        });
        
        if (response.ok) {
            showToast('تم رفض طلب الصداقة', 'success');
            loadFriendRequests(); // إعادة تحميل الطلبات
        }
    } catch (error) {
        console.error('Error declining friend request:', error);
        showError('خطأ في رفض طلب الصداقة');
    }
}

// إزالة صديق
async function removeFriend(friendId) {
    if (!confirm('هل أنت متأكد من إزالة هذا الصديق؟')) return;
    
    try {
        const response = await fetch(`/api/friends/${friendId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('chatToken')}`
            }
        });
        
        if (response.ok) {
            showToast('تم إزالة الصديق', 'success');
            loadActualFriends(); // إعادة تحميل الأصدقاء
        }
    } catch (error) {
        console.error('Error removing friend:', error);
        showError('خطأ في إزالة الصديق');
    }
}

// إرسال رسالة مساعدة
async function sendHelpMessage() {
    const message = document.getElementById('helpMessage').value.trim();
    
    if (!message) {
        showError('يرجى كتابة رسالتك');
        return;
    }
    
    try {
        const response = await fetch('/api/help', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('chatToken')}`
            },
            body: JSON.stringify({ message })
        });
        
        if (response.ok) {
            document.getElementById('helpMessage').value = '';
            showToast('تم إرسال رسالتك للإدارة', 'success');
        } else {
            const data = await response.json();
            showError(data.error || 'خطأ في إرسال الرسالة');
        }
    } catch (error) {
        console.error('Error sending help message:', error);
        showError('خطأ في إرسال الرسالة');
    }
}

// فتح الملف الشخصي
function openProfileModal() {
    loadProfileData();
    document.getElementById('profileModal').classList.add('show');
}

// إغلاق الملف الشخصي
function closeProfileModal() {
    document.getElementById('profileModal').classList.remove('show');
}

// تحميل بيانات الملف الشخصي
async function loadProfileData() {
    try {
        const response = await fetch('/api/user/profile', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('chatToken')}`
            }
        });
        
        if (response.ok) {
            const user = await response.json();
            populateProfileForm(user);
        }
    } catch (error) {
        console.error('Error loading profile data:', error);
    }
}

// ملء نموذج الملف الشخصي
function populateProfileForm(user) {
    // الصور الشخصية
    if (user.profile_image1) {
        document.getElementById('profileImg1').src = user.profile_image1;
    }
    if (user.profile_image2) {
        document.getElementById('profileImg2').src = user.profile_image2;
    }
    
    // المعلومات الأساسية
    document.getElementById('displayNameInput').value = user.display_name || '';
    document.getElementById('ageInput').value = user.age || '';
    document.getElementById('genderInput').value = user.gender || '';
    document.getElementById('maritalStatusInput').value = user.marital_status || '';
    document.getElementById('aboutMeInput').value = user.about_me || '';
    
    // إعدادات الخصوصية
    document.getElementById('dmPrivacySelect').value = user.privacy_mode || 'everyone';
    document.getElementById('showLastSeenToggle').checked = user.show_last_seen !== false;
    
    // الموسيقى
    if (user.profile_music) {
        const audio = document.getElementById('profileAudio');
        audio.src = user.profile_music;
        audio.style.display = 'block';
    }
}

// عرض تبويبات الملف الشخصي
function showProfileTab(tabName) {
    // إخفاء جميع التبويبات
    document.querySelectorAll('.profile-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // إزالة الفئة النشطة من جميع الأزرار
    document.querySelectorAll('.profile-tabs .tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // عرض التبويب المحدد
    document.getElementById(`profile${tabName.charAt(0).toUpperCase() + tabName.slice(1)}Tab`).classList.add('active');
    
    // تفعيل الزر المحدد
    event.target.classList.add('active');
}

// تحديث الملف الشخصي
async function updateProfile() {
    const formData = new FormData();
    
    // المعلومات الأساسية
    const displayName = document.getElementById('displayNameInput').value.trim();
    const age = document.getElementById('ageInput').value;
    const gender = document.getElementById('genderInput').value;
    const maritalStatus = document.getElementById('maritalStatusInput').value;
    const aboutMe = document.getElementById('aboutMeInput').value.trim();
    
    if (displayName) formData.append('display_name', displayName);
    if (age) formData.append('age', age);
    if (gender) formData.append('gender', gender);
    if (maritalStatus) formData.append('marital_status', maritalStatus);
    if (aboutMe) formData.append('about_me', aboutMe);
    
    // الصور الشخصية
    const profileFile1 = document.getElementById('profileFile1').files[0];
    const profileFile2 = document.getElementById('profileFile2').files[0];
    
    if (profileFile1) formData.append('profile1', profileFile1);
    if (profileFile2) formData.append('profile2', profileFile2);
    
    showLoading(true);
    
    try {
        const response = await fetch('/api/upload-profile-images', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('chatToken')}`
            },
            body: formData
        });
        
        if (response.ok) {
            const data = await response.json();
            
            // تحديث المعلومات الشخصية
            await updatePersonalInfo();
            
            showToast('تم تحديث الملف الشخصي بنجاح', 'success');
            
            // تحديث المستخدم الحالي
            if (data.profile_image1) currentUser.profile_image1 = data.profile_image1;
            if (data.profile_image2) currentUser.profile_image2 = data.profile_image2;
            
            // تحديث الواجهة
            updateUserInterface();
        } else {
            const data = await response.json();
            showError(data.error || 'خطأ في تحديث الملف الشخصي');
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        showError('خطأ في تحديث الملف الشخصي');
    } finally {
        showLoading(false);
    }
}

// تحديث المعلومات الشخصية
async function updatePersonalInfo() {
    const personalInfo = {
        age: document.getElementById('ageInput').value || null,
        gender: document.getElementById('genderInput').value || null,
        marital_status: document.getElementById('maritalStatusInput').value || null,
        about_me: document.getElementById('aboutMeInput').value.trim() || null
    };
    
    try {
        const response = await fetch('/api/user/personal-info', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('chatToken')}`
            },
            body: JSON.stringify(personalInfo)
        });
        
        if (response.ok) {
            // تحديث المستخدم الحالي
            Object.assign(currentUser, personalInfo);
        }
    } catch (error) {
        console.error('Error updating personal info:', error);
    }
}

// رفع خلفية الرسائل
async function uploadMessageBackground() {
    const file = document.getElementById('messageBackgroundInput').files[0];
    
    if (!file) {
        showError('يرجى اختيار صورة');
        return;
    }
    
    const formData = new FormData();
    formData.append('messageBackground', file);
    
    showLoading(true);
    
    try {
        const response = await fetch('/api/user/message-background', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('chatToken')}`
            },
            body: formData
        });
        
        if (response.ok) {
            const data = await response.json();
            showToast('تم تحديث خلفية الرسائل', 'success');
            
            // تحديث المستخدم الحالي
            currentUser.message_background = data.message_background;
        } else {
            const data = await response.json();
            showError(data.error || 'خطأ في رفع خلفية الرسائل');
        }
    } catch (error) {
        console.error('Error uploading message background:', error);
        showError('خطأ في رفع خلفية الرسائل');
    } finally {
        showLoading(false);
    }
}

// تحديث زخرفة الاسم
async function updateNameDecoration() {
    const decoration = document.getElementById('nameDecorationSelect').value;
    
    try {
        const response = await fetch('/api/user/name-decoration', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('chatToken')}`
            },
            body: JSON.stringify({ decoration })
        });
        
        if (response.ok) {
            showToast('تم تحديث زخرفة الاسم', 'success');
            
            // تحديث المستخدم الحالي
            currentUser.name_decoration = decoration;
            
            // تحديث الواجهة
            updateUserInterface();
        } else {
            const data = await response.json();
            showError(data.error || 'خطأ في تحديث زخرفة الاسم');
        }
    } catch (error) {
        console.error('Error updating name decoration:', error);
        showError('خطأ في تحديث زخرفة الاسم');
    }
}

// تحديث إعدادات الخصوصية
async function updatePrivacySettings() {
    const privacySettings = {
        privacy_mode: document.getElementById('dmPrivacySelect').value,
        show_last_seen: document.getElementById('showLastSeenToggle').checked
    };
    
    try {
        const response = await fetch('/api/user/privacy', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('chatToken')}`
            },
            body: JSON.stringify(privacySettings)
        });
        
        if (response.ok) {
            showToast('تم تحديث إعدادات الخصوصية', 'success');
            
            // تحديث المستخدم الحالي
            Object.assign(currentUser, privacySettings);
        } else {
            const data = await response.json();
            showError(data.error || 'خطأ في تحديث إعدادات الخصوصية');
        }
    } catch (error) {
        console.error('Error updating privacy settings:', error);
        showError('خطأ في تحديث إعدادات الخصوصية');
    }
}

// رفع موسيقى البروفايل
async function uploadProfileMusic() {
    const file = document.getElementById('profileMusicInput').files[0];
    
    if (!file) {
        showError('يرجى اختيار ملف صوتي');
        return;
    }
    
    if (!file.type.startsWith('audio/')) {
        showError('يرجى اختيار ملف صوتي صحيح');
        return;
    }
    
    const formData = new FormData();
    formData.append('music', file);
    
    showLoading(true);
    
    try {
        const response = await fetch('/api/user/profile-music', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('chatToken')}`
            },
            body: formData
        });
        
        if (response.ok) {
            const data = await response.json();
            showToast('تم رفع موسيقى البروفايل', 'success');
            
            // تحديث المستخدم الحالي
            currentUser.profile_music = data.music_url;
            
            // تحديث عنصر الصوت
            const audio = document.getElementById('profileAudio');
            audio.src = data.music_url;
            audio.style.display = 'block';
        } else {
            const data = await response.json();
            showError(data.error || 'خطأ في رفع موسيقى البروفايل');
        }
    } catch (error) {
        console.error('Error uploading profile music:', error);
        showError('خطأ في رفع موسيقى البروفايل');
    } finally {
        showLoading(false);
    }
}

// إزالة موسيقى البروفايل
async function removeProfileMusic() {
    if (!confirm('هل أنت متأكد من إزالة موسيقى البروفايل؟')) return;
    
    try {
        const response = await fetch('/api/user/profile-music', {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('chatToken')}`
            }
        });
        
        if (response.ok) {
            showToast('تم إزالة موسيقى البروفايل', 'success');
            
            // تحديث المستخدم الحالي
            currentUser.profile_music = null;
            
            // إخفاء عنصر الصوت
            const audio = document.getElementById('profileAudio');
            audio.style.display = 'none';
            audio.src = '';
        } else {
            const data = await response.json();
            showError(data.error || 'خطأ في إزالة موسيقى البروفايل');
        }
    } catch (error) {
        console.error('Error removing profile music:', error);
        showError('خطأ في إزالة موسيقى البروفايل');
    }
}

// فتح لوحة الإدارة
function openAdminPanel() {
    loadAdminData();
    document.getElementById('adminModal').classList.add('show');
}

// إغلاق لوحة الإدارة
function closeAdminModal() {
    document.getElementById('adminModal').classList.remove('show');
}

// تحميل بيانات الإدارة
async function loadAdminData() {
    await loadAllUsers();
    await loadRanks();
    await loadBannedUsers();
    await loadMutedUsers();
    await loadHelpMessages();
}

// تحميل جميع المستخدمين
async function loadAllUsers() {
    try {
        const response = await fetch('/api/all-users', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('chatToken')}`
            }
        });
        
        if (response.ok) {
            const users = await response.json();
            displayAdminUsers(users);
        }
    } catch (error) {
        console.error('Error loading all users:', error);
    }
}

// عرض المستخدمين في لوحة الإدارة
function displayAdminUsers(users) {
    const container = document.getElementById('adminUsersList');
    if (!container) return;
    
    container.innerHTML = '';
    
    users.forEach(user => {
        if (user.id === currentUser?.id) return; // تجاهل المستخدم الحالي
        
        const userElement = createAdminUserElement(user);
        container.appendChild(userElement);
    });
}

// إنشاء عنصر مستخدم في لوحة الإدارة
function createAdminUserElement(user) {
    const userDiv = document.createElement('div');
    userDiv.className = 'admin-user-item';
    
    const rank = RANKS[user.rank] || RANKS.visitor;
    const statusText = user.is_online ? 'متصل' : 'غير متصل';
    const statusClass = user.is_online ? 'online' : 'offline';
    
    userDiv.innerHTML = `
        <div class="admin-user-info">
            <img src="${user.profile_image1 || getDefaultAvatar(user.display_name)}" alt="${user.display_name}" class="admin-user-avatar">
            <div class="admin-user-details">
                <h4>${escapeHtml(user.display_name)}</h4>
                <div class="admin-user-email">${escapeHtml(user.email)}</div>
                <div class="admin-user-rank rank-${user.rank}" style="color: ${rank.color}">
                    ${rank.emoji} ${rank.name}
                </div>
                <div class="admin-user-status ${statusClass}">${statusText}</div>
                <div class="admin-user-joined">انضم: ${formatDate(user.created_at)}</div>
            </div>
        </div>
        <div class="admin-user-actions">
            <button class="admin-action-btn rank-btn" onclick="openAssignRankModal(${user.id}, '${escapeHtml(user.display_name)}')">
                <i class="fas fa-crown"></i> رتبة
            </button>
            <button class="admin-action-btn mute-btn" onclick="openMuteModal(${user.id}, '${escapeHtml(user.display_name)}')">
                <i class="fas fa-volume-mute"></i> كتم
            </button>
            <button class="admin-action-btn ban-btn" onclick="openBanModal(${user.id}, '${escapeHtml(user.display_name)}')">
                <i class="fas fa-ban"></i> حظر
            </button>
            <button class="admin-action-btn profile-btn" onclick="viewUserProfile(${user.id})">
                <i class="fas fa-user"></i> ملف شخصي
            </button>
        </div>
    `;
    
    return userDiv;
}

// عرض تبويبات الإدارة
function showAdminTab(tabName) {
    // إخفاء جميع التبويبات
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // إزالة الفئة النشطة من جميع الأزرار
    document.querySelectorAll('.admin-tabs .tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // عرض التبويب المحدد
    document.getElementById(`admin${tabName.charAt(0).toUpperCase() + tabName.slice(1)}Tab`).classList.add('active');
    
    // تفعيل الزر المحدد
    event.target.classList.add('active');
}

// تحميل الرتب
async function loadRanks() {
    try {
        const response = await fetch('/api/ranks', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('chatToken')}`
            }
        });
        
        if (response.ok) {
            const ranks = await response.json();
            displayRanks(ranks);
        }
    } catch (error) {
        console.error('Error loading ranks:', error);
    }
}

// عرض الرتب
function displayRanks(ranks) {
    const container = document.getElementById('ranksList');
    if (!container) return;
    
    container.innerHTML = '';
    
    Object.entries(ranks).forEach(([key, rank]) => {
        const rankElement = document.createElement('div');
        rankElement.className = 'rank-item';
        
        rankElement.innerHTML = `
            <div class="rank-emoji">${rank.emoji}</div>
            <div class="rank-name">${rank.name}</div>
            <div class="rank-level">المستوى: ${rank.level}</div>
        `;
        
        container.appendChild(rankElement);
    });
}

// فتح مودال تعيين الرتبة
function openAssignRankModal(userId, userName) {
    document.getElementById('targetUserName').textContent = userName;
    document.getElementById('assignRankModal').setAttribute('data-user-id', userId);
    
    // ملء قائمة الرتب
    const rankSelect = document.getElementById('rankSelect');
    rankSelect.innerHTML = '<option value="">اختر الرتبة</option>';
    
    Object.entries(RANKS).forEach(([key, rank]) => {
        // منع تعيين رتبة البرنس إلا لصاحب الشات
        if (key === 'prince' && currentUser?.email !== 'njdj9985@mail.com') {
            return;
        }
        
        const option = document.createElement('option');
        option.value = key;
        option.textContent = `${rank.emoji} ${rank.name}`;
        rankSelect.appendChild(option);
    });
    
    document.getElementById('assignRankModal').classList.add('show');
}

// إغلاق مودال تعيين الرتبة
function closeAssignRankModal() {
    document.getElementById('assignRankModal').classList.remove('show');
    document.getElementById('rankSelect').value = '';
    document.getElementById('rankReason').value = '';
}

// تأكيد تعيين الرتبة
async function confirmAssignRank() {
    const modal = document.getElementById('assignRankModal');
    const userId = modal.getAttribute('data-user-id');
    const newRank = document.getElementById('rankSelect').value;
    const reason = document.getElementById('rankReason').value.trim();
    
    if (!newRank) {
        showError('يرجى اختيار رتبة');
        return;
    }
    
    try {
        const response = await fetch('/api/assign-rank', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('chatToken')}`
            },
            body: JSON.stringify({
                userId: parseInt(userId),
                newRank,
                reason
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            closeAssignRankModal();
            showToast(data.message, 'success');
            
            // إعادة تحميل المستخدمين
            loadAllUsers();
        } else {
            const data = await response.json();
            showError(data.error || 'خطأ في تعيين الرتبة');
        }
    } catch (error) {
        console.error('Error assigning rank:', error);
        showError('خطأ في تعيين الرتبة');
    }
}

// فتح مودال الحظر
function openBanModal(userId, userName) {
    // يمكن إضافة مودال مخصص للحظر هنا
    const reason = prompt(`سبب حظر ${userName}:`);
    if (!reason) return;
    
    const duration = prompt('مدة الحظر (1h, 24h, 7d, permanent):');
    if (!duration) return;
    
    banUser(userId, reason, duration);
}

// حظر مستخدم
async function banUser(userId, reason, duration) {
    try {
        const response = await fetch('/api/ban', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('chatToken')}`
            },
            body: JSON.stringify({
                userId: parseInt(userId),
                reason,
                duration
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            showToast(data.message, 'success');
            
            // إعادة تحميل البيانات
            loadAllUsers();
            loadBannedUsers();
        } else {
            const data = await response.json();
            showError(data.error || 'خطأ في حظر المستخدم');
        }
    } catch (error) {
        console.error('Error banning user:', error);
        showError('خطأ في حظر المستخدم');
    }
}

// فتح مودال الكتم
function openMuteModal(userId, userName) {
    // يمكن إضافة مودال مخصص للكتم هنا
    const reason = prompt(`سبب كتم ${userName}:`);
    if (!reason) return;
    
    const duration = prompt('مدة الكتم (1h, 24h, 7d, permanent):');
    if (!duration) return;
    
    muteUser(userId, reason, duration);
}

// كتم مستخدم
async function muteUser(userId, reason, duration) {
    try {
        const response = await fetch('/api/mute', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('chatToken')}`
            },
            body: JSON.stringify({
                userId: parseInt(userId),
                reason,
                duration
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            showToast(data.message, 'success');
            
            // إعادة تحميل البيانات
            loadAllUsers();
            loadMutedUsers();
        } else {
            const data = await response.json();
            showError(data.error || 'خطأ في كتم المستخدم');
        }
    } catch (error) {
        console.error('Error muting user:', error);
        showError('خطأ في كتم المستخدم');
    }
}

// تحميل المستخدمين المحظورين
async function loadBannedUsers() {
    try {
        const response = await fetch('/api/banned-users', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('chatToken')}`
            }
        });
        
        if (response.ok) {
            const bannedUsers = await response.json();
            displayBannedUsers(bannedUsers);
        }
    } catch (error) {
        console.error('Error loading banned users:', error);
    }
}

// عرض المستخدمين المحظورين
function displayBannedUsers(bannedUsers) {
    const container = document.getElementById('bannedUsersList');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (bannedUsers.length === 0) {
        container.innerHTML = '<div class="no-content">لا يوجد مستخدمون محظورون</div>';
        return;
    }
    
    bannedUsers.forEach(ban => {
        const banElement = document.createElement('div');
        banElement.className = 'ban-item';
        
        banElement.innerHTML = `
            <div class="ban-info">
                <h4>${escapeHtml(ban.display_name)}</h4>
                <div class="ban-reason">السبب: ${escapeHtml(ban.reason)}</div>
                <div class="ban-duration">المدة: ${ban.duration}</div>
                <div class="ban-date">تاريخ الحظر: ${formatDate(ban.timestamp)}</div>
            </div>
            <div class="ban-actions">
                <button class="admin-action-btn" onclick="unbanUser(${ban.user_id})">
                    <i class="fas fa-unlock"></i> إلغاء الحظر
                </button>
            </div>
        `;
        
        container.appendChild(banElement);
    });
}

// إلغاء حظر مستخدم
async function unbanUser(userId) {
    if (!confirm('هل أنت متأكد من إلغاء حظر هذا المستخدم؟')) return;
    
    try {
        const response = await fetch(`/api/unban/${userId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('chatToken')}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            showToast(data.message, 'success');
            
            // إعادة تحميل البيانات
            loadBannedUsers();
        } else {
            const data = await response.json();
            showError(data.error || 'خطأ في إلغاء الحظر');
        }
    } catch (error) {
        console.error('Error unbanning user:', error);
        showError('خطأ في إلغاء الحظر');
    }
}

// تحميل المستخدمين المكتومين
async function loadMutedUsers() {
    try {
        const response = await fetch('/api/muted-users', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('chatToken')}`
            }
        });
        
        if (response.ok) {
            const mutedUsers = await response.json();
            displayMutedUsers(mutedUsers);
        }
    } catch (error) {
        console.error('Error loading muted users:', error);
    }
}

// عرض المستخدمين المكتومين
function displayMutedUsers(mutedUsers) {
    const container = document.getElementById('mutedUsersList');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (mutedUsers.length === 0) {
        container.innerHTML = '<div class="no-content">لا يوجد مستخدمون مكتومون</div>';
        return;
    }
    
    mutedUsers.forEach(mute => {
        const muteElement = document.createElement('div');
        muteElement.className = 'mute-item';
        
        muteElement.innerHTML = `
            <div class="mute-info">
                <h4>${escapeHtml(mute.display_name)}</h4>
                <div class="mute-reason">السبب: ${escapeHtml(mute.reason)}</div>
                <div class="mute-duration">المدة: ${mute.duration}</div>
                <div class="mute-date">تاريخ الكتم: ${formatDate(mute.timestamp)}</div>
            </div>
            <div class="mute-actions">
                <button class="admin-action-btn" onclick="unmuteUser(${mute.user_id})">
                    <i class="fas fa-volume-up"></i> إلغاء الكتم
                </button>
            </div>
        `;
        
        container.appendChild(muteElement);
    });
}

// إلغاء كتم مستخدم
async function unmuteUser(userId) {
    if (!confirm('هل أنت متأكد من إلغاء كتم هذا المستخدم؟')) return;
    
    try {
        const response = await fetch(`/api/unmute/${userId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('chatToken')}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            showToast(data.message, 'success');
            
            // إعادة تحميل البيانات
            loadMutedUsers();
        } else {
            const data = await response.json();
            showError(data.error || 'خطأ في إلغاء الكتم');
        }
    } catch (error) {
        console.error('Error unmuting user:', error);
        showError('خطأ في إلغاء الكتم');
    }
}

// تحميل رسائل المساعدة
async function loadHelpMessages() {
    try {
        const response = await fetch('/api/help-messages', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('chatToken')}`
            }
        });
        
        if (response.ok) {
            const messages = await response.json();
            displayHelpMessages(messages);
        }
    } catch (error) {
        console.error('Error loading help messages:', error);
    }
}

// عرض رسائل المساعدة
function displayHelpMessages(messages) {
    const container = document.getElementById('helpMessagesList');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (messages.length === 0) {
        container.innerHTML = '<div class="no-content">لا توجد رسائل مساعدة</div>';
        return;
    }
    
    messages.forEach(message => {
        const messageElement = document.createElement('div');
        messageElement.className = 'help-message-item';
        
        messageElement.innerHTML = `
            <div class="help-message-info">
                <h4>من: ${escapeHtml(message.display_name)}</h4>
                <div class="help-message-email">${escapeHtml(message.email)}</div>
                <div class="help-message-date">${formatDate(message.timestamp)}</div>
            </div>
            <div class="help-message-content">
                ${escapeHtml(message.message)}
            </div>
            <div class="help-message-actions">
                <button class="admin-action-btn" onclick="replyToHelpMessage(${message.id}, '${escapeHtml(message.email)}')">
                    <i class="fas fa-reply"></i> رد
                </button>
                <button class="admin-action-btn" onclick="deleteHelpMessage(${message.id})">
                    <i class="fas fa-trash"></i> حذف
                </button>
            </div>
        `;
        
        container.appendChild(messageElement);
    });
}

// الرد على رسالة مساعدة
function replyToHelpMessage(messageId, userEmail) {
    const reply = prompt('اكتب ردك:');
    if (!reply) return;
    
    // يمكن إضافة API للرد على رسائل المساعدة
    showToast('تم إرسال الرد', 'success');
}

// حذف رسالة مساعدة
async function deleteHelpMessage(messageId) {
    if (!confirm('هل أنت متأكد من حذف هذه الرسالة؟')) return;
    
    try {
        const response = await fetch(`/api/help-messages/${messageId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('chatToken')}`
            }
        });
        
        if (response.ok) {
            showToast('تم حذف الرسالة', 'success');
            loadHelpMessages();
        } else {
            const data = await response.json();
            showError(data.error || 'خطأ في حذف الرسالة');
        }
    } catch (error) {
        console.error('Error deleting help message:', error);
        showError('خطأ في حذف الرسالة');
    }
}

// فتح مودال إنشاء غرفة
function openCreateRoomModal() {
    document.getElementById('createRoomModal').classList.add('show');
}

// إغلاق مودال إنشاء غرفة
function closeCreateRoomModal() {
    document.getElementById('createRoomModal').classList.remove('show');
    document.getElementById('roomNameInput').value = '';
    document.getElementById('roomDescriptionInput').value = '';
    document.getElementById('roomBackgroundInput').value = '';
}

// إنشاء غرفة
async function createRoom() {
    const name = document.getElementById('roomNameInput').value.trim();
    const description = document.getElementById('roomDescriptionInput').value.trim();
    const backgroundFile = document.getElementById('roomBackgroundInput').files[0];
    
    if (!name) {
        showError('يرجى إدخال اسم الغرفة');
        return;
    }
    
    const formData = new FormData();
    formData.append('name', name);
    if (description) formData.append('description', description);
    if (backgroundFile) formData.append('roomBackground', backgroundFile);
    
    showLoading(true);
    
    try {
        const response = await fetch('/api/rooms', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('chatToken')}`
            },
            body: formData
        });
        
        if (response.ok) {
            const room = await response.json();
            closeCreateRoomModal();
            showToast('تم إنشاء الغرفة بنجاح', 'success');
            
            // إعادة تحميل الغرف
            loadRooms();
        } else {
            const data = await response.json();
            showError(data.error || 'خطأ في إنشاء الغرفة');
        }
    } catch (error) {
        console.error('Error creating room:', error);
        showError('خطأ في إنشاء الغرفة');
    } finally {
        showLoading(false);
    }
}

// عرض الملف الشخصي للمستخدم
async function viewUserProfile(userId) {
    try {
        const response = await fetch(`/api/user-info/${userId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('chatToken')}`
            }
        });
        
        if (response.ok) {
            const user = await response.json();
            displayUserProfileModal(user);
        } else {
            const data = await response.json();
            showError(data.error || 'خطأ في تحميل الملف الشخصي');
        }
    } catch (error) {
        console.error('Error viewing user profile:', error);
        showError('خطأ في تحميل الملف الشخصي');
    }
}

// عرض مودال الملف الشخصي للمستخدم
function displayUserProfileModal(user) {
    // يمكن إنشاء مودال مخصص لعرض ملف المستخدم
    const rank = RANKS[user.rank] || RANKS.visitor;
    
    let profileInfo = `
        الاسم: ${user.display_name}
        البريد الإلكتروني: ${user.email}
        الرتبة: ${rank.emoji} ${rank.name}
        الدور: ${user.role}
        متصل: ${user.is_online ? 'نعم' : 'لا'}
        تاريخ الانضمام: ${formatDate(user.created_at)}
    `;
    
    if (user.age) profileInfo += `\nالعمر: ${user.age}`;
    if (user.gender) profileInfo += `\nالجنس: ${user.gender}`;
    if (user.marital_status) profileInfo += `\nالحالة الاجتماعية: ${user.marital_status}`;
    if (user.about_me) profileInfo += `\nنبذة: ${user.about_me}`;
    
    alert(profileInfo);
}

// تهيئة منتقي الرموز التعبيرية
function initializeEmojiPicker() {
    const emojiGrid = document.getElementById('emojiGrid');
    if (!emojiGrid) return;
    
    emojiGrid.innerHTML = '';
    
    emojis.forEach(emoji => {
        const emojiElement = document.createElement('div');
        emojiElement.className = 'emoji-item';
        emojiElement.textContent = emoji;
        emojiElement.onclick = () => insertEmoji(emoji);
        
        emojiGrid.appendChild(emojiElement);
    });
}

// فتح منتقي الرموز التعبيرية
function openEmojiPicker() {
    document.getElementById('emojiModal').classList.add('show');
}

// إغلاق منتقي الرموز التعبيرية
function closeEmojiModal() {
    document.getElementById('emojiModal').classList.remove('show');
}

// إدراج رمز تعبيري
function insertEmoji(emoji) {
    const messageInput = document.getElementById('messageInput');
    const privateMessageInput = document.getElementById('privateMessageInput');
    
    // تحديد الحقل النشط
    let activeInput = null;
    if (document.activeElement === messageInput) {
        activeInput = messageInput;
    } else if (document.activeElement === privateMessageInput) {
        activeInput = privateMessageInput;
    } else {
        // افتراضياً استخدم حقل الرسائل العامة
        activeInput = messageInput;
    }
    
    if (activeInput) {
        const cursorPos = activeInput.selectionStart;
        const textBefore = activeInput.value.substring(0, cursorPos);
        const textAfter = activeInput.value.substring(activeInput.selectionEnd);
        
        activeInput.value = textBefore + emoji + textAfter;
        activeInput.selectionStart = activeInput.selectionEnd = cursorPos + emoji.length;
        activeInput.focus();
    }
    
    closeEmojiModal();
}

// فتح الإشعارات
function openNotifications() {
    loadNotifications();
    document.getElementById('notificationsModal').classList.add('show');
}

// إغلاق الإشعارات
function closeNotificationsModal() {
    document.getElementById('notificationsModal').classList.remove('show');
}

// تحميل الإشعارات
async function loadNotifications() {
    try {
        const response = await fetch('/api/notifications', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('chatToken')}`
            }
        });
        
        if (response.ok) {
            const notifications = await response.json();
            displayNotifications(notifications);
        }
    } catch (error) {
        console.error('Error loading notifications:', error);
    }
}

// عرض الإشعارات
function displayNotifications(notifications) {
    const container = document.getElementById('notificationsList');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (notifications.length === 0) {
        container.innerHTML = '<div class="no-content">لا توجد إشعارات</div>';
        return;
    }
    
    notifications.forEach(notification => {
        const notificationElement = document.createElement('div');
        notificationElement.className = `notification-item ${notification.read ? '' : 'unread'}`;
        
        notificationElement.innerHTML = `
            <div class="notification-icon">
                <i class="fas fa-${getNotificationIcon(notification.type)}"></i>
            </div>
            <div class="notification-content">
                <div class="notification-title">${escapeHtml(notification.title)}</div>
                <div class="notification-message">${escapeHtml(notification.message)}</div>
                <div class="notification-time">${formatTime(notification.timestamp)}</div>
            </div>
            ${!notification.read ? 
                `<button class="mark-read-btn" onclick="markNotificationRead(${notification.id})">
                    <i class="fas fa-check"></i>
                </button>` : ''
            }
        `;
        
        container.appendChild(notificationElement);
    });
}

// الحصول على أيقونة الإشعار
function getNotificationIcon(type) {
    const icons = {
        message: 'comment',
        friend_request: 'user-plus',
        system: 'info-circle',
        warning: 'exclamation-triangle',
        ban: 'ban',
        mute: 'volume-mute',
        rank: 'crown'
    };
    
    return icons[type] || 'bell';
}

// تحديد الإشعار كمقروء
async function markNotificationRead(notificationId) {
    try {
        const response = await fetch(`/api/notifications/${notificationId}/read`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('chatToken')}`
            }
        });
        
        if (response.ok) {
            loadNotifications();
            updateNotificationCount();
        }
    } catch (error) {
        console.error('Error marking notification as read:', error);
    }
}

// تحديث عداد الإشعارات
function updateNotificationCount() {
    // يمكن إضافة API للحصول على عدد الإشعارات غير المقروءة
    const count = notifications.filter(n => !n.read).length;
    const badge = document.getElementById('notificationCount');
    if (badge) {
        badge.textContent = count;
        badge.style.display = count > 0 ? 'block' : 'none';
    }
}

// معالجة الإشعار
function handleNotification(notification) {
    notifications.unshift(notification);
    updateNotificationCount();
    
    // إظهار إشعار منبثق
    showToast(notification.message, 'info');
    
    // تشغيل صوت الإشعار
    playNotificationSound();
}

// فتح الإعدادات
function openSettings() {
    document.getElementById('settingsModal').classList.add('show');
}

// إغلاق الإعدادات
function closeSettingsModal() {
    document.getElementById('settingsModal').classList.remove('show');
}

// حفظ الإعدادات
function saveSettings() {
    const settings = {
        soundNotifications: document.getElementById('soundNotifications').checked,
        popupNotifications: document.getElementById('popupNotifications').checked,
        saveChatHistory: document.getElementById('saveChatHistory').checked
    };
    
    localStorage.setItem('chatSettings', JSON.stringify(settings));
    showToast('تم حفظ الإعدادات', 'success');
    closeSettingsModal();
}

// تحميل الإعدادات
function loadSettings() {
    const settings = JSON.parse(localStorage.getItem('chatSettings') || '{}');
    
    document.getElementById('soundNotifications').checked = settings.soundNotifications !== false;
    document.getElementById('popupNotifications').checked = settings.popupNotifications !== false;
    document.getElementById('saveChatHistory').checked = settings.saveChatHistory !== false;
}

// تبديل المظهر
function toggleTheme() {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem('chatTheme', currentTheme);
    
    // تحديث أيقونة المظهر
    const themeIcon = document.getElementById('themeIcon');
    if (themeIcon) {
        themeIcon.className = currentTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
}

// تحميل المظهر
function loadTheme() {
    currentTheme = localStorage.getItem('chatTheme') || 'dark';
    document.documentElement.setAttribute('data-theme', currentTheme);
    
    // تحديث أيقونة المظهر
    const themeIcon = document.getElementById('themeIcon');
    if (themeIcon) {
        themeIcon.className = currentTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
}

// تسجيل الخروج
function logout() {
    if (!confirm('هل أنت متأكد من تسجيل الخروج؟')) return;
    
    // قطع اتصال Socket.IO
    if (socket) {
        socket.disconnect();
    }
    
    // مسح البيانات المحلية
    localStorage.removeItem('chatToken');
    currentUser = null;
    
    // العودة لشاشة تسجيل الدخول
    showLoginScreen();
    
    showToast('تم تسجيل الخروج بنجاح', 'info');
}

// معالجة اختصارات لوحة المفاتيح
function handleKeyboardShortcuts(e) {
    // Ctrl/Cmd + Enter لإرسال الرسالة
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        if (document.activeElement === document.getElementById('messageInput')) {
            sendMessage();
        } else if (document.activeElement === document.getElementById('privateMessageInput')) {
            sendPrivateMessage();
        }
    }
    
    // Escape لإغلاق المودالات
    if (e.key === 'Escape') {
        closeAllModals();
    }
    
    // Ctrl/Cmd + / لفتح منتقي الرموز التعبيرية
    if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        openEmojiPicker();
    }
}

// إغلاق جميع المودالات
function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('show');
    });
}

// معالجة أخطاء Socket.IO
function handleSocketError(error) {
    console.error('Socket error:', error);
    showError(error);
}

// معالجة حظر المستخدم
function handleUserBanned(data) {
    if (data.userId === currentUser?.id) {
        showBanScreen(data.reason, data.duration);
    } else {
        showToast(`تم حظر المستخدم: ${data.reason}`, 'warning');
    }
}

// معالجة كتم المستخدم
function handleUserMuted(data) {
    if (data.userId === currentUser?.id) {
        showToast(`تم كتمك: ${data.reason}`, 'warning');
    } else {
        showToast(`تم كتم المستخدم: ${data.reason}`, 'info');
    }
}

// معالجة تحديث المستخدم
function handleUserUpdated(user) {
    // تحديث قائمة المستخدمين المتصلين
    loadOnlineUsers();
    
    // إذا كان المستخدم المحدث هو المستخدم الحالي
    if (user.id === currentUser?.id) {
        currentUser = { ...currentUser, ...user };
        updateUserInterface();
    }
}

// عرض شاشة الحظر
function showBanScreen(reason, duration) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    document.getElementById('banScreen').classList.add('active');
    document.getElementById('banMessage').textContent = reason;
    document.getElementById('banDuration').textContent = `مدة الحظر: ${duration}`;
}

// التحقق من حالة الحظر
async function checkBanStatus() {
    try {
        const response = await fetch('/api/ban-status', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('chatToken')}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            if (!data.banned) {
                showMainScreen();
                connectSocket();
                showToast('تم رفع الحظر عنك', 'success');
            } else {
                showToast('ما زلت محظوراً', 'warning');
            }
        }
    } catch (error) {
        console.error('Error checking ban status:', error);
        showError('خطأ في التحقق من حالة الحظر');
    }
}

// تبديل وضع الدردشة
function toggleChatMode() {
    // يمكن إضافة وظيفة لتبديل بين الدردشة العامة والخاصة
    showToast('تم تبديل وضع الدردشة', 'info');
}

// مسح الدردشة
function clearChat() {
    if (!confirm('هل أنت متأكد من مسح الدردشة؟')) return;
    
    const container = document.getElementById('messagesContainer');
    if (container) {
        container.innerHTML = '';
    }
    
    showToast('تم مسح الدردشة', 'info');
}

// فتح مودال الصورة
function openImageModal(imageUrl) {
    // يمكن إنشاء مودال لعرض الصورة بحجم كامل
    const modal = document.createElement('div');
    modal.className = 'modal image-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close" onclick="this.parentElement.parentElement.remove()">&times;</span>
            <img src="${imageUrl}" alt="صورة" style="max-width: 100%; max-height: 90vh;">
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.classList.add('show');
}

// عرض تبويبات تسجيل الدخول
function showLoginTab(tabName) {
    // إخفاء جميع النماذج
    document.querySelectorAll('.auth-form').forEach(form => {
        form.classList.remove('active');
    });
    
    // إزالة الفئة النشطة من جميع الأزرار
    document.querySelectorAll('.login-tabs .tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // عرض النموذج المحدد
    document.getElementById(`${tabName}Form`).classList.add('active');
    
    // تفعيل الزر المحدد
    event.target.classList.add('active');
}

// الحصول على صورة افتراضية
function getDefaultAvatar(name) {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
    const color = colors[name.length % colors.length];
    const initial = name.charAt(0).toUpperCase();
    
    return `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'><circle cx='20' cy='20' r='20' fill='${encodeURIComponent(color)}'/><text x='20' y='25' text-anchor='middle' fill='white' font-size='16' font-weight='bold'>${initial}</text></svg>`;
}

// تنسيق الوقت
function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    // أقل من دقيقة
    if (diff < 60000) {
        return 'الآن';
    }
    
    // أقل من ساعة
    if (diff < 3600000) {
        const minutes = Math.floor(diff / 60000);
        return `${minutes} د`;
    }
    
    // أقل من يوم
    if (diff < 86400000) {
        const hours = Math.floor(diff / 3600000);
        return `${hours} س`;
    }
    
    // أقل من أسبوع
    if (diff < 604800000) {
        const days = Math.floor(diff / 86400000);
        return `${days} ي`;
    }
    
    // تاريخ كامل
    return date.toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// تنسيق التاريخ
function formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// تحديث الطوابع الزمنية
function updateTimeStamps() {
    document.querySelectorAll('.message-time').forEach(timeElement => {
        const timestamp = timeElement.getAttribute('data-timestamp');
        if (timestamp) {
            timeElement.textContent = formatTime(timestamp);
        }
    });
    
    document.querySelectorAll('.news-time').forEach(timeElement => {
        const timestamp = timeElement.getAttribute('data-timestamp');
        if (timestamp) {
            timeElement.textContent = formatTime(timestamp);
        }
    });
    
    document.querySelectorAll('.story-time').forEach(timeElement => {
        const timestamp = timeElement.getAttribute('data-timestamp');
        if (timestamp) {
            timeElement.textContent = formatTime(timestamp);
        }
    });
}

// تشغيل صوت الإشعار
function playNotificationSound() {
    const settings = JSON.parse(localStorage.getItem('chatSettings') || '{}');
    if (settings.soundNotifications === false) return;
    
    // إنشاء صوت إشعار بسيط
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
}

// الحصول على اسم الغرفة
function getRoomName(roomId) {
    // يمكن تحسين هذا بحفظ أسماء الغرف في متغير عام
    return roomId === 1 ? 'الغرفة الرئيسية' : `الغرفة ${roomId}`;
}

// تشفير HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// عرض رسالة خطأ
function showError(message) {
    const errorElement = document.getElementById('loginError');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.add('show');
        
        setTimeout(() => {
            errorElement.classList.remove('show');
        }, 5000);
    } else {
        showToast(message, 'error');
    }
}

// عرض شاشة التحميل
function showLoading(show) {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) {
        spinner.style.display = show ? 'flex' : 'none';
    }
}

// عرض إشعار منبثق
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    const container = document.getElementById('toastContainer');
    if (container) {
        container.appendChild(toast);
        
        // إزالة الإشعار بعد 5 ثوان
        setTimeout(() => {
            toast.remove();
        }, 5000);
    }
}

// تهيئة الإعدادات عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    loadSettings();
});