// متغيرات عامة
let socket;
let currentUser = null;
let currentRoom = 1;
let isPrivateMode = false;
let currentPrivateUser = null;
let isRecording = false;
let mediaRecorder = null;
let recordedChunks = [];
let notifications = [];
let isDarkTheme = false;
let competitionTimers = new Map();

// تهيئة التطبيق
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    loadTheme();
});

function initializeApp() {
    // إخفاء جميع الشاشات
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    // إظهار شاشة تسجيل الدخول
    document.getElementById('loginScreen').classList.add('active');
    
    // تطبيق التصميم المدمج
    document.body.classList.add('compact-layout');
}

function setupEventListeners() {
    // أحداث تسجيل الدخول
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
    document.getElementById('guestForm').addEventListener('submit', handleGuestLogin);
    
    // أحداث الرسائل
    document.getElementById('messageInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    document.getElementById('privateMessageInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendPrivateMessage();
        }
    });
    
    // أحداث رفع الصور
    document.getElementById('imageInput').addEventListener('change', handleImageUpload);
    document.getElementById('privateImageInput').addEventListener('change', handlePrivateImageUpload);
    
    // إغلاق المودالات عند النقر خارجها
    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            closeAllModals();
        }
    });
}

// وظائف تسجيل الدخول
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        if (response.ok) {
            localStorage.setItem('token', data.token);
            currentUser = data.user;
            initializeChat();
        } else {
            showError(data.error);
        }
    } catch (error) {
        showError('خطأ في الاتصال');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const display_name = document.getElementById('registerDisplayName').value;
    
    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, display_name })
        });
        
        const data = await response.json();
        if (response.ok) {
            localStorage.setItem('token', data.token);
            currentUser = data.user;
            initializeChat();
        } else {
            showError(data.error);
        }
    } catch (error) {
        showError('خطأ في الاتصال');
    }
}

function handleGuestLogin(e) {
    e.preventDefault();
    const name = document.getElementById('guestName').value;
    const age = document.getElementById('guestAge').value;
    const gender = document.getElementById('guestGender').value;
    
    // إنشاء مستخدم زائر مؤقت
    currentUser = {
        id: Date.now(),
        display_name: name,
        rank: 'visitor',
        role: 'guest',
        age: parseInt(age),
        gender: gender,
        profile_image1: null,
        profile_image2: null
    };
    
    initializeChat();
}

function initializeChat() {
    // إخفاء شاشة تسجيل الدخول وإظهار الشات
    document.getElementById('loginScreen').classList.remove('active');
    document.getElementById('chatScreen').classList.add('active');
    
    // تحديث معلومات المستخدم في الواجهة
    updateUserInterface();
    
    // تهيئة Socket.IO
    initializeSocket();
    
    // تحميل البيانات الأولية
    loadInitialData();
}

function updateUserInterface() {
    document.getElementById('userDisplayName').textContent = currentUser.display_name;
    document.getElementById('userRank').textContent = getRankText(currentUser.rank);
    document.getElementById('userRank').className = `rank rank-${currentUser.rank}`;
    
    // تحديث الصورة الشخصية
    if (currentUser.profile_image1) {
        document.getElementById('userAvatar').src = currentUser.profile_image1;
    }
    
    // إظهار أزرار الإدارة للمدراء
    if (currentUser.role === 'admin') {
        document.getElementById('adminBtn').style.display = 'inline-block';
        document.getElementById('createRoomBtn').style.display = 'inline-block';
    }
}

function initializeSocket() {
    socket = io();
    
    // الانضمام للشات
    socket.emit('join', {
        roomId: currentRoom,
        userId: currentUser.id,
        display_name: currentUser.display_name,
        rank: currentUser.rank
    });
    
    // استقبال الرسائل
    socket.on('newMessage', displayMessage);
    socket.on('newPrivateMessage', displayPrivateMessage);
    socket.on('newImage', displayImageMessage);
    socket.on('newPrivateImage', displayPrivateImageMessage);
    socket.on('newVoice', displayVoiceMessage);
    socket.on('newPrivateVoice', displayPrivateVoiceMessage);
    
    // استقبال تحديثات المستخدمين
    socket.on('userList', updateUsersList);
    socket.on('userUpdated', handleUserUpdate);
    
    // استقبال تحديثات الغرف
    socket.on('roomCreated', addRoomToList);
    socket.on('roomDeleted', removeRoomFromList);
    
    // استقبال الأخبار
    socket.on('newNews', addNewsPost);
    socket.on('updateNewsPost', updateNewsPost);
    
    // استقبال التعليقات
    socket.on('newComment', handleNewComment);
    socket.on('commentNotification', showCommentNotification);
    
    // استقبال المسابقات
    socket.on('newCompetition', startCompetition);
    socket.on('competitionStopped', stopCompetition);
    
    // استقبال الأخطاء
    socket.on('error', function(message) {
        showNotification(message, 'error');
    });
}

async function loadInitialData() {
    try {
        // تحميل الغرف
        const roomsResponse = await fetch('/api/rooms');
        const rooms = await roomsResponse.json();
        displayRooms(rooms);
        
        // تحميل المستخدمين
        const usersResponse = await fetch('/api/users');
        const users = await usersResponse.json();
        updateUsersList(users);
        
        // تحميل رسائل الغرفة الحالية
        const messagesResponse = await fetch(`/api/messages/${currentRoom}`);
        const messages = await messagesResponse.json();
        messages.forEach(displayMessage);
        
        // تحميل الأخبار
        const newsResponse = await fetch('/api/news');
        const news = await newsResponse.json();
        news.forEach(addNewsPost);
        
    } catch (error) {
        console.error('خطأ في تحميل البيانات:', error);
    }
}

// وظائف الرسائل مع نظام مكافحة الفيضانات
function sendMessage() {
    const input = document.getElementById('messageInput');
    const content = input.value.trim();
    
    if (!content) return;
    
    // فحص الحماية من الفيضانات في الواجهة
    if (isFloodProtected()) {
        showNotification('يرجى الانتظار قبل إرسال رسالة أخرى', 'warning');
        return;
    }
    
    socket.emit('sendMessage', {
        roomId: currentRoom,
        content: content
    });
    
    input.value = '';
    updateLastMessageTime();
}

function sendPrivateMessage() {
    if (!currentPrivateUser) return;
    
    const input = document.getElementById('privateMessageInput');
    const content = input.value.trim();
    
    if (!content) return;
    
    if (isFloodProtected()) {
        showNotification('يرجى الانتظار قبل إرسال رسالة أخرى', 'warning');
        return;
    }
    
    socket.emit('sendPrivateMessage', {
        receiverId: currentPrivateUser.id,
        content: content
    });
    
    input.value = '';
    updateLastMessageTime();
}

// نظام مكافحة الفيضانات
let lastMessageTimes = [];

function isFloodProtected() {
    const now = Date.now();
    const fiveSecondsAgo = now - 5000;
    
    // إزالة الرسائل القديمة
    lastMessageTimes = lastMessageTimes.filter(time => time > fiveSecondsAgo);
    
    // فحص إذا تم إرسال أكثر من 3 رسائل في 5 ثواني
    return lastMessageTimes.length >= 3;
}

function updateLastMessageTime() {
    lastMessageTimes.push(Date.now());
}

// عرض الرسائل مع التصميم المحسن
function displayMessage(message) {
    const container = document.getElementById('messagesContainer');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${message.user_id === currentUser.id ? 'own' : ''} ${message.type === 'system' ? 'system' : ''} fade-in`;
    
    if (message.type === 'system') {
        messageDiv.innerHTML = `<div class="message-content">${message.content}</div>`;
    } else {
        const time = new Date(message.timestamp).toLocaleTimeString('ar-SA', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        messageDiv.innerHTML = `
            <div class="message-header">
                <span class="message-user rank-${message.rank}">${message.display_name}</span>
                <span class="message-time">${time}</span>
            </div>
            <div class="message-content">${message.content}</div>
        `;
    }
    
    // تطبيق خلفية الرسائل المخصصة
    if (message.user_id === currentUser.id && currentUser.message_background) {
        messageDiv.style.backgroundImage = `url(${currentUser.message_background})`;
        messageDiv.style.backgroundSize = 'cover';
        messageDiv.style.backgroundPosition = 'center';
        messageDiv.style.color = 'white';
        messageDiv.style.textShadow = '1px 1px 2px rgba(0,0,0,0.7)';
    }
    
    container.appendChild(messageDiv);
    
    // التمرير التلقائي للأسفل
    container.scrollTop = container.scrollHeight;
    
    // الحد من عدد الرسائل المعروضة لتحسين الأداء
    const messages = container.querySelectorAll('.message');
    if (messages.length > 100) {
        messages[0].remove();
    }
}

function displayImageMessage(message) {
    const container = document.getElementById('messagesContainer');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${message.user_id === currentUser.id ? 'own' : ''} fade-in`;
    
    const time = new Date(message.timestamp).toLocaleTimeString('ar-SA', {
        hour: '2-digit',
        minute: '2-digit'
    });
    
    messageDiv.innerHTML = `
        <div class="message-header">
            <span class="message-user rank-${message.rank}">${message.display_name}</span>
            <span class="message-time">${time}</span>
        </div>
        <div class="message-content">
            <img src="${message.image_url}" alt="صورة" onclick="openImageModal('${message.image_url}')">
        </div>
    `;
    
    container.appendChild(messageDiv);
    container.scrollTop = container.scrollHeight;
}

function displayVoiceMessage(message) {
    const container = document.getElementById('messagesContainer');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${message.user_id === currentUser.id ? 'own' : ''} fade-in`;
    
    const time = new Date(message.timestamp).toLocaleTimeString('ar-SA', {
        hour: '2-digit',
        minute: '2-digit'
    });
    
    messageDiv.innerHTML = `
        <div class="message-header">
            <span class="message-user rank-${message.rank}">${message.display_name}</span>
            <span class="message-time">${time}</span>
        </div>
        <div class="message-content">
            <div class="voice-message">
                <span>🎤</span>
                <audio controls>
                    <source src="${message.voice_url}" type="audio/webm">
                    متصفحك لا يدعم تشغيل الصوت
                </audio>
            </div>
        </div>
    `;
    
    container.appendChild(messageDiv);
    container.scrollTop = container.scrollHeight;
}

// وظائف الدردشة الخاصة
function displayPrivateMessage(message) {
    if (!document.getElementById('privateChatModal').style.display === 'block') return;
    
    const container = document.getElementById('privateChatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${message.senderId === currentUser.id ? 'own' : ''} fade-in`;
    
    const time = new Date(message.timestamp).toLocaleTimeString('ar-SA', {
        hour: '2-digit',
        minute: '2-digit'
    });
    
    messageDiv.innerHTML = `
        <div class="message-header">
            <span class="message-user rank-${message.rank}">${message.display_name}</span>
            <span class="message-time">${time}</span>
        </div>
        <div class="message-content">${message.content}</div>
    `;
    
    container.appendChild(messageDiv);
    container.scrollTop = container.scrollHeight;
}

function displayPrivateImageMessage(message) {
    if (!document.getElementById('privateChatModal').style.display === 'block') return;
    
    const container = document.getElementById('privateChatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${message.senderId === currentUser.id ? 'own' : ''} fade-in`;
    
    const time = new Date(message.timestamp).toLocaleTimeString('ar-SA', {
        hour: '2-digit',
        minute: '2-digit'
    });
    
    messageDiv.innerHTML = `
        <div class="message-header">
            <span class="message-user rank-${message.rank}">${message.display_name}</span>
            <span class="message-time">${time}</span>
        </div>
        <div class="message-content">
            <img src="${message.image_url}" alt="صورة" onclick="openImageModal('${message.image_url}')">
        </div>
    `;
    
    container.appendChild(messageDiv);
    container.scrollTop = container.scrollHeight;
}

function displayPrivateVoiceMessage(message) {
    if (!document.getElementById('privateChatModal').style.display === 'block') return;
    
    const container = document.getElementById('privateChatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${message.senderId === currentUser.id ? 'own' : ''} fade-in`;
    
    const time = new Date(message.timestamp).toLocaleTimeString('ar-SA', {
        hour: '2-digit',
        minute: '2-digit'
    });
    
    messageDiv.innerHTML = `
        <div class="message-header">
            <span class="message-user rank-${message.rank}">${message.display_name}</span>
            <span class="message-time">${time}</span>
        </div>
        <div class="message-content">
            <div class="voice-message">
                <span>🎤</span>
                <audio controls>
                    <source src="${message.voice_url}" type="audio/webm">
                    متصفحك لا يدعم تشغيل الصوت
                </audio>
            </div>
        </div>
    `;
    
    container.appendChild(messageDiv);
    container.scrollTop = container.scrollHeight;
}

// وظائف الأخبار مع التفاعلات والتعليقات
function addNewsPost(post) {
    const feed = document.getElementById('newsFeed');
    const postDiv = document.createElement('div');
    postDiv.className = 'news-post slide-up';
    postDiv.id = `news-post-${post.id}`;
    
    const time = new Date(post.timestamp).toLocaleTimeString('ar-SA', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit'
    });
    
    const reactions = post.reactions || { likes: [], dislikes: [], hearts: [] };
    
    postDiv.innerHTML = `
        <div class="news-post-header">
            <span class="news-post-user rank-${post.rank || 'member'}">${post.display_name}</span>
            <span class="news-post-time">${time}</span>
        </div>
        <div class="news-post-content">${post.content}</div>
        ${post.media ? `<div class="news-post-media"><img src="${post.media}" alt="صورة الخبر"></div>` : ''}
        <div class="news-post-actions">
            <button class="reaction-btn" onclick="addReaction(${post.id}, 'like')">
                👍 <span class="reaction-count">${reactions.likes.length}</span>
            </button>
            <button class="reaction-btn" onclick="addReaction(${post.id}, 'heart')">
                ❤️ <span class="reaction-count">${reactions.hearts.length}</span>
            </button>
            <button class="reaction-btn" onclick="addReaction(${post.id}, 'dislike')">
                👎 <span class="reaction-count">${reactions.dislikes.length}</span>
            </button>
            <button class="reaction-btn" onclick="toggleComments(${post.id})">
                💬 تعليق
            </button>
        </div>
        <div class="comments-section" id="comments-${post.id}" style="display: none;">
            <div class="comment-form">
                <select id="target-user-${post.id}" class="comment-input">
                    <option value="">للجميع</option>
                </select>
                <input type="text" id="comment-input-${post.id}" class="comment-input" placeholder="اكتب تعليقك...">
                <button class="comment-btn" onclick="addComment(${post.id})">إرسال</button>
            </div>
            <div id="comments-list-${post.id}"></div>
        </div>
    `;
    
    feed.insertBefore(postDiv, feed.firstChild);
    
    // تحميل قائمة المستخدمين للتعليقات
    loadUsersForComments(post.id);
    
    // تحميل التعليقات الموجودة
    loadComments(post.id);
}

function updateNewsPost(post) {
    const postElement = document.getElementById(`news-post-${post.id}`);
    if (postElement) {
        // تحديث عدادات التفاعلات
        const reactions = post.reactions || { likes: [], dislikes: [], hearts: [] };
        const reactionBtns = postElement.querySelectorAll('.reaction-btn .reaction-count');
        if (reactionBtns[0]) reactionBtns[0].textContent = reactions.likes.length;
        if (reactionBtns[1]) reactionBtns[1].textContent = reactions.hearts.length;
        if (reactionBtns[2]) reactionBtns[2].textContent = reactions.dislikes.length;
    }
}

function addReaction(postId, type) {
    socket.emit('addReaction', { postId, type });
}

function toggleComments(postId) {
    const commentsSection = document.getElementById(`comments-${postId}`);
    commentsSection.style.display = commentsSection.style.display === 'none' ? 'block' : 'none';
}

async function loadUsersForComments(postId) {
    try {
        const response = await fetch('/api/users');
        const users = await response.json();
        const select = document.getElementById(`target-user-${postId}`);
        
        users.forEach(user => {
            if (user.id !== currentUser.id) {
                const option = document.createElement('option');
                option.value = user.id;
                option.textContent = user.display_name;
                select.appendChild(option);
            }
        });
    } catch (error) {
        console.error('خطأ في تحميل المستخدمين:', error);
    }
}

function addComment(postId) {
    const input = document.getElementById(`comment-input-${postId}`);
    const targetSelect = document.getElementById(`target-user-${postId}`);
    const content = input.value.trim();
    const targetUserId = targetSelect.value;
    
    if (!content) return;
    
    socket.emit('addComment', {
        postId,
        content,
        targetUserId: targetUserId || null
    });
    
    input.value = '';
}

function handleNewComment(comment) {
    const commentsList = document.getElementById(`comments-list-${comment.postId}`);
    if (commentsList) {
        const commentDiv = document.createElement('div');
        commentDiv.className = 'comment fade-in';
        
        const time = new Date(comment.timestamp).toLocaleTimeString('ar-SA', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const targetText = comment.targetUserId ? ` → ${getUserName(comment.targetUserId)}` : '';
        
        commentDiv.innerHTML = `
            <span class="comment-user">${comment.display_name}</span>${targetText}
            <span class="comment-time">${time}</span>
            <div>${comment.content}</div>
        `;
        
        commentsList.appendChild(commentDiv);
    }
}

function showCommentNotification(data) {
    const notification = document.createElement('div');
    notification.className = 'comment-notification';
    notification.innerHTML = `
        <strong>تعليق جديد من ${data.from}:</strong><br>
        ${data.content}
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 5000);
    
    // تشغيل صوت الإشعار
    playNotificationSound();
}

async function loadComments(postId) {
    try {
        const response = await fetch(`/api/comments/${postId}`);
        const comments = await response.json();
        comments.forEach(comment => handleNewComment(comment));
    } catch (error) {
        console.error('خطأ في تحميل التعليقات:', error);
    }
}

// وظائف المسابقات المحسنة
function startCompetition(competition) {
    if (competitionTimers.has(competition.id)) {
        clearInterval(competitionTimers.get(competition.id));
    }
    
    const modal = createCompetitionModal(competition);
    document.body.appendChild(modal);
    
    let timeLeft = competition.duration;
    const timerElement = modal.querySelector('.competition-timer');
    
    const timer = setInterval(() => {
        if (timeLeft <= 0) {
            clearInterval(timer);
            competitionTimers.delete(competition.id);
            
            // إخفاء المودال تلقائياً عند انتهاء الوقت
            modal.remove();
            return;
        }
        
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        timeLeft--;
    }, 1000);
    
    competitionTimers.set(competition.id, timer);
}

function createCompetitionModal(competition) {
    const modal = document.createElement('div');
    modal.className = 'modal competition-modal';
    modal.id = `competition-${competition.id}`;
    modal.style.display = 'block';
    
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close" onclick="closeCompetition(${competition.id})">&times;</span>
            <h2>${competition.title}</h2>
            <div class="competition-timer">00:00</div>
            <div class="competition-controls">
                <button class="btn" onclick="closeCompetition(${competition.id})">إغلاق</button>
            </div>
        </div>
    `;
    
    return modal;
}

function closeCompetition(competitionId) {
    const modal = document.getElementById(`competition-${competitionId}`);
    if (modal) {
        modal.remove();
    }
    
    if (competitionTimers.has(competitionId)) {
        clearInterval(competitionTimers.get(competitionId));
        competitionTimers.delete(competitionId);
    }
    
    // إيقاف المسابقة على الخادم
    socket.emit('stopCompetition', competitionId);
}

function stopCompetition(competitionId) {
    closeCompetition(competitionId);
}

// وظائف التسجيل الصوتي
async function toggleVoiceRecording(isPrivate = false) {
    if (!isRecording) {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            recordedChunks = [];
            
            mediaRecorder.ondataavailable = function(event) {
                if (event.data.size > 0) {
                    recordedChunks.push(event.data);
                }
            };
            
            mediaRecorder.onstop = function() {
                const blob = new Blob(recordedChunks, { type: 'audio/webm' });
                sendVoiceMessage(blob, isPrivate);
                stream.getTracks().forEach(track => track.stop());
            };
            
            mediaRecorder.start();
            isRecording = true;
            
            const button = isPrivate ? 
                document.getElementById('privateRecordBtn') : 
                document.getElementById('recordButton');
            button.textContent = '⏹️';
            button.style.background = '#dc3545';
            
        } catch (error) {
            showNotification('خطأ في الوصول للميكروفون', 'error');
        }
    } else {
        mediaRecorder.stop();
        isRecording = false;
        
        const button = isPrivate ? 
            document.getElementById('privateRecordBtn') : 
            document.getElementById('recordButton');
        button.textContent = '🎤';
        button.style.background = '#6c757d';
    }
}

function sendVoiceMessage(blob, isPrivate = false) {
    const formData = new FormData();
    formData.append('voice', blob, 'voice.webm');
    
    if (isPrivate && currentPrivateUser) {
        formData.append('receiverId', currentPrivateUser.id);
        socket.emit('sendPrivateVoice', formData, function(response) {
            if (response.error) {
                showNotification(response.error, 'error');
            }
        });
    } else {
        formData.append('roomId', currentRoom);
        socket.emit('sendVoice', formData, function(response) {
            if (response.error) {
                showNotification(response.error, 'error');
            }
        });
    }
}

// وظائف رفع الصور
function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
        showNotification('حجم الصورة كبير جداً (الحد الأقصى 5 ميجابايت)', 'error');
        return;
    }
    
    const formData = new FormData();
    formData.append('image', file);
    formData.append('roomId', currentRoom);
    
    socket.emit('sendImage', formData, function(response) {
        if (response.error) {
            showNotification(response.error, 'error');
        }
    });
    
    e.target.value = '';
}

function handlePrivateImageUpload(e) {
    const file = e.target.files[0];
    if (!file || !currentPrivateUser) return;
    
    if (file.size > 5 * 1024 * 1024) {
        showNotification('حجم الصورة كبير جداً (الحد الأقصى 5 ميجابايت)', 'error');
        return;
    }
    
    const formData = new FormData();
    formData.append('image', file);
    formData.append('receiverId', currentPrivateUser.id);
    
    socket.emit('sendPrivateImage', formData, function(response) {
        if (response.error) {
            showNotification(response.error, 'error');
        }
    });
    
    e.target.value = '';
}

// وظائف الواجهة
function showTab(tabName) {
    // إخفاء جميع النماذج
    document.querySelectorAll('.form').forEach(form => {
        form.classList.remove('active');
        form.style.display = 'none';
    });
    
    // إزالة الفئة النشطة من جميع التبويبات
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // إظهار النموذج المحدد
    document.getElementById(tabName + 'Form').classList.add('active');
    document.getElementById(tabName + 'Form').style.display = 'block';
    
    // تفعيل التبويب المحدد
    event.target.classList.add('active');
}

function showError(message) {
    const errorDiv = document.getElementById('loginError');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 5000);
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'error' ? '#dc3545' : type === 'warning' ? '#ffc107' : '#007bff'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 1001;
        animation: slideInRight 0.3s ease-out;
        max-width: 300px;
        word-wrap: break-word;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

function playNotificationSound() {
    // تشغيل صوت إشعار بسيط
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
    audio.volume = 0.3;
    audio.play().catch(() => {}); // تجاهل الأخطاء
}

// وظائف المودالات
function openMenuModal() {
    document.getElementById('menuModal').style.display = 'block';
}

function closeMenuModal() {
    document.getElementById('menuModal').style.display = 'none';
}

function openNewsModal() {
    document.getElementById('newsModal').style.display = 'block';
    closeMenuModal();
    loadNews();
}

function closeNewsModal() {
    document.getElementById('newsModal').style.display = 'none';
}

function openProfileModal() {
    document.getElementById('profileModal').style.display = 'block';
    loadProfileData();
}

function closeProfileModal() {
    document.getElementById('profileModal').style.display = 'none';
}

function openPrivateChatModal(user) {
    currentPrivateUser = user;
    document.getElementById('privateChatUserName').textContent = user.display_name;
    document.getElementById('privateChatModal').style.display = 'block';
    document.getElementById('privateChatMessages').innerHTML = '';
    loadPrivateMessages(user.id);
}

function closePrivateChatModal() {
    document.getElementById('privateChatModal').style.display = 'none';
    currentPrivateUser = null;
}

function openAllUsersModal() {
    document.getElementById('allUsersModal').style.display = 'block';
    loadAllUsers();
}

function closeAllUsersModal() {
    document.getElementById('allUsersModal').style.display = 'none';
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
}

// وظائف مساعدة
function getRankText(rank) {
    const ranks = {
        'visitor': 'زائر',
        'member': 'عضو',
        'vip': 'مميز',
        'admin': 'مدير',
        'owner': 'مالك'
    };
    return ranks[rank] || 'غير محدد';
}

function getUserName(userId) {
    // البحث عن اسم المستخدم من قائمة المستخدمين
    const userElement = document.querySelector(`[data-user-id="${userId}"]`);
    return userElement ? userElement.textContent : 'مستخدم غير معروف';
}

function formatTime(timestamp) {
    return new Date(timestamp).toLocaleTimeString('ar-SA', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

// وظائف الثيم
function toggleTheme() {
    isDarkTheme = !isDarkTheme;
    document.body.classList.toggle('dark-theme', isDarkTheme);
    localStorage.setItem('darkTheme', isDarkTheme);
}

function loadTheme() {
    const savedTheme = localStorage.getItem('darkTheme');
    if (savedTheme === 'true') {
        isDarkTheme = true;
        document.body.classList.add('dark-theme');
    }
}

// وظائف تحميل البيانات
async function loadNews() {
    try {
        const response = await fetch('/api/news');
        const news = await response.json();
        const feed = document.getElementById('newsFeed');
        feed.innerHTML = '';
        news.reverse().forEach(addNewsPost);
    } catch (error) {
        console.error('خطأ في تحميل الأخبار:', error);
    }
}

async function loadAllUsers() {
    try {
        const response = await fetch('/api/users');
        const users = await response.json();
        const container = document.getElementById('allUsersListModal');
        
        container.innerHTML = users.map(user => `
            <div class="user-card" data-user-id="${user.id}">
                <div class="user-info">
                    <img src="${user.profile_image1 || 'data:image/svg+xml,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'40\' height=\'40\' viewBox=\'0 0 40 40\'><circle cx=\'20\' cy=\'20\' r=\'20\' fill=\'%23007bff\'/><text x=\'20\' y=\'25\' text-anchor=\'middle\' fill=\'white\' font-size=\'16\'>👤</text></svg>'}" alt="صورة ${user.display_name}">
                    <div>
                        <h4 class="rank-${user.rank}">${user.display_name}</h4>
                        <p>${getRankText(user.rank)}</p>
                        ${user.age ? `<p>العمر: ${user.age}</p>` : ''}
                        ${user.gender ? `<p>الجنس: ${user.gender}</p>` : ''}
                        ${user.about_me ? `<p>${user.about_me}</p>` : ''}
                    </div>
                </div>
                <button onclick="openPrivateChatModal({id: ${user.id}, display_name: '${user.display_name}'})" class="btn">دردشة خاصة</button>
            </div>
        `).join('');
    } catch (error) {
        console.error('خطأ في تحميل المستخدمين:', error);
    }
}

async function loadPrivateMessages(userId) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/private-messages/${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const messages = await response.json();
        messages.forEach(displayPrivateMessage);
    } catch (error) {
        console.error('خطأ في تحميل الرسائل الخاصة:', error);
    }
}

function loadProfileData() {
    if (currentUser.profile_image1) {
        document.getElementById('profileImg1').src = currentUser.profile_image1;
    }
    if (currentUser.profile_image2) {
        document.getElementById('profileImg2').src = currentUser.profile_image2;
    }
    if (currentUser.display_name) {
        document.getElementById('newDisplayName').value = currentUser.display_name;
    }
    if (currentUser.age) {
        document.getElementById('userAge').value = currentUser.age;
    }
    if (currentUser.gender) {
        document.getElementById('userGender').value = currentUser.gender;
    }
    if (currentUser.marital_status) {
        document.getElementById('userMaritalStatus').value = currentUser.marital_status;
    }
    if (currentUser.about_me) {
        document.getElementById('userAboutMe').value = currentUser.about_me;
    }
    
    document.getElementById('currentRank').innerHTML = `
        <span class="rank-${currentUser.rank}">${getRankText(currentUser.rank)}</span>
    `;
}

// وظائف نشر الأخبار
async function postNews() {
    const content = document.getElementById('newsContentInput').value.trim();
    const fileInput = document.getElementById('newsFileInput');
    const file = fileInput.files[0];
    
    if (!content && !file) {
        showNotification('يجب إدخال محتوى أو رفع ملف', 'warning');
        return;
    }
    
    const formData = new FormData();
    if (content) formData.append('content', content);
    if (file) formData.append('newsFile', file);
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/news', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        
        if (response.ok) {
            document.getElementById('newsContentInput').value = '';
            fileInput.value = '';
            showNotification('تم نشر الخبر بنجاح', 'success');
        } else {
            const error = await response.json();
            showNotification(error.error, 'error');
        }
    } catch (error) {
        showNotification('خطأ في نشر الخبر', 'error');
    }
}

// وظائف أخرى
function logout() {
    localStorage.removeItem('token');
    currentUser = null;
    if (socket) {
        socket.disconnect();
    }
    
    // إعادة تعيين الواجهة
    document.getElementById('chatScreen').classList.remove('active');
    document.getElementById('loginScreen').classList.add('active');
    
    // مسح البيانات
    document.getElementById('messagesContainer').innerHTML = '';
    document.getElementById('usersList').innerHTML = '';
    document.getElementById('roomsList').innerHTML = '';
    
    closeAllModals();
}

function displayRooms(rooms) {
    const container = document.getElementById('roomsList');
    container.innerHTML = rooms.map(room => `
        <div class="room-item ${room.id === currentRoom ? 'active' : ''}" onclick="joinRoom(${room.id})">
            <strong>${room.name}</strong>
            ${room.description ? `<p>${room.description}</p>` : ''}
        </div>
    `).join('');
}

function joinRoom(roomId) {
    if (roomId === currentRoom) return;
    
    currentRoom = roomId;
    socket.emit('join', {
        roomId: currentRoom,
        userId: currentUser.id,
        display_name: currentUser.display_name,
        rank: currentUser.rank
    });
    
    // تحديث واجهة الغرف
    document.querySelectorAll('.room-item').forEach(item => {
        item.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // مسح الرسائل وتحميل رسائل الغرفة الجديدة
    document.getElementById('messagesContainer').innerHTML = '';
    loadRoomMessages(roomId);
    
    // تحديث اسم الغرفة
    const roomName = event.target.querySelector('strong').textContent;
    document.getElementById('currentRoomName').textContent = roomName;
}

async function loadRoomMessages(roomId) {
    try {
        const response = await fetch(`/api/messages/${roomId}`);
        const messages = await response.json();
        messages.forEach(displayMessage);
    } catch (error) {
        console.error('خطأ في تحميل رسائل الغرفة:', error);
    }
}

function updateUsersList(users) {
    const container = document.getElementById('usersList');
    container.innerHTML = users.map(user => `
        <li class="rank-${user.rank}" onclick="openPrivateChatModal({id: ${user.id}, display_name: '${user.display_name}'})" data-user-id="${user.id}">
            ${user.display_name} (${getRankText(user.rank)})
        </li>
    `).join('');
}

function handleUserUpdate(user) {
    if (user.id === currentUser.id) {
        currentUser = { ...currentUser, ...user };
        updateUserInterface();
    }
    
    // تحديث قائمة المستخدمين
    const userElement = document.querySelector(`[data-user-id="${user.id}"]`);
    if (userElement) {
        userElement.textContent = `${user.display_name} (${getRankText(user.rank)})`;
        userElement.className = `rank-${user.rank}`;
    }
}

function addRoomToList(room) {
    const container = document.getElementById('roomsList');
    const roomDiv = document.createElement('div');
    roomDiv.className = 'room-item';
    roomDiv.onclick = () => joinRoom(room.id);
    roomDiv.innerHTML = `
        <strong>${room.name}</strong>
        ${room.description ? `<p>${room.description}</p>` : ''}
    `;
    container.appendChild(roomDiv);
}

function removeRoomFromList(roomId) {
    const roomElements = document.querySelectorAll('.room-item');
    roomElements.forEach(element => {
        if (element.onclick.toString().includes(roomId)) {
            element.remove();
        }
    });
}

// وظائف إضافية للواجهة
function openImageModal(imageUrl) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 90%; text-align: center;">
            <span class="close" onclick="this.parentElement.parentElement.remove()">&times;</span>
            <img src="${imageUrl}" style="max-width: 100%; max-height: 80vh; border-radius: 8px;">
        </div>
    `;
    document.body.appendChild(modal);
}

function openEmojiPicker() {
    const emojis = ['😀', '😂', '😍', '🥰', '😎', '🤔', '😢', '😡', '👍', '👎', '❤️', '💔', '🔥', '⭐', '🎉', '💯'];
    const picker = document.createElement('div');
    picker.className = 'emoji-picker';
    picker.style.cssText = `
        position: fixed;
        bottom: 100px;
        right: 20px;
        background: white;
        border: 1px solid #ddd;
        border-radius: 8px;
        padding: 10px;
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 5px;
        z-index: 1000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    `;
    
    emojis.forEach(emoji => {
        const button = document.createElement('button');
        button.textContent = emoji;
        button.style.cssText = 'border: none; background: none; font-size: 20px; cursor: pointer; padding: 5px;';
        button.onclick = () => {
            const input = document.getElementById('messageInput');
            input.value += emoji;
            picker.remove();
        };
        picker.appendChild(button);
    });
    
    document.body.appendChild(picker);
    
    // إزالة المنتقي عند النقر خارجه
    setTimeout(() => {
        document.addEventListener('click', function removePicker(e) {
            if (!picker.contains(e.target)) {
                picker.remove();
                document.removeEventListener('click', removePicker);
            }
        });
    }, 100);
}

// تهيئة التطبيق عند تحميل الصفحة
window.addEventListener('load', function() {
    // فحص إذا كان المستخدم مسجل دخول مسبقاً
    const token = localStorage.getItem('token');
    if (token) {
        // محاولة استرداد بيانات المستخدم
        fetch('/api/user/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(response => response.json())
        .then(user => {
            if (user && !user.error) {
                currentUser = user;
                initializeChat();
            }
        })
        .catch(() => {
            // في حالة فشل استرداد البيانات، إزالة التوكن
            localStorage.removeItem('token');
        });
    }
});

// وظائف إضافية مطلوبة
function openHome() {
    closeMenuModal();
    // العودة للشات الرئيسي
}

function openAwards() {
    closeMenuModal();
    showNotification('قريباً: نظام الجوائز', 'info');
}

function openRanking() {
    closeMenuModal();
    showNotification('قريباً: نظام الترتيب', 'info');
}

function openFriends() {
    closeMenuModal();
    showNotification('قريباً: نظام الأصدقاء', 'info');
}

function openMessages() {
    closeMenuModal();
    openAllUsersModal();
}

function openSettings() {
    closeMenuModal();
    openProfileModal();
}

function openSoundSettings() {
    showNotification('قريباً: إعدادات الأصوات', 'info');
}

function openAdminPanel() {
    showNotification('قريباً: لوحة الإدارة المتقدمة', 'info');
}

function toggleChatMode() {
    isPrivateMode = !isPrivateMode;
    showNotification(isPrivateMode ? 'تم التبديل للوضع الخاص' : 'تم التبديل للوضع العام', 'info');
}

function openNotifications() {
    showNotification('لا توجد إشعارات جديدة', 'info');
}

function showStats() {
    showNotification('قريباً: الإحصائيات التفصيلية', 'info');
}

function scrollToTopPrivateChat() {
    document.getElementById('privateChatMessages').scrollTop = 0;
}

function toggleMaximizePrivateChat() {
    const modal = document.getElementById('privateChatModal');
    modal.classList.toggle('maximized');
}

function openPrivateSettings() {
    showNotification('قريباً: إعدادات الدردشة الخاصة', 'info');
}
