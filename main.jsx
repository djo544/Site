import React, { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import '../styles.css';
import AdminDashboard from './AdminDashboard.jsx';
import { getCurrentUser, login, logout, register, searchAll, trackShipment } from './mockApi.js';

const GlobeScene = lazy(() => import('./GlobeScene.jsx'));

class GlobeErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? <div className="globe-fallback" /> : this.props.children;
  }
}

const services = [
  { title: 'الشحن الجوي', icon: 'airplane', text: 'حلول سريعة للشحنات الحساسة والمستعجلة.', time: '2-5 أيام عمل', price: 'يبدأ من 120 ر.س', features: ['توصيل سريع إلى أكثر من 50 دولة', 'أولوية كاملة في المناولة الأرضية', 'تأمين شامل ومتابعة لحظية'] },
  { title: 'الشحن البحري', icon: 'water', text: 'سعة أكبر وتكلفة أذكى عبر الموانئ العالمية.', time: '10-25 يومًا', price: 'يبدأ من 950 ر.س', features: ['حاويات كاملة أو تجميعية', 'أفضل تكلفة للشحنات الضخمة', 'تخليص جمركي وإدارة مستندات'] },
  { title: 'النقل البري', icon: 'truck', text: 'توصيل موثوق من الباب إلى الباب داخل المنطقة.', time: '1-4 أيام', price: 'يبدأ من 75 ر.س', features: ['شاحنات مجهزة ومؤمّنة بالكامل', 'تتبع GPS مباشر للرحلة', 'جدولة مرنة ودعم يومي'] },
  { title: 'التخزين الذكي', icon: 'boxes', text: 'مساحات مرنة ومتابعة دقيقة لكل مخزونك.', time: 'عقود مرنة', price: 'يبدأ من 300 ر.س/شهر', features: ['مستودعات آمنة ومؤمّنة', 'إدارة مخزون لحظية عبر النظام', 'تجهيز وتغليف الطلبات'] },
];

const QUOTES_KEY = 'nawa-shipment-quotes';

function readQuotes() {
  try { return JSON.parse(localStorage.getItem(QUOTES_KEY)) || []; } catch { return []; }
}
function writeQuotes(list) { localStorage.setItem(QUOTES_KEY, JSON.stringify(list)); return list; }

const navLinks = [
  ['home', 'الرئيسية', '#home'],
  ['services', 'منتجاتنا', '#services'],
  ['process', 'كيف نعمل', '#process'],
  ['track', 'تتبع شحنتك', '#track'],
  ['about', 'عن الشركة', '#about'],
];

const sectionRoutes = ['home', 'products', 'process', 'about', 'quote'];

function Header({ route, activeSection, count, onMenu, onSearch, user, onLogout }) {
  const [accountOpen, setAccountOpen] = useState(false);
  const isActive = (key) => (key === 'track' || key === 'cart' || key === 'services') ? route === key : route === 'home' && activeSection === key;
  const close = () => setAccountOpen(false);
  return <header className="site-header">
    <button className="icon-btn mobile-menu" onClick={onMenu} aria-label="فتح القائمة"><i className="bi bi-list" /></button>
    <a className="brand" href="#home"><span className="brand-mark">ن</span><span>نُواة لوجستيك</span></a>
    <nav className="main-nav">{navLinks.map(([key, label, href]) => <a key={key} href={href} className={isActive(key) ? 'active' : ''}>{label}</a>)}</nav>
    <div className="header-actions">
      <button className="icon-btn" onClick={onSearch} aria-label="بحث"><i className="bi bi-search" /></button>
      {user ? <div className="user-menu">
        <button className="icon-btn user-btn" onClick={() => setAccountOpen((v) => !v)} aria-label="الحساب"><span className="user-chip">{user.name.charAt(0)}</span></button>
        {accountOpen && <>
          <div className="user-menu-backdrop" onClick={close} />
          <div className="user-dropdown">
            <div className="user-dropdown-head"><strong>{user.name}</strong><small>{user.email}</small></div>
            {user.role === 'admin' && <a href="#admin" onClick={close}><i className="bi bi-speedometer2" /> لوحة التحكم</a>}
            <a href="#track" onClick={close}><i className="bi bi-box-seam" /> تتبع شحنتك</a>
            <button className="user-logout" onClick={() => { close(); onLogout(); }}><i className="bi bi-box-arrow-right" /> تسجيل الخروج</button>
          </div>
        </>}
      </div> : <a className="icon-btn" href="#login" aria-label="تسجيل الدخول"><i className="bi bi-person" /></a>}
      <a className="cart-btn" href="#cart"><i className="bi bi-bag me-1" /> السلة <span>{count}</span></a>
    </div>
  </header>;
}

function MobileMenu({ open, onClose, user, onLogout }) {
  if (!open) return null;
  return <div className="mobile-drawer"><button className="drawer-close" onClick={onClose} aria-label="إغلاق"><i className="bi bi-x-lg" /></button><span className="logistics-logo">NUWA<span>LOGISTICS</span></span><nav>{navLinks.map(([key, label, href]) => <a key={key} href={href} onClick={onClose}>{label}</a>)}{user ? <>
    {user.role === 'admin' && <a href="#admin" onClick={onClose}>لوحة التحكم</a>}
    <button className="drawer-logout" onClick={() => { onClose(); onLogout(); }}>تسجيل الخروج</button>
  </> : <a href="#login" onClick={onClose}>تسجيل الدخول / حساب جديد</a>}</nav><div className="drawer-footer">الشبكة تعمل عالميًا <i /></div></div>;
}

function Home({ onToast, onQuote }) {
  return <>
    <section id="home" className="logistics-home">
      <div className="logistics-top"><span className="logistics-logo">NUWA<span>LOGISTICS</span></span><span className="live-status"><i /> الشبكة تعمل عالميًا</span></div>
      <div className="logistics-copy"><span className="logistics-overline">مشغل واحد / شبكة واحدة</span><h1>كل رحلة<br /><em>تبدأ هنا.</em></h1><p>نربط أعمالك بالعالم عبر حلول شحن ذكية، سريعة، وموثوقة من الباب إلى الباب.</p><div className="logistics-actions"><button className="light-btn" onClick={() => { window.location.hash = 'quote'; }}>ابدأ رحلتك <i className="bi bi-arrow-up-left" /></button><a className="outline-link" href="#process">كيف نعمل</a></div></div>
      <div className="logistics-globe hero-art"><Suspense fallback={<div className="globe-fallback" />}><GlobeErrorBoundary><GlobeScene /></GlobeErrorBoundary></Suspense></div>
      <div className="logistics-stats"><span>01</span><strong>نقل بحري، جوي وبري</strong><span>50+</span><strong>دولة حول العالم</strong><span>24/7</span><strong>تتبع مباشر لشحنتك</strong></div>
      <a className="logistics-scroll" href="#process">مرر لاكتشاف كيف نعمل <i className="bi bi-arrow-down" /></a>
    </section>
    <section id="process" className="logistics-process">
      <div className="process-heading"><span className="logistics-overline">من الفكرة إلى الوصول</span><h2>أربع مراحل.<br /><em>رحلة واحدة.</em></h2></div>
      <div className="process-grid">{['نخطط', 'نستلم', 'نحرك', 'نسلّم'].map((item, index) => <article key={item}><span>0{index + 1}</span><i className={`bi bi-${['compass', 'box-seam', 'globe-americas', 'check2-circle'][index]}`} /><h3>{item}</h3><p>{['نرسم المسار الأنسب لشحنتك قبل أن تبدأ.', 'استلام آمن ومنظم من موقعك مباشرة.', 'تتبع حي عبر شبكة عالمية متصلة.', 'وصول دقيق، واضح، وفي الوقت المتفق عليه.'][index]}</p></article>)}</div>
    </section>
    <section id="products" className="logistics-products">
      <div className="section-head"><div><span className="logistics-overline">الخدمات الشائعة</span><h2>حلول تتحرك معك.</h2></div><a className="link" href="#quote">اطلب عرض سعر <i className="bi bi-arrow-up-left" /></a></div>
      <div className="products-grid">{services.map((service, index) => <article className="service-card" key={service.title}><span>0{index + 1}</span><i className={`bi bi-${service.icon}`} /><h3>{service.title}</h3><p>{service.text}</p><a href="#services">اعرف المزيد <i className="bi bi-arrow-left" /></a></article>)}</div>
    </section>
    <StatsStrip />
    <AboutSection />
    <TestimonialsSection />
    <FaqSection />
    <QuoteSection onQuote={onQuote} onToast={onToast} />
    <ContactStrip />
  </>;
}

function ServicesPage({ onToast }) {
  return <main className="app-page services-page">
    <span className="logistics-overline">كتالوج الخدمات</span>
    <h1>خدماتنا،<br /><em>مصممة لعملك.</em></h1>
    <p>اختر الخدمة الأنسب لشحنتك، أو اطلب عرض سعر مخصصًا وسيتواصل معك فريقنا.</p>
    <div className="services-catalog">{services.map((service, index) => <article className="catalog-card" key={service.title}>
      <div className="catalog-card-head"><div className="catalog-icon"><i className={`bi bi-${service.icon}`} /></div><span className="catalog-num">0{index + 1}</span></div>
      <h3>{service.title}</h3>
      <p>{service.text}</p>
      <ul className="catalog-features">{service.features.map((feature) => <li key={feature}><i className="bi bi-check2" />{feature}</li>)}</ul>
      <div className="catalog-meta"><span><i className="bi bi-clock" /> {service.time}</span><strong>{service.price}</strong></div>
      <a className="light-btn" href="#quote" onClick={() => onToast(`اخترت «${service.title}» — أرسل لنا تفاصيل شحنتك`)}>اطلب هذه الخدمة <i className="bi bi-arrow-up-left" /></a>
    </article>)}</div>
  </main>;
}

function StatsStrip() {
  return <section className="stats-strip"><div><strong>1,284+</strong><span>شحنة نُفِّذت هذا العام</span></div><div><strong>52</strong><span>دولة نشطة حول العالم</span></div><div><strong>98.6%</strong><span>نسبة التسليم في الوقت</span></div><div><strong>24/7</strong><span>دعم وتتبع مباشر</span></div></section>;
}

function AboutSection() {
  return <section id="about" className="about-section">
    <div className="about-copy"><span className="logistics-overline">عن نُواة</span><h2>شبكة لوجستية<br /><em>مبنية على الثقة.</em></h2><p>منذ تأسيسنا ونحن نبني جسرًا موثوقًا بين الشركات وأسواقها. نجمع بين الخبرة العميقة في النقل الجوي والبحري والبري، وأحدث التقنيات في التتبع والتحليل، لنمنح عملاءنا راحة البال في كل مرحلة من مراحل الرحلة.</p><div className="about-features"><span><i className="bi bi-shield-check" /> أمان وتأمين كامل</span><span><i className="bi bi-lightning-charge" /> سرعة استجابة</span><span><i className="bi bi-graph-up-arrow" /> رؤية لحظية</span></div></div>
    <div className="about-panel">
      <div className="about-metric"><span>2015</span><strong>عام التأسيس</strong><small>بدأنا بفريق صغير وشغف كبير</small></div>
      <div className="about-metric"><span>240+</span><strong>شركة شريكة</strong><small>شراكات دائمة في أوروبا وآسيا والأمريكتين</small></div>
      <div className="about-metric"><span>100%</span><strong>التزام بالمواعيد</strong><small>أنظمة متابعة صارمة لكل شحنة</small></div>
    </div>
  </section>;
}

function TestimonialsSection() {
  const quotes = [
    { name: 'سارة العنزي', role: 'مديرة عمليات — شركة المدار', text: 'تجربة تتبع مذهلة، كل شحنة واضحة أمامنا من لحظة الاستلام حتى التسليم. نُواة غيّرت طريقة إدارة مخزوننا.' },
    { name: 'خالد الحربي', role: 'مؤسس — متجر أفق', text: 'أفضل قرار كان التعامل مع نُواة. سرعة في الرد، ودقة في المواعيد، وفريق محترف يرافقك في كل خطوة.' },
    { name: 'ريم القحطاني', role: 'مديرة سلسلة الإمداد — مجموعة رُبى', text: 'اعتمدنا عليهم في التوسع إلى أسواق جديدة، ولم نخذل أبدًا. خدمة من الباب إلى الباب حقيقية وليست مجرد شعار.' },
  ];
  return <section className="testimonials">
    <div className="section-head"><div><span className="logistics-overline">آراء عملائنا</span><h2>ثقة تتحول<br /><em>إلى شراكة.</em></h2></div><i className="bi bi-quote testimonials-mark" /></div>
    <div className="testimonial-grid">{quotes.map((q) => <article key={q.name}><i className="bi bi-star-fill" /><i className="bi bi-star-fill" /><i className="bi bi-star-fill" /><i className="bi bi-star-fill" /><i className="bi bi-star-fill" /><p>{q.text}</p><div><span>{q.name.charAt(0)}</span><div><strong>{q.name}</strong><small>{q.role}</small></div></div></article>)}</div>
  </section>;
}

function FaqSection() {
  const faqs = [
    { q: 'كم تستغرق مدة الشحن الجوي؟', a: 'تتراوح عادة بين 2 إلى 5 أيام عمل حسب الوجهة، مع إمكانية اختيار خدمة الشحن السريع للشحنات المستعجلة.' },
    { q: 'كيف أتتبع شحنتي؟', a: 'من صفحة «تتبع شحنتك» أدخل رقم التتبع الذي يصلك فور إنشاء الشحنة، وستجد آخر التحديثات لحظيًا.' },
    { q: 'هل تقدمون خدمات التخليص الجمركي؟', a: 'نعم، نوفر التخليص الجمركي الكامل ضمن خدمة الشحن البحري والجوي، وندير المستندات بالكامل نيابة عنك.' },
    { q: 'ما الحد الأدنى لطلب عرض السعر؟', a: 'لا يوجد حد أدنى. أرسل تفاصيل شحنتك من نموذج «اطلب عرض سعر» وسيتواصل معك فريقنا خلال ساعات العمل.' },
  ];
  return <section className="faq-section"><div className="faq-copy"><span className="logistics-overline">أسئلة شائعة</span><h2>كل ما تريد<br /><em>معرفته.</em></h2><p>لم تجد إجابتك؟ فريقنا جاهز دائمًا.</p><a className="light-btn" href="#quote">اسألنا مباشرة <i className="bi bi-arrow-up-left" /></a></div><div className="faq-list">{faqs.map((item) => <details key={item.q}><summary>{item.q}<i className="bi bi-plus-lg" /></summary><p>{item.a}</p></details>)}</div></section>;
}

function QuoteSection({ onQuote, onToast }) {
  const submit = (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    onQuote({ client: form.client.value, service: form.service.value });
    form.reset();
  };
  return <section id="quote" className="quote-section"><div><span className="logistics-overline">خطوتك التالية</span><h2>لنجعل الشحن<br /><em>أبسط.</em></h2><p>أخبرنا عن احتياجك وسنقترح المسار الأفضل.</p></div><form className="quote-form" onSubmit={submit}><label>الاسم الكامل<input name="client" required placeholder="اكتب اسمك" /></label><label>البريد الإلكتروني<input required type="email" placeholder="name@company.com" /></label><label>نوع الشحنة<select name="service" defaultValue=""><option value="" disabled>اختر الخدمة</option>{services.map((service) => <option key={service.title}>{service.title}</option>)}</select></label><button className="light-btn" type="submit">إرسال الطلب <i className="bi bi-arrow-up-left" /></button></form></section>;
}

function ContactStrip() {
  return <section className="contact-strip"><div><i className="bi bi-geo-alt" /><div><strong>المقر الرئيسي</strong><span>الرياض، طريق الملك فهد — برج نُواة</span></div></div><div><i className="bi bi-telephone" /><div><strong>اتصل بنا</strong><span dir="ltr">+966 11 234 5678</span></div></div><div><i className="bi bi-envelope" /><div><strong>راسلنا</strong><span>care@nawa.co</span></div></div></section>;
}

function SearchModal({ onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (event) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  const run = async (event) => {
    event.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    const res = await searchAll(query);
    setLoading(false);
    setResults(res);
  };
  const openShipment = (id) => {
    localStorage.setItem('nawa-pending-track', id);
    window.location.hash = 'track';
    onClose();
  };
  const empty = results && !results.shipments.length && !results.services.length && !results.customers.length;
  return <div className="search-backdrop" onClick={onClose}>
    <div className="search-modal" onClick={(event) => event.stopPropagation()}>
      <div className="search-top"><h2>البحث في نُواة</h2><button className="drawer-close" onClick={onClose} aria-label="إغلاق"><i className="bi bi-x-lg" /></button></div>
      <form className="search-form" onSubmit={run}><i className="bi bi-search" /><input ref={inputRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="رقم شحنة، عميل، خدمة، أو مسار..." /><button className="light-btn" type="submit">بحث</button></form>
      {loading && <p className="search-note">جاري البحث...</p>}
      {empty && <p className="search-note">لا توجد نتائج مطابقة لـ «{query}»</p>}
      {results?.shipments?.length > 0 && <div className="search-group"><h3>الشحنات</h3>{results.shipments.map((s) => <button className="search-result" key={s.id} onClick={() => openShipment(s.id)}><i className="bi bi-box-seam" /><div><strong>{s.id}</strong><span>{s.route} — {s.client}</span></div><em className={`status-chip tone-${s.tone}`}>{s.status}</em></button>)}</div>}
      {results?.services?.length > 0 && <div className="search-group"><h3>الخدمات</h3>{results.services.map((s) => <a className="search-result" href="#services" onClick={onClose} key={s.title}><i className={`bi bi-${s.icon}`} /><div><strong>{s.title}</strong><span>{s.text}</span></div></a>)}</div>}
      {results?.customers?.length > 0 && <div className="search-group"><h3>العملاء</h3>{results.customers.map((c) => <a className="search-result" href="#admin" onClick={onClose} key={c.email}><i className="bi bi-person" /><div><strong>{c.name}</strong><span>{c.email}</span></div></a>)}</div>}
    </div>
  </div>;
}

function TrackingPage({ onToast }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const doTrack = async (value) => {
    setLoading(true); setError(''); setResult(null);
    const found = await trackShipment(value);
    setLoading(false);
    if (found.error) setError(found.error);
    else { setResult(found); onToast(`تم العثور على الشحنة ${found.id}`); }
  };
  useEffect(() => {
    const pending = localStorage.getItem('nawa-pending-track');
    if (pending) {
      localStorage.removeItem('nawa-pending-track');
      setCode(pending);
      doTrack(pending);
    }
  }, []);
  const submit = (event) => { event.preventDefault(); if (!code.trim()) { setError('أدخل رقم التتبع أولًا'); return; } doTrack(code); };
  const tryExample = () => { setCode('NW-2048-AX'); doTrack('NW-2048-AX'); };
  return <main className="app-page">
    <span className="logistics-overline">تتبع مباشر</span>
    <h1>أين شحنتك الآن؟</h1>
    <p>أدخل رقم التتبع لمشاهدة آخر التحديثات لحظيًا.</p>
    <form className="tracking-form" onSubmit={submit}>
      <input value={code} onChange={(event) => setCode(event.target.value)} placeholder="مثال: NW-2048-AX" />
      <button className="light-btn" type="submit">{loading ? 'جاري البحث...' : <>تتبع الشحنة <i className="bi bi-arrow-up-left" /></>}</button>
    </form>
    <button className="try-example" onClick={tryExample}>جرّب رقمًا تجريبيًا: NW-2048-AX</button>
    {error && <div className="tracking-error"><i className="bi bi-exclamation-triangle" /> {error}</div>}
    {result && <div className="tracking-card">
      <div className="tracking-head">
        <div><i className={`bi bi-box-seam`} /><div><strong>{result.id}</strong><span>{result.route} — {result.client}</span></div></div>
        <span className={`status-chip tone-${result.tone}`}>{result.status}</span>
      </div>
      <div className="tracking-progress"><div className="progress-track"><span style={{ width: `${result.progress ?? 0}%` }} /></div><div className="progress-labels"><span>{result.progress ?? 0}% من الرحلة</span><small>{result.service || 'خدمة الشحن'}</small></div></div>
      <div className="tracking-timeline">{(result.history || []).map((entry, i) => <div className={`timeline-item ${i === 0 ? 'latest' : ''}`} key={i}><span className="timeline-dot" /><div><strong>{entry.time}</strong><p>{entry.note}</p></div></div>)}</div>
    </div>}
  </main>;
}

function CartPage({ quotes, onRemove, onToast }) {
  return <main className="app-page">
    <span className="logistics-overline">مساحة الشحنات</span>
    <h1>سلة الشحنات</h1>
    {!quotes.length ? <div className="cart-summary"><div><i className="bi bi-boxes" /><div><strong>لا توجد شحنات محفوظة</strong><span>ابدأ بطلب عرض سعر لإنشاء شحنتك الأولى.</span></div></div><a className="light-btn" href="#quote">طلب عرض سعر <i className="bi bi-arrow-up-left" /></a></div> : <div className="quotes-list">{quotes.map((quote) => <div className="quote-row" key={quote.id}><span className="shipment-code">{quote.id}</span><div><strong>{quote.client}</strong><small>{quote.service} — {quote.date}</small></div><button className="row-more" onClick={() => onRemove(quote.id)} aria-label="إزالة"><i className="bi bi-trash" /></button></div>)}</div>}
    <button className="outline-link cart-help" onClick={() => onToast('فريق الدعم متاح لمساعدتك على مدار الساعة')}>تحتاج مساعدة؟ تواصل مع الدعم</button>
  </main>;
}

function LoginPage({ returnTo, onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const submit = async (event) => {
    event.preventDefault();
    setLoading(true); setError('');
    const res = await login(email, password);
    setLoading(false);
    if (res.error) setError(res.error);
    else onLogin(res.user, returnTo);
  };
  return <main className="app-page auth-page">
    <span className="logistics-overline">أهلاً بعودتك</span>
    <h1>سجّل دخولك<br /><em>للمتابعة.</em></h1>
    <p>أدخل بيانات حسابك للوصول إلى خدمات التتبع ولوحة التحكم.</p>
    <form className="auth-form" onSubmit={submit}>
      <label>البريد الإلكتروني<input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required placeholder="name@company.com" autoComplete="email" /></label>
      <label>كلمة المرور<input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required minLength={6} placeholder="••••••••" autoComplete="current-password" /></label>
      {error && <div className="auth-error" role="alert"><i className="bi bi-exclamation-triangle" /> {error}</div>}
      <button className="light-btn" type="submit" disabled={loading}>{loading ? 'جاري الدخول...' : <>تسجيل الدخول <i className="bi bi-arrow-up-left" /></>}</button>
    </form>
    <p className="auth-switch">ليس لديك حساب؟ <a href="#register">أنشئ حسابًا جديدًا</a></p>
    <p className="auth-demo">حساب تجريبي للمدير: <code dir="ltr">admin@nawa.co</code> / <code dir="ltr">admin123</code></p>
  </main>;
}

function RegisterPage({ returnTo, onLogin }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const submit = async (event) => {
    event.preventDefault();
    if (password !== confirm) { setError('كلمتا المرور غير متطابقتين'); return; }
    setLoading(true); setError('');
    const res = await register({ name, email, password });
    setLoading(false);
    if (res.error) setError(res.error);
    else onLogin(res.user, returnTo);
  };
  return <main className="app-page auth-page">
    <span className="logistics-overline">انضم إلينا</span>
    <h1>أنشئ حسابك<br /><em>في دقيقة.</em></h1>
    <p>سجّل حسابك لتتتبع شحناتك وتدير طلباتك بسهولة.</p>
    <form className="auth-form" onSubmit={submit}>
      <label>الاسم الكامل<input value={name} onChange={(e) => setName(e.target.value)} required minLength={2} placeholder="اسمك كما تريدنا أن نناديك" autoComplete="name" /></label>
      <label>البريد الإلكتروني<input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required placeholder="name@company.com" autoComplete="email" /></label>
      <label>كلمة المرور<input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required minLength={6} placeholder="6 أحرف على الأقل" autoComplete="new-password" /></label>
      <label>تأكيد كلمة المرور<input value={confirm} onChange={(e) => setConfirm(e.target.value)} type="password" required minLength={6} placeholder="أعد كتابة كلمة المرور" autoComplete="new-password" /></label>
      {error && <div className="auth-error" role="alert"><i className="bi bi-exclamation-triangle" /> {error}</div>}
      <button className="light-btn" type="submit" disabled={loading}>{loading ? 'جاري الإنشاء...' : <>إنشاء الحساب <i className="bi bi-arrow-up-left" /></>}</button>
    </form>
    <p className="auth-switch">لديك حساب بالفعل؟ <a href="#login">سجّل الدخول</a></p>
  </main>;
}

function PermissionPage() {
  return <main className="app-page auth-page">
    <span className="logistics-overline">الوصول مقيّد</span>
    <h1>لا تملك صلاحية<br /><em>لهذه الصفحة.</em></h1>
    <p>لوحة التحكم متاحة لحسابات المديرين فقط. يمكنك المتابعة لاستخدام باقي خدمات نُواة.</p>
    <div className="auth-actions"><a className="light-btn" href="#home">العودة للرئيسية <i className="bi bi-arrow-up-left" /></a><a className="outline-link" href="#track">تتبع شحنتك</a></div>
  </main>;
}

function Footer() {
  return <footer className="site-footer">
    <div className="footer-grid">
      <div className="footer-brand"><a className="brand" href="#home"><span className="brand-mark">ن</span><span>نُواة لوجستيك</span></a><p>نربط أعمالك بالعالم عبر حلول شحن ذكية وسريعة وموثوقة، من الباب إلى الباب.</p><div className="footer-social"><a href="#home" aria-label="تويتر"><i className="bi bi-twitter-x" /></a><a href="#home" aria-label="لينكد إن"><i className="bi bi-linkedin" /></a><a href="#home" aria-label="إنستغرام"><i className="bi bi-instagram" /></a></div></div>
      <div className="footer-col"><h4>روابط سريعة</h4><a href="#home">الرئيسية</a><a href="#products">الخدمات</a><a href="#process">كيف نعمل</a><a href="#track">تتبع شحنتك</a><a href="#about">عن الشركة</a><a href="#login">تسجيل الدخول</a><a href="#register">حساب جديد</a></div>
      <div className="footer-col"><h4>خدماتنا</h4>{services.map((s) => <a key={s.title} href="#services">{s.title}</a>)}</div>
      <div className="footer-col"><h4>تواصل معنا</h4><a href="tel:+966112345678"><i className="bi bi-telephone" /> <span dir="ltr">+966 11 234 5678</span></a><a href="mailto:care@nawa.co"><i className="bi bi-envelope" /> care@nawa.co</a><a href="#about"><i className="bi bi-geo-alt" /> الرياض، طريق الملك فهد</a></div>
    </div>
    <div className="footer-bottom"><span>© 2026 نُواة لوجستيك — جميع الحقوق محفوظة</span><span>شريكك اللوجستي الموثوق منذ 2015</span></div>
  </footer>;
}

function App() {
  const [route, setRoute] = useState(window.location.hash.slice(1) || 'home');
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [activeSection, setActiveSection] = useState('home');
  const [count, setCount] = useState(() => readQuotes().length);
  const [user, setUser] = useState(() => getCurrentUser());
  useEffect(() => {
    const onHash = () => {
      const hash = window.location.hash.slice(1) || 'home';
      setRoute(hash); setMenuOpen(false);
      if (hash === 'admin') setUser(getCurrentUser());
      if (sectionRoutes.includes(hash)) {
        setTimeout(() => { const el = document.getElementById(hash); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 60);
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  useEffect(() => {
    if (route !== 'home' && !sectionRoutes.includes(route)) return undefined;
    const ids = ['home', 'products', 'process', 'about'];
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => { if (entry.isIntersecting) setActiveSection(entry.target.id); });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ids.forEach((id) => { const el = document.getElementById(id); if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, [route]);
  useEffect(() => { if (!toast) return undefined; const timer = setTimeout(() => setToast(''), 3500); return () => clearTimeout(timer); }, [toast]);
  const showToast = (message) => setToast(message);
  const handleQuoteSubmit = ({ client, service }) => {
    const quotes = readQuotes();
    quotes.unshift({ id: `Q-${Date.now().toString().slice(-6)}`, client, service: service || 'غير محدد', date: new Date().toLocaleDateString('ar-SA') });
    writeQuotes(quotes);
    setCount(quotes.length);
    showToast('تم استلام طلبك — سيتواصل معك فريق نُواة قريبًا');
  };
  const removeQuote = (id) => { const quotes = readQuotes().filter((q) => q.id !== id); writeQuotes(quotes); setCount(quotes.length); showToast('تمت إزالة الطلب من السلة'); };
  const handleLogin = (loggedUser, returnTo = 'home') => { setUser(loggedUser); window.location.hash = returnTo; showToast(`أهلاً بك، ${loggedUser.name}`); };
  const handleLogout = async () => { await logout(); setUser(null); window.location.hash = 'home'; showToast('تم تسجيل الخروج بنجاح'); };
  const quotes = readQuotes();
  const isAdmin = user?.role === 'admin';
  const page = route === 'home' ? <Home onToast={showToast} onQuote={handleQuoteSubmit} /> : route === 'services' ? <ServicesPage onToast={showToast} /> : route === 'track' ? <TrackingPage onToast={showToast} /> : route === 'cart' ? <CartPage quotes={quotes} onRemove={removeQuote} onToast={showToast} /> : route === 'login' ? <LoginPage returnTo="home" onLogin={handleLogin} /> : route === 'register' ? <RegisterPage returnTo="home" onLogin={handleLogin} /> : route === 'admin' ? (user ? (isAdmin ? <AdminDashboard user={user} onLogout={handleLogout} /> : <PermissionPage />) : <LoginPage returnTo="admin" onLogin={handleLogin} />) : <Home onToast={showToast} onQuote={handleQuoteSubmit} />;
  return <>
    {route !== 'admin' && <Header route={route} activeSection={activeSection} count={count} user={user} onLogout={handleLogout} onMenu={() => setMenuOpen(true)} onSearch={() => setSearchOpen(true)} />}
    <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} user={user} onLogout={handleLogout} />
    <main>{page}</main>
    {route !== 'admin' && <Footer />}
    {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}
    {toast && <div className="toast show" role="status"><i className="bi bi-check2-circle" /> {toast}</div>}
  </>;
}

export { Home, ServicesPage };

if (typeof document !== 'undefined') {
  createRoot(document.getElementById('root')).render(<App />);
}
