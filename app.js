const SUPABASE_URL = 'https://kavuylmowzmdupyilhdk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthdnV5bG1vd3ptZHVweWlsaGRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4MjI4OTQsImV4cCI6MjA5MzM5ODg5NH0.mSD9Mnpa1HavWMMeIi6RH427ru4xsUwsdKDcHw6QVII';

const GS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbz1EDj4xShsXRgywqv_Loan4TN0RHMhX6Q465zw4_qp2dCiHd3lTjTTjQYyNctJShq4SA/exec';
const GS_SECRET   = 'JPVS_FIRFLEET_2025_SECRET';
const GS_ENABLED  = GS_ENDPOINT.length > 10;
let gsQueue = [];

async function syncToGS(action, data) {
  if (!GS_ENABLED) return;
  try {
    await fetch(GS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: GS_SECRET, action, data })
    });
  } catch(e) { gsQueue.push({ action, data }); }
}

setInterval(async () => {
  if (!GS_ENABLED || gsQueue.length === 0 || !currentUser) return;
  const item = gsQueue.shift();
  await syncToGS(item.action, item.data);
}, 10000);

const BASEROW_API_TOKEN = '';
const BASEROW_TABLE_ID = '';
let baserow = null;
let baserowData = [];
let baserowWebSocket = null;
const isBaserowConfigured = false;

const FUEL_RATE = 2.05;
const months = ['Januari','Februari','Mac','April','Mei','Jun','Julai','Ogos','September','Oktober','November','Disember'];

let currentLang = 'ms';
let isLoggedIn = false;
let currentUser = {name:'Ahmad Firdaus',email:'ahmad@jpvs.gov.my',role:'superadmin',initials:'AF'};
let travelData = [];
let enfData = [];
let uploadedFiles = {minyak:[],odo:[],kes:[]};
let announcement = 'Selamat datang ke Portal Penguatkuasaan JPVS. Sila kemaskini rekod anda. Mesyuarat bulanan 15hb setiap bulan.';

const i18n = {
  ms:{
    'nav.main':'UTAMA','nav.dashboard':'Dashboard','nav.records':'REKOD',
    'nav.wfb':'Kad Waktu (WFB)','nav.travel':'Log Perjalanan',
    'nav.enforcement':'Data Penguatkuasa','nav.data':'DATA & EKSPORT',
    'nav.admin':'Super Admin',
    'greeting.pagi':'Selamat Pagi','greeting.tengah':'Selamat Tengah Hari',
    'greeting.petang':'Selamat Petang','greeting.malam':'Selamat Malam'
  },
  en:{
    'nav.main':'MAIN','nav.dashboard':'Dashboard','nav.records':'RECORDS',
    'nav.wfb':'Time Card (WFB)','nav.travel':'Travel Log',
    'nav.enforcement':'Enforcement Data','nav.data':'DATA & EXPORT',
    'nav.admin':'Super Admin',
    'greeting.pagi':'Good Morning','greeting.tengah':'Good Afternoon',
    'greeting.petang':'Good Evening','greeting.malam':'Good Night'
  }
};

function t(key){return (i18n[currentLang]||{})[key]||key;}

function initParticles(){
  const c=document.getElementById('particles');
  const colors=['#6C63FF','#FF6584','#43E8D8','#FFD700','#A78BFA'];
  for(let i=0;i<40;i++){
    const p=document.createElement('div');p.className='particle';
    const size=Math.random()*4+1;
    p.style.cssText=`width:${size}px;height:${size}px;left:${Math.random()*100}%;background:${colors[Math.floor(Math.random()*colors.length)]};animation-duration:${Math.random()*15+8}s;animation-delay:${Math.random()*10}s;`;
    c.appendChild(p);
  }
}

function updateClock(){
  const now=new Date();
  const h=now.getHours(),m=now.getMinutes(),s=now.getSeconds();
  const h12=h%12||12,ampm=h<12?'PG':h<18?'PTG':'MLM';
  const timeStr=`${String(h12).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  ['navClock','dashClock'].forEach(id=>{const el=document.getElementById(id);if(el)el.textContent=timeStr;});
  ['navPeriod','dashPeriod'].forEach(id=>{const el=document.getElementById(id);if(el)el.textContent=ampm;});
  const dateEl=document.getElementById('dashDate');
  if(dateEl){const days=['Ahad','Isnin','Selasa','Rabu','Khamis','Jumaat','Sabtu'];dateEl.textContent=`${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;}
  const greet=document.getElementById('greetingText');
  if(greet){let g=t(h<12?'greeting.pagi':h<13?'greeting.tengah':h<18?'greeting.petang':'greeting.malam');greet.textContent=`${g}, ${currentUser.name.split(' ')[0]}`;}
  const wfbMonth=document.getElementById('wfbMonth');
  if(wfbMonth)wfbMonth.textContent=`${months[now.getMonth()]} ${now.getFullYear()}`;
}



function showSection(id,el){
  const overlay=document.getElementById('transOverlay');
  overlay.classList.add('animating');
  setTimeout(()=>overlay.classList.remove('animating'),700);
  document.querySelectorAll('.section').forEach(s=>s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  document.getElementById('sec-'+id).classList.add('active');
  if(el)el.classList.add('active');
  else{document.querySelectorAll('.nav-item').forEach(n=>{if(n.onclick&&n.onclick.toString().includes("'"+id+"'"))n.classList.add('active');});}
  triggerReveal();
  if(window.innerWidth<768)document.getElementById('sidebar').classList.remove('open');
}

function toggleSidebar(){document.getElementById('sidebar').classList.toggle('open');}

function toggleLang(){
  currentLang=currentLang==='ms'?'en':'ms';
  document.getElementById('langBtn').textContent=currentLang==='ms'?'🌐 EN':'🌐 MS';
  document.querySelectorAll('[data-i18n]').forEach(el=>{
    const key=el.getAttribute('data-i18n');const val=t(key);
    if(val!==key)el.textContent=val;
  });
}

function triggerReveal(){
  setTimeout(()=>{
    document.querySelectorAll('.reveal').forEach(el=>{
      const obs=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add('visible');});},{threshold:0.1});
      obs.observe(el);
    });
  },50);
}

function renderWFB(){
  const now=new Date();
  const bulanInput=document.getElementById('wfbBulan');
  let year=now.getFullYear(),month=now.getMonth();
  if(bulanInput&&bulanInput.value){const parts=bulanInput.value.split('-');year=parseInt(parts[0]);month=parseInt(parts[1])-1;}
  const daysInMonth=new Date(year,month+1,0).getDate();
  const makeHalf=(from,to,label)=>{
    let rows='';
    for(let d=from;d<=Math.min(to,daysInMonth);d++){
      const date=new Date(year,month,d);
      const dayNames=['Ahad','Isn','Sel','Rab','Kha','Jum','Sab'];
      const isWeekend=date.getDay()===0||date.getDay()===6;
      rows+=`<tr style="${isWeekend?'opacity:0.5;':''}"><td>${d} ${dayNames[date.getDay()]}</td><td><input type="time" class="wfb-masuk" data-day="${d}" onchange="checkWFBTime(this,'masuk')"></td><td><input type="time" class="wfb-keluar" data-day="${d}" onchange="checkWFBTime(this,'keluar')"></td><td><input type="time" data-day="${d}"></td><td><input type="time" data-day="${d}"></td><td><input type="text" placeholder=""></td><td><input type="text" placeholder="T/T"></td></tr>`;
    }
    return `<div class="timecard-half"><div class="timecard-header">${label}</div><div style="overflow-x:auto;"><table class="tc-table"><thead><tr><th>TARIKH</th><th>MASUK</th><th>KELUAR</th><th>MASUK 2</th><th>KELUAR 2</th><th>KENYATAAN</th><th>T/T</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
  };
  document.getElementById('wfbGrid').innerHTML=makeHalf(1,15,'BAHAGIAN A: 1 – 15 '+months[month]+' '+year)+makeHalf(16,31,'BAHAGIAN B: 16 – '+daysInMonth+' '+months[month]+' '+year);
}

function checkWFBTime(input,type){
  if(!input.value)return;
  const[h,m]=input.value.split(':').map(Number);
  input.classList.remove('highlight-late','highlight-ot');
  const row=input.closest('tr');row.classList.remove('late','ot');
  if(type==='masuk'){
    if(h*60+m>9*60){input.classList.add('highlight-late');row.classList.add('late');}
    if(h*60+m<7*60){input.classList.add('highlight-ot');row.classList.add('ot');}
  }else if(type==='keluar'){
    if(h*60+m>18*60){input.classList.add('highlight-ot');row.classList.add('ot');}
  }
}

function calcOdo(){
  const a=parseFloat(document.getElementById('tl-odomula').value)||0;
  const b=parseFloat(document.getElementById('tl-odoakhir').value)||0;
  const dist=Math.max(0,b-a);
  document.getElementById('tl-jarak').value=dist;
  document.getElementById('tl-kos').value=(dist*FUEL_RATE/10).toFixed(2);
}
function calcFuelCost(){
  const lit=parseFloat(document.getElementById('tl-liter').value)||0;
  document.getElementById('tl-kos').value=(lit*FUEL_RATE).toFixed(2);
}

function openTravelModal(){document.getElementById('travelModal').classList.add('open');}
function closeModal(id){document.getElementById(id).classList.remove('open');}

function saveTravelLog(){
  const rec={
    tarikh:document.getElementById('tl-tarikh').value,
    masapergi:document.getElementById('tl-masapergi').value,
    masabalik:document.getElementById('tl-masabalik').value,
    pemandu:document.getElementById('tl-pemandu').value,
    tujuan:document.getElementById('tl-tujuan').value,
    pelulus:document.getElementById('tl-pelulus').value,
    pengguna:document.getElementById('tl-pengguna').value||currentUser.name,
    odomula:parseFloat(document.getElementById('tl-odomula').value)||0,
    odoakhir:parseFloat(document.getElementById('tl-odoakhir').value)||0,
    jarak:parseFloat(document.getElementById('tl-jarak').value)||0,
    liter:parseFloat(document.getElementById('tl-liter').value)||0,
    kos:parseFloat(document.getElementById('tl-kos').value)||0,
    resit:document.getElementById('tl-resit').value,
    nota:document.getElementById('tl-nota').value
  };
  travelData.push(rec);renderTravelTable();updateStats();closeModal('travelModal');saveTravelToSupabase(rec).then(ok=>{if(ok)showToast('Rekod disimpan ke Supabase');});syncToGS('upsert_travel',rec);
}

function renderTravelTable(){
  const tbody=document.getElementById('travelBody');
  let totalKM=0,totalKos=0,totalL=0,totalTrips=travelData.length;
  tbody.innerHTML=travelData.map((r,i)=>{
    totalKM+=r.jarak;totalKos+=r.kos;totalL+=r.liter;
    return `<tr><td>${i+1}</td><td>${r.tarikh||'-'}</td><td>${r.masapergi||'-'}</td><td>${r.masabalik||'-'}</td><td>${r.pemandu||'-'}</td><td style="max-width:150px;white-space:normal;">${r.tujuan||'-'}</td><td>${r.pelulus||'-'}</td><td>${r.odomula}</td><td>${r.odoakhir}</td><td><span class="badge badge-blue">${r.jarak} km</span></td><td>${r.liter} L</td><td><span class="badge badge-green">RM ${r.kos.toFixed(2)}</span></td><td>${r.resit||'-'}</td><td>${r.nota||'-'}</td><td><button class="btn btn-danger btn-sm" onclick="deleteTravelRow(${i})">Padam</button></td></tr>`;
  }).join('');
  document.getElementById('tlogFtKM').textContent=totalKM;
  document.getElementById('tlogFtL').textContent=totalL.toFixed(2);
  document.getElementById('tlogFtKos').textContent='RM '+totalKos.toFixed(2);
  document.getElementById('tlogTotalKM').textContent=totalKM;
  document.getElementById('tlogTotalKos').textContent='RM '+totalKos.toFixed(2);
  document.getElementById('tlogTotalTrips').textContent=totalTrips;
  document.getElementById('tlogTotalLiter').textContent=totalL.toFixed(2)+' L';
}
function deleteTravelRow(i){travelData.splice(i,1);renderTravelTable();updateStats();}

function calcEnfTotal(){
  const ids=['enf-rmek','enf-rmkdr','enf-rmpengangkut','enf-rmlain'];
  const total=ids.reduce((s,id)=>s+(parseFloat(document.getElementById(id).value)||0),0);
  document.getElementById('enf-rmnilai').value=total.toFixed(2);
}

function openEnfModal(){
  document.getElementById('enfModal').classList.add('open');
  ['enf-lembu','enf-kerbau','enf-kambing','enf-bebiri','enf-babi','enf-ayam','enf-klembu','enf-kkerbau','enf-kkambing','enf-kbabi','enf-kbabisb','enf-kayam','enf-pitik','enf-payam','enf-pbabi','enf-tin','enf-anjing','enf-kucing','enf-arnab','enf-burung','enf-hamster','enf-jkdr','enf-jpengangkut','enf-rmek','enf-rmkdr','enf-rmpengangkut','enf-rmlain'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='0';});
  document.getElementById('enf-rmnilai').value='0';
}

function saveEnfData(){
  const g=id=>document.getElementById(id).value||'';
  const gn=id=>parseFloat(document.getElementById(id).value)||0;
  const rec={tahun:g('enf-tahun'),bulan:g('enf-bulan'),penguatkuasa:g('enf-penguatkuasa'),kategori:g('enf-kategori'),nopolis:g('enf-nopolis'),tarikh:g('enf-tarikh'),masa:g('enf-masa'),lokasi:g('enf-lokasi'),kesalahan:g('enf-kesalahan'),undang:g('enf-undang'),noip:g('enf-noip'),jenis:g('enf-jenis'),lembu:gn('enf-lembu'),kerbau:gn('enf-kerbau'),kambing:gn('enf-kambing'),bebiri:gn('enf-bebiri'),babi:gn('enf-babi'),ayam:gn('enf-ayam'),klembu:gn('enf-klembu'),kkerbau:gn('enf-kkerbau'),kkambing:gn('enf-kkambing'),kbabi:gn('enf-kbabi'),kbabisb:gn('enf-kbabisb'),kayam:gn('enf-kayam'),pitik:gn('enf-pitik'),payam:gn('enf-payam'),pbabi:gn('enf-pbabi'),tin:gn('enf-tin'),anjing:gn('enf-anjing'),kucing:gn('enf-kucing'),arnab:gn('enf-arnab'),burung:gn('enf-burung'),hamster:gn('enf-hamster'),lain:g('enf-lain'),jkdr:gn('enf-jkdr'),jpengangkut:gn('enf-jpengangkut'),rmek:gn('enf-rmek'),rmkdr:gn('enf-rmkdr'),rmpengangkut:gn('enf-rmpengangkut'),rmlain:gn('enf-rmlain'),rmnilai:gn('enf-rmnilai'),serahan:g('enf-serahan'),catatan:g('enf-catatan')};
  enfData.push(rec);saveEnfToSupabase(rec).then(ok=>{if(ok)showToast('Kes disimpan ke Supabase');});syncToGS('upsert_enforcement',rec);
  const sel=document.getElementById('enfFilterBulan');
  if(rec.bulan&&![...sel.options].find(o=>o.value===rec.bulan)){const o=document.createElement('option');o.value=rec.bulan;o.textContent=rec.bulan;sel.appendChild(o);}
  renderEnfTable(enfData);updateStats();closeModal('enfModal');
}

function renderEnfTable(data){
  const tbody=document.getElementById('enfBody');
  const totals={lembu:0,kerbau:0,kambing:0,bebiri:0,babi:0,ayam:0,klembu:0,kkerbau:0,kkambing:0,kbabi:0,kbabisb:0,kayam:0,pitik:0,payam:0,pbabi:0,tin:0,anjing:0,kucing:0,arnab:0,burung:0,hamster:0,lain:0,jkdr:0,jpengangkut:0,rmek:0,rmkdr:0,rmpengangkut:0,rmlain:0,rmnilai:0};
  tbody.innerHTML=data.map((r,i)=>{
    Object.keys(totals).forEach(k=>{if(typeof r[k]==='number')totals[k]+=r[k];});
    return `<tr><td>${i+1}</td><td>${r.tahun}</td><td>${r.bulan}</td><td>${r.penguatkuasa}</td><td><span class="badge badge-blue">${r.kategori}</span></td><td>${r.nopolis}</td><td>${r.tarikh}</td><td>${r.masa}</td><td style="max-width:120px;white-space:normal;">${r.lokasi}</td><td style="max-width:120px;white-space:normal;">${r.kesalahan}</td><td>${r.undang}</td><td>${r.noip}</td><td>${r.jenis}</td><td>${r.lembu}</td><td>${r.kerbau}</td><td>${r.kambing}</td><td>${r.bebiri}</td><td>${r.babi}</td><td>${r.ayam}</td><td>${r.klembu}</td><td>${r.kkerbau}</td><td>${r.kkambing}</td><td>${r.kbabi}</td><td>${r.kbabisb}</td><td>${r.kayam}</td><td>${r.pitik}</td><td>${r.payam}</td><td>${r.pbabi}</td><td>${r.tin}</td><td>${r.anjing}</td><td>${r.kucing}</td><td>${r.arnab}</td><td>${r.burung}</td><td>${r.hamster}</td><td>${r.lain}</td><td>${r.jkdr}</td><td>${r.jpengangkut}</td><td>RM${r.rmek.toFixed(2)}</td><td>RM${r.rmkdr.toFixed(2)}</td><td>RM${r.rmpengangkut.toFixed(2)}</td><td>RM${r.rmlain.toFixed(2)}</td><td><span class="badge badge-gold">RM${r.rmnilai.toFixed(2)}</span></td><td><span class="badge ${r.serahan==='Mahkamah'?'badge-red':r.serahan==='Dilepaskan'?'badge-green':'badge-blue'}">${r.serahan}</span></td><td>${r.catatan}</td><td><button class="btn btn-danger btn-sm" onclick="deleteEnfRow(${i})">Padam</button></td></tr>`;
  }).join('');
  const keys=['lembu','kerbau','kambing','bebiri','babi','ayam','klembu','kkerbau','kkambing','kbabi','kbabisb','kayam','pitik','payam','pbabi','tin','anjing','kucing','arnab','burung','hamster','lain','jkdr','jpengangkut'];
  keys.forEach(k=>{const el=document.getElementById('e-'+k);if(el)el.textContent=totals[k];});
  ['rmek','rmkdr','rmpengangkut','rmlain','rmnilai'].forEach(k=>{const el=document.getElementById('e-'+k);if(el)el.textContent='RM'+totals[k].toFixed(2);});
}

function filterEnf(){
  const q=document.getElementById('enfSearch').value.toLowerCase();
  const bulan=document.getElementById('enfFilterBulan').value;
  const filtered=enfData.filter(r=>{
    const match=!q||(r.penguatkuasa+r.lokasi+r.kesalahan+r.nopolis+r.kategori).toLowerCase().includes(q);
    const bulanMatch=!bulan||r.bulan===bulan;
    return match&&bulanMatch;
  });
  renderEnfTable(filtered);
}
function deleteEnfRow(i){enfData.splice(i,1);renderEnfTable(enfData);updateStats();}

function updateStats(){
  const totalKes=enfData.length;
  const totalRampasan=enfData.reduce((s,r)=>s+r.rmnilai,0);
  const totalTrips=travelData.length;
  const totalKM=travelData.reduce((s,r)=>s+r.jarak,0);
  document.getElementById('statCases').textContent=totalKes;
  document.getElementById('statRampasan').textContent='RM '+totalRampasan.toFixed(0);
  document.getElementById('statTrips').textContent=totalTrips;
  document.getElementById('statKM').textContent=totalKM+' km';
  document.getElementById('sumTotalKes').textContent=totalKes;
  document.getElementById('sumNilaiRM').textContent='RM '+totalRampasan.toFixed(0);
  document.getElementById('sumPerjalanan').textContent=totalTrips;
  const allFiles=uploadedFiles.minyak.length+uploadedFiles.odo.length+uploadedFiles.kes.length;
  document.getElementById('sumFail').textContent=allFiles;
}

function renderCharts(){
  const chartTypes=[{label:'Lembu',v:Math.floor(Math.random()*20)+5,color:'#6C63FF'},{label:'Kerbau',v:Math.floor(Math.random()*10)+2,color:'#FF6584'},{label:'Kambing',v:Math.floor(Math.random()*15)+3,color:'#43E8D8'},{label:'Ayam',v:Math.floor(Math.random()*30)+10,color:'#FFD700'},{label:'Lain',v:Math.floor(Math.random()*8)+1,color:'#A78BFA'}];
  const maxV=Math.max(...chartTypes.map(c=>c.v));
  const makeChart=id=>{
    const el=document.getElementById(id);if(!el)return;
    el.innerHTML=chartTypes.map(c=>`<div class="chart-bar-wrap"><div class="chart-bar-val">${c.v}</div><div class="chart-bar" style="height:${(c.v/maxV)*140}px;background:${c.color};box-shadow:0 0 10px ${c.color}60;"></div><div class="chart-bar-label">${c.label}</div></div>`).join('');
  };
  makeChart('dashChart');makeChart('summaryChart');
}

function updateAnnDisplay(){
  const el=document.getElementById('annDisplay');if(el)el.textContent=announcement;
  const annText=document.getElementById('annText');if(annText)annText.textContent='📢 '+announcement;
  const currAnn=document.getElementById('currentAnn');if(currAnn)currAnn.textContent=announcement;
}


}







function switchDataTab(tab,el){
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
  if(el)el.classList.add('active');
  ['uploads','summary','export'].forEach(t=>{const el=document.getElementById('dataTab-'+t);if(el)el.style.display=t===tab?'block':'none';});
}

function handleUpload(input,type){
  const files=Array.from(input.files);
  files.forEach(f=>{uploadedFiles[type].push({name:f.name,size:f.size,url:URL.createObjectURL(f),file:f});});
  const listEl=document.getElementById('upload'+type.charAt(0).toUpperCase()+type.slice(1)+'List');
  if(listEl){listEl.innerHTML=uploadedFiles[type].map((f,i)=>`<div style="display:flex;align-items:center;gap:0.5rem;padding:0.35rem 0;border-bottom:1px solid rgba(108,99,255,0.1);"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg><span style="font-family:var(--font-ui);font-size:0.78rem;flex:1;">${f.name}</span><span style="font-family:var(--font-ui);font-size:0.7rem;color:var(--muted);">${(f.size/1024).toFixed(0)}KB</span><a href="${f.url}" target="_blank" style="color:var(--accent);font-size:0.7rem;text-decoration:none;font-family:var(--font-ui);">Lihat</a></div>`).join('');}
  updateStats();
}

function exportWFB(fmt){
  const data=[['Nama',document.getElementById('wfbNama').value||''],['Kem/Jab',document.getElementById('wfbKem').value||''],['Bahagian',document.getElementById('wfbBahagian').value||''],['Bulan',document.getElementById('wfbBulan').value||'']];
  downloadData(data,fmt,'WFB_Timecard');
}

function exportTravel(fmt){downloadData(travelData.map((r,i)=>({BIL:i+1,...r})),fmt,'Log_Perjalanan');}
function exportEnf(fmt){downloadData(enfData.map((r,i)=>({BIL:i+1,...r})),fmt,'Data_Penguatkuasa');}
function exportAll(fmt){
  const all={travel:travelData,enforcement:enfData,files:uploadedFiles};
  downloadData([all],fmt,'JPVS_AllData');
}

function downloadData(data,fmt,filename){
  let content='',mime='text/plain',ext='.txt';
  if(fmt==='csv'||fmt==='excel'){
    if(!data.length){showToast('Tiada data untuk dieksport');return;}
    const keys=Object.keys(Array.isArray(data[0])?{a:1}:data[0]);
    content=Array.isArray(data[0])?data.map(r=>r.map(v=>`"${v}"`).join(',')).join('\n'):[keys.join(','),...data.map(r=>keys.map(k=>`"${r[k]}"`).join(','))].join('\n');
    mime='text/csv';ext='.csv';
  }else if(fmt==='json'){
    content=JSON.stringify(data,null,2);mime='application/json';ext='.json';
  }else{
    content=typeof data==='string'?data:JSON.stringify(data,null,2);
  }
  const blob=new Blob([content],{type:mime});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=filename+ext;a.click();
  showToast(`Eksport ${ext.toUpperCase()} berjaya`);
}

function showToast(msg){
  const t=document.createElement('div');
  t.style.cssText='position:fixed;bottom:2rem;right:2rem;background:var(--card);border:1px solid rgba(108,99,255,0.4);border-radius:12px;padding:0.75rem 1.5rem;font-family:var(--font-ui);font-size:0.85rem;color:var(--text);z-index:9999;box-shadow:0 8px 32px rgba(0,0,0,0.4);animation:sectionReveal 0.4s cubic-bezier(0.16,1,0.3,1);display:flex;align-items:center;gap:0.5rem;';
  t.innerHTML=`<span style="color:var(--accent);">✓</span> ${msg}`;
  document.body.appendChild(t);setTimeout(()=>t.remove(),3000);
}

function toggleProfileMenu(){
  showToast('Profil: '+currentUser.name+' ('+currentUser.role+')');
}

// SAMPLE DATA
function loadSampleData(){
  travelData=[{tarikh:'2025-06-01',masapergi:'08:00',masabalik:'17:00',pemandu:'Ahmad Firdaus',tujuan:'Lawatan premis — Jalan Ampang KL',pelulus:'Pengarah',pengguna:'Ahmad Firdaus',odomula:12500,odoakhir:12648,jarak:148,liter:14.5,kos:29.73,resit:'RCP-2025-001',nota:'Pemeriksaan rutin'},{tarikh:'2025-06-05',masapergi:'09:00',masabalik:'16:00',pemandu:'Mohd Hafiz',tujuan:'Serbuan — Pasar Borong Selayang',pelulus:'Pengarah',pengguna:'Mohd Hafiz',odomula:12648,odoakhir:12780,jarak:132,liter:12.8,kos:26.24,resit:'RCP-2025-002',nota:'Operasi bersepadu'}];
  enfData=[{tahun:2025,bulan:'Jun',penguatkuasa:'Ahmad Firdaus',kategori:'Kesalahan Penyembelihan',nopolis:'P/001/2025',tarikh:'2025-06-01',masa:'14:30',lokasi:'Jalan Ampang, Kuala Lumpur',kesalahan:'Penyembelihan tanpa lesen',undang:'Akta 309 S.8(1)',noip:'IP/001/2025',jenis:'Haiwan hidup',lembu:3,kerbau:0,kambing:5,bebiri:0,babi:0,ayam:0,klembu:0,kkerbau:0,kkambing:0,kbabi:0,kbabisb:0,kayam:0,pitik:0,payam:0,pbabi:0,tin:0,anjing:0,kucing:0,arnab:0,burung:0,hamster:0,lain:'0',jkdr:1,jpengangkut:1,rmek:9000,rmkdr:45000,rmpengangkut:80000,rmlain:0,rmnilai:134000,serahan:'Mahkamah',catatan:'Suspek ditahan'},{tahun:2025,bulan:'Jun',penguatkuasa:'Mohd Hafiz',kategori:'Kesalahan Pengangkutan',nopolis:'P/002/2025',tarikh:'2025-06-05',masa:'10:15',lokasi:'Pasar Borong Selayang, Selangor',kesalahan:'Pengangkutan haiwan tanpa permit',undang:'Akta 309 S.15(2)',noip:'IP/002/2025',jenis:'Karkas',lembu:0,kerbau:0,kambing:0,bebiri:0,babi:0,ayam:250,klembu:0,kkerbau:0,kkambing:0,kbabi:0,kbabisb:0,kayam:250,pitik:0,payam:50,pbabi:0,tin:0,anjing:0,kucing:0,arnab:0,burung:0,hamster:0,lain:'0',jkdr:0,jpengangkut:2,rmek:7500,rmkdr:0,rmpengangkut:160000,rmlain:500,rmnilai:168000,serahan:'Kompaun',catatan:'Kenderaan rampas'}];
  renderTravelTable();renderEnfTable(enfData);updateStats();
  const bulanSel=document.getElementById('enfFilterBulan');
  ['Jun'].forEach(b=>{if(![...bulanSel.options].find(o=>o.value===b)){const o=document.createElement('option');o.value=b;o.textContent=b;bulanSel.appendChild(o);}});
}

// INIT
initParticles();
setInterval(updateClock,1000);
updateClock();

// ============================================================
// SUPABASE AUTH
// ============================================================

async function fetchUserRole(userId, accessToken) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(
        SUPABASE_URL + '/rest/v1/profiles?id=eq.' + encodeURIComponent(userId) + '&select=role',
        { headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': 'Bearer ' + accessToken, 'Accept': 'application/json' } }
      );
      if (!res.ok) { await new Promise(r => setTimeout(r, 500)); continue; }
      const rows = await res.json();
      if (rows && rows[0] && rows[0].role) return rows[0].role;
      await new Promise(r => setTimeout(r, 600));
    } catch(e) { await new Promise(r => setTimeout(r, 500)); }
  }
  return null;
}

async function upsertUser(user, accessToken) {
  try {
    await fetch(SUPABASE_URL + '/rest/v1/profiles', {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY, 'Authorization': 'Bearer ' + accessToken,
        'Content-Type': 'application/json', 'Prefer': 'resolution=merge-duplicates,return=minimal'
      },
      body: JSON.stringify({
        id: user.id, email: user.email,
        full_name: (user.user_metadata && (user.user_metadata.full_name || user.user_metadata.name)) || ''
      })
    });
  } catch(e) { console.warn('upsertUser error:', e); }
}

async function doLogin() {
  if (window.location.protocol === 'file:') {
    showToast('Sila buka melalui pelayan web (http://localhost)');
    return;
  }
  const btn = document.querySelector('.btn-google');
  if (btn) { btn.disabled = true; btn.textContent = 'Menghubungi...'; }
  try {
    const { error } = await supabaseClient.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.href }
    });
    if (error) throw error;
  } catch(e) {
    showToast('Ralat log masuk: ' + e.message);
    if (btn) { btn.disabled = false; btn.textContent = 'Log Masuk dengan Google'; }
  }
}

async function signOut() {
  try { if (supabaseClient) await supabaseClient.auth.signOut(); } catch(e) {}
  currentUser = null;
  document.getElementById('appShell').style.display = 'none';
  const ls = document.getElementById('loginScreen');
  ls.style.display = 'flex'; ls.style.opacity = '1';
  const lf = document.querySelector('.login-footer');
  if (lf) lf.innerHTML = 'Sistem ini dilindungi. Akses terhad kepada kakitangan yang diberi kuasa sahaja.<br>Jabatan Perkhidmatan Veterinar Malaysia &copy; 2025';
  showToast('Log keluar berjaya');
}

// ============================================================
// ADMIN PANEL - REAL SUPABASE DATA
// ============================================================

async function renderAdminPanel() {
  const colors = ['#6C63FF','#FF6584','#43E8D8','#FFD700'];
  const userListEl  = document.getElementById('userListAdmin');
  const adminListEl = document.getElementById('superAdminList');
  if (userListEl)  userListEl.innerHTML  = '<div style="color:var(--muted);padding:1rem;font-family:var(--font-ui);">Memuatkan...</div>';
  if (adminListEl) adminListEl.innerHTML = '<div style="color:var(--muted);padding:1rem;font-family:var(--font-ui);">Memuatkan...</div>';

  let profiles = [];
  try {
    const token = (currentUser && currentUser.accessToken) || SUPABASE_ANON_KEY;
    const res = await fetch(
      SUPABASE_URL + '/rest/v1/profiles?select=id,full_name,email,role&order=created_at.asc',
      { headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': 'Bearer ' + token, 'Accept': 'application/json' } }
    );
    if (res.ok) profiles = await res.json();
    else showToast('Gagal muatkan senarai pengguna');
  } catch(e) { showToast('Ralat sambungan Supabase'); }

  const isSuperAdmin = currentUser && currentUser.role === 'superadmin';
  const makeInitials = name => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    return (parts[0][0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
  };
  const makeUserRow = (u, i) => {
    const initials = makeInitials(u.full_name || u.email);
    const bg = 'linear-gradient(135deg,' + colors[i%colors.length] + ',' + colors[(i+1)%colors.length] + ')';
    const isMe = currentUser && currentUser.id === u.id;
    const safeN = (u.full_name||u.email||'').replace(/'/g, "\\'");
    const deleteBtn = isSuperAdmin && !isMe
      ? '<button class="btn btn-danger btn-sm" onclick="removeUser(\'' + u.id + '\',\'' + safeN + '\')">Buang</button>'
      : (isMe ? '<span style="font-size:0.75rem;color:var(--accent);font-family:var(--font-ui);">Anda</span>' : '');
    return '<div class="user-row"><div class="user-avatar-sm" style="background:' + bg + ';">' + initials + '</div><div class="user-info"><div class="user-info-name">' + (u.full_name||'—') + '</div><div class="user-info-email">' + (u.email||'') + '</div></div>' + deleteBtn + '</div>';
  };

  const adminUsers  = profiles.filter(u => u.role === 'superadmin');
  const normalUsers = profiles.filter(u => u.role !== 'superadmin');

  if (userListEl) userListEl.innerHTML = normalUsers.length
    ? normalUsers.map((u,i) => makeUserRow(u,i)).join('')
    : '<div style="color:var(--muted);padding:0.75rem;font-family:var(--font-ui);font-size:0.85rem;">Tiada pengguna biasa.</div>';
  if (adminListEl) adminListEl.innerHTML = adminUsers.length
    ? adminUsers.map((u,i) => makeUserRow(u,i)).join('')
    : '<div style="color:var(--muted);padding:0.75rem;font-family:var(--font-ui);font-size:0.85rem;">Tiada super admin.</div>';
}

function openAddUserModal() {
  showToast('Pengguna baru perlu daftar melalui Google OAuth — mereka akan muncul di sini selepas log masuk pertama.');
}

function openAddAdminModal() {
  if (!currentUser || currentUser.role !== 'superadmin') { showToast('Hanya Super Admin boleh menambah admin.'); return; }
  const email = prompt('Masukkan emel pengguna untuk dijadikan Super Admin:');
  if (!email || !email.trim()) return;
  promoteToSuperAdmin(email.trim());
}

async function promoteToSuperAdmin(email) {
  try {
    const token = (currentUser && currentUser.accessToken) || SUPABASE_ANON_KEY;
    const res = await fetch(SUPABASE_URL + '/rest/v1/profiles?email=eq.' + encodeURIComponent(email), {
      method: 'PATCH',
      headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
      body: JSON.stringify({ role: 'superadmin' })
    });
    if (res.ok) { showToast(email + ' telah dijadikan Super Admin'); renderAdminPanel(); }
    else showToast('Gagal promote: ' + await res.text());
  } catch(e) { showToast('Ralat: ' + e.message); }
}

async function removeUser(userId, userName) {
  if (!currentUser || currentUser.role !== 'superadmin') { showToast('Hanya Super Admin boleh membuang pengguna.'); return; }
  if (!confirm('Buang pengguna "' + userName + '"?\n\nIni akan memadam profil mereka dari sistem.')) return;
  try {
    const token = (currentUser && currentUser.accessToken) || SUPABASE_ANON_KEY;
    const res = await fetch(SUPABASE_URL + '/rest/v1/profiles?id=eq.' + encodeURIComponent(userId), {
      method: 'DELETE',
      headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': 'Bearer ' + token, 'Prefer': 'return=minimal' }
    });
    if (res.ok) { showToast('Pengguna "' + userName + '" telah dibuang'); renderAdminPanel(); }
    else showToast('Gagal buang pengguna: ' + await res.text());
  } catch(e) { showToast('Ralat: ' + e.message); }
}

async function saveAnnouncement() {
  const val = document.getElementById('newAnnText').value.trim();
  if (!val) return;
  announcement = val;
  updateAnnDisplay();
  document.getElementById('newAnnText').value = '';
  showToast('Pengumuman disimpan');
  if (currentUser && currentUser.role === 'superadmin') {
    try {
      const token = currentUser.accessToken || SUPABASE_ANON_KEY;
      await fetch(SUPABASE_URL + '/rest/v1/announcements', {
        method: 'POST',
        headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
        body: JSON.stringify({ message: val, active: true, created_by: currentUser.id })
      });
    } catch(e) {}
  }
}

// ============================================================
// SUPABASE DATA FUNCTIONS
// ============================================================

async function loadEnfDataFromSupabase() {
  if (!currentUser) return;
  try {
    const token = currentUser.accessToken || SUPABASE_ANON_KEY;
    const res = await fetch(SUPABASE_URL + '/rest/v1/enforcement_cases?select=*&order=created_at.desc&limit=500', {
      headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': 'Bearer ' + token }
    });
    if (!res.ok) return;
    const rows = await res.json();
    enfData = rows.map(r => ({
      tahun: r.tahun, bulan: r.bulan, penguatkuasa: r.penguatkuasa||'', kategori: r.kategori||'',
      nopolis: r.no_polis||'', tarikh: r.tarikh||'', masa: r.masa||'', lokasi: r.lokasi||'',
      kesalahan: r.kesalahan||'', undang: r.undang_undang||'', noip: r.no_ip||'', jenis: r.jenis_rampasan||'',
      lembu: r.lembu||0, kerbau: r.kerbau||0, kambing: r.kambing||0, bebiri: r.bebiri||0,
      babi: r.babi||0, ayam: r.ayam||0, klembu: r.k_lembu||0, kkerbau: r.k_kerbau||0,
      kkambing: r.k_kambing||0, kbabi: r.k_babi||0, kbabisb: r.k_babi_sb||0, kayam: r.k_ayam||0,
      pitik: r.pitik||0, payam: r.p_ayam||0, pbabi: r.p_babi||0, tin: r.tin||0,
      anjing: r.anjing||0, kucing: r.kucing||0, arnab: r.arnab||0, burung: r.burung||0,
      hamster: r.hamster||0, lain: r.lain_lain||'0',
      jkdr: r.jml_kenderaan||0, jpengangkut: r.jml_pengangkut||0,
      rmek: r.rm_ek||0, rmkdr: r.rm_kdr||0, rmpengangkut: r.rm_pengangkut||0,
      rmlain: r.rm_lain||0, rmnilai: r.rm_nilai_total||0,
      serahan: r.serahan||'', catatan: r.catatan||'', _id: r.id
    }));
    renderEnfTable(enfData);
    updateStats();
  } catch(e) { console.warn('loadEnfData error:', e); }
}

async function loadTravelDataFromSupabase() {
  if (!currentUser) return;
  try {
    const token = currentUser.accessToken || SUPABASE_ANON_KEY;
    const res = await fetch(SUPABASE_URL + '/rest/v1/travel_logs?select=*&order=created_at.desc&limit=500', {
      headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': 'Bearer ' + token }
    });
    if (!res.ok) return;
    const rows = await res.json();
    travelData = rows.map(r => ({
      tarikh: r.tarikh||'', masapergi: r.masa_pergi||'', masabalik: r.masa_balik||'',
      pemandu: r.pemandu||'', tujuan: r.tujuan||'', pelulus: r.pelulus||'',
      pengguna: r.pengguna||'', odomula: r.odometer_mula||0, odoakhir: r.odometer_akhir||0,
      jarak: r.jarak_km||0, liter: r.liter||0, kos: r.kos_rm||0,
      resit: r.no_resit||'', nota: r.nota||'', _id: r.id
    }));
    renderTravelTable();
    updateStats();
  } catch(e) { console.warn('loadTravelData error:', e); }
}

async function saveEnfToSupabase(rec) {
  if (!currentUser) return false;
  try {
    const token = currentUser.accessToken || SUPABASE_ANON_KEY;
    const res = await fetch(SUPABASE_URL + '/rest/v1/enforcement_cases', {
      method: 'POST',
      headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
      body: JSON.stringify({
        user_id: currentUser.id, nama_pengguna: currentUser.name,
        tahun: parseInt(rec.tahun)||new Date().getFullYear(), bulan: rec.bulan,
        penguatkuasa: rec.penguatkuasa, kategori: rec.kategori, no_polis: rec.nopolis,
        tarikh: rec.tarikh||null, masa: rec.masa||null, lokasi: rec.lokasi,
        kesalahan: rec.kesalahan, undang_undang: rec.undang, no_ip: rec.noip,
        jenis_rampasan: rec.jenis,
        lembu: rec.lembu, kerbau: rec.kerbau, kambing: rec.kambing, bebiri: rec.bebiri,
        babi: rec.babi, ayam: rec.ayam, k_lembu: rec.klembu, k_kerbau: rec.kkerbau,
        k_kambing: rec.kkambing, k_babi: rec.kbabi, k_babi_sb: rec.kbabisb, k_ayam: rec.kayam,
        pitik: rec.pitik, p_ayam: rec.payam, p_babi: rec.pbabi, tin: rec.tin,
        anjing: rec.anjing, kucing: rec.kucing, arnab: rec.arnab, burung: rec.burung,
        hamster: rec.hamster, lain_lain: rec.lain,
        jml_kenderaan: rec.jkdr, jml_pengangkut: rec.jpengangkut,
        rm_ek: rec.rmek, rm_kdr: rec.rmkdr, rm_pengangkut: rec.rmpengangkut, rm_lain: rec.rmlain,
        serahan: rec.serahan, catatan: rec.catatan
      })
    });
    return res.ok;
  } catch(e) { return false; }
}

async function saveTravelToSupabase(rec) {
  if (!currentUser) return false;
  try {
    const token = currentUser.accessToken || SUPABASE_ANON_KEY;
    const res = await fetch(SUPABASE_URL + '/rest/v1/travel_logs', {
      method: 'POST',
      headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
      body: JSON.stringify({
        user_id: currentUser.id, nama_pengguna: currentUser.name,
        tarikh: rec.tarikh||null, masa_pergi: rec.masapergi||null, masa_balik: rec.masabalik||null,
        pemandu: rec.pemandu, tujuan: rec.tujuan, pelulus: rec.pelulus, pengguna: rec.pengguna,
        odometer_mula: rec.odomula, odometer_akhir: rec.odoakhir,
        liter: rec.liter, kos_rm: rec.kos, no_resit: rec.resit, nota: rec.nota
      })
    });
    return res.ok;
  } catch(e) { return false; }
}

// ============================================================
// BASEROW STUBS
// ============================================================
async function initBaserowSync() { showToast('Baserow tidak dikonfigurasikan.'); }
function startBaserowRealtimeListener() {}
async function addBaserowRow() {}
async function updateBaserowRow() {}
async function deleteBaserowRow() {}
function renderBaserowTable() {
  const c = document.getElementById('baserowTableContainer');
  if (c) c.innerHTML = '<div style="text-align:center;color:var(--muted);padding:2rem;font-family:var(--font-ui);">Baserow tidak dikonfigurasikan.</div>';
}

// ============================================================
// SUPABASE CLIENT + SESSION HANDLING
// ============================================================

let supabaseClient = null;

async function initSupabase() {
  try {
    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) await handleSession(session);
    supabaseClient.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) await handleSession(session);
      else if (event === 'SIGNED_OUT') signOut();
    });
  } catch(e) { console.warn('Supabase init error:', e); }
}

async function handleSession(session) {
  const user = session.user;
  const role = await fetchUserRole(user.id, session.access_token);
  await upsertUser(user, session.access_token);
  const name = (user.user_metadata && (user.user_metadata.full_name || user.user_metadata.name)) || user.email.split('@')[0];
  currentUser = {
    id: user.id, name, email: user.email,
    role: role || 'user',
    initials: name[0].toUpperCase(),
    accessToken: session.access_token
  };
  showApp();
}

function showApp() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('appShell').style.display = 'block';
  isLoggedIn = true;
  const avatarEl = document.getElementById('userAvatar');
  const nameEl   = document.getElementById('userName');
  const roleEl   = document.getElementById('userRoleDisplay');
  if (avatarEl) avatarEl.textContent = currentUser.initials;
  if (nameEl)   nameEl.textContent   = currentUser.name.split(' ')[0];
  if (roleEl)   roleEl.textContent   = currentUser.role === 'superadmin' ? 'Super Admin' : 'Pegawai Penguatkuasa';
  const adminNav = document.getElementById('adminNavItem');
  if (adminNav && currentUser.role !== 'superadmin') adminNav.style.display = 'none';
  renderWFB();
  renderAdminPanel();
  renderCharts();
  updateAnnDisplay();
  updateStats();
  triggerReveal();
  loadEnfDataFromSupabase();
  loadTravelDataFromSupabase();
  loadAnnouncementFromSupabase();
}

async function loadAnnouncementFromSupabase() {
  try {
    const res = await fetch(SUPABASE_URL + '/rest/v1/announcements?active=eq.true&order=created_at.desc&limit=1', {
      headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': 'Bearer ' + SUPABASE_ANON_KEY }
    });
    if (res.ok) {
      const rows = await res.json();
      if (rows && rows[0]) { announcement = rows[0].message; updateAnnDisplay(); }
    }
  } catch(e) {}
}

// ============================================================
// INIT
// ============================================================
initParticles();
setInterval(updateClock, 1000);
updateClock();
initSupabase();
