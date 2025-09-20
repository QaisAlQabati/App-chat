const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const multer = require('multer');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: { origin: '*' } // للسماح بالاتصال من أي مصدر
});

app.use(bodyParser.json());
app.use(express.static('Uploads')); // لخدمة الملفات (صور، صوت) من مجلد Uploads

// إعداد Multer لتخزين الملفات مع حد للحجم
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'Uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ 
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // حد 5 ميغابايت
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|webm/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('الملف يجب أن يكون صورة (jpeg/png) أو صوت (webm)'));
        }
    }
});

// مصفوفات مؤقتة لتخزين البيانات
let rooms = [
    { id: 1, name: 'الغرفة الرئيسية', description: 'غرفة دردشة عامة', background: null }
];

let users = [
    { id: 1, display_name: 'Admin', rank: 'admin', role: 'admin', email: 'admin@example.com', password: 'admin', profile_image1: null, profile_image2: null, message_background: null, age: null, gender: null, marital_status: null, about_me: null }
];

let messages = [];
let privateMessages = [];
let news = [];
let stories = [];
let bans = [];
let mutes = [];
let floodProtection = new Map(); // لحماية من الفيضانات
let competitions = [];
let comments = [];

// API لتسجيل الدخول
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
        const token = 'fake-token-' + user.id;
        res.json({ token, user });
    } else {
        res.status(401).json({ error: 'بيانات تسجيل الدخول غير صحيحة' });
    }
});

// API لإنشاء حساب
app.post('/api/register', (req, res) => {
    const { email, password, display_name } = req.body;
    if (users.find(u => u.email === email)) {
        return res.status(400).json({ error: 'البريد الإلكتروني موجود مسبقًا' });
    }
    const newUser = {
        id: users.length + 1,
        email,
        password,
        display_name,
        rank: 'visitor',
        role: 'user',
        profile_image1: null,
        profile_image2: null,
        message_background: null,
        age: null,
        gender: null,
        marital_status: null,
        about_me: null
    };
    users.push(newUser);
    const token = 'fake-token-' + newUser.id;
    res.json({ token, user: newUser });
});

// API للحصول على بيانات الملف الشخصي
app.get('/api/user/profile', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    const user = users.find(u => 'fake-token-' + u.id === token);
    if (user) res.json(user);
    else res.status(401).json({ error: 'غير مصرح له' });
});

// API لتحديث الملف الشخصي
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

    if (req.files['profileImage1']) user.profile_image1 = `/Uploads/${req.files['profileImage1'][0].filename}`;
    if (req.files['profileImage2']) user.profile_image2 = `/Uploads/${req.files['profileImage2'][0].filename}`;
    if (req.files['messageBackground']) user.message_background = `/Uploads/${req.files['messageBackground'][0].filename}`;

    res.json(user);
    io.emit('userUpdated', user);
});

// API للحصول على قائمة الغرف
app.get('/api/rooms', (req, res) => res.json(rooms));

if (!name || name.trim() === '') {
    return res.status(400).json({ error: 'اسم الغرفة مطلوب' });
}
// API للحصول على الرسائل الخاصة
app.get('/api/private-messages/:userId', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    const current = users.find(u => 'fake-token-' + u.id === token);
    if (!current) return res.status(401).json({ error: 'غير مصرح له' });

    res.json(privateMessages.filter(pm => 
        (pm.senderId === current.id && pm.receiverId === parseInt(req.params.userId)) || 
        (pm.senderId === parseInt(req.params.userId) && pm.receiverId === current.id)
    ));
});

// API للحصول على الأخبار
app.get('/api/news', (req, res) => {
    res.json(news);
});

// API لنشر خبر جديد
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

// API للحصول على الستوريات
app.get('/api/stories', (req, res) => {
    res.json(stories.filter(s => new Date() - new Date(s.timestamp) < 24 * 60 * 60 * 1000));
});

// API لنشر ستوري جديد
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

// API للتعليقات
app.post('/api/comments', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    const user = users.find(u => 'fake-token-' + u.id === token);
    if (!user) return res.status(401).json({ error: 'غير مصرح له' });

    const { postId, content, targetUserId } = req.body;
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

    // إرسال إشعار للمستخدم المستهدف
    if (targetUserId) {
        io.emit('newComment', { ...newComment, targetUserId });
    }

    res.json(newComment);
});

// API للحصول على التعليقات
app.get('/api/comments/:postId', (req, res) => {
    const postComments = comments.filter(c => c.postId === parseInt(req.params.postId));
    res.json(postComments);
});

// API للمسابقات
app.post('/api/competitions', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    const user = users.find(u => 'fake-token-' + u.id === token);
    if (!user || user.role !== 'admin') return res.status(403).json({ error: 'غير مسموح' });

    const { title, duration } = req.body;
    const newCompetition = {
        id: competitions.length + 1,
        title,
        duration: parseInt(duration),
        startTime: new Date(),
        active: true
    };
    competitions.push(newCompetition);
    io.emit('newCompetition', newCompetition);
    res.json(newCompetition);
});

/*
 * نظام الرتب المتقدم - خادم الشات مع تحكم كامل للمالك
 * المالك: njdj9985@gmail.com | ZXcvbnm.8
 * تحكم كامل في الرتب + مميزات خاصة لكل رتبة
 */

const express = require('express');
const http = require('http');
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(express.json());

// === تعريف الرتب مع المميزات الخاصة ===
const RANKS = {
    // رتبة الزائر (الافتراضي)
    visitor: { 
        name: 'زائر', 
        emoji: '👋', 
        level: 0, 
        color: '#6c757d',
        features: [
            'الدردشة العادية',
            'عرض الأخبار',
            'مشاهدة الستوري'
        ]
    },
    
    // رتبة العضو العادي
    member: { 
        name: 'عضو', 
        emoji: '👤', 
        level: 1, 
        color: '#17a2b8',
        features: [
            'الدردشة العادية',
            'عرض الأخبار',
            'مشاهدة الستوري',
            'إرسال صور في الشات'
        ]
    },
    
    // رتبة VIP
    vip: { 
        name: 'VIP', 
        emoji: '⭐', 
        level: 2, 
        color: '#ffc107',
        features: [
            'كل مميزات العضو',
            'إرسال فيديو قصير',
            'تخصيص اسم ملون',
            'أولوية في الشات'
        ]
    },
    
    // رتبة برونزي
    bronze: { 
        name: 'برونزي', 
        emoji: '🥉', 
        level: 3, 
        color: '#cd7f32',
        features: [
            'كل مميزات VIP',
            'إرسال ملفات',
            'تغيير صورة الملف الشخصي',
            'رسائل خاصة'
        ]
    },
    
    // رتبة فضي
    silver: { 
        name: 'فضي', 
        emoji: '🥈', 
        level: 4, 
        color: '#c0c0c0',
        features: [
            'كل مميزات برونزي',
            'إرسال صوتيات',
            'إنشاء غرف دردشة',
            'إحصائيات الشات'
        ]
    },
    
    // رتبة ذهبي
    gold: { 
        name: 'ذهبي', 
        emoji: '🥇', 
        level: 5, 
        color: '#ffd700',
        features: [
            'كل مميزات فضي',
            'إرسال هدايا',
            'تخصيص الألوان',
            'إدارة الرسائل المؤقتة'
        ]
    },
    
    // رتبة الماس
    diamond: { 
        name: 'الماس', 
        emoji: '💎', 
        level: 6, 
        color: '#b9f2ff',
        features: [
            'كل مميزات ذهبي',
            'إنشاء استطلاعات',
            'تثبيت الرسائل',
            'إخفاء الإعلانات'
        ]
    },
    
    // رتبة البرنس
    crown: { 
        name: 'برنس', 
        emoji: '👑', 
        level: 7, 
        color: '#ff6b6b',
        features: [
            'كل مميزات الماس',
            'حذف رسائل الآخرين',
            'تعديل الإعدادات',
            'إدارة المستخدمين'
        ]
    },
    
    // رتبة المشرف
    moderator: { 
        name: 'مشرف', 
        emoji: '🛡️', 
        level: 8, 
        color: '#28a745',
        features: [
            'كل مميزات البرنس',
            'حظر المستخدمين',
            'مراجعة المحتوى',
            'إدارة الغرف'
        ]
    },
    
    // رتبة الأدمن
    admin: { 
        name: 'أدمن', 
        emoji: '⚡', 
        level: 9, 
        color: '#dc3545',
        features: [
            'كل مميزات المشرف',
            'تغيير رتب الآخرين',
            'إدارة النظام',
            'عرض السجلات'
        ]
    },
    
    // رتبة السوبر أدمن
    super_admin: { 
        name: 'سوبر أدمن', 
        emoji: '🌟', 
        level: 10, 
        color: '#6f42c1',
        features: [
            'كل مميزات الأدمن',
            'إدارة قاعدة البيانات',
            'تعديل النظام',
            'الوصول للكود المصدري'
        ]
    },
    
    // رتبة المالك (أنت - أعلى رتبة)
    owner: { 
        name: '🏆 مالك النظام', 
        emoji: '🏆', 
        level: 11, 
        color: '#ff1493',
        features: [
            'التحكم الكامل في النظام',
            'تغيير رتب أي مستخدم',
            'إدارة جميع الإعدادات',
            'الوصول لكل البيانات',
            'إيقاف/تشغيل السيرفر',
            'تعديل الأسعار والمميزات'
        ]
    }
};

// === بيانات المستخدمين (مع بياناتك كمالك) ===
let users = [
    // أنت - المالك (أعلى رتبة)
    { 
        id: 1, 
        username: 'مالك الشات', 
        email: 'njdj9985@gmail.com', 
        password: 'ZXcvbnm.8', 
        rank: 'owner', 
        points: 999999, 
        token: 'owner-token-1',
        isOnline: false,
        lastLogin: new Date().toISOString(),
        permissions: ['all'] // صلاحيات كاملة
    },
    
    // مستخدمين تجريبيين
    { 
        id: 2, 
        username: 'أحمد الـVIP', 
        email: 'vip@example.com', 
        password: '123456', 
        rank: 'vip', 
        points: 1500, 
        token: 'fake-token-2',
        isOnline: false,
        lastLogin: new Date().toISOString()
    },
    { 
        id: 3, 
        username: 'فاطمة الذهبية', 
        email: 'gold@example.com', 
        password: '123456', 
        rank: 'gold', 
        points: 800, 
        token: 'fake-token-3',
        isOnline: false,
        lastLogin: new Date().toISOString()
    },
    { 
        id: 4, 
        username: 'زائر جديد', 
        email: 'visitor@example.com', 
        password: '123456', 
        rank: 'visitor', 
        points: 0, 
        token: 'fake-token-4',
        isOnline: false,
        lastLogin: new Date().toISOString()
    },
    { 
        id: 5, 
        username: 'مشرف الشات', 
        email: 'mod@example.com', 
        password: '123456', 
        rank: 'moderator', 
        points: 5000, 
        token: 'fake-token-5',
        isOnline: false,
        lastLogin: new Date().toISOString()
    }
];

// === API تسجيل الدخول ===
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    console.log(`🔐 محاولة تسجيل دخول: ${email}`);
    
    if (!email || !password) {
        return res.status(400).json({ error: 'الرجاء إدخال البريد الإلكتروني وكلمة المرور' });
    }

    const user = users.find(u => u.email === email && u.password === password);
    if (!user) {
        console.log(`❌ فشل تسجيل الدخول: ${email}`);
        return res.status(401).json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
    }

    // تحديث آخر تسجيل دخول
    user.lastLogin = new Date().toISOString();
    user.isOnline = true;

    // إنشاء توكن جديد
    user.token = `user-token-${Date.now()}-${user.id}`;
    
    console.log(`✅ نجح تسجيل الدخول: ${user.username} (${user.rank})`);
    
    // إرسال بيانات المستخدم مع الرتبة والمميزات
    const { password: _, ...userData } = user;
    const userRank = RANKS[user.rank] || RANKS.visitor;
    
    res.json({ 
        success: true,
        message: 'تم تسجيل الدخول بنجاح',
        user: {
            ...userData,
            rankInfo: userRank,
            features: userRank.features,
            rankColor: userRank.color
        },
        token: user.token
    });

    // إعلام الجميع بأن المستخدم دخل
    io.emit('userStatusUpdate', { 
        userId: user.id, 
        username: user.username, 
        status: 'online',
        rank: user.rank 
    });
});

// === API التحكم الكامل بالرتب (للمالك فقط) ===
app.post('/api/set-user-rank', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'الرجاء تسجيل الدخول أولاً' });
    
    const requester = users.find(u => u.token === token);
    if (!requester) return res.status(403).json({ error: 'رمز الدخول غير صالح' });

    // === التحقق من صلاحيات المالك ===
    const isOwner = (requester.email === 'njdj9985@gmail.com' && requester.rank === 'owner') || 
                    requester.permissions?.includes('all') || 
                    requester.id === 1;
    
    if (!isOwner) {
        console.log(`🚫 محاولة غير مصرح بها لتغيير الرتب بواسطة: ${requester.username}`);
        return res.status(403).json({ 
            error: 'ليس لديك الصلاحية لتغيير الرتب. فقط المالك يمكنه ذلك.' 
        });
    }

    const { targetUserId, newRank, reason } = req.body;
    
    if (!targetUserId || !newRank) {
        return res.status(400).json({ error: 'الطلب ناقص - يجب تحديد المستخدم والرتبة' });
    }

    const targetUser = users.find(u => u.id === parseInt(targetUserId));
    if (!targetUser) {
        return res.status(404).json({ error: 'المستخدم المستهدف غير موجود' });
    }

    if (!RANKS[newRank]) {
        return res.status(400).json({ 
            error: `الرتبة غير صالحة. الرتب المتاحة: ${Object.keys(RANKS).join(', ')}` 
        });
    }

    // حفظ الرتبة السابقة
    const oldRankInfo = RANKS[targetUser.rank] || RANKS.visitor;
    const newRankInfo = RANKS[newRank];
    
    // تحديث الرتبة
    targetUser.rank = newRank;
    targetUser.rankUpdatedAt = new Date().toISOString();
    targetUser.rankUpdatedBy = requester.username;
    
    // حفظ سجل التغييرات
    targetUser.rankHistory = targetUser.rankHistory || [];
    targetUser.rankHistory.push({
        oldRank: targetUser.rank,
        newRank: newRank,
        changedBy: requester.username,
        reason: reason || 'تغيير رتبة بواسطة المالك',
        timestamp: new Date().toISOString()
    });

    console.log(`👑 [MALIK] ${requester.username} غيّر رتبة ${targetUser.username} من "${oldRankInfo.name}" إلى "${newRankInfo.name}"`);
    
    // إرسال التحديث للجميع
    io.emit('userRankUpdated', { 
        userId: targetUser.id, 
        username: targetUser.username, 
        oldRank: oldRankInfo.name,
        newRank: newRankInfo.name,
        rank: newRank,
        rankInfo: newRankInfo,
        updatedBy: requester.username
    });

    res.json({ 
        success: true,
        message: `تم تغيير رتبة ${targetUser.username} من "${oldRankInfo.name}" إلى "${newRankInfo.name}" بنجاح`,
        user: {
            id: targetUser.id,
            username: targetUser.username,
            oldRank: oldRankInfo.name,
            newRank: newRankInfo.name,
            rankInfo: newRankInfo
        },
        action: reason || 'تغيير رتبة'
    });
});

// === API لإزالة رتبة (إرجاع للزائر) ===
app.post('/api/remove-user-rank', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'الرجاء تسجيل الدخول أولاً' });
    
    const requester = users.find(u => u.token === token);
    if (!requester) return res.status(403).json({ error: 'رمز الدخول غير صالح' });

    // التحقق من صلاحيات المالك
    const isOwner = (requester.email === 'njdj9985@gmail.com' && requester.rank === 'owner') || 
                    requester.permissions?.includes('all') || 
                    requester.id === 1;
    
    if (!isOwner) {
        return res.status(403).json({ error: 'فقط المالك يمكنه إزالة الرتب' });
    }

    const { targetUserId, reason } = req.body;
    if (!targetUserId) {
        return res.status(400).json({ error: 'يجب تحديد المستخدم المستهدف' });
    }

    const targetUser = users.find(u => u.id === parseInt(targetUserId));
    if (!targetUser) {
        return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    const oldRankInfo = RANKS[targetUser.rank] || RANKS.visitor;
    
    // إرجاع المستخدم لرتبة الزائر
    targetUser.rank = 'visitor';
    targetUser.rankUpdatedAt = new Date().toISOString();
    targetUser.rankUpdatedBy = requester.username;
    
    // حفظ سجل الإزالة
    targetUser.rankHistory = targetUser.rankHistory || [];
    targetUser.rankHistory.push({
        oldRank: targetUser.rank,
        newRank: 'visitor',
        changedBy: requester.username,
        reason: reason || 'إزالة الرتبة بواسطة المالك',
        timestamp: new Date().toISOString()
    });

    console.log(`🗑️ [MALIK] ${requester.username} أزال رتبة ${targetUser.username} (${oldRankInfo.name})`);
    
    io.emit('userRankUpdated', { 
        userId: targetUser.id, 
        username: targetUser.username, 
        oldRank: oldRankInfo.name,
        newRank: 'زائر',
        rank: 'visitor',
        rankInfo: RANKS.visitor,
        updatedBy: requester.username,
        action: 'removed'
    });

    res.json({ 
        success: true,
        message: `تم إزالة رتبة ${targetUser.username} (${oldRankInfo.name}) وإرجاعه للزائر`,
        user: {
            id: targetUser.id,
            username: targetUser.username,
            oldRank: oldRankInfo.name,
            newRank: 'زائر'
        }
    });
});

// === API لجلب قائمة الرتب مع المميزات ===
app.get('/api/ranks', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'الرجاء تسجيل الدخول' });
    
    const user = users.find(u => u.token === token);
    if (!user) return res.status(403).json({ error: 'رمز غير صالح' });

    // إرسال جميع الرتب مع المميزات
    res.json({
        success: true,
        ranks: RANKS,
        currentUserRank: user.rank,
        currentUserFeatures: (RANKS[user.rank] || RANKS.visitor).features
    });
});

// === API للتحقق من صلاحيات المستخدم ===
app.get('/api/user-permissions', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'الرجاء تسجيل الدخول' });
    
    const user = users.find(u => u.token === token);
    if (!user) return res.status(403).json({ error: 'رمز غير صالح' });

    const rankInfo = RANKS[user.rank] || RANKS.visitor;
    const isOwner = user.email === 'njdj9985@gmail.com' && user.rank === 'owner';
    
    res.json({
        success: true,
        user: {
            id: user.id,
            username: user.username,
            rank: user.rank,
            rankName: rankInfo.name,
            level: rankInfo.level,
            features: rankInfo.features,
            color: rankInfo.color,
            isOwner: isOwner,
            permissions: isOwner ? ['all'] : ['basic']
        }
    });
});

// === API لجلب جميع المستخدمين (للمالك فقط) ===
app.get('/api/users', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'الرجاء تسجيل الدخول' });
    
    const user = users.find(u => u.token === token);
    if (!user) return res.status(403).json({ error: 'رمز غير صالح' });

    // فقط المالك يمكنه رؤية جميع المستخدمين
    if (user.email !== 'njdj9985@gmail.com' || user.rank !== 'owner') {
        return res.status(403).json({ error: 'غير مصرح لك برؤية قائمة المستخدمين' });
    }

    // إضافة معلومات الرتب لكل مستخدم
    const usersWithRanks = users.map(u => ({
        id: u.id,
        username: u.username,
        email: u.email,
        rank: u.rank,
        rankInfo: RANKS[u.rank] || RANKS.visitor,
        points: u.points,
        isOnline: u.isOnline,
        lastLogin: u.lastLogin,
        rankHistory: u.rankHistory || []
    }));

    res.json({
        success: true,
        users: usersWithRanks,
        totalUsers: users.length,
        onlineUsers: users.filter(u => u.isOnline).length
    });
});

// === Socket.IO للتحديثات الفورية ===
io.on('connection', (socket) => {
    console.log('👤 مستخدم جديد متصل:', socket.id);

    socket.on('join', (userId) => {
        socket.join(`user_${userId}`);
        console.log(`👋 ${userId} انضم للشات`);
    });

    socket.on('disconnect', () => {
        console.log('🔌 انقطع اتصال:', socket.id);
    });
});

// === تشغيل السيرفر ===
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 السيرفر يعمل على http://localhost:${PORT}`);
    console.log(`🏆 المالك: njdj9985@gmail.com | رتبة: owner`);
    console.log(`📊 إجمالي المستخدمين: ${users.length}`);
});



// API للحصول على قائمة المستخدمين
app.get('/api/users', (req, res) => {
    res.json(users.map(u => ({
        id: u.id,
        display_name: u.display_name,
        rank: u.rank,
        profile_image1: u.profile_image1,
        age: u.age,
        gender: u.gender,
        marital_status: u.marital_status,
        about_me: u.about_me
    })));
});

// API للطرد
app.post('/api/ban', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    const admin = users.find(u => 'fake-token-' + u.id === token);
    if (!admin || admin.role !== 'admin') return res.status(403).json({ error: 'غير مسموح' });

    const { userId, reason, duration } = req.body;
    const user = users.find(u => u.id === parseInt(userId));
    if (!user) return res.status(404).json({ error: 'المستخدم غير موجود' });

    const ban = {
        id: bans.length + 1,
        user_id: user.id,
        reason,
        duration,
        timestamp: new Date()
    };
    bans.push(ban);
    io.emit('userBanned', { userId: user.id, reason, duration });
    res.json({ message: 'تم طرد المستخدم' });
});

// API للكتم
app.post('/api/mute', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    const admin = users.find(u => 'fake-token-' + u.id === token);
    if (!admin || admin.role !== 'admin') return res.status(403).json({ error: 'غير مسموح' });

    const { userId, reason, duration } = req.body;
    const user = users.find(u => u.id === parseInt(userId));
    if (!user) return res.status(404).json({ error: 'المستخدم غير موجود' });

    const mute = {
        id: mutes.length + 1,
        user_id: user.id,
        reason,
        duration,
        timestamp: new Date()
    };
    mutes.push(mute);
    io.emit('userMuted', { userId: user.id, reason, duration });
    res.json({ message: 'تم كتم المستخدم' });
});

// Socket.IO للتواصل الفوري
io.on('connection', (socket) => {
    console.log('مستخدم متصل: ' + socket.id);

    // الانضمام إلى غرفة
    socket.on('join', (data) => {
        socket.join(data.roomId);
        socket.user = data;
        io.emit('userList', users.filter(u => u.id !== socket.user.userId));
    });

    // إرسال رسالة عامة
    socket.on('sendMessage', (data) => {
        // فحص الحماية من الفيضانات
        const userId = socket.user.userId;
        const now = Date.now();

        if (!floodProtection.has(userId)) {
            floodProtection.set(userId, []);
        }

        const userMessages = floodProtection.get(userId);
        // إزالة الرسائل القديمة (أكثر من 10 ثواني)
        const recentMessages = userMessages.filter(time => now - time < 10000);

        // إذا أرسل أكثر من 5 رسائل في 10 ثواني
        if (recentMessages.length >= 5) {
            const muteEndTime = new Date(now + 5 * 60 * 1000); // 5 دقائق
            const mute = {
                id: mutes.length + 1,
                user_id: userId,
                reason: 'الفيضانات - رسائل سريعة ومتكررة',
                duration: '5m',
                timestamp: new Date(),
                endTime: muteEndTime
            };
            mutes.push(mute);

            // إرسال رسالة للشات عن الكتم
            const muteMessage = {
                id: messages.length + 1,
                roomId: data.roomId,
                content: `تم كتم ${socket.user.display_name} بسبب الفيضانات`,
                type: 'system',
                timestamp: new Date()
            };
            messages.push(muteMessage);
            io.to(data.roomId).emit('newMessage', muteMessage);

            socket.emit('error', 'تم كتمك لمدة 5 دقائق بسبب الرسائل السريعة والمتكررة');
            return;
        }

        recentMessages.push(now);
        floodProtection.set(userId, recentMessages);

        const isMuted = mutes.find(m => m.user_id === socket.user.userId && 
            (m.duration === 'permanent' || (m.endTime && new Date() < new Date(m.endTime)) || 
             new Date() - new Date(m.timestamp) < parseDuration(m.duration)));
        if (isMuted) return socket.emit('error', 'أنت مكتوم ولا يمكنك إرسال الرسائل');

        const message = { 
            id: messages.length + 1, 
            roomId: data.roomId, 
            user_id: socket.user.userId, 
            display_name: socket.user.display_name, 
            rank: socket.user.rank, 
            content: data.content, 
            type: 'text', 
            timestamp: new Date() 
        };
        messages.push(message);
        io.to(data.roomId).emit('newMessage', message);
    });

    // إرسال رسالة خاصة
    socket.on('sendPrivateMessage', (data) => {
        const isMuted = mutes.find(m => m.user_id === socket.user.userId && 
            (m.duration === 'permanent' || new Date() - new Date(m.timestamp) < parseDuration(m.duration)));
        if (isMuted) return socket.emit('error', 'أنت مكتوم ولا يمكنك إرسال الرسائل');

        const message = { 
            id: privateMessages.length + 1, 
            senderId: socket.user.userId, 
            display_name: socket.user.display_name, 
            rank: socket.user.rank, 
            receiverId: data.receiverId, 
            content: data.content, 
            type: 'text', 
            timestamp: new Date() 
        };
        privateMessages.push(message);
        socket.to(data.receiverId).emit('newPrivateMessage', message);
        socket.emit('newPrivateMessage', message);
    });

    // إرسال صورة عامة
    socket.on('sendImage', (data, callback) => {
        upload.single('image')(data, {}, (err) => {
            if (err) {
                console.error('Error uploading image:', err.message);
                return callback({ error: 'فشل رفع الصورة: ' + err.message });
            }
            const isMuted = mutes.find(m => m.user_id === socket.user.userId && 
                (m.duration === 'permanent' || new Date() - new Date(m.timestamp) < parseDuration(m.duration)));
            if (isMuted) return callback({ error: 'أنت مكتوم ولا يمكنك إرسال الصور' });

            const imageUrl = `/Uploads/${data.file.filename}`;
            const message = { 
                id: messages.length + 1, 
                image_url: imageUrl, 
                type: 'image', 
                roomId: data.roomId, 
                user_id: socket.user.userId, 
                display_name: socket.user.display_name, 
                rank: socket.user.rank, 
                timestamp: new Date() 
            };
            messages.push(message);
            io.to(data.roomId).emit('newImage', message);
            callback({ success: true, imageUrl });
        });
    });

    // إرسال صورة خاصة
    socket.on('sendPrivateImage', (data, callback) => {
        upload.single('image')(data, {}, (err) => {
            if (err) {
                console.error('Error uploading private image:', err.message);
                return callback({ error: 'فشل رفع الصورة: ' + err.message });
            }
            const isMuted = mutes.find(m => m.user_id === socket.user.userId && 
                (m.duration === 'permanent' || new Date() - new Date(m.timestamp) < parseDuration(m.duration)));
            if (isMuted) return callback({ error: 'أنت مكتوم ولا يمكنك إرسال الصور' });

            const imageUrl = `/Uploads/${data.file.filename}`;
            const message = { 
                id: privateMessages.length + 1, 
                image_url: imageUrl, 
                type: 'image', 
                receiverId: data.receiverId, 
                user_id: socket.user.userId, 
                display_name: socket.user.display_name, 
                rank: socket.user.rank, 
                timestamp: new Date() 
            };
            privateMessages.push(message);
            socket.to(data.receiverId).emit('newPrivateImage', message);
            socket.emit('newPrivateImage', message);
            callback({ success: true, imageUrl });
        });
    });

    // إرسال رسالة صوتية عامة
    socket.on('sendVoice', (data, callback) => {
        upload.single('voice')(data, {}, (err) => {
            if (err) {
                console.error('Error uploading voice:', err.message);
                return callback({ error: 'فشل رفع التسجيل الصوتي: ' + err.message });
            }
            const isMuted = mutes.find(m => m.user_id === socket.user.userId && 
                (m.duration === 'permanent' || new Date() - new Date(m.timestamp) < parseDuration(m.duration)));
            if (isMuted) return callback({ error: 'أنت مكتوم ولا يمكنك إرسال الرسائل الصوتية' });

            const voiceUrl = `/Uploads/${data.file.filename}`;
            const message = { 
                id: messages.length + 1, 
                voice_url: voiceUrl, 
                type: 'voice', 
                roomId: data.roomId, 
                user_id: socket.user.userId, 
                display_name: socket.user.display_name, 
                rank: socket.user.rank, 
                timestamp: new Date() 
            };
            messages.push(message);
            io.to(data.roomId).emit('newVoice', message);
            callback({ success: true, voiceUrl });
        });
    });

    // إرسال رسالة صوتية خاصة
    socket.on('sendPrivateVoice', (data, callback) => {
        upload.single('voice')(data, {}, (err) => {
            if (err) {
                console.error('Error uploading private voice:', err.message);
                return callback({ error: 'فشل رفع التسجيل الصوتي: ' + err.message });
            }
            const isMuted = mutes.find(m => m.user_id === socket.user.userId && 
                (m.duration === 'permanent' || new Date() - new Date(m.timestamp) < parseDuration(m.duration)));
            if (isMuted) return callback({ error: 'أنت مكتوم ولا يمكنك إرسال الرسائل الصوتية' });

            const voiceUrl = `/Uploads/${data.file.filename}`;
            const message = { 
                id: privateMessages.length + 1, 
                voice_url: voiceUrl, 
                type: 'voice', 
                receiverId: data.receiverId, 
                user_id: socket.user.userId, 
                display_name: socket.user.display_name, 
                rank: socket.user.rank, 
                timestamp: new Date() 
            };
            privateMessages.push(message);
            socket.to(data.receiverId).emit('newPrivateVoice', message);
            socket.emit('newPrivateVoice', message);
            callback({ success: true, voiceUrl });
        });
    });

    // حذف غرفة
    socket.on('deleteRoom', (roomId) => {
        const user = users.find(u => u.id === socket.user.userId);
        if (user.role === 'admin') {
            rooms = rooms.filter(r => r.id !== roomId);
            io.emit('roomDeleted', roomId);
        }
    });

    // إرسال إشعار
    socket.on('sendNotification', (data) => {
        io.to(data.userId).emit('newNotification', data);
    });

    // تحميل المنشورات
    socket.on('loadNewsPosts', () => {
        socket.emit('loadNewsPosts', news);
    });

    // نشر خبر جديد
    socket.on('addNewsPost', (data) => {
        const user = socket.user;
        if (!user) return;
        const isMuted = mutes.find(m => m.user_id === user.userId && 
            (m.duration === 'permanent' || new Date() - new Date(m.timestamp) < parseDuration(m.duration)));
        if (isMuted) return socket.emit('error', 'أنت مكتوم ولا يمكنك نشر الأخبار');

        const newNews = {
            id: news.length + 1,
            content: data.content,
            media: data.media,
            user_id: user.userId,
            display_name: user.display_name,
            timestamp: new Date(),
            likes: []
        };
        news.push(newNews);
        io.emit('updateNewsPost', newNews);
    });

    // إضافة تفاعل
    socket.on('addReaction', (data) => {
        const user = socket.user;
        if (!user) return;
        const post = news.find(n => n.id === parseInt(data.postId));
        if (post) {
            if (!post.reactions) post.reactions = { likes: [], dislikes: [], hearts: [] };

            // إزالة التفاعل السابق للمستخدم
            Object.keys(post.reactions).forEach(reactionType => {
                post.reactions[reactionType] = post.reactions[reactionType].filter(r => r.user_id !== user.userId);
            });

            // إضافة التفاعل الجديد
            if (data.type === 'like') {
                post.reactions.likes.push({ user_id: user.userId, display_name: user.display_name });
            } else if (data.type === 'dislike') {
                post.reactions.dislikes.push({ user_id: user.userId, display_name: user.display_name });
            } else if (data.type === 'heart') {
                post.reactions.hearts.push({ user_id: user.userId, display_name: user.display_name });
            }

            io.emit('updateNewsPost', post);
        }
    });

    // إضافة تعليق
    socket.on('addComment', (data) => {
        const user = socket.user;
        if (!user) return;

        const newComment = {
            id: comments.length + 1,
            postId: parseInt(data.postId),
            content: data.content,
            user_id: user.userId,
            display_name: user.display_name,
            targetUserId: data.targetUserId ? parseInt(data.targetUserId) : null,
            timestamp: new Date()
        };
        comments.push(newComment);

        // إرسال التعليق للجميع
        io.emit('newComment', newComment);

        // إرسال إشعار للمستخدم المستهدف
        if (data.targetUserId) {
            io.to(data.targetUserId).emit('commentNotification', {
                from: user.display_name,
                content: data.content,
                postId: data.postId
            });
        }
    });

    // إيقاف المسابقة
    socket.on('stopCompetition', (competitionId) => {
        const competition = competitions.find(c => c.id === parseInt(competitionId));
        if (competition) {
            competition.active = false;
            io.emit('competitionStopped', competitionId);
        }
    });

    // فصل الاتصال
    socket.on('disconnect', () => {
        console.log('مستخدم منفصل: ' + socket.id);
        io.emit('userList', users.filter(u => u.id !== socket.user?.userId));
    });
});

// دالة مساعدة لتحويل مدة الكتم/الطرد إلى ميلي ثانية
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

// تنظيف الحماية من الفيضانات كل دقيقة
setInterval(() => {
    const now = Date.now();
    for (const [userId, messages] of floodProtection.entries()) {
        const recentMessages = messages.filter(time => now - time < 60000);
        if (recentMessages.length === 0) {
            floodProtection.delete(userId);
        } else {
            floodProtection.set(userId, recentMessages);
        }
    }
}, 60000);

// تنظيف الكتم المنتهي
setInterval(() => {
    const now = new Date();
    mutes = mutes.filter(mute => {
        if (mute.endTime && now > new Date(mute.endTime)) {
            return false;
        }
        return true;
    });
}, 30000);

// تشغيل الخادم
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

