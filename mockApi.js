const DB_KEY = 'nawa-mock-db-v2';

const seed = {
  shipments: [
    { id: 'NW-2048-AX', route: 'دبي ← لندن', client: 'شركة المدار', status: 'في الطريق', tone: 'blue', progress: 62, service: 'الشحن الجوي', history: [{ time: '12:40', note: 'غادر مركز الفرز — دبي' }, { time: '08:10', note: 'تم استلام الشحنة من المرسل' }] },
    { id: 'NW-2047-KM', route: 'جدة ← سنغافورة', client: 'متجر أفق', status: 'تم الاستلام', tone: 'green', progress: 100, service: 'الشحن البحري', history: [{ time: '16:20', note: 'تم التسليم إلى المستلم — سنغافورة' }, { time: '09:00', note: 'وصلت الشحنة إلى الميناء' }] },
    { id: 'NW-2046-QP', route: 'الرياض ← باريس', client: 'مجموعة رُبى', status: 'قيد التجهيز', tone: 'orange', progress: 18, service: 'الشحن الجوي', history: [{ time: '10:30', note: 'تم إنشاء الشحنة واعتماد المستندات' }] },
    { id: 'NW-2045-LT', route: 'الدوحة ← نيويورك', client: 'نوفا تك', status: 'في الطريق', tone: 'blue', progress: 44, service: 'الشحن البحري', history: [{ time: '14:05', note: 'الشحنة على متن السفينة — بحر العرب' }, { time: '07:45', note: 'تم التخليص الجمركي للتصدير' }] },
  ],
  services: [
    { title: 'الشحن الجوي', icon: 'airplane', text: 'حلول سريعة للشحنات الحساسة والمستعجلة.', active: true },
    { title: 'الشحن البحري', icon: 'water', text: 'سعة أكبر وتكلفة أذكى عبر الموانئ العالمية.', active: true },
    { title: 'النقل البري', icon: 'truck', text: 'توصيل موثوق من الباب إلى الباب داخل المنطقة.', active: true },
    { title: 'التخزين الذكي', icon: 'boxes', text: 'مساحات مرنة ومتابعة دقيقة لكل مخزونك.', active: true },
  ],
  customers: [
    { name: 'شركة المدار', email: 'hello@almadar.co', shipments: 38 },
    { name: 'متجر أفق', email: 'ops@ofok.store', shipments: 24 },
    { name: 'مجموعة رُبى', email: 'info@ruba.group', shipments: 16 },
    { name: 'نوفا تك', email: 'team@novatech.io', shipments: 9 },
  ],
  settings: { company: 'نُواة لوجستيك', email: 'admin@nawa.co', timezone: 'riyadh', phone: '+966 11 234 5678' },
};

const TONES = {
  'في الطريق': 'blue',
  'تم الاستلام': 'green',
  'قيد التجهيز': 'orange',
  'قيد التخليص': 'purple',
  'تم الإلغاء': 'red',
};
const STATUSES = ['قيد التجهيز', 'قيد التخليص', 'في الطريق', 'تم الاستلام', 'تم الإلغاء'];

function readDb() {
  try { const parsed = JSON.parse(localStorage.getItem(DB_KEY)); return parsed && parsed.shipments ? parsed : seed; } catch { return seed; }
}
function writeDb(db) { localStorage.setItem(DB_KEY, JSON.stringify(db)); return db; }
function request(data, delay = 220) { return new Promise((resolve) => setTimeout(() => resolve(structuredClone(data)), delay)); }

export async function getDashboard() {
  const db = readDb();
  return request({ shipments: db.shipments, services: db.services, customers: db.customers, settings: db.settings, stats: { total: 1284, active: 128, deliveryRate: '98.6%', countries: 52 } });
}
export async function createShipment(payload) {
  const db = readDb();
  const shipment = { id: `NW-${Math.floor(2000 + Math.random() * 8999)}-NX`, route: sanitize(payload.route, 40) || 'مسار جديد', client: sanitize(payload.client, 40) || 'عميل جديد', status: 'قيد التجهيز', tone: 'orange', progress: 0, service: sanitize(payload.service, 30) || 'الشحن الجوي', history: [{ time: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }), note: 'تم إنشاء الشحنة' }] };
  db.shipments = [shipment, ...db.shipments]; writeDb(db); return request(shipment);
}
export async function updateShipment(id, changes) {
  const db = readDb();
  db.shipments = db.shipments.map((s) => s.id === id ? { ...s, ...changes, tone: changes.status ? TONES[changes.status] || s.tone : s.tone } : s);
  writeDb(db);
  return request(db.shipments.find((s) => s.id === id));
}
export async function deleteShipment(id) {
  const db = readDb();
  db.shipments = db.shipments.filter((s) => s.id !== id);
  writeDb(db);
  return request({ ok: true });
}
export async function trackShipment(code) {
  const db = readDb();
  const shipment = db.shipments.find((s) => s.id.toLowerCase() === String(code || '').trim().toLowerCase());
  await request(null, 420);
  return shipment ? request(shipment, 60) : request({ error: 'لم يتم العثور على شحنة بهذا الرقم' }, 60);
}
export async function searchAll(query) {
  const db = readDb();
  const q = String(query || '').trim().toLowerCase();
  const match = (value) => String(value).toLowerCase().includes(q);
  const shipments = db.shipments.filter((s) => match(s.id) || match(s.client) || match(s.route) || match(s.status));
  const services = db.services.filter((s) => match(s.title) || match(s.text));
  const customers = db.customers.filter((c) => match(c.name) || match(c.email));
  return request({ shipments, services, customers }, 160);
}
export async function getServices() { return request(readDb().services); }
export async function toggleService(title) {
  const db = readDb();
  db.services = db.services.map((service) => service.title === title ? { ...service, active: !service.active } : service);
  writeDb(db); return request(db.services);
}
export async function getCustomers() { return request(readDb().customers); }
export async function getSettings() { return request(readDb().settings); }
export async function saveSettings(settings) {
  const db = readDb();
  db.settings = { company: sanitize(settings.company, 60), email: sanitize(settings.email, 80), timezone: sanitize(settings.timezone, 20), phone: sanitize(settings.phone, 24) };
  writeDb(db); return request(db.settings);
}
export function resetMockData() { localStorage.setItem(DB_KEY, JSON.stringify(seed)); }
export { STATUSES };

/* ================= Authentication & Security ================= */

const AUTH_DB_KEY = 'nawa-auth-db-v1';
const SESSION_KEY = 'nawa-session-v1';
const LOGIN_ATTEMPTS_KEY = 'nawa-login-attempts';
const SESSION_TTL = 8 * 60 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const LOCK_MS = 60 * 1000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function sanitize(value, maxLen = 120) {
  return String(value ?? '').replace(/<[^>]*>/g, '').trim().slice(0, maxLen);
}

function hashPassword(password, salt) {
  let h = 5381;
  const input = `${salt}::${password}`;
  for (let i = 0; i < input.length; i += 1) h = ((h << 5) + h + input.charCodeAt(i)) | 0;
  return `h${Math.abs(h).toString(36)}${salt.length.toString(36)}`;
}

function publicUser(user) { return { id: user.id, name: user.name, email: user.email, role: user.role }; }

function seedAuthDb() {
  const salt = 'nawa-seed';
  const db = {
    users: [{ id: 'u-admin', name: 'مدير النظام', email: 'admin@nawa.co', role: 'admin', salt, passwordHash: hashPassword('admin123', salt), createdAt: Date.now() }],
  };
  localStorage.setItem(AUTH_DB_KEY, JSON.stringify(db));
  return db;
}

function readAuthDb() {
  try {
    const parsed = JSON.parse(localStorage.getItem(AUTH_DB_KEY));
    return parsed && Array.isArray(parsed.users) ? parsed : seedAuthDb();
  } catch { return seedAuthDb(); }
}
function writeAuthDb(db) { localStorage.setItem(AUTH_DB_KEY, JSON.stringify(db)); return db; }

function readSessionUser() {
  try {
    const session = JSON.parse(localStorage.getItem(SESSION_KEY));
    if (!session || !session.id || !session.email) return null;
    if (Date.now() > session.expiresAt) { localStorage.removeItem(SESSION_KEY); return null; }
    const db = readAuthDb();
    const user = db.users.find((u) => u.email === session.email);
    if (!user || user.sessionId !== session.id) { localStorage.removeItem(SESSION_KEY); return null; }
    return user;
  } catch { return null; }
}

function createSession(user) {
  const session = { id: Math.random().toString(36).slice(2, 14), email: user.email, createdAt: Date.now(), expiresAt: Date.now() + SESSION_TTL };
  const db = readAuthDb();
  db.users = db.users.map((u) => u.email === user.email ? { ...u, sessionId: session.id } : u);
  writeAuthDb(db);
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function getCurrentUser() {
  const user = readSessionUser();
  return user ? publicUser(user) : null;
}

export async function register({ name, email, password }) {
  const cleanName = sanitize(name, 40) || 'مستخدم جديد';
  const cleanEmail = sanitize(email, 80).toLowerCase();
  const cleanPassword = String(password || '');
  if (!EMAIL_RE.test(cleanEmail)) return request({ error: 'البريد الإلكتروني غير صالح' }, 300);
  if (cleanPassword.length < 6) return request({ error: 'كلمة المرور يجب ألا تقل عن 6 أحرف' }, 300);
  const db = readAuthDb();
  if (db.users.some((u) => u.email === cleanEmail)) return request({ error: 'هذا البريد الإلكتروني مسجل مسبقًا' }, 300);
  const salt = Math.random().toString(36).slice(2, 10);
  const user = { id: `u-${Date.now().toString(36)}${Math.floor(Math.random() * 99)}`, name: cleanName, email: cleanEmail, role: 'user', salt, passwordHash: hashPassword(cleanPassword, salt), createdAt: Date.now() };
  db.users.push(user); writeAuthDb(db);
  createSession(user);
  return request({ user: publicUser(user) }, 300);
}

export async function login(email, password) {
  const cleanEmail = sanitize(email, 80).toLowerCase();
  const cleanPassword = String(password || '');
  let attempts = { count: 0, lockedUntil: 0 };
  try { attempts = { ...attempts, ...JSON.parse(localStorage.getItem(LOGIN_ATTEMPTS_KEY) || '{}') }; } catch { /* ignore */ }
  if (Date.now() < attempts.lockedUntil) {
    const seconds = Math.ceil((attempts.lockedUntil - Date.now()) / 1000);
    return request({ error: `تم قفل المحاولات مؤقتًا — حاول بعد ${seconds} ثانية` }, 300);
  }
  const db = readAuthDb();
  const user = db.users.find((u) => u.email === cleanEmail);
  const ok = user && user.passwordHash === hashPassword(cleanPassword, user.salt);
  if (!ok) {
    attempts.count = (attempts.count || 0) + 1;
    if (attempts.count >= MAX_ATTEMPTS) { attempts.lockedUntil = Date.now() + LOCK_MS; attempts.count = 0; }
    localStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify(attempts));
    return request({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' }, 300);
  }
  localStorage.removeItem(LOGIN_ATTEMPTS_KEY);
  createSession(user);
  return request({ user: publicUser(user) }, 300);
}

export async function logout() {
  const user = readSessionUser();
  if (user) {
    const db = readAuthDb();
    db.users = db.users.map((u) => u.email === user.email ? { ...u, sessionId: undefined } : u);
    writeAuthDb(db);
  }
  localStorage.removeItem(SESSION_KEY);
  return request({ ok: true }, 100);
}
