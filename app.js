/* ============================================================
   CARE VAULT v11 — FINAL
   Patient dashboards cleaned (no Health Overview / AI scheme),
   doctor dashboard in doctor POV (no AI insights), hospital
   dashboard cleaned, notifications render fix, universal
   calendar date picker, settings+photo fixed, billing, i18n.
   ============================================================ */
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const esc = s => (s == null ? '' : String(s)).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const todayStr = () => new Date().toISOString().slice(0, 10);
const fmtD = d => { if (!d) return '—'; try { return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); } catch (e) { return d; } };
const fmtDT = t => { if (!t) return '—'; try { return new Date(t).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }); } catch (e) { return String(t); } };
const uid6 = () => Math.random().toString(36).slice(2, 8).toUpperCase();
const maskAadhaar = a => a ? 'XXXX XXXX ' + String(a).slice(-4) : '—';
function timeToMin(t) { const m = String(t || '').match(/(\d+):(\d+)\s*(AM|PM)/i); if (!m) return 0; let h = (+m[1]) % 12; if (/pm/i.test(m[3])) h += 12; return h * 60 + (+m[2]); }
function schedTimeFromDosage(d) { const s = (d || '').toLowerCase();
  if (s.includes('breakfast') || s.includes('morning')) return '08:00 AM';
  if (s.includes('lunch') || s.includes('afternoon')) return '01:00 PM';
  if (s.includes('dinner') || s.includes('night')) return '08:00 PM';
  if (s.includes('evening')) return '06:00 PM';
  return '09:00 AM'; }
function avatarHTML(p, cls) { cls = cls || 'pava';
  if (p && p.photo) return '<img src="' + p.photo + '" class="' + cls + '" alt="">';
  return '<div class="' + cls + '" style="display:flex;align-items:center;justify-content:center">' + (p && p.role === 'doctor' ? '👨‍⚕️' : '🧑') + '</div>'; }
function telLink(phone) { const n = String(phone || '').replace(/\D/g, ''); return n ? 'tel:+91' + n.slice(-10) : null; }

/* ============================================================
   UNIVERSAL DATE PICKER (Year+Month dropdowns + day calendar)
   ============================================================ */
const DP_MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DP_DOW = ['Su','Mo','Tu','We','Th','Fr','Sa'];
function mountDatePickers(root) {
  (root || document).querySelectorAll('input[type="date"]').forEach(inp => {
    if (inp.dataset.dpMounted === '1') return;
    inp.dataset.dpMounted = '1';
    inp.style.display = 'none';
    const wrap = document.createElement('div'); wrap.className = 'dp';
    const display = document.createElement('button'); display.type = 'button'; display.className = 'dp-display';
    const panel = document.createElement('div'); panel.className = 'dp-panel';
    const head = document.createElement('div'); head.className = 'dp-head';
    const selM = document.createElement('select');
    const selY = document.createElement('select');
    const cy = new Date().getFullYear();
    selM.innerHTML = DP_MONTHS.map((m, i) => '<option value="' + i + '">' + m + '</option>').join('');
    for (let y = cy + 2; y >= 1900; y--) selY.innerHTML += '<option value="' + y + '">' + y + '</option>';
    head.appendChild(selM); head.appendChild(selY);
    const grid = document.createElement('div'); grid.className = 'dp-grid';
    const actions = document.createElement('div'); actions.className = 'dp-actions';
    const btnToday = document.createElement('button'); btnToday.type = 'button'; btnToday.className = 'btn ghost sm'; btnToday.textContent = 'Today';
    const btnClear = document.createElement('button'); btnClear.type = 'button'; btnClear.className = 'btn ghost sm'; btnClear.textContent = 'Clear';
    actions.appendChild(btnToday); actions.appendChild(btnClear);
    panel.appendChild(head); panel.appendChild(grid); panel.appendChild(actions);
    wrap.appendChild(display); wrap.appendChild(panel);
    inp.after(wrap);
    let view = new Date();
    function syncFromInput() {
      const v = inp.value;
      if (v) { const p = v.split('-'); view = new Date(+p[0], +p[1] - 1, +p[2]); selM.value = view.getMonth(); selY.value = view.getFullYear(); display.innerHTML = '📅 <b>' + fmtD(v) + '</b>'; }
      else { display.innerHTML = '📅 <span class="muted">Select date</span>'; }
    }
    function renderGrid() {
      grid.innerHTML = DP_DOW.map(d => '<span class="dow">' + d + '</span>').join('');
      const y = view.getFullYear(), m = view.getMonth();
      selM.value = m; selY.value = y;
      const first = new Date(y, m, 1).getDay();
      const days = new Date(y, m + 1, 0).getDate();
      for (let i = 0; i < first; i++) { const e = document.createElement('button'); e.type = 'button'; e.className = 'dp-day empty'; grid.appendChild(e); }
      const minV = inp.min ? inp.min : '';
      const today = todayStr();
      for (let d = 1; d <= days; d++) {
        const iso = y + '-' + String(m + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
        const b = document.createElement('button'); b.type = 'button'; b.className = 'dp-day'; b.textContent = d;
        if (iso === today) b.classList.add('today');
        if (iso === inp.value) b.classList.add('sel');
        if (minV && iso < minV) b.disabled = true;
        b.onclick = () => { inp.value = iso; syncFromInput(); wrap.classList.remove('open'); inp.dispatchEvent(new Event('change', { bubbles: true })); };
        grid.appendChild(b);
      }
    }
    display.onclick = e => { e.stopPropagation(); $$('.dp.open').forEach(w => { if (w !== wrap) w.classList.remove('open'); }); wrap.classList.toggle('open'); if (wrap.classList.contains('open')) renderGrid(); };
    selM.onchange = () => { view = new Date(+selY.value, +selM.value, 1); renderGrid(); };
    selY.onchange = () => { view = new Date(+selY.value, +selM.value, 1); renderGrid(); };
    btnToday.onclick = () => { inp.value = todayStr(); syncFromInput(); wrap.classList.remove('open'); inp.dispatchEvent(new Event('change', { bubbles: true })); };
    btnClear.onclick = () => { inp.value = ''; syncFromInput(); wrap.classList.remove('open'); inp.dispatchEvent(new Event('change', { bubbles: true })); };
    panel.onclick = e => e.stopPropagation();
    inp._dpSync = syncFromInput;
    syncFromInput();
  });
}
document.addEventListener('click', () => $$('.dp.open').forEach(w => w.classList.remove('open')));

/* ---------- I18N (10 Indian languages) ---------- */
const LANGS = [['en','English'],['hi','हिन्दी'],['ta','தமிழ்'],['te','తెలుగు'],['ml','മലയാളം'],['kn','ಕನ್ನಡ'],['bn','বাংলা'],['mr','मराठी'],['gu','ગુજરાતી'],['pa','ਪੰਜਾਬੀ']];
const I18N = {
 en:{dashboard:'Dashboard',upcoming:'Upcoming',mycase:'My Case',meds:'Medicines',reports:'Reports',appts:'Appointments',doctors:'My Doctors',timeline:'Timeline',tracking:'Health Tracking',qr:'My QR',privacy:'Privacy & Access',billing:'Billing',notifs:'Notifications',settings:'Settings',emergency:'Emergency',logout:'Logout',cases:'Cases',verify:'Verify Medicines',chats:'Messages',patients:'Patients',dappts:'My Appointments',earnings:'My Earnings',hdash:'Hospital Dashboard',hpatients:'All Patients',hdoctors:'All Doctors',hcases:'All Cases',hmeds:'Medicines',happts:'Appointments',hupload:'Upload Report',greetM:'Good Morning',greetA:'Good Afternoon',greetE:'Good Evening',page:'Care Vault'},
 hi:{dashboard:'डैशबोर्ड',upcoming:'आगामी',mycase:'मेरा केस',meds:'दवाइयाँ',reports:'रिपोर्ट',appts:'अपॉइंटमेंट',doctors:'मेरे डॉक्टर',timeline:'टाइमलाइन',tracking:'स्वास्थ्य ट्रैकिंग',qr:'मेरा QR',privacy:'गोपनीयता व पहुँच',billing:'बिल',notifs:'सूचनाएँ',settings:'सेटिंग्स',emergency:'आपातकाल',logout:'लॉगआउट',cases:'केस',verify:'दवा सत्यापन',chats:'संदेश',patients:'मरीज़',dappts:'मेरे अपॉइंटमेंट',earnings:'मेरी कमाई',hdash:'अस्पताल डैशबोर्ड',hpatients:'सभी मरीज़',hdoctors:'सभी डॉक्टर',hcases:'सभी केस',hmeds:'दवाइयाँ',happts:'अपॉइंटमेंट',hupload:'रिपोर्ट अपलोड',greetM:'सुप्रभात',greetA:'नमस्कार',greetE:'शुभ संध्या',page:'केयर वॉल्ट'},
 ta:{dashboard:'டாஷ்போர்டு',upcoming:'வரவிருக்கும்',mycase:'என் கேஸ்',meds:'மருந்துகள்',reports:'அறிக்கைகள்',appts:'சந்திப்புகள்',doctors:'என் மருத்துவர்கள்',timeline:'காலவரிசை',tracking:'உடல்நல கண்காணிப்பு',qr:'என் QR',privacy:'தனியுரிமை & அணுகல்',billing:'பில்',notifs:'அறிவிப்புகள்',settings:'அமைப்புகள்',emergency:'அவசரம்',logout:'வெளியேறு',cases:'கேஸ்கள்',verify:'மருந்து சரிபார்ப்பு',chats:'செய்திகள்',patients:'நோயாளிகள்',dappts:'என் சந்திப்புகள்',earnings:'என் வருவாய்',hdash:'மருத்துவமனை டாஷ்போர்டு',hpatients:'அனைத்து நோயாளிகள்',hdoctors:'அனைத்து மருத்துவர்கள்',hcases:'அனைத்து கேஸ்கள்',hmeds:'மருந்துகள்',happts:'சந்திப்புகள்',hupload:'அறிக்கை பதிவேற்றம்',greetM:'காலை வணக்கம்',greetA:'மதிய வணக்கம்',greetE:'மாலை வணக்கம்',page:'கேர் வால்ட்'},
 te:{dashboard:'డాష్‌బోర్డ్',upcoming:'రాబోయేవి',mycase:'నా కేసు',meds:'మందులు',reports:'నివేదికలు',appts:'అపాయింట్‌మెంట్లు',doctors:'నా డాక్టర్లు',timeline:'టైమ్‌లైన్',tracking:'ఆరోగ్య ట్రాకింగ్',qr:'నా QR',privacy:'గోప్యత & యాక్సెస్',billing:'బిల్లు',notifs:'నోటిఫికేషన్లు',settings:'సెట్టింగ్‌లు',emergency:'అత్యవసరం',logout:'లాగ్ అవుట్',cases:'కేసులు',verify:'మందు ధృవీకరణ',chats:'సందేశాలు',patients:'రోగులు',dappts:'నా అపాయింట్‌మెంట్లు',earnings:'నా ఆదాయం',hdash:'ఆసుపత్రి డాష్‌బోర్డ్',hpatients:'అన్ని రోగులు',hdoctors:'అన్ని డాక్టర్లు',hcases:'అన్ని కేసులు',hmeds:'మందులు',happts:'అపాయింట్‌మెంట్లు',hupload:'నివేదిక అప్‌లోడ్',greetM:'శుభోదయం',greetA:'శుభ మధ్యాహ్నం',greetE:'శుభ సాయంత్రం',page:'కేర్ వాల్ట్'},
 ml:{dashboard:'ഡാഷ്ബോർഡ്',upcoming:'വരാനിരിക്കുന്നവ',mycase:'എന്റെ കേസ്',meds:'മരുന്നുകൾ',reports:'റിപ്പോർട്ടുകൾ',appts:'അപ്പോയിന്റ്മെന്റുകൾ',doctors:'എന്റെ ഡോക്ടർമാർ',timeline:'ടൈംലൈൻ',tracking:'ഹെൽത്ത് ട്രാക്കിംഗ്',qr:'എന്റെ QR',privacy:'സ്വകാര്യത & ആക്സസ്സ്',billing:'ബിൽ',notifs:'അറിയിപ്പുകൾ',settings:'സെറ്റിംഗ്സ്',emergency:'അത്യാഹിതം',logout:'ലോഗ് ഔട്ട്',cases:'കേസുകൾ',verify:'മരുന്ന് സ്ഥിരീകരണം',chats:'സന്ദേശങ്ങൾ',patients:'രോഗികൾ',dappts:'എന്റെ അപ്പോയിന്റ്മെന്റുകൾ',earnings:'എന്റെ വരുമാനം',hdash:'ആശുപത്രി ഡാഷ്ബോർഡ്',hpatients:'എല്ലാ രോഗികൾ',hdoctors:'എല്ലാ ഡോക്ടർമാർ',hcases:'എല്ലാ കേസുകൾ',hmeds:'മരുന്നുകൾ',happts:'അപ്പോയിന്റ്മെന്റുകൾ',hupload:'റിപ്പോർട്ട് അപ്‌ലോഡ്',greetM:'സുപ്രഭാതം',greetA:'ശുഭ ഉച്ച',greetE:'ശുഭ സന്ധ്യ',page:'കെയർ വോൾട്ട്'},
 kn:{dashboard:'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',upcoming:'ಮುಂಬರುವ',mycase:'ನನ್ನ ಪ್ರಕರಣ',meds:'ಔಷಧಿಗಳು',reports:'ವರದಿಗಳು',appts:'ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್‌ಗಳು',doctors:'ನನ್ನ ವೈದ್ಯರು',timeline:'ಟೈಮ್‌ಲೈನ್',tracking:'ಆರೋಗ್ಯ ಟ್ರ್ಯಾಕಿಂಗ್',qr:'ನನ್ನ QR',privacy:'ಗೋಪ್ಯತೆ ಮತ್ತು ಪ್ರವೇಶ',billing:'ಬಿಲ್',notifs:'ಅಧಿಸೂಚನೆಗಳು',settings:'ಸೆಟ್ಟಿಂಗ್‌ಗಳು',emergency:'ತುರ್ತು',logout:'ಲಾಗ್ ಔಟ್',cases:'ಪ್ರಕರಣಗಳು',verify:'ಔಷಧ ಪರಿಶೀಲನೆ',chats:'ಸಂದೇಶಗಳು',patients:'ರೋಗಿಗಳು',dappts:'ನನ್ನ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್‌ಗಳು',earnings:'ನನ್ನ ಆದಾಯ',hdash:'ಆಸ್ಪತ್ರೆ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',hpatients:'ಎಲ್ಲಾ ರೋಗಿಗಳು',hdoctors:'ಎಲ್ಲಾ ವೈದ್ಯರು',hcases:'ಎಲ್ಲಾ ಪ್ರಕರಣಗಳು',hmeds:'ಔಷಧಿಗಳು',happts:'ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್‌ಗಳು',hupload:'ವರದಿ ಅಪ್‌ಲೋಡ್',greetM:'ಶುಭೋದಯ',greetA:'ಶುಭ ಮಧ್ಯಾಹ್ನ',greetE:'ಶುಭ ಸಂಜೆ',page:'ಕೇರ್ ವಾಲ್ಟ್'},
 bn:{dashboard:'ড্যাশবোর্ড',upcoming:'আসন্ন',mycase:'আমার কেস',meds:'ওষুধ',reports:'রিপোর্ট',appts:'অ্যাপয়েন্টমেন্ট',doctors:'আমার ডাক্তার',timeline:'টাইমলাইন',tracking:'হেলথ ট্র্যাকিং',qr:'আমার QR',privacy:'গোপনীয়তা ও অ্যাক্সেস',billing:'বিল',notifs:'বিজ্ঞপ্তি',settings:'সেটিংস',emergency:'জরুরি',logout:'লগআউট',cases:'কেস',verify:'ওষুধ যাচাই',chats:'বার্তা',patients:'রোগী',dappts:'আমার অ্যাপয়েন্টমেন্ট',earnings:'আমার আয়',hdash:'হাসপাতাল ড্যাশবোর্ড',hpatients:'সব রোগী',hdoctors:'সব ডাক্তার',hcases:'সব কেস',hmeds:'ওষুধ',happts:'অ্যাপয়েন্টমেন্ট',hupload:'রিপোর্ট আপলোড',greetM:'সুপ্রভাত',greetA:'শুভ অপরাহ্ন',greetE:'শুভ সন্ধ্যা',page:'কেয়ার ভল্ট'},
 mr:{dashboard:'डॅशबोर्ड',upcoming:'आगामी',mycase:'माझा केस',meds:'औषधे',reports:'अहवाल',appts:'अपॉइंटमेंट',doctors:'माझे डॉक्टर',timeline:'टाइमलाइन',tracking:'आरोग्य ट्रॅकिंग',qr:'माझा QR',privacy:'गोपनीयता व प्रवेश',billing:'बिल',notifs:'सूचना',settings:'सेटिंग्ज',emergency:'आपत्कालीन',logout:'लॉगआउट',cases:'केस',verify:'औषध पडताळणी',chats:'संदेश',patients:'रुग्ण',dappts:'माझी अपॉइंटमेंट',earnings:'माझी कमाई',hdash:'रुग्णालय डॅशबोर्ड',hpatients:'सर्व रुग्ण',hdoctors:'सर्व डॉक्टर',hcases:'सर्व केस',hmeds:'औषधे',happts:'अपॉइंटमेंट',hupload:'अहवाल अपलोड',greetM:'शुभ प्रभात',greetA:'नमस्कार',greetE:'शुभ संध्याकाळ',page:'केअर व्हॉल्ट'},
 gu:{dashboard:'ડેશબોર્ડ',upcoming:'આગામી',mycase:'મારો કેસ',meds:'દવાઓ',reports:'રિપોર્ટ',appts:'એપોઇન્ટમેન્ટ',doctors:'મારા ડૉક્ટર',timeline:'ટાઇમલાઇન',tracking:'હેલ્થ ટ્રેકિંગ',qr:'મારો QR',privacy:'ગોપનીયતા અને પ્રવેશ',billing:'બિલ',notifs:'સૂચનાઓ',settings:'સેટિંગ્સ',emergency:'કટોકટી',logout:'લોગ આઉટ',cases:'કેસ',verify:'દવા ચકાસણી',chats:'સંદેશા',patients:'દર્દીઓ',dappts:'મારી એપોઇન્ટમેન્ટ',earnings:'મારી કમાણી',hdash:'હોસ્પિટલ ડેશબોર્ડ',hpatients:'બધા દર્દીઓ',hdoctors:'બધા ડૉક્ટર',hcases:'બધા કેસ',hmeds:'દવાઓ',happts:'એપોઇન્ટમેન્ટ',hupload:'રિપોર્ટ અપલોડ',greetM:'સુપ્રભાત',greetA:'શુભ બપોર',greetE:'શુભ સાંજ',page:'કેર વોલ્ટ'},
 pa:{dashboard:'ਡੈਸ਼ਬੋਰਡ',upcoming:'ਆਉਣ ਵਾਲੇ',mycase:'ਮੇਰਾ ਕੇਸ',meds:'ਦਵਾਈਆਂ',reports:'ਰਿਪੋਰਟਾਂ',appts:'ਅਪਾਇੰਟਮੈਂਟ',doctors:'ਮੇਰੇ ਡਾਕਟਰ',timeline:'ਟਾਈਮਲਾਈਨ',tracking:'ਸਿਹਤ ਟ੍ਰੈਕਿੰਗ',qr:'ਮੇਰਾ QR',privacy:'ਗੁਪਤਤਾ ਅਤੇ ਪਹੁੰਚ',billing:'ਬਿੱਲ',notifs:'ਸੂਚਨਾਵਾਂ',settings:'ਸੈਟਿੰਗਾਂ',emergency:'ਐਮਰਜੈਂਸੀ',logout:'ਲੌਗ ਆਉਟ',cases:'ਕੇਸ',verify:'ਦਵਾਈ ਪੁਸ਼ਟੀ',chats:'ਸੁਨੇਹੇ',patients:'ਮਰੀਜ਼',dappts:'ਮੇਰੀਆਂ ਅਪਾਇੰਟਮੈਂਟਾਂ',earnings:'ਮੇਰੀ ਕਮਾਈ',hdash:'ਹਸਪਤਾਲ ਡੈਸ਼ਬੋਰਡ',hpatients:'ਸਾਰੇ ਮਰੀਜ਼',hdoctors:'ਸਾਰੇ ਡਾਕਟਰ',hcases:'ਸਾਰੇ ਕੇਸ',hmeds:'ਦਵਾਈਆਂ',happts:'ਅਪਾਇੰਟਮੈਂਟ',hupload:'ਰਿਪੋਰਟ ਅੱਪਲੋਡ',greetM:'ਸ਼ੁਭ ਸਵੇਰ',greetA:'ਸ਼ੁਭ ਦੁਪਹਿਰ',greetE:'ਸ਼ੁਭ ਸ਼ਾਮ',page:'ਕੇਅਰ ਵੌਲਟ'}
};
let CUR_LANG = localStorage.getItem('cv_lang') || 'en';
const t = k => (I18N[CUR_LANG] && I18N[CUR_LANG][k]) || I18N.en[k] || k;
function fillLangSelects() { ['#langSel', '#langSelAuth', '#setLang'].forEach(id => { const el = $(id); if (!el) return; el.innerHTML = LANGS.map(([v, n]) => '<option value="' + v + '">' + n + '</option>').join(''); el.value = CUR_LANG; }); }
function setLanguage(v) {
  CUR_LANG = v; localStorage.setItem('cv_lang', v); fillLangSelects();
  if (ME) { db.collection('users').doc(ME.id).update({ language: v }).catch(() => {}); buildNav(); if (CURRENT_PAGE) go(CURRENT_PAGE, { silent: true }); }
  toast('Language updated ✅');
}
['langSel', 'langSelAuth', 'setLang'].forEach(id => { const el = document.getElementById(id); if (el) el.addEventListener('change', e => setLanguage(e.target.value)); });
fillLangSelects();

let ME = null, ROLE = null, UNBINDS = [];
const STATE = { doctors: [], patients: [], cases: [], myReviewed: [], meds: [], reports: [], appts: [], timeline: [], access: [], consents: [], notifs: [], vitals: [], unverifiedMeds: [], allCases: [], medsAll: [], bills: [], myBills: [], billsAll: [] };
let CURRENT_CASE = null, CHAT_WITH = null, CURRENT_APTAB = 'upcoming', CURRENT_CTAB = 'waiting', chosenSlot = null, chatUnsub = null, selectedPain = null, pendingPhoto = null;
let dutyWatch = null, lastLocSend = 0, focusDoctorId = null, cvMap = null, markersLayer = null;
let CURRENT_PAGE = null, NAV_STACK = [];

window.addEventListener('error', e => { try { toast('⚠️ ' + e.message); } catch (_) {} });
window.addEventListener('unhandledrejection', e => { try { const r = e.reason; toast('⚠️ ' + (r && r.message ? r.message : 'Unexpected error')); } catch (_) {} });
function toast(msg) { const el = $('#toastRoot'); if (!el) { console.log('TOAST:', msg); return; } const t2 = document.createElement('div'); t2.className = 'toast'; t2.textContent = msg; el.appendChild(t2); setTimeout(() => t2.remove(), 3500); }
function showModal(html) { $('#modalCard').innerHTML = html; $('#modalRoot').classList.remove('hidden'); }
function closeModal() { $('#modalRoot').classList.add('hidden'); }
function modalCloseBtn() { return '<button class="btn ghost sm" data-act="close-modal" style="margin-top:12px">Close</button>'; }
function errMsg(err) {
  const c = (err && err.code) ? err.code : '';
  if (c.includes('email-already-in-use')) return 'This email is already registered — please Login instead.';
  if (c.includes('invalid-email')) return 'Invalid email format.';
  if (c.includes('weak-password')) return 'Password must be at least 6 characters.';
  if (c.includes('operation-not-allowed')) return 'Firebase Console → Authentication → Sign-in method → enable Email/Password!';
  if (c.includes('unauthorized-domain')) return 'Firebase Console → Authentication → Settings → Authorized domains → add your GitHub Pages domain!';
  if (c.includes('invalid-credential') || c.includes('wrong-password') || c.includes('user-not-found')) return 'Wrong email or password.';
  if (c.includes('network')) return 'Network problem — check your internet.';
  if (c.includes('permission-denied')) return 'Firestore rules issue — publish the rules again.';
  return (err && err.message) ? err.message : 'Something went wrong.';
}

/* ---------- THEME / FONT ---------- */
function applyTheme(v) { document.documentElement.dataset.theme = v; localStorage.setItem('cv_theme', v); ['themeSelAuth', 'themeSel', 'themeSelSet'].forEach(id => { const el = document.getElementById(id); if (el) el.value = v; }); }
['themeSelAuth', 'themeSel', 'themeSelSet'].forEach(id => { const el = document.getElementById(id); if (el) el.addEventListener('change', e => { applyTheme(e.target.value); toast('Theme changed ✅'); }); });
applyTheme(localStorage.getItem('cv_theme') || 'light');
function setFont(v) { document.body.classList.remove('font-sm', 'font-lg'); if (v === 'sm') document.body.classList.add('font-sm'); if (v === 'lg') document.body.classList.add('font-lg'); localStorage.setItem('cv_font', v); }
setFont(localStorage.getItem('cv_font') || 'md');

/* ---------- AUTH TABS / DEMO ---------- */
 $('#tabLogin').onclick = () => { $('#tabLogin').classList.add('active'); $('#tabReg').classList.remove('active'); $('#formLogin').classList.remove('hidden'); $('#formReg').classList.add('hidden'); };
 $('#tabReg').onclick = () => { $('#tabReg').classList.add('active'); $('#tabLogin').classList.remove('active'); $('#formReg').classList.remove('hidden'); $('#formLogin').classList.add('hidden'); };
 $$('.reg-pill').forEach(p => p.onclick = () => {
  $$('.reg-pill').forEach(x => x.classList.remove('active')); p.classList.add('active');
  const r = p.dataset.regrole;
  $('#regPatient').classList.toggle('hidden', r !== 'patient');
  $('#regDoctor').classList.toggle('hidden', r !== 'doctor');
  $('#regHospital').classList.toggle('hidden', r !== 'hospital');
});
const DEMO_PASS = 'demo123';
const DEMO = {
  patient: { email: 'patient.demo@carevault.in', profile: { role: 'patient', name: 'Arjun Kumar', dob: '1980-03-14', gender: 'Male', bloodGroup: 'O+', phone: '9840012345', aadhaar: '432187651122', address: '12, Gandhi Street, Anna Nagar, Chennai 600040', emergencyName: 'Priya Kumar (Wife)', emergencyPhone: '9840055555', heightCm: '170', weightKg: '74', allergies: 'Penicillin (medicine allergy), Dust (other)', conditions: 'Type 2 Diabetes (2021), Hypertension (2022)', surgeries: 'Appendectomy | 2019 | Apollo Hospitals | Dr. Rajan | Appendicitis\nKnee Arthroscopy | 2022 | Kauvery Hospital | Dr. Menon | Meniscus tear', accidents: 'Two-wheeler accident 2016 — right arm fracture, treated at Kauvery Hospital', familyHistory: 'Father — Diabetes; Grandmother — Hypertension', income: '240000', language: 'en', healthId: 'CV-DEMO01' } },
  doctor: { email: 'doctor.demo@carevault.in', profile: { role: 'doctor', name: 'Arun Kumar', specialization: 'General Surgery', experience: '12', hospital: 'City General Hospital', regNo: 'TMC-45892', phone: '9840077777', onDuty: false } },
  hospital: { email: 'hospital.demo@carevault.in', profile: { role: 'hospital', name: 'City General Hospital', adminName: 'Admin Demo', phone: '9840088888', address: '1, Hospital Road, Chennai', licenseNo: 'TN-HOSP-1024' } }
};
async function quickDemo(role) {
  const d = DEMO[role]; if (!d) return;
  cleanupSession();
  try { await auth.signInWithEmailAndPassword(d.email, DEMO_PASS); toast('Logged in as demo ' + role + ' ✅'); }
  catch (err) {
    const c = (err && err.code) || '';
    if (c.includes('user-not-found') || c.includes('invalid-credential')) {
      try {
        const cred = await auth.createUserWithEmailAndPassword(d.email, DEMO_PASS);
        await db.collection('users').doc(cred.user.uid).set({ ...d.profile, email: d.email, createdAt: Date.now() });
        if (role === 'patient') await db.collection('medicines').add({ patientId: cred.user.uid, name: 'Metformin 500mg', dosage: '1 tablet after breakfast', startDate: todayStr(), durationDays: '30', prescribedBy: 'Arjun Kumar (self-reported)', verified: false, source: 'patient', active: true, createdAt: Date.now() });
        toast('Demo ' + role + ' account created & logged in ✅');
      } catch (e2) {
        if ((e2 && e2.code || '').includes('email-already-in-use')) { try { await auth.signInWithEmailAndPassword(d.email, DEMO_PASS); toast('Logged in ✅'); } catch (e3) { toast('⚠️ ' + errMsg(e3)); } }
        else toast('⚠️ ' + errMsg(e2));
      }
    } else toast('⚠️ ' + errMsg(err));
  }
}
document.addEventListener('click', e => { const dl = e.target.closest('[data-act="demo-login"]'); if (dl) quickDemo(dl.dataset.role); });
 $$('[data-act="demo-fill"]').forEach(b => b.onclick = () => {
  $('#rpName').value = 'Arjun Kumar';
  $('#rpDob').value = '1980-03-14'; if ($('#rpDob')._dpSync) $('#rpDob')._dpSync();
  $('#rpGender').value = 'Male';
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
      if (!name || !dob || !phone) return toast('⚠️ Name, Date of Birth (pick from calendar) and Phone are required.');
      if (aad.length !== 12) return toast('⚠️ Aadhaar must be exactly 12 digits.');
      if (!email || pass.length < 6) return toast('⚠️ Email and a 6+ character password are required.');
      profile = { role: 'patient', name, dob, gender: $('#rpGender').value, bloodGroup: $('#rpBlood').value, phone, aadhaar: aad,
        address: $('#rpAddress').value.trim(), emergencyName: $('#rpEName').value.trim(), emergencyPhone: $('#rpEPhone').value.trim(),
        heightCm: $('#rpHeight').value, weightKg: $('#rpWeight').value, allergies: $('#rpAllergies').value.trim(),
        conditions: $('#rpConditions').value.trim(), surgeries: $('#rpSurgeries').value.trim(), accidents: $('#rpAccidents').value.trim(),
        familyHistory: $('#rpFamily').value.trim(), income: $('#rpIncome').value, language: CUR_LANG };
    } else if (role === 'doctor') {
      email = $('#rdEmail').value.trim(); pass = $('#rdPass').value;
      if (!$('#rdName').value.trim() || !$('#rdSpec').value.trim() || !$('#rdHospital').value.trim() || !$('#rdReg').value.trim()) return toast('⚠️ Please fill all required doctor fields.');
      if (!email || pass.length < 6) return toast('⚠️ Email and a 6+ character password are required.');
      profile = { role: 'doctor', name: $('#rdName').value.trim(), specialization: $('#rdSpec').value.trim(), experience: $('#rdExp').value, hospital: $('#rdHospital').value.trim(), regNo: $('#rdReg').value.trim(), phone: $('#rdPhone').value.trim(), onDuty: false, language: CUR_LANG };
    } else {
      email = $('#rhEmail').value.trim(); pass = $('#rhPass').value;
      if (!$('#rhName').value.trim() || !$('#rhAdmin').value.trim()) return toast('⚠️ Hospital name and admin name are required.');
      if (!email || pass.length < 6) return toast('⚠️ Email and a 6+ character password are required.');
      profile = { role: 'hospital', name: $('#rhName').value.trim(), adminName: $('#rhAdmin').value.trim(), phone: $('#rhPhone').value.trim(), address: $('#rhAddress').value.trim(), licenseNo: $('#rhLicense').value.trim(), language: CUR_LANG };
    }
    const cred = await auth.createUserWithEmailAndPassword(email, pass);
    profile.email = email; profile.createdAt = Date.now();
    if (role === 'patient') profile.healthId = 'CV-' + uid6();
    try { await db.collection('users').doc(cred.user.uid).set(profile); }
    catch (dbErr) { await cred.user.delete().catch(() => {}); return toast('⚠️ Firestore issue: ' + errMsg(dbErr)); }
    toast('✅ Welcome to Care Vault!' + (profile.healthId ? ' Your Health ID: ' + profile.healthId : ''));
  } catch (err) { toast('⚠️ ' + errMsg(err)); }
});

/* ---------- LOGIN / SESSION ---------- */
 $('#formLogin').addEventListener('submit', async e => {
  e.preventDefault();
  try { await auth.signInWithEmailAndPassword($('#loginEmail').value.trim(), $('#loginPass').value); }
  catch (err) { toast('⚠️ ' + errMsg(err)); }
});
function cleanupSession() {
  try { if (ROLE === 'doctor' && ME) db.collection('users').doc(ME.id).update({ onDuty: false, location: firebase.firestore.FieldValue.delete() }).catch(() => {}); } catch (e) {}
  if (dutyWatch) { navigator.geolocation.clearWatch(dutyWatch); dutyWatch = null; }
  if (chatUnsub) { chatUnsub(); chatUnsub = null; }
  UNBINDS.forEach(u => { try { u(); } catch (e) {} }); UNBINDS = [];
  ME = null; ROLE = null; CURRENT_CASE = null; CHAT_WITH = null; chosenSlot = null; selectedPain = null; pendingPhoto = null; CURRENT_PAGE = null; NAV_STACK = [];
  Object.keys(STATE).forEach(k => STATE[k] = Array.isArray(STATE[k]) ? [] : STATE[k]);
}
async function doLogout() { cleanupSession(); await auth.signOut().catch(() => {}); location.reload(); }

auth.onAuthStateChanged(async user => {
  if (!user) { $('#screen-auth').classList.remove('hidden'); $('#app').classList.add('hidden'); return; }
  try {
    let snap = null;
    for (let i = 0; i < 4; i++) {
      const s = await db.collection('users').doc(user.uid).get();
      if (s.exists) { snap = s; break; }
      await new Promise(r => setTimeout(r, 400));
    }
    if (!snap) { toast('Profile missing — please register again.'); await auth.signOut(); return; }
    ME = { id: user.uid, ...snap.data() };
    ROLE = ME.role;
    if (ME.language && I18N[ME.language]) { CUR_LANG = ME.language; localStorage.setItem('cv_lang', CUR_LANG); fillLangSelects(); }
    enterApp();
  } catch (err) { toast('⚠️ ' + errMsg(err)); }
});

/* ---------- NAV + BACK/HOME ---------- */
const MENUS = {
  patient: [['p-dash', '🏠', 'dashboard'], ['p-upcoming', '🗓️', 'upcoming'], ['p-case', '📋', 'mycase'], ['p-meds', '💊', 'meds'], ['p-reports', '🧪', 'reports'], ['p-appts', '📅', 'appts'], ['p-doctors', '👨‍⚕️', 'doctors'], ['p-timeline', '🕐', 'timeline'], ['p-vitals', '📈', 'tracking'], ['p-qr', '📱', 'qr'], ['p-privacy', '🔒', 'privacy'], ['p-billing', '💰', 'billing'], ['p-notifs', '🔔', 'notifs'], ['p-settings', '⚙️', 'settings'], ['EMERGENCY', '🚑', 'emergency']],
  doctor: [['d-dash', '🏠', 'dashboard'], ['d-cases', '📋', 'cases'], ['d-verify', '💊', 'verify'], ['d-chats', '💬', 'chats'], ['d-patients', '🔍', 'patients'], ['d-appts', '📅', 'dappts'], ['d-billing', '💰', 'earnings'], ['p-notifs', '🔔', 'notifs'], ['p-settings', '⚙️', 'settings']],
  hospital: [['h-dash', '🏥', 'hdash'], ['h-patients', '👥', 'hpatients'], ['h-doctors', '👨‍⚕️', 'hdoctors'], ['h-cases', '📋', 'hcases'], ['h-meds', '💊', 'hmeds'], ['h-appts', '📅', 'happts'], ['h-billing', '💰', 'billing'], ['h-upload', '🧪', 'hupload'], ['p-notifs', '🔔', 'notifs'], ['p-settings', '⚙️', 'settings']]
};
const TKEY = { 'p-dash': 'dashboard', 'p-upcoming': 'upcoming', 'p-case': 'mycase', 'p-meds': 'meds', 'p-reports': 'reports', 'p-appts': 'appts', 'p-doctors': 'doctors', 'p-timeline': 'timeline', 'p-vitals': 'tracking', 'p-qr': 'qr', 'p-privacy': 'privacy', 'p-billing': 'billing', 'p-notifs': 'notifs', 'p-settings': 'settings', 'd-dash': 'dashboard', 'd-cases': 'cases', 'd-verify': 'verify', 'd-chats': 'chats', 'd-case': 'cases', 'd-patients': 'patients', 'd-appts': 'dappts', 'd-billing': 'earnings', 'h-dash': 'hdash', 'h-patients': 'hpatients', 'h-doctors': 'hdoctors', 'h-cases': 'hcases', 'h-meds': 'hmeds', 'h-appts': 'happts', 'h-upload': 'hupload', 'h-billing': 'billing' };
function homeId() { return ROLE === 'patient' ? 'p-dash' : ROLE === 'doctor' ? 'd-dash' : 'h-dash'; }
function buildNav() {
  const nav = $('#sideNav'); nav.innerHTML = '';
  MENUS[ROLE].forEach(([id, emo, key]) => {
    const b = document.createElement('button'); b.className = 'nav-item' + (id === 'EMERGENCY' ? ' danger' : ''); b.dataset.nav = id;
    b.innerHTML = emo + ' ' + t(key); nav.appendChild(b);
  });
  const lb = document.createElement('button'); lb.className = 'nav-item danger'; lb.dataset.nav = 'LOGOUT'; lb.innerHTML = '🚪 ' + t('logout'); nav.appendChild(lb);
  $('#sideRole').textContent = ROLE === 'patient' ? 'Patient Portal' : ROLE === 'doctor' ? 'Doctor Portal' : 'Hospital Portal';
  $('#sideName').textContent = ME.name || '—';
  $('#sideSub').textContent = ROLE === 'patient' ? (ME.healthId || '') : (ROLE === 'doctor' ? (ME.specialization || '') : (ME.adminName || ''));
  const av = $('#sideAvatar');
  av.textContent = ROLE === 'patient' ? '🧑' : ROLE === 'doctor' ? '👨‍⚕️' : '🏥';
  if (ME.photo) { av.style.backgroundImage = 'url(' + ME.photo + ')'; av.classList.add('has-photo'); } else { av.style.backgroundImage = ''; av.classList.remove('has-photo'); }
  $('#cbFab').classList.toggle('hidden', ROLE !== 'patient');
  $('#topSearch').classList.toggle('hidden', ROLE !== 'patient');
}
document.addEventListener('click', e => {
  const nv = e.target.closest('[data-nav]'); if (!nv) return;
  if (nv.tagName === 'A') e.preventDefault();
  const id = nv.dataset.nav;
  if (id === 'LOGOUT') { doLogout(); return; }
  if (id === 'EMERGENCY') { openEmergency(false); return; }
  go(id);
});
function go(id, opts) {
  if (!opts || !opts.silent) { if (CURRENT_PAGE && CURRENT_PAGE !== id) { NAV_STACK.push(CURRENT_PAGE); if (NAV_STACK.length > 40) NAV_STACK.shift(); } }
  CURRENT_PAGE = id;
  $$('.page').forEach(p => p.classList.add('hidden'));
  const pg = $('#pg-' + id);
  if (!pg) { toast('⚠️ Page section "#pg-' + id + '" is missing — replace index.html with the latest full file.'); return; }
  pg.classList.remove('hidden');
  $$('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.nav === id));
  $('#pageTitle').textContent = t(TKEY[id] || 'page');
  $('#sidebar').classList.remove('open');
  const hooks = {
    'p-dash': () => renderPatientDash(), 'p-upcoming': () => renderUpcoming(), 'p-case': () => renderMyCase(),
    'p-meds': () => renderMeds(), 'p-reports': () => renderReports(), 'p-appts': () => { renderAppts(); loadTakenSlots(); },
    'p-doctors': () => { renderDoctorsPage(); renderDoctorMap(); }, 'p-timeline': () => renderTimeline(), 'p-vitals': () => renderVitals(),
    'p-qr': () => renderQR(), 'p-privacy': () => { renderConsent(); renderAccess(); }, 'p-billing': () => renderPBilling(),
    'p-notifs': () => renderNotifList(),
    'p-settings': () => renderSettings(),
    'd-dash': () => renderDocDash(), 'd-cases': () => renderDoctorCases(), 'd-verify': () => renderVerifyMeds(), 'd-chats': () => renderDChats(), 'd-patients': () => renderPatients(), 'd-appts': () => renderDocAppts(), 'd-billing': () => renderDBilling(),
    'h-dash': () => renderHospital(), 'h-patients': () => renderHPatients(), 'h-doctors': () => renderHDoctors(), 'h-cases': () => renderHCases(), 'h-meds': () => renderHMeds(), 'h-appts': () => renderHAppts(), 'h-billing': () => renderHBilling()
  };
  if (hooks[id]) { try { hooks[id](); } catch (e) { console.error(e); toast('⚠️ Render error on this page: ' + e.message); } }
}
function navBack() { const prev = NAV_STACK.pop(); go(prev || homeId(), { silent: true }); }
function navHome() { NAV_STACK = []; go(homeId(), { silent: true }); }
document.addEventListener('click', e => {
  if (e.target.closest('[data-act="nav-back"]')) navBack();
  if (e.target.closest('[data-act="nav-home"]')) navHome();
  if (e.target.closest('[data-act="go-settings"]')) go('p-settings');
  if (e.target.closest('[data-act="burger"]')) $('#sidebar').classList.toggle('open');
  if (e.target.closest('[data-act="logout"]')) doLogout();
});

function enterApp() {
  $('#screen-auth').classList.add('hidden'); $('#app').classList.remove('hidden');
  buildNav();
  if (ROLE === 'patient') localStorage.setItem('cv_emergency', JSON.stringify(ME));
  const h = new Date().getHours();
  const greet = h < 12 ? t('greetM') : h < 17 ? t('greetA') : t('greetE');
  if (ROLE === 'patient') { $('#dGreet').textContent = greet + ', ' + ME.name + ' 👋'; $('#dHid').textContent = ME.healthId; bindPatient(); go('p-dash', { silent: true }); }
  if (ROLE === 'doctor') {
    db.collection('users').doc(ME.id).update({ onDuty: false, location: firebase.firestore.FieldValue.delete() }).catch(() => {});
    ME.onDuty = false; ME.location = null;
    bindDoctor(); go('d-dash', { silent: true });
  }
  if (ROLE === 'hospital') { bindHospital(); go('h-dash', { silent: true }); }
  bindNotifs();
}

/* ---------- NOTIFICATIONS (renders instantly on open) ---------- */
function renderNotifList() {
  const nl = $('#notifList'); if (!nl) return;
  nl.innerHTML = STATE.notifs.map(n => '<div class="list-item"><div class="li-main"><b>' + esc(n.title) + '</b><small>' + esc(n.body) + ' • ' + fmtDT(n.createdAt) + '</small></div></div>').join('') || '<p class="muted">No notifications yet — you will be notified here about case reviews, verified medicines, appointments, bills and reports.</p>';
}
function notify(to, title, body) { return db.collection('notifications').add({ to, title, body, read: false, createdAt: Date.now() }); }
function notifyRole(role, title, body) { return notify('role:' + role, title, body); }
function bindNotifs() {
  UNBINDS.push(db.collection('notifications').where('to', 'in', [ME.id, 'role:' + ROLE]).onSnapshot(snap => {
    STATE.notifs = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => b.createdAt - a.createdAt);
    const unread = STATE.notifs.filter(n => !n.read).length;
    $('#bellDot').classList.toggle('hidden', unread === 0);
    const list = STATE.notifs.slice(0, 12).map(n => '<div class="list-item"><div class="li-main"><b>' + esc(n.title) + '</b><small>' + esc(n.body) + ' • ' + fmtDT(n.createdAt) + '</small></div></div>').join('') || '<p class="muted">No notifications yet.</p>';
    $('#bellDrop').innerHTML = '<b style="padding:6px">🔔 ' + t('notifs') + '</b>' + list + '<button class="btn ghost sm" data-act="go-notifs" style="width:100%;margin-top:6px">View all</button>';
    renderNotifList();
    if (ROLE === 'patient') renderPatientDash();
    if (ROLE === 'doctor') renderDocDash();
  }, err => console.error(err)));
}
document.addEventListener('click', e => {
  if (e.target.closest('[data-act="bell"]')) { $('#bellDrop').classList.toggle('hidden'); return; }
  if (!e.target.closest('.bell-drop') && !e.target.closest('.bell')) $('#bellDrop').classList.add('hidden');
  if (e.target.closest('[data-act="go-notifs"]')) { $('#bellDrop').classList.add('hidden'); go('p-notifs'); }
  if (e.target.closest('[data-act="mark-read"]')) { STATE.notifs.filter(n => !n.read).forEach(n => db.collection('notifications').doc(n.id).update({ read: true }).catch(() => {})); toast('All marked read ✅'); }
});
function logAccess(patientId, action) { return db.collection('accessLog').add({ patientId, actorName: (ROLE === 'doctor' ? 'Dr. ' : '') + ME.name, actorRole: ROLE, action, createdAt: Date.now() }).catch(() => {}); }
const kvRows = rows => rows.map(([k, v]) => '<div class="krow"><span>' + k + '</span><b>' + esc(v || '—') + '</b></div>').join('');
function ageOf(dob) { if (!dob) return '—'; const a = Math.floor((Date.now() - new Date(dob)) / 31557600000); return isNaN(a) ? '—' : a + 'y'; }
function medChip(m) { return m.verified ? '<span class="chip ready">🟩 Verified — Ready to take ✓' + (m.verifiedBy ? ' <small>(' + esc(m.verifiedBy) + ')</small>' : '') + '</span>' : '<span class="chip waiting">🔴 Verification Pending</span>'; }
function queueNumberOf(a) {
  const sameDay = STATE.appts.filter(x => x.doctorId === a.doctorId && x.date === a.date && x.status === 'upcoming').sort((x, y) => timeToMin(x.time) - timeToMin(y.time));
  const i = sameDay.findIndex(x => x.id === a.id);
  return i >= 0 ? i + 1 : null;
}

/* ============================================================
   PATIENT
   ============================================================ */
function bindPatient() {
  const pid = ME.id;
  UNBINDS.push(db.collection('cases').where('patientId', '==', pid).onSnapshot(s => { STATE.cases = s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => b.createdAt - a.createdAt); renderMyCase(); renderPatientDash(); }, console.error));
  UNBINDS.push(db.collection('medicines').where('patientId', '==', pid).onSnapshot(s => { STATE.meds = s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => b.createdAt - a.createdAt); renderMeds(); renderPatientDash(); renderVitals(); renderUpcoming(); renderMyCase(); }, console.error));
  UNBINDS.push(db.collection('reports').where('patientId', '==', pid).onSnapshot(s => { STATE.reports = s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => b.createdAt - a.createdAt); renderReports(); renderPatientDash(); }, console.error));
  UNBINDS.push(db.collection('appointments').where('patientId', '==', pid).onSnapshot(s => { STATE.appts = s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (b.date || '').localeCompare(a.date || '')); renderAppts(); renderPatientDash(); renderUpcoming(); }, console.error));
  UNBINDS.push(db.collection('timeline').where('patientId', '==', pid).onSnapshot(s => { STATE.timeline = s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (b.date || '').localeCompare(a.date || '')); renderTimeline(); renderPatientDash(); }, console.error));
  UNBINDS.push(db.collection('accessLog').where('patientId', '==', pid).onSnapshot(s => { STATE.access = s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => b.createdAt - a.createdAt); renderAccess(); }, console.error));
  UNBINDS.push(db.collection('vitals').where('patientId', '==', pid).onSnapshot(s => { STATE.vitals = s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => b.createdAt - a.createdAt); renderVitals(); renderPatientDash(); }, console.error));
  UNBINDS.push(db.collection('bills').where('patientId', '==', pid).onSnapshot(s => { STATE.bills = s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => b.createdAt - a.createdAt); renderPBilling(); renderPatientDash(); }, console.error));
  UNBINDS.push(db.collection('users').where('role', '==', 'doctor').onSnapshot(s => { STATE.doctors = s.docs.map(d => ({ id: d.id, ...d.data() })); renderDoctorDropdown(); renderConsent(); renderDoctorsPage(); renderDoctorMap(); }, console.error));
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

/* ----- RECOVERY RING + SCHEDULE ----- */
function ringSVG(pct) {
  const r = 40, c = 2 * Math.PI * r, off = c - (pct / 100) * c;
  return '<div class="ring-wrap"><svg width="92" height="92" viewBox="0 0 92 92"><circle class="ring-bg" cx="46" cy="46" r="' + r + '" fill="none" stroke-width="9"/><circle class="ring-fg" cx="46" cy="46" r="' + r + '" fill="none" stroke-width="9" stroke-linecap="round" stroke-dasharray="' + c.toFixed(1) + '" stroke-dashoffset="' + off.toFixed(1) + '"/></svg><div class="ring-txt">' + pct + '%<small>RECOVERY</small></div></div>';
}
function buildTodaySchedule() {
  const items = [];
  STATE.appts.filter(a => a.date === todayStr() && a.status === 'upcoming').forEach(a => {
    const q = queueNumberOf(a);
    items.push({ time: a.time || '09:00 AM', ico: '📅', title: 'Appointment — ' + (a.doctorName || 'Doctor'), sub: (q ? '🎟️ Queue #' + q + ' • ' : '') + (a.type || '') + ' • ' + (a.hospital || ''), status: 'upcoming' });
  });
  STATE.meds.filter(m => m.active !== false).forEach(m => {
    const taken = m.takenDates && m.takenDates[todayStr()];
    items.push({ time: schedTimeFromDosage(m.dosage), ico: '💊', title: 'Medicine — ' + m.name, sub: (m.verified ? '🟩 Verified' : '🔴 Awaiting verification') + ' • ' + (m.dosage || ''), status: taken ? 'taken' : 'upcoming', medId: m.id });
  });
  if (!STATE.vitals.some(v => v.date === todayStr())) items.push({ time: '06:00 PM', ico: '🩺', title: 'Health Check', sub: 'Log temperature, BP & pain level', status: 'upcoming' });
  return items.sort((a, b) => timeToMin(a.time) - timeToMin(b.time));
}
function renderTodaySchedule() {
  const el = $('#todaySchedule'); if (!el) return;
  el.innerHTML = buildTodaySchedule().map(it => {
    let chip = '';
    if (it.status === 'taken') chip = '<span class="chip ready">✓ Taken</span>';
    else { chip = '<span class="chip blue">🕒 Upcoming</span>'; if (it.medId) chip += ' <button class="btn ghost sm" data-act="mark-taken" data-id="' + it.medId + '">Mark Taken</button>'; }
    return '<div class="sched-item"><span class="sched-time">' + esc(it.time) + '</span><span class="sched-dot"></span><span class="sched-ico">' + it.ico + '</span><span class="sched-main"><b>' + esc(it.title) + '</b><small>' + esc(it.sub || '') + '</small></span>' + chip + '</div>';
  }).join('') || '<p class="muted">Nothing scheduled today.</p>';
}
document.addEventListener('click', async e => {
  const mt = e.target.closest('[data-act="mark-taken"]');
  if (!mt) return;
  const m = STATE.meds.find(x => x.id === mt.dataset.id);
  if (!m) return;
  try { const dates = m.takenDates || {}; dates[todayStr()] = true; await db.collection('medicines').doc(m.id).update({ takenDates: dates }); toast('✅ Marked as taken'); } catch (err) { toast('⚠️ ' + errMsg(err)); }
});

/* ----- PATIENT DASHBOARD (v11: no Health Overview / no AI scheme) ----- */
function renderPatientDash() {
  if (ROLE !== 'patient' || !ME) return;
  const lastCase = STATE.cases.find(c => c.status === 'reviewed');
  const nextAppt = STATE.appts.filter(a => a.status === 'upcoming' && a.date >= todayStr()).sort((a, b) => a.date.localeCompare(b.date))[0];
  const fields = ['name', 'dob', 'gender', 'phone', 'aadhaar', 'bloodGroup', 'address', 'emergencyName', 'allergies', 'conditions'];
  const profilePct = Math.round(fields.filter(f => ME[f] && String(ME[f]).trim()).length / fields.length * 100);
  const docsPct = Math.min(100, STATE.reports.length * 20);
  const vm = STATE.meds.length ? Math.round(STATE.meds.filter(m => m.verified).length / STATE.meds.length * 100) : 100;
  const active = STATE.meds.filter(m => m.active !== false);
  const takenN = active.filter(m => m.takenDates && m.takenDates[todayStr()]).length;
  const schedPct = active.length ? Math.round(takenN / active.length * 100) : 100;
  const recovery = Math.round((profilePct + vm + docsPct + schedPct) / 4);
  const rr = $('#recoRing'); if (rr) rr.innerHTML = ringSVG(recovery);
  const rm = $('#recoMsg');
  if (rm) rm.textContent = recovery >= 75 ? 'You are doing great! Keep following your schedule.' : recovery >= 40 ? 'Good progress — stay on track.' : 'Add documents, verify medicines and mark your schedule.';
  const unread = STATE.notifs.filter(n => !n.read).length;
  const upN = STATE.appts.filter(a => a.status === 'upcoming' && a.date >= todayStr()).length;
  const ms = $('#miniStats');
  if (ms) ms.innerHTML = [['mc-blue', '💊', 'Medicines', active.length, 'Active'], ['mc-green', '📅', 'Appointments', upN, 'Upcoming'], ['mc-amber', '📋', 'Health Logs', STATE.vitals.filter(v => v.date === todayStr()).length, 'Today'], ['mc-red', '💬', 'Messages', unread, 'Unread']].map(([cls, ico, label, val, sub]) => '<div class="mini-card"><span class="mc-ico ' + cls + '">' + ico + '</span><span><span class="mc-label">' + label + '</span><b>' + val + '</b><small>' + sub + '</small></span></div>').join('');
  const latest = STATE.cases[0];
  const rb = $('#reviewBanner');
  if (latest && latest.status === 'reviewed') { rb.className = 'banner'; rb.innerHTML = '✅ Doctor Reviewed Your Case — Dr. ' + esc(latest.doctorName) + ' verified it. <a href="#" data-nav="p-case" style="color:inherit;text-decoration:underline">Open</a>'; }
  else if (latest) { rb.className = 'banner amber'; rb.innerHTML = '🟡 Waiting for Doctor Review — submitted ' + fmtDT(latest.createdAt); }
  else rb.className = 'banner hidden';
  const fb = $('#followBanner');
  const fu = STATE.timeline.find(tt => tt.type === 'followup' && tt.due && tt.due >= todayStr());
  if (fu) { fb.className = 'banner amber'; fb.innerHTML = '🔔 Follow-up: ' + esc(fu.title) + ' — due ' + fmtD(fu.due); } else fb.className = 'banner hidden';
  $('#medMini').innerHTML = active.slice(0, 4).map(m => '<li><span>' + esc(m.name) + ' <small class="muted">' + esc(m.dosage || '') + '</small></span>' + medChip(m) + '</li>').join('') || '<li class="muted">No medicines yet</li>';
  $('#repMini').innerHTML = STATE.reports.slice(0, 4).map(r => '<li><span>' + esc(r.title) + '</span><small class="muted">' + fmtD(r.date) + '</small></li>').join('') || '<li class="muted">No reports yet</li>';
  const billMini = $('#billMini');
  if (billMini) { const tot = (STATE.bills || []).reduce((a, b) => a + Number(b.total || 0), 0); billMini.innerHTML = '<div class="krow"><span>Total billed</span><b>₹' + tot + '</b></div><div class="krow"><span>Pending</span><b>' + (STATE.bills || []).filter(b => b.status !== 'paid').length + '</b></div>'; }
  $('#nextApptCard').innerHTML = nextAppt ? (() => { const q = queueNumberOf(nextAppt); return '<div class="krow"><span>👨‍⚕️</span><b>' + esc(nextAppt.doctorName) + '</b></div><div class="krow"><span>🎟️ Queue</span><b>' + (q ? '#' + q : '—') + '</b></div><div class="krow"><span>📅 When</span><b>' + fmtD(nextAppt.date) + ' • ' + esc(nextAppt.time) + '</b></div><div class="krow"><span>🏥</span><b>' + esc(nextAppt.hospital || '') + '</b></div>'; })() : 'No upcoming appointments.';
  $('#careBars').innerHTML = pbar('Profile', profilePct) + pbar('Documents', docsPct) + pbar('Verification', vm) + pbar('Follow-up', fu ? 60 : 100);
  renderTodaySchedule();
}
function pbar(label, pct) { return '<div class="pbar"><div class="p-top"><span>' + label + '</span><span>' + pct + '%</span></div><div class="p-track"><div class="p-fill" style="width:' + pct + '%"></div></div></div>'; }
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

/* ----- MY CASE + DRAFT AUTOSAVE ----- */
const DRAFT_FIELDS = ['ncComplaint', 'ncSymptoms', 'ncDuration', 'ncPrevTx', 'ncExisting', 'ncMeds', 'ncAllergy', 'ncSurgery', 'ncFamily', 'ncOther'];
let draftTimer = null;
document.addEventListener('input', e => {
  if (ROLE !== 'patient') return;
  if (DRAFT_FIELDS.includes(e.target.id)) { clearTimeout(draftTimer); draftTimer = setTimeout(saveDraft, 1200); }
});
async function saveDraft() {
  if (!ME) return;
  const d = {};
  DRAFT_FIELDS.forEach(f => { const el = $('#' + f); d[f] = el ? el.value : ''; });
  const ac = $('#ncAreas .chip.active'); d.area = ac ? ac.dataset.area : '';
  d.severity = $('#ncSeverity') ? $('#ncSeverity').value : '';
  try { await db.collection('caseDrafts').doc(ME.id).set({ ...d, updatedAt: Date.now() }); const dn = $('#draftNote'); if (dn) dn.textContent = 'Draft saved ✓ ' + new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }); } catch (e) {}
}
async function loadDraft() {
  if (!ME) return;
  try {
    const s = await db.collection('caseDrafts').doc(ME.id).get();
    if (s.exists) {
      const d = s.data(); let any = false;
      DRAFT_FIELDS.forEach(f => { if (d[f] && $('#' + f) && !$('#' + f).value) { $('#' + f).value = d[f]; any = true; } });
      const dn = $('#draftNote');
      if (dn && any) dn.textContent = 'Draft restored (' + fmtDT(d.updatedAt) + ')';
    }
  } catch (e) {}
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
    await notifyRole('doctor', '🟡 New Case Submitted', ME.name + ' (' + ME.healthId + '): ' + complaint);
    DRAFT_FIELDS.forEach(f => { const el = $('#' + f); if (el) el.value = ''; });
    await db.collection('caseDrafts').doc(ME.id).delete().catch(() => {});
    const dn = $('#draftNote'); if (dn) dn.textContent = '';
    toast('✅ Case submitted! Status: 🟡 Waiting for Doctor Review');
    renderMyCase();
  } catch (err) { toast('⚠️ ' + errMsg(err)); }
});
function autofillCase() {
  if (ROLE !== 'patient') return;
  if (!$('#ncExisting').value) $('#ncExisting').value = ME.conditions || '';
  if (!$('#ncMeds').value) $('#ncMeds').value = STATE.meds.filter(m => m.active !== false).map(m => m.name + ' (' + (m.dosage || '') + ')').join(', ');
  if (!$('#ncAllergy').value) $('#ncAllergy').value = ME.allergies || '';
  if (!$('#ncSurgery').value) $('#ncSurgery').value = ME.surgeries || '';
  if (!$('#ncFamily').value) $('#ncFamily').value = ME.familyHistory || '';
}
function renderMyCase() {
  if (ROLE !== 'patient') return;
  autofillCase(); loadDraft();
  const c = STATE.cases[0];
  const stEl = $('#myCaseStatus');
  if (stEl) stEl.innerHTML = !c ? '<div class="card muted">No cases yet — fill the form below to create your first case.</div>' :
    '<div class="card"><h4>Latest Case — ' + (c.status === 'reviewed' ? '🟩 Reviewed by Dr. ' + esc(c.doctorName || '') : '🟡 Waiting for Doctor Review') + '</h4><div class="kv">' +
    '<div class="krow"><span>Chief Complaint</span><b>' + esc(c.chiefComplaint) + '</b></div>' +
    (c.status === 'reviewed' ? '<div class="krow"><span>🟩 Clinical Notes</span><b>' + esc(c.doctorNotes || '—') + '</b></div><div class="krow"><span>🟩 Prescription</span><b>' + esc(c.prescriptionText || '—') + '</b></div><div class="krow"><span>🟩 Tests</span><b>' + esc(c.tests || '—') + '</b></div><div class="krow"><span>🟩 Follow-up</span><b>' + (c.followupDays ? 'after ' + esc(c.followupDays) + ' days' : '—') + '</b></div>' : '') +
    '</div></div>';
  const ch = $('#caseHistory');
  if (ch) ch.innerHTML = STATE.cases.map(x => '<div class="list-item"><div class="li-main"><b>' + esc(x.chiefComplaint) + '</b><small>' + esc(x.duration || '') + ' • ' + esc(x.severity || '') + ' • ' + fmtDT(x.createdAt) + '</small></div>' + (x.status === 'reviewed' ? '<span class="chip green">🟩 Dr. ' + esc(x.doctorName || '') + '</span>' : '<span class="chip amber">🟡 Waiting</span>') + '</div>').join('') || '<p class="muted">No case history yet.</p>';
  $('#secPersonal').innerHTML = kvRows([['Name', ME.name], ['DOB / Age', (ME.dob || '—') + ' (' + ageOf(ME.dob) + ')'], ['Gender', ME.gender], ['Contact', ME.phone], ['Address', ME.address], ['Emergency Contact', (ME.emergencyName || '') + ' ' + (ME.emergencyPhone || '')], ['Aadhaar', maskAadhaar(ME.aadhaar)], ['Health ID', ME.healthId]]);
  $('#secMedical').innerHTML = kvRows([['Existing Conditions', ME.conditions || 'None'], ['Previous Illnesses / Accidents', ME.accidents || 'None'], ['Family History', ME.familyHistory || '—']]);
  $('#secAllergy').innerHTML = kvRows([['Allergies', ME.allergies || 'None recorded']]);
  $('#secSurgery').innerHTML = (ME.surgeries || 'No surgeries recorded').split('\n').filter(Boolean).map(s => '<div class="krow"><span>🔪 ' + esc(s) + '</span></div>').join('');
  $('#secMeds').innerHTML = STATE.meds.map(m => '<li><span>' + esc(m.name) + ' <small class="muted">' + esc(m.dosage || '') + ' • ' + esc(m.prescribedBy || '') + '</small></span>' + medChip(m) + '</li>').join('') || '<li class="muted">—</li>';
  $('#secVisits').innerHTML = STATE.timeline.filter(tt => tt.type === 'case' || tt.type === 'consult').map(tt => '<li><span>' + (tt.icon || '🏥') + ' ' + esc(tt.title) + ' <small class="muted">' + esc(tt.description || '') + '</small></span><small class="muted">' + fmtD(tt.date) + '</small></li>').join('') || '<li class="muted">No visits yet</li>';
}

/* ----- MEDS / REPORTS ----- */
function renderMeds() {
  const el = $('#medList'); if (!el || ROLE !== 'patient') return;
  el.innerHTML = STATE.meds.map(m => '<div class="list-item"><div class="li-main"><b>' + esc(m.name) + '</b><small>' + esc(m.dosage || '') + ' • Start ' + fmtD(m.startDate) + (m.durationDays ? ' • ' + esc(m.durationDays) + ' days' : '') + ' • ' + esc(m.prescribedBy || '') + '</small></div><div class="li-actions">' + medChip(m) + '<button class="btn ghost sm" data-act="stop-med" data-id="' + m.id + '">' + (m.active === false ? 'Restart' : 'Stop') + '</button></div></div>').join('') || '<p class="muted">No medicines added yet.</p>';
}
document.addEventListener('click', async e => {
  if (e.target.closest('[data-act="add-med"]')) {
    const name = $('#mName').value.trim(); if (!name) return toast('⚠️ Medicine name is required.');
    try {
      await db.collection('medicines').add({ patientId: ME.id, name, dosage: $('#mDose').value.trim(), startDate: $('#mStart').value || todayStr(), durationDays: $('#mDur').value, prescribedBy: ME.name + ' (self-reported)', verified: false, source: 'patient', active: true, createdAt: Date.now() });
      $('#mName').value = ''; $('#mDose').value = ''; $('#mDur').value = '';
      toast('Added — 🔴 doctor verification pending');
    } catch (err) { toast('⚠️ ' + errMsg(err)); }
  }
  const sm = e.target.closest('[data-act="stop-med"]');
  if (sm) { const m = STATE.meds.find(x => x.id === sm.dataset.id); if (m) { await db.collection('medicines').doc(m.id).update({ active: m.active === false }).catch(err => toast('⚠️ ' + errMsg(err))); toast('Updated ✅'); } }
});
function renderReports() {
  const el = $('#repList'); if (!el || ROLE !== 'patient') return;
  el.innerHTML = STATE.reports.map(r => '<div class="list-item"><div class="li-main"><b>' + esc(r.title) + '</b><small>' + esc(r.type) + ' • ' + fmtD(r.date) + ' • ' + esc(r.hospital || '') + (r.doctor ? ' • ' + esc(r.doctor) : '') + '</small></div><div class="li-actions">' + (r.verified ? '<span class="chip green">Verified ✓</span>' : '<span class="chip blue">🟦 Self-uploaded</span>') + '</div></div>').join('') || '<p class="muted">Vault is empty.</p>';
}
document.addEventListener('click', async e => {
  if (!e.target.closest('[data-act="add-report"]')) return;
  const tt = $('#rTitle').value.trim(); if (!tt) return toast('⚠️ Title is required.');
  try {
    await db.collection('reports').add({ patientId: ME.id, title: tt, type: $('#rType').value, date: $('#rDate').value || todayStr(), hospital: $('#rHospital').value.trim(), doctor: $('#rDoctor').value.trim(), note: $('#rNote').value.trim(), verified: false, uploadedBy: ME.name, uploadedByRole: 'patient', createdAt: Date.now() });
    await db.collection('timeline').add({ patientId: ME.id, date: todayStr(), type: 'report', icon: '🧪', title: tt, description: $('#rType').value, createdAt: Date.now() });
    $('#rTitle').value = ''; toast('Saved to vault ✅');
  } catch (err) { toast('⚠️ ' + errMsg(err)); }
});

/* ----- APPOINTMENTS (ACID double-booking protection) ----- */
const SLOTS = ['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM', '04:00 PM', '04:30 PM', '05:00 PM'];
function renderDoctorDropdown() {
  const d = $('#apDoctor'); if (!d) return;
  const cur = d.value;
  d.innerHTML = STATE.doctors.map(x => '<option value="' + x.id + '" data-name="Dr. ' + esc(x.name) + '" data-dept="' + esc(x.specialization || '') + '" data-hosp="' + esc(x.hospital || '') + '">Dr. ' + esc(x.name) + ' — ' + esc(x.specialization || '') + ' (' + esc(x.hospital || '') + ')</option>').join('') || '<option value="">No doctors registered yet</option>';
  if (cur) d.value = cur;
  const ad = $('#apDate'); if (ad && !ad.min) { ad.min = todayStr(); if (ad._dpSync) ad._dpSync(); }
  $('#apSlots').innerHTML = SLOTS.map(s => '<button type="button" class="chip" data-slot="' + s + '">' + s + '</button>').join('');
  $$('#apSlots .chip').forEach(c => c.onclick = () => { if (c.disabled) return; $$('#apSlots .chip').forEach(x => x.classList.remove('active')); c.classList.add('active'); chosenSlot = c.dataset.slot; });
  loadTakenSlots();
}
async function loadTakenSlots() {
  if (ROLE !== 'patient') return;
  const dsel = $('#apDoctor') && $('#apDoctor').selectedOptions[0];
  const date = $('#apDate') ? $('#apDate').value : '';
  const chips = $$('#apSlots .chip');
  if (!chips.length) return;
  if (!dsel || !dsel.value || !date) { chips.forEach(c => { c.classList.remove('taken'); c.disabled = false; }); return; }
  try {
    const s = await db.collection('appointments').where('doctorId', '==', dsel.value).get();
    const taken = new Set(s.docs.map(x => x.data()).filter(a => a.date === date && a.status === 'upcoming').map(a => a.time));
    chips.forEach(c => { if (taken.has(c.dataset.slot)) { c.classList.add('taken'); c.disabled = true; c.title = 'Already booked'; if (chosenSlot === c.dataset.slot) { chosenSlot = null; c.classList.remove('active'); } } else { c.classList.remove('taken'); c.disabled = false; c.title = ''; } });
  } catch (e) { console.error(e); }
}
const apDocEl = $('#apDoctor'); if (apDocEl) apDocEl.addEventListener('change', () => { chosenSlot = null; $$('#apSlots .chip').forEach(x => x.classList.remove('active')); loadTakenSlots(); });
const apDateEl = $('#apDate'); if (apDateEl) apDateEl.addEventListener('change', () => { chosenSlot = null; $$('#apSlots .chip').forEach(x => x.classList.remove('active')); loadTakenSlots(); });
document.addEventListener('click', async e => {
  if (!e.target.closest('[data-act="book-appt"]')) return;
  const dsel = $('#apDoctor').selectedOptions[0];
  if (!dsel || !dsel.value) return toast('⚠️ No doctor available — register a doctor account first.');
  const date = $('#apDate').value;
  if (!date) return toast('⚠️ Please select a date (use the calendar).');
  if (!chosenSlot) return toast('⚠️ Please select a time slot.');
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
    toast('✅ Booked! Check your 🎟️ Queue number on the dashboard.');
  } catch (err) {
    if (err && err.message === 'SLOT_TAKEN') { toast('⛔ That slot was just booked. Pick another time.'); loadTakenSlots(); }
    else toast('⚠️ ' + errMsg(err));
  }
});
 $$('[data-aptab]').forEach(tt => tt.onclick = () => { $$('[data-aptab]').forEach(x => x.classList.remove('active')); tt.classList.add('active'); CURRENT_APTAB = tt.dataset.aptab; renderAppts(); });
function renderAppts() {
  const el = $('#apList'); if (!el || ROLE !== 'patient') return;
  const list = STATE.appts.filter(a => a.status === CURRENT_APTAB);
  el.innerHTML = list.map(a => { const q = a.status === 'upcoming' ? queueNumberOf(a) : null;
    return '<div class="list-item"><div class="li-main"><b>' + (q ? '<span class="queue-chip">🎟️ Q#' + q + '</span> ' : '') + esc(a.doctorName || 'Doctor') + ' • ' + esc(a.time || '') + '</b><small>' + esc(a.department || '') + ' • ' + esc(a.hospital || '') + ' • ' + fmtD(a.date) + ' • ' + esc(a.type || '') + '</small></div><div class="li-actions"><span class="chip ' + (a.status === 'upcoming' ? 'blue' : a.status === 'completed' ? 'green' : 'red') + '">' + esc(a.status) + '</span>' + (a.status === 'upcoming' ? '<button class="btn ghost sm" data-act="cancel-appt" data-id="' + a.id + '">Cancel</button>' : '') + '</div></div>'; }).join('') || '<p class="muted">Nothing here.</p>';
}
document.addEventListener('click', async e => {
  const c = e.target.closest('[data-act="cancel-appt"]');
  if (c) {
    try {
      const adoc = await db.collection('appointments').doc(c.dataset.id).get();
      const a = adoc.exists ? adoc.data() : null;
      await db.collection('appointments').doc(c.dataset.id).update({ status: 'cancelled' });
      if (a && a.doctorId && a.date && a.time) await db.collection('slots').doc((a.doctorId + '_' + a.date + '_' + a.time).replace(/[^a-zA-Z0-9]/g, '_')).delete().catch(() => {});
      toast('Cancelled — slot released ✅');
    } catch (err) { toast('⚠️ ' + errMsg(err)); }
  }
  const cp = e.target.closest('[data-act="complete-appt"]');
  if (cp) { await db.collection('appointments').doc(cp.dataset.id).update({ status: 'completed' }).catch(err => toast('⚠️ ' + errMsg(err))); toast('Marked completed ✅'); }
});

/* ----- MY DOCTORS + MAP ----- */
function isOnline(d) { return !!(d && d.onDuty && d.location && d.location.lat != null && (Date.now() - d.location.updatedAt) < 6 * 60 * 1000); }
function ago(ts) { const s = Math.max(1, Math.round((Date.now() - ts) / 1000)); return s < 60 ? s + ' sec ago' : Math.round(s / 60) + ' min ago'; }
function renderDoctorsPage() {
  const el = $('#docList'); if (!el || ROLE !== 'patient') return;
  el.innerHTML = STATE.doctors.map(d => {
    const on = isOnline(d); const tel = telLink(d.phone);
    return '<div class="card"><div class="doctor-line">' + avatarHTML(d) + '<div><b>Dr. ' + esc(d.name) + '</b><br><small class="muted">' + esc(d.specialization || '') + ' • ' + esc(d.experience || '0') + ' yrs</small></div></div>' +
      '<p class="muted" style="margin:8px 0 4px">🏥 ' + esc(d.hospital || '') + '</p>' +
      '<p style="margin-bottom:8px">' + (on ? '<span class="chip green">🟢 On duty — live location</span>' : '<span class="chip">⚪ Off duty</span>') + '</p>' +
      '<div style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn primary sm" data-act="open-chat" data-id="' + d.id + '" data-name="Dr. ' + esc(d.name) + '">💬 Message</button>' +
      (tel ? '<a class="btn ghost sm" href="' + tel + '">📞 Call</a>' : '') +
      '<button class="btn ghost sm" data-act="locate-dr" data-id="' + d.id + '">📍 Locate</button><button class="btn ghost sm" data-nav="p-appts">📅 Book</button></div></div>';
  }).join('') || '<p class="muted">No doctors yet.</p>';
}
function renderDoctorMap() {
  if (ROLE !== 'patient') return;
  const online = STATE.doctors.filter(isOnline);
  const chips = $('#mapDocs');
  if (chips) chips.innerHTML = online.length ? online.map(d => '<button class="chip active" data-act="focus-dr" data-id="' + d.id + '">👨‍⚕️ Dr. ' + esc(d.name) + ' • ' + ago(d.location.updatedAt) + '</button>').join('') : '<span class="chip red">No doctors on duty right now</span>';
  const info = $('#mapInfo');
  if (info) info.textContent = 'Live GPS • shared only while ON DUTY • deleted on logout • older than 6 min = hidden.';
  const mapEl = $('#docMap');
  if (!mapEl || !mapEl.offsetParent) return;
  if (typeof L === 'undefined') { mapEl.innerHTML = '<p class="muted">Map library could not load.</p>'; return; }
  if (!cvMap) {
    cvMap = L.map('docMap').setView([13.0827, 80.2707], 11);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(cvMap);
    markersLayer = L.layerGroup().addTo(cvMap);
  }
  setTimeout(() => { if (cvMap) cvMap.invalidateSize(); }, 80);
  markersLayer.clearLayers();
  online.forEach(d => {
    const mk = L.marker([d.location.lat, d.location.lng], { icon: L.divIcon({ className: 'doc-pin', html: '👨‍⚕️', iconSize: [34, 34] }) })
      .bindPopup('<b>Dr. ' + esc(d.name) + '</b><br>' + esc(d.specialization || '') + '<br><small>Updated ' + ago(d.location.updatedAt) + '</small><br><a href="https://www.google.com/maps/dir/?api=1&destination=' + d.location.lat + ',' + d.location.lng + '" target="_blank" rel="noopener">🧭 Directions</a>');
    mk.addTo(markersLayer);
    if (focusDoctorId === d.id) { cvMap.setView([d.location.lat, d.location.lng], 14); setTimeout(() => mk.openPopup(), 250); focusDoctorId = null; }
  });
}
document.addEventListener('click', e => {
  const fd = e.target.closest('[data-act="focus-dr"]');
  if (fd) { focusDoctorId = fd.dataset.id; renderDoctorMap(); }
  const ld = e.target.closest('[data-act="locate-dr"]');
  if (ld) {
    const d = STATE.doctors.find(x => x.id === ld.dataset.id);
    if (d && !isOnline(d)) toast('⚠️ Dr. ' + d.name + ' is OFF DUTY — location unavailable.');
    focusDoctorId = ld.dataset.id;
    const m = $('#docMap'); if (m) m.scrollIntoView({ behavior: 'smooth', block: 'center' });
    renderDoctorMap();
  }
});

/* ----- UPCOMING / TIMELINE ----- */
function renderUpcoming() {
  if (ROLE !== 'patient') return;
  const ua = $('#upAppts'); if (!ua) return;
  const appts = STATE.appts.filter(a => a.status === 'upcoming' && a.date >= todayStr()).sort((a, b) => a.date.localeCompare(b.date));
  ua.innerHTML = appts.map(a => { const q = queueNumberOf(a); return '<div class="list-item"><div class="li-main"><b>👨‍⚕️ ' + esc(a.doctorName) + (q ? ' <span class="queue-chip">🎟️ Q#' + q + '</span>' : '') + '</b><small>' + fmtD(a.date) + ' • ' + esc(a.time) + ' • ' + esc(a.hospital || '') + '</small></div><span class="chip blue">Confirmed</span></div>'; }).join('') || '<p class="muted">No upcoming appointments.</p>';
  const uf = $('#upFollow');
  const fus = STATE.timeline.filter(tt => tt.type === 'followup' && tt.due && tt.due >= todayStr()).sort((a, b) => a.due.localeCompare(b.due));
  uf.innerHTML = fus.map(f => '<div class="list-item"><div class="li-main"><b>🔔 ' + esc(f.title) + '</b><small>' + esc(f.description || '') + '</small></div><span class="chip amber">Due ' + fmtD(f.due) + '</span></div>').join('') || '<p class="muted">No follow-up reminders.</p>';
  const um = $('#upMeds');
  const meds = STATE.meds.filter(m => m.active !== false);
  um.innerHTML = meds.map(m => '<div class="list-item"><div class="li-main"><b>💊 ' + esc(m.name) + '</b><small>' + esc(m.dosage || '') + '</small></div>' + medChip(m) + '</div>').join('') || '<p class="muted">No active medicines.</p>';
}
function renderTimeline() {
  const el = $('#tlList'); if (!el || ROLE !== 'patient') return;
  el.innerHTML = STATE.timeline.map(tt => '<div class="tl-item"><span class="tl-year">' + fmtD(tt.date) + '</span><b>' + (tt.icon || '•') + ' ' + esc(tt.title) + '</b><p>' + esc(tt.description || '') + '</p></div>').join('') || '<p class="muted">Submit your first case to start your journey 🚀</p>';
}

/* ----- RICH QR ----- */
function renderQR() {
  if (ROLE !== 'patient') return;
  $('#qrHid').textContent = ME.healthId;
  $('#qrName').textContent = ME.name + ' • ' + ageOf(ME.dob) + ' • ' + (ME.bloodGroup || '');
  const nextAppt = STATE.appts.filter(a => a.status === 'upcoming' && a.date >= todayStr()).sort((a, b) => a.date.localeCompare(b.date))[0];
  const q = nextAppt ? queueNumberOf(nextAppt) : null;
  const payload = {
    app: 'CareVault', healthId: ME.healthId, name: ME.name, age: ageOf(ME.dob), gender: ME.gender,
    bloodGroup: ME.bloodGroup || null, allergies: ME.allergies || null, conditions: ME.conditions || null,
    emergencyContact: (ME.emergencyName || '') + ' ' + (ME.emergencyPhone || ''),
    issuedDate: new Date().toLocaleDateString('en-IN'), issuedTime: new Date().toLocaleTimeString('en-IN'),
    todayQueue: q ? { doctor: nextAppt.doctorName, date: nextAppt.date, time: nextAppt.time, queue: q, hospital: nextAppt.hospital } : null
  };
  const qc = $('#qrContents');
  if (qc) qc.innerHTML = kvRows([['Identity', ME.name + ' • ' + ageOf(ME.dob) + ' • ' + ME.gender], ['Blood Group', ME.bloodGroup || '—'], ['Allergies', ME.allergies || 'None'], ['Conditions', ME.conditions || 'None'], ['Emergency Contact', payload.emergencyContact || '—'], ['Issued (date • time)', payload.issuedDate + ' • ' + payload.issuedTime], ['🎟️ Today Queue', q ? '#' + q + ' — ' + nextAppt.doctorName + ' at ' + nextAppt.time : 'No appointment today'], ['Mode', '🚑 Emergency = critical info only • 📖 Full record = consent required']]);
  const box = $('#qrBox'); if (!box) return;
  box.innerHTML = '';
  try { new QRCode(box, { text: JSON.stringify(payload), width: 190, height: 190, colorDark: '#111', colorLight: '#fff', correctLevel: QRCode.CorrectLevel.M }); } catch (e) { box.textContent = 'QR library failed to load.'; }
}

/* ----- EMERGENCY / PRIVACY ----- */
function openEmergency(withLookup) {
  $('#emOverlay').classList.remove('hidden');
  $('#emLookupRow').classList.toggle('hidden', !withLookup);
  if (!withLookup) { ME._meds = STATE.meds.filter(m => m.active !== false).map(m => m.name).join(', '); renderEmCard(ME); }
}
function renderEmCard(p) {
  $('#emBody').innerHTML = [['🩸 Blood Group', p.bloodGroup || '—'], ['⚠️ Critical Allergies', p.allergies || 'None recorded'], ['💊 Current Medicines', p._meds || '—'], ['🏥 Major Conditions', p.conditions || 'None recorded'], ['🔪 Major History', ((p.surgeries || 'None').split('\n')[0]) || '—'], ['📞 Emergency Contact', (p.emergencyName || '—') + ' ' + (p.emergencyPhone || '')]].map(([k, v]) => '<div class="card" style="margin:0"><b>' + k + '</b><p>' + esc(v) + '</p></div>').join('');
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
function renderConsent() {
  const el = $('#consentList'); if (!el || ROLE !== 'patient') return;
  el.innerHTML = STATE.doctors.map(d => {
    const key = ME.id + '_' + d.id;
    const c = STATE.consents.find(x => x.id === key);
    const allowed = !c || c.status !== 'revoked';
    return '<div class="list-item"><div class="li-main"><b>👨‍⚕️ Dr. ' + esc(d.name) + '</b><small>' + esc(d.specialization || '') + ' • ' + esc(d.hospital || '') + ' • Purpose: Consultation access</small></div><div class="li-actions"><span class="chip ' + (allowed ? 'green' : 'red') + '">' + (allowed ? '✅ Allowed' : '❌ Revoked') + '</span><button class="btn ' + (allowed ? 'danger' : 'primary') + ' sm" data-act="toggle-consent" data-id="' + key + '" data-name="Dr. ' + esc(d.name) + '" data-allowed="' + allowed + '">' + (allowed ? 'Revoke' : 'Allow') + '</button></div></div>';
  }).join('') || '<p class="muted">No doctors registered yet.</p>';
}
document.addEventListener('click', async e => {
  const tt = e.target.closest('[data-act="toggle-consent"]'); if (!tt) return;
  const parts = tt.dataset.id.split('_');
  const allowed = tt.dataset.allowed === 'true';
  try {
    await db.collection('consents').doc(tt.dataset.id).set({ patientId: parts[0], doctorId: parts[1], doctorName: tt.dataset.name, status: allowed ? 'revoked' : 'allowed', updatedAt: Date.now() }, { merge: true });
    await notify(parts[1], allowed ? '🚫 Access Revoked' : '✅ Access Allowed', 'Patient ' + ME.name + ' ' + (allowed ? 'revoked' : 'granted') + ' your access.');
    toast(allowed ? 'Access revoked 🔒' : 'Access allowed ✅');
    const c = await db.collection('consents').where('patientId', '==', ME.id).get();
    STATE.consents = c.docs.map(d => ({ id: d.id, ...d.data() }));
    renderConsent();
  } catch (err) { toast('⚠️ ' + errMsg(err)); }
});
function renderAccess() {
  const el = $('#accessList'); if (!el || ROLE !== 'patient') return;
  el.innerHTML = STATE.access.map(a => '<div class="list-item"><div class="li-main"><b>' + (a.actorRole === 'doctor' ? '👨‍⚕️' : a.actorRole === 'hospital' ? '🏥' : '🤖') + ' ' + esc(a.actorName) + '</b><small>' + esc(a.action) + '</small></div><small class="muted">' + fmtDT(a.createdAt) + '</small></div>').join('') || '<p class="muted">No access events yet.</p>';
}

/* ----- BILLING: PATIENT ----- */
function billItemsStr(b) { return (b.items || []).map(i => esc(i.label) + ' ₹' + esc(i.amount)).join(' • '); }
function renderPBilling() {
  if (ROLE !== 'patient') return;
  const s = $('#pbSummary'), list = $('#pbList');
  const bs = STATE.bills || [];
  const total = bs.reduce((a, b) => a + Number(b.total || 0), 0);
  const paid = bs.filter(b => b.status === 'paid');
  const pend = bs.filter(b => b.status !== 'paid');
  if (s) s.innerHTML = [['Total billed', total, 'mc-blue'], ['Paid', paid.reduce((a, b) => a + Number(b.total || 0), 0), 'mc-green'], ['Pending', pend.reduce((a, b) => a + Number(b.total || 0), 0), 'mc-red']].map(([l, v, c]) => '<div class="mini-card"><span class="mc-ico ' + c + '">₹</span><span><span class="mc-label">' + l + '</span><b>₹' + v + '</b></span></div>').join('');
  if (list) list.innerHTML = bs.map(b => '<div class="list-item"><div class="li-main"><b>' + esc(b.type || 'bill') + ' — ₹' + esc(b.total) + '</b><small>' + billItemsStr(b) + (b.doctorName ? ' • ' + esc(b.doctorName) : '') + (b.hospital ? ' • ' + esc(b.hospital) : '') + ' • ' + fmtDT(b.createdAt) + '</small></div><div class="li-actions">' + (b.status === 'paid' ? '<span class="chip ready">✓ Paid</span>' : '<span class="chip waiting">Pending</span><button class="btn primary sm" data-act="pay-bill" data-id="' + b.id + '">Pay</button>') + '</div></div>').join('') || '<p class="muted">No bills yet — they appear here in real time when your doctor or hospital bills you.</p>';
}
document.addEventListener('click', async e => {
  const pb = e.target.closest('[data-act="pay-bill"]');
  if (pb) { try { await db.collection('bills').doc(pb.dataset.id).update({ status: 'paid', paidAt: Date.now() }); toast('✅ Bill marked as paid'); } catch (err) { toast('⚠️ ' + errMsg(err)); } }
});

/* ----- HEALTH TRACKING ----- */
const TREND_COLORS = { temp: '#ea580c', bp: '#2563eb', hr: '#dc2626', wt: '#16a34a' };
function parseBp(bp) { if (!bp) return null; const m = String(bp).match(/(\d+)\s*\/\s*(\d+)/); return m ? { s: +m[1], d: +m[2] } : null; }
function num(v) { const n = Number(v); return isNaN(n) ? null : n; }
function sparkSVG(vals, color) {
  if (!vals || vals.length < 2) return '<div class="spark muted sm-txt" style="display:flex;align-items:center;justify-content:center">Not enough data</div>';
  const w = 120, h = 36, pad = 4;
  const min = Math.min(...vals), max = Math.max(...vals), range = (max - min) || 1;
  const pts = vals.map((v, i) => (pad + i * (w - 2 * pad) / (vals.length - 1)).toFixed(1) + ',' + (h - pad - ((v - min) / range) * (h - 2 * pad)).toFixed(1)).join(' ');
  return '<svg class="spark" viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none"><polyline fill="none" stroke="' + color + '" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" points="' + pts + '"/></svg>';
}
function seriesOf(key) { return STATE.vitals.slice(0, 7).reverse().map(v => key === 'bp' ? (parseBp(v.bp) ? parseBp(v.bp).s : null) : num(v[key])).filter(x => x !== null); }
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
  if (sc) sc.innerHTML = '<div class="stat-card stat-hr"><div class="st-name">❤️ Heart Rate</div><div class="st-val">' + (lv && num(lv.hr) != null ? num(lv.hr) : '—') + '</div><div class="st-unit">bpm</div></div><div class="stat-card stat-temp"><div class="st-name">🌡️ Temperature</div><div class="st-val">' + (lv && num(lv.temp) != null ? num(lv.temp) : '—') + '</div><div class="st-unit">°C</div></div><div class="stat-card stat-bp"><div class="st-name">🩸 Blood Pressure</div><div class="st-val">' + (bp ? bp.s + '/' + bp.d : '—') + '</div><div class="st-unit">mmHg</div></div><div class="stat-card stat-wt"><div class="st-name">⚖️ Weight</div><div class="st-val">' + (lv && num(lv.wt) != null ? num(lv.wt) : '—') + '</div><div class="st-unit">kg</div></div>';
  const rc = $('#recentVitals');
  if (rc) rc.innerHTML = STATE.vitals.slice(0, 6).map(v => { const p = parseBp(v.bp); const pain = num(v.pain);
    return '<div class="list-item"><div class="li-main"><b>' + fmtD(v.date) + '</b><small>🌡️ ' + esc(v.temp || '—') + '°C • BP ' + (p ? p.s + '/' + p.d : '—') + ' • ❤️ ' + esc(v.hr || '—') + ' • ⚖️ ' + esc(v.wt || '—') + ' kg' + (v.sym ? ' • ' + esc(v.sym) : '') + '</small></div>' + (pain != null ? '<span class="chip ' + (pain <= 3 ? 'green' : pain <= 6 ? 'blue' : 'red') + '">' + pain + '/10 Pain</span>' : '') + '</div>'; }).join('') || '<p class="muted">No records yet.</p>';
  const tg = $('#trendGrid');
  if (tg) {
    const defs = [{ key: 'temp', name: '🌡️ Temperature', unit: '°C' }, { key: 'bp', name: '🩸 Blood Pressure', unit: 'mmHg' }, { key: 'hr', name: '❤️ Heart Rate', unit: 'bpm' }, { key: 'wt', name: '⚖️ Weight', unit: 'kg' }];
    tg.innerHTML = defs.map(df => { const vals = seriesOf(df.key); return '<div class="trend-card"><div class="t-name">' + df.name + '</div><div class="t-val">' + (vals.length ? vals[vals.length - 1] : '—') + ' <small class="muted">' + df.unit + '</small></div>' + deltaHTML(vals, df.unit) + sparkSVG(vals, TREND_COLORS[df.key]) + '</div>'; }).join('');
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
  if (bp && !parseBp(bp)) return toast('⚠️ BP format like 120/80');
  try {
    await db.collection('vitals').add({ patientId: ME.id, date: todayStr(), temp, bp, hr, wt, pain: selectedPain === null ? '' : selectedPain, sym, createdAt: Date.now() });
    $('#vTemp').value = ''; $('#vHr').value = ''; $('#vWt').value = ''; $('#vBp').value = ''; $('#vSym').value = '';
    $('#symCount').textContent = '0';
    $$('.pain-btn').forEach(x => x.classList.remove('active')); selectedPain = null;
    toast('Record saved ✅'); renderVitals();
  } catch (err) { toast('⚠️ ' + errMsg(err)); }
});

/* ----- SEARCH / CHATBOT ----- */
 $('#topSearch').addEventListener('input', e => {
  const q = e.target.value.trim().toLowerCase();
  const box = $('#searchResults');
  if (!q) { box.classList.add('hidden'); return; }
  go('p-dash', { silent: true }); box.classList.remove('hidden');
  const hit = s => (s || '').toLowerCase().includes(q);
  let html = '';
  STATE.timeline.filter(tt => hit(tt.title) || hit(tt.description)).forEach(tt => html += '<div class="list-item"><div class="li-main"><b>' + (tt.icon || '•') + ' ' + esc(tt.title) + '</b><small>🕐 ' + esc(tt.description || '') + '</small></div><small class="muted">' + fmtD(tt.date) + '</small></div>');
  STATE.meds.filter(m => hit(m.name)).forEach(m => html += '<div class="list-item"><div class="li-main"><b>💊 ' + esc(m.name) + '</b><small>' + esc(m.dosage || '') + '</small></div>' + medChip(m) + '</div>');
  STATE.reports.filter(r => hit(r.title) || hit(r.type)).forEach(r => html += '<div class="list-item"><div class="li-main"><b>🧪 ' + esc(r.title) + '</b><small>' + esc(r.type) + '</small></div><small class="muted">' + fmtD(r.date) + '</small></div>');
  $('#searchResultsBody').innerHTML = html || '<p class="muted">No matches found.</p>';
});
document.addEventListener('click', e => {
  if (e.target.closest('[data-act="chatbot"]')) $('#cbModal').classList.remove('hidden');
  if (e.target.closest('[data-act="close-cb"]')) $('#cbModal').classList.add('hidden');
  if (e.target.closest('[data-act="send-cb"]')) sendCB();
});
 $('#cbInput').addEventListener('keydown', e => { if (e.key === 'Enter') sendCB(); });
function cbAdd(text, me) { const d = document.createElement('div'); d.className = 'msg ' + (me ? 'me' : 'bot'); d.innerHTML = text; $('#cbMsgs').appendChild(d); $('#cbMsgs').scrollTop = 1e6; }
function sendCB() { const q = $('#cbInput').value.trim(); if (!q) return; $('#cbInput').value = ''; cbAdd(esc(q), true); setTimeout(() => cbAdd(chatbotAnswer(q.toLowerCase())), 400); }
function chatbotAnswer(q) {
  const next = STATE.appts.filter(a => a.status === 'upcoming' && a.date >= todayStr()).sort((a, b) => a.date.localeCompare(b.date))[0];
  if (q.includes('queue')) { if (next) { const n = queueNumberOf(next); return '🎟️ Your queue number' + (n ? ' is <b>#' + n + '</b>' : ' will be assigned at check-in') + ' — ' + esc(next.doctorName) + ', ' + fmtD(next.date) + ' ' + esc(next.time) + '.'; } return '🎟️ No appointment today — no queue number.'; }
  if (q.includes('appointment') || q.includes('next')) return next ? '📅 Next: <b>' + esc(next.doctorName) + '</b>, ' + fmtD(next.date) + ' at <b>' + esc(next.time) + '</b>' + (queueNumberOf(next) ? ' (🎟️ Q#' + queueNumberOf(next) + ')' : '') + '.' : '📅 No upcoming appointments.';
  if (q.includes('map') || q.includes('location') || q.includes('where is')) { const on = STATE.doctors.filter(isOnline); return on.length ? '🗺️ ' + on.length + ' doctor(s) ON DUTY. Open <b>My Doctors</b> → map at the bottom. You can also 📞 call them there.' : '🗺️ No doctors on duty right now.'; }
  if (q.includes('medicine') || q.includes('tablet')) { const m = STATE.meds.filter(x => x.active !== false); return m.length ? '💊 ' + m.map(x => '• <b>' + esc(x.name) + '</b> — ' + esc(x.dosage || '') + (x.verified ? ' ✅ ready to take' : ' 🔴 pending')).join('<br>') : '💊 No active medicines.'; }
  if (q.includes('surgery') || q.includes('operation')) { const s = (ME.surgeries || '').split('\n').filter(Boolean); return s.length ? '🔪 ' + s.map(x => '• ' + esc(x)).join('<br>') : '🔪 No surgeries recorded.'; }
  if (q.includes('report')) return STATE.reports.length ? '🧪 ' + STATE.reports.slice(0, 6).map(r => '• ' + esc(r.title) + ' (' + fmtD(r.date) + ')').join('<br>') : '🧪 No reports yet.';
  if (q.includes('bill') || q.includes('fee')) { const tot = (STATE.bills || []).reduce((a, b) => a + Number(b.total || 0), 0); return '💰 Total billed: ₹' + tot + ' • pending: ' + (STATE.bills || []).filter(b => b.status !== 'paid').length + '. Open Billing for details.'; }
  if (q.includes('blood')) return '🩸 <b>' + esc(ME.bloodGroup || 'not recorded') + '</b>';
  return '🤖 Try: "next appointment?", "queue number?", "active medicines?", "where is my doctor?", "reports?", "billing?". For medical advice consult your doctor.';
}

/* ----- CHAT ----- */
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
  const tt = $('#chatInput').value.trim(); if (!tt || !CHAT_WITH) return; $('#chatInput').value = '';
  const tid = [ME.id, CHAT_WITH.id].sort().join('_');
  db.collection('threads').doc(tid).collection('m').add({ from: ME.id, fromRole: ROLE, text: tt, at: Date.now() });
  notify(CHAT_WITH.id, '💬 New message', (ROLE === 'doctor' ? 'Dr. ' + ME.name : ME.name) + ': ' + tt.slice(0, 60));
}

/* ============================================================
   SETTINGS — FIXED & BULLETPROOF
   ============================================================ */
function photoBlockHTML() {
  const icon = ROLE === 'patient' ? '🧑' : ROLE === 'doctor' ? '👨‍⚕️' : '🏥';
  const preview = ME.photo ? '<img id="photoPrev" src="' + ME.photo + '" class="big-avatar" style="object-fit:cover">' : '<div id="photoPrev" class="big-avatar" style="display:flex;align-items:center;justify-content:center">' + icon + '</div>';
  return preview + '<div style="flex:1"><input type="file" id="photoInput" accept="image/*" class="input">' +
    (ME.photo ? '<button class="btn ghost sm" data-act="remove-photo" style="margin-top:6px">Remove photo</button>' : '') +
    '<p class="hint">Pick a photo → auto-compressed → press <b>Save Changes</b>. Visible to doctors & hospital (audit-logged).</p></div>';
}
document.addEventListener('change', e => {
  if (!e.target || e.target.id !== 'photoInput') return;
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    const img = new Image();
    img.onload = () => {
      try {
        const cv = document.createElement('canvas'); cv.width = 180; cv.height = 180;
        const ctx = cv.getContext('2d');
        const s = Math.min(img.width, img.height);
        ctx.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, 180, 180);
        pendingPhoto = cv.toDataURL('image/jpeg', 0.65);
        const prev = $('#photoPrev');
        if (prev) prev.outerHTML = '<img id="photoPrev" src="' + pendingPhoto + '" class="big-avatar" style="object-fit:cover">';
        toast('Photo ready — now press "Save Changes" ✅');
      } catch (err) { toast('⚠️ Could not process the image.'); }
    };
    img.onerror = () => toast('⚠️ Invalid image file.');
    img.src = ev.target.result;
  };
  reader.onerror = () => toast('⚠️ Could not read the file.');
  reader.readAsDataURL(file);
});
function renderSettings() {
  try {
    const sp = $('#settingsProfile'); if (!sp) return;
    pendingPhoto = null;
    const pb = $('#photoBlock');
    if (pb) pb.innerHTML = photoBlockHTML();
    const fixed = '<div class="kv" style="margin:8px 0">' + (ROLE === 'patient' ? kvRows([['Health ID (fixed)', ME.healthId || '—'], ['Aadhaar (fixed)', maskAadhaar(ME.aadhaar)], ['Email (fixed)', ME.email || '—']]) : ROLE === 'doctor' ? kvRows([['Reg No (fixed)', ME.regNo || '—'], ['Email (fixed)', ME.email || '—']]) : kvRows([['License', ME.licenseNo || '—'], ['Email (fixed)', ME.email || '—']])) + '</div>';
    let fields = [];
    if (ROLE === 'patient') {
      fields = [['name', 'Full Name'], ['phone', 'Phone'], ['address', 'Address'], ['emergencyName', 'Emergency Contact Name'], ['emergencyPhone', 'Emergency Phone'], ['bloodGroup', 'Blood Group'], ['heightCm', 'Height (cm)'], ['weightKg', 'Weight (kg)'], ['allergies', 'Allergies'], ['conditions', 'Existing Conditions'], ['surgeries', 'Surgeries (one per line)'], ['accidents', 'Accidents'], ['familyHistory', 'Family History'], ['income', 'Annual Income']];
    } else if (ROLE === 'doctor') {
      fields = [['name', 'Doctor Name'], ['specialization', 'Specialization'], ['experience', 'Experience (years)'], ['hospital', 'Hospital'], ['phone', 'Phone (patients can call)']];
    } else {
      fields = [['name', 'Hospital Name'], ['adminName', 'Admin Name'], ['phone', 'Phone'], ['address', 'Address']];
    }
    sp.innerHTML =
      '<label class="label">Date of Birth (year & month dropdown + calendar)</label><input type="date" id="pfDob" class="input">' +
      fields.map(([k, label]) => '<label class="label">' + label + '</label><div class="mic-row"><input class="input" id="pf_' + k + '" data-pf="' + k + '" value="' + esc(ME[k] || '') + '"><button type="button" class="mic" data-act="mic" data-target="pf_' + k + '" title="Voice input">🎙️</button></div>').join('') +
      fixed +
      '<button class="btn primary" data-act="save-profile">💾 Save Changes</button>';
    const dobInput = $('#pfDob');
    if (dobInput) dobInput.value = ME.dob || '';
    mountDatePickers($('#pg-settings'));
  } catch (err) { console.error(err); toast('⚠️ Settings error: ' + err.message); }
}
document.addEventListener('click', async e => {
  if (e.target.closest('[data-act="remove-photo"]')) {
    try {
      await db.collection('users').doc(ME.id).update({ photo: firebase.firestore.FieldValue.delete() });
      delete ME.photo; buildNav(); renderSettings();
      toast('Photo removed ✅');
    } catch (err) { toast('⚠️ ' + errMsg(err)); }
    return;
  }
  if (!e.target.closest('[data-act="save-profile"]')) return;
  const upd = {};
  $$('[data-pf]').forEach(i => upd[i.dataset.pf] = i.value.trim());
  const dobEl = $('#pfDob'); if (dobEl && dobEl.value) upd.dob = dobEl.value;
  if (pendingPhoto) upd.photo = pendingPhoto;
  if (!upd.name) { toast('⚠️ Name cannot be empty.'); return; }
  try {
    await db.collection('users').doc(ME.id).update(upd);
    Object.assign(ME, upd);
    if (ROLE === 'patient') localStorage.setItem('cv_emergency', JSON.stringify(ME));
    buildNav();
    toast('Profile updated ✅' + (upd.photo ? ' (photo saved — visible everywhere)' : ''));
    renderSettings();
  } catch (err) { toast('⚠️ Save failed: ' + errMsg(err)); }
});
document.addEventListener('click', e => { const f = e.target.closest('[data-act="font"]'); if (f) { setFont(f.dataset.v); toast('Font size: ' + f.dataset.v); } });

/* ============================================================
   DOCTOR
   ============================================================ */
function bindDoctor() {
  UNBINDS.push(db.collection('cases').where('status', '==', 'waiting').onSnapshot(s => { STATE.cases = s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => a.createdAt - b.createdAt); renderDoctorCases(); renderDocDash(); }, console.error));
  UNBINDS.push(db.collection('cases').where('doctorId', '==', ME.id).onSnapshot(s => { STATE.myReviewed = s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (b.reviewedAt || 0) - (a.reviewedAt || 0)); renderDoctorCases(); renderDocDash(); }, console.error));
  UNBINDS.push(db.collection('appointments').where('doctorId', '==', ME.id).onSnapshot(s => { STATE.appts = s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (a.date || '').localeCompare(b.date || '')); renderDocAppts(); renderDocDash(); }, console.error));
  UNBINDS.push(db.collection('users').where('role', '==', 'patient').onSnapshot(s => { STATE.patients = s.docs.map(d => ({ id: d.id, ...d.data() })); renderPatients(); renderDocDash(); renderVerifyMeds(); renderDChats(); }, console.error));
  UNBINDS.push(db.collection('medicines').where('verified', '==', false).onSnapshot(s => { STATE.unverifiedMeds = s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => b.createdAt - a.createdAt); renderVerifyMeds(); renderDocDash(); }, console.error));
  UNBINDS.push(db.collection('bills').where('doctorId', '==', ME.id).onSnapshot(s => { STATE.myBills = s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => b.createdAt - a.createdAt); renderDBilling(); renderDocDash(); }, console.error));
}
function dutyToggleHTML() {
  const on = !!ME.onDuty;
  return '<h4>📍 Duty &amp; Live Location</h4><p class="muted sm-txt">When ON, patients see your live GPS on the Doctor Map. Deleted automatically on logout; older than 6 min = offline.</p>' +
    '<button class="duty-btn ' + (on ? 'duty-on' : 'duty-off') + '" data-act="toggle-duty">' + (on ? '🟢 ON DUTY — location visible (tap to go off duty)' : '⚪ OFF DUTY — tap to go on duty') + '</button>';
}
function renderDutyToggle() { const c = $('#dutyCard'); if (c && ROLE === 'doctor') c.innerHTML = dutyToggleHTML(); }
document.addEventListener('click', e => { if (e.target.closest('[data-act="toggle-duty"]')) setDuty(!ME.onDuty); });
function setDuty(on) {
  if (on) {
    if (!navigator.geolocation) return toast('⚠️ Geolocation not supported.');
    ME.onDuty = true; renderDutyToggle();
    toast('🟢 On duty — acquiring GPS…');
    dutyWatch = navigator.geolocation.watchPosition(pos => {
      if (Date.now() - lastLocSend < 20000) return;
      lastLocSend = Date.now();
      ME.location = { lat: pos.coords.latitude, lng: pos.coords.longitude, updatedAt: Date.now() };
      db.collection('users').doc(ME.id).update({ onDuty: true, location: ME.location }).catch(() => {});
    }, () => { toast('⚠️ Location permission denied.'); ME.onDuty = false; renderDutyToggle(); }, { enableHighAccuracy: true, maximumAge: 15000 });
  } else {
    ME.onDuty = false; ME.location = null;
    if (dutyWatch) { navigator.geolocation.clearWatch(dutyWatch); dutyWatch = null; }
    db.collection('users').doc(ME.id).update({ onDuty: false, location: firebase.firestore.FieldValue.delete() }).catch(() => {});
    renderDutyToggle();
    toast('⚪ Off duty — location removed.');
  }
}

/* ----- DOCTOR DASHBOARD (v11: doctor POV, no AI card) ----- */
function renderDocDash() {
  if (ROLE !== 'doctor') return;
  const today = todayStr();
  const h = new Date().getHours();
  const greet = h < 12 ? t('greetM') : h < 17 ? t('greetA') : t('greetE');
  const todays = STATE.appts.filter(a => a.date === today).sort((a, b) => timeToMin(a.time) - timeToMin(b.time));
  const unread = STATE.notifs.filter(n => !n.read).length;
  const un = (STATE.unverifiedMeds || []).length;
  const wc = $('#docWelcome');
  if (wc) wc.innerHTML = '<div class="doctor-line">' + avatarHTML(ME) +
    '<div><h3 style="margin:0">' + greet + ', Dr. ' + esc(ME.name) + ' 🩺</h3>' +
    '<small class="muted">' + esc(ME.specialization || '') + ' • ' + esc(ME.hospital || '') + ' • Reg: ' + esc(ME.regNo || '—') + '</small></div></div>' +
    '<p class="muted sm-txt" style="margin-top:8px">Here is your day at a glance. Click any patient name to open their complete portal details.</p>';
  const st = $('#ddStats');
  if (st) st.innerHTML = [
    ['mc-amber', '🟡', 'Your Waiting Cases', STATE.cases.length],
    ['mc-green', '📅', 'Your Patients Today', todays.filter(a => a.status === 'upcoming').length],
    ['mc-blue', '👥', 'Your Patients', STATE.patients.length],
    ['mc-red', '💊', 'Your Verifications', un],
    ['mc-amber', '💬', 'Unread', unread]
  ].map(([cls, ico, label, val]) => '<div class="mini-card"><span class="mc-ico ' + cls + '">' + ico + '</span><span><span class="mc-label">' + label + '</span><b>' + val + '</b></span></div>').join('');
  renderDutyToggle();
  const cta = $('#verifyCta');
  if (cta) cta.innerHTML = '<h4>💊 Medicine Verification — your confirmation unlocks treatment</h4>' +
    '<p class="muted sm-txt">Medicines your patients reported stay RED until YOU verify them. Once you confirm, they turn GREEN on the patient portal instantly — "Ready to take ✓".</p>' +
    '<button class="btn big ' + (un ? 'verify-red' : 'verify-green') + '" data-nav="d-verify">' +
    (un ? '🔴 YOU HAVE ' + un + ' MEDICINE' + (un > 1 ? 'S' : '') + ' WAITING FOR YOUR VERIFICATION — CLICK NOW' : '✅ YOU HAVE VERIFIED EVERYTHING — GREAT WORK, DOCTOR') + '</button>';
  const dp2 = $('#ddPending');
  if (dp2) dp2.innerHTML = STATE.cases.map(caseRow).join('') || '<p class="muted">🎉 You have no pending cases — all caught up!</p>';
  const dt = $('#ddToday');
  if (dt) dt.innerHTML = todays.map((a, i) =>
    '<div class="list-item"><div class="li-main"><b><span class="queue-chip">🎟️ Q#' + (i + 1) + '</span> ' + esc(a.time || '') + ' — ' +
    '<button class="linklike" data-act="view-patient" data-id="' + a.patientId + '">' + esc(a.patientName) + '</button></b>' +
    '<small>' + esc(a.type || '') + ' • ' + esc(a.healthId || '') + (a.reason ? ' • ' + esc(a.reason) : '') + '</small></div>' +
    '<div class="li-actions">' + (a.status === 'upcoming' ? '<button class="btn primary sm" data-act="complete-appt" data-id="' + a.id + '">Done</button>' : '<span class="chip green">' + esc(a.status) + '</span>') + '</div></div>').join('') || '<p class="muted">You have no appointments today.</p>';
}
function caseRow(c) {
  return '<div class="list-item"><div class="li-main"><b><button class="linklike" data-act="view-patient" data-id="' + c.patientId + '">' + esc(c.patientName) + '</button> <span class="chip blue">' + esc(c.healthId || '') + '</span></b><small>' + esc(c.chiefComplaint) + ' • ' + esc(c.duration || '') + ' • ' + esc(c.severity || '') + ' • ' + fmtDT(c.createdAt) + '</small></div><div class="li-actions"><button class="btn primary sm" data-act="open-case" data-id="' + c.id + '">Review →</button></div></div>';
}
 $$('[data-ctab]').forEach(tt => tt.onclick = () => { $$('[data-ctab]').forEach(x => x.classList.remove('active')); tt.classList.add('active'); CURRENT_CTAB = tt.dataset.ctab; renderDoctorCases(); });
function renderDoctorCases() {
  const el = $('#dcList'); if (!el || ROLE !== 'doctor') return;
  const list = CURRENT_CTAB === 'waiting' ? STATE.cases : (STATE.myReviewed || []);
  el.innerHTML = list.map(caseRow).join('') || '<p class="muted">No cases in this tab.</p>';
}
function renderVerifyMeds() {
  const el = $('#dvList'); if (!el || ROLE !== 'doctor') return;
  const meds = STATE.unverifiedMeds || [];
  el.innerHTML = meds.map(m => {
    const p = STATE.patients.find(x => x.id === m.patientId) || {};
    return '<div class="list-item"><div class="li-main doctor-line">' + avatarHTML(p) + '<div><b>' + esc(m.name) + ' <span class="chip blue">' + esc(p.healthId || '') + '</span></b><br><small class="muted">Patient: ' + esc(p.name || 'Unknown') + ' • ' + esc(m.dosage || '') + ' • ' + fmtDT(m.createdAt) + '</small></div></div><div class="li-actions"><button class="btn verify-red sm" data-act="verify-med" data-id="' + m.id + '" data-pid="' + m.patientId + '" data-name="' + esc(m.name) + '">🔴 PENDING — VERIFY ✓</button></div></div>';
  }).join('') || '<p class="muted">🟩 Everything verified — patients see "Ready to take ✓" in green.</p>';
}
function renderDChats() {
  const el = $('#dChatList'); if (!el || ROLE !== 'doctor') return;
  el.innerHTML = STATE.patients.map(p => {
    const tel = telLink(p.phone || p.emergencyPhone);
    return '<div class="list-item"><div class="li-main doctor-line">' + avatarHTML(p) + '<div><b>' + esc(p.name) + ' <span class="chip blue">' + esc(p.healthId || '') + '</span></b><br><small class="muted">' + ageOf(p.dob) + ' • ' + esc(p.gender || '') + ' • 🩸 ' + esc(p.bloodGroup || '—') + '</small></div></div><div class="li-actions"><button class="btn ghost sm" data-act="view-patient" data-id="' + p.id + '">👤 Full Details</button><button class="btn primary sm" data-act="open-chat" data-id="' + p.id + '" data-name="' + esc(p.name) + '">💬 Chat</button>' + (tel ? '<a class="btn ghost sm" href="' + tel + '">📞</a>' : '') + '</div></div>';
  }).join('') || '<p class="muted">No patients yet.</p>';
}
/* ----- BILLING: DOCTOR ----- */
function renderDBilling() {
  if (ROLE !== 'doctor') return;
  const s = $('#dbSummary'), list = $('#dbList');
  const bs = STATE.myBills || [];
  const total = bs.reduce((a, b) => a + Number(b.total || 0), 0);
  const paid = bs.filter(b => b.status === 'paid');
  const pend = bs.filter(b => b.status !== 'paid');
  if (s) s.innerHTML = [['Total billed by me', total, 'mc-blue'], ['Received (paid)', paid.reduce((a, b) => a + Number(b.total || 0), 0), 'mc-green'], ['Pending', pend.reduce((a, b) => a + Number(b.total || 0), 0), 'mc-red']].map(([l, v, c]) => '<div class="mini-card"><span class="mc-ico ' + c + '">₹</span><span><span class="mc-label">' + l + '</span><b>₹' + v + '</b></span></div>').join('');
  if (list) list.innerHTML = bs.map(b => '<div class="list-item"><div class="li-main"><b>' + esc(b.patientName || '') + ' — ' + esc(b.type || 'bill') + ' ₹' + esc(b.total) + '</b><small>' + billItemsStr(b) + ' • ' + fmtDT(b.createdAt) + '</small></div><div class="li-actions">' + (b.status === 'paid' ? '<span class="chip ready">✓ Paid</span>' : '<span class="chip waiting">Pending</span>') + '</div></div>').join('') || '<p class="muted">No bills yet. Enter a Consultation Fee when reviewing a case — the bill appears here and in the patient portal in real time.</p>';
}

/* ----- CASE DETAIL (consent check) ----- */
document.addEventListener('click', async e => {
  const oc = e.target.closest('[data-act="open-case"]'); if (!oc) return;
  const c = STATE.cases.find(x => x.id === oc.dataset.id) || (STATE.myReviewed || []).find(x => x.id === oc.dataset.id);
  if (!c) return;
  try {
    const consentDoc = await db.collection('consents').doc(c.patientId + '_' + ME.id).get();
    if (consentDoc.exists && consentDoc.data().status === 'revoked') {
      await logAccess(c.patientId, '🚫 Attempted access — BLOCKED by patient consent');
      return toast('🚫 Unauthorized Access Blocked — patient revoked your access.');
    }
    await logAccess(c.patientId, '👨‍⚕️ Dr. ' + ME.name + ' viewed your case');
    CURRENT_CASE = c;
    await renderCaseDetail();
  } catch (err) { toast('⚠️ ' + errMsg(err)); }
});
async function renderCaseDetail() {
  go('d-case', { silent: true });
  const c = CURRENT_CASE;
  $('#cdHead').innerHTML = '<div class="card"><div class="kv">' + kvRows([['Patient', c.patientName], ['Health ID', c.healthId], ['Status', c.status === 'waiting' ? '🟡 Waiting' : '🟩 Reviewed'], ['Submitted', fmtDT(c.createdAt)]]) + '</div><button class="btn ghost sm" data-act="view-patient" data-id="' + c.patientId + '" style="margin-top:8px">👤 View Full Patient Profile</button></div>';
  let p = {};
  try { const pdoc = await db.collection('users').doc(c.patientId).get(); if (pdoc.exists) p = pdoc.data(); } catch (e) {}
  let meds = [];
  try { const ms = await db.collection('medicines').where('patientId', '==', c.patientId).get(); meds = ms.docs.map(d => d.data()); } catch (e) {}
  let lastV = null;
  try { const vit = await db.collection('vitals').where('patientId', '==', c.patientId).get(); lastV = vit.docs.map(d => d.data()).sort((a, b) => b.createdAt - a.createdAt)[0]; } catch (e) {}
  $('#cdSummary').innerHTML = kvRows([['Age / Gender / Blood', ageOf(p.dob) + ' • ' + (p.gender || '—') + ' • ' + (p.bloodGroup || '—')], ['⚠️ Allergies', p.allergies || 'None recorded'], ['🏥 Chronic Conditions', p.conditions || 'None recorded'], ['🔪 Past Surgeries', (p.surgeries || 'None').split('\n')[0] || '—'], ['💊 Active Medicines', meds.filter(m => m.active !== false).map(m => m.name).join(', ') || '—'], ['📈 Last Vitals', lastV ? ((lastV.bp || '—') + ' BP • ' + (lastV.hr || '—') + ' hr • ' + (lastV.temp || '—') + '°C • pain ' + (lastV.pain || '—') + '/10') : '—'], ['🚗 Accidents', p.accidents || '—']]) + '<small class="muted">AI-generated from records — verify clinically. Not a diagnosis.</small>';
  $('#cdBlue').innerHTML = kvRows([['1️⃣ Chief Complaint', c.chiefComplaint], ['2️⃣ Symptoms', c.symptoms], ['🧍 Area', c.area], ['3️⃣ Duration', c.duration], ['Severity', c.severity], ['4️⃣ Previous Treatment', c.prevTreatment], ['5️⃣ Existing', c.existing], ['6️⃣ Current Meds', c.currentMeds], ['7️⃣ Allergies', c.allergyNote], ['8️⃣ Surgeries', c.surgeryNote], ['9️⃣ Family', c.familyHistory], ['🔟 Other', c.other]]);
  if (c.status === 'reviewed') { $('#cdNotes').value = c.doctorNotes || ''; $('#cdObs').value = c.observations || ''; $('#cdTests').value = c.tests || ''; $('#cdFollow').value = c.followupDays || ''; $('#cdFee').value = c.fee || ''; }
  else { $('#cdNotes').value = ''; $('#cdObs').value = ''; $('#cdTests').value = ''; $('#cdFollow').value = ''; $('#cdFee').value = ''; }
  $('#prescRows').innerHTML = prescRowHTML();
  $('#cdMedVerify').innerHTML = meds.map(m => '<div class="list-item"><div class="li-main"><b>' + esc(m.name) + '</b><small>' + esc(m.dosage || '') + ' • by ' + esc(m.prescribedBy || '') + '</small></div><div class="li-actions">' + (m.verified ? '<span class="chip ready">🟩 Verified ✓ ' + esc(m.verifiedBy || '') + '</span>' : '<button class="btn verify-red sm" data-act="verify-med" data-id="' + m.id + '" data-pid="' + c.patientId + '" data-name="' + esc(m.name) + '">🔴 PENDING — VERIFY ✓</button>') + '</div></div>').join('') || '<p class="muted">No medicines.</p>';
}
function prescRowHTML() { return '<div class="presc-row"><input class="input p-name" placeholder="Medicine"><input class="input p-dose" placeholder="Dose/instructions"><input class="input p-days" placeholder="Days"><input class="input p-inst" placeholder="Before/after food…"></div>'; }
document.addEventListener('click', e => {
  if (e.target.closest('[data-act="add-presc-row"]')) $('#prescRows').insertAdjacentHTML('beforeend', prescRowHTML());
  const vm = e.target.closest('[data-act="verify-med"]');
  if (vm) {
    db.collection('medicines').doc(vm.dataset.id).update({ verified: true, verifiedBy: 'Dr. ' + ME.name, verifiedAt: Date.now() }).then(() => {
      logAccess(vm.dataset.pid, '👨‍⚕️ Dr. ' + ME.name + ' verified medicine: ' + vm.dataset.name);
      notify(vm.dataset.pid, '🟩 Medicine Verified — Ready to Take', 'Dr. ' + ME.name + ' verified: ' + vm.dataset.name + '. Safe to take as prescribed.');
      toast('🟩 Verified! Patient portal now GREEN — "Ready to take ✓"');
    }).catch(err => toast('⚠️ ' + errMsg(err)));
  }
});
document.addEventListener('click', async e => {
  if (!e.target.closest('[data-act="submit-review"]')) return;
  const c = CURRENT_CASE; if (!c) return;
  const meds = [...$$('#prescRows .presc-row')].map(r => ({ name: r.querySelector('.p-name').value.trim(), dose: r.querySelector('.p-dose').value.trim(), days: r.querySelector('.p-days').value.trim(), inst: r.querySelector('.p-inst').value.trim() })).filter(m => m.name);
  const share = $('#cdShare').checked;
  const fee = Number($('#cdFee').value) || 0;
  try {
    await db.collection('cases').doc(c.id).update({
      status: 'reviewed', doctorId: ME.id, doctorName: ME.name, reviewedAt: Date.now(), fee: fee || 0,
      doctorNotes: $('#cdNotes').value.trim(), observations: $('#cdObs').value.trim(),
      prescriptionText: meds.map(m => m.name + ' — ' + m.dose + (m.days ? ' (' + m.days + 'd)' : '')).join('; '),
      tests: $('#cdTests').value.trim(), followupDays: $('#cdFollow').value, sharedWithPatient: share
    });
    for (const m of meds) await db.collection('medicines').add({ patientId: c.patientId, name: m.name, dosage: (m.dose + ' ' + m.inst).trim(), startDate: todayStr(), durationDays: m.days, prescribedBy: 'Dr. ' + ME.name, verified: true, verifiedBy: 'Dr. ' + ME.name, source: 'doctor', active: true, createdAt: Date.now() });
    await db.collection('timeline').add({ patientId: c.patientId, date: todayStr(), type: 'consult', icon: '👨‍⚕️', title: 'Consultation — Dr. ' + ME.name, description: $('#cdNotes').value.trim() || c.chiefComplaint, createdAt: Date.now() });
    if (meds.length) await db.collection('timeline').add({ patientId: c.patientId, date: todayStr(), type: 'prescription', icon: '💊', title: 'Prescription added', description: meds.map(m => m.name).join(', '), createdAt: Date.now() });
    const fu = Number($('#cdFollow').value);
    if (fu > 0) {
      const due = new Date(Date.now() + fu * 86400000).toISOString().slice(0, 10);
      await db.collection('timeline').add({ patientId: c.patientId, date: todayStr(), type: 'followup', icon: '🔔', title: 'Follow-up after ' + fu + ' days', description: 'Due: ' + fmtD(due), due, createdAt: Date.now() });
    }
    if (fee > 0) {
      await db.collection('bills').add({ patientId: c.patientId, patientName: c.patientName, healthId: c.healthId, doctorId: ME.id, doctorName: 'Dr. ' + ME.name, hospital: ME.hospital || '', type: 'consultation', items: [{ label: 'Consultation fee — Dr. ' + ME.name, amount: fee }], total: fee, status: 'pending', createdAt: Date.now() });
      await notify(c.patientId, '💰 New Bill — Consultation', 'Dr. ' + ME.name + ' billed ₹' + fee + '. Open Billing to view & pay.');
    }
    if (share) await notify(c.patientId, '✅ Doctor Reviewed Your Case', 'Dr. ' + ME.name + ' verified your case and added clinical information.');
    await logAccess(c.patientId, '👨‍⚕️ Dr. ' + ME.name + ' reviewed your case & updated prescription');
    toast('✅ Verified & sent to patient!' + (fee > 0 ? ' Bill ₹' + fee + ' created.' : ''));
    STATE.cases = STATE.cases.filter(x => x.id !== c.id);
    renderDoctorCases(); go('d-cases', { silent: true });
  } catch (err) { toast('⚠️ ' + errMsg(err)); }
});

/* ----- PATIENTS (doctor) ----- */
 $('#dpSearch').addEventListener('input', renderPatients);
function renderPatients() {
  const el = $('#dpList'); if (!el || ROLE !== 'doctor') return;
  const q = ($('#dpSearch').value || '').trim().toLowerCase();
  el.innerHTML = STATE.patients.filter(p => !q || (p.name || '').toLowerCase().includes(q) || (p.healthId || '').toLowerCase().includes(q)).map(p =>
    '<div class="card"><div class="doctor-line">' + avatarHTML(p) + '<div><b>' + esc(p.name) + '</b><br><small class="muted">' + esc(p.healthId || '') + ' • ' + ageOf(p.dob) + ' • ' + esc(p.gender || '') + ' • 🩸 ' + esc(p.bloodGroup || '—') + '</small></div></div><p class="muted" style="margin:8px 0">⚠️ ' + esc((p.allergies || 'None').slice(0, 60)) + '</p><div style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn ghost sm" data-act="view-patient" data-id="' + p.id + '">👤 Full Profile</button><button class="btn primary sm" data-act="open-chat" data-id="' + p.id + '" data-name="' + esc(p.name) + '">💬 Chat</button></div></div>').join('') || '<p class="muted">No patients found.</p>';
}
function renderDocAppts() {
  const el = $('#daList'); if (!el || ROLE !== 'doctor') return;
  el.innerHTML = STATE.appts.slice().sort((a, b) => (b.date || '').localeCompare(a.date || '')).map(a => '<div class="list-item"><div class="li-main"><b>' + fmtD(a.date) + ' ' + esc(a.time || '') + ' — <button class="linklike" data-act="view-patient" data-id="' + a.patientId + '">' + esc(a.patientName) + '</button></b><small>' + esc(a.type || '') + ' • ' + esc(a.reason || '') + '</small></div><div class="li-actions"><span class="chip ' + (a.status === 'upcoming' ? 'blue' : a.status === 'completed' ? 'green' : 'red') + '">' + esc(a.status) + '</span>' + (a.status === 'upcoming' ? '<button class="btn primary sm" data-act="complete-appt" data-id="' + a.id + '">Mark Done</button>' : '') + '</div></div>').join('') || '<p class="muted">No appointments.</p>';
}

/* ----- FULL PROFILE MODALS ----- */
document.addEventListener('click', e => {
  const vp = e.target.closest('[data-act="view-patient"]');
  if (vp) openPatientProfile(vp.dataset.id);
  const hd = e.target.closest('[data-act="h-view-doctor"]');
  if (hd) openDoctorProfile(hd.dataset.id);
});
async function openPatientProfile(pid) {
  let p = STATE.patients.find(x => x.id === pid);
  if (!p) { try { const d = await db.collection('users').doc(pid).get(); if (d.exists) p = { id: d.id, ...d.data() }; } catch (e) {} }
  if (!p) return toast('⚠️ Patient not found.');
  logAccess(pid, (ROLE === 'doctor' ? '👨‍⚕️ Dr. ' : '🏥 ') + ME.name + ' viewed your full profile');
  showModal('<div class="doctor-line">' + avatarHTML(p) + '<h3 style="margin:0">' + esc(p.name) + ' <span class="chip blue">' + esc(p.healthId || '') + '</span></h3></div><p class="muted">Loading complete profile…</p>' + modalCloseBtn());
  let meds = [], cases = [], reports = [], vitals = [], bills = [];
  try { const r = await db.collection('medicines').where('patientId', '==', pid).get(); meds = r.docs.map(d => d.data()).sort((a, b) => b.createdAt - a.createdAt); } catch (e) {}
  try { const r = await db.collection('cases').where('patientId', '==', pid).get(); cases = r.docs.map(d => d.data()).sort((a, b) => b.createdAt - a.createdAt); } catch (e) {}
  try { const r = await db.collection('reports').where('patientId', '==', pid).get(); reports = r.docs.map(d => d.data()).sort((a, b) => b.createdAt - a.createdAt); } catch (e) {}
  try { const r = await db.collection('vitals').where('patientId', '==', pid).get(); vitals = r.docs.map(d => d.data()).sort((a, b) => b.createdAt - a.createdAt); } catch (e) {}
  try { const r = await db.collection('bills').where('patientId', '==', pid).get(); bills = r.docs.map(d => d.data()).sort((a, b) => b.createdAt - a.createdAt); } catch (e) {}
  const lv = vitals[0]; const bp = lv ? parseBp(lv.bp) : null;
  const tel = telLink(p.phone);
  const billTot = bills.reduce((a, b) => a + Number(b.total || 0), 0);
  $('#modalCard').innerHTML =
    '<div class="doctor-line" style="margin-bottom:10px">' + avatarHTML(p) + '<div><h3 style="margin:0">' + esc(p.name) + ' <span class="chip blue">' + esc(p.healthId || '') + '</span></h3><small class="muted">' + ageOf(p.dob) + ' • ' + esc(p.gender || '') + ' • 🩸 ' + esc(p.bloodGroup || '—') + (tel ? ' • <a href="' + tel + '">📞 ' + esc(p.phone || '') + '</a>' : '') + '</small></div></div>' +
    '<h4>📝 Registration Details (everything the patient filled)</h4><div class="kv">' + kvRows([['Full Name', p.name], ['Date of Birth', fmtD(p.dob) + ' (' + ageOf(p.dob) + ')'], ['Gender', p.gender], ['Blood Group', p.bloodGroup], ['Phone', p.phone], ['Email', p.email], ['Address', p.address], ['Aadhaar (masked)', maskAadhaar(p.aadhaar)], ['Emergency Contact', (p.emergencyName || '—') + ' ' + (p.emergencyPhone || '')], ['Height / Weight', (p.heightCm || '—') + ' cm • ' + (p.weightKg || '—') + ' kg'], ['⚠️ Allergies', p.allergies || 'None'], ['🏥 Existing Conditions', p.conditions || 'None'], ['🔪 Surgeries', p.surgeries || 'None'], ['🚗 Accidents', p.accidents || 'None'], ['👨‍👩‍👦 Family History', p.familyHistory || 'None'], ['💰 Annual Income', p.income ? '₹' + p.income : '—']]) + '</div>' +
    '<h4 style="margin-top:12px">💊 Medicines (' + meds.length + ')</h4>' + (meds.length ? '<div class="kv">' + meds.slice(0, 8).map(m => '<div class="krow"><span>' + esc(m.name) + ' <small class="muted">' + esc(m.dosage || '') + '</small></span>' + medChip(m) + '</div>').join('') + '</div>' : '<p class="muted">None</p>') +
    '<h4 style="margin-top:12px">📋 Cases (' + cases.length + ')</h4>' + (cases.length ? '<div class="kv">' + cases.slice(0, 6).map(c => '<div class="krow"><span>' + esc(c.chiefComplaint) + ' <small class="muted">' + fmtDT(c.createdAt) + '</small></span><b>' + (c.status === 'reviewed' ? '🟩 Dr. ' + esc(c.doctorName || '') : '🟡 waiting') + '</b></div>').join('') + '</div>' : '<p class="muted">None</p>') +
    '<h4 style="margin-top:12px">🧪 Reports (' + reports.length + ')</h4>' + (reports.length ? '<div class="kv">' + reports.slice(0, 5).map(r => '<div class="krow"><span>' + esc(r.title) + '</span><small>' + esc(r.type) + ' • ' + fmtD(r.date) + '</small></div>').join('') + '</div>' : '<p class="muted">None</p>') +
    '<h4 style="margin-top:12px">📈 Last Vitals</h4><div class="kv">' + kvRows(lv ? [['Date', fmtD(lv.date)], ['Temperature', (lv.temp || '—') + ' °C'], ['BP', bp ? bp.s + '/' + bp.d : '—'], ['Heart Rate', (lv.hr || '—') + ' bpm'], ['Weight', (lv.wt || '—') + ' kg'], ['Pain', (lv.pain || '—') + '/10'], ['Symptoms', lv.sym || '—']] : [['Status', 'No vitals recorded']]) + '</div>' +
    '<h4 style="margin-top:12px">💰 Billing (₹' + billTot + ' total)</h4>' + (bills.length ? '<div class="kv">' + bills.slice(0, 5).map(b => '<div class="krow"><span>' + esc(b.type) + ' — ' + billItemsStr(b) + '</span><b>' + (b.status === 'paid' ? '✓ Paid' : 'Pending') + '</b></div>').join('') + '</div>' : '<p class="muted">None</p>') +
    '<small class="muted">🔐 This view has been logged in the patient\'s audit trail.</small>' + modalCloseBtn();
}
async function openDoctorProfile(did) {
  let d = STATE.doctors.find(x => x.id === did);
  if (!d) { try { const doc = await db.collection('users').doc(did).get(); if (doc.exists) d = { id: doc.id, ...doc.data() }; } catch (e) {} }
  if (!d) return toast('⚠️ Doctor not found.');
  showModal('<h3>👨‍⚕️ Dr. ' + esc(d.name) + '</h3><p class="muted">Loading…</p>' + modalCloseBtn());
  let appts = [], reviewed = 0, earnings = 0;
  try { const r = await db.collection('appointments').where('doctorId', '==', did).get(); appts = r.docs.map(x => x.data()); } catch (e) {}
  try { const r = await db.collection('cases').where('doctorId', '==', did).get(); reviewed = r.size; } catch (e) {}
  try { const r = await db.collection('bills').where('doctorId', '==', did).get(); earnings = r.docs.map(x => x.data()).filter(b => b.status === 'paid').reduce((a, b) => a + Number(b.total || 0), 0); } catch (e) {}
  $('#modalCard').innerHTML =
    '<div class="doctor-line" style="margin-bottom:10px">' + avatarHTML(d) + '<div><h3 style="margin:0">Dr. ' + esc(d.name) + ' ' + (isOnline(d) ? '<span class="chip green">🟢 On duty</span>' : '<span class="chip">⚪ Off duty</span>') + '</h3><small class="muted">' + esc(d.specialization || '') + '</small></div></div>' +
    '<h4>📝 Registration Details (everything the doctor filled)</h4><div class="kv">' + kvRows([['Name', 'Dr. ' + d.name], ['Specialization', d.specialization], ['Hospital', d.hospital], ['Medical Reg No', d.regNo], ['Experience', (d.experience || '—') + ' years'], ['Phone', d.phone || '—'], ['Email', d.email || '—']]) + '</div>' +
    '<h4 style="margin-top:12px">📊 Activity &amp; Earnings</h4><div class="kv">' + kvRows([['Total Appointments', appts.length], ['Cases Reviewed', reviewed], ['Earnings (paid)', '₹' + earnings], ['Duty Status', isOnline(d) ? '🟢 On duty (live location)' : '⚪ Off duty']]) + '</div>' +
    '<h4 style="margin-top:12px">📅 Recent Appointments</h4>' + (appts.length ? '<div class="kv">' + appts.sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 6).map(a => '<div class="krow"><span>' + esc(a.patientName) + '</span><small>' + fmtD(a.date) + ' ' + esc(a.time) + ' • ' + esc(a.status) + '</small></div>').join('') + '</div>' : '<p class="muted">None yet</p>') +
    modalCloseBtn();
}

/* ============================================================
   HOSPITAL
   ============================================================ */
function bindHospital() {
  let inFlight = false, queued = false;
  const refresh = async () => {
    if (inFlight) { queued = true; return; }
    inFlight = true;
    try {
      const [as, cs, ms, bs, ds, ps] = await Promise.all([
        db.collection('appointments').get(), db.collection('cases').get(), db.collection('medicines').get(),
        db.collection('bills').get(),
        db.collection('users').where('role', '==', 'doctor').get(), db.collection('users').where('role', '==', 'patient').get()
      ]);
      STATE.appts = as.docs.map(x => ({ id: x.id, ...x.data() }));
      STATE.allCases = cs.docs.map(x => ({ id: x.id, ...x.data() })).sort((a, b) => b.createdAt - a.createdAt);
      STATE.medsAll = ms.docs.map(x => ({ id: x.id, ...x.data() })).sort((a, b) => b.createdAt - a.createdAt);
      STATE.billsAll = bs.docs.map(x => ({ id: x.id, ...x.data() })).sort((a, b) => b.createdAt - a.createdAt);
      STATE.doctors = ds.docs.map(x => ({ id: x.id, ...x.data() }));
      STATE.patients = ps.docs.map(x => ({ id: x.id, ...x.data() }));
      renderHospital(); renderHPatients(); renderHDoctors(); renderHCases(); renderHMeds(); renderHAppts(); renderHBilling();
    } catch (e) { console.error(e); }
    inFlight = false;
    if (queued) { queued = false; refresh(); }
  };
  UNBINDS.push(db.collection('appointments').onSnapshot(refresh, console.error));
  UNBINDS.push(db.collection('cases').onSnapshot(refresh, console.error));
  UNBINDS.push(db.collection('medicines').onSnapshot(refresh, console.error));
  UNBINDS.push(db.collection('bills').onSnapshot(refresh, console.error));
  UNBINDS.push(db.collection('users').onSnapshot(refresh, console.error));
  refresh();
}
function tableHTML(headers, rows) {
  if (!rows.length) return '<p class="muted">No records yet.</p>';
  return '<div style="overflow-x:auto"><table><tr>' + headers.map(h => '<th>' + h + '</th>').join('') + '</tr>' + rows.map(r => '<tr>' + r.map(c => '<td>' + c + '</td>').join('') + '</tr>').join('') + '</table></div>';
}
/* ----- HOSPITAL DASHBOARD (v11: no Verification Overview) ----- */
function renderHospital() {
  if (ROLE !== 'hospital') return;
  const today = todayStr();
  $('#hhStats').innerHTML = [['👥 Patients', STATE.patients.length], ['👨‍⚕️ Doctors', STATE.doctors.length], ['📅 Today\'s Appointments', STATE.appts.filter(a => a.date === today).length]].map(([k, v]) => '<div class="card center"><h4>' + k + '</h4><p style="font-size:30px;font-weight:800;color:var(--primary)">' + v + '</p></div>').join('');
  const todayRows = STATE.appts.filter(a => a.date === today).map(a => [esc(a.patientName), esc(a.doctorName), esc(a.time), esc(a.type || ''), '<span class="chip ' + (a.status === 'upcoming' ? 'blue' : 'green') + '">' + esc(a.status) + '</span>']);
  $('#hhQueue').innerHTML = tableHTML(['Patient', 'Doctor', 'Time', 'Type', 'Status'], todayRows);
}
function renderHAppts() {
  if (ROLE !== 'hospital') return;
  const el = $('#hApptTable'); if (!el) return;
  const rows = STATE.appts.slice().sort((a, b) => (b.date || '').localeCompare(a.date || '')).map(a => [fmtD(a.date), esc(a.time || ''), esc(a.patientName || '') + '<br><small class="muted">' + esc(a.healthId || '') + '</small>', esc(a.doctorName || ''), esc(a.department || '—'), esc(a.type || '—'), '<span class="chip ' + (a.status === 'upcoming' ? 'blue' : a.status === 'completed' ? 'green' : 'red') + '">' + esc(a.status) + '</span>']);
  el.innerHTML = tableHTML(['Date', 'Time', 'Patient', 'Doctor', 'Department', 'Type', 'Status'], rows);
}
const hps = $('#hPatSearch');
if (hps) hps.addEventListener('input', renderHPatients);
function renderHPatients() {
  if (ROLE !== 'hospital') return;
  const el = $('#hPatList'); if (!el) return;
  const q = ($('#hPatSearch') && $('#hPatSearch').value || '').trim().toLowerCase();
  const list = STATE.patients.filter(p => !q || (p.name || '').toLowerCase().includes(q) || (p.healthId || '').toLowerCase().includes(q));
  el.innerHTML = list.map(p => { const pm = STATE.medsAll.filter(m => m.patientId === p.id);
    return '<div class="list-item"><div class="li-main doctor-line">' + avatarHTML(p) + '<div><b>' + esc(p.name) + ' <span class="chip blue">' + esc(p.healthId || '') + '</span></b><br><small class="muted">' + ageOf(p.dob) + ' • ' + esc(p.gender || '') + ' • 🩸 ' + esc(p.bloodGroup || '—') + ' • 💊 ' + pm.length + ' (' + pm.filter(m => m.verified).length + ' verified)</small></div></div><div class="li-actions"><button class="btn primary sm" data-act="view-patient" data-id="' + p.id + '">👁️ View Full Details</button></div></div>'; }).join('') || '<p class="muted">No patients found.</p>';
}
function renderHDoctors() {
  if (ROLE !== 'hospital') return;
  const rows = STATE.doctors.map(d => ['👨‍⚕️ ' + esc(d.name), esc(d.specialization || ''), esc(d.hospital || ''), esc(d.experience || '—') + ' yrs', esc(d.regNo || ''), esc(d.phone || '—'), isOnline(d) ? '🟢 On duty' : '⚪ Off duty', '<button class="btn ghost sm" data-act="h-view-doctor" data-id="' + d.id + '">👁️ View</button>']);
  $('#hDocTable').innerHTML = tableHTML(['Doctor', 'Specialization', 'Hospital', 'Experience', 'Reg No', 'Phone', 'Duty', 'Details'], rows);
}
function renderHCases() {
  if (ROLE !== 'hospital') return;
  const rows = STATE.allCases.map(c => [esc(c.patientName) + '<br><small class="muted">' + esc(c.healthId || '') + '</small>', esc(c.chiefComplaint), esc(c.severity || '—'), esc(c.duration || '—'), c.status === 'reviewed' ? '<span class="chip green">🟩 Dr. ' + esc(c.doctorName || '') + '</span>' : '<span class="chip amber">🟡 Waiting</span>', fmtDT(c.createdAt)]);
  $('#hCaseTable').innerHTML = tableHTML(['Patient', 'Chief Complaint', 'Severity', 'Duration', 'Status', 'Submitted'], rows);
}
function renderHMeds() {
  if (ROLE !== 'hospital') return;
  const rows = STATE.medsAll.map(m => {
    const p = STATE.patients.find(x => x.id === m.patientId) || {};
    return [esc(m.name), esc(p.name || '—') + '<br><small class="muted">' + esc(p.healthId || '') + '</small>', esc(m.dosage || ''), esc(m.source === 'doctor' ? '👨‍⚕️ Doctor' : '🟦 Patient'), m.verified ? '<span class="chip ready">🟩 ' + esc(m.verifiedBy || '') + '</span>' : '<span class="chip waiting">🔴 Pending</span>', fmtDT(m.createdAt)];
  });
  $('#hMedTable').innerHTML = tableHTML(['Medicine', 'Patient', 'Dosage', 'Source', 'Verification', 'Added'], rows);
}
/* ----- BILLING: HOSPITAL ----- */
function renderHBilling() {
  if (ROLE !== 'hospital') return;
  const s = $('#hbSummary'), list = $('#hbList');
  const bs = STATE.billsAll || [];
  const total = bs.reduce((a, b) => a + Number(b.total || 0), 0);
  const paid = bs.filter(b => b.status === 'paid');
  const pend = bs.filter(b => b.status !== 'paid');
  if (s) s.innerHTML = [['Total Revenue', total, 'mc-blue'], ['Collected (paid)', paid.reduce((a, b) => a + Number(b.total || 0), 0), 'mc-green'], ['Pending', pend.reduce((a, b) => a + Number(b.total || 0), 0), 'mc-red']].map(([l, v, c]) => '<div class="mini-card"><span class="mc-ico ' + c + '">₹</span><span><span class="mc-label">' + l + '</span><b>₹' + v + '</b></span></div>').join('');
  if (list) list.innerHTML = bs.map(b => '<div class="list-item"><div class="li-main"><b>' + esc(b.patientName || '') + ' — ' + esc(b.type || 'bill') + ' ₹' + esc(b.total) + '</b><small>' + billItemsStr(b) + (b.doctorName ? ' • ' + esc(b.doctorName) : '') + ' • ' + fmtDT(b.createdAt) + '</small></div><div class="li-actions">' + (b.status === 'paid' ? '<span class="chip ready">✓ Paid</span>' : '<span class="chip waiting">Pending</span>') + '</div></div>').join('') || '<p class="muted">No bills yet.</p>';
}
document.addEventListener('click', async e => {
  if (!e.target.closest('[data-act="h-add-bill"]')) return;
  const hid = $('#hbHid').value.trim().toUpperCase();
  const item = $('#hbItem').value.trim();
  const amount = Number($('#hbAmount').value) || 0;
  if (!hid || !item || !amount) return toast('⚠️ Health ID, item and amount are required.');
  try {
    const ps = await db.collection('users').where('healthId', '==', hid).limit(1).get();
    if (ps.empty) return toast('⚠️ Health ID not found.');
    const p = ps.docs[0].data();
    await db.collection('bills').add({ patientId: ps.docs[0].id, patientName: p.name, healthId: p.healthId, doctorName: '', hospital: ME.name, type: $('#hbType').value, items: [{ label: item, amount }], total: amount, status: 'pending', createdAt: Date.now() });
    await notify(ps.docs[0].id, '💰 New Bill from ' + ME.name, item + ' — ₹' + amount + '. Open Billing to view & pay.');
    $('#hbHid').value = ''; $('#hbItem').value = ''; $('#hbAmount').value = '';
    toast('✅ Bill added — visible in patient portal in real time');
  } catch (err) { toast('⚠️ ' + errMsg(err)); }
});
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

/* ----- VOICE SCRIBE ----- */
document.addEventListener('click', e => {
  const m = e.target.closest('[data-act="mic"]'); if (!m) return;
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return toast('Voice input not supported (use Chrome).');
  try {
    const rec = new SR(); rec.lang = CUR_LANG === 'ta' ? 'ta-IN' : CUR_LANG === 'hi' ? 'hi-IN' : 'en-IN'; rec.interimResults = false;
    m.classList.add('rec'); toast('🎙️ Listening… speak now');
    rec.onresult = ev => { const t2 = document.getElementById(m.dataset.target); t2.value = (t2.value ? t2.value + ' ' : '') + ev.results[0][0].transcript; };
    rec.onend = () => m.classList.remove('rec');
    rec.onerror = () => { m.classList.remove('rec'); toast('⚠️ Mic error.'); };
    rec.start();
  } catch (err) { m.classList.remove('rec'); toast('⚠️ Could not start mic.'); }
});

/* ----- MOUNT ALL DATE PICKERS + CLOSE OVERLAYS ----- */
mountDatePickers();
 $$('.overlay').forEach(ov => ov.addEventListener('click', e => { if (e.target === ov) ov.classList.add('hidden'); }));
