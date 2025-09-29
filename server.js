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

// دوال مساعدة للتحقق من الصلاحيات
const isOwner = (user) => user && user.email === OWNER_EMAIL;
const isAdmin = (user) => user && (user.role === 'admin' || isOwner(user));
const canModerateUsers = (user) => user && (user.rank === 'admin' || isOwner(user));
const canManageRooms = (user) => user && (user.rank === 'admin' || isOwner(user));

// ميدلوير للتحقق من صلاحيات المالك
const requireOwner = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    const user = users.find(u => 'fake-token-' + u.id === token);
    if (!isOwner(user)) {
        return res.status(403).json({ error: 'هذه الصلاحية للمالك فقط' });
    }
    req.user = user;
    next();
};

// ميدلوير للتحقق من صلاحيات الإدارة
const requireAdmin = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    const user = users.find(u => 'fake-token-' + u.id === token);
    if (!isAdmin(user)) {
        return res.status(403).json({ error: 'هذه الصلاحية للإدارة فقط' });
    }
    req.user = user;
    next();
};

// دالة لتسجيل الإجراءات في سجل التدقيق
const logAuditAction = (user, action, details) => {
    auditLog.push({
        id: auditLog.length + 1,
        userId: user.id,
        userEmail: user.email,
        action,
        details,
        timestamp: new Date()
    });
};

// دالة للتحقق من مستوى المستخدم
const getUserLevel = (user) => {
    if (isOwner(user)) return 5;
    if (user.rank === 'admin') return 4;
    if (user.rank === 'prince') return 3;
    return parseInt(user.rank.replace('level', '')) || 1;
};

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
const OWNER_EMAIL = 'njdj9985@gmail.com';
const DEFAULT_FRAMES = {
    owner: [
        { id: 'o1', name: 'إطار المالك 1', type: 'animated', glow: true, colors: ['gold', 'purple'], purchasable: false },
        { id: 'o2', name: 'إطار المالك 2', type: 'animated', glow: true, colors: ['red', 'blue'], purchasable: false },
        { id: 'o3', name: 'إطار المالك 3', type: 'animated', glow: true, colors: ['green', 'cyan'], purchasable: false }
    ],
    admin: Array.from({ length: 10 }, (_, i) => ({
        id: `a${i+1}`,
        name: `إطار الإدارة ${i+1}`,
        type: 'animated',
        glow: true,
        colors: ['red', 'blue', 'green'],
        price: 100000,
        purchasable: true,
        minRank: 'admin'
    })),
    prince: Array.from({ length: 20 }, (_, i) => ({
        id: `p${i+1}`,
        name: `إطار البرنس ${i+1}`,
        type: 'animated',
        glow: true,
        colors: ['purple', 'gold'],
        price: 2000,
        purchasable: true,
        minRank: 'prince'
    }))
};

let rooms = [
    { id: 1, name: 'الغرفة الرئيسية', description: 'غرفة دردشة عامة', background: null, status: 'open' }
];

let users = [
    { 
        id: 1, 
        display_name: 'المالك', 
        rank: 'owner', 
        role: 'owner', 
        email: OWNER_EMAIL,
        password: 'admin123', // يجب تغييرها من قبل المالك
        profile_image1: null,
        profile_image2: null,
        message_background: null,
        age: null,
        gender: null,
        marital_status: null,
        about_me: null,
        coins: 1000000,
        frames: DEFAULT_FRAMES.owner,
        activeFrame: 'o1',
        privacySettings: {
            profile: 'all',
            privateMessages: 'all',
            notifications: true
        },
        purchasedItems: [],
        lastSeen: new Date(),
        joinDate: new Date()
    }
];

let messages = [];
let privateMessages = [];
let news = [];
let stories = [];
let bans = [];
let mutes = [];
let frames = [...DEFAULT_FRAMES.owner, ...DEFAULT_FRAMES.admin, ...DEFAULT_FRAMES.prince];
let shop = {
    frames: frames.filter(f => f.purchasable),
    backgrounds: [],
    emojis: [],
    crowns: [],
    effects: []
};
let auditLog = [];
let music = [];
let quizzes = [];
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

// API لإنشاء غرفة جديدة
app.post('/api/rooms', upload.single('roomBackground'), (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    const user = users.find(u => 'fake-token-' + u.id === token);
    if (!user || user.role !== 'admin') return res.status(403).json({ error: 'غير مسموح' });

    const { name, description } = req.body;
    const background = req.file ? `/Uploads/${req.file.filename}` : null;
    const newRoom = { id: rooms.length + 1, name, description, background };
    rooms.push(newRoom);
    io.emit('roomCreated', newRoom);
    res.json(newRoom);
});

// API لحذف غرفة
app.delete('/api/rooms/:id', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    const user = users.find(u => 'fake-token-' + u.id === token);
    if (!user || user.role !== 'admin') return res.status(403).json({ error: 'غير مسموح' });

    const roomId = parseInt(req.params.id);
    rooms = rooms.filter(r => r.id !== roomId);
    io.emit('roomDeleted', roomId);
    res.json({ message: 'تم حذف الغرفة' });
});

// API للحصول على رسائل الغرفة
app.get('/api/messages/:roomId', (req, res) => {
    res.json(messages.filter(m => m.roomId === parseInt(req.params.roomId)));
});

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

// API endpoints للمالك

// تغيير كلمة مرور أو بريد أي مستخدم
app.post('/api/owner/update-user-credentials', requireOwner, (req, res) => {
    const { userId, newEmail, newPassword } = req.body;
    const targetUser = users.find(u => u.id === parseInt(userId));
    if (!targetUser) return res.status(404).json({ error: 'المستخدم غير موجود' });

    if (newEmail) targetUser.email = newEmail;
    if (newPassword) targetUser.password = newPassword;

    logAuditAction(req.user, 'update_user_credentials', {
        targetUserId: userId,
        emailChanged: !!newEmail,
        passwordChanged: !!newPassword
    });

    res.json({ message: 'تم تحديث بيانات المستخدم' });
});

// تعيين رتبة للمستخدم
app.post('/api/assign-rank', requireAdmin, (req, res) => {
    const { userId, rank, reason } = req.body;
    const user = users.find(u => u.id === parseInt(userId));
    if (!user) return res.status(404).json({ error: 'المستخدم غير موجود' });

    // فقط المالك يمكنه تعيين رتبة الإدارة
    if (rank === 'admin' && !isOwner(req.user)) {
        return res.status(403).json({ error: 'فقط المالك يمكنه تعيين رتبة الإدارة' });
    }

    const oldRank = user.rank;
    user.rank = rank;

    logAuditAction(req.user, 'assign_rank', {
        targetUserId: userId,
        oldRank,
        newRank: rank,
        reason
    });

    res.json({ message: 'تم تعيين الرتبة' });
    io.emit('userUpdated', user);
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

// API للتحكم في الغرف
app.post('/api/rooms/manage', requireAdmin, (req, res) => {
    const { action, roomId, name, description, background } = req.body;
    
    switch (action) {
        case 'create':
            const newRoom = {
                id: rooms.length + 1,
                name,
                description,
                background,
                status: 'open',
                createdBy: req.user.id,
                createdAt: new Date()
            };
            rooms.push(newRoom);
            io.emit('roomCreated', newRoom);
            logAuditAction(req.user, 'create_room', { roomId: newRoom.id });
            res.json(newRoom);
            break;

        case 'update':
            const room = rooms.find(r => r.id === parseInt(roomId));
            if (!room) return res.status(404).json({ error: 'الغرفة غير موجودة' });
            
            if (name) room.name = name;
            if (description) room.description = description;
            if (background) room.background = background;
            
            io.emit('roomUpdated', room);
            logAuditAction(req.user, 'update_room', { roomId });
            res.json(room);
            break;

        case 'delete':
            rooms = rooms.filter(r => r.id !== parseInt(roomId));
            io.emit('roomDeleted', roomId);
            logAuditAction(req.user, 'delete_room', { roomId });
            res.json({ message: 'تم حذف الغرفة' });
            break;

        case 'close':
        case 'open':
            const targetRoom = rooms.find(r => r.id === parseInt(roomId));
            if (!targetRoom) return res.status(404).json({ error: 'الغرفة غير موجودة' });
            
            targetRoom.status = action === 'close' ? 'closed' : 'open';
            io.emit('roomStatusChanged', { roomId, status: targetRoom.status });
            logAuditAction(req.user, `${action}_room`, { roomId });
            res.json(targetRoom);
            break;
    }
});

// API للحظر
app.post('/api/ban', requireAdmin, (req, res) => {
    const { userId, reason, duration } = req.body;
    const user = users.find(u => u.id === parseInt(userId));
    if (!user) return res.status(404).json({ error: 'المستخدم غير موجود' });

    // لا يمكن حظر المالك أو الإدارة
    if (isAdmin(user)) {
        return res.status(403).json({ error: 'لا يمكن حظر المالك أو الإدارة' });
    }

    const ban = {
        id: bans.length + 1,
        user_id: user.id,
        admin_id: req.user.id,
        reason,
        duration,
        timestamp: new Date(),
        endTime: duration === 'permanent' ? null : new Date(Date.now() + parseDuration(duration))
    };
    bans.push(ban);
    
    logAuditAction(req.user, 'ban_user', {
        targetUserId: userId,
        reason,
        duration
    });

    io.emit('userBanned', { userId: user.id, reason, duration });
    res.json({ message: 'تم حظر المستخدم' });
});

// API للكتم
app.post('/api/mute', requireAdmin, (req, res) => {
    const { userId, reason, duration } = req.body;
    const user = users.find(u => u.id === parseInt(userId));
    if (!user) return res.status(404).json({ error: 'المستخدم غير موجود' });

    // لا يمكن كتم المالك أو الإدارة
    if (isAdmin(user)) {
        return res.status(403).json({ error: 'لا يمكن كتم المالك أو الإدارة' });
    }

    const mute = {
        id: mutes.length + 1,
        user_id: user.id,
        admin_id: req.user.id,
        reason,
        duration,
        timestamp: new Date(),
        endTime: duration === 'permanent' ? null : new Date(Date.now() + parseDuration(duration))
    };
    mutes.push(mute);

    logAuditAction(req.user, 'mute_user', {
        targetUserId: userId,
        reason,
        duration
    });

    io.emit('userMuted', { userId: user.id, reason, duration });
    res.json({ message: 'تم كتم المستخدم' });

    // إرسال رسالة للشات إذا كان الكتم في غرفة عامة
    if (req.body.roomId) {
        const muteMessage = {
            id: messages.length + 1,
            roomId: req.body.roomId,
            content: `تم كتم ${user.display_name} - السبب: ${reason}`,
            type: 'system',
            timestamp: new Date()
        };
        messages.push(muteMessage);
        io.to(req.body.roomId).emit('newMessage', muteMessage);
    }
});

// API للمتجر والإطارات
app.get('/api/shop', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    const user = users.find(u => 'fake-token-' + u.id === token);
    
    // تصفية العناصر حسب رتبة المستخدم
    const filteredShop = {
        frames: shop.frames.filter(f => !f.minRank || getUserLevel(user) >= getUserLevel({ rank: f.minRank })),
        backgrounds: shop.backgrounds,
        emojis: shop.emojis,
        crowns: shop.crowns,
        effects: shop.effects
    };
    
    res.json(filteredShop);
});

app.post('/api/shop/purchase', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    const user = users.find(u => 'fake-token-' + u.id === token);
    if (!user) return res.status(401).json({ error: 'غير مصرح له' });

    const { itemId, itemType } = req.body;
    const item = shop[itemType]?.find(i => i.id === itemId);
    if (!item) return res.status(404).json({ error: 'العنصر غير موجود' });
    
    // التحقق من الرتبة المطلوبة
    if (item.minRank && getUserLevel(user) < getUserLevel({ rank: item.minRank })) {
        return res.status(403).json({ error: 'رتبتك غير كافية لشراء هذا العنصر' });
    }

    // التحقق من السعر
    if (user.coins < item.price) {
        return res.status(400).json({ error: 'رصيدك غير كافٍ' });
    }

    // إتمام عملية الشراء
    user.coins -= item.price;
    user.purchasedItems.push({
        id: itemId,
        type: itemType,
        purchaseDate: new Date(),
        price: item.price
    });

    if (itemType === 'frames') {
        user.frames.push(item);
    }

    logAuditAction(user, 'purchase_item', {
        itemId,
        itemType,
        price: item.price
    });

    res.json({
        message: 'تم الشراء بنجاح',
        newBalance: user.coins,
        item
    });
});

// API لإدارة المتجر (للمالك فقط)
app.post('/api/shop/manage', requireOwner, (req, res) => {
    const { action, itemType, item } = req.body;

    switch (action) {
        case 'add':
            if (!shop[itemType]) shop[itemType] = [];
            const newItem = { ...item, id: Date.now().toString() };
            shop[itemType].push(newItem);
            logAuditAction(req.user, 'add_shop_item', { itemType, itemId: newItem.id });
            res.json(newItem);
            break;

        case 'update':
            const index = shop[itemType]?.findIndex(i => i.id === item.id);
            if (index === -1) return res.status(404).json({ error: 'العنصر غير موجود' });
            shop[itemType][index] = { ...shop[itemType][index], ...item };
            logAuditAction(req.user, 'update_shop_item', { itemType, itemId: item.id });
            res.json(shop[itemType][index]);
            break;

        case 'delete':
            if (!shop[itemType]) return res.status(404).json({ error: 'نوع العنصر غير موجود' });
            shop[itemType] = shop[itemType].filter(i => i.id !== item.id);
            logAuditAction(req.user, 'delete_shop_item', { itemType, itemId: item.id });
            res.json({ message: 'تم حذف العنصر' });
            break;

        default:
            res.status(400).json({ error: 'إجراء غير صالح' });
    }
});

// API لإدارة الإطارات الخاصة (للمالك فقط)
app.post('/api/frames/manage', requireOwner, (req, res) => {
    const { action, frameId, userId, frame } = req.body;

    switch (action) {
        case 'assign':
            const targetUser = users.find(u => u.id === parseInt(userId));
            if (!targetUser) return res.status(404).json({ error: 'المستخدم غير موجود' });
            
            const frameToAssign = frames.find(f => f.id === frameId);
            if (!frameToAssign) return res.status(404).json({ error: 'الإطار غير موجود' });

            targetUser.frames.push(frameToAssign);
            logAuditAction(req.user, 'assign_frame', { frameId, userId });
            res.json({ message: 'تم إضافة الإطار للمستخدم' });
            break;

        case 'create':
            const newFrame = { ...frame, id: Date.now().toString() };
            frames.push(newFrame);
            if (frame.purchasable) {
                shop.frames.push(newFrame);
            }
            logAuditAction(req.user, 'create_frame', { frameId: newFrame.id });
            res.json(newFrame);
            break;

        default:
            res.status(400).json({ error: 'إجراء غير صالح' });
    }
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
        if (!socket.user) return socket.emit('error', 'يجب تسجيل الدخول أولاً');
        
        // فحص حالة الغرفة
        const room = rooms.find(r => r.id === parseInt(data.roomId));
        if (!room) return socket.emit('error', 'الغرفة غير موجودة');
        if (room.status === 'closed' && !isAdmin(socket.user)) {
            return socket.emit('error', 'الغرفة مغلقة');
        }

        // فحص الحماية من الفيضانات
        const userId = socket.user.userId;
        const now = Date.now();

        if (!floodProtection.has(userId)) {
            floodProtection.set(userId, []);
        }

        const userMessages = floodProtection.get(userId);
        const recentMessages = userMessages.filter(time => now - time < 10000);

        // إذا أرسل أكثر من 5 رسائل في 10 ثواني
        if (recentMessages.length >= 5 && !isAdmin(socket.user)) {
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
        if (isMuted && !isAdmin(socket.user)) {
            return socket.emit('error', 'أنت مكتوم ولا يمكنك إرسال الرسائل');
        }

        // تحقق من مستوى المستخدم
        const userLevel = getUserLevel(socket.user);
        if (userLevel < 1) {
            return socket.emit('error', 'مستواك غير كافٍ لإرسال الرسائل');
        }

        const message = { 
            id: messages.length + 1, 
            roomId: data.roomId, 
            user_id: socket.user.userId, 
            display_name: socket.user.display_name, 
            rank: socket.user.rank,
            frame: socket.user.activeFrame,
            message: data.message,
            type: 'text',
            reactions: [],
            isPinned: false,
            timestamp: new Date(),
            mentions: data.mentions || []
        };

        // إضافة تأثيرات خاصة للرسالة حسب رتبة المستخدم
        if (isOwner(socket.user)) {
            message.effects = ['owner'];
        } else if (socket.user.rank === 'admin') {
            message.effects = ['admin'];
        } else if (socket.user.rank === 'prince') {
            message.effects = ['prince'];
        }

        messages.push(message);
        io.to(data.roomId).emit('newMessage', message);

        // إرسال إشعارات للمذكورين
        if (message.mentions.length > 0) {
            message.mentions.forEach(userId => {
                io.to(userId).emit('mentioned', {
                    messageId: message.id,
                    roomId: message.roomId,
                    from: message.display_name
                });
            });
        }
    });

    // معالجة التفاعلات على الرسائل
    socket.on('messageReaction', (data) => {
        const { messageId, reaction } = data;
        const message = messages.find(m => m.id === messageId);
        if (!message) return;

        // التحقق من صلاحية التفاعل
        if (!['❤️', '👎', '😅', '👍'].includes(reaction)) {
            return socket.emit('error', 'تفاعل غير صالح');
        }

        // إضافة أو إزالة التفاعل
        const existingReaction = message.reactions.find(r => 
            r.userId === socket.user.userId && r.type === reaction);

        if (existingReaction) {
            message.reactions = message.reactions.filter(r => 
                !(r.userId === socket.user.userId && r.type === reaction));
        } else {
            message.reactions.push({
                userId: socket.user.userId,
                userName: socket.user.display_name,
                type: reaction,
                timestamp: new Date()
            });
        }

        io.to(message.roomId).emit('messageReactionUpdated', {
            messageId: message.id,
            reactions: message.reactions
        });
    });

    // تثبيت الرسائل
    socket.on('pinMessage', (data) => {
        const { messageId } = data;
        const message = messages.find(m => m.id === messageId);
        if (!message) return;

        // التحقق من الصلاحيات
        if (!isAdmin(socket.user)) {
            return socket.emit('error', 'لا تملك صلاحية تثبيت الرسائل');
        }

        message.isPinned = !message.isPinned;
        io.to(message.roomId).emit('messagePinned', {
            messageId: message.id,
            isPinned: message.isPinned,
            pinnedBy: socket.user.display_name
        });

        logAuditAction(socket.user, message.isPinned ? 'pin_message' : 'unpin_message', {
            messageId: message.id,
            roomId: message.roomId
        });
    });

    // معالجة الاقتباسات
    socket.on('quoteMessage', (data) => {
        const { messageId, comment } = data;
        const originalMessage = messages.find(m => m.id === messageId);
        if (!originalMessage) return;

        const quotedMessage = { 
            id: messages.length + 1, 
            roomId: originalMessage.roomId, 
            user_id: socket.user.userId, 
            display_name: socket.user.display_name, 
            rank: socket.user.rank,
            frame: socket.user.activeFrame,
            type: 'quote',
            originalMessage: {
                id: originalMessage.id,
                content: originalMessage.message,
                author: originalMessage.display_name,
                timestamp: originalMessage.timestamp
            },
            message: comment,
            timestamp: new Date(),
            reactions: []
        };

        messages.push(quotedMessage);
        io.to(quotedMessage.roomId).emit('newMessage', quotedMessage);
    });

    // إرسال رسالة خاصة
    socket.on('sendPrivateMessage', (data) => {
        const isMuted = mutes.find(m => m.user_id === socket.user.userId && 
            (m.duration === 'permanent' || new Date() - new Date(m.timestamp) < parseDuration(m.duration)));
        if (isMuted) return socket.emit('error', 'أنت مكتوم ولا يمكنك إرسال الرسائل');

        // التحقق من إعدادات الرسائل الخاصة للمستلم
        const receiver = users.find(u => u.id === data.receiverId);
        if (!receiver) return socket.emit('error', 'المستخدم غير موجود');

        const senderLevel = getUserLevel(socket.user);
        const canSendPM = receiver.privacySettings?.privateMessages === 'all' ||
            (receiver.privacySettings?.privateMessages === 'level3' && senderLevel >= 3) ||
            isAdmin(socket.user);

        if (!canSendPM) {
            return socket.emit('error', 'لا يمكنك إرسال رسائل خاصة لهذا المستخدم');
        }

        const message = { 
            id: privateMessages.length + 1, 
            senderId: socket.user.userId, 
            display_name: socket.user.display_name, 
            rank: socket.user.rank,
            frame: socket.user.activeFrame,
            receiverId: data.receiverId, 
            content: data.content, 
            type: 'text', 
            timestamp: new Date(),
            reactions: []
        };
        
        privateMessages.push(message);
        
        // إرسال الرسالة والإشعار للمستلم
        socket.to(data.receiverId).emit('newPrivateMessage', message);
        if (receiver.privacySettings?.notifications !== false) {
            socket.to(data.receiverId).emit('notification', {
                type: 'private_message',
                from: socket.user.display_name,
                preview: data.content.substring(0, 50)
            });
        }
        
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

    // إدارة المسابقات
    socket.on('startQuiz', (data) => {
        if (!isAdmin(socket.user)) {
            return socket.emit('error', 'لا تملك صلاحية بدء المسابقات');
        }

        const { questions, roomId } = data;
        const quiz = {
            id: quizzes.length + 1,
            questions,
            currentQuestion: 0,
            startTime: new Date(),
            timePerQuestion: 20000, // 20 ثانية
            participants: {},
            roomId,
            isActive: true
        };
        quizzes.push(quiz);

        // بدء المسابقة
        io.to(roomId).emit('quizStarted', {
            quizId: quiz.id,
            totalQuestions: questions.length,
            timePerQuestion: quiz.timePerQuestion
        });

        // إرسال السؤال الأول
        sendQuizQuestion(quiz);
    });

    // معالجة إجابات المسابقة
    socket.on('submitQuizAnswer', (data) => {
        const { quizId, answer } = data;
        const quiz = quizzes.find(q => q.id === quizId && q.isActive);
        if (!quiz) return;

        const userId = socket.user.userId;
        if (!quiz.participants[userId]) {
            quiz.participants[userId] = {
                userId,
                displayName: socket.user.display_name,
                score: 0,
                answers: []
            };
        }

        const currentQuestion = quiz.questions[quiz.currentQuestion];
        const isCorrect = answer === currentQuestion.correct;
        
        quiz.participants[userId].answers.push({
            questionIndex: quiz.currentQuestion,
            answer,
            isCorrect,
            timeStamp: new Date()
        });

        if (isCorrect) {
            quiz.participants[userId].score += 1;
        }
    });

    function sendQuizQuestion(quiz) {
        if (!quiz.isActive || quiz.currentQuestion >= quiz.questions.length) {
            endQuiz(quiz);
            return;
        }

        const question = quiz.questions[quiz.currentQuestion];
        io.to(quiz.roomId).emit('newQuizQuestion', {
            quizId: quiz.id,
            questionNumber: quiz.currentQuestion + 1,
            totalQuestions: quiz.questions.length,
            question: question.text,
            options: question.options,
            timeLeft: quiz.timePerQuestion
        });

        // التقدم للسؤال التالي بعد 20 ثانية
        setTimeout(() => {
            quiz.currentQuestion++;
            sendQuizQuestion(quiz);
        }, quiz.timePerQuestion);
    }

    function endQuiz(quiz) {
        quiz.isActive = false;
        const results = Object.values(quiz.participants)
            .sort((a, b) => b.score - a.score)
            .map((p, index) => ({
                rank: index + 1,
                displayName: p.displayName,
                score: p.score
            }));

        io.to(quiz.roomId).emit('quizEnded', {
            quizId: quiz.id,
            results
        });
    }

    // إدارة الراديو/الموسيقى
    socket.on('musicAction', (data) => {
        if (!isAdmin(socket.user)) {
            return socket.emit('error', 'لا تملك صلاحية التحكم بالموسيقى');
        }

        const { action, song } = data;
        switch (action) {
            case 'add':
                if (song.url && song.title) {
                    const newSong = {
                        id: music.length + 1,
                        ...song,
                        addedBy: socket.user.display_name,
                        addedAt: new Date()
                    };
                    music.push(newSong);
                    io.emit('musicUpdated', { action: 'add', song: newSong });
                }
                break;

            case 'remove':
                const index = music.findIndex(s => s.id === song.id);
                if (index !== -1) {
                    music.splice(index, 1);
                    io.emit('musicUpdated', { action: 'remove', songId: song.id });
                }
                break;

            case 'play':
                const songToPlay = music.find(s => s.id === song.id);
                if (songToPlay) {
                    io.emit('musicUpdated', { 
                        action: 'play', 
                        song: songToPlay,
                        timestamp: new Date()
                    });
                }
                break;
        }
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
