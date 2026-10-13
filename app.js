const SPRITE_URL = 'https://mogmog123456-glitch.github.io/butukan/karintou.png';
const SPRITE_W = 256;
const SPRITE_H = 256;
const SPRITE_COLS = 4;
// 各レベルのスプライトシート行インデックス (0始まり)
const KARIN_SPRITE_ROW = {1:0, 2:1, 3:2, 4:3, 5:4, 6:5};

const KARIN_LEVELS = [
  { lv:1, min:0,   max:49,  name:"こねこのかりんとう",     serif:"にゃ...zzz" },
  { lv:2, min:50,  max:99,  name:"めざめたかりんとう",     serif:"べんきょうするにゃ！" },
  { lv:3, min:100, max:199, name:"けんしゅうのかりんとう", serif:"もっとおぼえるにゃ〜" },
  { lv:4, min:200, max:299, name:"かんごしかりんとう",     serif:"しっかりやるにゃ！" },
  { lv:5, min:300, max:399, name:"チーフかりんとう",       serif:"まかせるにゃ！" },
  { lv:6, min:400, max:9999,name:"でんせつのかりんとう",   serif:"ぜんもんせいは！にゃ！" },
];
const SUBJECT_NAMES = {
  'A':'動物福祉・倫理',
  'B':'解剖・生理',
  'C':'繁殖・行動・比較',
  'D':'栄養・食餌',
  'E':'病理・薬理',
  'F':'感染症・公衆衛生',
  'G':'臨床看護・検査',
  'H':'法律・飼養管理'
};
// 試験の「回」。問題データは exam_data.js の window.EXAM_BANK（公式サイト公開PDFより作成）
const ROUNDS=[
  {id:'y1',type:'yobi',no:1,name:'第1回予備試験',date:'2022年11月6日'},
  {id:'y2',type:'yobi',no:2,name:'第2回予備試験',date:'2023年10月1日'},
  {id:'y3',type:'yobi',no:3,name:'第3回予備試験',date:'2024年10月6日'},
  {id:'y4',type:'yobi',no:4,name:'第4回予備試験',date:'2025年10月5日'},
  {id:'k1',type:'kokka',no:1,name:'第1回国家試験',date:'2023年2月19日'},
  {id:'k2',type:'kokka',no:2,name:'第2回国家試験',date:'2024年2月18日'},
  {id:'k3',type:'kokka',no:3,name:'第3回国家試験',date:'2025年2月16日'},
  {id:'k4',type:'kokka',no:4,name:'第4回国家試験',date:'2026年2月15日'},
];
// 区分（必須 / 実地 / 一般）と本番の問題数・制限時間（分）
const SEC_NAMES={hissu:'必須問題',jitti:'実地問題',ippan:'一般問題'};
const SEC_SHORT={hissu:'必須',jitti:'実地',ippan:'一般'};
const SEC_INFO={hissu:{n:50,min:50},jitti:{n:50,min:100},ippan:{n:100,min:150}};
const SEC_ORDER=['hissu','jitti','ippan'];

// EXAMS_INFO = 問題セット（回 × 区分）。id は 必須='y1', 実地='y1j', 一般='k1i'
const EXAMS_INFO=[];
const EXAM_DATA={};
const BANK=window.EXAM_BANK||{};
ROUNDS.forEach(r=>{
  SEC_ORDER.forEach(sec=>{
    const qs=(BANK[r.id]||{})[sec];
    if(!qs) return;
    const id=sec==='hissu'?r.id:r.id+sec[0];
    EXAMS_INFO.push({id,rid:r.id,type:r.type,no:r.no,sec,name:`${r.name} ${SEC_NAMES[sec]}`,short:`第${r.no}回 ${SEC_SHORT[sec]}`,date:r.date,...SEC_INFO[sec]});
    EXAM_DATA[id]=qs;
  });
});
// 図のみで選択肢が成立する問題（図は公式非公開）は出題対象から外す
const ALL_Q=[];
EXAMS_INFO.forEach(e=>EXAM_DATA[e.id].forEach(q=>{ if(!q.figsel) ALL_Q.push({...q,eid:e.id}); }));
const FIGSEL_COUNT=EXAMS_INFO.reduce((n,e)=>n+EXAM_DATA[e.id].filter(q=>q.figsel).length,0);

// 正誤判定（複数正答 am / 全員正解 all に対応）
function isCorrect(q,c){ return !!q.all || c===q.a || (Array.isArray(q.am)&&q.am.includes(c)); }
function ansLabel(q){
  const circles=['①','②','③','④','⑤'];
  if(q.all) return '全員正解（公式発表）';
  const idx=Array.isArray(q.am)?q.am:[q.a];
  return idx.map(i=>`${circles[i-1]}　${q.o[i-1]||''}`).join(' ／ ');
}
function qKey(q){ return q.eid+'-'+q.no; }
function qLabel(q){
  if(q.eid==='yoso') return (q.src&&q.src.label?q.src.label:'予想問題集')+`　問${q.no}`;
  const e=ei(q.eid);
  return (e?e.name:q.eid)+`　問${q.no}`;
}
function todayStr(){ const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
function addDays(s,n){ const d=new Date(s+'T00:00:00'); d.setDate(d.getDate()+n); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }

// ===== 予想問題集 =====
let YOSO_Q=[];
let yosoLoaded=false;
async function loadYosoData(){
  if(yosoLoaded) return;
  try{
    const r=await fetch('mondai_data.json');
    if(!r.ok){ console.error('mondai_data.json fetch failed:',r.status); return; }
    const data=await r.json();
    ['hissu','jitchi','ippan'].forEach(cat=>{
      (data[cat]||[]).forEach(q=>{
        YOSO_Q.push({...q, eid:'yoso', ycat:cat});
      });
    });
    yosoLoaded=true;
    const el=document.querySelector('#ctab-yo .ct-sub');
    if(el) el.textContent=YOSO_Q.length+'問';
  }catch(e){ console.error('loadYosoData error:',e); }
}

// ===== STORAGE =====
const STORE_KEY = 'aigan_karintou';
let weak = new Set(), mastered = new Set(), history = [];
let bookmarks = new Set();   // ブックマークした問題キー
let qstat = {};              // 問題ごとの履歴 {key:{n,ok,box,last,due}}
let days = [];               // 学習した日 (YYYY-MM-DD)
let subjectStats = {};
let totalCorrect = 0; // 累計正解数（かりんとうレベル用）
let streak = 0;       // 今日の連続正解数
let optShuffle = true; // 選択肢をシャッフルして出題するか
let lastPlayDate = ''; // 最終プレイ日

async function loadStore() {
  try {
    const r = localStorage.getItem(STORE_KEY);
    if (r) {
      const d = JSON.parse(r);
      weak         = new Set(d.weak     || []);
      mastered     = new Set(d.mastered || []);
      bookmarks    = new Set(d.bookmarks|| []);
      qstat        = d.qstat || {};
      days         = d.days || [];
      history      = d.history || [];
      subjectStats = d.subjectStats || {};
      totalCorrect = d.totalCorrect || 0;
      streak       = d.streak || 0;
      if (typeof d.optShuffle === 'boolean') optShuffle = d.optShuffle;
      lastPlayDate = d.lastPlayDate || '';
    }
  } catch(e) {}
  // 日付が変わったら「今日の連続正解」はリセット
  if (lastPlayDate && lastPlayDate !== todayStr()) streak = 0;
  Object.keys(SUBJECT_NAMES).forEach(k => {
    if (!subjectStats[k]) subjectStats[k] = { ok:0, total:0 };
  });
}

async function saveStore() {
  try {
    if (history.length > 200) history = history.slice(-200);
    localStorage.setItem(STORE_KEY, JSON.stringify({
      weak:[...weak], mastered:[...mastered], bookmarks:[...bookmarks], qstat, days,
      history, subjectStats, totalCorrect, streak, lastPlayDate, optShuffle
    }));
  } catch(e) {}
}

function getTag(q) { return q.t || 'G'; }

// 間隔反復: 正解するほど次回復習までの間隔が伸びる（Leitner方式）
const SR_INTERVALS = [1, 2, 4, 7, 15, 30];
function recordAnswer(q, correct) {
  const tag = getTag(q);
  if (!subjectStats[tag]) subjectStats[tag] = {ok:0,total:0};
  subjectStats[tag].total++;
  const today = todayStr();
  if (correct) {
    subjectStats[tag].ok++;
    totalCorrect++;
    streak++;
  } else {
    streak = 0;
  }
  const key = qKey(q);
  const s = qstat[key] || { n:0, ok:0, box:0 };
  s.n++;
  if (correct) { s.ok++; s.box = Math.min(s.box + 1, SR_INTERVALS.length - 1); }
  else s.box = 0;
  s.last = today;
  s.due = addDays(today, SR_INTERVALS[s.box]);
  qstat[key] = s;
  lastPlayDate = today;
  if (!days.includes(today)) { days.push(today); if (days.length > 400) days = days.slice(-400); }
}

// 連続学習日数（今日 or 昨日から遡って連続している日数）
function dayStreak() {
  if (!days.length) return 0;
  const set = new Set(days);
  let d = todayStr();
  if (!set.has(d)) { d = addDays(d, -1); if (!set.has(d)) return 0; }
  let n = 0;
  while (set.has(d)) { n++; d = addDays(d, -1); }
  return n;
}

// 今日の復習対象: 期限が来た問題 + 要復習リスト
function reviewPool() {
  const today = todayStr();
  const all = [...ALL_Q, ...YOSO_Q];
  const due = new Set(Object.keys(qstat).filter(k => qstat[k].due && qstat[k].due <= today));
  return all.filter(q => { const k = qKey(q); return due.has(k) || weak.has(k); });
}

function toggleBookmark(q) {
  const k = qKey(q);
  if (bookmarks.has(k)) bookmarks.delete(k); else bookmarks.add(k);
  saveStore();
  return bookmarks.has(k);
}
function bmIcon(on) {
  return on
    ? '<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.5"><path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z"/></svg>'
    : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z"/></svg>';
}
function renderBmBtn(id, q) {
  const el = document.getElementById(id);
  if (!el || !q) return;
  const on = bookmarks.has(qKey(q));
  el.className = 'bm-btn' + (on ? ' on' : '');
  el.innerHTML = bmIcon(on);
  el.onclick = (ev) => { ev.stopPropagation(); const now = toggleBookmark(q); el.className = 'bm-btn' + (now ? ' on' : ''); el.innerHTML = bmIcon(now); };
}

// ===== かりんとう =====
// スプライトシート画像を一度だけロード
const _spriteImg = new Image();
_spriteImg.src = SPRITE_URL;
_spriteImg.crossOrigin = 'anonymous';

// アニメーションコマ順序（かわいく往復歩行）
const ANIM_SEQ = [0, 1, 0, 3]; // 正面→歩き左→正面→歩き右
const ANIM_INTERVAL = 1800; // ms per frame（ゆっくりめ）

let _animStep = 0;
let _animTimer = null;
let _animRow = 0;
let _animCanvas = null;

function drawSprite(canvas, row, frame) {
  if (!canvas || !_spriteImg.complete || !_spriteImg.naturalWidth) return;
  const dpr = window.devicePixelRatio || 1;
  const cssW = canvas.offsetWidth  || parseInt(canvas.style.width)  || canvas.width;
  const cssH = canvas.offsetHeight || parseInt(canvas.style.height) || canvas.height;
  canvas.width  = cssW * dpr;
  canvas.height = cssH * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, cssW, cssH);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  const sx = frame * SPRITE_W;
  const sy = row   * SPRITE_H;
  ctx.drawImage(_spriteImg, sx, sy, SPRITE_W, SPRITE_H, 0, 0, cssW, cssH);
}

function startAnim(canvas, row) {
  stopAnim();
  _animRow = row;
  _animStep = 0;
  _animCanvas = canvas;
  drawSprite(canvas, row, ANIM_SEQ[0]);
  _animTimer = setInterval(() => {
    _animStep = (_animStep + 1) % ANIM_SEQ.length;
    drawSprite(_animCanvas, _animRow, ANIM_SEQ[_animStep]);
  }, ANIM_INTERVAL);
}

function stopAnim() {
  if (_animTimer) { clearInterval(_animTimer); _animTimer = null; }
}

function getKarinLevel() {
  for (let i = KARIN_LEVELS.length-1; i >= 0; i--) {
    if (totalCorrect >= KARIN_LEVELS[i].min) return KARIN_LEVELS[i];
  }
  return KARIN_LEVELS[0];
}

function getNextLevel() {
  const cur = getKarinLevel();
  const idx = KARIN_LEVELS.findIndex(l => l.lv === cur.lv);
  return idx < KARIN_LEVELS.length-1 ? KARIN_LEVELS[idx+1] : null;
}

function renderKarin() {
  const lv   = getKarinLevel();
  const next = getNextLevel();
  const canvas = document.getElementById('karin-img');
  const name   = document.getElementById('karin-name');
  const serif  = document.getElementById('karin-serif');
  const prog   = document.getElementById('karin-prog');
  const progTxt= document.getElementById('karin-prog-txt');

  const row = KARIN_SPRITE_ROW[lv.lv] || 0;
  // スプライトがロード済みなら即描画、未ロードならonloadで描画
  if (_spriteImg.complete && _spriteImg.naturalWidth > 0) {
    startAnim(canvas, row);
  } else {
    _spriteImg.onload = () => startAnim(canvas, row);
  }

  if (name) name.textContent = lv.name;
  const serifs = [
    lv.serif,
    '今日も一問解くにゃ',
    'がんばるにゃ〜',
    `${totalCorrect}もん正解したにゃ！`,
    streak > 3 ? `${streak}連続正解にゃ！` : 'まちがいは復習にゃ',
  ];
  if (serif) serif.textContent = serifs[Math.floor(Math.random()*serifs.length)];

  if (next && prog) {
    const range = next.min - lv.min;
    const done  = totalCorrect - lv.min;
    const pct   = Math.min(100, Math.round(done/range*100));
    prog.style.width = pct + '%';
    if (progTxt) progTxt.textContent = `次のレベルまで ${next.min - totalCorrect}問`;
  } else if (prog) {
    prog.style.width = '100%';
    if (progTxt) progTxt.textContent = '全レベル制覇！';
  }
}

let prevLevel = 1;
function checkLevelUp() {
  const cur = getKarinLevel().lv;
  if (cur > prevLevel) {
    prevLevel = cur;
    showLevelUp(getKarinLevel());
  }
}

function showLevelUp(lv) {
  const overlay = document.getElementById('levelup-overlay');
  if (!overlay) return;
  const luCanvas = document.getElementById('lu-img');
  const row = KARIN_SPRITE_ROW[lv.lv] || 0;
  // レベルアップ時は特定コマ（正面・コマ0）を静止表示
  if (_spriteImg.complete) {
    drawSprite(luCanvas, row, 0);
  } else {
    _spriteImg.onload = () => drawSprite(luCanvas, row, 0);
  }
  document.getElementById('lu-name').textContent  = lv.name + ' になったにゃ！';
  document.getElementById('lu-serif').textContent = lv.serif;
  overlay.style.display = 'flex';
  startParticles();
  setTimeout(() => { overlay.style.display='none'; stopParticles(); }, 3500);
}

// ===== STATE =====
let curCat = 'yobi';
let curSubject = 'ALL';
let qzPool=[], qzIdx=0, qzOk=0, qzNg=0, qzMode='quiz';
let exId='', exPool=[], exIdx=0, exAns=[], exTimer=null, exSec=3000, retryEid='';
let flPool=[], flIdx=0;

// ===== HELPERS =====
const shuf = a => {
  const b=[...a];
  for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]];}
  return b;
};
const ei   = id => EXAMS_INFO.find(e=>e.id===id);
const tCls = id => id.startsWith('y')?'yobi':'kokka';

// ===== NAV =====
let lastScr = 's-home';
const BACK_MAP = {
  's-quiz':'s-qsel','s-exam':'s-esel','s-flash':'s-fsel',
  's-result':'s-home','s-qsel':'s-home','s-esel':'s-home',
  's-fsel':'s-home','s-rsel':'s-home','s-graph':'s-home','s-book':'s-home',
  's-tread':'s-book'
};
const NO_NAV = ['s-quiz','s-exam','s-result'];
const BN_MAP = {
  's-home':'bn-home','s-rsel':'bn-rand','s-quiz':'bn-rand',
  's-esel':'bn-exam','s-exam':'bn-exam',
  's-fsel':'bn-flash','s-flash':'bn-flash',
  's-graph':'bn-graph','s-book':'bn-book','s-tread':'bn-book'
};

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('on'));
  document.getElementById(id).classList.add('on');
  document.getElementById('back-btn').style.display = id==='s-home'?'none':'';
  document.querySelector('.bnav').style.display = NO_NAV.includes(id)?'none':'flex';
  document.querySelectorAll('.bn').forEach(b=>b.classList.remove('on'));
  if(BN_MAP[id]) document.getElementById(BN_MAP[id])?.classList.add('on');
  lastScr=id;
  window.scrollTo(0,0);
  if(id==='s-graph') renderGraph();
  if(id==='s-home') renderKarin();
  if(id==='s-book') renderBookContent();
}

function goTo(id){showScreen(id);}
function goBack(){
  if(exTimer){clearInterval(exTimer);exTimer=null;}
  let dest=BACK_MAP[lastScr]||'s-home';
  if(lastScr==='s-quiz') dest=qzMode==='random'?'s-rsel':qzMode==='yoso'?'s-ysel':qzMode==='review'?'s-home':'s-qsel';
  showScreen(dest);
  if(dest==='s-home') updateHome();
}
function goHome(){
  if(exTimer){clearInterval(exTimer);exTimer=null;}
  showScreen('s-home');
  updateHome();
}
function setHdr(t,s=''){
  document.getElementById('hdr-title').textContent=t;
  document.getElementById('hdr-sub').textContent=s;
}

// ===== HOME =====
function selectCat(c){
  curCat=c;
  document.getElementById('ctab-y').className='cat-tab yobi'+(c==='yobi'?' on':'');
  document.getElementById('ctab-k').className='cat-tab kokka'+(c==='kokka'?' on':'');
  const yoEl=document.getElementById('ctab-yo');
  if(yoEl) yoEl.style.borderColor=c==='yoso'?'var(--gold)':'var(--gold-m)',
            yoEl.style.background=c==='yoso'?'var(--gold-l)':'',
            yoEl.style.color=c==='yoso'?'var(--gold)':'';
  buildExamSel(); buildQSel(); buildFSel();
}

function updateCatCounts(){
  const cnt=t=>ALL_Q.filter(q=>ei(q.eid).type===t).length;
  const y=document.querySelector('#ctab-y .ct-sub'), k=document.querySelector('#ctab-k .ct-sub'), yo=document.querySelector('#ctab-yo .ct-sub');
  if(y) y.textContent=`第1〜4回 ${cnt('yobi')}問`;
  if(k) k.textContent=`第1〜4回 ${cnt('kokka')}問`;
  if(yo) yo.textContent=YOSO_Q.length?`${YOSO_Q.length}問`:'読み込み中…';
}

function updateHome(){
  document.getElementById('h-weak').textContent=weak.size;
  document.getElementById('h-total-ok').textContent=totalCorrect;
  const hb=document.getElementById('h-bm'); if(hb) hb.textContent=bookmarks.size;
  const hd=document.getElementById('h-days'); if(hd) hd.textContent=dayStreak();
  const rv=reviewPool().length;
  const rvEl=document.getElementById('h-review-cnt'); if(rvEl) rvEl.textContent=rv?`${rv}問`:'なし';
  const rvDesc=document.getElementById('h-review-desc'); if(rvDesc) rvDesc.textContent=rv?'復習期限が来た問題と間違えた問題をまとめて出題。':'復習する問題はありません。問題を解くとここに溜まります。';
  ['rf-wc','ff-wc','qf-wc','yf-wc'].forEach(id=>{const e=document.getElementById(id);if(e)e.textContent=weak.size;});
  ['rf-bc','ff-bc','qf-bc','yf-bc'].forEach(id=>{const e=document.getElementById(id);if(e)e.textContent=bookmarks.size;});
  ['rf-weak-info','ff-weak-info'].forEach(id=>{const e=document.getElementById(id);if(e)e.style.display=weak.size>0?'block':'none';});
  updateCatCounts();
  renderKarin();
  const hEl=document.getElementById('h-hist');
  if(!history.length){hEl.innerHTML='<div class="empty">まだ記録がありません</div>';return;}
  hEl.innerHTML='<div class="hist-list">'+history.slice().reverse().slice(0,5).map(r=>{
    const cls=r.pct>=70?'pass':r.pct>=50?'mid':'fail';
    return `<div class="hist-row"><div><div class="hr-name">${r.name}</div><div class="hr-date">${r.date}</div></div><div class="hr-pct ${cls}">${r.pct}%</div></div>`;
  }).join('')+'</div>';
}

// ===== EXAM SELECT =====
function buildExamSel(){
  const type=curCat==='yoso'?'kokka':curCat;
  const rounds=ROUNDS.filter(r=>r.type===type);
  document.getElementById('esel-list').innerHTML=rounds.map(r=>{
    const sets=EXAMS_INFO.filter(e=>e.rid===r.id);
    return `<div class="esel-group"><div class="esel-round"><span class="edot ${r.type}"></span>${r.name}<span class="esel-date">${r.date}</span></div>`+
      sets.map(e=>{
        const hs=history.filter(h=>h.eid===e.id);
        const best=hs.length?Math.max(...hs.map(h=>h.pct)):null;
        const [bc,bt]=best===null?['none','未受験']:best>=70?['good',best+'%']:best>=50?['mid',best+'%']:['bad',best+'%'];
        const n=EXAM_DATA[e.id].filter(q=>!q.figsel).length;
        const skipped=EXAM_DATA[e.id].length-n;
        return `<button class="exam-row" onclick="startExam('${e.id}')">
          <div class="er-info"><div class="er-name">${SEC_NAMES[e.sec]}</div><div class="er-date">${n}問・${e.min}分${skipped?`　<span class="er-note">図のみの問題${skipped}問を除く</span>`:''}</div></div>
          <span class="badge ${bc}">${bt}</span>
        </button>`;
      }).join('')+'</div>';
  }).join('');
  const t=document.getElementById('esel-type'); if(t) t.textContent=type==='yobi'?'予備試験':'国家試験';
}

// 回・区分チップ（一問一答 / フラッシュカード共通）
function buildRoundSecChips(roundsId,secsId){
  const rEl=document.getElementById(roundsId), sEl=document.getElementById(secsId);
  if(!rEl||!sEl) return;
  if(curCat==='yoso'){
    rEl.innerHTML=''; rEl.parentElement.querySelector(`[data-for="${roundsId}"]`)?.style.setProperty('display','none');
    sEl.innerHTML=[['hissu','必須問題'],['jitchi','実地問題'],['ippan','一般問題']].map(([v,n])=>
      `<button class="ftag on" data-v="${v}" onclick="toggleFTag(this,'${secsId}')">${n}</button>`).join('');
    return;
  }
  rEl.parentElement.querySelector(`[data-for="${roundsId}"]`)?.style.removeProperty('display');
  rEl.innerHTML=ROUNDS.filter(r=>r.type===curCat).map(r=>
    `<button class="ftag on" data-v="${r.id}" onclick="toggleFTag(this,'${roundsId}')">第${r.no}回</button>`).join('');
  const secs=SEC_ORDER.filter(s=>EXAMS_INFO.some(e=>e.type===curCat&&e.sec===s));
  sEl.innerHTML=secs.map(s=>
    `<button class="ftag on" data-v="${s}" onclick="toggleFTag(this,'${secsId}')">${SEC_NAMES[s]}</button>`).join('');
}
function selectedVals(id){ return [...document.querySelectorAll('#'+id+' .ftag.on')].map(b=>b.dataset.v); }
// 回×区分の選択からプールを作る（curCat が yoso のときは予想問題集）
function poolFromChips(roundsId,secsId){
  if(curCat==='yoso'){
    const cats=selectedVals(secsId);
    return YOSO_Q.filter(q=>cats.includes(q.ycat));
  }
  const rids=selectedVals(roundsId), secs=selectedVals(secsId);
  return ALL_Q.filter(q=>{const e=ei(q.eid);return rids.includes(e.rid)&&secs.includes(e.sec);});
}
function applyOptionFilters(pool,weakId,bmId){
  const weakOnly=weakId&&document.getElementById(weakId)?.checked;
  const bmOnly=bmId&&document.getElementById(bmId)?.checked;
  if(weakOnly) pool=pool.filter(q=>weak.has(qKey(q)));
  if(bmOnly) pool=pool.filter(q=>bookmarks.has(qKey(q)));
  return pool;
}

// ===== SUBJECT FILTER =====
function buildSubjectFilter(containerId){
  const wrap=document.getElementById(containerId);
  if(!wrap) return;
  const opts=[['ALL','すべて'],...Object.entries(SUBJECT_NAMES)];
  wrap.innerHTML=opts.map(([k,v])=>
    `<button class="ftag ${k===curSubject?'on':''}" data-s="${k}" onclick="setSubject('${k}','${containerId}')">${v}</button>`
  ).join('');
}

function setSubject(s, containerId){
  curSubject=s;
  document.querySelectorAll(`#${containerId} .ftag`).forEach(b=>{
    b.classList.toggle('on', b.dataset.s===s);
  });
  // 他の科目フィルターも同期
  ['qf-subjects','rf-subjects','ff-subjects'].forEach(id=>{
    if(id===containerId) return;
    document.querySelectorAll(`#${id} .ftag`).forEach(b=>{
      b.classList.toggle('on', b.dataset.s===s);
    });
  });
}

function filterBySubject(pool){
  if(curSubject==='ALL') return pool;
  return pool.filter(q=>getTag(q)===curSubject);
}

// ===== QUIZ SELECT =====
function buildQSel(){
  buildRoundSecChips('qf-exams','qf-secs');
  buildSubjectFilter('qf-subjects');
  buildSubjectFilter('rf-subjects');
  const t=document.getElementById('qsel-type'); if(t) t.textContent=curCat==='yobi'?'予備試験':curCat==='kokka'?'国家試験':'予想問題集';
}

function buildFSel(){
  buildRoundSecChips('ff-exams','ff-secs');
  buildSubjectFilter('ff-subjects');
  const t=document.getElementById('fsel-type'); if(t) t.textContent=curCat==='yobi'?'予備試験':curCat==='kokka'?'国家試験':'予想問題集';
}

function toggleFTag(btn,gid){
  btn.classList.toggle('on');
  const any=[...document.querySelectorAll('#'+gid+' .ftag')].some(b=>b.classList.contains('on'));
  if(!any) btn.classList.add('on');
}
function qs1(btn){document.querySelectorAll('#qf-count .ftag').forEach(b=>b.classList.remove('on'));btn.classList.add('on');}
function qs1r(btn){document.querySelectorAll('#rf-count .ftag').forEach(b=>b.classList.remove('on'));btn.classList.add('on');}
function qs1t(btn){document.querySelectorAll('#rf-type .ftag').forEach(b=>b.classList.remove('on'));btn.classList.add('on');}
function qs1y(btn){document.querySelectorAll('#yf-count .ftag').forEach(b=>b.classList.remove('on'));btn.classList.add('on');}

async function startYosoQuiz(){
  if(!yosoLoaded){
    const btn=document.querySelector('#s-ysel .btn');
    if(btn){ const orig=btn.textContent; btn.textContent='読み込み中…'; btn.disabled=true;
      await loadYosoData();
      btn.textContent=orig; btn.disabled=false; }
    else await loadYosoData();
  }
  if(!YOSO_Q.length){ alert('データの読み込みに失敗しました。通信環境を確認して再度お試しください。'); return; }
  const cats=[...document.querySelectorAll('#yf-cat .ftag.on')].map(b=>b.dataset.v);
  const cnt=[...document.querySelectorAll('#yf-count .ftag.on')][0]?.dataset.v||'20';
  const imgOnly=document.getElementById('yf-imgonly').checked;
  let pool=YOSO_Q.filter(q=>cats.includes(q.ycat));
  if(imgOnly) pool=pool.filter(q=>q.type==='img');
  pool=applyOptionFilters(pool,'yf-weak','yf-bm');
  if(!pool.length){ alert('対象の問題がありません'); return; }
  pool=shuf(pool);
  if(cnt!=='0') pool=pool.slice(0,+cnt);
  launchQuiz(pool,'yoso');
}

// ===== QUIZ =====
function startQuiz(){
  const cnt=[...document.querySelectorAll('#qf-count .ftag.on')][0]?.dataset.v||'20';
  let pool=poolFromChips('qf-exams','qf-secs');
  pool=applyOptionFilters(pool,'qf-weak','qf-bm');
  pool=filterBySubject(pool);
  if(!pool.length){alert('対象の問題がありません');return;}
  pool=shuf(pool);
  if(cnt!=='0') pool=pool.slice(0,+cnt);
  launchQuiz(pool,'quiz');
}

// ===== RANDOM =====
function startRandom(){
  const cnt=[...document.querySelectorAll('#rf-count .ftag.on')][0]?.dataset.v||'20';
  // 試験種別フィルター
  const typeEl=document.querySelector('#rf-type .ftag.on');
  const type=typeEl?typeEl.dataset.v:'all';
  const secs=selectedVals('rf-secs');
  let pool=[...ALL_Q,...YOSO_Q];
  if(type==='yobi'||type==='kokka') pool=pool.filter(q=>q.eid!=='yoso'&&ei(q.eid).type===type);
  else if(type==='yoso') pool=pool.filter(q=>q.eid==='yoso');
  pool=pool.filter(q=>secs.includes(q.eid==='yoso'?(q.ycat==='jitchi'?'jitti':q.ycat):ei(q.eid).sec));
  pool=applyOptionFilters(pool,'rf-weak','rf-bm');
  pool=filterBySubject(pool);
  if(!pool.length){alert('対象の問題がありません');return;}
  pool=shuf(pool);
  if(cnt!=='0') pool=pool.slice(0,+cnt);
  launchQuiz(pool,'random');
}

// ===== 今日の復習 =====
async function startReview(){
  if(!yosoLoaded) await loadYosoData();
  let pool=reviewPool();
  if(!pool.length){alert('復習する問題はありません。\n問題を解くと、間違えた問題や復習期限が来た問題がここに溜まります。');return;}
  pool=shuf(pool);
  if(pool.length>30) pool=pool.slice(0,30);
  launchQuiz(pool,'review');
}

// ===== SHARED QUIZ ENGINE =====
let qzAns=[];
// ===== 選択肢シャッフル =====
// 選択肢の並びで答えを覚えてしまうのを防ぐ。画像内の番号を選ぶ問題はそのまま。
function canShuffle(q){
  if(q.src&&q.src.qImg) return false;
  if(!Array.isArray(q.o)||q.o.length<2) return false;
  if(q.o.every(o=>/^[（(]?[アイウエオ図][）)]?$/.test(o))) return false;
  return true;
}
function shuffleOpts(q){
  if(!optShuffle||!canShuffle(q)) return q;
  const perm=shuf(q.o.map((_,i)=>i));          // perm[newIdx] = oldIdx
  const remap=old=>perm.indexOf(old-1)+1;
  const c={...q,o:perm.map(i=>q.o[i]),a:q.a?remap(q.a):q.a};
  if(Array.isArray(q.am)) c.am=q.am.map(remap);
  return c;
}
function setShuffle(on){
  optShuffle=!!on;
  document.querySelectorAll('.shuf-chk').forEach(el=>el.checked=optShuffle);
  saveStore();
}
function syncShuffleChecks(){ document.querySelectorAll('.shuf-chk').forEach(el=>el.checked=optShuffle); }

function launchQuiz(pool, mode){
  pool=pool.map(shuffleOpts);
  qzPool=pool; qzIdx=0; qzOk=0; qzNg=0; qzMode=mode; qzAns=Array(pool.length).fill(null);
  prevLevel=getKarinLevel().lv;
  const label=mode==='random'?'ランダム出題':mode==='yoso'?'予想問題集':mode==='review'?'今日の復習':'一問一答';
  setHdr(label,`全${pool.length}問`);
  document.getElementById('qz-bar').className='prog-fill '+(mode==='random'?'o':'g');
  document.getElementById('qz-next').className='btn '+(mode==='random'?'po':'pg');
  showScreen('s-quiz');
  document.querySelector('.bnav').style.display='none';
  loadQz();
}

// 図が非公開の問題への注記
function figNoteHtml(q){
  if(q.eid==='yoso'||!q.fig) return '';
  return `<div class="fig-note">この問題の図は公式サイトで非公開のため掲載していません。問題文と選択肢から推測して解いてください。</div>`;
}
// 解説が無い問題: 正解の語でテキストを検索できるようにする
function expFallbackHtml(q){
  if(q.e) return '';
  const term=(q.all?'':(q.o[(q.am?q.am[0]:q.a)-1]||'')).replace(/[（(].*?[）)]/g,'').split(/[ ―,、，]/)[0].trim();
  const btn=term&&term.length>=2?`<button class="btn-pdf" onclick="searchFromQuiz('${esc(term).replace(/'/g,'&#39;')}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>「${esc(term)}」をテキストで調べる</button>`:'';
  return `<div>公式問題には解説が付いていません。</div>${btn}`;
}
function searchFromQuiz(term){
  showScreen('s-book');
  setBookTab('s');
  const inp=document.getElementById('tr-search-input');
  if(inp){ inp.value=term; }
  doSearch(term);
}

function loadQz(){
  const q=qzPool[qzIdx];
  if(!q){finishQuiz();return;}
  const isYoso=q.eid==='yoso';
  const tc=isYoso?'rand':(qzMode==='random'?'rand':tCls(q.eid));
  document.getElementById('qz-bar').style.width=Math.round(qzIdx/qzPool.length*100)+'%';
  document.getElementById('qz-cnt').textContent=`${qzIdx+1} / ${qzPool.length}`;
  document.getElementById('qz-ok').textContent=qzOk;
  document.getElementById('qz-ng').textContent=qzNg;
  document.getElementById('qz-rem').textContent=qzPool.length-qzIdx;
  // タグ表示
  const subName=SUBJECT_NAMES[getTag(q)]||'';
  document.getElementById('qz-tag').textContent=`${qLabel(q)}　${subName}`;
  document.getElementById('qz-tag').className='q-tag '+tc;
  document.getElementById('qz-exp').style.display='none';
  document.getElementById('qz-next').disabled=true;
  renderBmBtn('qz-bm',q);
  const ansInd=document.getElementById('qz-ans-ind');
  ansInd.className='ans-ind'; ansInd.style.display='none'; ansInd.innerHTML='';
  const note=document.getElementById('qz-note'); if(note) note.innerHTML=figNoteHtml(q);
  // 画像表示
  const imgEl=document.getElementById('qz-img');
  const txtEl=document.getElementById('qz-text');
  const IMG_ROOT='https://mogmog123456-glitch.github.io/butukan/';
  if(isYoso && q.src && q.src.qImg){
    imgEl.src=IMG_ROOT+q.src.qImg;
    imgEl.style.display='block';
    txtEl.style.display='none';
    // 画像モード: ①〜⑤ ボタン（大きめ）
    document.getElementById('qz-opts').innerHTML=
      '①②③④⑤'.split('').slice(0,q.o.length).map((c,i)=>
        `<button class="opt-img" onclick="ansQz(${i+1})">${c}</button>`
      ).join('');
  } else {
    imgEl.style.display='none';
    txtEl.style.display='';
    txtEl.textContent=q.q;
    document.getElementById('qz-opts').innerHTML=q.o.map((o,i)=>
      `<button class="opt" onclick="ansQz(${i+1})">${i+1}. ${esc(o)}</button>`
    ).join('');
  }
}

function ansQz(c){
  const q=qzPool[qzIdx], key=qKey(q);
  qzAns[qzIdx]=c;
  document.querySelectorAll('#qz-opts .opt, #qz-opts .opt-img').forEach(b=>b.disabled=true);
  const btns=document.querySelectorAll('#qz-opts .opt, #qz-opts .opt-img');
  const correct=isCorrect(q,c);
  recordAnswer(q,correct);
  const circles=['①','②','③','④','⑤'];
  const corrIdx=q.all?[]:(Array.isArray(q.am)?q.am:[q.a]);
  if(correct){
    btns[c-1].classList.add('correct'); qzOk++;
    if(weak.has(key)){weak.delete(key);}
    showStreakBadge();
  } else {
    btns[c-1].classList.add('wrong'); corrIdx.forEach(i=>btns[i-1]?.classList.add('correct')); qzNg++;
    weak.add(key);
  }
  // 正解インジケーター（画像モード、または複数正答/全員正解のとき）
  if((q.src && q.src.qImg) || q.all || q.am){
    const ansInd=document.getElementById('qz-ans-ind');
    const ansText=q.all?'公式発表で全員正解扱いの問題です':q.am?`正答が複数あります（${q.am.map(i=>circles[i-1]).join('・')}）`:(q.o[q.a-1]||'');
    const head=q.all?'':q.am?'':`答えは ${circles[q.a-1]}`;
    if(correct){
      ansInd.className='ans-ind ok';
      ansInd.innerHTML=`✓ 正解！　${head}<div class="ans-ind-sub">${esc(ansText)}</div>`;
    } else {
      ansInd.className='ans-ind ng';
      ansInd.innerHTML=`✗ 不正解　${head.replace('答えは','正解は')}<div class="ans-ind-sub">${esc(ansText)}</div>`;
    }
    ansInd.style.display='block';
  }
  saveStore();
  checkLevelUp();
  document.getElementById('qz-ok').textContent=qzOk;
  document.getElementById('qz-ng').textContent=qzNg;
  document.getElementById('qz-expt').textContent=q.e||'';
  const fb=document.getElementById('qz-exp-fb'); if(fb) fb.innerHTML=expFallbackHtml(q);
  // PDFボタン
  const pdfBtns=document.getElementById('qz-pdf-btns');
  if(pdfBtns){
    pdfBtns.innerHTML='';
    if(q.src){
      if(q.type==='img'){
        pdfBtns.innerHTML+=`<button class="btn-pdf" onclick="window.open('${q.src.qUrl}','_blank')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>問題PDFを開く</button>`;
      }
      if(q.src.eUrl && q.src.ePage){
        pdfBtns.innerHTML+=`<button class="btn-pdf" onclick="window.open('${q.src.eUrl}','_blank')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>解説PDF（p.${q.src.ePage}）を開く</button>`;
      } else if(q.src.eUrl){
        pdfBtns.innerHTML+=`<button class="btn-pdf" onclick="window.open('${q.src.eUrl}','_blank')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>解説PDFを開く</button>`;
      }
      pdfBtns.style.display=pdfBtns.innerHTML?'flex':'none';
    } else {
      pdfBtns.style.display='none';
    }
  }
  document.getElementById('qz-exp').style.display='block';
  document.getElementById('qz-next').disabled=false;
}

function showStreakBadge(){
  if(streak<3) return;
  const badge=document.getElementById('streak-badge');
  if(!badge) return;
  badge.textContent=`${streak}連続正解！`;
  badge.style.opacity='1';
  badge.style.transform='scale(1)';
  setTimeout(()=>{badge.style.opacity='0';badge.style.transform='scale(.8)';},1500);
}

function qzNext(){qzIdx++;loadQz();}

function finishQuiz(){
  const total=qzPool.length, pct=Math.round(qzOk/total*100);
  const label=qzMode==='random'?`ランダム（${total}問）`:qzMode==='yoso'?`予想問題集（${total}問）`:qzMode==='review'?`今日の復習（${total}問）`:`一問一答（${total}問）`;
  history.push({name:label,date:new Date().toLocaleDateString('ja-JP'),pct,eid:''});
  saveStore();
  showResult({pct,ok:qzOk,total,pool:qzPool,ans:qzAns,eid:''});
}

// ===== EXAM =====
let exFlags=new Set();   // 「あとで見直す」フラグ
let exInstant=true;      // 回答直後に正誤を表示するか
function startExam(id){
  retryEid=id;
  const info=ei(id);
  exId=id; exPool=EXAM_DATA[id].filter(q=>!q.figsel).map(q=>shuffleOpts({...q,eid:id})); exIdx=0;
  exAns=Array(exPool.length).fill(null); exFlags=new Set(); exSec=info.min*60;
  exInstant=document.getElementById('esel-instant')?.checked!==false;
  prevLevel=getKarinLevel().lv;
  setHdr(info.name,`${exPool.length}問・${info.min}分`);
  document.getElementById('ex-tag').className=`q-tag ${tCls(id)}`;
  showScreen('s-exam');
  document.querySelector('.bnav').style.display='none';
  if(exTimer) clearInterval(exTimer);
  const t=document.getElementById('ex-timer');
  t.textContent=`${String(Math.floor(exSec/60)).padStart(2,'0')}:00`; t.className='timer';
  exTimer=setInterval(()=>{
    exSec--;
    const m=Math.floor(exSec/60),s=exSec%60;
    t.textContent=`${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    t.className='timer'+(exSec<=120?' urgent':'');
    if(exSec<=0){clearInterval(exTimer);exTimer=null;finishExam();}
  },1000);
  const grid=document.getElementById('ex-grid-wrap'); if(grid) grid.open=false;
  loadEx();
}

function loadEx(){
  const q=exPool[exIdx];
  if(!q){finishExam();return;}
  const answered=exAns.filter(a=>a!==null).length;
  document.getElementById('ex-bar').style.width=Math.round(answered/exPool.length*100)+'%';
  document.getElementById('ex-cnt').textContent=`${exIdx+1} / ${exPool.length}`;
  document.getElementById('ex-tag').textContent=`問 ${q.no}`;
  document.getElementById('ex-text').textContent=q.q;
  const note=document.getElementById('ex-note'); if(note) note.innerHTML=figNoteHtml(q);
  document.getElementById('ex-opts').innerHTML=q.o.map((o,i)=>
    `<button class="opt" onclick="ansEx(${i+1})">${i+1}. ${esc(o)}</button>`
  ).join('');
  document.getElementById('ex-prev').disabled=exIdx===0;
  document.getElementById('ex-next').textContent=exIdx<exPool.length-1?'次の問題 →':'採点する';
  document.getElementById('ex-next').disabled=false;
  renderBmBtn('ex-bm',q);
  const fl=document.getElementById('ex-flag');
  if(fl) fl.classList.toggle('on',exFlags.has(exIdx));
  if(exAns[exIdx]!==null){
    const c=exAns[exIdx];
    const btns=document.querySelectorAll('#ex-opts .opt');
    btns.forEach(b=>b.disabled=true);
    if(exInstant){
      const ok=isCorrect(q,c);
      btns[c-1].classList.add(ok?'correct':'wrong');
      if(!ok&&!q.all) (q.am||[q.a]).forEach(i=>btns[i-1]?.classList.add('correct'));
    } else {
      btns[c-1].classList.add('chosen');
    }
  }
  renderExGrid();
}

function ansEx(c){
  const q=exPool[exIdx];
  if(exAns[exIdx]!==null) return;
  exAns[exIdx]=c;
  recordAnswer(q,isCorrect(q,c));
  saveStore(); checkLevelUp();
  loadEx();
}

function exNext(){
  if(exIdx<exPool.length-1){exIdx++;loadEx();}
  else {
    const left=exAns.filter(a=>a===null).length;
    if(left&&!confirm(`未回答が${left}問あります。採点しますか？`)) return;
    finishExam();
  }
}
function exPrev(){ if(exIdx>0){exIdx--;loadEx();} }
function exJump(i){ exIdx=i; loadEx(); window.scrollTo(0,0); }
function toggleExFlag(){
  if(exFlags.has(exIdx)) exFlags.delete(exIdx); else exFlags.add(exIdx);
  document.getElementById('ex-flag')?.classList.toggle('on',exFlags.has(exIdx));
  renderExGrid();
}
function renderExGrid(){
  const g=document.getElementById('ex-grid'); if(!g) return;
  g.innerHTML=exPool.map((q,i)=>{
    const cls=['exg',i===exIdx?'cur':'',exAns[i]!==null?'done':'',exFlags.has(i)?'flag':''].join(' ');
    return `<button class="${cls}" onclick="exJump(${i})">${q.no}</button>`;
  }).join('');
  const s=document.getElementById('ex-grid-sum');
  if(s) s.textContent=`回答済 ${exAns.filter(a=>a!==null).length} / 未回答 ${exAns.filter(a=>a===null).length}${exFlags.size?` / 見直し ${exFlags.size}`:''}`;
}

function finishExam(){
  if(exTimer){clearInterval(exTimer);exTimer=null;}
  let ok=0;
  exPool.forEach((q,i)=>{
    const key=qKey(q);
    if(exAns[i]!==null&&isCorrect(q,exAns[i])){ok++;mastered.add(key);weak.delete(key);}
    else {weak.add(key);mastered.delete(key);}
  });
  const pct=Math.round(ok/exPool.length*100);
  history.push({name:ei(exId).name,date:new Date().toLocaleDateString('ja-JP'),pct,eid:exId});
  saveStore();
  showResult({pct,ok,total:exPool.length,pool:exPool,ans:exAns,eid:exId,flags:exFlags});
}

function retryExam(){startExam(retryEid);}

// ===== RESULT =====
function showResult({pct,ok,total,pool,ans,eid,flags}){
  const pass=pct>=70;
  document.getElementById('r-pct').textContent=pct+'%';
  document.getElementById('r-pct').className='r-pct '+(pass?'pass':'fail');
  document.getElementById('r-verdict').textContent=pass?'合格ライン達成':'もう少しで合格';
  document.getElementById('r-detail').textContent=`${total}問中 ${ok}問正解　合格ライン目安 70%`;

  const lv=getKarinLevel();
  const karinComment=document.getElementById('r-karin-comment');
  const rCanvas=document.getElementById('r-karin-img');
  if(rCanvas){
    const row=KARIN_SPRITE_ROW[lv.lv]||0;
    if(_spriteImg.complete) drawSprite(rCanvas,row,0);
    else _spriteImg.onload=()=>drawSprite(rCanvas,row,0);
  }
  if(karinComment){
    const comments=pass
      ? ['やったにゃ！','すごいにゃ！','かりんとうも鼻高々にゃ！']
      : ['つぎはがんばるにゃ','ふくしゅうするにゃ〜','まけないにゃ！'];
    karinComment.textContent=comments[Math.floor(Math.random()*comments.length)];
  }

  if(pass) startConfetti();

  const retry=document.getElementById('r-retry');
  retry.style.display=eid?'':'none';
  if(eid) retry.className='btn pb';
  if(ans){
    document.getElementById('r-breakdown').innerHTML=pool.map((q,i)=>{
      const a=ans[i],ok2=a!==null&&isCorrect(q,a);
      const sub=SUBJECT_NAMES[getTag(q)]||'';
      const flag=flags&&flags.has(i)?'<span class="rb-flag">見直し</span>':'';
      const bm=bookmarks.has(qKey(q))?'<span class="rb-flag bm">★</span>':'';
      const corr=q.all?'全員正解':(q.o[(q.am?q.am[0]:q.a)-1]||'').slice(0,10);
      const mark=ok2?'正解':a===null?'未回答 → '+corr:'× → '+corr;
      return `<div class="rb-row">
        <div class="rb-q"><span style="font-size:10px;color:var(--ink3)">[${sub}]</span> ${eid?'':'<span style="font-size:10px;color:var(--ink3)">'+esc(qLabel(q)).replace(/　問\d+$/,'')+'</span> '}問${q.no}. ${esc(q.q.split('\n')[0].slice(0,28))}…${flag}${bm}</div>
        <div class="rb-mark ${ok2?'ok':'ng'}">${esc(mark)}</div>
      </div>`;
    }).join('');
  } else {
    document.getElementById('r-breakdown').innerHTML='<div style="padding:12px;font-size:12px;color:var(--ink3)">記録はありません</div>';
  }
  setHdr('結果');
  showScreen('s-result');
  document.querySelector('.bnav').style.display='none';
  updateHome();
}

// ===== FLASH =====
async function startFlash(){
  if(curCat==='yoso'&&!yosoLoaded) await loadYosoData();
  let pool=poolFromChips('ff-exams','ff-secs');
  pool=applyOptionFilters(pool,'ff-weak','ff-bm');
  pool=filterBySubject(pool);
  if(!pool.length){alert('対象の問題がありません');return;}
  flPool=shuf(pool).map(shuffleOpts); flIdx=0;
  setHdr('フラッシュカード',`全${flPool.length}問`);
  showScreen('s-flash');
  loadFl();
}

function loadFl(){
  const q=flPool[flIdx];
  document.getElementById('fl-bar').style.width=Math.round(flIdx/flPool.length*100)+'%';
  document.getElementById('fl-cnt').textContent=`${flIdx+1} / ${flPool.length}`;
  const sub=SUBJECT_NAMES[getTag(q)]||'';
  document.getElementById('fl-pos').textContent=`${qLabel(q)}　[${sub}]`;
  renderBmBtn('fl-bm',q);
  const note=document.getElementById('fl-note'); if(note) note.innerHTML=figNoteHtml(q);

  const circles=['①','②','③','④','⑤'];
  const isImg=q.eid==='yoso' && q.src && q.src.qImg;
  const IMG_ROOT='https://mogmog123456-glitch.github.io/butukan/';
  const imgEl=document.getElementById('fl-img');
  const qEl=document.getElementById('fl-q');
  const optsEl=document.getElementById('fl-opts');

  if(isImg){
    imgEl.src=IMG_ROOT+q.src.qImg;
    imgEl.style.display='block';
    qEl.style.display='none';
    optsEl.innerHTML='';
  } else {
    imgEl.style.display='none';
    qEl.style.display='';
    qEl.textContent=q.q;
    optsEl.innerHTML=q.o.map((o,i)=>
      `<div class="fl-opt-item">${i+1}. ${o}</div>`
    ).join('');
  }

  document.getElementById('fl-ans').textContent=`正解：${ansLabel(q)}`;
  document.getElementById('fl-exp').textContent=q.e||(q.eid==='yoso'?'':'（公式問題には解説がありません）');
  document.getElementById('fl-inner').classList.remove('flip');
}

function flipCard(){document.getElementById('fl-inner').classList.toggle('flip');}
function flMove(d){flIdx=Math.max(0,Math.min(flPool.length-1,flIdx+d));loadFl();}

function markCard(ok){
  const q=flPool[flIdx], key=qKey(q);
  recordAnswer(q,ok);
  if(ok){mastered.add(key);weak.delete(key);}
  else  {weak.add(key);mastered.delete(key);}
  saveStore(); updateHome(); checkLevelUp(); flMove(1);
}

// ===== GRAPH =====
function renderGraph(){
  setHdr('科目別 正答率');
  const canvas=document.getElementById('graph-canvas');
  if(!canvas) return;
  const ctx=canvas.getContext('2d');
  const dpr=window.devicePixelRatio||1;
  const W=canvas.offsetWidth, H=canvas.offsetHeight;
  canvas.width=W*dpr; canvas.height=H*dpr;
  ctx.scale(dpr,dpr);
  const codes=Object.keys(SUBJECT_NAMES);
  const data=codes.map(k=>{
    const s=subjectStats[k]||{ok:0,total:0};
    return {code:k,name:SUBJECT_NAMES[k],pct:s.total>0?Math.round(s.ok/s.total*100):null,total:s.total,ok:s.ok};
  });
  const padL=12,padR=12,padT=22,barH=30,barGap=14;
  const chartW=W-padL-padR;
  ctx.clearRect(0,0,W,H);
  const lineX=padL+chartW*0.7;
  ctx.save();
  ctx.setLineDash([4,4]);
  ctx.strokeStyle='rgba(196,85,58,.4)';
  ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(lineX,padT-10); ctx.lineTo(lineX,padT+(barH+barGap)*codes.length); ctx.stroke();
  ctx.restore();
  ctx.fillStyle='rgba(196,85,58,.7)';
  ctx.font='bold 10px sans-serif';
  ctx.fillText('70%',lineX+3,padT-3);
  data.forEach((d,i)=>{
    const y=padT+i*(barH+barGap);
    ctx.fillStyle='#ece9e3';
    ctx.beginPath(); ctx.roundRect(padL,y,chartW,barH,5); ctx.fill();
    if(d.total===0){
      ctx.fillStyle='#bbb'; ctx.font='11px sans-serif'; ctx.textAlign='left';
      ctx.fillText('未解答',padL+8,y+barH/2+4);
    } else {
      const bw=chartW*(d.pct/100);
      const color=d.pct>=70?'#3d6b4f':d.pct>=50?'#9a6e14':'#c4553a';
      ctx.fillStyle=color;
      ctx.beginPath(); ctx.roundRect(padL,y,bw,barH,5); ctx.fill();
      if(bw>38){
        ctx.fillStyle='#fff'; ctx.font='bold 13px sans-serif'; ctx.textAlign='right';
        ctx.fillText(d.pct+'%',padL+bw-8,y+barH/2+5);
      }
    }
    ctx.fillStyle='#444'; ctx.font='10px sans-serif'; ctx.textAlign='left';
    ctx.fillText(`${d.name}  ${d.total>0?d.ok+'/'+d.total+'問':''}`,padL+4,y+barH+11);
  });
}

// ===== PARTICLES / CONFETTI =====
let particleInterval=null;
function startParticles(){
  const overlay=document.getElementById('levelup-overlay');
  if(!overlay) return;
  const canvas=document.getElementById('particle-canvas');
  if(!canvas) return;
  const ctx=canvas.getContext('2d');
  canvas.width=canvas.offsetWidth; canvas.height=canvas.offsetHeight;
  const particles=[];
  const colors=['#e8c840','#3d6b4f','#c4553a','#60b0d0','#f0d0b0'];
  for(let i=0;i<40;i++){
    particles.push({
      x:Math.random()*canvas.width, y:Math.random()*canvas.height*.5,
      vx:(Math.random()-.5)*3, vy:Math.random()*2+1,
      r:Math.random()*4+2, color:colors[Math.floor(Math.random()*colors.length)],
      alpha:1
    });
  }
  if(particleInterval) clearInterval(particleInterval);
  particleInterval=setInterval(()=>{
    ctx.clearRect(0,0,canvas.width,canvas.height);
    particles.forEach(p=>{
      p.x+=p.vx; p.y+=p.vy; p.alpha-=0.015;
      ctx.save(); ctx.globalAlpha=Math.max(0,p.alpha);
      ctx.fillStyle=p.color;
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill();
      ctx.restore();
    });
  },30);
}
function stopParticles(){if(particleInterval){clearInterval(particleInterval);particleInterval=null;}}

let confettiInterval=null;
function startConfetti(){
  const canvas=document.getElementById('confetti-canvas');
  if(!canvas) return;
  canvas.style.display='block';
  const ctx=canvas.getContext('2d');
  canvas.width=canvas.offsetWidth; canvas.height=canvas.offsetHeight;
  const particles=[];
  const colors=['#e8c840','#3d6b4f','#c4553a','#60b0d0','#9a6e14'];
  for(let i=0;i<60;i++){
    particles.push({
      x:Math.random()*canvas.width, y:-10,
      vx:(Math.random()-.5)*4, vy:Math.random()*4+2,
      r:Math.random()*5+2, color:colors[Math.floor(Math.random()*colors.length)],
      rot:Math.random()*Math.PI*2, rotV:(Math.random()-.5)*.2
    });
  }
  if(confettiInterval) clearInterval(confettiInterval);
  confettiInterval=setInterval(()=>{
    ctx.clearRect(0,0,canvas.width,canvas.height);
    let alive=false;
    particles.forEach(p=>{
      p.x+=p.vx; p.y+=p.vy; p.rot+=p.rotV;
      if(p.y<canvas.height+10) alive=true;
      ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.rot);
      ctx.fillStyle=p.color;
      ctx.fillRect(-p.r,-p.r/2,p.r*2,p.r);
      ctx.restore();
    });
    if(!alive){
      clearInterval(confettiInterval); confettiInterval=null;
      canvas.style.display='none';
    }
  },20);
  setTimeout(()=>{
    if(confettiInterval){clearInterval(confettiInterval);confettiInterval=null;canvas.style.display='none';}
  },4000);
}

// ===== BOOK / PDF =====
const PDF_ROOT = 'https://mogmog123456-glitch.github.io/butukan/text/';
const TB_FOLDER = '動物看護師/愛玩動物看護師必携テキスト_動物看護学';
const MB_FOLDER = '動物看護師/愛玩動物看護師国家試験完全攻略_問題集_2026年版';
function pdfUrl(folder,file){
  return PDF_ROOT + folder.split('/').map(encodeURIComponent).join('/') + '/' + encodeURIComponent(file);
}

const TEXTBOOK_DATA=[
  {cat:'基礎動物学',cls:'b',items:[
    {t:'生命倫理・動物福祉',        f:'愛玩動物看護士必携テキスト_動物看護学_（1_基礎動物学_1_生命倫理・動物福祉）.pdf'},
    {t:'動物形態機能学',            f:'愛玩動物看護士必携テキスト_動物看護学_（1_基礎動物学_2_動物形態機能学）.pdf'},
    {t:'動物繁殖学',                f:'愛玩動物看護士必携テキスト_動物看護学_（1_基礎動物学_3_動物繁殖学）.pdf'},
    {t:'動物行動学',                f:'愛玩動物看護士必携テキスト_動物看護学_（1_基礎動物学_4_動物行動学）.pdf'},
    {t:'動物栄養学',                f:'愛玩動物看護士必携テキスト_動物看護学_（1_基礎動物学_5_動物栄養学）.pdf'},
    {t:'比較動物学',                f:'愛玩動物看護士必携テキスト_動物看護学_（1_基礎動物学_6_比較動物学）.pdf'},
    {t:'動物看護関連法規',          f:'愛玩動物看護士必携テキスト_動物看護学_（1_基礎動物学_7_動物看護関連法規）.pdf'},
    {t:'動物愛護・適正飼養関連法規',f:'愛玩動物看護士必携テキスト_動物看護学_（1_基礎動物学_8_動物愛護・適正飼養関連法規）.pdf'},
  ]},
  {cat:'基礎動物看護学',cls:'g',items:[
    {t:'動物看護学概論',f:'愛玩動物看護士必携テキスト_動物看護学_（2_基礎動物看護学_1_動物看護学概論）.pdf'},
    {t:'動物病理学①',  f:'愛玩動物看護士必携テキスト_動物看護学_（2_基礎動物看護学_2_動物病理学）.pdf'},
    {t:'動物病理学②',  f:'愛玩動物看護士必携テキスト_動物看護学_（2_基礎動物看護学_3_動物病理学）.pdf'},
    {t:'動物感染症学',  f:'愛玩動物看護士必携テキスト_動物看護学_（2_基礎動物看護学_4_動物感染症学）.pdf'},
    {t:'公衆衛生学',    f:'愛玩動物看護士必携テキスト_動物看護学_（2_基礎動物看護学_5_公衆衛生学）.pdf'},
  ]},
  {cat:'臨床動物看護学',cls:'r',items:[
    {t:'動物内科看護学',    f:'愛玩動物看護士必携テキスト_動物看護学_（3_臨床動物看護学_1_動物内科看護学）.pdf'},
    {t:'動物外科看護学①',  f:'愛玩動物看護士必携テキスト_動物看護学_（3_臨床動物看護学_2_動物外科看護学）.pdf'},
    {t:'動物臨床看護学総論',f:'愛玩動物看護士必携テキスト_動物看護学_（3_臨床動物看護学_3_動物臨床看護学総論）.pdf'},
    {t:'動物外科看護学②',  f:'愛玩動物看護士必携テキスト_動物看護学_（3_臨床動物看護学_4_動物外科看護学）.pdf'},
    {t:'動物臨床検査学',    f:'愛玩動物看護士必携テキスト_動物看護学_（3_臨床動物看護学_5_動物臨床検査学）.pdf'},
  ]},
  {cat:'愛護・適正飼養学',cls:'o',items:[
    {t:'愛玩動物学',        f:'愛玩動物看護士必携テキスト_動物看護学_（4_愛護・適正飼養学_1_愛玩動物学）.pdf'},
    {t:'人と動物の関係学',  f:'愛玩動物看護士必携テキスト_動物看護学_（4_愛護・適正飼養学_2_人と動物の関係学）.pdf'},
    {t:'適正飼養指導論',    f:'愛玩動物看護士必携テキスト_動物看護学_（4_愛護・適正飼養学_3_適正飼養指導論）.pdf'},
    {t:'動物生活環境学',    f:'愛玩動物看護士必携テキスト_動物看護学_（4_愛護・適正飼養学_4_動物生活環境学）.pdf'},
    {t:'ペット関連産業論',  f:'愛玩動物看護士必携テキスト_動物看護学_（4_愛護・適正飼養学_5_ペット関連産業論）.pdf'},
  ]},
  {cat:'付録',cls:'g',items:[
    {t:'国家試験出題基準対照表',f:'付録１　愛玩動物看護師国家試験出題基準 (2022年 4月 )対照表.pdf'},
    {t:'愛玩動物看護師法',      f:'付録２　愛玩動物看護師法 (令和元年法律第五十号).pdf'},
  ]},
];

const MONDAI_DATA=[
  {cat:'必須問題',cls:'g',items:[
    {t:'Part 1　問題',       f:'愛玩動物看護師国家試験完全攻略 _1_予想問題_1_必須問題パート1.pdf',bdg:'q'},
    {t:'Part 1　解答・解説', f:'愛玩動物看護師国家試験完全攻略 _1_予想問題_1_必須問題パート1【解答・解説】.pdf',bdg:'a'},
    {t:'Part 2　問題',       f:'愛玩動物看護師国家試験完全攻略 _1_予想問題_1_必須問題パート2.pdf',bdg:'q'},
    {t:'Part 2　解答・解説', f:'愛玩動物看護師国家試験完全攻略 _1_予想問題_1_必須問題パート2【解答・解説】.pdf',bdg:'a'},
    {t:'Part 3　問題',       f:'愛玩動物看護師国家試験完全攻略 _1_予想問題_1_必須問題パート3.pdf',bdg:'q'},
    {t:'Part 3　解答・解説', f:'愛玩動物看護師国家試験完全攻略 _1_予想問題_1_必須問題パート3【解答・解説】.pdf',bdg:'a'},
  ]},
  {cat:'実地問題',cls:'b',items:[
    {t:'解答一覧',           f:'愛玩動物看護師国家試験完全攻略 _1_予想問題_2_実地問題【解答一覧】.pdf',bdg:'a'},
    {t:'Part 1　問題',       f:'愛玩動物看護師国家試験完全攻略 _1_予想問題_2_実地問題パート1.pdf',bdg:'q'},
    {t:'Part 1　解答・解説', f:'愛玩動物看護師国家試験完全攻略 _1_予想問題_2_実地問題パート1【解答・解説】.pdf',bdg:'a'},
    {t:'Part 2　問題',       f:'愛玩動物看護師国家試験完全攻略 _1_予想問題_2_実地問題パート2.pdf',bdg:'q'},
    {t:'Part 2　解答・解説', f:'愛玩動物看護師国家試験完全攻略 _1_予想問題_2_実地問題パート2【解答・解説】.pdf',bdg:'a'},
    {t:'Part 3　問題',       f:'愛玩動物看護師国家試験完全攻略 _1_予想問題_2_実地問題パート3.pdf',bdg:'q'},
    {t:'Part 3　解答・解説', f:'愛玩動物看護師国家試験完全攻略 _1_予想問題_2_実地問題パート3【解答・解説】.pdf',bdg:'a'},
  ]},
  {cat:'一般問題',cls:'o',items:[
    {t:'解答一覧',           f:'愛玩動物看護師国家試験完全攻略 _1_予想問題_3_一般問題【解答一覧】.pdf',bdg:'a'},
    {t:'Part 1　問題',       f:'愛玩動物看護師国家試験完全攻略 _1_予想問題_3_一般問題パート1.pdf',bdg:'q'},
    {t:'Part 1　解答・解説', f:'愛玩動物看護師国家試験完全攻略 _1_予想問題_3_一般問題パート1【解答・解説】.pdf',bdg:'a'},
    {t:'Part 2　問題',       f:'愛玩動物看護師国家試験完全攻略 _1_予想問題_3_一般問題パート2.pdf',bdg:'q'},
    {t:'Part 2　解答・解説', f:'愛玩動物看護師国家試験完全攻略 _1_予想問題_3_一般問題パート2【解答・解説】.pdf',bdg:'a'},
    {t:'Part 3　問題',       f:'愛玩動物看護師国家試験完全攻略 _1_予想問題_3_一般問題パート3.pdf',bdg:'q'},
    {t:'Part 3　解答・解説', f:'愛玩動物看護師国家試験完全攻略 _1_予想問題_3_一般問題パート3【解答・解説】.pdf',bdg:'a'},
  ]},
];

const ICON_CLR={b:'#2b4a82',g:'#3d6b4f',r:'#c4553a',o:'#9a6e14'};
function piSvg(c){
  return `<svg viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`;
}

let bookTab='t';
function setBookTab(tab){
  bookTab=tab;
  ['t','r','s'].forEach(t=>{
    const el=document.getElementById('btab-'+t);
    if(el) el.classList.toggle('on',tab===t);
  });
  renderBookContent();
}

function renderBookContent(){
  if(bookTab==='t'){
    setHdr('PDF一覧');
    document.getElementById('book-content').innerHTML=
      '<div class="pcl" style="margin-top:4px">必携テキスト</div>'+
      TEXTBOOK_DATA.map(sec=>{
        const clr=ICON_CLR[sec.cls];
        return `<div class="pcl">${sec.cat}</div>`+
          sec.items.map(item=>{
            const url=pdfUrl(TB_FOLDER,item.f);
            return `<button class="pdf-row" onclick="openPdf('${url}')">
              <div class="pi ${sec.cls}">${piSvg(clr)}</div>
              <div style="flex:1;min-width:0"><div class="pt">${item.t}</div><div class="ps">PDFを開く</div></div>
            </button>`;
          }).join('');
      }).join('')+
      '<div class="pcl" style="margin-top:20px">予想問題集 2026</div>'+
      MONDAI_DATA.map(sec=>{
        const clr=ICON_CLR[sec.cls];
        return `<div class="pcl">${sec.cat}</div>`+
          sec.items.map(item=>{
            const url=pdfUrl(MB_FOLDER,item.f);
            const bdg=item.bdg?`<span class="pbdg ${item.bdg}">${item.bdg==='q'?'問題':'解説'}</span>`:'';
            return `<button class="pdf-row" onclick="openPdf('${url}')">
              <div class="pi ${sec.cls}">${piSvg(clr)}</div>
              <div style="flex:1;min-width:0"><div class="pt">${item.t}</div><div class="ps">PDFを開く</div></div>
              ${bdg}
            </button>`;
          }).join('');
      }).join('');
  } else if(bookTab==='r'){
    setHdr('本文閲覧');
    renderChapterList();
  } else {
    setHdr('テキスト検索');
    renderSearchTab();
  }
}

function renderChapterList(){
  if(!TEXT_DATA){
    document.getElementById('book-content').innerHTML='<div class="tr-empty">読み込み中...</div>';
    loadTextData().then(()=>renderChapterList());
    return;
  }
  const cats={};
  TEXT_DATA.books.forEach(b=>{
    if(!cats[b.category]) cats[b.category]={cls:catCls(b.category),items:[]};
    cats[b.category].items.push(b);
  });
  document.getElementById('book-content').innerHTML=Object.entries(cats).map(([cat,{cls,items}])=>
    `<div class="pcl">${cat}</div>`+
    items.map(b=>`<button class="tr-chapter-row" onclick="openChapter('${b.id}')">
      <div class="pi ${cls}">${piSvg(ICON_CLR[cls])}</div>
      <div style="flex:1;min-width:0"><div class="pt">${b.title}</div><div class="ps">${b.pages.length}ページ</div></div>
      <span class="tr-ch-badge">${b.id}</span>
    </button>`).join('')
  ).join('');
}

function catCls(cat){
  if(cat.includes('基礎動物学')) return 'b';
  if(cat.includes('基礎動物看護')) return 'g';
  if(cat.includes('臨床')) return 'r';
  return 'o';
}

function renderSearchTab(){
  document.getElementById('book-content').innerHTML=`
    <div class="tr-search-wrap">
      <input class="tr-search" id="tr-search-input" type="search" placeholder="キーワードを入力…" oninput="onSearchInput(this.value)">
      <svg class="tr-search-ico" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
    </div>
    <div id="tr-search-results"><div class="tr-empty">キーワードを入力してください</div></div>`;
}

let searchTimer=null;
function onSearchInput(q){
  clearTimeout(searchTimer);
  if(q.length<2){
    document.getElementById('tr-search-results').innerHTML='<div class="tr-empty">2文字以上入力してください</div>';
    return;
  }
  searchTimer=setTimeout(()=>doSearch(q),300);
}

function doSearch(q){
  if(!TEXT_DATA){
    loadTextData().then(()=>doSearch(q));
    return;
  }
  const kw=q.trim();
  const results=[];
  TEXT_DATA.books.forEach(b=>{
    b.pages.forEach(pg=>{
      if(pg.text.includes(kw)){
        const idx=pg.text.indexOf(kw);
        const start=Math.max(0,idx-60);
        const snippet=pg.text.slice(start,idx+80).replace(/\n/g,' ');
        results.push({bookId:b.id,title:b.title,page:pg.p,snippet,kw});
      }
    });
  });
  const el=document.getElementById('tr-search-results');
  if(!results.length){
    el.innerHTML='<div class="tr-empty">「'+esc(kw)+'」は見つかりませんでした</div>';
    return;
  }
  el.innerHTML=results.slice(0,50).map(r=>{
    const hi=r.snippet.replace(new RegExp(esc(r.kw),'g'),`<mark>${esc(r.kw)}</mark>`);
    return `<button class="tr-result-item" onclick="openChapterPage('${r.bookId}',${r.page})">
      <div class="tr-result-title">${esc(r.title)} — p.${r.page}</div>
      <div class="tr-result-snippet">…${hi}…</div>
    </button>`;
  }).join('')+(results.length>50?`<div class="tr-empty">${results.length}件中50件表示</div>`:'');
}

function esc(s){return s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}

// ===== TEXT READER =====
let TEXT_DATA=null;
let trBook=null, trPageIdx=0;

async function loadTextData(){
  if(TEXT_DATA) return;
  try{
    const r=await fetch('text_data.json');
    TEXT_DATA=await r.json();
  }catch(e){TEXT_DATA={books:[]};}
}

function openChapter(bookId){
  if(!TEXT_DATA){loadTextData().then(()=>openChapter(bookId));return;}
  trBook=TEXT_DATA.books.find(b=>b.id===bookId);
  if(!trBook) return;
  trPageIdx=0;
  showScreen('s-tread');
  renderTrPage();
}

function openChapterPage(bookId,page){
  if(!TEXT_DATA){loadTextData().then(()=>openChapterPage(bookId,page));return;}
  trBook=TEXT_DATA.books.find(b=>b.id===bookId);
  if(!trBook) return;
  trPageIdx=trBook.pages.findIndex(p=>p.p===page);
  if(trPageIdx<0) trPageIdx=0;
  showScreen('s-tread');
  renderTrPage();
}

function renderTrPage(){
  if(!trBook) return;
  const pg=trBook.pages[trPageIdx];
  document.getElementById('tr-cat').textContent=trBook.category;
  document.getElementById('tr-title').textContent=trBook.title;
  document.getElementById('tr-pagenum').textContent=`${trPageIdx+1} / ${trBook.pages.length}ページ（p.${pg.p}）`;
  document.getElementById('tr-body').textContent=pg.text;
  document.getElementById('tr-prev').disabled=trPageIdx===0;
  document.getElementById('tr-next').disabled=trPageIdx===trBook.pages.length-1;
  setHdr(trBook.title);
}

function trPage(dir){
  trPageIdx=Math.max(0,Math.min(trBook.pages.length-1,trPageIdx+dir));
  renderTrPage();
  window.scrollTo(0,0);
}

function openPdf(url){window.open(url,'_blank');}

// ===== INIT =====
(async()=>{
  await loadStore();
  prevLevel=getKarinLevel().lv;
  buildExamSel(); buildQSel(); buildFSel();
  syncShuffleChecks();
  updateHome();
  showScreen('s-home');
  await loadYosoData();
  updateHome();
})();
