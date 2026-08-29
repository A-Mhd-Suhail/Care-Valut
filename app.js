/* ============================================================
   CARE VAULT v4 — Patient–Doctor Continuity Platform
   NEW: Upcoming Events page • Doctor Live Map (on-duty GPS)
   • Medicine Verification Center • ACID double-booking protection
   ============================================================ */

/* ---------- SHORT HELPERS ---------- */
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const esc = s => (s == null ? '' : String(s)).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const todayStr = () => new Date().toISOString().slice(0, 10);
const fmtD = d => { if (!d) return '—'; try { return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); } catch (e) { return d; } };
const fmtDT = t => { if (!t) return '—'; try { return new Date(t).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }); } catch (e) { return String(t); } };
const uid6 = () => Math.random().toString(36).slice(2, 8).toUpperCase();

let ME = null, ROLE = null, UNBINDS = [];
const STATE = { doctors: [], patients: [], cases: [], myReviewed: [], meds: [], reports: [], appts: [], timeline: [], consents: [], access: [], notifs: [], vitals: [], unverifiedMeds: [] };
let CURRENT_CASE = null, CHAT_WITH = null, CURRENT_APTAB = 'upcoming', CURRENT_CTAB = 'waiting', chosenSlot = null, qrDone = false, chatUnsub = null, selectedPain = null;
let dutyWatch = null, lastLocSend = 0, focusDoctorId = null, cvMap = null, markersLayer = null;

window.addEventListener('error', e => { try { toast('⚠️ ' + e.message); } catch (_) {} });
window.addEventListener('unhandledrejection', e => { try { const r = e.reason; toast('⚠️ ' + (r && r.message ? r.message : 'Unexpected error')); } catch (_) {} });

/* ---------- TOAST / MODAL ---------- */
function toast(msg) { const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; $('#toastRoot').appendChild(t); setTimeout(() => t.remove(), 3500); }
function showModal(html) { $('#modalCard').innerHTML = html + '<button class="btn ghost sm" data-act="close-modal" style="margin-top:12px">Close</button>'; $('#modalRoot').classList.remove('hidden'); }
function closeModal() { $('#modalRoot').classList.add('hidden'); }

/* ---------- FRIENDLY ERROR MESSAGES ---------- */
function errMsg(err) {
  const c = (err && err.code) ? err.code : '';
  if (c.includes('email-already-in-use')) return 'This email is already registered — please Login instead.';
  if (c.includes('invalid-email')) return 'Invalid email format.';
  if (c.includes('weak-password')) return 'Password must be at least 6 characters.';
  if (c.includes('operation-not-allowed')) return 'Firebase Console → Authentication → Sign-in method → enable Email/Password!';
  if (c.includes('unauthorized-domain')) return 'Firebase Console → Authentication → Settings → Authorized domains → add your GitHub Pages domain!';
  if (c.includes('invalid-credential') || c.includes('wrong-password') || c.includes('user-not-found')) return 'Wrong email or password.';
  if (c.includes('network')) return 'Network problem — check your internet connection.';
  if (c.includes('permission-denied')) return 'Firestore rules issue — publish the rules again.';
  return (err && err.message) ? err.message : 'Something went wrong.';
}

/* ---------- THEME / FONT ---------- */
function applyTheme(v) {
  document.documentElement.dataset.theme = v;
  localStorage.setItem('cv_theme', v);
  ['themeSelAuth', 'themeSel', 'themeSelSet'].forEach(id => { const el = document.getElementById(id); if (el) el.value = v; });
}
['themeSelAuth', 'themeSel', 'themeSelSet'].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.addEventListener('change', e => { applyTheme(e.target.value); toast('Theme changed ✅'); });
});
applyTheme(localStorage.getItem('cv_theme') || 'light');

function setFont(v) { document.body.classList.remove('font-sm', 'font-lg'); if (v === 'sm') document.body.classList.add('font-sm'); if (v === 'lg') document.body.classList.add('font-lg'); localStorage.setItem('cv_font', v); }
setFont(localStorage.getItem('cv_font') || 'md');

/* ---------- AUTH TABS ---------- */
 $('#tabLogin').onclick = () => { $('#tabLogin').classList.add('active'); $('#tabReg').classList.remove('active'); $('#formLogin').classList.remove('hidden'); $('#formReg').classList.add('hidden'); };
 $('#tabReg').onclick = () => { $('#tabReg').classList.add('active'); $('#tabLogin').classList.remove('active'); $('#formReg').classList.remove('hidden'); $('#formLogin').classList.add('hidden'); };
 $$('.reg-pill').forEach(p => p.onclick = () => {
  $$('.reg-pill').forEach(x => x.classList.remove('active')); p.classList.add('active');
  const r = p.dataset.regrole;
  $('#regPatient').classList.toggle('hidden', r !== 'patient');
  $('#regDoctor').classList.toggle('hidden', r !== 'doctor');
  $('#regHospital').classList.toggle('hidden', r !== 'hospital');
});

/* ---------- DEMO FILL ---------- */
 $$('[data-act="demo-fill"]').forEach(b => b.onclick = () => {
  $('#rpName').value = 'Arjun Kumar'; $('#rpDob').value = '1980-03-14'; $('#rpGender').value = 'Male';
  $('#rpBlood').value = 'O+'; $('#rpPhone').value = '9840012345'; $('#rpAadhaar').value = '432187651122';
  $('#rpAddress').value = '12, Gandhi Street, Anna Nagar, Chennai 600040';
  $('#rpEName').value = 'Priya Kumar (Wife)'; $('#rpEPhone').value = '9840055555';
  $('#rpHeight').value = 170; $('#rpWeight').value = 74; $('#rpIncome').value = 240000;
  $('#rpAllergies').value = 'Penicillin (medicine allergy), Dust (other)';
  $('#rpConditions').value = 'Type 2 Diabetes (2021), Hypertension (2022)';
  $('#rpSurgeries').value = 'Appendectomy | 2019 | Apollo Hospitals | Dr. Rajan | Appendicitis\nKnee Arthroscopy | 2022 | Kauvery Hospital | Dr. Menon | Meniscus tear';
  $('#rpAccidents').value = 'Two-wheeler accident 2016 — right arm fracture, treated at Kauvery Hospital';
  $('#rpFamily').value = 'Father — Diabetes; Grandmother — Hypertension';
  $('#rpEmail').value = 'arjun.demo' + Math.floor(Math.random() * 9000) + '@carevault.in'; $('#rpPass').value = 'demo123';
  toast('Demo data filled ✅ — now press "Create Health ID"');
});

/* ---------- REGISTER ---------- */
 $('#formReg').addEventListener('submit', async e => {
  e.preventDefault();
  const role = $('.reg-pill.active').dataset.regrole;
  try {
    let email, pass, profile;
    if (role === 'patient') {
      const name = $('#rpName').value.trim(), dob = $('#rpDob').value, phone = $('#rpPhone').value.trim();
      const aad = $('#rpAadhaar').value.replace(/\D/g, '');
      email = $('#rpEmail').value.trim(); pass = $('#rpPass').value;
      if (!name || !dob || !phone) return toast('⚠️ Name, Date of Birth and Phone are required.');
      if (aad.length !== 12) return toast('⚠️ Aadhaar must be exactly 12 digits.');
      if (!email || pass.length < 6) return toast('⚠️ Email and a 6+ character password are required.');
      profile = { role: 'patient', name, dob, gender: $('#rpGender').value, bloodGroup: $('#rpBlood').value, phone, aadhaar: aad,
        address: $('#rpAddress').value.trim(), emergencyName: $('#rpEName').value.trim(), emergencyPhone: $('#rpEPhone').value.trim(),
        heightCm: $('#rpHeight').value, weightKg: $('#rpWeight').value, allergies: $('#rpAllergies').value.trim(),
        conditions: $('#rpConditions').value.trim(), surgeries: $('#rpSurgeries').value.trim(), accidents: $('#rpAccidents').value.trim(),
        familyHistory: $('#rpFamily').value.trim(), income: $('#rpIncome').value, language: $('#rpLang').value };
    } else if (role === 'doctor') {
      email = $('#rdEmail').value.trim(); pass = $('#rdPass').value;
      if (!$('#rdName').value.trim() || !$('#rdSpec').value.trim() || !$('#rdHospital').value.trim() || !$('#rdReg').value.trim()) return toast('⚠️ Please fill all required doctor fields.');
      if (!email || pass.length < 6) return toast('⚠️ Email and a 6+ character password are required.');
      profile = { role: 'doctor', name: $('#rdName').value.trim(), specialization: $('#rdSpec').value.trim(),
        experience: $('#rdExp').value, hospital: $('#rdHospital').value.trim(), regNo: $('#rdReg').value.trim(), phone: $('#rdPhone').value.trim(), onDuty: false };
    } else {
      email = $('#rhEmail').value.trim(); pass = $('#rhPass').value;
      if (!$('#rhName').value.trim() || !$('#rhAdmin').value.trim()) return toast('⚠️ Hospital name and admin name are required.');
      if (!email || pass.length < 6) return toast('⚠️ Email and a 6+ character password are required.');
      profile = { role: 'hospital', name: $('#rhName').value.trim(), adminName: $('#rhAdmin').value.trim(),
        phone: $('#rhPhone').value.trim(), address: $('#rhAddress').value.trim(), licenseNo: $('#rhLicense').value.trim() };
    }
    const cred = await auth.createUserWithEmailAndPassword(email, pass);
    profile.email = email; profile.createdAt = Date.now();
    if (role === 'patient') profile.healthId = 'CV-' + uid6();
    try { await db.collection('users').doc(cred.user.uid).set(profile); }
    catch (dbErr) { await cred.user.delete().catch(() => {}); return toast('⚠️ Firestore issue: ' + errMsg(dbErr)); }
    toast('✅ Welcome to Care Vault!' + (profile.healthId ? ' Your Health ID: ' + profile.healthId : ''));
  } catch (err) { toast('⚠️ ' + errMsg(err)); }
});

/* ---------- LOGIN / LOGOUT ---------- */
 $('#formLogin').addEventListener('submit', async e => {
  e.preventDefault();
  try { await auth.signInWithEmailAndPassword($('#loginEmail').value.trim(), $('#loginPass').value); }
  catch (err) { toast('⚠️ ' + errMsg(err)); }
});
async function doLogout() {
  try { if (ROLE === 'doctor' && ME && ME.onDuty) { await db.collection('users').doc(ME.id).update({ onDuty: false, location: firebase.firestore.FieldValue.delete() }); } } catch (e) {}
  if (dutyWatch) { navigator.geolocation.clearWatch(dutyWatch); dutyWatch = null; }
  if (chatUnsub) { chatUnsub(); chatUnsub = null; }
  UNBINDS.forEach(u => { try { u(); } catch (e) {} }); UNBINDS = [];
  ME = null; ROLE = null;
  await auth.signOut().catch(() => {});
  location.reload();
}

/* ---------- AUTH STATE ---------- */
auth.onAuthStateChanged(async user => {
  if (!user) { $('#screen-auth').classList.remove('hidden'); $('#app').classList.add('hidden'); return; }
  try {
    const doc = await db.collection('users').doc(user.uid).get();
    if (!doc.exists) { toast('Profile missing — please register again.'); await auth.signOut(); return; }
    ME = { id: user.uid, ...doc.data() };
    ROLE = ME.role;
    const sel = $('#loginRole').value;
    if (sel && sel !== ROLE) toast('ℹ️ That is not a ' + sel + ' account — this is a ' + ROLE + ' account. Continuing.');
    enterApp();
  } catch (err) { toast('⚠️ ' + errMsg(err)); }
});

/* ---------- NAV / ROUTING ---------- */
const MENUS = {
  patient: [['p-dash', '🏠 Dashboard'], ['p-upcoming', '🗓️ Upcoming Events'], ['p-newcase', '📝 New Case'], ['p-case', '📋 My Case'], ['p-meds', '💊 Medicines'], ['p-reports', '🧪 Reports'], ['p-appts', '📅 Appointments'], ['p-doctors', '👨‍⚕️ My Doctors'], ['p-map', '🗺️ Doctor Map'], ['p-timeline', '🕐 Timeline'], ['p-vitals', '📈 Health Tracking'], ['p-qr', '📱 My QR'], ['p-consent', '🔐 Consent Center'], ['p-access', '👁️ Access History'], ['p-notifs', '🔔 Notifications'], ['p-settings', '⚙️ Settings'], ['EMERGENCY', '🚑 Emergency']],
  doctor: [['d-dash', '🏠 Dashboard'], ['d-cases', '📋 Cases'], ['d-verify', '💊 Verify Medicines'], ['d-patients', '🔍 Patients'], ['d-appts', '📅 Appointments'], ['p-notifs', '🔔 Notifications'], ['p-settings', '⚙️ Settings']],
  hospital: [['h-dash', '🏥 Dashboard'], ['h-doctors', '👨‍⚕️ Doctors'], ['h-appts', '📅 Appointments'], ['h-upload', '🧪 Upload Report'], ['p-notifs', '🔔 Notifications'], ['p-settings', '⚙️ Settings']]
};
const TITLES = { 'p-dash': 'Dashboard', 'p-upcoming': 'Upcoming Events', 'p-newcase': 'Case-Taking', 'p-case': 'My Case', 'p-meds': 'My Medicines', 'p-reports': 'My Reports', 'p-appts': 'Appointments', 'p-doctors': 'My Doctors', 'p-map': 'Doctor Map', 'p-timeline': 'Medical Timeline', 'p-vitals': 'Health Tracking', 'p-qr': 'My QR', 'p-consent': 'Consent Center', 'p-access': 'Access History', 'p-notifs': 'Notifications', 'p-settings': 'Settings', 'd-dash': 'Doctor Dashboard', 'd-cases': 'Cases', 'd-verify': 'Medicine Verification', 'd-case': 'Case Review', 'd-patients': 'Patients', 'd-appts': 'My Appointments', 'h-dash': 'Hospital Dashboard', 'h-doctors': 'Doctors', 'h-appts': 'Appointments', 'h-upload': 'Upload Report' };

function buildNav() {
  const nav = $('#sideNav'); nav.innerHTML = '';
  MENUS[ROLE].forEach(([id, label]) => {
    const b = document.createElement('button'); b.className = 'nav-item' + (id === 'EMERGENCY' ? ' danger' : ''); b.dataset.nav = id;
    b.innerHTML = label; nav.appendChild(b);
  });
  $('#sideRole').textContent = ROLE === 'patient' ? 'Patient Portal' : ROLE === 'doctor' ? 'Doctor Portal' : 'Hospital Portal';
  $('#sideName').textContent = ME.name || '—';
  $('#sideSub').textContent = ROLE === 'patient' ? (ME.healthId || '') : (ME.specialization || ME.name);
  $('#sideAvatar').textContent = ROLE === 'patient' ? '🧑' : ROLE === 'doctor' ? '👨‍⚕️' : '🏥';
  $('#cbFab').classList.toggle('hidden', ROLE !== 'patient');
  $('#topSearch').classList.toggle('hidden', ROLE !== 'patient');
}

document.addEventListener('click', e => {
  const nv = e.target.closest('[data-nav]'); if (!nv) return;
  if (nv.tagName === 'A') e.preventDefault();
  const id = nv.dataset.nav;
  if (id === 'EMERGENCY') { openEmergency(false); return; }
  go(id);
});

function go(id) {
  $$('.page').forEach(p => p.classList.add('hidden'));
  const pg = $('#pg-' + id); if (pg) pg.classList.remove('hidden');
  $$('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.nav === id));
  $('#pageTitle').textContent = TITLES[id] || 'Care Vault';
  $('#sidebar').classList.remove('open');
  const hooks = {
    'p-dash': () => renderPatientDash(), 'p-upcoming': () => renderUpcoming(), 'p-case': () => renderMyCase(), 'p-newcase': () => autofillCase(),
    'p-meds': () => renderMeds(), 'p-reports': () => renderReports(), 'p-appts': () => { renderAppts(); loadTakenSlots(); },
    'p-doctors': () => renderDoctorsPage(), 'p-map': () => renderDoctorMap(), 'p-timeline': () => renderTimeline(), 'p-vitals': () => renderVitals(),
    'p-qr': () => renderQR(), 'p-consent': () => renderConsent(), 'p-access': () => renderAccess(), 'p-settings': () => renderSettings(),
    'd-dash': () => renderDocDash(), 'd-cases': () => renderDoctorCases(), 'd-verify': () => renderVerifyMeds(), 'd-patients': () => renderPatients(), 'd-appts': () => renderDocAppts(),
    'h-dash': () => renderHospital(), 'h-doctors': () => renderHospital(), 'h-appts': () => renderHospital()
  };
  if (hooks[id]) { try { hooks[id](); } catch (e) { console.error(e); } }
}
document.addEventListener('click', e => {
  if (e.target.closest('[data-act="go-settings"]')) go('p-settings');
  if (e.target.closest('[data-act="burger"]')) $('#sidebar').classList.toggle('open');
  if (e.target.closest('[data-act="logout"]')) doLogout();
});

function enterApp() {
  $('#screen-auth').classList.add('hidden'); $('#app').classList.remove('hidden');
  buildNav();
  if (ROLE === 'patient') localStorage.setItem('cv_emergency', JSON.stringify(ME));
  const h = new Date().getHours();
  const greet = h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening';
  if (ROLE === 'patient') { $('#dGreet').textContent = greet + ', ' + ME.name + ' 👋'; $('#dHid').textContent = ME.healthId; bindPatient(); go('p-dash'); }
  if (ROLE === 'doctor') {
    // Privacy: location sharing always starts OFF on a fresh session — the doctor must press "Go On Duty"
    db.collection('users').doc(ME.id).update({ onDuty: false, location: firebase.firestore.FieldValue.delete() }).catch(() => {});
    ME.onDuty = false; ME.location = null;
    $('#dGreetDoc').textContent = greet + ', Dr. ' + ME.name + ' 🩺';
    bindDoctor(); go('d-dash');
  }
  if (ROLE === 'hospital') { bindHospital(); go('h-dash'); }
  bindNotifs();
}

/* ---------- NOTIFICATIONS ---------- */
function notify(to, title, body) { return db.collection('notifications').add({ to, title, body, read: false, createdAt: Date.now() }); }
function notifyRole(role, title, body) { return notify('role:' + role, title, body); }
function bindNotifs() {
  UNBINDS.push(db.collection('notifications').where('to', 'in', [ME.id, 'role:' + ROLE]).onSnapshot(snap => {
    STATE.notifs = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => b.createdAt - a.createdAt);
    const unread = STATE.notifs.filter(n => !n.read).length;
    $('#bellDot').classList.toggle('hidden', unread === 0);
    const list = STATE.notifs.slice(0, 12).map(n => '<div class="list-item"><div class="li-main"><b>' + esc(n.title) + '</b><small>' + esc(n.body) + ' • ' + fmtDT(n.createdAt) + '</small></div></div>').join('') || '<p class="muted">No notifications yet.</p>';
    $('#bellDrop').innerHTML = '<b style="padding:6px">🔔 Notifications</b>' + list + '<button class="btn ghost sm" data-act="go-notifs" style="width:100%;margin-top:6px">View all</button>';
    const nl = $('#notifList'); if (nl) nl.innerHTML = list;
  }, err => console.error(err)));
}
document.addEventListener('click', e => {
  if (e.target.closest('[data-act="bell"]')) { $('#bellDrop').classList.toggle('hidden'); return; }
  if (!e.target.closest('.bell-drop') && !e.target.closest('.bell')) $('#bellDrop').classList.add('hidden');
  if (e.target.closest('[data-act="go-notifs"]')) { $('#bellDrop').classList.add('hidden'); go('p-notifs'); }
  if (e.target.closest('[data-act="mark-read"]')) {
    STATE.notifs.filter(n => !n.read).forEach(n => db.collection('notifications').doc(n.id).update({ read: true }).catch(() => {}));
    toast('All notifications marked as read ✅');
  }
});

/* ---------- ACCESS LOG ---------- */
function logAccess(patientId, action) {
  return db.collection('accessLog').add({ patientId, actorName: (ROLE === 'doctor' ? 'Dr. ' : '') + ME.name, actorRole: ROLE, action, createdAt: Date.now() }).catch(() => {});
}

/* ============================================================
   PATIENT
   ============================================================ */
function bindPatient() {
  const pid = ME.id;
  UNBINDS.push(db.collection('cases').where('patientId', '==', pid).onSnapshot(s => { STATE.cases = s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => b.createdAt - a.createdAt); renderCaseStatus(); renderPatientDash(); }, console.error));
  UNBINDS.push(db.collection('medicines').where('patientId', '==', pid).onSnapshot(s => { STATE.meds = s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => b.createdAt - a.createdAt); renderMeds(); renderPatientDash(); renderVitals(); renderUpcoming(); }, console.error));
  UNBINDS.push(db.collection('reports').where('patientId', '==', pid).onSnapshot(s => { STATE.reports = s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => b.createdAt - a.createdAt); renderReports(); renderPatientDash(); }, console.error));
  UNBINDS.push(db.collection('appointments').where('patientId', '==', pid).onSnapshot(s => { STATE.appts = s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (b.date || '').localeCompare(a.date || '')); renderAppts(); renderPatientDash(); renderVitals(); renderUpcoming(); }, console.error));
  UNBINDS.push(db.collection('timeline').where('patientId', '==', pid).onSnapshot(s => { STATE.timeline = s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (b.date || '').localeCompare(a.date || '')); renderTimeline(); renderPatientDash(); renderVitals(); renderUpcoming(); }, console.error));
  UNBINDS.push(db.collection('accessLog').where('patientId', '==', pid).onSnapshot(s => { STATE.access = s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => b.createdAt - a.createdAt); renderAccess(); }, console.error));
  UNBINDS.push(db.collection('vitals').where('patientId', '==', pid).onSnapshot(s => { STATE.vitals = s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => b.createdAt - a.createdAt); renderVitals(); }, console.error));
  // Live doctor list (for dropdown, map, consent, my-doctors)
  UNBINDS.push(db.collection('users').where('role', '==', 'doctor').onSnapshot(s => {
    STATE.doctors = s.docs.map(d => ({ id: d.id, ...d.data() }));
    renderDoctorDropdown(); renderConsent(); renderDoctorsPage(); renderDoctorMap();
  }, console.error));
  loadDoctors();
}

async function loadDoctors() {
  try {
    const s = await db.collection('users').where('role', '==', 'doctor').get();
    STATE.doctors = s.docs.map(d => ({ id: d.id, ...d.data() }));
    const c = await db.collection('consents').where('patientId', '==', ME.id).get();
    STATE.consents = c.docs.map(d => ({ id: d.id, ...d.data() }));
    renderDoctorDropdown(); renderConsent(); renderDoctorsPage();
  } catch (e) { console.error(e); }
}

/* ----- DASHBOARD ----- */
function renderPatientDash() {
  if (ROLE !== 'patient' || !ME) return;
  const lastCase = STATE.cases.find(c => c.status === 'reviewed');
  const nextAppt = STATE.appts.filter(a => a.status === 'upcoming' && a.date >= todayStr()).sort((a, b) => a.date.localeCompare(b.date))[0];
  $('#healthOverview').innerHTML = [
    ['🩸 Blood Group', ME.bloodGroup || '—'],
    ['⚠️ Allergies', ME.allergies || 'None recorded'],
    ['💊 Active Medicines', STATE.meds.filter(m => m.active !== false).length + ' active'],
    ['🏥 Major Conditions', ME.conditions || 'None recorded'],
    ['🩺 Last Consultation', lastCase ? fmtDT(lastCase.reviewedAt) + ' — Dr. ' + lastCase.doctorName : '—'],
    ['📅 Next Follow-up', nextAppt ? fmtD(nextAppt.date) + ' ' + nextAppt.time : '—']
  ].map(([k, v]) => '<div class="krow"><span>' + k + '</span><b>' + esc(v) + '</b></div>').join('');

  const latest = STATE.cases[0];
  const rb = $('#reviewBanner');
  if (latest && latest.status === 'reviewed') { rb.className = 'banner'; rb.innerHTML = '✅ Doctor Reviewed Your Case — Dr. ' + esc(latest.doctorName) + ' verified it and added clinical information. <a href="#" data-nav="p-case" style="color:inherit;text-decoration:underline">Open</a>'; }
  else if (latest) { rb.className = 'banner amber'; rb.innerHTML = '🟡 Waiting for Doctor Review — case submitted on ' + fmtDT(latest.createdAt); }
  else rb.className = 'banner hidden';

  const fb = $('#followBanner');
  const fu = STATE.timeline.find(t => t.type === 'followup' && t.due && t.due >= todayStr());
  if (fu) { fb.className = 'banner amber'; fb.innerHTML = '🔔 Follow-up Reminder: ' + esc(fu.title) + ' — due on ' + fmtD(fu.due); } else fb.className = 'banner hidden';

  $('#medMini').innerHTML = STATE.meds.slice(0, 4).map(m => '<li><span>' + esc(m.name) + ' <small class="muted">' + esc(m.dosage || '') + '</small></span>' + (m.verified ? '<span class="chip green">Verified ✓</span>' : '<span class="chip amber">Pending</span>') + '</li>').join('') || '<li class="muted">No medicines yet</li>';
  $('#repMini').innerHTML = STATE.reports.slice(0, 4).map(r => '<li><span>' + esc(r.title) + '</span><small class="muted">' + fmtD(r.date) + '</small></li>').join('') || '<li class="muted">No reports yet</li>';
  $('#nextApptCard').innerHTML = nextAppt ? '<div class="krow"><span>👨‍⚕️ ' + esc(nextAppt.doctorName) + '</span></div><div class="krow"><span>🏥 ' + esc(nextAppt.hospital || '') + '</span></div><div class="krow"><span>📅 ' + fmtD(nextAppt.date) + ' • ' + esc(nextAppt.time) + '</span></div><div class="krow"><span>Status</span><b>' + esc(nextAppt.status) + '</b></div>' : 'No upcoming appointments.';

  $('#schemeList').innerHTML = schemeCheck().map(s => '<div class="krow"><span>🏛️ ' + esc(s.title) + '</span><b class="green">' + esc(s.why) + '</b></div>').join('') + '<small class="muted">AI-assisted demo check — for official confirmation, use the hospital / government portal.</small>';

  const fields = ['name', 'dob', 'gender', 'phone', 'aadhaar', 'bloodGroup', 'address', 'emergencyName', 'allergies', 'conditions'];
  const filled = fields.filter(f => ME[f] && String(ME[f]).trim()).length;
  const profilePct = Math.round(filled / fields.length * 100);
  const docsPct = Math.min(100, STATE.reports.length * 20);
  const vm = STATE.meds.length ? Math.round(STATE.meds.filter(m => m.verified).length / STATE.meds.length * 100) : 100;
  $('#careBars').innerHTML = pbar('Profile', profilePct) + pbar('Documents', docsPct) + pbar('Verification', vm) + pbar('Follow-up', fu ? 60 : 100);
}
function pbar(label, pct) { return '<div class="pbar"><div class="p-top"><span>' + label + '</span><span>' + pct + '%</span></div><div class="p-track"><div class="p-fill" style="width:' + pct + '%"></div></div></div>'; }

/* ----- AI SCHEME CHECK (rule-based demo) ----- */
function schemeCheck() {
  const out = [];
  const age = ME.dob ? Math.floor((Date.now() - new Date(ME.dob)) / 31557600000) : null;
  const cond = (ME.conditions || '').toLowerCase();
  if (age != null && !isNaN(age) && age >= 60) out.push({ title: 'Senior Citizen Health Scheme', why: 'Age ' + age + ' ≥ 60' });
  if (ME.income && Number(ME.income) < 250000) out.push({ title: 'Income-based Health Insurance (CM Scheme)', why: 'Income ≤ ₹2.5L' });
  if (cond.includes('diabet') || cond.includes('hypertens')) out.push({ title: 'NCD Screening & Treatment Coverage', why: 'Chronic condition on record' });
  if (ME.gender === 'Female' && age != null && age >= 15 && age <= 45) out.push({ title: 'Mother & Child Health Programme', why: 'Eligible age group' });
  if (ME.aadhaar) out.push({ title: 'ABHA-linked digital health benefits', why: 'Aadhaar linked ✓' });
  if (!out.length) out.push({ title: 'No auto-detected schemes', why: 'Complete your profile for a better check' });
  return out;
}

/* ----- CASE FORM ----- */
function autofillCase() {
  if (ROLE !== 'patient') return;
  if (!$('#ncExisting').value) $('#ncExisting').value = ME.conditions || '';
  if (!$('#ncMeds').value) $('#ncMeds').value = STATE.meds.filter(m => m.active !== false).map(m => m.name + ' (' + (m.dosage || '') + ')').join(', ');
  if (!$('#ncAllergy').value) $('#ncAllergy').value = ME.allergies || '';
  if (!$('#ncSurgery').value) $('#ncSurgery').value = ME.surgeries || '';
  if (!$('#ncFamily').value) $('#ncFamily').value = ME.familyHistory || '';
}
 $$('#ncAreas .chip').forEach(c => c.addEventListener('click', () => { $$('#ncAreas .chip').forEach(x => x.classList.remove('active')); c.classList.add('active'); }));

document.addEventListener('click', async e => {
  if (!e.target.closest('[data-act="submit-case"]')) return;
  const complaint = $('#ncComplaint').value.trim();
  if (!complaint) return toast('⚠️ Please fill the Chief Complaint.');
  const area = $('#ncAreas .chip.active');
  try {
    await db.collection('cases').add({
      patientId: ME.id, patientName: ME.name, healthId: ME.healthId,
      chiefComplaint: complaint, symptoms: $('#ncSymptoms').value.trim(), area: area ? area.dataset.area : '',
      duration: $('#ncDuration').value.trim(), severity: $('#ncSeverity').value,
      prevTreatment: $('#ncPrevTx').value.trim(), existing: $('#ncExisting').value.trim(),
      currentMeds: $('#ncMeds').value.trim(), allergyNote: $('#ncAllergy').value.trim(),
      surgeryNote: $('#ncSurgery').value.trim(), familyHistory: $('#ncFamily').value.trim(), other: $('#ncOther').value.trim(),
      status: 'waiting', createdAt: Date.now()
    });
    await db.collection('timeline').add({ patientId: ME.id, date: todayStr(), type: 'case', icon: '📝', title: 'Case Submitted', description: complaint, createdAt: Date.now() });
    await notifyRole('doctor', '🟡 New Case Submitted', ME.name + ' (' + ME.healthId + ') submitted a case: ' + complaint);
    $('#ncComplaint').value = '';
    toast('✅ Case submitted! Status: 🟡 Waiting for Doctor Review');
    renderCaseStatus(); go('p-case');
  } catch (err) { toast('⚠️ ' + errMsg(err)); }
});

function renderCaseStatus() {
  if (ROLE !== 'patient') return;
  const c = STATE.cases[0];
  const html = !c ? '<div class="card muted">No cases yet — submit your first case from the "New Case" page.</div>' :
    '<div class="card"><h4>Latest Case</h4><div class="kv">' +
    '<div class="krow"><span>Status</span><b>' + (c.status === 'reviewed' ? '🟩 Reviewed by Dr. ' + esc(c.doctorName || '') : '🟡 Waiting for Doctor Review') + '</b></div>' +
    '<div class="krow"><span>Chief Complaint</span><b>' + esc(c.chiefComplaint) + '</b></div>' +
    (c.status === 'reviewed' ?
      '<div class="krow"><span>🟩 Clinical Notes</span><b>' + esc(c.doctorNotes || '—') + '</b></div>' +
      '<div class="krow"><span>🟩 Observations</span><b>' + esc(c.observations || '—') + '</b></div>' +
      '<div class="krow"><span>🟩 Prescription</span><b>' + esc(c.prescriptionText || '—') + '</b></div>' +
      '<div class="krow"><span>🟩 Recommended Tests</span><b>' + esc(c.tests || '—') + '</b></div>' +
      '<div class="krow"><span>🟩 Follow-up</span><b>' + (c.followupDays ? 'after ' + esc(c.followupDays) + ' days' : '—') + '</b></div>' : '') +
    '</div><small class="muted">🟦 = patient reported • 🟩 = doctor verified (shared by the doctor)</small></div>';
  const el1 = $('#caseStatusCard'); if (el1) el1.innerHTML = html;
  const el2 = $('#myCaseStatus'); if (el2) el2.innerHTML = html;
}

/* ----- MY CASE ----- */
const kvRows = rows => rows.map(([k, v]) => '<div class="krow"><span>' + k + '</span><b>' + esc(v || '—') + '</b></div>').join('');
function ageOf(dob) { if (!dob) return '—'; const a = Math.floor((Date.now() - new Date(dob)) / 31557600000); return isNaN(a) ? '—' : a + 'y'; }

function renderMyCase() {
  if (ROLE !== 'patient') return;
  $('#secPersonal').innerHTML = kvRows([['Name', ME.name], ['DOB / Age', (ME.dob || '—') + ' (' + ageOf(ME.dob) + ')'], ['Gender', ME.gender], ['Contact', ME.phone], ['Address', ME.address], ['Emergency Contact', (ME.emergencyName || '') + ' ' + (ME.emergencyPhone || '')], ['Aadhaar', ME.aadhaar ? 'XXXX XXXX ' + String(ME.aadhaar).slice(-4) : '—'], ['Health ID', ME.healthId]]);
  $('#secMedical').innerHTML = kvRows([['Existing Conditions', ME.conditions || 'None'], ['Previous Illnesses / Accidents', ME.accidents || 'None'], ['Family History', ME.familyHistory || '—'], ['Lifestyle notes', '—']]);
  $('#secAllergy').innerHTML = kvRows([['Medicine Allergies', ME.allergies || 'None recorded'], ['Food / Other', 'Included above if recorded']]);
  $('#secSurgery').innerHTML = (ME.surgeries || 'No surgeries recorded').split('\n').filter(Boolean).map(s => '<div class="krow"><span>🔪 ' + esc(s) + '</span></div>').join('');
  $('#secMeds').innerHTML = STATE.meds.map(m => '<li><span>' + esc(m.name) + ' <small class="muted">' + esc(m.dosage || '') + ' • ' + esc(m.prescribedBy || '') + '</small></span>' + (m.verified ? '<span class="chip green">🟩 Doctor verified ✓</span>' : '<span class="chip blue">🟦 Patient reported</span>') + '</li>').join('') || '<li class="muted">—</li>';
  $('#secVisits').innerHTML = STATE.timeline.filter(t => t.type === 'case' || t.type === 'consult').map(t => '<li><span>' + (t.icon || '🏥') + ' ' + esc(t.title) + ' <small class="muted">' + esc(t.description || '') + '</small></span><small class="muted">' + fmtD(t.date) + '</small></li>').join('') || '<li class="muted">No visits yet</li>';
}

/* ----- MEDICINES ----- */
function renderMeds() {
  const el = $('#medList'); if (!el || ROLE !== 'patient') return;
  el.innerHTML = STATE.meds.map(m =>
    '<div class="list-item"><div class="li-main"><b>' + esc(m.name) + '</b>' +
    '<small>' + esc(m.dosage || '') + ' • Start ' + fmtD(m.startDate) + (m.durationDays ? ' • ' + esc(m.durationDays) + ' days' : '') + ' • ' + esc(m.prescribedBy || '') + '</small></div>' +
    '<div class="li-actions">' + (m.verified ? '<span class="chip green">🟩 Doctor Verified ✓' + (m.verifiedBy ? ' ' + esc(m.verifiedBy) : '') + '</span>' : '<span class="chip amber">🟦 Pending verification</span>') +
    '<button class="btn ghost sm" data-act="stop-med" data-id="' + m.id + '">' + (m.active === false ? 'Restart' : 'Stop') + '</button></div></div>').join('') || '<p class="muted">No medicines added yet.</p>';
}
document.addEventListener('click', async e => {
  if (e.target.closest('[data-act="add-med"]')) {
    const name = $('#mName').value.trim(); if (!name) return toast('⚠️ Medicine name is required.');
    try {
      await db.collection('medicines').add({ patientId: ME.id, name, dosage: $('#mDose').value.trim(), startDate: $('#mStart').value || todayStr(), durationDays: $('#mDur').value, prescribedBy: ME.name + ' (self-reported)', verified: false, source: 'patient', active: true, createdAt: Date.now() });
      $('#mName').value = ''; $('#mDose').value = ''; $('#mDur').value = '';
      toast('Added — doctor verification pending 🟡');
    } catch (err) { toast('⚠️ ' + errMsg(err)); }
  }
  const sm = e.target.closest('[data-act="stop-med"]');
  if (sm) { const m = STATE.meds.find(x => x.id === sm.dataset.id); if (m) { await db.collection('medicines').doc(m.id).update({ active: m.active === false }); toast('Updated ✅'); } }
});

/* ----- REPORTS ----- */
function renderReports() {
  const el = $('#repList'); if (!el || ROLE !== 'patient') return;
  el.innerHTML = STATE.reports.map(r =>
    '<div class="list-item"><div class="li-main"><b>' + esc(r.title) + '</b>' +
    '<small>' + esc(r.type) + ' • ' + fmtD(r.date) + ' • ' + esc(r.hospital || '') + (r.doctor ? ' • ' + esc(r.doctor) : '') + '</small></div>' +
    '<div class="li-actions">' + (r.verified ? '<span class="chip green">Verified ✓</span>' : '<span class="chip blue">🟦 Self-uploaded</span>') + '</div></div>').join('') || '<p class="muted">Vault is empty.</p>';
}
document.addEventListener('click', async e => {
  if (!e.target.closest('[data-act="add-report"]')) return;
  const t = $('#rTitle').value.trim(); if (!t) return toast('⚠️ Title is required.');
  try {
    await db.collection('reports').add({ patientId: ME.id, title: t, type: $('#rType').value, date: $('#rDate').value || todayStr(), hospital: $('#rHospital').value.trim(), doctor: $('#rDoctor').value.trim(), note: $('#rNote').value.trim(), verified: false, uploadedBy: ME.name, uploadedByRole: 'patient', createdAt: Date.now() });
    await db.collection('timeline').add({ patientId: ME.id, date: todayStr(), type: 'report', icon: '🧪', title: t, description: $('#rType').value, createdAt: Date.now() });
    $('#rTitle').value = ''; toast('Saved to vault ✅');
  } catch (err) { toast('⚠️ ' + errMsg(err)); }
});

/* ----- APPOINTMENTS (with ACID double-booking protection) ----- */
const SLOTS = ['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM', '04:00 PM', '04:30 PM', '05:00 PM'];
function renderDoctorDropdown() {
  const d = $('#apDoctor'); if (!d) return;
  const cur = d.value;
  d.innerHTML = STATE.doctors.map(x => '<option value="' + x.id + '" data-name="Dr. ' + esc(x.name) + '" data-dept="' + esc(x.specialization || '') + '" data-hosp="' + esc(x.hospital || '') + '">Dr. ' + esc(x.name) + ' — ' + esc(x.specialization || '') + ' (' + esc(x.hospital || '') + ')</option>').join('') || '<option value="">No doctors registered yet</option>';
  if (cur) d.value = cur;
  const ad = $('#apDate'); if (ad && !ad.min) ad.min = todayStr();
  $('#apSlots').innerHTML = SLOTS.map(s => '<button type="button" class="chip" data-slot="' + s + '">' + s + '</button>').join('');
  $$('#apSlots .chip').forEach(c => c.onclick = () => { if (c.disabled) return; $$('#apSlots .chip').forEach(x => x.classList.remove('active')); c.classList.add('active'); chosenSlot = c.dataset.slot; });
  loadTakenSlots();
}
async function loadTakenSlots() {
  if (ROLE !== 'patient') return;
  const dsel = $('#apDoctor') && $('#apDoctor').selectedOptions[0];
  const date = $('#apDate') ? $('#apDate').value : '';
  const chips = $$('#apSlots .chip');
  if (!dsel || !dsel.value || !date) { chips.forEach(c => { c.classList.remove('taken'); c.disabled = false; }); return; }
  try {
    const s = await db.collection('appointments').where('doctorId', '==', dsel.value).get();
    const taken = new Set(s.docs.map(x => x.data()).filter(a => a.date === date && a.status === 'upcoming').map(a => a.time));
    chips.forEach(c => { if (taken.has(c.dataset.slot)) { c.classList.add('taken'); c.disabled = true; c.title = 'Already booked'; } else { c.classList.remove('taken'); c.disabled = false; c.title = ''; } });
  } catch (e) { console.error(e); }
}
const apDocEl = $('#apDoctor'); if (apDocEl) apDocEl.addEventListener('change', loadTakenSlots);
const apDateEl = $('#apDate'); if (apDateEl) apDateEl.addEventListener('change', loadTakenSlots);

document.addEventListener('click', async e => {
  if (!e.target.closest('[data-act="book-appt"]')) return;
  const dsel = $('#apDoctor').selectedOptions[0];
  if (!dsel || !dsel.value) return toast('⚠️ No doctor available — register a doctor account first (for the demo).');
  const date = $('#apDate').value;
  if (!date) return toast('⚠️ Please select a date.');
  if (!chosenSlot) return toast('⚠️ Please select a time slot.');
  // 🛡️ ACID TRANSACTION: unique slot lock (doctor+date+time). First booking wins; the second gets an instant error.
  const slotId = (dsel.value + '_' + date + '_' + chosenSlot).replace(/[^a-zA-Z0-9]/g, '_');
  const slotRef = db.collection('slots').doc(slotId);
  const apptRef = db.collection('appointments').doc();
  try {
    await db.runTransaction(async tx => {
      const sd = await tx.get(slotRef);
      if (sd.exists) throw new Error('SLOT_TAKEN');
      tx.set(slotRef, { doctorId: dsel.value, date, time: chosenSlot, patientId: ME.id, bookedAt: Date.now() });
      tx.set(apptRef, { patientId: ME.id, patientName: ME.name, healthId: ME.healthId, doctorId: dsel.value, doctorName: dsel.dataset.name, department: dsel.dataset.dept, hospital: dsel.dataset.hosp, date, time: chosenSlot, type: $('#apType').value, reason: $('#apReason').value.trim(), status: 'upcoming', createdAt: Date.now() });
    });
    await notify(dsel.value, '📅 New Appointment', ME.name + ' booked ' + fmtD(date) + ' at ' + chosenSlot);
    await notify(ME.id, '✅ Appointment Confirmed', dsel.dataset.name + ' — ' + fmtD(date) + ' ' + chosenSlot);
    $('#apReason').value = '';
    loadTakenSlots();
    toast('✅ Appointment Booked!');
  } catch (err) {
    if (err && err.message === 'SLOT_TAKEN') { toast('⛔ That slot was just booked by another patient. Please pick a different time.'); loadTakenSlots(); }
    else toast('⚠️ ' + errMsg(err));
  }
});
 $$('[data-aptab]').forEach(t => t.onclick = () => { $$('[data-aptab]').forEach(x => x.classList.remove('active')); t.classList.add('active'); CURRENT_APTAB = t.dataset.aptab; renderAppts(); });
function renderAppts() {
  const el = $('#apList'); if (!el || ROLE !== 'patient') return;
  const list = STATE.appts.filter(a => a.status === CURRENT_APTAB);
  el.innerHTML = list.map(a =>
    '<div class="list-item"><div class="li-main"><b>' + esc(a.doctorName || 'Doctor') + ' • ' + esc(a.time || '') + '</b>' +
    '<small>' + esc(a.department || '') + ' • ' + esc(a.hospital || '') + ' • ' + fmtD(a.date) + ' • ' + esc(a.type || '') + '</small></div>' +
    '<div class="li-actions"><span class="chip ' + (a.status === 'upcoming' ? 'blue' : a.status === 'completed' ? 'green' : 'red') + '">' + esc(a.status) + '</span>' +
    (a.status === 'upcoming' ? '<button class="btn ghost sm" data-act="cancel-appt" data-id="' + a.id + '">Cancel</button>' : '') + '</div></div>').join('') || '<p class="muted">Nothing here.</p>';
}
document.addEventListener('click', async e => {
  const c = e.target.closest('[data-act="cancel-appt"]');
  if (c) { await db.collection('appointments').doc(c.dataset.id).update({ status: 'cancelled' }); toast('Appointment cancelled.'); }
  const cp = e.target.closest('[data-act="complete-appt"]');
  if (cp) { await db.collection('appointments').doc(cp.dataset.id).update({ status: 'completed' }); toast('Marked as completed ✅'); }
});

/* ----- DOCTORS PAGE ----- */
function renderDoctorsPage() {
  const el = $('#docList'); if (!el || ROLE !== 'patient') return;
  el.innerHTML = STATE.doctors.map(d => {
    const on = isOnline(d);
    return '<div class="card"><b>👨‍⚕️ Dr. ' + esc(d.name) + '</b> <span class="chip blue">' + esc(d.specialization || '') + '</span>' +
      '<p class="muted">🏥 ' + esc(d.hospital || '') + ' • ' + esc(d.experience || '0') + ' yrs experience</p>' +
      '<p>' + (on ? '<span class="chip green">🟢 On duty — live location available</span>' : '<span class="chip">⚪ Off duty</span>') + '</p>' +
      '<div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap">' +
      '<button class="btn primary sm" data-act="open-chat" data-id="' + d.id + '" data-name="Dr. ' + esc(d.name) + '">💬 Message</button>' +
      '<button class="btn ghost sm" data-act="locate-dr" data-id="' + d.id + '">📍 Locate on Map</button>' +
      '<button class="btn ghost sm" data-nav="p-appts">📅 Book</button></div></div>';
  }).join('') || '<p class="muted">No doctors yet.</p>';
}

/* ============================================================
   DOCTOR LIVE MAP (patient view)
   Doctor location is ONLY visible while the doctor is ON DUTY.
   Logout deletes it; locations older than 6 minutes count as offline.
   ============================================================ */
function isOnline(d) { return !!(d && d.onDuty && d.location && d.location.lat != null && (Date.now() - d.location.updatedAt) < 6 * 60 * 1000); }
function ago(ts) { const s = Math.max(1, Math.round((Date.now() - ts) / 1000)); return s < 60 ? s + ' sec ago' : Math.round(s / 60) + ' min ago'; }

function renderDoctorMap() {
  if (ROLE !== 'patient') return;
  const mapEl = $('#docMap'); if (!mapEl) return;
  if (typeof L === 'undefined') { mapEl.innerHTML = '<p class="muted">Map library could not load — check your internet connection.</p>'; return; }
  const online = STATE.doctors.filter(isOnline);
  if (!cvMap) {
    cvMap = L.map('docMap').setView([13.0827, 80.2707], 11);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap contributors' }).addTo(cvMap);
    markersLayer = L.layerGroup().addTo(cvMap);
  }
  setTimeout(() => cvMap.invalidateSize(), 80);
  markersLayer.clearLayers();
  online.forEach(d => {
    const mk = L.marker([d.location.lat, d.location.lng], { icon: L.divIcon({ className: 'doc-pin', html: '👨‍⚕️', iconSize: [34, 34] }) })
      .bindPopup('<b>Dr. ' + esc(d.name) + '</b><br>' + esc(d.specialization || '') + '<br><small>Updated ' + ago(d.location.updatedAt) + '</small><br><a href="https://www.google.com/maps/dir/?api=1&destination=' + d.location.lat + ',' + d.location.lng + '" target="_blank" rel="noopener">🧭 Get directions</a>');
    mk.addTo(markersLayer);
    if (focusDoctorId === d.id) { cvMap.setView([d.location.lat, d.location.lng], 14); setTimeout(() => mk.openPopup(), 250); focusDoctorId = null; }
  });
  const chips = $('#mapDocs');
  if (chips) chips.innerHTML = online.length
    ? online.map(d => '<button class="chip active" data-act="focus-dr" data-id="' + d.id + '">👨‍⚕️ Dr. ' + esc(d.name) + ' • updated ' + ago(d.location.updatedAt) + '</button>').join('')
    : '<span class="chip red">No doctors on duty right now</span>';
  const info = $('#mapInfo');
  if (info) info.textContent = 'Live GPS • Location is shared only while the doctor is ON DUTY • Automatically removed on logout • Positions older than 6 minutes are hidden for safety.';
}
document.addEventListener('click', e => {
  const fd = e.target.closest('[data-act="focus-dr"]');
  if (fd) { focusDoctorId = fd.dataset.id; renderDoctorMap(); }
  const ld = e.target.closest('[data-act="locate-dr"]');
  if (ld) {
    const d = STATE.doctors.find(x => x.id === ld.dataset.id);
    if (d && !isOnline(d)) toast('⚠️ Dr. ' + d.name + ' is currently OFF DUTY — location not available.');
    focusDoctorId = ld.dataset.id;
    go('p-map');
  }
});

/* ----- UPCOMING EVENTS PAGE ----- */
function renderUpcoming() {
  if (ROLE !== 'patient') return;
  const ua = $('#upAppts'); if (!ua) return;
  const appts = STATE.appts.filter(a => a.status === 'upcoming' && a.date >= todayStr()).sort((a, b) => a.date.localeCompare(b.date));
  ua.innerHTML = appts.map(a => '<div class="list-item"><div class="li-main"><b>👨‍⚕️ ' + esc(a.doctorName) + ' — ' + esc(a.type || 'Visit') + '</b><small>' + fmtD(a.date) + ' • ' + esc(a.time) + ' • ' + esc(a.hospital || '') + ' • ' + esc(a.department || '') + '</small></div><span class="chip blue">Confirmed</span></div>').join('') || '<p class="muted">No upcoming appointments — book one from the Appointments page.</p>';
  const uf = $('#upFollow');
  const fus = STATE.timeline.filter(t => t.type === 'followup' && t.due && t.due >= todayStr()).sort((a, b) => a.due.localeCompare(b.due));
  uf.innerHTML = fus.map(f => '<div class="list-item"><div class="li-main"><b>🔔 ' + esc(f.title) + '</b><small>' + esc(f.description || '') + '</small></div><span class="chip amber">Due ' + fmtD(f.due) + '</span></div>').join('') || '<p class="muted">No follow-up reminders.</p>';
  const um = $('#upMeds');
  const meds = STATE.meds.filter(m => m.active !== false);
  um.innerHTML = meds.map(m => '<div class="list-item"><div class="li-main"><b>💊 ' + esc(m.name) + '</b><small>' + esc(m.dosage || '') + ' • ' + (m.verified ? 'Verified by ' + esc(m.verifiedBy || 'doctor') : 'Awaiting doctor verification') + '</small></div>' + (m.verified ? '<span class="chip green">Verified ✓</span>' : '<span class="chip amber">Pending</span>') + '</div>').join('') || '<p class="muted">No active medicines.</p>';
}

/* ----- TIMELINE ----- */
function renderTimeline() {
  const el = $('#tlList'); if (!el || ROLE !== 'patient') return;
  el.innerHTML = STATE.timeline.map(t =>
    '<div class="tl-item"><span class="tl-year">' + fmtD(t.date) + '</span>' +
    '<b>' + (t.icon || '•') + ' ' + esc(t.title) + '</b><p>' + esc(t.description || '') + '</p></div>').join('') || '<p class="muted">Your journey has not started — submit your first case 🚀</p>';
}

/* ----- QR + EMERGENCY ----- */
function renderQR() {
  if (ROLE !== 'patient') return;
  $('#qrHid').textContent = ME.healthId;
  $('#qrName').textContent = ME.name + ' • ' + ageOf(ME.dob) + ' • ' + (ME.bloodGroup || '');
  if (qrDone) return; qrDone = true;
  try {
    new QRCode($('#qrBox'), { text: JSON.stringify({ app: 'CareVault', healthId: ME.healthId, name: ME.name, blood: ME.bloodGroup }), width: 190, height: 190, colorDark: '#111', colorLight: '#fff', correctLevel: QRCode.CorrectLevel.M });
  } catch (e) { $('#qrBox').textContent = 'QR library failed to load (check internet).'; }
}
function openEmergency(withLookup) {
  $('#emOverlay').classList.remove('hidden');
  $('#emLookupRow').classList.toggle('hidden', !withLookup);
  if (!withLookup) {
    ME._meds = STATE.meds.filter(m => m.active !== false).map(m => m.name).join(', ');
    renderEmCard(ME);
  }
}
function renderEmCard(p) {
  $('#emBody').innerHTML = [
    ['🩸 Blood Group', p.bloodGroup || '—'],
    ['⚠️ Critical Allergies', p.allergies || 'None recorded'],
    ['💊 Current Medicines', p._meds || '—'],
    ['🏥 Major Conditions', p.conditions || 'None recorded'],
    ['🔪 Major History / Surgeries', ((p.surgeries || 'None').split('\n')[0]) || '—'],
    ['📞 Emergency Contact', (p.emergencyName || '—') + ' ' + (p.emergencyPhone || '')]
  ].map(([k, v]) => '<div class="card" style="margin:0"><b>' + k + '</b><p>' + esc(v) + '</p></div>').join('');
}
document.addEventListener('click', async e => {
  if (e.target.closest('[data-act="emergency"]')) return openEmergency(false);
  if (e.target.closest('[data-act="auth-emergency"]')) {
    if (!auth.currentUser) { toast('Please login first to use Emergency Access (security 🔐).'); return; }
    return openEmergency(true);
  }
  if (e.target.closest('[data-act="close-em"]')) $('#emOverlay').classList.add('hidden');
  if (e.target.closest('[data-act="em-lookup"]')) {
    const hid = $('#emHealthId').value.trim().toUpperCase(); if (!hid) return;
    try {
      const s = await db.collection('users').where('healthId', '==', hid).limit(1).get();
      if (s.empty) return toast('⚠️ Health ID not found.');
      const p = s.docs[0].data(); p.id = s.docs[0].id;
      const ms = await db.collection('medicines').where('patientId', '==', p.id).get();
      p._meds = ms.docs.map(d => d.data().name).filter(n => n).join(', ') || '—';
      await logAccess(p.id, '🚑 Emergency record viewed');
      renderEmCard(p);
    } catch (err) { toast('⚠️ ' + errMsg(err)); }
  }
  if (e.target.closest('[data-act="close-modal"]')) closeModal();
});

/* ----- CONSENT CENTER ----- */
function renderConsent() {
  const el = $('#consentList'); if (!el || ROLE !== 'patient') return;
  el.innerHTML = STATE.doctors.map(d => {
    const key = ME.id + '_' + d.id;
    const c = STATE.consents.find(x => x.id === key);
    const allowed = !c || c.status !== 'revoked';
    return '<div class="list-item"><div class="li-main"><b>👨‍⚕️ Dr. ' + esc(d.name) + '</b><small>' + esc(d.specialization || '') + ' • ' + esc(d.hospital || '') + ' • Purpose: Consultation access</small></div>' +
      '<div class="li-actions"><span class="chip ' + (allowed ? 'green' : 'red') + '">' + (allowed ? '✅ Allowed' : '❌ Revoked') + '</span>' +
      '<button class="btn ' + (allowed ? 'danger' : 'primary') + ' sm" data-act="toggle-consent" data-id="' + key + '" data-name="Dr. ' + esc(d.name) + '" data-allowed="' + allowed + '">' + (allowed ? 'Revoke' : 'Allow') + '</button></div></div>';
  }).join('') || '<p class="muted">No doctors registered yet.</p>';
}
document.addEventListener('click', async e => {
  const t = e.target.closest('[data-act="toggle-consent"]'); if (!t) return;
  const parts = t.dataset.id.split('_');
  const allowed = t.dataset.allowed === 'true';
  try {
    await db.collection('consents').doc(t.dataset.id).set({ patientId: parts[0], doctorId: parts[1], doctorName: t.dataset.name, status: allowed ? 'revoked' : 'allowed', updatedAt: Date.now() }, { merge: true });
    await notify(parts[1], allowed ? '🚫 Access Revoked' : '✅ Access Allowed', 'Patient ' + ME.name + ' ' + (allowed ? 'revoked' : 'granted') + ' your access.');
    toast(allowed ? 'Access revoked — this doctor can no longer open your record 🔒' : 'Access allowed ✅');
    const c = await db.collection('consents').where('patientId', '==', ME.id).get();
    STATE.consents = c.docs.map(d => ({ id: d.id, ...d.data() }));
    renderConsent();
  } catch (err) { toast('⚠️ ' + errMsg(err)); }
});

/* ----- ACCESS HISTORY ----- */
function renderAccess() {
  const el = $('#accessList'); if (!el || ROLE !== 'patient') return;
  el.innerHTML = STATE.access.map(a => '<div class="list-item"><div class="li-main"><b>' + (a.actorRole === 'doctor' ? '👨‍⚕️' : a.actorRole === 'hospital' ? '🏥' : '🤖') + ' ' + esc(a.actorName) + '</b><small>' + esc(a.action) + '</small></div><small class="muted">' + fmtDT(a.createdAt) + '</small></div>').join('') || '<p class="muted">No access events yet — your full audit trail will appear here.</p>';
}

/* ============================================================
   HEALTH TRACKING
   ============================================================ */
const TREND_COLORS = { temp: '#ea580c', bp: '#2563eb', hr: '#dc2626', wt: '#16a34a' };
function parseBp(bp) { if (!bp) return null; const m = String(bp).match(/(\d+)\s*\/\s*(\d+)/); return m ? { s: +m[1], d: +m[2] } : null; }
function num(v) { const n = Number(v); return isNaN(n) ? null : n; }

function sparkSVG(vals, color) {
  if (!vals || vals.length < 2) return '<div class="spark muted sm-txt" style="display:flex;align-items:center;justify-content:center">Not enough data</div>';
  const w = 120, h = 36, pad = 4;
  const min = Math.min(...vals), max = Math.max(...vals);
  const range = (max - min) || 1;
  const pts = vals.map((v, i) => {
    const x = pad + i * (w - 2 * pad) / (vals.length - 1);
    const y = h - pad - ((v - min) / range) * (h - 2 * pad);
    return x.toFixed(1) + ',' + y.toFixed(1);
  }).join(' ');
  return '<svg class="spark" viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none"><polyline fill="none" stroke="' + color + '" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" points="' + pts + '"/></svg>';
}
function seriesOf(key) {
  return STATE.vitals.slice(0, 7).reverse().map(v => key === 'bp' ? (parseBp(v.bp) ? parseBp(v.bp).s : null) : num(v[key])).filter(x => x !== null);
}
function deltaHTML(vals, unit) {
  if (vals.length < 2) return '<span class="t-delta flat">—</span>';
  const d = vals[vals.length - 1] - vals[vals.length - 2];
  if (d === 0) return '<span class="t-delta flat">→ no change</span>';
  return d > 0 ? '<span class="t-delta up">↑ ' + Math.abs(d).toFixed(1) + ' ' + unit + '</span>' : '<span class="t-delta down">↓ ' + Math.abs(d).toFixed(1) + ' ' + unit + '</span>';
}
function renderVitals() {
  if (ROLE !== 'patient') return;
  const today = $('#vtToday'); if (today) today.textContent = '📅 ' + new Date().toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });

  const lv = STATE.vitals[0] || null;
  const bp = lv ? parseBp(lv.bp) : null;
  const sc = $('#statCards');
  if (sc) sc.innerHTML =
    '<div class="stat-card stat-hr"><div class="st-name">❤️ Heart Rate</div><div class="st-val">' + (lv && num(lv.hr) != null ? num(lv.hr) : '—') + '</div><div class="st-unit">bpm</div></div>' +
    '<div class="stat-card stat-temp"><div class="st-name">🌡️ Temperature</div><div class="st-val">' + (lv && num(lv.temp) != null ? num(lv.temp) : '—') + '</div><div class="st-unit">°C</div></div>' +
    '<div class="stat-card stat-bp"><div class="st-name">🩸 Blood Pressure</div><div class="st-val">' + (bp ? bp.s + '/' + bp.d : '—') + '</div><div class="st-unit">mmHg</div></div>' +
    '<div class="stat-card stat-wt"><div class="st-name">⚖️ Weight</div><div class="st-val">' + (lv && num(lv.wt) != null ? num(lv.wt) : '—') + '</div><div class="st-unit">kg</div></div>';

  const rc = $('#recentVitals');
  if (rc) rc.innerHTML = STATE.vitals.slice(0, 6).map(v => {
    const p = parseBp(v.bp);
    const pain = num(v.pain);
    return '<div class="list-item"><div class="li-main"><b>' + fmtD(v.date) + '</b>' +
      '<small>🌡️ ' + esc(v.temp || '—') + '°C • BP ' + (p ? p.s + '/' + p.d : '—') + ' • ❤️ ' + esc(v.hr || '—') + ' bpm • ⚖️ ' + esc(v.wt || '—') + ' kg' + (v.sym ? ' • ' + esc(v.sym) : '') + '</small></div>' +
      (pain != null ? '<span class="chip ' + (pain <= 3 ? 'green' : pain <= 6 ? 'blue' : 'red') + '">' + pain + '/10 Pain</span>' : '') + '</div>';
  }).join('') || '<p class="muted">No records yet — save your first measurement above.</p>';

  const tg = $('#trendGrid');
  if (tg) {
    const defs = [
      { key: 'temp', name: '🌡️ Temperature', unit: '°C', get: v => num(v.temp) },
      { key: 'bp', name: '🩸 Blood Pressure', unit: 'mmHg', get: v => parseBp(v.bp) ? parseBp(v.bp).s : null },
      { key: 'hr', name: '❤️ Heart Rate', unit: 'bpm', get: v => num(v.hr) },
      { key: 'wt', name: '⚖️ Weight', unit: 'kg', get: v => num(v.wt) }
    ];
    tg.innerHTML = defs.map(df => {
      const vals = seriesOf(df.key);
      const cur = vals.length ? vals[vals.length - 1] : '—';
      return '<div class="trend-card"><div class="t-name">' + df.name + '</div><div class="t-val">' + cur + ' <small class="muted">' + df.unit + '</small></div>' + deltaHTML(vals, df.unit) + sparkSVG(vals, TREND_COLORS[df.key]) + '</div>';
    }).join('');
  }

  const ue = $('#upcomingEvents');
  if (ue) {
    const items = [];
    const nextAppt = STATE.appts.filter(a => a.status === 'upcoming' && a.date >= todayStr()).sort((a, b) => a.date.localeCompare(b.date))[0];
    if (nextAppt) items.push('<div class="list-item"><div class="li-main"><b>📅 Appointment — ' + esc(nextAppt.doctorName) + '</b><small>' + fmtD(nextAppt.date) + ' • ' + esc(nextAppt.time) + ' • ' + esc(nextAppt.hospital || '') + '</small></div><span class="chip blue">' + esc(nextAppt.type || 'Visit') + '</span></div>');
    const fu = STATE.timeline.find(t => t.type === 'followup' && t.due && t.due >= todayStr());
    if (fu) items.push('<div class="list-item"><div class="li-main"><b>🔔 ' + esc(fu.title) + '</b><small>Due on ' + fmtD(fu.due) + '</small></div><span class="chip amber">Follow-up</span></div>');
    const activeMeds = STATE.meds.filter(m => m.active !== false);
    if (activeMeds.length) items.push('<div class="list-item"><div class="li-main"><b>💊 ' + activeMeds.length + ' active medicine' + (activeMeds.length > 1 ? 's' : '') + '</b><small>' + esc(activeMeds.slice(0, 3).map(m => m.name).join(', ')) + '</small></div><span class="chip green">Ongoing</span></div>');
    ue.innerHTML = items.join('') || '<p class="muted">No upcoming events. Book an appointment or submit a case to see events here.</p>';
  }
}
function buildPainRow() {
  const row = $('#painRow'); if (!row || row.dataset.done) return; row.dataset.done = '1';
  for (let i = 0; i <= 10; i++) {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'pain-btn'; b.textContent = i;
    b.onclick = () => { $$('.pain-btn').forEach(x => x.classList.remove('active')); b.classList.add('active'); selectedPain = i; };
    row.appendChild(b);
  }
}
buildPainRow();
const symEl = $('#vSym');
if (symEl) symEl.addEventListener('input', () => { $('#symCount').textContent = symEl.value.length; });
document.addEventListener('click', async e => {
  if (!e.target.closest('[data-act="add-vital"]')) return;
  const temp = $('#vTemp').value, bp = $('#vBp').value.trim(), hr = $('#vHr').value, wt = $('#vWt').value, sym = $('#vSym').value.trim();
  if (!temp && !bp && !hr && !wt && !sym && selectedPain === null) return toast('⚠️ Enter at least one measurement.');
  if (bp && !parseBp(bp)) return toast('⚠️ Blood Pressure format should be like 120/80');
  try {
    await db.collection('vitals').add({ patientId: ME.id, date: todayStr(), temp, bp, hr, wt, pain: selectedPain === null ? '' : selectedPain, sym, createdAt: Date.now() });
    $('#vTemp').value = ''; $('#vHr').value = ''; $('#vWt').value = ''; $('#vBp').value = ''; $('#vSym').value = '';
    $('#symCount').textContent = '0';
    $$('.pain-btn').forEach(x => x.classList.remove('active')); selectedPain = null;
    toast('Record saved ✅');
    renderVitals();
  } catch (err) { toast('⚠️ ' + errMsg(err)); }
});

/* ----- SMART SEARCH ----- */
 $('#topSearch').addEventListener('input', e => {
  const q = e.target.value.trim().toLowerCase();
  const box = $('#searchResults');
  if (!q) { box.classList.add('hidden'); return; }
  go('p-dash'); box.classList.remove('hidden');
  const hit = s => (s || '').toLowerCase().includes(q);
  let html = '';
  STATE.timeline.filter(t => hit(t.title) || hit(t.description)).forEach(t => html += '<div class="list-item"><div class="li-main"><b>' + (t.icon || '•') + ' ' + esc(t.title) + '</b><small>🕐 Timeline • ' + esc(t.description || '') + '</small></div><small class="muted">' + fmtD(t.date) + '</small></div>');
  STATE.meds.filter(m => hit(m.name)).forEach(m => html += '<div class="list-item"><div class="li-main"><b>💊 ' + esc(m.name) + '</b><small>Medicine • ' + esc(m.dosage || '') + '</small></div>' + (m.verified ? '<span class="chip green">Verified ✓</span>' : '') + '</div>');
  STATE.reports.filter(r => hit(r.title) || hit(r.type)).forEach(r => html += '<div class="list-item"><div class="li-main"><b>🧪 ' + esc(r.title) + '</b><small>Report • ' + esc(r.type) + '</small></div><small class="muted">' + fmtD(r.date) + '</small></div>');
  $('#searchResultsBody').innerHTML = html || '<p class="muted">No matches found in your records.</p>';
});

/* ----- AI CHATBOT (records only) ----- */
document.addEventListener('click', e => {
  if (e.target.closest('[data-act="chatbot"]')) $('#cbModal').classList.remove('hidden');
  if (e.target.closest('[data-act="close-cb"]')) $('#cbModal').classList.add('hidden');
  if (e.target.closest('[data-act="send-cb"]')) sendCB();
});
 $('#cbInput').addEventListener('keydown', e => { if (e.key === 'Enter') sendCB(); });
function cbAdd(text, me) { const d = document.createElement('div'); d.className = 'msg ' + (me ? 'me' : 'bot'); d.innerHTML = text; $('#cbMsgs').appendChild(d); $('#cbMsgs').scrollTop = 1e6; }
function sendCB() {
  const q = $('#cbInput').value.trim(); if (!q) return; $('#cbInput').value = '';
  cbAdd(esc(q), true);
  setTimeout(() => cbAdd(chatbotAnswer(q.toLowerCase())), 500);
}
function chatbotAnswer(q) {
  const next = STATE.appts.filter(a => a.status === 'upcoming' && a.date >= todayStr()).sort((a, b) => a.date.localeCompare(b.date))[0];
  if (q.includes('appointment') || q.includes('next') || q.includes('upcoming')) return next ? '📅 Your next appointment: <b>' + esc(next.doctorName) + '</b> on <b>' + fmtD(next.date) + '</b> at <b>' + esc(next.time) + '</b>, ' + esc(next.hospital || '') + '.' : '📅 You have no upcoming appointments. You can book one on the Appointments page.';
  if (q.includes('map') || q.includes('location') || q.includes('where is')) { const on = STATE.doctors.filter(isOnline); return on.length ? '🗺️ ' + on.length + ' doctor(s) are currently ON DUTY with live location. Open the <b>Doctor Map</b> page to see them.' : '🗺️ No doctors are on duty right now. Doctors appear on the map only while they are on duty.'; }
  if (q.includes('medicine') || q.includes('tablet') || q.includes('meds')) { const m = STATE.meds.filter(x => x.active !== false); return m.length ? '💊 Active medicines:<br>' + m.map(x => '• <b>' + esc(x.name) + '</b> — ' + esc(x.dosage || '') + (x.verified ? ' ✅' : ' (pending verification)')).join('<br>') : '💊 No active medicines on record.'; }
  if (q.includes('surgery') || q.includes('operation')) { const s = (ME.surgeries || '').split('\n').filter(Boolean); return s.length ? '🔪 Surgeries on record:<br>' + s.map(x => '• ' + esc(x)).join('<br>') : '🔪 No surgeries recorded.'; }
  if (q.includes('note') || q.includes('last visit') || q.includes('doctor wrote') || q.includes('review')) { const c = STATE.cases.find(x => x.status === 'reviewed'); return c ? '🩺 Last reviewed by <b>Dr. ' + esc(c.doctorName) + '</b> (' + fmtDT(c.reviewedAt) + '):<br>• Notes: ' + esc(c.doctorNotes || '—') + '<br>• Prescription: ' + esc(c.prescriptionText || '—') + '<br>• Tests: ' + esc(c.tests || '—') : '🟡 No doctor review has happened yet.'; }
  if (q.includes('report')) { return STATE.reports.length ? '🧪 Reports:<br>' + STATE.reports.slice(0, 6).map(r => '• ' + esc(r.title) + ' (' + fmtD(r.date) + ')').join('<br>') : '🧪 No reports uploaded yet.'; }
  if (q.includes('scheme')) return '🏛️ The AI scheme check is on your Dashboard — ' + schemeCheck().map(s => esc(s.title)).join(', ');
  if (q.includes('blood')) return '🩸 Blood group on record: <b>' + esc(ME.bloodGroup || 'not recorded') + '</b>';
  if (q.includes('emergency')) return '🚑 Use the red Emergency button in the sidebar or on the Dashboard.';
  return '🤖 I can only navigate your records — try: "next appointment?", "active medicines?", "previous surgery?", "last doctor notes?", "reports?", "where is my doctor?". For medical advice, please consult your doctor.';
}

/* ----- PATIENT ↔ DOCTOR CHAT ----- */
document.addEventListener('click', e => {
  const oc = e.target.closest('[data-act="open-chat"]');
  if (oc) openChat(oc.dataset.id, oc.dataset.name);
  if (e.target.closest('[data-act="close-chat"]')) $('#chatModal').classList.add('hidden');
  if (e.target.closest('[data-act="send-chat"]')) sendChat();
});
 $('#chatInput').addEventListener('keydown', e => { if (e.key === 'Enter') sendChat(); });
function openChat(otherId, otherName) {
  CHAT_WITH = { id: otherId, name: otherName };
  $('#chatTitle').textContent = '💬 ' + otherName;
  $('#chatModal').classList.remove('hidden'); $('#chatMsgs').innerHTML = '';
  const tid = [ME.id, otherId].sort().join('_');
  db.collection('threads').doc(tid).set({ ids: [ME.id, otherId], lastAt: Date.now() }, { merge: true }).catch(() => {});
  if (chatUnsub) chatUnsub();
  chatUnsub = db.collection('threads').doc(tid).collection('m').orderBy('at').onSnapshot(s => {
    $('#chatMsgs').innerHTML = s.docs.map(d => { const m = d.data(); return '<div class="msg ' + (m.from === ME.id ? 'me' : 'them') + '">' + esc(m.text) + '<br><small style="opacity:.7">' + new Date(m.at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + '</small></div>'; }).join('');
    $('#chatMsgs').scrollTop = 1e6;
  }, console.error);
}
function sendChat() {
  const t = $('#chatInput').value.trim(); if (!t || !CHAT_WITH) return; $('#chatInput').value = '';
  const tid = [ME.id, CHAT_WITH.id].sort().join('_');
  db.collection('threads').doc(tid).collection('m').add({ from: ME.id, fromRole: ROLE, text: t, at: Date.now() });
  notify(CHAT_WITH.id, '💬 New message', (ROLE === 'doctor' ? 'Dr. ' + ME.name : ME.name) + ': ' + t.slice(0, 60));
}

/* ----- SETTINGS ----- */
document.addEventListener('click', e => {
  const f = e.target.closest('[data-act="font"]'); if (f) { setFont(f.dataset.v); toast('Font size: ' + f.dataset.v); }
});
function renderSettings() {
  const sp = $('#settingsProfile'); if (!sp) return;
  if (sp.dataset.done === '1') return; sp.dataset.done = '1';
  if (ROLE === 'patient') {
    sp.innerHTML = formFields([['name', 'Full Name'], ['phone', 'Phone'], ['address', 'Address'], ['emergencyName', 'Emergency Contact'], ['emergencyPhone', 'Emergency Phone'], ['bloodGroup', 'Blood Group'], ['allergies', 'Allergies'], ['conditions', 'Existing Conditions'], ['surgeries', 'Surgeries (one per line)'], ['accidents', 'Accidents'], ['familyHistory', 'Family History'], ['income', 'Annual Income']]).join('') +
      '<button class="btn primary" data-act="save-profile">💾 Save Changes</button><p class="hint">Doctor-verified medicines and records cannot be edited by the patient 🔒</p>';
  } else if (ROLE === 'doctor') {
    sp.innerHTML = '<div class="kv">' + kvRows([['Name', 'Dr. ' + ME.name], ['Specialization', ME.specialization], ['Hospital', ME.hospital], ['Reg No', ME.regNo], ['Experience', ME.experience]]) + '</div>';
  } else {
    sp.innerHTML = '<div class="kv">' + kvRows([['Hospital', ME.name], ['Admin', ME.adminName], ['Phone', ME.phone], ['License', ME.licenseNo]]) + '</div>';
  }
}
function formFields(fields) { return fields.map(([k, label]) => '<label class="label">' + label + '</label><input class="input" data-pf="' + k + '" value="' + esc(ME[k] || '') + '">'); }
document.addEventListener('click', async e => {
  if (!e.target.closest('[data-act="save-profile"]')) return;
  const upd = {};
  $$('[data-pf]').forEach(i => upd[i.dataset.pf] = i.value.trim());
  try {
    await db.collection('users').doc(ME.id).update(upd);
    Object.assign(ME, upd);
    localStorage.setItem('cv_emergency', JSON.stringify(ME));
    toast('Profile updated ✅');
  } catch (err) { toast('⚠️ ' + errMsg(err)); }
});

/* ============================================================
   DOCTOR
   ============================================================ */
function bindDoctor() {
  UNBINDS.push(db.collection('cases').where('status', '==', 'waiting').onSnapshot(s => { STATE.cases = s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => a.createdAt - b.createdAt); renderDoctorCases(); renderDocDash(); }, console.error));
  UNBINDS.push(db.collection('cases').where('doctorId', '==', ME.id).onSnapshot(s => { STATE.myReviewed = s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (b.reviewedAt || 0) - (a.reviewedAt || 0)); renderDoctorCases(); }, console.error));
  UNBINDS.push(db.collection('appointments').where('doctorId', '==', ME.id).onSnapshot(s => { STATE.appts = s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (a.date || '').localeCompare(b.date || '')); renderDocAppts(); renderDocDash(); }, console.error));
  UNBINDS.push(db.collection('users').where('role', '==', 'patient').onSnapshot(s => { STATE.patients = s.docs.map(d => ({ id: d.id, ...d.data() })); renderPatients(); renderDocDash(); renderVerifyMeds(); }, console.error));
  // 💊 Core innovation: live feed of ALL unverified medicines across the platform
  UNBINDS.push(db.collection('medicines').where('verified', '==', false).onSnapshot(s => { STATE.unverifiedMeds = s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => b.createdAt - a.createdAt); renderVerifyMeds(); renderDocDash(); }, console.error));
}

/* ----- DUTY TOGGLE (live location) ----- */
function dutyToggleHTML() {
  const on = !!ME.onDuty;
  return '<h4>📍 Duty &amp; Live Location</h4>' +
    '<p class="muted sm-txt">When ON, your live GPS location is visible to patients on the Doctor Map. It is <b>deleted automatically when you log out</b>, and locations older than 6 minutes are treated as offline.</p>' +
    '<button class="duty-btn ' + (on ? 'duty-on' : 'duty-off') + '" data-act="toggle-duty">' + (on ? '🟢 ON DUTY — live location visible (tap to go off duty)' : '⚪ OFF DUTY — tap to go on duty') + '</button>';
}
function renderDutyToggle() { const c = $('#dutyCard'); if (c && ROLE === 'doctor') c.innerHTML = dutyToggleHTML(); }
document.addEventListener('click', e => {
  if (!e.target.closest('[data-act="toggle-duty"]')) return;
  setDuty(!ME.onDuty);
});
function setDuty(on) {
  if (on) {
    if (!navigator.geolocation) return toast('⚠️ Geolocation is not supported in this browser.');
    ME.onDuty = true; renderDutyToggle();
    toast('🟢 On duty — acquiring GPS…');
    dutyWatch = navigator.geolocation.watchPosition(pos => {
      if (Date.now() - lastLocSend < 20000) return; // throttle: max one write per 20s
      lastLocSend = Date.now();
      ME.location = { lat: pos.coords.latitude, lng: pos.coords.longitude, updatedAt: Date.now() };
      db.collection('users').doc(ME.id).update({ onDuty: true, location: ME.location }).catch(() => {});
    }, () => { toast('⚠️ Location permission denied — allow location access and try again.'); ME.onDuty = false; renderDutyToggle(); }, { enableHighAccuracy: true, maximumAge: 15000 });
  } else {
    ME.onDuty = false; ME.location = null;
    if (dutyWatch) { navigator.geolocation.clearWatch(dutyWatch); dutyWatch = null; }
    db.collection('users').doc(ME.id).update({ onDuty: false, location: firebase.firestore.FieldValue.delete() }).catch(() => {});
    renderDutyToggle();
    toast('⚪ Off duty — your location has been removed from the server.');
  }
}

/* ----- DOCTOR DASHBOARD ----- */
function renderDocDash() {
  if (ROLE !== 'doctor') return;
  const today = todayStr();
  const stats = [['🟡 Pending Cases', STATE.cases.length], ['📅 Today\'s Appointments', STATE.appts.filter(a => a.date === today && a.status === 'upcoming').length], ['👥 Patients on Platform', STATE.patients.length]];
  $('#ddStats').innerHTML = stats.map(([k, v]) => '<div class="card center"><h4>' + k + '</h4><p style="font-size:30px;font-weight:800;color:var(--primary)">' + v + '</p></div>').join('');
  renderDutyToggle();
  const un = (STATE.unverifiedMeds || []).length;
  const vc = $('#verifyCard');
  if (vc) vc.innerHTML = '<h4>💊 Medicine Verification <span class="chip ' + (un ? 'red' : 'green') + '">' + un + ' pending</span></h4>' +
    '<p class="muted sm-txt">Patient-reported medicines become <b>"Doctor Verified ✓"</b> only after you confirm them — the trust layer of Care Vault.</p>' +
    '<button class="btn primary sm" data-nav="d-verify">Open Verification Center →</button>';
  $('#ddPending').innerHTML = STATE.cases.map(caseRow).join('') || '<p class="muted">🎉 No pending cases!</p>';
  $('#ddToday').innerHTML = STATE.appts.filter(a => a.date === today).map(a =>
    '<div class="list-item"><div class="li-main"><b>' + esc(a.patientName) + '</b><small>' + esc(a.time) + ' • ' + esc(a.type || '') + '</small></div>' +
    '<div class="li-actions">' + (a.status === 'upcoming' ? '<button class="btn primary sm" data-act="complete-appt" data-id="' + a.id + '">Done</button>' : '<span class="chip green">' + esc(a.status) + '</span>') + '</div></div>').join('') || '<p class="muted">No appointments today.</p>';
}
function caseRow(c) {
  return '<div class="list-item"><div class="li-main"><b>' + esc(c.patientName) + ' <span class="chip blue">' + esc(c.healthId || '') + '</span></b>' +
    '<small>' + esc(c.chiefComplaint) + ' • ' + esc(c.duration || '') + ' • ' + esc(c.severity || '') + ' • ' + fmtDT(c.createdAt) + '</small></div>' +
    '<div class="li-actions"><button class="btn primary sm" data-act="open-case" data-id="' + c.id + '">Review →</button></div></div>';
}
 $$('[data-ctab]').forEach(t => t.onclick = () => { $$('[data-ctab]').forEach(x => x.classList.remove('active')); t.classList.add('active'); CURRENT_CTAB = t.dataset.ctab; renderDoctorCases(); });
function renderDoctorCases() {
  const el = $('#dcList'); if (!el || ROLE !== 'doctor') return;
  const list = CURRENT_CTAB === 'waiting' ? STATE.cases : (STATE.myReviewed || []);
  el.innerHTML = list.map(caseRow).join('') || '<p class="muted">No cases in this tab.</p>';
}

/* ----- MEDICINE VERIFICATION CENTER ----- */
function renderVerifyMeds() {
  const el = $('#dvList'); if (!el || ROLE !== 'doctor') return;
  const meds = STATE.unverifiedMeds || [];
  el.innerHTML = meds.map(m => {
    const p = STATE.patients.find(x => x.id === m.patientId) || {};
    return '<div class="list-item"><div class="li-main"><b>' + esc(m.name) + ' <span class="chip blue">' + esc(p.healthId || '') + '</span></b>' +
      '<small>Patient: ' + esc(p.name || 'Unknown') + ' • ' + esc(m.dosage || '') + ' • reported by ' + esc(m.prescribedBy || 'patient') + ' • ' + fmtDT(m.createdAt) + '</small></div>' +
      '<div class="li-actions"><button class="btn primary sm" data-act="verify-med" data-id="' + m.id + '" data-pid="' + m.patientId + '" data-name="' + esc(m.name) + '">Verify ✓</button></div></div>';
  }).join('') || '<p class="muted">🎉 Excellent — every medicine on the platform is doctor-verified.</p>';
}

/* ----- OPEN CASE (consent check!) ----- */
document.addEventListener('click', async e => {
  const oc = e.target.closest('[data-act="open-case"]'); if (!oc) return;
  const c = STATE.cases.find(x => x.id === oc.dataset.id) || (STATE.myReviewed || []).find(x => x.id === oc.dataset.id);
  if (!c) return;
  try {
    const consentDoc = await db.collection('consents').doc(c.patientId + '_' + ME.id).get();
    if (consentDoc.exists && consentDoc.data().status === 'revoked') {
      await logAccess(c.patientId, '🚫 Attempted access — BLOCKED by patient consent');
      return toast('🚫 Unauthorized Access Blocked — the patient revoked your access.');
    }
    await logAccess(c.patientId, '👨‍⚕️ Dr. ' + ME.name + ' viewed your case');
    CURRENT_CASE = c;
    await renderCaseDetail();
  } catch (err) { toast('⚠️ ' + errMsg(err)); }
});
async function renderCaseDetail() {
  go('d-case');
  const c = CURRENT_CASE;
  $('#cdHead').innerHTML = '<div class="card"><div class="kv">' + kvRows([['Patient', c.patientName], ['Health ID', c.healthId], ['Case Status', c.status === 'waiting' ? '🟡 Waiting for review' : '🟩 Reviewed'], ['Submitted', fmtDT(c.createdAt)]]) + '</div></div>';
  let p = {};
  try { const pdoc = await db.collection('users').doc(c.patientId).get(); if (pdoc.exists) p = pdoc.data(); } catch (e) {}
  let meds = [];
  try { const ms = await db.collection('medicines').where('patientId', '==', c.patientId).get(); meds = ms.docs.map(d => d.data()); } catch (e) {}
  const activeMeds = meds.filter(m => m.active !== false).map(m => m.name).join(', ') || '—';
  let lastV = null;
  try { const vit = await db.collection('vitals').where('patientId', '==', c.patientId).get(); lastV = vit.docs.map(d => d.data()).sort((a, b) => b.createdAt - a.createdAt)[0]; } catch (e) {}
  $('#cdSummary').innerHTML = kvRows([
    ['Age / Gender / Blood', ageOf(p.dob) + ' • ' + (p.gender || '—') + ' • ' + (p.bloodGroup || '—')],
    ['⚠️ Allergies', p.allergies || 'None recorded'],
    ['🏥 Chronic Conditions', p.conditions || 'None recorded'],
    ['🔪 Past Surgeries', (p.surgeries || 'None').split('\n')[0] || '—'],
    ['💊 Active Medicines', activeMeds],
    ['📈 Last Vitals', lastV ? ((lastV.bp || '—') + ' BP • ' + (lastV.hr || '—') + ' hr • ' + (lastV.temp || '—') + '°C • pain ' + (lastV.pain || '—') + '/10') : '—'],
    ['🚗 Accidents', p.accidents || '—']
  ]) + '<small class="muted">AI-generated from stored records — please verify clinically. Not a diagnosis.</small>';
  $('#cdBlue').innerHTML = kvRows([
    ['1️⃣ Chief Complaint', c.chiefComplaint], ['2️⃣ Symptoms', c.symptoms], ['🧍 Area', c.area], ['3️⃣ Duration', c.duration], ['Severity', c.severity],
    ['4️⃣ Previous Treatment', c.prevTreatment], ['5️⃣ Existing', c.existing], ['6️⃣ Current Meds', c.currentMeds],
    ['7️⃣ Allergies', c.allergyNote], ['8️⃣ Surgeries', c.surgeryNote], ['9️⃣ Family', c.familyHistory], ['🔟 Other / Questions', c.other]
  ]);
  if (c.status === 'reviewed') { $('#cdNotes').value = c.doctorNotes || ''; $('#cdObs').value = c.observations || ''; $('#cdTests').value = c.tests || ''; $('#cdFollow').value = c.followupDays || ''; }
  else { $('#cdNotes').value = ''; $('#cdObs').value = ''; $('#cdTests').value = ''; $('#cdFollow').value = ''; }
  $('#prescRows').innerHTML = prescRowHTML();
  $('#cdMedVerify').innerHTML = meds.map(m =>
    '<div class="list-item"><div class="li-main"><b>' + esc(m.name) + '</b><small>' + esc(m.dosage || '') + ' • by ' + esc(m.prescribedBy || '') + '</small></div>' +
    '<div class="li-actions">' + (m.verified ? '<span class="chip green">🟩 Verified ✓ ' + esc(m.verifiedBy || '') + '</span>' : '<button class="btn primary sm" data-act="verify-med" data-id="' + m.id + '" data-pid="' + c.patientId + '" data-name="' + esc(m.name) + '">Verify ✓</button>') + '</div></div>').join('') || '<p class="muted">No medicines.</p>';
}
function prescRowHTML() {
  return '<div class="presc-row"><input class="input p-name" placeholder="Medicine"><input class="input p-dose" placeholder="Dose/instructions"><input class="input p-days" placeholder="Days"><input class="input p-inst" placeholder="Before/after food…"></div>';
}
document.addEventListener('click', e => {
  if (e.target.closest('[data-act="add-presc-row"]')) $('#prescRows').insertAdjacentHTML('beforeend', prescRowHTML());
  const vm = e.target.closest('[data-act="verify-med"]');
  if (vm) {
    db.collection('medicines').doc(vm.dataset.id).update({ verified: true, verifiedBy: 'Dr. ' + ME.name, verifiedAt: Date.now() }).then(() => {
      logAccess(vm.dataset.pid, '👨‍⚕️ Dr. ' + ME.name + ' verified medicine: ' + vm.dataset.name);
      notify(vm.dataset.pid, '💊 Medicine Verified', 'Dr. ' + ME.name + ' verified: ' + vm.dataset.name);
      toast('🟩 Medicine verified — it is now Doctor-Verified ✓');
    }).catch(err => toast('⚠️ ' + errMsg(err)));
  }
});
document.addEventListener('click', async e => {
  if (!e.target.closest('[data-act="submit-review"]')) return;
  const c = CURRENT_CASE; if (!c) return;
  const meds = [...$$('#prescRows .presc-row')].map(r => ({ name: r.querySelector('.p-name').value.trim(), dose: r.querySelector('.p-dose').value.trim(), days: r.querySelector('.p-days').value.trim(), inst: r.querySelector('.p-inst').value.trim() })).filter(m => m.name);
  const share = $('#cdShare').checked;
  try {
    await db.collection('cases').doc(c.id).update({
      status: 'reviewed', doctorId: ME.id, doctorName: ME.name, reviewedAt: Date.now(),
      doctorNotes: $('#cdNotes').value.trim(), observations: $('#cdObs').value.trim(),
      prescriptionText: meds.map(m => m.name + ' — ' + m.dose + (m.days ? ' (' + m.days + 'd)' : '')).join('; '),
      tests: $('#cdTests').value.trim(), followupDays: $('#cdFollow').value, sharedWithPatient: share
    });
    for (const m of meds) {
      await db.collection('medicines').add({ patientId: c.patientId, name: m.name, dosage: (m.dose + ' ' + m.inst).trim(), startDate: todayStr(), durationDays: m.days, prescribedBy: 'Dr. ' + ME.name, verified: true, verifiedBy: 'Dr. ' + ME.name, source: 'doctor', active: true, createdAt: Date.now() });
    }
    await db.collection('timeline').add({ patientId: c.patientId, date: todayStr(), type: 'consult', icon: '👨‍⚕️', title: 'Consultation — Dr. ' + ME.name, description: $('#cdNotes').value.trim() || c.chiefComplaint, createdAt: Date.now() });
    if (meds.length) await db.collection('timeline').add({ patientId: c.patientId, date: todayStr(), type: 'prescription', icon: '💊', title: 'Prescription added', description: meds.map(m => m.name).join(', '), createdAt: Date.now() });
    const fu = Number($('#cdFollow').value);
    if (fu > 0) {
      const due = new Date(Date.now() + fu * 86400000).toISOString().slice(0, 10);
      await db.collection('timeline').add({ patientId: c.patientId, date: todayStr(), type: 'followup', icon: '🔔', title: 'Follow-up recommended after ' + fu + ' days', description: 'Due: ' + fmtD(due), due, createdAt: Date.now() });
    }
    if (share) await notify(c.patientId, '✅ Doctor Reviewed Your Case', 'Dr. ' + ME.name + ' verified your case and added clinical information.');
    await logAccess(c.patientId, '👨‍⚕️ Dr. ' + ME.name + ' reviewed your case & updated prescription');
    toast('✅ Verified & sent to patient! Timeline updated.');
    STATE.cases = STATE.cases.filter(x => x.id !== c.id);
    renderDoctorCases(); go('d-cases');
  } catch (err) { toast('⚠️ ' + errMsg(err)); }
});

/* ----- PATIENTS SEARCH ----- */
 $('#dpSearch').addEventListener('input', renderPatients);
function renderPatients() {
  const el = $('#dpList'); if (!el || ROLE !== 'doctor') return;
  const q = ($('#dpSearch').value || '').trim().toLowerCase();
  el.innerHTML = STATE.patients.filter(p => !q || (p.name || '').toLowerCase().includes(q) || (p.healthId || '').toLowerCase().includes(q)).map(p =>
    '<div class="card"><b>' + esc(p.name) + '</b> <span class="chip blue">' + esc(p.healthId || '') + '</span>' +
    '<p class="muted">' + ageOf(p.dob) + ' • ' + esc(p.gender || '') + ' • 🩸 ' + esc(p.bloodGroup || '—') + '</p>' +
    '<p class="muted">⚠️ ' + esc((p.allergies || 'None').slice(0, 60)) + '</p>' +
    '<div style="display:flex;gap:8px;margin-top:8px">' +
    '<button class="btn ghost sm" data-act="view-patient" data-id="' + p.id + '">👤 Snapshot</button>' +
    '<button class="btn primary sm" data-act="open-chat" data-id="' + p.id + '" data-name="' + esc(p.name) + '">💬 Chat</button></div></div>').join('') || '<p class="muted">No patients found.</p>';
}
document.addEventListener('click', async e => {
  const vp = e.target.closest('[data-act="view-patient"]'); if (!vp) return;
  const p = STATE.patients.find(x => x.id === vp.dataset.id); if (!p) return;
  await logAccess(p.id, '👨‍⚕️ Dr. ' + ME.name + ' viewed patient snapshot');
  showModal('<h3>👤 ' + esc(p.name) + '</h3><div class="kv" style="margin-top:10px">' + kvRows([
    ['Health ID', p.healthId], ['Age/Gender', ageOf(p.dob) + ' • ' + p.gender], ['Blood', p.bloodGroup], ['Aadhaar', p.aadhaar ? 'XXXX XXXX ' + String(p.aadhaar).slice(-4) : '—'],
    ['Allergies', p.allergies], ['Conditions', p.conditions], ['Surgeries', p.surgeries], ['Accidents', p.accidents], ['Family', p.familyHistory], ['Emergency', (p.emergencyName || '') + ' ' + (p.emergencyPhone || '')]
  ]) + '</div><small class="muted">This access has been logged in the patient\'s audit trail 🔐</small>');
});

function renderDocAppts() {
  const el = $('#daList'); if (!el || ROLE !== 'doctor') return;
  el.innerHTML = STATE.appts.map(a =>
    '<div class="list-item"><div class="li-main"><b>' + esc(a.patientName) + ' • ' + fmtD(a.date) + ' ' + esc(a.time) + '</b><small>' + esc(a.type || '') + ' • ' + esc(a.reason || '') + '</small></div>' +
    '<div class="li-actions"><span class="chip ' + (a.status === 'upcoming' ? 'blue' : a.status === 'completed' ? 'green' : 'red') + '">' + esc(a.status) + '</span>' +
    (a.status === 'upcoming' ? '<button class="btn primary sm" data-act="complete-appt" data-id="' + a.id + '">Mark Done</button>' : '') + '</div></div>').join('') || '<p class="muted">No appointments.</p>';
}

/* ============================================================
   HOSPITAL
   ============================================================ */
function bindHospital() {
  UNBINDS.push(db.collection('appointments').onSnapshot(async () => {
    try {
      const asnap = await db.collection('appointments').get();
      STATE.appts = asnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const ds = await db.collection('users').where('role', '==', 'doctor').get();
      STATE.doctors = ds.docs.map(d => ({ id: d.id, ...d.data() }));
      const ps = await db.collection('users').where('role', '==', 'patient').get();
      STATE.patients = ps.docs.map(d => ({ id: d.id, ...d.data() }));
      renderHospital();
    } catch (e) { console.error(e); }
  }, console.error));
}
function tableHTML(headers, rows) {
  if (!rows.length) return '<p class="muted">No records yet.</p>';
  return '<table><tr>' + headers.map(h => '<th>' + h + '</th>').join('') + '</tr>' + rows.map(r => '<tr>' + r.map(c => '<td>' + c + '</td>').join('') + '</tr>').join('') + '</table>';
}
function renderHospital() {
  if (ROLE !== 'hospital') return;
  const today = todayStr();
  $('#hhStats').innerHTML = [['👥 Patients', STATE.patients.length], ['👨‍⚕️ Doctors', STATE.doctors.length], ['📅 Today\'s Appointments', STATE.appts.filter(a => a.date === today).length]]
    .map(([k, v]) => '<div class="card center"><h4>' + k + '</h4><p style="font-size:30px;font-weight:800;color:var(--primary)">' + v + '</p></div>').join('');
  const todayRows = STATE.appts.filter(a => a.date === today).map(a => [esc(a.patientName), esc(a.doctorName), esc(a.time), esc(a.type || ''), '<span class="chip ' + (a.status === 'upcoming' ? 'blue' : 'green') + '">' + esc(a.status) + '</span>']);
  $('#hhQueue').innerHTML = tableHTML(['Patient', 'Doctor', 'Time', 'Type', 'Status'], todayRows);
  $('#hDocTable').innerHTML = tableHTML(['Doctor', 'Specialization', 'Hospital', 'Exp', 'Reg No'], STATE.doctors.map(d => ['👨‍⚕️ ' + esc(d.name) + (isOnline(d) ? ' 🟢' : ''), esc(d.specialization || ''), esc(d.hospital || ''), esc(d.experience || '—'), esc(d.regNo || '')]));
  const apptRows = STATE.appts.slice().sort((a, b) => (b.date || '').localeCompare(a.date || '')).map(a => [fmtD(a.date), esc(a.patientName), esc(a.doctorName), esc(a.time), esc(a.status)]);
  $('#hApptTable').innerHTML = tableHTML(['Date', 'Patient', 'Doctor', 'Time', 'Status'], apptRows);
}
document.addEventListener('click', async e => {
  if (!e.target.closest('[data-act="h-upload"]')) return;
  const hid = $('#huHid').value.trim().toUpperCase();
  const title = $('#huTitle').value.trim();
  if (!hid || !title) return toast('⚠️ Health ID and title are required.');
  try {
    const ps = await db.collection('users').where('healthId', '==', hid).limit(1).get();
    if (ps.empty) return toast('⚠️ Health ID not found.');
    const p = ps.docs[0];
    await db.collection('reports').add({ patientId: p.id, title, type: $('#huType').value, date: $('#huDate').value || todayStr(), hospital: ME.name, doctor: $('#huDoctor').value.trim(), note: $('#huNote').value.trim(), verified: true, uploadedBy: ME.name, uploadedByRole: 'hospital', createdAt: Date.now() });
    await db.collection('timeline').add({ patientId: p.id, date: todayStr(), type: 'report', icon: '🧪', title, description: $('#huType').value + ' — ' + ME.name, createdAt: Date.now() });
    await logAccess(p.id, '🏥 ' + ME.name + ' uploaded a report');
    await notify(p.id, '🧪 New Report Uploaded', title + ' — verified by ' + ME.name);
    $('#huHid').value = ''; $('#huTitle').value = ''; $('#huNote').value = '';
    toast('✅ Report uploaded & patient notified');
  } catch (err) { toast('⚠️ ' + errMsg(err)); }
});

/* ============================================================
   VOICE SCRIBE
   ============================================================ */
document.addEventListener('click', e => {
  const m = e.target.closest('[data-act="mic"]'); if (!m) return;
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return toast('Voice input is not supported in this browser (please use Chrome).');
  try {
    const rec = new SR(); rec.lang = 'en-IN'; rec.interimResults = false;
    m.classList.add('rec'); toast('🎙️ Listening… speak now');
    rec.onresult = ev => { const t = document.getElementById(m.dataset.target); t.value = (t.value ? t.value + ' ' : '') + ev.results[0][0].transcript; };
    rec.onend = () => m.classList.remove('rec');
    rec.onerror = () => { m.classList.remove('rec'); toast('⚠️ Microphone error.'); };
    rec.start();
  } catch (err) { m.classList.remove('rec'); toast('⚠️ Could not start the microphone.'); }
});

/* ----- Overlay backdrop click → close ----- */
 $$('.overlay').forEach(ov => ov.addEventListener('click', e => { if (e.target === ov) ov.classList.add('hidden'); }));