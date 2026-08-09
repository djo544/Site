import React, { useEffect, useState } from 'react';
import { STATUSES, createShipment as createMockShipment, getDashboard, updateShipment, deleteShipment, toggleService, saveSettings } from './mockApi.js';

const services = [
  { title: 'الشحن الجوي', icon: 'airplane', text: 'حلول سريعة للشحنات الحساسة والمستعجلة.' },
  { title: 'الشحن البحري', icon: 'water', text: 'سعة أكبر وتكلفة أذكى عبر الموانئ العالمية.' },
  { title: 'النقل البري', icon: 'truck', text: 'توصيل موثوق من الباب إلى الباب داخل المنطقة.' },
  { title: 'التخزين الذكي', icon: 'boxes', text: 'مساحات مرنة ومتابعة دقيقة لكل مخزونك.' },
];

function csvCell(value) {
  const text = String(value ?? '').replace(/"/g, '""');
  const guarded = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${guarded}"`;
}

function exportCsv(shipments) {
  const header = 'رقم الشحنة,العميل,المسار,الحالة,الخدمة';
  const rows = shipments.map((s) => [s.id, s.client, s.route, s.status, s.service || ''].map(csvCell).join(','));
  const csv = '\uFEFF' + [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'nawa-shipments.csv'; a.click();
  URL.revokeObjectURL(url);
}

export default function AdminDashboard({ user, onLogout }) {
  const [tab, setTab] = useState('overview');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ shipments: [], services: [], customers: [], settings: {}, stats: {} });
  const [client, setClient] = useState('');
  const [toast, setToast] = useState('');
  useEffect(() => { getDashboard().then((result) => { setData(result); setLoading(false); }); }, []);
  const patch = (partial) => setData((current) => ({ ...current, ...partial }));
  const createShipment = async (event, payload) => {
    event.preventDefault();
    const shipment = await createMockShipment(payload || { client: client || 'عميل جديد', route: 'مسار جديد' });
    patch({ shipments: [shipment, ...data.shipments] });
    setClient(''); setShowForm(false); setToast('تم إنشاء الشحنة بنجاح');
  };
  const handleUpdateShipment = async (id, changes) => {
    const updated = await updateShipment(id, changes);
    patch({ shipments: data.shipments.map((s) => s.id === id ? updated : s) });
    setEditing(null); setToast('تم تحديث الشحنة');
  };
  const handleDeleteShipment = async (id) => {
    await deleteShipment(id);
    patch({ shipments: data.shipments.filter((s) => s.id !== id) });
    setToast('تم حذف الشحنة');
  };
  const handleToggleService = async (title) => { patch({ services: await toggleService(title) }); setToast('تم تحديث حالة الخدمة'); };
  const handleSaveSettings = async (settings) => { patch({ settings: await saveSettings(settings) }); setToast('تم حفظ الإعدادات'); };
  const tabs = [['overview', 'نظرة عامة', 'grid-1x2'], ['shipments', 'الشحنات', 'box-seam'], ['services', 'الخدمات', 'truck'], ['customers', 'العملاء', 'people'], ['settings', 'الإعدادات', 'gear']];
  if (loading) return <main className="admin-loading"><div className="loading-spinner" /><p>جاري تحميل بيانات لوحة التحكم...</p></main>;
  return <main className="admin-layout"><aside className="admin-sidebar">
    <div className="admin-brand"><span className="brand-mark">ن</span><div><strong>NUWA</strong><small>CONTROL CENTER</small></div></div>
    <div className="admin-profile"><span>{user?.name?.charAt(0) || 'م'}</span><div><strong>{user?.name || 'مدير النظام'}</strong><small>{user?.email || 'admin@nawa.co'}</small></div></div>
    <nav>{tabs.map(([key, label, icon]) => <button className={tab === key ? 'active' : ''} onClick={() => setTab(key)} key={key}><i className={`bi bi-${icon}`} />{label}</button>)}</nav>
    <a className="admin-back" href="#home"><i className="bi bi-arrow-right" /> العودة للموقع</a>
    <button className="admin-logout" onClick={onLogout}><i className="bi bi-box-arrow-right" /> تسجيل الخروج</button>
  </aside><section className="admin-content">
    <div className="admin-topbar"><div><span className="logistics-overline">NUWA CONTROL / {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}</span><h1>{tabs.find((item) => item[0] === tab)?.[1]}</h1></div><div className="admin-tools"><button className="admin-icon" onClick={() => setToast('لديك 3 إشعارات جديدة')} aria-label="الإشعارات"><i className="bi bi-bell" /><b>3</b></button><span className="admin-avatar">{user?.name?.charAt(0) || 'م'}</span></div></div>
    {tab === 'overview' && <Overview shipments={data.shipments} stats={data.stats} onAdd={() => setShowForm(true)} onDelete={handleDeleteShipment} onEdit={(s) => setEditing(s)} />}
    {tab === 'shipments' && <ShipmentManager shipments={data.shipments} onAdd={() => setShowForm(true)} onDelete={handleDeleteShipment} onEdit={(s) => setEditing(s)} />}
    {tab === 'services' && <ServiceManager services={data.services} onToggle={handleToggleService} />}
    {tab === 'customers' && <CustomerManager customers={data.customers} />}
    {tab === 'settings' && <SettingsPanel settings={data.settings} onSave={handleSaveSettings} />}
    {showForm && <ShipmentForm value={client} setValue={setClient} onClose={() => setShowForm(false)} onSubmit={createShipment} />}
    {editing && <EditShipmentForm shipment={editing} onClose={() => setEditing(null)} onSave={handleUpdateShipment} />}
    {toast && <div className="admin-toast"><i className="bi bi-check2-circle" /> {toast}</div>}
  </section></main>;
}

function Overview({ shipments, stats, onAdd, onDelete, onEdit }) {
  return <><div className="admin-actions-row"><p>هذه نظرة سريعة على أداء شبكة نُواة اليوم.</p><button className="admin-primary" onClick={onAdd}><i className="bi bi-plus-lg" /> شحنة جديدة</button></div>
    <div className="admin-kpis"><Kpi icon="box-seam" color="blue" label="إجمالي الشحنات" value={stats.total?.toLocaleString('ar-SA')} trend="+12.4% هذا الشهر" /><Kpi icon="truck" color="orange" label="في الطريق الآن" value={stats.active} trend="+8.2% هذا الشهر" /><Kpi icon="check2-circle" color="green" label="تم التسليم" value={stats.deliveryRate} trend="+2.1% هذا الشهر" /><Kpi icon="globe2" color="purple" label="الدول النشطة" value={stats.countries} trend="+4 دول جديدة" /></div>
    <div className="admin-panels"><div className="admin-card"><CardHeading title="آخر الشحنات" note="تحديث مباشر من Mock API" action={<button onClick={onAdd}>+ إضافة</button>} /><ShipmentRows shipments={shipments.slice(0, 4)} onDelete={onDelete} onEdit={onEdit} /></div>
    <div className="admin-card performance-card"><CardHeading title="أداء التسليم" note="آخر 7 أيام" action={<span className="performance-value">{stats.deliveryRate}</span>} /><div className="mini-chart">{[42, 58, 48, 72, 66, 90, 82].map((height, i) => <span style={{ height: `${height}%` }} key={i} />)}</div><div className="chart-labels"><span>السبت</span><span>الأحد</span><span>الإثنين</span><span>الثلاثاء</span><span>الأربعاء</span><span>الخميس</span><span>اليوم</span></div></div></div></>;
}
function Kpi({ icon, color, label, value, trend }) { return <div className="kpi-card"><span className={`kpi-icon ${color}`}><i className={`bi bi-${icon}`} /></span><small>{label}</small><strong>{value}</strong><em>{trend}</em></div>; }
function CardHeading({ title, note, action }) { return <div className="card-heading"><div><h3>{title}</h3><small>{note}</small></div>{action}</div>; }
function ShipmentRows({ shipments, onDelete, onEdit }) { return <div className="shipment-list">{shipments.map((shipment) => <div className="shipment-row" key={shipment.id}><span className="shipment-code">{shipment.id}</span><div><strong>{shipment.route}</strong><small>{shipment.client}</small></div><span className={`admin-status ${shipment.tone}`}>{shipment.status}</span><div className="row-actions"><button className="row-more" onClick={() => onEdit(shipment)} aria-label="تعديل"><i className="bi bi-pencil" /></button><button className="row-more danger" onClick={() => onDelete(shipment.id)} aria-label="حذف"><i className="bi bi-trash" /></button></div></div>)}</div>; }

function ShipmentManager({ shipments, onAdd, onDelete, onEdit }) {
  const [filter, setFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const filtered = shipments.filter((s) => {
    const matchText = (s.id + s.client + s.route).includes(filter.trim());
    const matchStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchText && matchStatus;
  });
  return <div className="admin-card full-card">
    <CardHeading title="إدارة الشحنات" note={`${filtered.length} شحنات معروضة من ${shipments.length}`} action={<div className="manager-actions"><input className="manager-filter" placeholder="بحث برقم أو عميل..." value={filter} onChange={(e) => setFilter(e.target.value)} /><select className="manager-filter status-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option value="all">كل الحالات</option>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select><button className="filter-btn" onClick={() => exportCsv(shipments)}><i className="bi bi-download" /> تصدير CSV</button><button className="admin-primary" onClick={onAdd}><i className="bi bi-plus-lg" /> شحنة جديدة</button></div>} />
    <div className="shipment-table"><div className="shipment-row table-head"><span>رقم الشحنة</span><span>المسار والعميل</span><span>الحالة</span><span>إجراءات</span></div>{filtered.length ? <ShipmentRows shipments={filtered} onDelete={onDelete} onEdit={onEdit} /> : <p className="empty-state">لا توجد شحنات مطابقة</p>}</div>
  </div>;
}
function ServiceManager({ services: apiServices, onToggle }) { return <div className="admin-card full-card"><CardHeading title="الخدمات اللوجستية" note="البيانات محمّلة من Mock API — اضغط المفتاح للتفعيل/الإيقاف" action={<button className="admin-primary"><i className="bi bi-plus-lg" /> إضافة خدمة</button>} /><div className="managed-services">{apiServices.map((service, index) => <div className="managed-service" key={service.title}><span className="service-number">0{index + 1}</span><i className={`bi bi-${service.icon}`} /><div><strong>{service.title}</strong><small>{service.text}</small></div><button className={`service-toggle ${service.active ? 'active' : ''}`} onClick={() => onToggle(service.title)} role="switch" aria-checked={service.active} /><button className="row-more"><i className="bi bi-pencil" /></button></div>)}</div></div>; }
function CustomerManager({ customers }) { return <div className="admin-card full-card"><CardHeading title="العملاء" note={`${customers.length} عملاء متصلون`} action={<button className="filter-btn"><i className="bi bi-download" /> تصدير</button>} /><div className="customer-list">{customers.map((customer) => <div className="customer-row" key={customer.email}><span>{customer.name.charAt(0)}</span><div><strong>{customer.name}</strong><small>{customer.email}</small></div><em>{customer.shipments} شحنات</em><button className="row-more"><i className="bi bi-three-dots" /></button></div>)}</div></div>; }
function SettingsPanel({ settings, onSave }) {
  const [form, setForm] = useState({ company: settings.company, email: settings.email, timezone: settings.timezone, phone: settings.phone || '' });
  const change = (field) => (event) => setForm((f) => ({ ...f, [field]: event.target.value }));
  return <div className="admin-card full-card settings-panel"><CardHeading title="إعدادات الحساب" note="البيانات محمّلة من Mock API" />
    <label>اسم الشركة<input value={form.company} onChange={change('company')} /></label>
    <label>البريد الإلكتروني<input value={form.email} onChange={change('email')} type="email" /></label>
    <label>رقم الهاتف<input value={form.phone} onChange={change('phone')} dir="ltr" /></label>
    <label>المنطقة الزمنية<select value={form.timezone} onChange={change('timezone')}><option value="riyadh">الرياض (GMT+3)</option><option value="london">لندن (GMT+0)</option></select></label>
    <button className="admin-primary save-settings" onClick={() => onSave(form)}>حفظ التغييرات</button>
  </div>; }
function ShipmentForm({ value, setValue, onClose, onSubmit }) { return <div className="modal-backdrop"><form className="shipment-modal" onSubmit={(event) => onSubmit(event, { client: value, route: event.currentTarget.elements.route.value, service: event.currentTarget.elements.service.value })}><button type="button" className="modal-close" onClick={onClose}><i className="bi bi-x-lg" /></button><span className="logistics-overline">CREATE SHIPMENT</span><h2>شحنة جديدة</h2><label>اسم العميل<input required value={value} onChange={(event) => setValue(event.target.value)} placeholder="مثال: شركة المدار" /></label><label>المسار<select name="route" defaultValue="دبي ← لندن"><option>دبي ← لندن</option><option>جدة ← سنغافورة</option><option>الرياض ← باريس</option><option>الدوحة ← نيويورك</option></select></label><label>نوع الخدمة<select name="service" defaultValue="الشحن الجوي">{services.map((service) => <option key={service.title}>{service.title}</option>)}</select></label><button className="admin-primary" type="submit">إنشاء الشحنة <i className="bi bi-arrow-left" /></button></form></div>; }
function EditShipmentForm({ shipment, onClose, onSave }) {
  const [status, setStatus] = useState(shipment.status);
  const [progress, setProgress] = useState(shipment.progress || 0);
  return <div className="modal-backdrop"><form className="shipment-modal" onSubmit={(event) => { event.preventDefault(); onSave(shipment.id, { status, progress: Number(progress) }); }}><button type="button" className="modal-close" onClick={onClose}><i className="bi bi-x-lg" /></button><span className="logistics-overline">EDIT SHIPMENT</span><h2>{shipment.id}</h2><label>العميل<input disabled value={shipment.client} /></label><label>المسار<input disabled value={shipment.route} /></label><label>الحالة<select value={status} onChange={(e) => setStatus(e.target.value)}>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select></label><label>نسبة الإنجاز<input type="range" min="0" max="100" value={progress} onChange={(e) => setProgress(e.target.value)} /><span className="range-value">{progress}%</span></label><button className="admin-primary" type="submit">حفظ التغييرات <i className="bi bi-arrow-left" /></button></form></div>; }
