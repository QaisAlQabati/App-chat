// متغيرات عامة
let socket;
let currentUser = null;
let currentRoom = 1;
let isRecording = false;
let mediaRecorder;
let recordedChunks = [];
let notifications = [];
let quizTimer;
let currentQuestion = null;
let userCoins = 2000;
let userRank = 'visitor';

// الرتب المتاحة
const RANKS = {
    visitor: { name: 'زائر', emoji: '👋', level: 0, color: '#888' },
    bronze: { name: 'عضو برونزي', emoji: '🥉', level: 1, color: '#cd7f32' },
    silver: { name: 'عضو فضي', emoji: '🥈', level: 2, color: '#c0c0c0' },
    gold: { name: 'عضو ذهبي', emoji: '🥇', level: 3, color: '#ffd700' },
    trophy: { name: 'كأس', emoji: '🏆', level: 4, color: '#ff6b35' },
    diamond: { name: 'عضو الماس', emoji: '💎', level: 5, color: '#b9f2ff' },
    prince: { name: 'برنس', emoji: '👑', level: 6, color: '#ffd700' },
    admin: { name: 'إداري', emoji: '⚡', level: 7, color: '#ff6b35' },
    owner: { name: 'المالك', emoji: '👨‍💼', level: 8, color: '#667eea' }
};

// أسئلة المسابقات
const QUIZ_QUESTIONS = [
    {
        question: "ما هي عاصمة فرنسا؟",
        options: ["لندن", "باريس", "روما", "برلين"],
        correct: 1,
        points: 10
    },
    {
        question: "كم عدد قارات العالم؟",
        options: ["5", "6", "7", "8"],
        correct: 2,
        points: 10
    },
    {
        question: "ما هو أكبر محيط في العالم؟",
        options: ["الأطلسي", "الهندي", "الهادئ", "المتجمد الشمالي"],
        correct: 2,
        points: 15
    },
    {
        question: "في أي سنة انتهت الحرب العالمية الثانية؟",
        options: ["1944", "1945", "1946", "1947"],
        correct: 1,
        points: 20
    },
    {
        question: "ما هو أطول نهر في العالم؟",
        options: ["النيل", "الأمازون", "اليانغتسي", "المسيسيبي"],
        correct: 0,
        points: 15
    }
];

// تهيئة التطبيق
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    checkAuthStatus();
});

// تهيئة التطبيق
function initializeApp() {
    // تحقق من حالة المصادقة
    const token = localStorage.getItem('token');
    if (token) {
        // التحقق من صحة التوكن
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
            initializeSocket();
            loadUserData();
        })
        .catch(error => {
            console.error('Auth error:', error);
            localStorage.removeItem('token');
            showLoginScreen();
        });
    } else {
        showLoginScreen();
    }
}

// إعداد مستمعي الأحداث
function setupEventListeners() {
    // نماذج تسجيل الدخول
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
    document.getElementById('guestForm').addEventListener('submit', handleGuestLogin);
    
    // إرسال الرسائل
    document.getElementById('messageInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // رفع الصور
    document.getElementById('imageInput').addEventListener('change', handleImageUpload);
    
    // إعدادات الملف الشخصي
    document.getElementById('profileFile1').addEventListener('change', function() {
        previewProfileImage(1, this);
    });
    document.getElementById('profileFile2').addEventListener('change', function() {
        previewProfileImage(2, this);
    });
    document.getElementById('coverInput').addEventListener('change', previewCoverImage);
    
    // التحكم في الصوت
    document.getElementById('volumeSlider').addEventListener('input', function() {
        adjustVolume(this.value);
    });
}

// التحقق من حالة المصادقة
function checkAuthStatus() {
    const token = localStorage.getItem('token');
    if (!token) {
        showLoginScreen();
        return;
    }
    
    // التحقق من الحظر
    checkBanStatus();
}

// التحقق من حالة الحظر
function checkBanStatus() {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    fetch('/api/user/ban-status', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.banned) {
            showBanScreen(data.reason, data.duration);
        }
    })
    .catch(error => {
        console.error('Error checking ban status:', error);
    });
}

// عرض شاشة الحظر
function showBanScreen(reason, duration) {
    hideAllScreens();
    document.getElementById('banScreen').classList.add('active');
    document.getElementById('banReason').textContent = reason || 'لم يتم تحديد سبب';
}

// عرض شاشة تسجيل الدخول
function showLoginScreen() {
    hideAllScreens();
    document.getElementById('loginScreen').classList.add('active');
}

// عرض الشاشة الرئيسية
function showMainScreen() {
    hideAllScreens();
    document.getElementById('mainScreen').classList.add('active');
    updateUserInterface();
}

// إخفاء جميع الشاشات
function hideAllScreens() {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
}

// تبديل تبويبات تسجيل الدخول
function showLoginTab(tab) {
    // إخفاء جميع النماذج
    document.querySelectorAll('.auth-form').forEach(form => {
        form.classList.remove('active');
    });
    
    // إخفاء جميع الأزرار النشطة
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // عرض النموذج المحدد
    document.getElementById(tab + 'Form').classList.add('active');
    event.target.classList.add('active');
}

// معالجة تسجيل الدخول
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
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
            localStorage.setItem('token', data.token);
            currentUser = data.user;
            userCoins = data.user.coins || 2000;
            userRank = data.user.rank || 'visitor';
            
            // التحقق من الحظر
            if (data.user.banned) {
                showBanScreen(data.user.ban_reason, data.user.ban_duration);
                return;
            }
            
            showMainScreen();
            initializeSocket();
            loadUserData();
            
            // إشعار ترحيب
            showWelcomeNotification();
        } else {
            showError(data.error);
        }
    } catch (error) {
        console.error('Login error:', error);
        showError('حدث خطأ في تسجيل الدخول');
    }
}

// معالجة إنشاء حساب
async function handleRegister(e) {
    e.preventDefault();
    
    const displayName = document.getElementById('registerDisplayName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    
    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ display_name: displayName, email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('token', data.token);
            currentUser = data.user;
            userCoins = 2000; // النقاط الافتراضية للمستخدم الجديد
            userRank = 'visitor';
            
            showMainScreen();
            initializeSocket();
            loadUserData();
            
            // إشعار ترحيب للمستخدم الجديد
            showWelcomeNotification();
            showToast('مرحباً بك! حصلت على 2000 نقطة كهدية ترحيب', 'success');
        } else {
            showError(data.error);
        }
    } catch (error) {
        console.error('Register error:', error);
        showError('حدث خطأ في إنشاء الحساب');
    }
}

// معالجة دخول الزائر
async function handleGuestLogin(e) {
    e.preventDefault();
    
    const name = document.getElementById('guestName').value;
    const age = document.getElementById('guestAge').value;
    const gender = document.getElementById('guestGender').value;
    
    // إنشاء بيانات زائر مؤقتة
    currentUser = {
        id: Date.now(),
        display_name: name,
        rank: 'visitor',
        role: 'guest',
        age: parseInt(age),
        gender: gender,
        coins: 0
    };
    
    userCoins = 0;
    userRank = 'visitor';
    
    showMainScreen();
    initializeSocket();
    loadUserData();
    
    showToast('مرحباً بك كزائر!', 'info');
}

// تهيئة Socket.IO
function initializeSocket() {
    socket = io();
    
    // الانضمام للشات
    socket.emit('join', {
        userId: currentUser.id,
        displayName: currentUser.display_name,
        rank: currentUser.rank,
        email: currentUser.email,
        roomId: currentRoom
    });
    
    // استقبال الرسائل
    socket.on('newMessage', handleNewMessage);
    socket.on('newPrivateMessage', handleNewPrivateMessage);
    socket.on('userList', updateUsersList);
    socket.on('roomUsersList', updateRoomUsersList);
    socket.on('userJoined', handleUserJoined);
    socket.on('userLeft', handleUserLeft);
    socket.on('notification', handleNotification);
    socket.on('rankUpdated', handleRankUpdate);
    socket.on('userBanned', handleUserBanned);
    socket.on('messageDeleted', handleMessageDeleted);
    
    // أحداث المسابقات
    socket.on('quizQuestion', handleQuizQuestion);
    socket.on('quizResult', handleQuizResult);
    socket.on('quizLeaderboard', updateQuizLeaderboard);
}

// تحميل بيانات المستخدم
function loadUserData() {
    updateUserInterface();
    loadRooms();
    loadOnlineUsers();
    loadNotifications();
    
    // تحديث النقاط والرتبة
    updateCoinsDisplay();
    updateRankDisplay();
}

// تحديث واجهة المستخدم
function updateUserInterface() {
    if (!currentUser) return;
    
    // تحديث معلومات المستخدم في الشريط العلوي
    document.getElementById('headerUserName').textContent = currentUser.display_name;
    document.getElementById('headerUserRank').textContent = RANKS[currentUser.rank]?.emoji + ' ' + RANKS[currentUser.rank]?.name;
    
    // تحديث الصورة الشخصية
    const avatar = document.getElementById('headerUserAvatar');
    if (currentUser.profile_image1) {
        avatar.src = currentUser.profile_image1;
    } else {
        avatar.src = generateDefaultAvatar(currentUser.display_name);
    }
    
    // إظهار/إخفاء عناصر الإدارة
    const userRole = currentUser.role || 'user';
    document.body.setAttribute('data-user-role', userRole);
    
    if (userRole === 'admin' || userRole === 'owner') {
        document.querySelectorAll('.admin-only').forEach(el => {
            el.style.display = 'block';
        });
    }
    
    if (userRole === 'owner') {
        document.querySelectorAll('.owner-only').forEach(el => {
            el.style.display = 'block';
        });
    }
}

// تحديث عرض النقاط
function updateCoinsDisplay() {
    const coinsElements = document.querySelectorAll('#profileCoins, #userQuizPoints');
    coinsElements.forEach(el => {
        if (el) el.textContent = userCoins;
    });
}

// تحديث عرض الرتبة
function updateRankDisplay() {
    const rankElements = document.querySelectorAll('#currentRank, #headerUserRank');
    const rankInfo = RANKS[userRank];
    
    rankElements.forEach(el => {
        if (el) {
            el.textContent = rankInfo.emoji + ' ' + rankInfo.name;
            el.className = `rank-${userRank}`;
        }
    });
}

// إرسال رسالة
function sendMessage() {
    const input = document.getElementById('messageInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    socket.emit('sendMessage', {
        message: message,
        roomId: currentRoom
    });
    
    input.value = '';
}

// معالجة الرسالة الجديدة
function handleNewMessage(data) {
    const messagesContainer = document.getElementById('messagesContainer');
    const messageElement = createMessageElement(data);
    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    // تشغيل صوت الإشعار
    playNotificationSound();
}

// إنشاء عنصر الرسالة
function createMessageElement(data) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${data.user_id === currentUser.id ? 'own' : ''}`;
    messageDiv.setAttribute('data-message-id', data.id);
    
    const avatar = document.createElement('img');
    avatar.className = 'message-avatar';
    avatar.src = data.profile_image1 || generateDefaultAvatar(data.display_name);
    avatar.onclick = () => openUserProfile(data.user_id);
    
    const content = document.createElement('div');
    content.className = 'message-content';
    
    // تطبيق خلفية الرسالة المخصصة
    if (data.message_background) {
        content.style.backgroundImage = `url(${data.message_background})`;
        content.style.backgroundSize = 'cover';
        content.style.backgroundPosition = 'center';
    }
    
    const header = document.createElement('div');
    header.className = 'message-header';
    
    const author = document.createElement('span');
    author.className = 'message-author';
    author.textContent = data.display_name;
    author.onclick = () => openUserProfile(data.user_id);
    
    // تطبيق زخرفة الاسم
    if (data.name_decoration) {
        author.classList.add(`name-decoration-${data.name_decoration}`);
    }
    
    // تطبيق لون الاسم المخصص
    if (data.name_color) {
        author.style.color = data.name_color;
    }
    
    const rank = document.createElement('span');
    rank.className = `message-rank rank-${data.rank}`;
    rank.textContent = RANKS[data.rank]?.emoji;
    
    const time = document.createElement('span');
    time.className = 'message-time';
    time.textContent = formatTime(data.timestamp);
    
    header.appendChild(author);
    header.appendChild(rank);
    header.appendChild(time);
    
    const messageText = document.createElement('div');
    messageText.className = 'message-text';
    
    if (data.message) {
        messageText.textContent = data.message;
        // تطبيق لون الخط المخصص
        if (data.font_color) {
            messageText.style.color = data.font_color;
        }
    }
    
    content.appendChild(header);
    content.appendChild(messageText);
    
    // إضافة الوسائط
    if (data.image_url) {
        const img = document.createElement('img');
        img.className = 'message-image';
        img.src = data.image_url;
        img.onclick = () => openImageModal(data.image_url);
        content.appendChild(img);
    }
    
    if (data.voice_url) {
        const audio = document.createElement('audio');
        audio.className = 'message-audio';
        audio.controls = true;
        audio.src = data.voice_url;
        content.appendChild(audio);
    }
    
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(content);
    
    return messageDiv;
}

// فتح القائمة الرئيسية
function openMainMenu() {
    document.getElementById('mainMenuModal').classList.add('show');
}

// إغلاق القائمة الرئيسية
function closeMainMenu() {
    document.getElementById('mainMenuModal').classList.remove('show');
}

// فتح قسم الأخبار
function openNewsSection() {
    closeMainMenu();
    document.getElementById('newsModal').classList.add('show');
    loadNews();
}

// إغلاق قسم الأخبار
function closeNewsModal() {
    document.getElementById('newsModal').classList.remove('show');
}

// نشر خبر
async function postNews() {
    const content = document.getElementById('newsContentInput').value.trim();
    const fileInput = document.getElementById('newsFileInput');
    
    if (!content && !fileInput.files[0]) {
        showToast('يرجى كتابة محتوى أو اختيار ملف', 'warning');
        return;
    }
    
    const formData = new FormData();
    formData.append('content', content);
    
    if (fileInput.files[0]) {
        formData.append('media', fileInput.files[0]);
    }
    
    try {
        const response = await fetch('/api/news', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
        });
        
        if (response.ok) {
            document.getElementById('newsContentInput').value = '';
            fileInput.value = '';
            loadNews();
            showToast('تم نشر الخبر بنجاح', 'success');
        } else {
            const error = await response.json();
            showToast(error.error || 'حدث خطأ في نشر الخبر', 'error');
        }
    } catch (error) {
        console.error('Error posting news:', error);
        showToast('حدث خطأ في نشر الخبر', 'error');
    }
}

// تحميل الأخبار
async function loadNews() {
    try {
        const response = await fetch('/api/news', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
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
function displayNews(news) {
    const newsFeed = document.getElementById('newsFeed');
    newsFeed.innerHTML = '';
    
    news.forEach(item => {
        const newsElement = createNewsElement(item);
        newsFeed.appendChild(newsElement);
    });
}

// إنشاء عنصر الخبر
function createNewsElement(item) {
    const newsDiv = document.createElement('div');
    newsDiv.className = 'news-item';
    
    const header = document.createElement('div');
    header.className = 'news-header-info';
    
    const avatar = document.createElement('img');
    avatar.className = 'news-author-avatar';
    avatar.src = generateDefaultAvatar(item.display_name);
    
    const authorInfo = document.createElement('div');
    authorInfo.className = 'news-author-info';
    
    const authorName = document.createElement('h4');
    authorName.textContent = item.display_name;
    
    const time = document.createElement('span');
    time.className = 'news-time';
    time.textContent = formatTime(item.timestamp);
    
    authorInfo.appendChild(authorName);
    authorInfo.appendChild(time);
    
    header.appendChild(avatar);
    header.appendChild(authorInfo);
    
    const content = document.createElement('div');
    content.className = 'news-content';
    content.textContent = item.content;
    
    newsDiv.appendChild(header);
    newsDiv.appendChild(content);
    
    if (item.media) {
        const media = document.createElement('div');
        media.className = 'news-media';
        
        if (item.media.includes('.mp4') || item.media.includes('.webm')) {
            const video = document.createElement('video');
            video.controls = true;
            video.src = item.media;
            media.appendChild(video);
        } else {
            const img = document.createElement('img');
            img.src = item.media;
            img.onclick = () => openImageModal(item.media);
            media.appendChild(img);
        }
        
        newsDiv.appendChild(media);
    }
    
    return newsDiv;
}

// فتح قسم القصص
function openStoriesSection() {
    closeMainMenu();
    document.getElementById('storiesModal').classList.add('show');
    loadStories();
}

// إغلاق قسم القصص
function closeStoriesModal() {
    document.getElementById('storiesModal').classList.remove('show');
}

// فتح مودال إضافة قصة
function openAddStoryModal() {
    document.getElementById('addStoryModal').classList.add('show');
}

// إغلاق مودال إضافة قصة
function closeAddStoryModal() {
    document.getElementById('addStoryModal').classList.remove('show');
}

// إضافة قصة
async function addStory() {
    const mediaInput = document.getElementById('storyMediaInput');
    const textInput = document.getElementById('storyTextInput');
    
    if (!mediaInput.files[0]) {
        showToast('يرجى اختيار صورة أو فيديو', 'warning');
        return;
    }
    
    const formData = new FormData();
    formData.append('media', mediaInput.files[0]);
    formData.append('text', textInput.value);
    
    try {
        const response = await fetch('/api/stories', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
        });
        
        if (response.ok) {
            closeAddStoryModal();
            loadStories();
            showToast('تم إضافة القصة بنجاح', 'success');
            
            // مسح النموذج
            mediaInput.value = '';
            textInput.value = '';
        } else {
            const error = await response.json();
            showToast(error.error || 'حدث خطأ في إضافة القصة', 'error');
        }
    } catch (error) {
        console.error('Error adding story:', error);
        showToast('حدث خطأ في إضافة القصة', 'error');
    }
}

// تحميل القصص
async function loadStories() {
    try {
        const response = await fetch('/api/stories', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
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
function displayStories(stories) {
    const storiesContainer = document.getElementById('storiesContainer');
    storiesContainer.innerHTML = '';
    
    stories.forEach(story => {
        const storyElement = createStoryElement(story);
        storiesContainer.appendChild(storyElement);
    });
}

// إنشاء عنصر القصة
function createStoryElement(story) {
    const storyDiv = document.createElement('div');
    storyDiv.className = 'story-item';
    storyDiv.onclick = () => viewStory(story);
    
    if (story.image) {
        const img = document.createElement('img');
        img.src = story.image;
        storyDiv.appendChild(img);
    }
    
    const overlay = document.createElement('div');
    overlay.className = 'story-overlay';
    
    const author = document.createElement('div');
    author.className = 'story-author';
    author.textContent = story.display_name;
    
    const time = document.createElement('div');
    time.className = 'story-time';
    time.textContent = formatTime(story.timestamp);
    
    overlay.appendChild(author);
    overlay.appendChild(time);
    storyDiv.appendChild(overlay);
    
    return storyDiv;
}

// فتح غرفة المسابقات
function openQuizRoom() {
    closeMainMenu();
    document.getElementById('quizRoomModal').classList.add('show');
    startQuiz();
}

// إغلاق غرفة المسابقات
function closeQuizRoom() {
    document.getElementById('quizRoomModal').classList.remove('show');
    if (quizTimer) {
        clearInterval(quizTimer);
    }
}

// بدء المسابقة
function startQuiz() {
    // اختيار سؤال عشوائي
    currentQuestion = QUIZ_QUESTIONS[Math.floor(Math.random() * QUIZ_QUESTIONS.length)];
    displayQuestion(currentQuestion);
    startQuizTimer();
}

// عرض السؤال
function displayQuestion(question) {
    document.getElementById('questionText').textContent = question.question;
    
    const optionsContainer = document.getElementById('questionOptions');
    optionsContainer.innerHTML = '';
    
    question.options.forEach((option, index) => {
        const button = document.createElement('button');
        button.className = 'option-btn';
        button.textContent = option;
        button.onclick = () => selectAnswer(index);
        optionsContainer.appendChild(button);
    });
}

// اختيار الإجابة
function selectAnswer(selectedIndex) {
    if (!currentQuestion) return;
    
    const isCorrect = selectedIndex === currentQuestion.correct;
    
    if (isCorrect) {
        userCoins += currentQuestion.points;
        updateCoinsDisplay();
        showToast(`إجابة صحيحة! حصلت على ${currentQuestion.points} نقطة`, 'success');
        
        // التحقق من ترقية الرتبة
        checkRankUpgrade();
    } else {
        showToast('إجابة خاطئة!', 'error');
    }
    
    // عرض الإجابة الصحيحة
    const options = document.querySelectorAll('.option-btn');
    options.forEach((btn, index) => {
        if (index === currentQuestion.correct) {
            btn.style.background = '#4CAF50';
        } else if (index === selectedIndex && !isCorrect) {
            btn.style.background = '#f44336';
        }
        btn.disabled = true;
    });
    
    // سؤال جديد بعد 3 ثوان
    setTimeout(() => {
        startQuiz();
    }, 3000);
}

// بدء مؤقت المسابقة
function startQuizTimer() {
    let timeLeft = 30;
    document.getElementById('quizTimer').textContent = timeLeft;
    
    quizTimer = setInterval(() => {
        timeLeft--;
        document.getElementById('quizTimer').textContent = timeLeft;
        
        if (timeLeft <= 0) {
            clearInterval(quizTimer);
            showToast('انتهى الوقت!', 'warning');
            
            // إظهار الإجابة الصحيحة
            const options = document.querySelectorAll('.option-btn');
            options[currentQuestion.correct].style.background = '#4CAF50';
            options.forEach(btn => btn.disabled = true);
            
            // سؤال جديد بعد 3 ثوان
            setTimeout(() => {
                startQuiz();
            }, 3000);
        }
    }, 1000);
}

// التحقق من ترقية الرتبة
function checkRankUpgrade() {
    const currentRankLevel = RANKS[userRank].level;
    let newRank = userRank;
    
    // منطق ترقية الرتب بناءً على النقاط
    if (userCoins >= 3000 && currentRankLevel < 1) {
        newRank = 'bronze';
    } else if (userCoins >= 5000 && currentRankLevel < 2) {
        newRank = 'silver';
    } else if (userCoins >= 8000 && currentRankLevel < 3) {
        newRank = 'gold';
    } else if (userCoins >= 12000 && currentRankLevel < 4) {
        newRank = 'trophy';
    } else if (userCoins >= 20000 && currentRankLevel < 5) {
        newRank = 'diamond';
    }
    
    if (newRank !== userRank) {
        userRank = newRank;
        updateRankDisplay();
        showRankUpgradeNotification(newRank);
        
        // تحديث الرتبة في الخادم
        updateUserRank(newRank);
    }
}

// إشعار ترقية الرتبة
function showRankUpgradeNotification(rank) {
    const rankInfo = RANKS[rank];
    showToast(`🎉 Congratulations! You have earned the ${rankInfo.name} rank!`, 'success');
    
    // إشعار للجميع
    if (socket) {
        socket.emit('rankUpgrade', {
            userId: currentUser.id,
            displayName: currentUser.display_name,
            newRank: rank
        });
    }
}

// فتح مودال الملف الشخصي
function openProfileModal() {
    document.getElementById('profileModal').classList.add('show');
    loadProfileData();
}

// إغلاق مودال الملف الشخصي
function closeProfileModal() {
    document.getElementById('profileModal').classList.remove('show');
}

// تحميل بيانات الملف الشخصي
function loadProfileData() {
    if (!currentUser) return;
    
    // تحميل الصور
    if (currentUser.profile_image1) {
        document.getElementById('profileImg1').src = currentUser.profile_image1;
    }
    if (currentUser.profile_image2) {
        document.getElementById('profileImg2').src = currentUser.profile_image2;
    }
    if (currentUser.background_image) {
        document.getElementById('profileCover').src = currentUser.background_image;
    }
    
    // تحميل المعلومات
    document.getElementById('displayNameInput').value = currentUser.display_name || '';
    document.getElementById('emailInput').value = currentUser.email || '';
    document.getElementById('ageInput').value = currentUser.age || '';
    document.getElementById('genderInput').value = currentUser.gender || '';
    document.getElementById('aboutMeInput').value = currentUser.about_me || '';
    
    // تحديث الإحصائيات
    document.getElementById('profileLikes').textContent = currentUser.likes || 0;
    document.getElementById('profileCoins').textContent = userCoins;
}

// تبديل تبويبات الملف الشخصي
function showProfileTab(tab) {
    // إخفاء جميع التبويبات
    document.querySelectorAll('.profile-tab').forEach(tabContent => {
        tabContent.classList.remove('active');
    });
    
    // إخفاء جميع الأزرار النشطة
    document.querySelectorAll('.profile-tabs .tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // عرض التبويب المحدد
    document.getElementById('profile' + tab.charAt(0).toUpperCase() + tab.slice(1) + 'Tab').classList.add('active');
    event.target.classList.add('active');
}

// تحديث الملف الشخصي
async function updateProfile() {
    const formData = new FormData();
    
    // جمع البيانات
    const displayName = document.getElementById('displayNameInput').value;
    const email = document.getElementById('emailInput').value;
    const newPassword = document.getElementById('newPasswordInput').value;
    const age = document.getElementById('ageInput').value;
    const gender = document.getElementById('genderInput').value;
    const aboutMe = document.getElementById('aboutMeInput').value;
    
    formData.append('display_name', displayName);
    formData.append('email', email);
    if (newPassword) formData.append('password', newPassword);
    formData.append('age', age);
    formData.append('gender', gender);
    formData.append('about_me', aboutMe);
    
    // إضافة الصور
    const profileFile1 = document.getElementById('profileFile1').files[0];
    const profileFile2 = document.getElementById('profileFile2').files[0];
    const coverFile = document.getElementById('coverInput').files[0];
    
    if (profileFile1) formData.append('profileImage1', profileFile1);
    if (profileFile2) formData.append('profileImage2', profileFile2);
    if (coverFile) formData.append('coverImage', coverFile);
    
    try {
        const response = await fetch('/api/user/profile', {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
        });
        
        if (response.ok) {
            const updatedUser = await response.json();
            currentUser = { ...currentUser, ...updatedUser };
            updateUserInterface();
            showToast('تم تحديث الملف الشخصي بنجاح', 'success');
        } else {
            const error = await response.json();
            showToast(error.error || 'حدث خطأ في تحديث الملف الشخصي', 'error');
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        showToast('حدث خطأ في تحديث الملف الشخصي', 'error');
    }
}

// معاينة الصورة الشخصية
function previewProfileImage(slot, input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById(`profileImg${slot}`).src = e.target.result;
        };
        reader.readAsDataURL(input.files[0]);
    }
}

// معاينة صورة الغلاف
function previewCoverImage(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('profileCover').src = e.target.result;
        };
        reader.readAsDataURL(input.files[0]);
    }
}

// تحديث لون الاسم
function updateNameColor() {
    const color = document.getElementById('nameColorPicker').value;
    currentUser.name_color = color;
    
    // تطبيق اللون فوراً
    document.querySelectorAll('.message-author').forEach(el => {
        if (el.textContent === currentUser.display_name) {
            el.style.color = color;
        }
    });
    
    showToast('تم تحديث لون الاسم', 'success');
}

// تحديث لون الخط
function updateFontColor() {
    const color = document.getElementById('fontColorPicker').value;
    currentUser.font_color = color;
    showToast('تم تحديث لون الخط', 'success');
}

// تحديث زخرفة الاسم
function updateNameDecoration() {
    const decoration = document.getElementById('nameDecorationSelect').value;
    
    // التحقق من الصلاحيات
    const userRankLevel = RANKS[userRank].level;
    const requiredLevel = {
        'fire': 3,
        'star': 4,
        'crown': 5,
        'diamond': 6,
        'rainbow': 7
    };
    
    if (decoration && requiredLevel[decoration] && userRankLevel < requiredLevel[decoration]) {
        showToast('هذه الزخرفة متاحة للرتب العالية فقط', 'warning');
        return;
    }
    
    currentUser.name_decoration = decoration;
    showToast('تم تحديث زخرفة الاسم', 'success');
}

// رفع موسيقى البروفايل
async function uploadProfileMusic() {
    const fileInput = document.getElementById('profileMusicInput');
    
    if (!fileInput.files[0]) {
        showToast('يرجى اختيار ملف صوتي', 'warning');
        return;
    }
    
    // التحقق من الصلاحيات
    const userRankLevel = RANKS[userRank].level;
    if (userRankLevel < 4) {
        showToast('موسيقى البروفايل متاحة للرتب العالية فقط', 'warning');
        return;
    }
    
    const formData = new FormData();
    formData.append('music', fileInput.files[0]);
    
    try {
        const response = await fetch('/api/user/profile-music', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
        });
        
        if (response.ok) {
            const data = await response.json();
            currentUser.profile_music = data.music_url;
            
            // عرض مشغل الموسيقى
            const audio = document.getElementById('profileAudio');
            audio.src = data.music_url;
            audio.style.display = 'block';
            
            showToast('تم رفع موسيقى البروفايل بنجاح', 'success');
        } else {
            const error = await response.json();
            showToast(error.error || 'حدث خطأ في رفع الموسيقى', 'error');
        }
    } catch (error) {
        console.error('Error uploading music:', error);
        showToast('حدث خطأ في رفع الموسيقى', 'error');
    }
}

// إزالة موسيقى البروفايل
function removeProfileMusic() {
    currentUser.profile_music = null;
    document.getElementById('profileAudio').style.display = 'none';
    document.getElementById('profileMusicInput').value = '';
    showToast('تم إزالة موسيقى البروفايل', 'success');
}

// فتح ملف شخصي لمستخدم آخر
async function openUserProfile(userId) {
    if (userId === currentUser.id) {
        openProfileModal();
        return;
    }
    
    try {
        const response = await fetch(`/api/user-info/${userId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (response.ok) {
            const user = await response.json();
            displayUserProfile(user);
        } else {
            showToast('لا يمكن عرض الملف الشخصي', 'error');
        }
    } catch (error) {
        console.error('Error loading user profile:', error);
        showToast('حدث خطأ في تحميل الملف الشخصي', 'error');
    }
}

// عرض ملف شخصي لمستخدم آخر
function displayUserProfile(user) {
    document.getElementById('viewProfileModal').classList.add('show');
    
    // تحديث المعلومات
    document.getElementById('viewProfileName').textContent = user.display_name;
    
    if (user.profile_image1) {
        document.getElementById('viewProfileImg1').src = user.profile_image1;
    }
    if (user.profile_image2) {
        document.getElementById('viewProfileImg2').src = user.profile_image2;
    }
    if (user.background_image) {
        document.getElementById('viewProfileCover').src = user.background_image;
    }
    
    document.getElementById('viewProfileLikes').textContent = user.likes || 0;
    document.getElementById('viewProfileCoins').textContent = user.coins || 0;
    
    // عرض المعلومات الشخصية
    const infoDiv = document.getElementById('viewProfileInfo');
    infoDiv.innerHTML = `
        <div class="info-item">
            <strong>العمر:</strong> ${user.age || 'غير محدد'}
        </div>
        <div class="info-item">
            <strong>الجنس:</strong> ${user.gender || 'غير محدد'}
        </div>
        <div class="info-item">
            <strong>الحالة الاجتماعية:</strong> ${user.marital_status || 'غير محدد'}
        </div>
        <div class="info-item">
            <strong>نبذة:</strong> ${user.about_me || 'لا توجد معلومات'}
        </div>
        <div class="info-item">
            <strong>الرتبة:</strong> ${RANKS[user.rank]?.emoji} ${RANKS[user.rank]?.name}
        </div>
    `;
    
    // عرض موسيقى البروفايل
    const musicDiv = document.getElementById('viewProfileMusic');
    if (user.profile_music) {
        musicDiv.innerHTML = `
            <h4>موسيقى البروفايل</h4>
            <audio controls>
                <source src="${user.profile_music}" type="audio/mpeg">
            </audio>
        `;
    } else {
        musicDiv.innerHTML = '';
    }
    
    // حفظ معرف المستخدم للإجراءات
    window.viewingUserId = user.id;
}

// إغلاق مودال عرض الملف الشخصي
function closeViewProfileModal() {
    document.getElementById('viewProfileModal').classList.remove('show');
}

// إعجاب بالملف الشخصي
async function likeProfile() {
    if (!window.viewingUserId) return;
    
    try {
        const response = await fetch('/api/user/like', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ userId: window.viewingUserId })
        });
        
        if (response.ok) {
            const data = await response.json();
            document.getElementById('viewProfileLikes').textContent = data.likes;
            showToast('تم الإعجاب بالملف الشخصي', 'success');
        } else {
            const error = await response.json();
            showToast(error.error || 'حدث خطأ', 'error');
        }
    } catch (error) {
        console.error('Error liking profile:', error);
        showToast('حدث خطأ في الإعجاب', 'error');
    }
}

// فتح لوحة الإدارة
function openAdminPanel() {
    if (currentUser.role !== 'admin' && currentUser.role !== 'owner') {
        showToast('غير مسموح - للإداريين فقط', 'error');
        return;
    }
    
    document.getElementById('adminModal').classList.add('show');
    loadAdminData();
}

// إغلاق لوحة الإدارة
function closeAdminModal() {
    document.getElementById('adminModal').classList.remove('show');
}

// تبديل تبويبات الإدارة
function showAdminTab(tab) {
    // إخفاء جميع التبويبات
    document.querySelectorAll('.admin-tab').forEach(tabContent => {
        tabContent.classList.remove('active');
    });
    
    // إخفاء جميع الأزرار النشطة
    document.querySelectorAll('.admin-tabs .tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // عرض التبويب المحدد
    document.getElementById('admin' + tab.charAt(0).toUpperCase() + tab.slice(1) + 'Tab').classList.add('active');
    event.target.classList.add('active');
    
    // تحميل البيانات حسب التبويب
    switch(tab) {
        case 'users':
            loadAdminUsers();
            break;
        case 'ranks':
            loadRanksManagement();
            break;
        case 'rooms':
            loadRoomsManagement();
            break;
        case 'bans':
            loadBansManagement();
            break;
        case 'coins':
            loadCoinsManagement();
            break;
        case 'notifications':
            loadNotificationsManagement();
            break;
    }
}

// تحميل بيانات الإدارة
function loadAdminData() {
    loadAdminUsers();
    loadRanksManagement();
}

// تحميل المستخدمين للإدارة
async function loadAdminUsers() {
    try {
        const response = await fetch('/api/all-users', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (response.ok) {
            const users = await response.json();
            displayAdminUsers(users);
        }
    } catch (error) {
        console.error('Error loading admin users:', error);
    }
}

// عرض المستخدمين في لوحة الإدارة
function displayAdminUsers(users) {
    const usersList = document.getElementById('adminUsersList');
    usersList.innerHTML = '';
    
    users.forEach(user => {
        const userElement = createAdminUserElement(user);
        usersList.appendChild(userElement);
    });
}

// إنشاء عنصر المستخدم في لوحة الإدارة
function createAdminUserElement(user) {
    const userDiv = document.createElement('div');
    userDiv.className = 'admin-user-item';
    
    const userInfo = document.createElement('div');
    userInfo.className = 'admin-user-info';
    
    const avatar = document.createElement('img');
    avatar.className = 'admin-user-avatar';
    avatar.src = user.profile_image1 || generateDefaultAvatar(user.display_name);
    
    const details = document.createElement('div');
    details.className = 'admin-user-details';
    
    const name = document.createElement('h4');
    name.textContent = user.display_name;
    
    const rank = document.createElement('span');
    rank.className = 'admin-user-rank';
    rank.textContent = RANKS[user.rank]?.emoji + ' ' + RANKS[user.rank]?.name;
    
    const email = document.createElement('span');
    email.textContent = user.email;
    email.style.fontSize = '0.8rem';
    email.style.color = '#888';
    
    details.appendChild(name);
    details.appendChild(rank);
    details.appendChild(email);
    
    userInfo.appendChild(avatar);
    userInfo.appendChild(details);
    
    const actions = document.createElement('div');
    actions.className = 'admin-user-actions';
    
    // أزرار الإجراءات
    const viewBtn = document.createElement('button');
    viewBtn.className = 'admin-action-btn profile-btn';
    viewBtn.textContent = 'عرض';
    viewBtn.onclick = () => openUserProfile(user.id);
    
    const banBtn = document.createElement('button');
    banBtn.className = 'admin-action-btn ban-btn';
    banBtn.textContent = 'حظر';
    banBtn.onclick = () => openBanUserModal(user);
    
    const rankBtn = document.createElement('button');
    rankBtn.className = 'admin-action-btn rank-btn';
    rankBtn.textContent = 'رتبة';
    rankBtn.onclick = () => openAssignRankModal(user);
    
    const coinsBtn = document.createElement('button');
    coinsBtn.className = 'admin-action-btn';
    coinsBtn.style.background = '#4CAF50';
    coinsBtn.textContent = 'نقاط';
    coinsBtn.onclick = () => openGiveCoinsModal(user);
    
    actions.appendChild(viewBtn);
    actions.appendChild(banBtn);
    actions.appendChild(rankBtn);
    actions.appendChild(coinsBtn);
    
    userDiv.appendChild(userInfo);
    userDiv.appendChild(actions);
    
    return userDiv;
}

// فتح مودال حظر المستخدم
function openBanUserModal(user) {
    document.getElementById('banUserModal').classList.add('show');
    window.banTargetUser = user;
}

// إغلاق مودال حظر المستخدم
function closeBanUserModal() {
    document.getElementById('banUserModal').classList.remove('show');
}

// تأكيد حظر المستخدم
async function confirmBanUser() {
    if (!window.banTargetUser) return;
    
    const reason = document.getElementById('banReason').value.trim();
    const duration = document.getElementById('banDuration').value;
    
    if (!reason) {
        showToast('يرجى كتابة سبب الحظر', 'warning');
        return;
    }
    
    try {
        const response = await fetch('/api/ban', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                userId: window.banTargetUser.id,
                reason: reason,
                duration: duration
            })
        });
        
        if (response.ok) {
            closeBanUserModal();
            showToast('تم حظر المستخدم بنجاح', 'success');
            
            // مسح النموذج
            document.getElementById('banReason').value = '';
            
            // تحديث قائمة المستخدمين
            loadAdminUsers();
        } else {
            const error = await response.json();
            showToast(error.error || 'حدث خطأ في حظر المستخدم', 'error');
        }
    } catch (error) {
        console.error('Error banning user:', error);
        showToast('حدث خطأ في حظر المستخدم', 'error');
    }
}

// فتح مودال تعيين الرتبة
function openAssignRankModal(user) {
    document.getElementById('assignRankModal').classList.add('show');
    document.getElementById('rankTargetUser').textContent = user.display_name;
    window.rankTargetUser = user;
}

// إغلاق مودال تعيين الرتبة
function closeAssignRankModal() {
    document.getElementById('assignRankModal').classList.remove('show');
}

// تأكيد تعيين الرتبة
async function confirmAssignRank() {
    if (!window.rankTargetUser) return;
    
    const newRank = document.getElementById('newRankSelect').value;
    const reason = document.getElementById('rankChangeReason').value;
    
    if (!newRank) {
        showToast('يرجى اختيار الرتبة', 'warning');
        return;
    }
    
    // التحقق من الصلاحيات
    if (newRank === 'owner' && currentUser.role !== 'owner') {
        showToast('لا يمكن تعيين رتبة المالك', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/assign-rank', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                userId: window.rankTargetUser.id,
                rank: newRank,
                reason: reason
            })
        });
        
        if (response.ok) {
            closeAssignRankModal();
            showToast('تم تعيين الرتبة بنجاح', 'success');
            
            // مسح النموذج
            document.getElementById('rankChangeReason').value = '';
            
            // تحديث قائمة المستخدمين
            loadAdminUsers();
        } else {
            const error = await response.json();
            showToast(error.error || 'حدث خطأ في تعيين الرتبة', 'error');
        }
    } catch (error) {
        console.error('Error assigning rank:', error);
        showToast('حدث خطأ في تعيين الرتبة', 'error');
    }
}

// تحميل إدارة الرتب
function loadRanksManagement() {
    const ranksList = document.getElementById('ranksList');
    ranksList.innerHTML = '';
    
    Object.entries(RANKS).forEach(([key, rank]) => {
        const rankElement = createRankElement(key, rank);
        ranksList.appendChild(rankElement);
    });
}

// إنشاء عنصر الرتبة
function createRankElement(key, rank) {
    const rankDiv = document.createElement('div');
    rankDiv.className = 'rank-item';
    
    const emoji = document.createElement('div');
    emoji.className = 'rank-emoji';
    emoji.textContent = rank.emoji;
    
    const name = document.createElement('div');
    name.className = 'rank-name';
    name.textContent = rank.name;
    name.style.color = rank.color;
    
    const level = document.createElement('div');
    level.className = 'rank-level';
    level.textContent = `المستوى: ${rank.level}`;
    
    rankDiv.appendChild(emoji);
    rankDiv.appendChild(name);
    rankDiv.appendChild(level);
    
    return rankDiv;
}

// إرسال إشعار
async function sendNotification() {
    const target = document.getElementById('notificationTarget').value;
    const message = document.getElementById('notificationMessage').value.trim();
    const specificUser = document.getElementById('specificUserSelect').value;
    
    if (!message) {
        showToast('يرجى كتابة نص الإشعار', 'warning');
        return;
    }
    
    if (target === 'specific' && !specificUser) {
        showToast('يرجى اختيار المستخدم', 'warning');
        return;
    }
    
    try {
        const response = await fetch('/api/send-notification', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                target: target,
                userId: target === 'specific' ? specificUser : null,
                message: message
            })
        });
        
        if (response.ok) {
            document.getElementById('notificationMessage').value = '';
            showToast('تم إرسال الإشعار بنجاح', 'success');
        } else {
            const error = await response.json();
            showToast(error.error || 'حدث خطأ في إرسال الإشعار', 'error');
        }
    } catch (error) {
        console.error('Error sending notification:', error);
        showToast('حدث خطأ في إرسال الإشعار', 'error');
    }
}

// تبديل وضع الدردشة
function toggleChatMode() {
    // منطق تبديل بين الدردشة العامة والخاصة
    showToast('تم تبديل وضع الدردشة', 'info');
}

// تسجيل صوتي
function toggleVoiceRecording() {
    if (isRecording) {
        stopRecording();
    } else {
        startRecording();
    }
}

// بدء التسجيل
async function startRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        recordedChunks = [];
        
        mediaRecorder.ondataavailable = function(event) {
            if (event.data.size > 0) {
                recordedChunks.push(event.data);
            }
        };
        
        mediaRecorder.onstop = function() {
            const blob = new Blob(recordedChunks, { type: 'audio/webm' });
            sendVoiceMessage(blob);
        };
        
        mediaRecorder.start();
        isRecording = true;
        
        const voiceBtn = document.getElementById('voiceBtn');
        voiceBtn.classList.add('recording');
        voiceBtn.innerHTML = '<i class="fas fa-stop"></i>';
        
        showToast('بدء التسجيل...', 'info');
    } catch (error) {
        console.error('Error starting recording:', error);
        showToast('حدث خطأ في بدء التسجيل', 'error');
    }
}

// إيقاف التسجيل
function stopRecording() {
    if (mediaRecorder && isRecording) {
        mediaRecorder.stop();
        isRecording = false;
        
        const voiceBtn = document.getElementById('voiceBtn');
        voiceBtn.classList.remove('recording');
        voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
        
        // إيقاف الميكروفون
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
        
        showToast('تم إيقاف التسجيل', 'info');
    }
}

// إرسال رسالة صوتية
async function sendVoiceMessage(blob) {
    const formData = new FormData();
    formData.append('voice', blob, 'voice.webm');
    formData.append('roomId', currentRoom);
    
    try {
        const response = await fetch('/api/upload-voice', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
        });
        
        if (response.ok) {
            const data = await response.json();
            socket.emit('sendMessage', {
                voice_url: data.voice_url,
                roomId: currentRoom
            });
        } else {
            showToast('حدث خطأ في إرسال الرسالة الصوتية', 'error');
        }
    } catch (error) {
        console.error('Error sending voice message:', error);
        showToast('حدث خطأ في إرسال الرسالة الصوتية', 'error');
    }
}

// معالجة رفع الصور
function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('image', file);
    formData.append('roomId', currentRoom);
    
    fetch('/api/upload-image', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.image_url) {
            socket.emit('sendMessage', {
                image_url: data.image_url,
                roomId: currentRoom
            });
        } else {
            showToast('حدث خطأ في رفع الصورة', 'error');
        }
    })
    .catch(error => {
        console.error('Error uploading image:', error);
        showToast('حدث خطأ في رفع الصورة', 'error');
    });
}

// فتح مشغل الراديو
function openRadioPlayer() {
    document.getElementById('radioPlayerModal').classList.add('show');
}

// إغلاق مشغل الراديو
function closeRadioPlayer() {
    document.getElementById('radioPlayerModal').classList.remove('show');
}

// تشغيل محطة راديو
function playRadioStation(station) {
    // منطق تشغيل محطات الراديو
    showToast(`تم تشغيل ${station}`, 'success');
}

// تبديل الراديو
function toggleRadio() {
    const playBtn = document.getElementById('radioPlayBtn');
    const isPlaying = playBtn.innerHTML.includes('pause');
    
    if (isPlaying) {
        playBtn.innerHTML = '<i class="fas fa-play"></i>';
        showToast('تم إيقاف الراديو', 'info');
    } else {
        playBtn.innerHTML = '<i class="fas fa-pause"></i>';
        showToast('تم تشغيل الراديو', 'info');
    }
}

// رفع موسيقى مخصصة
function uploadCustomMusic() {
    const fileInput = document.getElementById('customMusicInput');
    if (!fileInput.files.length) {
        showToast('يرجى اختيار ملفات صوتية', 'warning');
        return;
    }
    
    // منطق رفع الملفات الصوتية
    showToast('تم رفع الأغاني بنجاح', 'success');
}

// تحديث مستوى الصوت
function adjustVolume(value) {
    // منطق تعديل مستوى الصوت
    console.log('Volume adjusted to:', value);
}

// فتح الإشعارات
function openNotifications() {
    document.getElementById('notificationsModal').classList.add('show');
    loadNotifications();
}

// إغلاق الإشعارات
function closeNotificationsModal() {
    document.getElementById('notificationsModal').classList.remove('show');
}

// تحميل الإشعارات
function loadNotifications() {
    const notificationsList = document.getElementById('notificationsList');
    notificationsList.innerHTML = '';
    
    if (notifications.length === 0) {
        notificationsList.innerHTML = '<p>لا توجد إشعارات</p>';
        return;
    }
    
    notifications.forEach(notification => {
        const notificationElement = createNotificationElement(notification);
        notificationsList.appendChild(notificationElement);
    });
}

// إنشاء عنصر الإشعار
function createNotificationElement(notification) {
    const notificationDiv = document.createElement('div');
    notificationDiv.className = 'notification-item';
    
    const content = document.createElement('div');
    content.className = 'notification-content';
    content.textContent = notification.message;
    
    const time = document.createElement('div');
    time.className = 'notification-time';
    time.textContent = formatTime(notification.timestamp);
    
    notificationDiv.appendChild(content);
    notificationDiv.appendChild(time);
    
    return notificationDiv;
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
    const soundNotifications = document.getElementById('soundNotifications').checked;
    const saveChatHistory = document.getElementById('saveChatHistory').checked;
    
    // حفظ الإعدادات في localStorage
    localStorage.setItem('soundNotifications', soundNotifications);
    localStorage.setItem('saveChatHistory', saveChatHistory);
    
    showToast('تم حفظ الإعدادات', 'success');
}

// الخروج من الدردشة
function exitChat() {
    if (confirm('هل أنت متأكد من الخروج من الدردشة؟')) {
        logout();
    }
}

// الخروج من الغرفة
function exitRoom() {
    if (confirm('هل أنت متأكد من الخروج من الغرفة؟')) {
        currentRoom = 1; // العودة للغرفة الرئيسية
        socket.emit('changeRoom', 1);
        showToast('تم الخروج من الغرفة', 'info');
    }
}

// تسجيل الخروج
function logout() {
    localStorage.removeItem('token');
    if (socket) {
        socket.disconnect();
    }
    location.reload();
}

// تحديث الصفحة
function reloadPage() {
    location.reload();
}

// تحميل الغرف
async function loadRooms() {
    try {
        const response = await fetch('/api/rooms', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
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
    // منطق عرض الغرف
    console.log('Rooms loaded:', rooms);
}

// تحميل المستخدمين المتصلين
async function loadOnlineUsers() {
    try {
        const response = await fetch('/api/users', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
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
    const usersList = document.getElementById('onlineUsersList');
    const onlineCount = document.getElementById('onlineCount');
    
    usersList.innerHTML = '';
    onlineCount.textContent = users.length;
    
    // ترتيب المستخدمين حسب الرتبة
    users.sort((a, b) => {
        const rankA = RANKS[a.rank]?.level || 0;
        const rankB = RANKS[b.rank]?.level || 0;
        return rankB - rankA;
    });
    
    users.forEach(user => {
        const userElement = createOnlineUserElement(user);
        usersList.appendChild(userElement);
    });
}

// إنشاء عنصر المستخدم المتصل
function createOnlineUserElement(user) {
    const userDiv = document.createElement('div');
    userDiv.className = 'user-item';
    userDiv.onclick = () => openUserActionsModal(user);
    
    const avatar = document.createElement('img');
    avatar.className = 'user-avatar';
    avatar.src = user.profile_image1 || generateDefaultAvatar(user.display_name);
    
    const details = document.createElement('div');
    details.className = 'user-details';
    
    const name = document.createElement('div');
    name.className = `user-display-name rank-${user.rank}`;
    name.textContent = user.display_name;
    
    const status = document.createElement('div');
    status.className = 'user-status';
    status.textContent = RANKS[user.rank]?.emoji + ' ' + RANKS[user.rank]?.name;
    
    details.appendChild(name);
    details.appendChild(status);
    
    userDiv.appendChild(avatar);
    userDiv.appendChild(details);
    
    return userDiv;
}

// فتح مودال إجراءات المستخدم
function openUserActionsModal(user) {
    document.getElementById('userActionsModal').classList.add('show');
    
    document.getElementById('actionUserAvatar').src = user.profile_image1 || generateDefaultAvatar(user.display_name);
    document.getElementById('actionUserName').textContent = user.display_name;
    
    window.actionTargetUser = user;
}

// إغلاق مودال إجراءات المستخدم
function closeUserActionsModal() {
    document.getElementById('userActionsModal').classList.remove('show');
}

// إرسال رسالة خاصة
function sendPrivateMessage() {
    if (!window.actionTargetUser && !window.viewingUserId) return;
    
    const userId = window.actionTargetUser?.id || window.viewingUserId;
    // منطق فتح نافذة الدردشة الخاصة
    showToast('فتح الدردشة الخاصة...', 'info');
}

// معالجة الأحداث
function handleNewPrivateMessage(data) {
    // منطق معالجة الرسائل الخاصة
    console.log('New private message:', data);
}

function updateUsersList(users) {
    displayOnlineUsers(users);
}

function updateRoomUsersList(users) {
    // منطق تحديث مستخدمي الغرفة
    console.log('Room users updated:', users);
}

function handleUserJoined(data) {
    showToast(`${data.displayName} انضم للدردشة - الرتبة: ${RANKS[data.rank]?.name}`, 'info');
    addNotification({
        message: `👋 Welcome ${data.displayName} — Rank: ${RANKS[data.rank]?.name}`,
        timestamp: new Date(),
        type: 'welcome'
    });
}

function handleUserLeft(data) {
    showToast(`${data.displayName} غادر الدردشة`, 'info');
}

function handleNotification(data) {
    addNotification(data);
    showToast(data.message, data.type || 'info');
}

function handleRankUpdate(data) {
    if (data.userId === currentUser.id) {
        userRank = data.newRank;
        updateRankDisplay();
        showRankUpgradeNotification(data.newRank);
    }
}

function handleUserBanned(data) {
    if (data.userId === currentUser.id) {
        showBanScreen(data.reason, data.duration);
    }
}

function handleMessageDeleted(messageId) {
    const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
    if (messageElement) {
        messageElement.remove();
    }
}

function handleQuizQuestion(data) {
    currentQuestion = data;
    displayQuestion(data);
}

function handleQuizResult(data) {
    if (data.correct) {
        userCoins += data.points;
        updateCoinsDisplay();
        checkRankUpgrade();
    }
}

function updateQuizLeaderboard(data) {
    const leaderboard = document.getElementById('leaderboardList');
    leaderboard.innerHTML = '';
    
    data.forEach((user, index) => {
        const item = document.createElement('div');
        item.textContent = `${index + 1}. ${user.name} - ${user.points} نقطة`;
        leaderboard.appendChild(item);
    });
}

// إضافة إشعار
function addNotification(notification) {
    notifications.unshift(notification);
    
    // الحد الأقصى للإشعارات
    if (notifications.length > 50) {
        notifications = notifications.slice(0, 50);
    }
    
    // تحديث عداد الإشعارات
    const count = document.getElementById('notificationCount');
    count.textContent = notifications.length;
    count.style.display = notifications.length > 0 ? 'block' : 'none';
}

// إظهار إشعار الترحيب
function showWelcomeNotification() {
    const welcomeMessage = `👋 Welcome ${currentUser.display_name} — Rank: ${RANKS[userRank]?.name}`;
    
    addNotification({
        message: welcomeMessage,
        timestamp: new Date(),
        type: 'welcome'
    });
    
    // إشعار للجميع
    if (socket) {
        socket.emit('userJoined', {
            displayName: currentUser.display_name,
            rank: userRank
        });
    }
}

// تشغيل صوت الإشعار
function playNotificationSound() {
    const soundEnabled = localStorage.getItem('soundNotifications') !== 'false';
    if (soundEnabled) {
        // إنشاء صوت إشعار بسيط
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    }
}

// إظهار رسالة Toast
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    const container = document.getElementById('toastContainer');
    container.appendChild(toast);
    
    // إزالة التوست بعد 3 ثوان
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// إظهار رسالة خطأ
function showError(message) {
    const errorDiv = document.getElementById('loginError');
    errorDiv.textContent = message;
    errorDiv.classList.add('show');
    
    setTimeout(() => {
        errorDiv.classList.remove('show');
    }, 5000);
}

// تنسيق الوقت
function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) { // أقل من دقيقة
        return 'الآن';
    } else if (diff < 3600000) { // أقل من ساعة
        return Math.floor(diff / 60000) + ' د';
    } else if (diff < 86400000) { // أقل من يوم
        return Math.floor(diff / 3600000) + ' س';
    } else {
        return date.toLocaleDateString('ar');
    }
}

// إنشاء صورة افتراضية
function generateDefaultAvatar(name) {
    const canvas = document.createElement('canvas');
    canvas.width = 40;
    canvas.height = 40;
    const ctx = canvas.getContext('2d');
    
    // خلفية ملونة
    const colors = ['#667eea', '#764ba2', '#f093fb', '#4CAF50', '#ff9800', '#f44336'];
    const color = colors[name.length % colors.length];
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 40, 40);
    
    // النص
    ctx.fillStyle = 'white';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(name.charAt(0).toUpperCase(), 20, 20);
    
    return canvas.toDataURL();
}

// فتح صورة في مودال
function openImageModal(imageUrl) {
    // منطق فتح الصورة في مودال
    window.open(imageUrl, '_blank');
}

// تحديث رتبة المستخدم في الخادم
async function updateUserRank(rank) {
    try {
        await fetch('/api/user/rank', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ rank })
        });
    } catch (error) {
        console.error('Error updating user rank:', error);
    }
}

// تبديل المظهر
function toggleTheme() {
    const body = document.body;
    const isDark = body.getAttribute('data-theme') === 'dark';
    
    if (isDark) {
        body.removeAttribute('data-theme');
        localStorage.setItem('theme', 'light');
    } else {
        body.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
    }
}

// تحميل المظهر المحفوظ
function loadSavedTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
    }
}

// تهيئة المظهر عند التحميل
document.addEventListener('DOMContentLoaded', loadSavedTheme);