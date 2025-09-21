const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const multer = require('multer');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(bodyParser.json());
app.use(express.static('Uploads'));

// إعداد Multer لرفع الملفات
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'Uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|webm|mp3|wav|m4a/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('الملف يجب أن يكون صورة (jpeg/png) أو صوت (webm/mp3)'));
        }
    }
});

// === تعريف الرتب مع المميزات ===
const RANKS = {
    visitor: { name: 'زائر', emoji: '👋', level: 0, color: '#6c757d', features: ['الدردشة العادية', 'عرض الأخبار'] },
    member: { name: 'عضو', emoji: '👤', level: 1, color: '#17a2b8', features: ['إرسال صور', 'مشاهدة الستوري'] },
    vip: { name: 'VIP', emoji: '⭐', level: 2, color: '#ffc107', features: ['إرسال فيديو قصير', 'تخصيص اسم ملون'] },
    bronze: { name: 'برونزي', emoji: '🥉', level: 3, color: '#cd7f32', features: ['إرسال ملفات', 'تغيير صورة الملف الشخصي'] },
    silver: { name: 'فضي', emoji: '🥈', level: 4, color: '#c0c0c0', features: ['إرسال صوتيات', 'إنشاء غرف دردشة'] },
    gold: { name: 'ذهبي', emoji: '🥇', level: 5, color: '#ffd700', features: ['إرسال هدايا', 'تخصيص الألوان'] },
    diamond: { name: 'الماس', emoji: '💎', level: 6, color: '#b9f2ff', features: ['إنشاء استطلاعات', 'تثبيت الرسائل'] },
    crown: { name: 'برنس', emoji: '👑', level: 7, color: '#ff6b6b', features: ['حذف رسائل الآخرين', 'تعديل الإعدادات'] },
    moderator: { name: 'مشرف', emoji: '🛡️', level: 8, color: '#28a745', features: ['حظر المستخدمين', 'إدارة الغرف'] },
    admin: { name: 'أدمن', emoji: '⚡', level: 9, color: '#dc3545', features: ['تغيير رتب الآخرين', 'عرض السجلات'] },
    super_admin: { name: 'سوبر أدمن', emoji: '🌟', level: 10, color: '#6f42c1', features: ['إدارة قاعدة البيانات', 'تعديل النظام'] },
    owner: { name: '🏆 مالك النظام', emoji: '🏆', level: 11, color: '#ff1493', features: ['التحكم الكامل', 'إيقاف/تشغيل السيرفر'] }
};

// === بيانات المستخدمين الموحدة ===
let users = [
    {
        id: 1,
        username: 'مالك الشات',
        display_name: 'مالك الشات',
        email: 'njdj9985@gmail.com',
        password: 'ZXcvbnm.8',
        rank: 'owner',
        role: 'admin',
        points: 999999,
        token: 'owner-token-1',
        isOnline: false,
        lastLogin: new Date().toISOString(),
        permissions: ['all'],
        profile_image1: null,
        profile_image2: null,
        message_background: null,
        age: null,
        gender: null,
        marital_status: null,
        about_me: null
    },
    {
        id: 2,
        username: 'أحمد الـVIP',
        display_name: 'أحمد',
        email: 'vip@example.com',
        password: '123456',
        rank: 'vip',
        role: 'user',
        points: 1500,
        token: 'fake-token-2',
        isOnline: false,
        lastLogin: new Date().toISOString(),
        profile_image1: null,
        profile_image2: null,
        message_background: null,
        age: 25,
        gender: 'ذكر',
        marital_status: 'أعزب',
        about_me: 'مرحباً أنا أحمد'
    },
    {
        id: 3,
        username: 'فاطمة الذهبية',
        display_name: 'فاطمة',
        email: 'gold@example.com',
        password: '123456',
        rank: 'gold',
        role: 'user',
        points: 800,
        token: 'fake-token-3',
        isOnline: false,
        lastLogin: new Date().toISOString(),
        profile_image1: null,
        profile_image2: null,
        message_background: null,
        age: 22,
        gender: 'أنثى',
        marital_status: 'أعزب',
        about_me: 'أحب القراءة والدردشة!'
    },
    {
        id: 4,
        username: 'زائر جديد',
        display_name: 'زائر',
        email: 'visitor@example.com',
        password: '123456',
        rank: 'visitor',
        role: 'user',
        points: 0,
        token: 'fake-token-4',
        isOnline: false,
        lastLogin: new Date().toISOString(),
        profile_image1: null,
        profile_image2: null,
        message_background: null,
        age: null,
        gender: null,
        marital_status: null,
        about_me: null
    }
];

// === البيانات الأخرى ===
let rooms = [
    { id: 1, name: 'الغرفة الرئيسية', description: 'غرفة دردشة عامة', background: null }
];

let messages = [];
let privateMessages = [];
let news = [];
let stories = [];
let bans = [];
let mutes = [];
let floodProtection = new Map();
let competitions = [];
let comments = [];

// === APIs ===

// تسجيل الدخول
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
        user.token = 'fake-token-' + user.id;
        user.isOnline = true;
        user.lastLogin = new Date().toISOString();
        const rankInfo = RANKS[user.rank] || RANKS.visitor;
        const { password: _, ...safeUser } = user;
        res.json({
            success: true,
            token: user.token,
            user: {
                ...safeUser,
                rankInfo,
                features: rankInfo.features
            }
        });
    } else {
        res.status(401).json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
    }
});

// إنشاء حساب
app.post('/api/register', (req, res) => {
    const { email, password, display_name, username } = req.body;
    if (!email || !password || !display_name) {
        return res.status(400).json({ error: 'جميع الحقول مطلوبة' });
    }
    if (users.find(u => u.email === email)) {
        return res.status(400).json({ error: 'البريد الإلكتروني موجود مسبقًا' });
    }
    const newUser = {
        id: users.length + 1,
        email,
        password,
        display_name,
        username: username || display_name,
        rank: 'visitor',
        role: 'user',
        profile_image1: null,
        profile_image2: null,
        message_background: null,
        age: null,
        gender: null,
        marital_status: null,
        about_me: null,
        token: null,
        isOnline: false,
        lastLogin: null,
        points: 0,
        permissions: []
    };
    users.push(newUser);
    res.status(201).json({ message: 'تم إنشاء الحساب بنجاح', user: { id: newUser.id, display_name: newUser.display_name, email: newUser.email } });
});

// تحديث الملف الشخصي
app.put('/api/user/profile', upload.fields([
    { name: 'profileImage1', maxCount: 1 },
    { name: 'profileImage2', maxCount: 1 },
    { name: 'messageBackground', maxCount: 1 }
]), (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    const user = users.find(u => 'fake-token-' + u.id === token);
    if (!user) return res.status(401).json({ error: 'غير مصرح له' });

    const { display_name, age, gender, marital_status, about_me } = req.body;
    if (display_name) user.display_name = display_name;
    if (age) user.age = parseInt(age);
    if (gender) user.gender = gender;
    if (marital_status) user.marital_status = marital_status;
    if (about_me) user.about_me = about_me;

    if (req.files?.['profileImage1']) user.profile_image1 = `/Uploads/${req.files['profileImage1'][0].filename}`;
    if (req.files?.['profileImage2']) user.profile_image2 = `/Uploads/${req.files['profileImage2'][0].filename}`;
    if (req.files?.['messageBackground']) user.message_background = `/Uploads/${req.files['messageBackground'][0].filename}`;

    const updatedUser = { ...user };
    delete updatedUser.password;

    res.json(updatedUser);
    io.emit('userUpdated', updatedUser);
});

// الحصول على الملف الشخصي
app.get('/api/user/profile', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    const user = users.find(u => 'fake-token-' + u.id === token);
    if (!user) return res.status(401).json({ error: 'غير مصرح له' });
    const { password: _, ...safeUser } = user;
    res.json(safeUser);
});

// قائمة الغرف
app.get('/api/rooms', (req, res) => {
    res.json(rooms);
});

// إنشاء غرفة جديدة
app.post('/api/rooms', (req, res) => {
    const { name, description } = req.body;
    if (!name || name.trim() === '') {
        return res.status(400).json({ error: 'اسم الغرفة مطلوب' });
    }
    const newRoom = {
        id: rooms.length + 1,
        name: name.trim(),
        description: description || '',
        background: null
    };
    rooms.push(newRoom);
    io.emit('newRoom', newRoom);
    res.status(201).json(newRoom);
});

// قائمة المستخدمين
app.get('/api/users', (req, res) => {
    res.json(users.map(u => {
        const { password, token, ...publicData } = u;
        return publicData;
    }));
});

// التحكم بالرتب (للمالك فقط)
app.post('/api/set-user-rank', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    const requester = users.find(u => u.token === token);
    if (!requester) return res.status(403).json({ error: 'غير مصرح له' });

    const isOwner = requester.email === 'njdj9985@gmail.com' && requester.rank === 'owner';
    if (!isOwner) return res.status(403).json({ error: 'فقط المالك يمكنه تغيير الرتب' });

    const { targetUserId, newRank, reason } = req.body;
    const targetUser = users.find(u => u.id === parseInt(targetUserId));
    if (!targetUser) return res.status(404).json({ error: 'المستخدم غير موجود' });
    if (!RANKS[newRank]) return res.status(400).json({ error: 'رتبة غير صالحة' });

    const oldRank = targetUser.rank;
    targetUser.rank = newRank;
    targetUser.rankUpdatedAt = new Date().toISOString();
    targetUser.rankUpdatedBy = requester.username;

    targetUser.rankHistory = targetUser.rankHistory || [];
    targetUser.rankHistory.push({
        oldRank,
        newRank,
        changedBy: requester.username,
        reason: reason || 'تغيير رتبة',
        timestamp: new Date().toISOString()
    });

    io.emit('userRankUpdated', {
        userId: targetUser.id,
        username: targetUser.username,
        oldRank,
        newRank,
        rankInfo: RANKS[newRank]
    });

    res.json({
        success: true,
        message: `تم تغيير رتبة ${targetUser.username} من ${RANKS[oldRank]?.name || oldRank} إلى ${RANKS[newRank]?.name || newRank}`,
        user: {
            id: targetUser.id,
            username: targetUser.username,
            rank: newRank
        }
    });
});

// إزالة رتبة (إرجاع للزائر)
app.post('/api/remove-user-rank', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    const requester = users.find(u => u.token === token);
    if (!requester) return res.status(403).json({ error: 'غير مصرح له' });

    const isOwner = requester.email === 'njdj9985@gmail.com' && requester.rank === 'owner';
    if (!isOwner) return res.status(403).json({ error: 'فقط المالك يمكنه إزالة الرتب' });

    const { targetUserId, reason } = req.body;
    const targetUser = users.find(u => u.id === parseInt(targetUserId));
    if (!targetUser) return res.status(404).json({ error: 'المستخدم غير موجود' });

    const oldRank = targetUser.rank;
    targetUser.rank = 'visitor';
    targetUser.rankUpdatedAt = new Date().toISOString();
    targetUser.rankUpdatedBy = requester.username;

    targetUser.rankHistory = targetUser.rankHistory || [];
    targetUser.rankHistory.push({
        oldRank,
        newRank: 'visitor',
        changedBy: requester.username,
        reason: reason || 'إزالة الرتبة',
        timestamp: new Date().toISOString()
    });

    io.emit('userRankUpdated', {
        userId: targetUser.id,
        username: targetUser.username,
        oldRank,
        newRank: 'visitor',
        rankInfo: RANKS.visitor
    });

    res.json({
        success: true,
        message: `تم إزالة رتبة ${targetUser.username} وإرجاعه لرتبة زائر`,
        user: {
            id: targetUser.id,
            username: targetUser.username,
            rank: 'visitor'
        }
    });
});

// جلب قائمة الرتب
app.get('/api/ranks', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'الرجاء تسجيل الدخول' });

    const user = users.find(u => u.token === token);
    if (!user) return res.status(403).json({ error: 'رمز غير صالح' });

    res.json({
        success: true,
        ranks: RANKS,
        currentUserRank: user.rank,
        currentUserFeatures: (RANKS[user.rank] || RANKS.visitor).features
    });
});

// نشر خبر جديد
app.post('/api/news', upload.single('newsFile'), (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    const user = users.find(u => 'fake-token-' + u.id === token);
    if (!user) return res.status(401).json({ error: 'غير مصرح له' });

    const { content } = req.body;
    if (!content && !req.file) return res.status(400).json({ error: 'يجب إدخال محتوى أو ملف' });

    const media = req.file ? `/Uploads/${req.file.filename}` : null;
    const newNews = {
        id: news.length + 1,
        content,
        media,
        user_id: user.id,
        display_name: user.display_name,
        timestamp: new Date(),
        likes: []
    };
    news.push(newNews);
    io.emit('newNews', newNews);
    res.json(newNews);
});

// الحصول على الأخبار
app.get('/api/news', (req, res) => {
    res.json(news);
});

// نشر ستوري
app.post('/api/stories', upload.single('storyImage'), (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    const user = users.find(u => 'fake-token-' + u.id === token);
    if (!user) return res.status(401).json({ error: 'غير مصرح له' });

    const image = req.file ? `/Uploads/${req.file.filename}` : null;
    if (!image) return res.status(400).json({ error: 'يجب رفع صورة' });

    const newStory = {
        id: stories.length + 1,
        image,
        user_id: user.id,
        display_name: user.display_name,
        timestamp: new Date()
    };
    stories.push(newStory);
    io.emit('newStory', newStory);
    res.json(newStory);
});

// الحصول على الستوريات (التي عمرها < 24 ساعة)
app.get('/api/stories', (req, res) => {
    const now = new Date();
    const recentStories = stories.filter(s => (now - new Date(s.timestamp)) < 24 * 60 * 60 * 1000);
    res.json(recentStories);
});

// إضافة تعليق
app.post('/api/comments', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    const user = users.find(u => 'fake-token-' + u.id === token);
    if (!user) return res.status(401).json({ error: 'غير مصرح له' });

    const { postId, content, targetUserId } = req.body;
    if (!postId || !content) return res.status(400).json({ error: 'معرف المنشور والمحتوى مطلوبان' });

    const newComment = {
        id: comments.length + 1,
        postId: parseInt(postId),
        content,
        user_id: user.id,
        display_name: user.display_name,
        targetUserId: targetUserId ? parseInt(targetUserId) : null,
        timestamp: new Date()
    };
    comments.push(newComment);

    if (targetUserId) {
        io.emit('commentNotification', {
            commentId: newComment.id,
            from: user.display_name,
            content: newComment.content,
            postId: newComment.postId,
            targetUserId
        });
    }

    io.emit('newComment', newComment);
    res.json(newComment);
});

// الحصول على تعليقات منشور
app.get('/api/comments/:postId', (req, res) => {
    const postId = parseInt(req.params.postId);
    const postComments = comments.filter(c => c.postId === postId);
    res.json(postComments);
});

// إنشاء مسابقة (للأدمن فما فوق)
app.post('/api/competitions', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    const user = users.find(u => 'fake-token-' + u.id === token);
    if (!user || (user.rank !== 'admin' && user.rank !== 'owner')) return res.status(403).json({ error: 'غير مسموح' });

    const { title, duration } = req.body;
    if (!title || !duration) return res.status(400).json({ error: 'العنوان والمدة مطلوبان' });

    const newCompetition = {
        id: competitions.length + 1,
        title,
        duration: parseInt(duration),
        startTime: new Date(),
        active: true,
        createdBy: user.id
    };
    competitions.push(newCompetition);
    io.emit('newCompetition', newCompetition);
    res.json(newCompetition);
});

// كتم مستخدم
app.post('/api/mute', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    const admin = users.find(u => 'fake-token-' + u.id === token);
    if (!admin || (admin.rank !== 'moderator' && admin.rank !== 'admin' && admin.rank !== 'owner')) {
        return res.status(403).json({ error: 'غير مسموح' });
    }

    const { userId, reason, duration } = req.body;
    const user = users.find(u => u.id === parseInt(userId));
    if (!user) return res.status(404).json({ error: 'المستخدم غير موجود' });

    const durationMap = { '5m': 5*60*1000, '1h': 60*60*1000, '24h': 24*60*60*1000, '7d': 7*24*60*60*1000 };
    const ms = durationMap[duration] || 5*60*1000;
    const endTime = new Date(Date.now() + ms);

    const mute = {
        id: mutes.length + 1,
        user_id: user.id,
        reason: reason || 'مخالفة القوانين',
        duration,
        timestamp: new Date(),
        endTime
    };
    mutes.push(mute);

    io.emit('userMuted', { userId: user.id, reason: mute.reason, duration: mute.duration });
    res.json({ message: `تم كتم المستخدم ${user.display_name} لمدة ${duration}` });
});

// طرد مستخدم
app.post('/api/ban', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    const admin = users.find(u => 'fake-token-' + u.id === token);
    if (!admin || (admin.rank !== 'admin' && admin.rank !== 'owner')) {
        return res.status(403).json({ error: 'غير مسموح' });
    }

    const { userId, reason, duration } = req.body;
    const user = users.find(u => u.id === parseInt(userId));
    if (!user) return res.status(404).json({ error: 'المستخدم غير موجود' });

    const durationMap = { '1h': 60*60*1000, '24h': 24*60*60*1000, '7d': 7*24*60*60*1000, 'permanent': Infinity };
    const ms = durationMap[duration] || 24*60*60*1000;
    const endTime = duration === 'permanent' ? null : new Date(Date.now() + ms);

    const ban = {
        id: bans.length + 1,
        user_id: user.id,
        reason: reason || 'مخالفة خطيرة',
        duration,
        timestamp: new Date(),
        endTime
    };
    bans.push(ban);

    io.emit('userBanned', { userId: user.id, reason: ban.reason, duration: ban.duration });
    res.json({ message: `تم طرد المستخدم ${user.display_name} لمدة ${duration}` });
});

// === Socket.IO للتواصل الفوري ===
io.on('connection', (socket) => {
    console.log('👤 مستخدم جديد متصل:', socket.id);

    socket.on('join', (data) => {
        if (!data?.roomId || !data?.userId || !data?.display_name) {
            return socket.emit('error', 'بيانات الانضمام غير كاملة');
        }
        socket.join(data.roomId);
        socket.user = { ...data, socketId: socket.id };
        socket.join(`user_${data.userId}`);

        // تحديث حالة المستخدم
        const user = users.find(u => u.id === data.userId);
        if (user) user.isOnline = true;

        // إعلام الجميع
        io.emit('userList', users.filter(u => u.isOnline).map(u => ({
            id: u.id,
            display_name: u.display_name,
            rank: u.rank,
            isOnline: u.isOnline
        })));

        console.log(`👋 ${data.display_name} انضم إلى الغرفة ${data.roomId}`);
    });

    socket.on('sendMessage', (data) => {
        if (!socket.user || !data?.roomId || !data?.content) {
            return socket.emit('error', 'أنت غير مسجل أو البيانات ناقصة');
        }

        const userId = socket.user.userId;
        const now = Date.now();

        // حماية من الفيضانات
        if (!floodProtection.has(userId)) floodProtection.set(userId, []);
        const recentMessages = floodProtection.get(userId).filter(time => now - time < 10000);
        if (recentMessages.length >= 5) {
            // كتم تلقائي 5 دقائق
            const endTime = new Date(now + 5 * 60 * 1000);
            const mute = {
                id: mutes.length + 1,
                user_id: userId,
                reason: 'رسائل متكررة بسرعة (فيضان)',
                duration: '5m',
                timestamp: new Date(),
                endTime
            };
            mutes.push(mute);
            socket.emit('error', 'تم كتمك لمدة 5 دقائق بسبب إرسال رسائل متكررة بسرعة');
            io.to(data.roomId).emit('newMessage', {
                id: messages.length + 1,
                roomId: data.roomId,
                content: `🛑 تم كتم ${socket.user.display_name} لمدة 5 دقائق بسبب الفيضان`,
                type: 'system',
                timestamp: new Date()
            });
            return;
        }
        recentMessages.push(now);
        floodProtection.set(userId, recentMessages);

        // التحقق من الكتم
        const isMuted = mutes.some(m => m.user_id === userId && (m.endTime > new Date()));
        if (isMuted) {
            return socket.emit('error', 'أنت مكتوم حالياً ولا يمكنك إرسال رسائل');
        }

        // إنشاء الرسالة
        const message = {
            id: messages.length + 1,
            roomId: data.roomId,
            user_id: userId,
            display_name: socket.user.display_name,
            rank: socket.user.rank,
            content: data.content,
            type: 'text',
            timestamp: new Date()
        };

        messages.push(message);
        io.to(data.roomId).emit('newMessage', message);
    });

    socket.on('sendPrivateMessage', (data) => {
        if (!socket.user || !data?.receiverId || !data?.content) {
            return socket.emit('error', 'بيانات غير كاملة');
        }

        const isMuted = mutes.some(m => m.user_id === socket.user.userId && (m.endTime > new Date()));
        if (isMuted) return socket.emit('error', 'أنت مكتوم');

        const message = {
            id: privateMessages.length + 1,
            senderId: socket.user.userId,
            receiverId: data.receiverId,
            display_name: socket.user.display_name,
            rank: socket.user.rank,
            content: data.content,
            type: 'text',
            timestamp: new Date()
        };

        privateMessages.push(message);
        io.to(`user_${data.receiverId}`).emit('newPrivateMessage', message);
        socket.emit('newPrivateMessage', message); // إرسال نسخة للمرسل
    });

    // ملاحظة: لرفع الملفات عبر Socket.IO، نوصي باستخدام API أولاً ثم إرسال الرابط
    // تم تعطيل رفع الملفات المباشر عبر Socket لتجنب المشاكل

    socket.on('disconnect', () => {
        console.log('🔌 انقطع اتصال المستخدم:', socket.id);
        if (socket.user?.userId) {
            const user = users.find(u => u.id === socket.user.userId);
            if (user) {
                user.isOnline = false;
                io.emit('userList', users.filter(u => u.isOnline).map(u => ({
                    id: u.id,
                    display_name: u.display_name,
                    rank: u.rank,
                    isOnline: u.isOnline
                })));
            }
        }
    });
});

// دالة مساعدة لتحويل المدة
function parseDuration(duration) {
    const map = {
        '5m': 5 * 60 * 1000,
        '1h': 60 * 60 * 1000,
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        'permanent': Infinity
    };
    return map[duration] || 0;
}

// تنظيف ذاكرة الفيضانات كل دقيقة
setInterval(() => {
    const now = Date.now();
    for (const [userId, messages] of floodProtection.entries()) {
        const recent = messages.filter(time => now - time < 60000);
        if (recent.length === 0) {
            floodProtection.delete(userId);
        } else {
            floodProtection.set(userId, recent);
        }
    }
}, 60000);

// تنظيف الكتم المنتهي كل 30 ثانية
setInterval(() => {
    const now = new Date();
    const activeMutes = mutes.filter(mute => {
        if (!mute.endTime) return true; // permanent
        return new Date(mute.endTime) > now;
    });
    if (activeMutes.length !== mutes.length) {
        mutes = activeMutes;
        console.log(`🧹 تم تنظيف ${mutes.length} كتم نشط`);
    }
}, 30000);

// تشغيل الخادم (مرة واحدة فقط)
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 السيرفر يعمل على http://localhost:${PORT}`);
    console.log(`🏆 مالك النظام: njdj9985@gmail.com | الرتبة: ${RANKS.owner.name}`);
    console.log(`📊 عدد المستخدمين: ${users.length} | عدد الغرف: ${rooms.length}`);
    console.log(`📁 مجلد الرفع: ./Uploads`);
});
