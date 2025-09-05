const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const multer = require('multer');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: { origin: '*' } // للسماح بالاتصال من Replit Preview
});

app.use(bodyParser.json());
app.use(express.static('uploads')); // لخدمة الصور والصوت من مجلد uploads

// إنشاء مجلد uploads إذا لم يكن موجودًا (Replit يدعمه تلقائيًا)

// Multer لتخزين الملفات
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// مصفوفة مؤقتة للغرف (بدل قاعدة بيانات)
let rooms = [
    { id: 1, name: 'الغرفة الرئيسية', description: 'غرفة دردشة عامة' }
];

// مصفوفة مؤقتة للمستخدمين (للاختبار، استخدم قاعدة بيانات حقيقية)
let users = [
    { id: 1, display_name: 'Admin', rank: 'admin', role: 'admin', email: 'admin@example.com', password: 'admin', profile_image1: null }
];

let messages = []; // رسائل عامة
let privateMessages = []; // رسائل خاصة

// API للتسجيل الدخول (بسيط، بدون تشفير للاختبار)
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
        const token = 'fake-token-' + user.id; // استخدم JWT حقيقي
        res.json({ token, user });
    } else {
        res.status(401).json({ error: 'بيانات خاطئة' });
    }
});

app.post('/api/register', (req, res) => {
    const { email, password, display_name } = req.body;
    if (users.find(u => u.email === email)) {
        return res.status(400).json({ error: 'البريد موجود' });
    }
    const newUser = { id: users.length + 1, email, password, display_name, rank: 'visitor', role: 'user' };
    users.push(newUser);
    const token = 'fake-token-' + newUser.id;
    res.json({ token, user: newUser });
});

// API للملف الشخصي
app.get('/api/user/profile', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    const user = users.find(u => 'fake-token-' + u.id === token);
    if (user) res.json(user);
    else res.status(401).json({ error: 'غير مصرح' });
});

// API للغرف
app.get('/api/rooms', (req, res) => res.json(rooms));

app.post('/api/rooms', upload.single('roomBackground'), (req, res) => {
    const { name, description } = req.body;
    const background = req.file ? `/uploads/${req.file.filename}` : null;
    const newRoom = { id: rooms.length + 1, name, description, background };
    rooms.push(newRoom);
    res.json(newRoom);
});

app.delete('/api/rooms/:id', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    const user = users.find(u => 'fake-token-' + u.id === token);
    if (user.role !== 'admin') return res.status(403).json({ error: 'غير مسموح' });
    rooms = rooms.filter(r => r.id !== parseInt(req.params.id));
    io.emit('roomDeleted', parseInt(req.params.id));
    res.json({ message: 'تم الحذف' });
});

// API للرسائل
app.get('/api/messages/:roomId', (req, res) => {
    res.json(messages.filter(m => m.roomId === parseInt(req.params.roomId)));
});

app.get('/api/private-messages/:userId', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    const current = users.find(u => 'fake-token-' + u.id === token);
    res.json(privateMessages.filter(pm => (pm.senderId === current.id && pm.receiverId === parseInt(req.params.userId)) || (pm.senderId === parseInt(req.params.userId) && pm.receiverId === current.id)));
});

// Socket.io للرسائل الفورية
io.on('connection', (socket) => {
    console.log('مستخدم متصل: ' + socket.id);

    socket.on('join', (data) => {
        socket.join(data.roomId);
        socket.user = data;
    });

    socket.on('sendMessage', (data) => {
        const message = { ...data, id: messages.length + 1, user_id: socket.user.userId, display_name: socket.user.displayName, rank: socket.user.rank, timestamp: new Date() };
        messages.push(message);
        io.to(data.roomId).emit('newMessage', message);
    });

    socket.on('sendPrivateMessage', (data) => {
        const message = { ...data, id: privateMessages.length + 1, user_id: socket.user.userId, display_name: socket.user.displayName, rank: socket.user.rank, receiver_id: data.receiverId, timestamp: new Date() };
        privateMessages.push(message);
        socket.to(data.receiverId).emit('newPrivateMessage', message);
        socket.emit('newPrivateMessage', message); // عرض للمرسل
    });

    socket.on('sendImage', (data) => {
        const imageUrl = `/uploads/${Date.now()}.png`; // افتراضي، استخدم multer للرفع الحقيقي
        const message = { image_url: imageUrl, type: 'image', roomId: data.roomId, user_id: socket.user.userId, display_name: socket.user.displayName, rank: socket.user.rank, timestamp: new Date() };
        io.to(data.roomId).emit('newImage', message);
    });

    socket.on('sendPrivateImage', (data) => {
        const imageUrl = `/uploads/${Date.now()}.png`;
        const message = { image_url: imageUrl, type: 'image', receiverId: data.receiverId, user_id: socket.user.userId, display_name: socket.user.displayName, rank: socket.user.rank, timestamp: new Date() };
        socket.to(data.receiverId).emit('newPrivateImage', message);
        socket.emit('newPrivateImage', message);
    });

    socket.on('sendVoice', (data) => {
        const voiceUrl = `/uploads/${Date.now()}.webm`;
        const message = { voice_url: voiceUrl, type: 'voice', roomId: data.roomId, user_id: socket.user.userId, display_name: socket.user.displayName, rank: socket.user.rank, timestamp: new Date() };
        io.to(data.roomId).emit('newVoice', message);
    });

    socket.on('sendPrivateVoice', (data) => {
        const voiceUrl = `/uploads/${Date.now()}.webm`;
        const message = { voice_url: voiceUrl, type: 'voice', receiverId: data.receiverId, user_id: socket.user.userId, display_name: socket.user.displayName, rank: socket.user.rank, timestamp: new Date() };
        socket.to(data.receiverId).emit('newPrivateVoice', message);
        socket.emit('newPrivateVoice', message);
    });

    socket.on('deleteRoom', (roomId) => {
        io.emit('roomDeleted', roomId);
    });

    socket.on('disconnect', () => {
        console.log('مستخدم منفصل: ' + socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
