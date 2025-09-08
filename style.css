// متغيرات عامة
let socket;
let currentUser = null;
let currentRoom = 1;
let isRecording = false;
let mediaRecorder;
let audioChunks = [];
let quotedMessage = null;
let isTyping = false;
let isPrivateTyping = false;

// الرتب المتاحة
const RANKS = {
    visitor: { name: 'Visitor', emoji: '👋', level: 0 },
    bronze: { name: 'Bronze Member', emoji: '🥉', level: 1 },
    silver: { name: 'Silver Member', emoji: '🥈', level: 2 },
    gold: { name: 'Gold Member', emoji: '🥇', level: 3 },
    diamond: { name: 'Diamond Member', emoji: '💎', level: 4 },
    star: { name: 'Super Moderator', emoji: '⭐', level: 5 },
    prince: { name: 'Admin', emoji: '👑', level: 6 },
    trophy: { name: 'Owner', emoji: '🏆', level: 7 }
};

// قائمة 200 اسم جاهز للاستخدام للإشارة @mention
const MENTIONS = [
    'User1','User2','User3','User4','User5','User6','User7','User8','User9','User10',
    'User11','User12','User13','User14','User15','User16','User17','User18','User19','User20',
    'User21','User22','User23','User24','User25','User26','User27','User28','User29','User30',
    'User31','User32','User33','User34','User35','User36','User37','User38','User39','User40',
    'User41','User42','User43','User44','User45','User46','User47','User48','User49','User50',
    'User51','User52','User53','User54','User55','User56','User57','User58','User59','User60',
    'User61','User62','User63','User64','User65','User66','User67','User68','User69','User70',
    'User71','User72','User73','User74','User75','User76','User77','User78','User79','User80',
    'User81','User82','User83','User84','User85','User86','User87','User88','User89','User90',
    'User91','User92','User93','User94','User95','User96','User97','User98','User99','User100',
    'User101','User102','User103','User104','User105','User106','User107','User108','User109','User110',
    'User111','User112','User113','User114','User115','User116','User117','User118','User119','User120',
    'User121','User122','User123','User124','User125','User126','User127','User128','User129','User130',
    'User131','User132','User133','User134','User135','User136','User137','User138','User139','User140',
    'User141','User142','User143','User144','User145','User146','User147','User148','User149','User150',
    'User151','User152','User153','User154','User155','User156','User157','User158','User159','User160',
    'User161','User162','User163','User164','User165','User166','User167','User168','User169','User170',
    'User171','User172','User173','User174','User175','User176','User177','User178','User179','User180',
    'User181','User182','User183','User184','User185','User186','User187','User188','User189','User190',
    'User191','User192','User193','User194','User195','User196','User197','User198','User199','User200'
];

// قائمة الإيموجيات (تحسين معالجة GIFs)
const EMOJIS = [
    {
        category: 'مضحكة',
        items: [
            { code: '😅', name: 'ضحك خفيف' },
            { code: '😂', name: 'ضحك شديد' },
            { code: '🤓', name: 'نردي' },
            { code: '🤡', name: 'مهرج' },
            { code: 'https://media.giphy.com/media/3o7btPCcdNniyf0ArS/giphy.gif', name: 'ضحك متحرك', type: 'gif' },
            { code: 'https://media.giphy.com/media/26gspsw6fpxl2E0Yo/giphy.gif', name: 'ضحك مجنون', type: 'gif' }
        ]
    },
    {
        category: 'حزينة',
        items: [
            { code: '😢', name: 'بكاء' },
            { code: '😭', name: 'بكاء شديد' },
            { code: '🥺', name: 'حزن لطيف' },
            { code: 'https://media.giphy.com/media/ROF8OQv760we6ZorTX/giphy.gif', name: 'بكاء متحرك', type: 'gif' }
        ]
    },
    {
        category: 'تدخين',
        items: [
            { code: '🚬', name: 'سيجارة' },
            { code: '💨', name: 'دخان' },
            { code: 'https://media.giphy.com/media/3o6Zta1Cn4fn4fG4k0/giphy.gif', name: 'تدخين متحرك', type: 'gif' }
        ]
    },
    {
        category: 'قراءة',
        items: [
            { code: '📖', name: 'كتاب مفتوح' },
            { code: '📚', name: 'كتب' },
            { code: 'https://media.giphy.com/media/26uf2YTg7qD66L8y4/giphy.gif', name: 'قراءة متحركة', type: 'gif' }
        ]
    },
    {
        category: 'أخرى',
        items: [
            { code: '😎', name: 'كوول' },
            { code: '😍', name: 'حب' },
            { code: '🚀', name: 'صاروخ' },
            { code: '🎉', name: 'احتفال' },
            { code: 'https://media.giphy.com/media/3o7btPCcdNniyf0ArS/giphy.gif', name: 'احتفال متحرك', type: 'gif' },
            { code: 'https://media.giphy.com/media/l0Iyl55kTeh71nTWw/giphy.gif', name: 'رقص متحرك', type: 'gif' }
        ]
    },
    {
        category: 'عامة',
        items: [
            { code: '😂', name: 'laugh' },
            { code: '😍', name: 'heart-eyes' },
            { code: '😘', name: 'kiss' },
            { code: '😎', name: 'cool' },
            { code: '😭', name: 'sob' },
            { code: '😡', name: 'angry' },
            { code: '😱', name: 'shocked' },
            { code: '😊', name: 'happy' },
            { code: '👍', name: 'thumbs-up' },
            { code: '👎', name: 'thumbs-down' },
            { code: '❤️', name: 'heart' },
            { code: '🔥', name: 'fire' },
            { code: '✨', name: 'sparkles' },
            { code: '🎉', name: 'party' },
            { code: '💜', name: 'purple-heart' },
            { code: '🌹', name: 'rose' },
            { code: '💫', name: 'dizzy' },
            { code: '🌈', name: 'rainbow' },
            { code: '🎆', name: 'fireworks' },
            { code: '💎', name: 'gem' },
            { code: '😀', name: 'grin' },
            { code: '😃', name: 'smiley' },
            { code: '😄', name: 'smile' },
            { code: '😅', name: 'sweat-smile' },
            { code: '😆', name: 'laughing' },
            { code: '😉', name: 'wink' },
            { code: '😋', name: 'yum' },
            { code: '😌', name: 'relieved' },
            { code: '😔', name: 'pensive' },
            { code: '😕', name: 'confused' },
            { code: '😖', name: 'confounded' },
            { code: '😗', name: 'kissing' },
            { code: '😙', name: 'kissing-smiling-eyes' },
            { code: '😚', name: 'kissing-closed-eyes' },
            { code: '😛', name: 'stuck-out-tongue' },
            { code: '😜', name: 'stuck-out-tongue-winking-eye' },
            { code: '😝', name: 'stuck-out-tongue-closed-eyes' },
            { code: '😞', name: 'disappointed' },
            { code: '😟', name: 'worried' },
            { code: '😠', name: 'angry' },
            { code: '😢', name: 'cry' },
            { code: '😣', name: 'persevere' },
            { code: '😤', name: 'triumph' },
            { code: '😥', name: 'disappointed-relieved' },
            { code: '😦', name: 'frowning' },
            { code: '😧', name: 'anguished' },
            { code: '😨', name: 'fearful' },
            { code: '😩', name: 'weary' },
            { code: '😪', name: 'sleepy' },
            { code: '😫', name: 'tired-face' },
            { code: '😬', name: 'grimacing' },
            { code: '😮', name: 'open-mouth' },
            { code: '😯', name: 'hushed' },
            { code: '😰', name: 'cold-sweat' },
            { code: '😱', name: 'scream' },
            { code: '😲', name: 'astonished' },
            { code: '😳', name: 'flushed' },
            { code: '😴', name: 'sleeping' },
            { code: '😵', name: 'dizzy-face' },
            { code: '😷', name: 'mask' },
            { code: '😸', name: 'smile-cat' },
            { code: '😹', name: 'joy-cat' },
            { code: '😺', name: 'smiley-cat' },
            { code: '😻', name: 'heart-eyes-cat' },
            { code: '😼', name: 'kissing-cat' },
            { code: '😽', name: 'smirk-cat' },
            { code: '😾', name: 'weary-cat' },
            { code: '😿', name: 'crying-cat-face' },
            { code: '🙀', name: 'scream-cat' },
            { code: '🙁', name: 'slightly-frowning-face' },
            { code: '🙂', name: 'slightly-smiling-face' },
            { code: '🙃', name: 'upside-down-face' },
            { code: '🙄', name: 'face-with-rolling-eyes' },
            { code: '🤐', name: 'zipper-mouth-face' },
            { code: '🤑', name: 'money-mouth-face' },
            { code: '🤒', name: 'face-with-thermometer' },
            { code: '🤓', name: 'nerd-face' },
            { code: '🤔', name: 'thinking-face' },
            { code: '🤕', name: 'face-with-head-bandage' },
            { code: '🤖', name: 'robot-face' },
            { code: '🤗', name: 'hugging-face' },
            { code: '🤘', name: 'sign-of-the-horns' },
            { code: '🤙', name: 'call-me-hand' },
            { code: '🤚', name: 'raised-back-of-hand' },
            { code: '🤛', name: 'left-facing-fist' },
            { code: '🤜', name: 'right-facing-fist' },
            { code: '🤝', name: 'handshake' },
            { code: '🤞', name: 'crossed-fingers' },
            { code: '🤟', name: 'love-you-gesture' },
            { code: '🤠', name: 'face-with-cowboy-hat' },
            { code: '🤡', name: 'clown-face' },
            { code: '🤢', name: 'nauseated-face' },
            { code: '🤣', name: 'rolling-on-the-floor-laughing' },
            { code: '🤤', name: 'drooling-face' },
            { code: '🤥', name: 'lying-face' },
            { code: '🤦', name: 'face-palm' },
            { code: '🤧', name: 'sneezing-face' },
            { code: '🤨', name: 'face-with-raised-eyebrow' },
            { code: '🤩', name: 'star-struck' },
            { code: '🤪', name: 'zany-face' },
            { code: '🤫', name: 'shushing-face' },
            { code: '🤬', name: 'face-with-symbols-on-mouth' },
            { code: '🤭', name: 'face-with-hand-over-mouth' },
            { code: '🤮', name: 'face-vomiting' },
            { code: '🤯', name: 'exploding-head' },
            { code: '🥰', name: 'smiling-face-with-hearts' },
            { code: '🥱', name: 'yawning-face' },
            { code: '🥲', name: 'smiling-face-with-tear' },
            { code: '🥳', name: 'partying-face' },
            { code: '🥴', name: 'woozy-face' },
            { code: '🥵', name: 'hot-face' },
            { code: '🥶', name: 'cold-face' },
            { code: '🥷', name: 'ninja' },
            { code: '🥸', name: 'disguised-face' },
            { code: '🥺', name: 'pleading-face' },
            { code: '🥼', name: 'lab-coat' },
            { code: '🥽', name: 'goggles' },
            { code: '🥾', name: 'hiking-boot' },
            { code: '🥿', name: 'flat-shoe' },
            { code: '🦀', name: 'crab' },
            { code: '🦁', name: 'lion-face' },
            { code: '🦂', name: 'scorpion' },
            { code: '🦃', name: 'turkey' },
            { code: '🦄', name: 'unicorn-face' },
            { code: '🦅', name: 'eagle' },
            { code: '🦆', name: 'duck' },
            { code: '🦇', name: 'bat' },
            { code: '🦈', name: 'shark' },
            { code: '🦉', name: 'owl' },
            { code: '🦊', name: 'fox-face' },
            { code: '🦋', name: 'butterfly' },
            { code: '🦌', name: 'deer' },
            { code: '🦍', name: 'gorilla' },
            { code: '🦎', name: 'lizard' },
            { code: '🦏', name: 'rhinoceros' },
            { code: '🦐', name: 'shrimp' },
            { code: '🦑', name: 'squid' },
            { code: '🦒', name: 'giraffe-face' },
            { code: '🦓', name: 'zebra-face' },
            { code: '🦔', name: 'hedgehog' },
            { code: '🦕', name: 'sauropod' },
            { code: '🦖', name: 't-rex' },
            { code: '🦗', name: 'cricket' },
            { code: '🦘', name: 'kangaroo' },
            { code: '🦙', name: 'llama' },
            { code: '🦚', name: 'peacock' },
            { code: '🦛', name: 'hippopotamus' },
            { code: '🦜', name: 'parrot' },
            { code: '🦝', name: 'raccoon' },
            { code: '🦞', name: 'lobster' },
            { code: '🦟', name: 'mosquito' },
            { code: '🦠', name: 'microbe' },
            { code: '🦡', name: 'badger' },
            { code: '🦢', name: 'swan' },
            { code: '🦥', name: 'sloth' },
            { code: '🦦', name: 'otter' },
            { code: '🦧', name: 'orangutan' },
            { code: '🦨', name: 'skunk' },
            { code: '🦩', name: 'flamingo' },
            { code: '🦪', name: 'oyster' },
            { code: '🦫', name: 'beaver' },
            { code: '🦬', name: 'bison' },
            { code: '🦭', name: 'seal' },
            { code: '🦮', name: 'guide-dog' },
            { code: '🦯', name: 'probing-cane' },
            { code: '🦰', name: 'red-haired' },
            { code: '🦱', name: 'curly-haired' },
            { code: '🦲', name: 'bald' },
            { code: '🦳', name: 'white-haired' },
            { code: '🦴', name: 'bone' },
            { code: '🦵', name: 'leg' },
            { code: '🦶', name: 'foot' },
            { code: '🦷', name: 'tooth' },
            { code: '🦸', name: 'superhero' },
            { code: '🦹', name: 'supervillain' },
            { code: '🦺', name: 'safety-vest' },
            { code: '🦻', name: 'ear-with-hearing-aid' },
            { code: '🦼', name: 'motorized-wheelchair' },
            { code: '🦽', name: 'manual-wheelchair' },
            { code: '🦾', name: 'mechanical-arm' },
            { code: '🦿', name: 'mechanical-leg' },
            { code: '🧀', name: 'cheese-wedge' },
            { code: '🧁', name: 'cupcake' },
            { code: '🧂', name: 'salt' },
            { code: '🧃', name: 'beverage-box' },
            { code: '🧄', name: 'garlic' },
            { code: '🧅', name: 'onion' },
            { code: '🧆', name: 'falafel' },
            { code: '🧇', name: 'waffle' },
            { code: '🧈', name: 'butter' },
            { code: '🧉', name: 'mate-drink' },
            { code: '🧊', name: 'ice-cube' },
            { code: '🧋', name: 'bubble-tea' },
            { code: '🧌', name: 'troll' },
            { code: '🧍', name: 'person-standing' },
            { code: '🧎', name: 'person-kneeling' },
            { code: '🧏', name: 'deaf-person' },
            { code: '🧐', name: 'face-with-monocle' },
            { code: '🧑', name: 'adult' },
            { code: '🧒', name: 'child' },
            { code: '🧓', name: 'older-adult' },
            { code: '🧔', name: 'bearded-person' },
            { code: '🧕', name: 'person-with-headscarf' },
            { code: '🧖', name: 'person-in-steamy-room' },
            { code: '🧗', name: 'person-climbing' },
            { code: '🧘', name: 'person-in-lotus-position' },
            { code: '🧙', name: 'mage' },
            { code: '🧚', name: 'fairy' },
            { code: '🧛', name: 'vampire' },
            { code: '🧜', name: 'merperson' },
            { code: '🧝', name: 'elf' },
            { code: '🧞', name: 'genie' },
            { code: '🧟', name: 'zombie' },
            { code: '🧠', name: 'brain' },
            { code: '🧡', name: 'orange-heart' },
            { code: '🧢', name: 'billed-cap' },
            { code: '🧣', name: 'scarf' },
            { code: '🧤', name: 'gloves' },
            { code: '🧥', name: 'coat' },
            { code: '🧦', name: 'socks' },
            { code: '🧧', name: 'red-envelope' },
            { code: '🧨', name: 'firecracker' },
            { code: '🧩', name: 'jigsaw' },
            { code: '🧪', name: 'test-tube' },
            { code: '🧫', name: 'petri-dish' },
            { code: '🧬', name: 'dna' },
            { code: '🧭', name: 'compass' },
            { code: '🧮', name: 'abacus' },
            { code: '🧯', name: 'fire-extinguisher' },
            { code: '🧰', name: 'toolbox' },
            { code: '🧱', name: 'brick' },
            { code: '🧲', name: 'magnet' },
            { code: '🧳', name: 'luggage' },
            { code: '🧴', name: 'lotion-bottle' },
            { code: '🧵', name: 'thread' },
            { code: '🧶', name: 'yarn' },
            { code: '🧷', name: 'safety-pin' },
            { code: '🧸', name: 'teddy-bear' },
            { code: '🧹', name: 'broom' },
            { code: '🧺', name: 'basket' },
            { code: '🧻', name: 'roll-of-paper' },
            { code: '🧼', name: 'soap' },
            { code: '🧽', name: 'sponge' },
            { code: '🧾', name: 'receipt' },
            { code: '🧿', name: 'nazar-amulet' }
        ]
    }
];

// الأصوات
const sounds = {
    message: new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTuR2O/JdSYELIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTuR2O/JdSYELIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTuR2O/JdSYE'),
    notification: new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTuR2O/JdSYELIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTuR2O/JdSYELIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTuR2O/JdSYE')
};

// إعدادات الأصوات
let soundSettings = {
    messageSound: true,
    notificationSound: true,
    voiceMessageSound: true
};

// تحميل إعدادات الأصوات من localStorage
function loadSoundSettings() {
    const saved = localStorage.getItem('soundSettings');
    if (saved) {
        soundSettings = { ...soundSettings, ...JSON.parse(saved) };
    }
}

// حفظ إعدادات الأصوات
function saveSoundSettings() {
    localStorage.setItem('soundSettings', JSON.stringify(soundSettings));
}

// تشغيل الصوت
function playSound(type) {
    if (soundSettings[type + 'Sound'] && sounds[type]) {
        sounds[type].play().catch(e => console.log('خطأ في تشغيل الصوت:', e));
    }
}

// التحقق من تسجيل الدخول
function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        showScreen('loginScreen');
        return false;
    }

    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        currentUser = payload;
        return true;
    } catch (e) {
        localStorage.removeItem('token');
        showScreen('loginScreen');
        return false;
    }
}

// عرض الشاشة
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

// تبديل التبويبات
function showTab(tabName) {
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.form').forEach(form => form.classList.remove('active'));

    event.target.classList.add('active');
    document.getElementById(tabName + 'Form').classList.add('active');
}

// تسجيل الدخول
document.getElementById('loginForm').addEventListener('submit', async (e) => {
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
            document.getElementById('loginError').textContent = data.error;
        }
    } catch (error) {
        document.getElementById('loginError').textContent = 'خطأ في الاتصال';
    }
});

// تسجيل حساب جديد
document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const displayName = document.getElementById('registerDisplayName').value;

    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, display_name: displayName })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('token', data.token);
            currentUser = data.user;
            initializeChat();
        } else {
            document.getElementById('loginError').textContent = data.error;
        }
    } catch (error) {
        document.getElementById('loginError').textContent = 'خطأ في الاتصال';
    }
});

// دالة debounce للحد من تكرار إرسال الأحداث
function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// عرض مؤشر الكتابة
function showTypingIndicator(displayName, isPrivate = false) {
    const indicator = isPrivate
        ? document.getElementById('privateTypingIndicator')
        : document.getElementById('typingIndicator');
    if (indicator) {
        indicator.textContent = `${displayName} يكتب...`;
        indicator.classList.add('active');
    }
}

// إخفاء مؤشر الكتابة
function hideTypingIndicator(isPrivate = false) {
    const indicator = isPrivate
        ? document.getElementById('privateTypingIndicator')
        : document.getElementById('typingIndicator');
    if (indicator) {
        indicator.textContent = '';
        indicator.classList.remove('active');
    }
}

// تهيئة الشات
async function initializeChat() {
    showScreen('chatScreen');
    loadSoundSettings();

    document.getElementById('userDisplayName').textContent = currentUser.display_name;
    document.getElementById('userRank').textContent = getRankDisplay(currentUser.rank);

    if (currentUser.profile_image1) {
        document.getElementById('userAvatar').src = currentUser.profile_image1;
    }

    if (currentUser.role === 'admin') {
        document.getElementById('adminBtn').style.display = 'inline-block';
        document.getElementById('createRoomBtn').style.display = 'block';
    }

    socket = io();

    socket.emit('join', {
        userId: currentUser.id,
        displayName: currentUser.display_name,
        rank: currentUser.rank,
        email: currentUser.email,
        roomId: currentRoom
    });

    socket.on('newMessage', (message) => {
        displayMessage(message, false);
        if (message.user_id !== currentUser.id) {
            playSound('message');
            updateNotificationCount(getUnreadMessagesCount());
        }
    });

    socket.on('newPrivateMessage', (message) => {
        displayPrivateMessage(message);
        if (message.user_id !== currentUser.id) {
            playSound('notification');
            updateNotificationCount(getUnreadMessagesCount());
        }
    });

    socket.on('roomUsersList', (users) => {
        displayRoomUsers(users);
    });

    socket.on('roomChanged', (roomId) => {
        currentRoom = roomId;
        loadRoomMessages(roomId);
    });

    socket.on('roomDeleted', (roomId) => {
        if (currentRoom === roomId) {
            currentRoom = 1;
            socket.emit('changeRoom', 1);
        }
        loadRooms();
    });

    // مؤشرات الكتابة للدردشة العامة
    socket.on('typing', ({ userId, displayName, roomId }) => {
        if (roomId === currentRoom && userId !== currentUser.id) {
            showTypingIndicator(displayName, false);
        }
    });

    socket.on('stopTyping', ({ userId, roomId }) => {
        if (roomId === currentRoom && userId !== currentUser.id) {
            hideTypingIndicator(false);
        }
    });

    // مؤشرات الكتابة للدردشة الخاصة
    socket.on('privateTyping', ({ userId, displayName, receiverId }) => {
        if (
            document.getElementById('privateChatModal').classList.contains('active') &&
            (userId === parseInt(document.getElementById('privateChatModal').dataset.userId) ||
             receiverId === currentUser.id)
        ) {
            showTypingIndicator(displayName, true);
        }
    });

    socket.on('privateStopTyping', ({ userId, receiverId }) => {
        if (
            document.getElementById('privateChatModal').classList.contains('active') &&
            (userId === parseInt(document.getElementById('privateChatModal').dataset.userId) ||
             receiverId === currentUser.id)
        ) {
            hideTypingIndicator(true);
        }
    });

    await loadRooms();
    await loadRoomMessages(currentRoom);
    await loadAllUsers();

    // إضافة حدث الكتابة للدردشة العامة
    const emitTyping = debounce(() => {
        if (!isTyping) {
            socket.emit('typing', {
                userId: currentUser.id,
                displayName: currentUser.display_name,
                roomId: currentRoom
            });
            isTyping = true;
        }
        clearTimeout(window.typingTimeout);
        window.typingTimeout = setTimeout(() => {
            socket.emit('stopTyping', { userId: currentUser.id, roomId: currentRoom });
            isTyping = false;
        }, 3000);
    }, 500);

    document.getElementById('messageInput').addEventListener('input', emitTyping);

    // إضافة حدث الكتابة للدردشة الخاصة
    const emitPrivateTyping = debounce(() => {
        const receiverId = parseInt(document.getElementById('privateChatModal').dataset.userId);
        if (!isPrivateTyping && receiverId) {
            socket.emit('privateTyping', {
                userId: currentUser.id,
                displayName: currentUser.display_name,
                receiverId
            });
            isPrivateTyping = true;
        }
        clearTimeout(window.privateTypingTimeout);
        window.privateTypingTimeout = setTimeout(() => {
            socket.emit('privateStopTyping', { userId: currentUser.id, receiverId });
            isPrivateTyping = false;
        }, 3000);
    }, 500);

    document.getElementById('privateMessageInput').addEventListener('input', emitPrivateTyping);
}

// تحميل الغرف
async function loadRooms() {
    try {
        const response = await fetch('/api/rooms', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });

        const rooms = await response.json();
        const roomsList = document.getElementById('roomsList');

        roomsList.innerHTML = rooms.map(room => `
            <div class="room-item ${room.id === currentRoom ? 'active' : ''}" onclick="changeRoom(${room.id})">
                <div class="room-item-icon">${room.name.charAt(0)}</div>
                <div class="room-item-info">
                    <div class="room-item-name">${room.name}</div>
                    <div class="room-item-desc">${room.description || ''}</div>
                </div>
                ${currentUser.role === 'admin' && room.id !== 1 ? `<button onclick="deleteRoom(${room.id})" class="btn" style="background: #e74c3c; color: white; padding: 5px 10px; font-size: 12px;">حذف</button>` : ''}
            </div>
        `).join('');
    } catch (error) {
        console.error('خطأ في تحميل الغرف:', error);
    }
}

// تغيير الغرفة
function changeRoom(roomId) {
    if (roomId === currentRoom) return;

    currentRoom = roomId;
    socket.emit('changeRoom', roomId);

    document.querySelectorAll('.room-item').forEach(item => {
        item.classList.remove('active');
    });
    event.target.closest('.room-item').classList.add('active');

    const roomName = event.target.closest('.room-item').querySelector('.room-item-name').textContent;
    document.getElementById('currentRoomName').textContent = roomName;

    loadRoomMessages(roomId);
}

// تحميل رسائل الغرفة
async function loadRoomMessages(roomId) {
    try {
        const response = await fetch(`/api/messages/${roomId}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });

        const messages = await response.json();
        const container = document.getElementById('messagesContainer');
        container.innerHTML = '';

        messages.forEach(message => displayMessage(message, false));
        container.scrollTop = container.scrollHeight;
    } catch (error) {
        console.error('خطأ في تحميل الرسائل:', error);
    }
}

// عرض الرسالة - تحسين معالجة الإيموجيات
function displayMessage(message, isPrivate = false) {
    const container = isPrivate ? 
        document.getElementById('privateChatMessages') : 
        document.getElementById('messagesContainer');

    const messageDiv = document.createElement('div');
    const isOwn = message.user_id === currentUser.id;
    messageDiv.className = `message ${isOwn ? 'own' : 'other'}`;
    if (message.display_name && message.display_name.startsWith('!')) {
        messageDiv.classList.add('message-highlight');
    }
    messageDiv.dataset.messageId = message.id;

    if (message.message_background) {
        messageDiv.style.backgroundImage = `url(${message.message_background})`;
        messageDiv.classList.add('has-background');
    }

    let messageContent = '';

    if (message.voice_url) {
        messageContent = `
            <div class="message-header">
                <img src="${message.profile_image1 || getDefaultAvatar()}" alt="صورة شخصية" class="message-avatar clickable-avatar" onclick="showUserProfile(${message.user_id})">
                <span class="message-author clickable-name" onclick="mentionUser('${message.display_name}')">${message.display_name}</span>
                <span class="message-rank">${getRankDisplay(message.rank)}</span>
                <span class="message-time">${formatTime(message.timestamp)}</span>
                <div class="message-actions">
                    <button class="quote-btn" onclick="quoteMessage(${message.id}, '${message.display_name}', 'رسالة صوتية')" title="اقتباس">💬</button>
                    ${message.user_id === currentUser.id || currentUser.role === 'admin' ? `<button class="quote-btn" onclick="deleteMessage(${message.id}, ${isPrivate})" title="حذف">🗑️</button>` : ''}
                </div>
            </div>
            <div class="message-content">
                <div class="voice-message">
                    🎤 رسالة صوتية
                    <audio controls>
                        <source src="${message.voice_url}" type="audio/webm">
                        متصفحك لا يدعم تشغيل الصوت
                    </audio>
                </div>
            </div>
        `;
    }
    else if (message.image_url) {
        messageContent = `
            <div class="message-header">
                <img src="${message.profile_image1 || getDefaultAvatar()}" alt="صورة شخصية" class="message-avatar clickable-avatar" onclick="showUserProfile(${message.user_id})">
                <span class="message-author clickable-name" onclick="mentionUser('${message.display_name}')">${message.display_name}</span>
                <span class="message-rank">${getRankDisplay(message.rank)}</span>
                <span class="message-time">${formatTime(message.timestamp)}</span>
                <div class="message-actions">
                    <button class="quote-btn" onclick="quoteMessage(${message.id}, '${message.display_name}', 'صورة')" title="اقتباس">💬</button>
                    ${message.user_id === currentUser.id || currentUser.role === 'admin' ? `<button class="quote-btn" onclick="deleteMessage(${message.id}, ${isPrivate})" title="حذف">🗑️</button>` : ''}
                </div>
            </div>
            <div class="message-content">
                <img src="${message.image_url}" alt="صورة" class="message-image" onclick="openImageModal('${message.image_url}')">
            </div>
        `;
    }
    else {
        let processedMessage = message.message;

        if (message.quoted_message_id) {
            processedMessage = `
                <div class="quoted-message">
                    <div class="quote-author">${message.quoted_author}</div>
                    <div class="quote-content">${message.quoted_content}</div>
                </div>
                ${processedMessage}
            `;
        }

        processedMessage = processedMessage.replace(/```([\s\S]*?)```/g, '<pre class="code-block"><code>$1</code></pre>');
        processedMessage = processedMessage.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

        processedMessage = processedMessage.replace(/@(\w+)/g, '<span data-mention="$1">@$1</span>');

        EMOJIS.forEach(category => {
            category.items.forEach(emoji => {
                if (emoji.type === 'gif') {
                    const regex = new RegExp(escapeRegExp(emoji.code), 'g');
                    processedMessage = processedMessage.replace(regex, `<img src="${emoji.code}" alt="${emoji.name}" class="emoji-gif" loading="lazy">`);
                } else {
                    const regex = new RegExp(escapeRegExp(emoji.code), 'g');
                    processedMessage = processedMessage.replace(regex, `<span class="emoji">${emoji.code}</span>`);
                }
            });
        });

        messageContent = `
            <div class="message-header">
                <img src="${message.profile_image1 || getDefaultAvatar()}" alt="صورة شخصية" class="message-avatar clickable-avatar" onclick="showUserProfile(${message.user_id})">
                <span class="message-author clickable-name" onclick="mentionUser('${message.display_name}')">${message.display_name}</span>
                <span class="message-rank">${getRankDisplay(message.rank)}</span>
                <span class="message-time">${formatTime(message.timestamp)}</span>
                <div class="message-actions">
                    <button class="quote-btn" onclick="quoteMessage(${message.id}, '${message.display_name}', '${message.message.substring(0, 50)}...')" title="اقتباس">💬</button>
                    ${message.user_id === currentUser.id || currentUser.role === 'admin' ? `<button class="quote-btn" onclick="deleteMessage(${message.id}, ${isPrivate})" title="حذف">🗑️</button>` : ''}
                </div>
            </div>
            <div class="message-content">${processedMessage}</div>
        `;
    }

    messageDiv.innerHTML = messageContent;
    container.appendChild(messageDiv);
    container.scrollTop = container.scrollHeight;
}

// دالة للهروب من الأحرف الخاصة في التعبيرات العادية
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// حذف رسالة
async function deleteMessage(messageId, isPrivate = false) {
    if (!confirm('هل أنت متأكد من حذف هذه الرسالة؟')) return;

    try {
        const response = await fetch(`/api/messages/${messageId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });

        if (response.ok) {
            const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
            if (messageElement) {
                messageElement.remove();
            }

            if (isPrivate) {
                socket.emit('deletePrivateMessage', { messageId });
            } else {
                socket.emit('deleteMessage', { messageId, roomId: currentRoom });
            }
        }
    } catch (error) {
        console.error('خطأ في حذف الرسالة:', error);
        alert('حدث خطأ في حذف الرسالة');
    }
}

// اقتباس رسالة
function quoteMessage(messageId, author, content) {
    quotedMessage = { id: messageId, author, content };

    const quotePreview = document.createElement('div');
    quotePreview.className = 'quote-preview';
    quotePreview.innerHTML = `
        <div class="quote-preview-header">
            اقتباس من ${author}
            <button class="clear-quote-btn" onclick="clearQuote()">×</button>
        </div>
        <div class="quote-preview-text">${content}</div>
    `;

    const inputArea = document.querySelector('.message-input-area');
    const existingQuote = inputArea.querySelector('.quote-preview');
    if (existingQuote) {
        existingQuote.remove();
    }

    inputArea.insertBefore(quotePreview, inputArea.firstChild);
    document.getElementById('messageInput').focus();
}

// مسح الاقتباس
function clearQuote() {
    quotedMessage = null;
    const quotePreview = document.querySelector('.quote-preview');
    if (quotePreview) {
        quotePreview.remove();
    }
}

// إشارة لمستخدم
function mentionUser(username) {
    const input = document.getElementById('messageInput');
    const currentValue = input.value;
    const mention = `@${username} `;

    if (!currentValue.includes(mention)) {
        input.value = currentValue + mention;
        input.focus();
    }
}

// فتح مودال الإيموجيات
function openEmojiPicker() {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.id = 'emojiPickerModal';
    modal.innerHTML = `
        <div class="modal-content emoji-modal">
            <span class="close" onclick="closeEmojiPicker()">&times;</span>
            <h2>اختر إيموجي</h2>
            <div class="emoji-picker">
                ${EMOJIS.map(category => `
                    <div class="emoji-category">
                        <h3>${category.category}</h3>
                        <div class="emoji-list">
                            ${category.items.map(emoji => `
                                <span class="emoji-item" title="${emoji.name}" onclick="insertEmoji('${emoji.code}', '${emoji.type || 'text'}')">
                                    ${emoji.type === 'gif' ? `<img src="${emoji.code}" alt="${emoji.name}" class="emoji-gif" loading="lazy">` : emoji.code}
                                </span>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// إغلاق مودال الإيموجيات
function closeEmojiPicker() {
    const modal = document.getElementById('emojiPickerModal');
    if (modal) modal.remove();
}

// إدراج إيموجي في حقل الإدخال
function insertEmoji(code, type) {
    const input = document.getElementById('messageInput');
    const cursorPos = input.selectionStart;
    const textBefore = input.value.substring(0, cursorPos);
    const textAfter = input.value.substring(cursorPos);
    input.value = textBefore + (type === 'gif' ? `[GIF:${code}]` : code + ' ') + textAfter;
    input.focus();
    input.selectionStart = input.selectionEnd = cursorPos + (type === 'gif' ? `[GIF:${code}]`.length : code.length + 1);
    closeEmojiPicker();
}

// إرسال رسالة
function sendMessage() {
    const input = document.getElementById('messageInput');
    let message = input.value.trim();

    if (!message) return;

    // تحويل الـ [GIF:url] إلى صورة عند الإرسال
    message = message.replace(/\[GIF:([^\]]+)\]/g, '<img src="$1" alt="GIF" class="emoji-gif" loading="lazy">');

    const messageData = {
        message,
        roomId: currentRoom
    };

    if (quotedMessage) {
        messageData.quoted_message_id = quotedMessage.id;
        messageData.quoted_author = quotedMessage.author;
        messageData.quoted_content = quotedMessage.content;
    }

    socket.emit('sendMessage', messageData);
    input.value = '';
    clearQuote();
}

// إرسال رسالة خاصة
function sendPrivateMessage() {
    const input = document.getElementById('privateMessageInput');
    const message = input.value.trim();
    const receiverId = parseInt(document.getElementById('privateChatModal').dataset.userId);

    if (!message || !receiverId) return;

    const messageData = {
        message,
        receiverId
    };

    socket.emit('sendPrivateMessage', messageData);
    input.value = '';
}

// بدء تسجيل الصوت
async function startVoiceRecording(isPrivate = false) {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];

        mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
        };

        mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            sendVoiceMessage(audioBlob, isPrivate);
            stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        isRecording = true;

        const recordBtn = isPrivate ? 
            document.getElementById('privateRecordBtn') : 
            document.getElementById('recordBtn');

        recordBtn.textContent = '⏹️ إيقاف التسجيل';
        recordBtn.onclick = () => stopVoiceRecording(isPrivate);

    } catch (error) {
        console.error('خطأ في بدء التسجيل:', error);
        alert('لا يمكن الوصول للميكروفون');
    }
}

// إيقاف تسجيل الصوت
function stopVoiceRecording(isPrivate = false) {
    if (mediaRecorder && isRecording) {
        mediaRecorder.stop();
        isRecording = false;

        const recordBtn = isPrivate ? 
            document.getElementById('privateRecordBtn') : 
            document.getElementById('recordBtn');

        recordBtn.textContent = '🎤 تسجيل صوتي';
        recordBtn.onclick = () => startVoiceRecording(isPrivate);
    }
}

// إرسال رسالة صوتية
async function sendVoiceMessage(audioBlob, isPrivate = false) {
    const formData = new FormData();
    formData.append('voice', audioBlob, 'voice-message.webm');

    if (isPrivate) {
        const receiverId = parseInt(document.getElementById('privateChatModal').dataset.userId);
        formData.append('receiverId', receiverId);
    } else {
        formData.append('roomId', currentRoom);
    }

    try {
        const response = await fetch('/api/upload-voice', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
            body: formData
        });

        const data = await response.json();

        if (response.ok) {
            const messageData = {
                voice_url: data.voice_url,
                roomId: currentRoom
            };

            if (isPrivate) {
                messageData.receiverId = parseInt(document.getElementById('privateChatModal').dataset.userId);
                socket.emit('sendPrivateVoice', messageData);
            } else {
                socket.emit('sendVoice', messageData);
            }
        }
    } catch (error) {
        console.error('خطأ في إرسال الرسالة الصوتية:', error);
        alert('حدث خطأ في إرسال الرسالة الصوتية');
    }
}

// عرض المستخدمين في الغرفة
function displayRoomUsers(users) {
    const usersList = document.getElementById('usersList');
    usersList.innerHTML = users.map(user => {
        const rankDisplay = getRankDisplay(user.rank);
        const hasStar = RANKS[user.rank] && RANKS[user.rank].level >= 5 ? '<span class="star-icon">★</span>' : '';
        const flag = user.country ? `<img class="flag-icon" src="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='12' viewBox='0 0 16 12'><rect width='16' height='6' fill='${getFlagColor(user.country)}'/><rect y='6' width='16' height='6' fill='${getFlagColor(user.country + '2')}'/></svg>" alt="flag">` : '';
        return `
            <li class="user-item" onclick="openPrivateChat(${user.userId}, '${user.displayName}')">
                <img src="${user.profile_image1 || getDefaultAvatar()}" alt="avatar">
                <div class="user-item-info">
                    <span class="user-item-name">${user.displayName}${hasStar}</span>
                    <span class="user-item-rank">${rankDisplay}${flag}</span>
                </div>
            </li>
        `;
    }).join('');
}

// دالة مساعدة للألوان الافتراضية للأعلام
function getFlagColor(country) {
    const colors = { 'YE': '#ff0000', 'SA': '#00ff00', 'default': '#0000ff' };
    return colors[color] || colors.default;
}

// تحميل جميع المستخدمين
async function loadAllUsers() {
    try {
        const response = await fetch('/api/all-users-chat', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });

        const users = await response.json();
        window.allUsers = users;
    } catch (error) {
        console.error('خطأ في تحميل المستخدمين:', error);
    }
}

// فتح الدردشة الخاصة
async function openPrivateChat(userId, userName) {
    document.getElementById('privateChatUserName').textContent = userName;
    document.getElementById('privateChatModal').dataset.userId = userId;
    document.getElementById('privateChatModal').classList.add('active');

    try {
        const response = await fetch(`/api/private-messages/${userId}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });

        const messages = await response.json();
        const container = document.getElementById('privateChatMessages');
        container.innerHTML = '';

        messages.forEach(message => displayMessage(message, true));
        container.scrollTop = container.scrollHeight;
    } catch (error) {
        console.error('خطأ في تحميل الرسائل الخاصة:', error);
    }
}

// إغلاق الدردشة الخاصة
function closePrivateChatModal() {
    document.getElementById('privateChatModal').classList.remove('active');
}

// عرض الرسالة الخاصة
function displayPrivateMessage(message) {
    if (document.getElementById('privateChatModal').classList.contains('active')) {
        const currentChatUserId = parseInt(document.getElementById('privateChatModal').dataset.userId);
        if (message.user_id === currentChatUserId || message.receiver_id === currentChatUserId) {
            displayMessage(message, true);
        }
    }
}

// فتح مودال جميع المستخدمين
function openAllUsersModal() {
    document.getElementById('allUsersModal').classList.add('active');
    displayAllUsers();
}

// إغلاق مودال جميع المستخدمين
function closeAllUsersModal() {
    document.getElementById('allUsersModal').classList.remove('active');
}

// عرض جميع المستخدمين
function displayAllUsers() {
    const container = document.getElementById('allUsersListModal');

    if (!window.allUsers) {
        container.innerHTML = '<div class="loading">جاري تحميل المستخدمين...</div>';
        loadAllUsers().then(() => displayAllUsers());
        return;
    }

    container.innerHTML = window.allUsers.map(user => {
        const rankDisplay = getRankDisplay(user.rank);
        const hasStar = RANKS[user.rank] && RANKS[user.rank].level >= 5 ? '<span class="star-icon">★</span>' : '';
        const flag = user.country ? `<img class="flag-icon" src="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='12' viewBox='0 0 16 12'><rect width='16' height='6' fill='${getFlagColor(user.country)}'/><rect y='6' width='16' height='6' fill='${getFlagColor(user.country + '2')}'/></svg>" alt="flag">` : '';
        return `
            <div class="user-chat-item">
                <div class="user-info">
                    <img src="${user.profile_image1 || getDefaultAvatar()}" alt="صورة شخصية" class="user-avatar">
                    <div class="user-details">
                        <div class="user-name">${user.display_name}${hasStar}</div>
                        <div class="user-rank">${rankDisplay}${flag}</div>
                        <div class="user-status ${user.is_online ? 'online' : 'offline'}">
                            ${user.is_online ? 'متصل' : 'غير متصل'}
                        </div>
                        ${user.age ? `<div class="user-age">العمر: ${user.age}</div>` : ''}
                        ${user.gender ? `<div class="user-gender">الجنس: ${user.gender}</div>` : ''}
                        ${user.marital_status ? `<div class="user-marital">الحالة: ${user.marital_status}</div>` : ''}
                    </div>
                </div>
                <div class="user-actions">
                    <button class="private-chat-btn" onclick="openPrivateChat(${user.id}, '${user.display_name}'); closeAllUsersModal();">دردشة خاصة</button>
                    <button class="view-profile-btn" onclick="showUserProfile(${user.id})">عرض الملف</button>
                </div>
            </div>
        `;
    }).join('');
}

// الحصول على الصورة الافتراضية
function getDefaultAvatar() {
    return "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'><circle cx='20' cy='20' r='20' fill='%23007bff'/><text x='20' y='25' text-anchor='middle' fill='white' font-size='16'>👤</text></svg>";
}

// الحصول على عرض الرتبة
function getRankDisplay(rank) {
    if (RANKS[rank]) {
        const star = RANKS[rank].level >= 5 ? ' ★' : '';
        return `${RANKS[rank].emoji}${star} ${RANKS[rank].name}`;
    }
    return '👋 Visitor';
}

// تنسيق الوقت
function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ar-SA', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
    });
}

// فتح مودال الملف الشخصي
function openProfileModal() {
    document.getElementById('profileModal').classList.add('active');
    loadUserProfile();
}

// إغلاق مودال الملف الشخصي
function closeProfileModal() {
    document.getElementById('profileModal').classList.remove('active');
}

// تحميل بيانات المستخدم
async function loadUserProfile() {
    try {
        const response = await fetch('/api/user/profile', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });

        const user = await response.json();

        if (user.profile_image1) {
            document.getElementById('profileImg1').src = user.profile_image1;
        }
        if (user.profile_image2) {
            document.getElementById('profileImg2').src = user.profile_image2;
        }

        document.getElementById('currentRank').textContent = getRankDisplay(user.rank);

        document.getElementById('newDisplayName').value = user.display_name;

    } catch (error) {
        console.error('خطأ في تحميل بيانات المستخدم:', error);
    }
}

// معاينة صورة البروفايل
function previewProfileImage(slot, input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById(`profileImg${slot}`).src = e.target.result;
        };
        reader.readAsDataURL(input.files[0]);
    }
}

// رفع صور البروفايل
async function uploadProfileImages() {
    const formData = new FormData();

    const file1 = document.getElementById('profileFile1').files[0];
    const file2 = document.getElementById('profileFile2').files[0];

    if (file1) formData.append('profile1', file1);
    if (file2) formData.append('profile2', file2);

    if (!file1 && !file2) {
        alert('يرجى اختيار صورة واحدة على الأقل');
        return;
    }

    try {
        const response = await fetch('/api/upload-profile-images', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
            body: formData
        });

        const data = await response.json();

        if (response.ok) {
            alert('تم حفظ الصور بنجاح');
            if (data.profile_image1) {
                document.getElementById('userAvatar').src = data.profile_image1;
            }
        } else {
            alert(data.error || 'حدث خطأ في رفع الصور');
        }
    } catch (error) {
        console.error('خطأ في رفع الصور:', error);
        alert('حدث خطأ في رفع الصور');
    }
}

// تحديث الاسم المعروض
async function updateDisplayName() {
    const newName = document.getElementById('newDisplayName').value.trim();

    if (!newName) {
        alert('يرجى إدخال اسم صحيح');
        return;
    }

    try {
        const response = await fetch('/api/user/display-name', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ display_name: newName })
        });

        const data = await response.json();

        if (response.ok) {
            alert('تم تحديث الاسم بنجاح');
            document.getElementById('userDisplayName').textContent = newName;
            currentUser.display_name = newName;
        } else {
            alert(data.error || 'حدث خطأ في تحديث الاسم');
        }
    } catch (error) {
        console.error('خطأ في تحديث الاسم:', error);
        alert('حدث خطأ في تحديث الاسم');
    }
}

// تحديث المعلومات الشخصية
async function updatePersonalInfo() {
    const age = document.getElementById('userAge').value;
    const gender = document.getElementById('userGender').value;
    const maritalStatus = document.getElementById('userMaritalStatus').value;
    const aboutMe = document.getElementById('userAboutMe').value;

    try {
        const response = await fetch('/api/user/personal-info', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                age: age || null,
                gender: gender || null,
                marital_status: maritalStatus || null,
                about_me: aboutMe || null
            })
        });

        const data = await response.json();

        if (response.ok) {
            alert('تم تحديث المعلومات بنجاح');
        } else {
            alert(data.error || 'حدث خطأ في تحديث المعلومات');
        }
    } catch (error) {
        console.error('خطأ في تحديث المعلومات:', error);
        alert('حدث خطأ في تحديث المعلومات');
    }
}

// فتح إعدادات الأصوات
function openSoundSettings() {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
            <h2>إعدادات الأصوات</h2>

            <div class="sound-settings">
                <div class="sound-setting">
                    <label>
                        <input type="checkbox" ${soundSettings.messageSound ? 'checked' : ''} onchange="updateSoundSetting('messageSound', this.checked)">
                        صوت الرسائل العامة
                    </label>
                    <button class="test-sound-btn" onclick="playSound('message')">تجربة</button>
                </div>

                <div class="sound-setting">
                    <label>
                        <input type="checkbox" ${soundSettings.notificationSound ? 'checked' : ''} onchange="updateSoundSetting('notificationSound', this.checked)">
                        صوت الرسائل الخاصة
                    </label>
                    <button class="test-sound-btn" onclick="playSound('notification')">تجربة</button>
                </div>

                <div class="sound-setting">
                    <label>
                        <input type="checkbox" ${soundSettings.voiceMessageSound ? 'checked' : ''} onchange="updateSoundSetting('voiceMessageSound', this.checked)">
                        صوت الرسائل الصوتية
                    </label>
                    <button class="test-sound-btn" onclick="playSound('notification')">تجربة</button>
                </div>
            </div>

            <div class="sound-actions">
                <button class="btn save-btn" onclick="this.closest('.modal').remove()">حفظ</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

// تحديث إعداد الصوت
function updateSoundSetting(setting, value) {
    soundSettings[setting] = value;
    saveSoundSettings();
}

// فتح لوحة الإدارة
function openAdminPanel() {
    if (currentUser.role !== 'admin') return;

    document.getElementById('adminModal').classList.add('active');
    loadAllUsersForAdmin();
    loadAvailableRanks();
}

// إغلاق لوحة الإدارة
function closeAdminPanel() {
    document.getElementById('adminModal').classList.remove('active');
}

// تحميل المستخدمين للإدارة
async function loadAllUsersForAdmin() {
    try {
        const response = await fetch('/api/all-users', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });

        const users = await response.json();
        const container = document.getElementById('allUsersList');

        container.innerHTML = users.map(user => `
            <div class="admin-user-item">
                <div class="admin-user-info">
                    <img src="${user.profile_image1 || getDefaultAvatar()}" alt="صورة شخصية" class="admin-user-avatar">
                    <div class="admin-user-details">
                        <h4>${user.display_name}</h4>
                        <p>${user.email} - ${getRankDisplay(user.rank)}</p>
                        <p>تاريخ التسجيل: ${new Date(user.created_at).toLocaleDateString('ar-SA')}</p>
                    </div>
                </div>
                <button class="assign-rank-btn" onclick="openAssignRankModal(${user.id}, '${user.display_name}')">
                    تعيين رتبة
                </button>
            </div>
        `).join('');
    } catch (error) {
        console.error('خطأ في تحميل المستخدمين:', error);
    }
}

// تحميل الرتب المتاحة
async function loadAvailableRanks() {
    try {
        const response = await fetch('/api/ranks', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });

        const ranks = await response.json();
        const container = document.getElementById('availableRanks');

        container.innerHTML = Object.entries(ranks).map(([key, rank]) => `
            <div class="rank-item">
                <span class="rank-emoji">${rank.emoji}</span>
                <div class="rank-name">${rank.name}</div>
                <div class="rank-level">المستوى: ${rank.level}</div>
            </div>
        `).join('');
    } catch (error) {
        console.error('خطأ في تحميل الرتب:', error);
    }
}

    // فتح مودال تعيين الرتبة
    async function openAssignRankModal(userId, userName) {
        document.getElementById('targetUserName').textContent = userName;
        document.getElementById('assignRankModal').dataset.userId = userId;
        document.getElementById('assignRankModal').classList.add('active');

        // تحميل الرتب المتاحة في قائمة الاختيار
        const rankSelect = document.getElementById('rankSelect');
        rankSelect.innerHTML = Object.entries(RANKS).map(([key, rank]) => `
            <option value="${key}">${rank.emoji} ${rank.name}</option>
        `).join('');

        // إعداد نموذج تعيين الرتبة
        document.getElementById('assignRankForm').onsubmit = async (e) => {
            e.preventDefault();
            const rank = rankSelect.value;

            try {
                const response = await fetch('/api/assign-rank', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({ userId, rank })
                });

                const data = await response.json();

                if (response.ok) {
                    alert(`تم تعيين رتبة ${RANKS[rank].name} للمستخدم ${userName}`);
                    closeAssignRankModal();
                    loadAllUsersForAdmin();
                    socket.emit('rankUpdated', { userId, rank });
                } else {
                    alert(data.error || 'حدث خطأ في تعيين الرتبة');
                }
            } catch (error) {
                console.error('خطأ في تعيين الرتبة:', error);
                alert('حدث خطأ في تعيين الرتبة');
            }
        };
    }

    // إغلاق مودال تعيين الرتبة
    function closeAssignRankModal() {
        document.getElementById('assignRankModal').classList.remove('active');
        document.getElementById('assignRankForm').onsubmit = null;
    }

    // إنشاء غرفة جديدة
    async function createRoom() {
        const roomName = document.getElementById('newRoomName').value.trim();
        const roomDescription = document.getElementById('newRoomDescription').value.trim();

        if (!roomName) {
            alert('يرجى إدخال اسم الغرفة');
            return;
        }

        try {
            const response = await fetch('/api/rooms', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ name: roomName, description: roomDescription })
            });

            const data = await response.json();

            if (response.ok) {
                alert('تم إنشاء الغرفة بنجاح');
                document.getElementById('newRoomName').value = '';
                document.getElementById('newRoomDescription').value = '';
                loadRooms();
                socket.emit('newRoom', data.room);
            } else {
                alert(data.error || 'حدث خطأ في إنشاء الغرفة');
            }
        } catch (error) {
            console.error('خطأ في إنشاء الغرفة:', error);
            alert('حدث خطأ في إنشاء الغرفة');
        }
    }

    // حذف غرفة
    async function deleteRoom(roomId) {
        if (!confirm('هل أنت متأكد من حذف هذه الغرفة؟')) return;

        try {
            const response = await fetch(`/api/rooms/${roomId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });

            if (response.ok) {
                alert('تم حذف الغرفة بنجاح');
                socket.emit('deleteRoom', roomId);
                loadRooms();
            } else {
                const data = await response.json();
                alert(data.error || 'حدث خطأ في حذف الغرفة');
            }
        } catch (error) {
            console.error('خطأ في حذف الغرفة:', error);
            alert('حدث خطأ في حذف الغرفة');
        }
    }

    // عرض ملف المستخدم
    async function showUserProfile(userId) {
        try {
            const response = await fetch(`/api/user/${userId}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });

            const user = await response.json();
            const modal = document.createElement('div');
            modal.className = 'modal active';
            modal.innerHTML = `
                <div class="modal-content">
                    <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
                    <h2>ملف المستخدم: ${user.display_name}</h2>
                    <div class="user-profile">
                        <img src="${user.profile_image1 || getDefaultAvatar()}" alt="صورة شخصية" class="profile-avatar">
                        <div class="profile-details">
                            <p><strong>الرتبة:</strong> ${getRankDisplay(user.rank)}</p>
                            ${user.age ? `<p><strong>العمر:</strong> ${user.age}</p>` : ''}
                            ${user.gender ? `<p><strong>الجنس:</strong> ${user.gender}</p>` : ''}
                            ${user.marital_status ? `<p><strong>الحالة الاجتماعية:</strong> ${user.marital_status}</p>` : ''}
                            ${user.about_me ? `<p><strong>عني:</strong> ${user.about_me}</p>` : ''}
                            <p><strong>تاريخ التسجيل:</strong> ${new Date(user.created_at).toLocaleDateString('ar-SA')}</p>
                        </div>
                        <div class="profile-actions">
                            <button class="btn" onclick="openPrivateChat(${user.id}, '${user.display_name}'); this.closest('.modal').remove()">دردشة خاصة</button>
                            ${currentUser.role === 'admin' ? `<button class="btn" onclick="openAssignRankModal(${user.id}, '${user.display_name}'); this.closest('.modal').remove()">تعيين رتبة</button>` : ''}
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        } catch (error) {
            console.error('خطأ في تحميل ملف المستخدم:', error);
            alert('حدث خطأ في تحميل ملف المستخدم');
        }
    }

    // فتح مودال رفع الصورة
    function openImageUploadModal() {
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
                <h2>رفع صورة</h2>
                <input type="file" id="imageUpload" accept="image/*">
                <img id="imagePreview" src="" alt="معاينة الصورة" style="display: none; max-width: 100%; margin-top: 10px;">
                <button class="btn" onclick="uploadImage()">رفع الصورة</button>
            </div>
        `;
        document.body.appendChild(modal);

        document.getElementById('imageUpload').addEventListener('change', function() {
            const file = this.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const preview = document.getElementById('imagePreview');
                    preview.src = e.target.result;
                    preview.style.display = 'block';
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // رفع الصورة
    async function uploadImage() {
        const fileInput = document.getElementById('imageUpload');
        if (!fileInput.files[0]) {
            alert('يرجى اختيار صورة');
            return;
        }

        const formData = new FormData();
        formData.append('image', fileInput.files[0]);
        formData.append('roomId', currentRoom);

        try {
            const response = await fetch('/api/upload-image', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                body: formData
            });

            const data = await response.json();
            if (response.ok) {
                socket.emit('sendImage', { image_url: data.image_url, roomId: currentRoom });
                document.querySelector('.modal.active').remove();
            } else {
                alert(data.error || 'حدث خطأ في رفع الصورة');
            }
        } catch (error) {
            console.error('خطأ في رفع الصورة:', error);
            alert('حدث خطأ في رفع الصورة');
        }
    }

    // فتح مودال عرض الصورة
    function openImageModal(imageUrl) {
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
                <img src="${imageUrl}" alt="صورة" style="max-width: 100%;">
            </div>
        `;
        document.body.appendChild(modal);
    }

    // تحديث عدد الإشعارات
    function updateNotificationCount(count) {
        const badge = document.getElementById('notificationBadge');
        if (count > 0) {
            badge.textContent = count;
            badge.style.display = 'inline-block';
        } else {
            badge.style.display = 'none';
        }
    }

    // الحصول على عدد الرسائل غير المقروءة
    function getUnreadMessagesCount() {
        // هنا يمكنك إضافة منطق لتتبع الرسائل غير المقروءة
        // على سبيل المثال، يمكن تخزين حالة القراءة في قاعدة البيانات
        return 0; // مؤقتًا، يمكن تعديله لاحقًا
    }

    // تسجيل الخروج
    function logout() {
        if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
            localStorage.removeItem('token');
            socket.disconnect();
            currentUser = null;
            showScreen('loginScreen');
        }
    }

    // تهيئة التطبيق عند تحميل الصفحة
    document.addEventListener('DOMContentLoaded', () => {
        if (checkAuth()) {
            initializeChat();
        }

        // إضافة مستمع لإرسال الرسائل عند الضغط على Enter
        document.getElementById('messageInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });

        document.getElementById('privateMessageInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendPrivateMessage();
            }
        });
    });
