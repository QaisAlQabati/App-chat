/* ===========================
   Server.js – Backend كامل مع كل المميزات
=========================== */

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const multer = require('multer');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: '*' } });

app.use(bodyParser.json());
app.use(express.static('Uploads'));

// إعداد Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'Uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|webm|mp3|mp4/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        cb(null, extname && mimetype);
    }
});

/* ===========================
   1. قواعد البيانات المؤقتة
=========================== */
let rooms = [
    { id: 1, name: 'الغرفة الرئيسية', description: 'غرفة دردشة عامة', background: null }
];

let users = [
    { id: 1, display_name: 'Admin', rank: 'admin', role: 'admin', email: 'admin@example.com', password: 'admin', profile_image1: null, profile_image2: null, message_background: null, age: null, gender: null, marital_status: null, about_me: null, coins: 9999 }
];

let messages = [];
let privateMessages = [];
let news = [];
let stories = [];
let bans = [];
let mutes = [];
let competitions = [];
let comments = [];

/* ===========================
   2. نظام مكافحة الفيضانات
=========================== */
const floodProtection = new Map();

function checkFlood(userId) {
    const now = Date.now();
    if (!floodProtection.has(userId)) floodProtection.set(userId, []);
    const times = floodProtection.get(userId).filter(t => now - t < 10000);
    times.push(now);
    floodProtection.set(userId, times);
    return times.length > 5;
}

/* ===========================
   3. الرتب والمميزات
=========================== */
const ranks = {
    visitor: { name: 'زائر', canUploadMusic: false, canUploadCover: false },
    bronze: { name: 'عضو برونزي', canUploadMusic: true, canUploadCover: true },
    silver: { name: 'عضو فضي', canUploadMusic: true, canUploadCover: true },
    gold: { name: 'عضو ذهبي', canUploadMusic: true, canUploadCover: true },
    trophy: { name: 'مالك الموقع', canUploadMusic: true, canUploadCover: true },
    diamond: { name: 'عضو الماس', canUploadMusic: true, canUploadCover: true },
    prince: { name: 'برنس', canUploadMusic: true, canUploadCover: true },
    admin: { name: 'إداري', canUploadMusic: true, canUploadCover: true }
};

/* ===========================
   4. API تسجيل الدخول والتسجيل
=========================== */
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) return res.status(401).json({ error: 'بيانات تسجيل الدخول غير صحيحة' });
    const token = 'fake-token-' + user.id;
    res.json({ token, user });
});

app.post('/api/register', (req, res) => {
    const { email, password, display_name } = req.body;
    if (users.find(u => u.email === email)) return res.status(400).json({ error: 'البريد موجود مسبقًا' });
    const newUser = {
        id: users.length + 1, email, password, display_name, rank: 'visitor', role: 'user',
        profile_image1: null, profile_image2: null, message_background: null,
        age: null, gender: null, marital_status: null, about_me: null, coins: 2000
    };
    users.push(newUser);
    const token = 'fake-token-' + newUser.id;
    res.json({ token, user: newUser });
});

/* ===========================
   5. API الملف الشخصي
=========================== */
app.get('/api/user/profile', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    const user = users.find(u => 'fake-token-' + u.id === token);
    if (!user) return res.status(401).json({ error: 'غير مصرح له' });
    res.json(user);
});

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

/* ===========================
   6. API الأخبار والستوري
=========================== */
app.get('/api/news', (req, res) => res.json(news));

app.post('/api/news', upload.single('newsFile'), (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    const user = users.find(u => 'fake-token-' + u.id === token);
    if (!user) return res.status(401).json({ error: 'غير مصرح له' });

    const { content } = req.body;
    if (!content && !req.file) return res.status(400).json({ error: 'يجب إدخال محتوى أو ملف' });

    const newNews = {
        id: news.length + 1,
        content,
        media: req.file ? `/Uploads/${req.file.filename}` : null,
        user_id: user.id,
        display_name: user.display_name,
        timestamp: new Date(),
        likes: [],
        dislikes: [],
        comments: []
    };
    news.push(newNews);
    io.emit('newNews', newNews);
    res.json(newNews);
});

app.get('/api/stories', (req, res) => {
    const validStories = stories.filter(s => new Date() - new Date(s.timestamp) < 24 * 60 * 60 * 1000);
    res.json(validStories);
});

app.post('/api/stories', upload.single('storyImage'), (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    const user = users.find(u => 'fake-token-' + u.id === token);
    if (!user) return res.status(401).json({ error: 'غير مصرح له' });
    if (!req.file) return res.status(400).json({ error: 'يجب رفع صورة' });

    const newStory = {
        id: stories.length + 1,
        image: `/Uploads/${req.file.filename}`,
        user_id: user.id,
        display_name: user.display_name,
        timestamp: new Date()
    };
    stories.push(newStory);
    io.emit('newStory', newStory);
    res.json(newStory);
});

/* ===========================
   7. API التعليقات والتفاعلات
=========================== */
app.post('/api/comments', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    const user = users.find(u => 'fake-token-' + u.id === token);
    if (!user) return res.status(401).json({ error: 'غير مصرح له' });

    const { postId, content } = req.body;
    const post = news.find(n => n.id === parseInt(postId));
    if (!post) return res.status(404).json({ error: 'الخبر غير موجود' });

    const comment = {
        id: comments.length + 1,
        postId: parseInt(postId),
        content,
        user_id: user.id,
        display_name: user.display_name,
        timestamp: new Date()
    };
    comments.push(comment);
    post.comments.push(comment);
    io.emit('newComment', comment);
    res.json(comment);
});

app.get('/api/comments/:postId', (req, res) => {
    const postComments = comments.filter(c => c.postId === parseInt(req.params.postId));
    res.json(postComments);
});

/* ===========================
   8. API الرسائل الخاصة
=========================== */
app.get('/api/private-messages/:userId', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    const current = users.find(u => 'fake-token-' + u.id === token);
    if (!current) return res.status(401).json({ error: 'غير مصرح له' });

    const msgs = privateMessages.filter(pm =>
        (pm.senderId === current.id && pm.receiverId === parseInt(req.params.userId)) ||
        (pm.senderId === parseInt(req.params.userId) && pm.receiverId === current.id)
    );
    res.json(msgs);
});

/* ===========================
   9. Socket.IO – التواصل الفوري
=========================== */
io.on('connection', socket => {
    console.log('مستخدم متصل:', socket.id);

    socket.on('join', data => {
        socket.join(data.roomId);
        socket.user = data;
        io.emit('onlineUsersUpdated', users.filter(u => u.id !== data.userId));
    });

    socket.on('sendMessage', data => {
        if (checkFlood(socket.user.userId)) {
            const muteEnd = new Date(Date.now() + 5 * 60 * 1000);
            mutes.push({ user_id: socket.user.userId, reason: 'الفيضانات', duration: '5m', timestamp: new Date(), endTime: muteEnd });
            io.emit('newMessage', {
                id: messages.length + 1,
                type: 'system',
                content: `تم كتم ${socket.user.display_name} بسبب الفيضانات`,
                timestamp: new Date()
            });
            return socket.emit('error', 'تم كتمك لمدة 5 دقائق بسبب الفيضانات');
        }

        const msg = {
            id: messages.length + 1,
            roomId: data.roomId,
            user_id: socket.user.userId,
            display_name: socket.user.display_name,
            rank: socket.user.rank,
            message: data.message,
            timestamp: new Date()
        };
        messages.push(msg);
        io.to(data.roomId).emit('newMessage', msg);
    });

    socket.on('privateMessage', data => {
        const msg = {
            id: privateMessages.length + 1,
            senderId: socket.user.userId,
            display_name: socket.user.display_name,
            receiverId: data.to,
            message: data.text,
            timestamp: new Date()
        };
        privateMessages.push(msg);
        socket.to(data.to).emit('privateMessage', { from: socket.user.display_name, text: data.text });
        socket.emit('privateMessage', { from: 'أنت', text: data.text });
    });

    socket.on('postNews', data => {
        const newNews = { ...data, id: news.length + 1, display_name: socket.user.display_name, timestamp: new Date() };
        news.push(newNews);
        io.emit('newNews', newNews);
    });

    socket.on('likeNews', id => {
        const post = news.find(n => n.id === id);
        if (post && !post.likes.includes(socket.user.userId)) {
            post.likes.push(socket.user.userId);
            io.emit('newsUpdated', post);
        }
    });

    socket.on('dislikeNews', id => {
        const post = news.find(n => n.id === id);
        if (post && !post.dislikes.includes(socket.user.userId)) {
            post.dislikes.push(socket.user.userId);
            io.emit('newsUpdated', post);
        }
    });

    socket.on('addComment', data => {
        const post = news.find(n => n.id === data.id);
        if (post) {
            const comment = { content: data.content, user: socket.user.display_name };
            post.comments.push(comment);
            io.emit('newsUpdated', post);
        }
    });

    socket.on('disconnect', () => {
        console.log('مستخدم منفصل:', socket.id);
        io.emit('onlineUsersUpdated', users.filter(u => u.id !== socket.user?.userId));
    });
});

/* ===========================
   10. تشغيل الخادم
=========================== */
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
