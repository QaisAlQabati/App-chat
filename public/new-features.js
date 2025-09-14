/* ===========================
   1. نظام مكافحة الفيضانات (Flood System)
=========================== */
const floodLimit = 5; // عدد الرسائل
const floodWindow = 10000; // 10 ثواني
const muteDuration = 5 * 60 * 1000; // 5 دقائق
const floodLog = {};

function checkFlood(userId, username) {
    const now = Date.now();
    if (!floodLog[userId]) floodLog[userId] = [];
    floodLog[userId] = floodLog[userId].filter(t => now - t < floodWindow);
    floodLog[userId].push(now);
    if (floodLog[userId].length > floodLimit) {
        muteUserForDuration(userId, muteDuration);
        addSystemMessage(`تم كتم ${username} بسبب الفيضانات`);
        return true;
    }
    return false;
}

function muteUserForDuration(userId, ms) {
    socket.emit('muteUser', { userId, duration: ms });
    setTimeout(() => socket.emit('unmuteUser', { userId }), ms);
}

/* ===========================
   2. تصميم الشات (CSS إضافي)
=========================== */
const chatCSS = document.createElement('style');
chatCSS.textContent = `
.messages-container { max-height: 75vh !important; padding: 4px !important; }
.message { font-size: 12px !important; padding: 4px 8px !important; margin: 2px 0 !important; border-radius: 8px !important; }
.chat-area { border-width: 1px !important; box-shadow: none !important; }
`;
document.head.appendChild(chatCSS);

/* ===========================
   3. نظام الرتب والمميزات
=========================== */
const ranks = {
    1: { name: "زائر", canUploadMusic: false, canUploadCover: false },
    2: { name: "عضو برونزي", canUploadMusic: true, canUploadCover: true },
    3: { name: "عضو فضي", canUploadMusic: true, canUploadCover: true },
    4: { name: "عضو ذهبي", canUploadMusic: true, canUploadCover: true },
    5: { name: "إداري", canUploadMusic: true, canUploadCover: true }
};

function getUserRank(userId) {
    return ranks[userRankMap[userId] || 1];
}

/* ===========================
   4. نظام الأخبار / الستوري
=========================== */
function postNews() {
    const text = document.getElementById('newsContentInput').value.trim();
    if (!text) return;
    const news = { id: Date.now(), text, likes: 0, dislikes: 0, comments: [] };
    socket.emit('postNews', news);
    renderNews(news);
    document.getElementById('newsContentInput').value = '';
}

function renderNews(n) {
    const feed = document.getElementById('newsFeed');
    const div = document.createElement('div');
    div.className = 'news-item';
    div.innerHTML = `
        <p>${n.text}</p>
        <div class="news-actions">
            <button onclick="likeNews(${n.id})">❤️ ${n.likes}</button>
            <button onclick="dislikeNews(${n.id})">👎 ${n.dislikes}</button>
            <input placeholder="تعليق..." onkeypress="if(event.key==='Enter') addComment(${n.id}, this.value)">
        </div>
    `;
    feed.prepend(div);
}

function likeNews(id) { socket.emit('likeNews', id); }
function dislikeNews(id) { socket.emit('dislikeNews', id); }
function addComment(id, text) { socket.emit('addComment', { id, text }); }

/* ===========================
   5. الخاص (Private Messages)
=========================== */
let privateChatUser = null;
function openPrivateChatBox() {
    const box = document.getElementById('privateChatBox');
    box.style.display = box.style.display === 'none' ? 'flex' : 'none';
}
function selectPrivateChatUser() {
    const select = document.getElementById('privateChatUserSelect');
    privateChatUser = select.value;
}
function sendPrivateChatMessage() {
    const input = document.getElementById('privateChatInput');
    const msg = input.value.trim();
    if (!msg || !privateChatUser) return;
    socket.emit('privateMessage', { to: privateChatUser, text: msg });
    input.value = '';
}
socket.on('privateMessage', data => {
    const box = document.getElementById('privateChatBox');
    box.style.display = 'flex';
    const msgs = document.getElementById('privateChatMessages');
    msgs.innerHTML += `<div><b>${data.from}:</b> ${data.text}</div>`;
});

/* ===========================
   6. البروفايل (عرض لأي شخص)
=========================== */
function viewUserProfile(userId) {
    socket.emit('getUserProfile', userId, profile => {
        document.getElementById('viewProfileName').textContent = profile.name;
        document.getElementById('viewProfileImg1').src = profile.img1;
        document.getElementById('viewProfileImg2').src = profile.img2;
        document.getElementById('viewProfileLikes').textContent = profile.likes;
        document.getElementById('viewProfileCoins').textContent = profile.coins;
        document.getElementById('viewProfileModal').style.display = 'flex';
    });
}

/* ===========================
   7. غرفة المسابقات
=========================== */
let quizTimerInterval = null;
function startQuizTimer(seconds = 30) {
    clearInterval(quizTimerInterval);
    let time = seconds;
    const span = document.getElementById('quizTimer');
    span.textContent = time;
    quizTimerInterval = setInterval(() => {
        time--;
        span.textContent = time;
        if (time <= 0) clearInterval(quizTimerInterval);
    }, 1000);
}
socket.on('quizQuestion', () => startQuizTimer());
socket.on('quizAnswered', () => startQuizTimer()); // إعادة العد بعد الإجابة
socket.on('leaveQuizRoom', () => clearInterval(quizTimerInterval)); // إيقاف الإشعارات

/* ===========================
   8. نظام الأصوات
=========================== */
const sounds = {
    public: new Audio('sounds/public.mp3'),
    private: new Audio('sounds/private.mp3'),
    call: new Audio('sounds/call.mp3'),
    notification: new Audio('sounds/notification.mp3')
};
Object.values(sounds).forEach(s => s.volume = 0.3); // مريح للأذن

function playSound(type) {
    if (localStorage.getItem(`sound_${type}`) !== 'off') {
        sounds[type].currentTime = 0;
        sounds[type].play();
    }
}
function toggleSound(type) {
    const key = `sound_${type}`;
    const current = localStorage.getItem(key);
    localStorage.setItem(key, current === 'off' ? 'on' : 'off');
}

/* ===========================
   دمج مع الكود القديم
=========================== */
window.addEventListener('load', () => {
    // إضافة أزرار التحكم بالصوت في الإعدادات
    const settingsContent = document.querySelector('.settings-content');
    const soundSection = document.createElement('div');
    soundSection.className = 'settings-section';
    soundSection.innerHTML = `
        <h3>الأصوات</h3>
        ${Object.keys(sounds).map(t => `
            <div class="setting-item">
                <label>صوت ${t}</label>
                <button onclick="toggleSound('${t}')" class="btn btn-sm">إيقاف/تشغيل</button>
            </div>
        `).join('')}
    `;
    settingsContent.appendChild(soundSection);
});
