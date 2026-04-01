// ═══════════════════════════════════════════════════════
//  CONSTANTS
// ═══════════════════════════════════════════════════════
const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const MONTHS_SHORT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const DEFAULT_CATS = ['Restaurante','Mercado','Alimentação','Transporte','Saúde','Assinaturas','Lazer','Outros'];
const PAY_METHODS = ['Débito','Crédito','Dinheiro','PIX'];
const INV_TYPES = ['Renda Variável','Reserva de Emergência','Meta','Renda Fixa'];

// ═══════════════════════════════════════════════════════
//  STORAGE
// ═══════════════════════════════════════════════════════
const LS = {
  get: (k, def) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : def; } catch { return def; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch(e) { console.warn('LS write failed', e); } },
  del: (k) => { try { localStorage.removeItem(k); } catch {} },
};

const lsKey = (type, year) => `fin_${type}_v5_${year}`;

// ═══════════════════════════════════════════════════════
//  MIGRATION (v4 → v5)
// ═══════════════════════════════════════════════════════
function migrateOldData() {
  const oldData  = LS.get('fin2025_data_v4',  null);
  const oldGoals = LS.get('fin2025_goals_v4', null);
  const oldName  = LS.get('fin2025_name_v4',  null);
  if (oldData  && !LS.get(lsKey('data',  2025), null)) LS.set(lsKey('data',  2025), oldData);
  if (oldGoals && !LS.get(lsKey('goals', 2025), null)) LS.set(lsKey('goals', 2025), oldGoals);
  if (oldName  && !LS.get('fin_name_v5',         null)) LS.set('fin_name_v5', oldName);
}
migrateOldData();

// ═══════════════════════════════════════════════════════
//  DEFAULT DATA
// ═══════════════════════════════════════════════════════
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 5);

function defaultMonthData(m, year) {
  const y = year || new Date().getFullYear();
  if (m !== 0) return { entradas: [], gastos: [], contas: [], reservas: [] };
  return {
    entradas: [
      { id: uid(), nome: 'Salário',              valor: 3100 },
      { id: uid(), nome: 'Venda notebook velho', valor: 200  },
    ],
    gastos: [
      { id: uid(), categoria: 'Restaurante',  forma: 'Débito',  valor: 130,  data: `01/01/${y}`, essencial: false },
      { id: uid(), categoria: 'Mercado',      forma: 'Crédito', valor: 240,  data: `02/01/${y}`, essencial: true  },
      { id: uid(), categoria: 'Alimentação',  forma: 'Débito',  valor: 98.9, data: `03/01/${y}`, essencial: true  },
      { id: uid(), categoria: 'Transporte',   forma: 'Débito',  valor: 162,  data: `04/01/${y}`, essencial: true  },
      { id: uid(), categoria: 'Assinaturas',  forma: 'Crédito', valor: 240,  data: `05/01/${y}`, essencial: false },
      { id: uid(), categoria: 'Saúde',        forma: 'Débito',  valor: 858,  data: `10/01/${y}`, essencial: true  },
    ],
    contas: [
      { id: uid(), nome: 'Luz',      planejado: 320, valor: 236.9, dataPago: `01/01/${y}`, pago: true  },
      { id: uid(), nome: 'Água',     planejado: 240, valor: 210,   dataPago: `02/01/${y}`, pago: true  },
      { id: uid(), nome: 'Internet', planejado: 120, valor: 120,   dataPago: `02/01/${y}`, pago: true  },
      { id: uid(), nome: 'Gás',      planejado: 80,  valor: 75,    dataPago: `03/01/${y}`, pago: false },
    ],
    reservas: [
      { id: uid(), nome: 'MXRF11',     tipo: 'Renda Variável',        valor: 200, data: `01/01/${y}` },
      { id: uid(), nome: 'Emergência', tipo: 'Reserva de Emergência', valor: 350, data: `02/01/${y}` },
      { id: uid(), nome: 'Carro',      tipo: 'Meta',                  valor: 450, data: `02/01/${y}` },
    ],
  };
}

function defaultAllData(year) {
  const d = {};
  for (let i = 0; i < 12; i++) d[i] = defaultMonthData(i, year);
  return d;
}

function defaultGoals()    { return { emergencia: { meta: 2000 }, custom: [] }; }
function defaultSettings() { return { categories: [...DEFAULT_CATS] }; }

// ═══════════════════════════════════════════════════════
//  STATE
// ═══════════════════════════════════════════════════════
const STATE = {
  year:     new Date().getFullYear(),
  month:    new Date().getMonth(),
  name:     LS.get('fin_name_v5', 'Você'),
  data:     null,
  goals:    null,
  settings: LS.get('fin_settings_v5', null) || defaultSettings(),
};

function loadYear(year) {
  STATE.year = year;
  const raw = LS.get(lsKey('data', year), null);
  if (raw) {
    STATE.data = raw;
    for (let i = 0; i < 12; i++) {
      if (!STATE.data[i]) STATE.data[i] = { entradas: [], gastos: [], contas: [], reservas: [] };
      ['entradas','gastos','contas','reservas'].forEach(k => { if (!STATE.data[i][k]) STATE.data[i][k] = []; });
    }
  } else {
    STATE.data = defaultAllData(year);
    LS.set(lsKey('data', year), STATE.data);
  }
  STATE.goals = LS.get(lsKey('goals', year), null) || defaultGoals();
}

loadYear(STATE.year);

const save         = () => LS.set(lsKey('data',  STATE.year), STATE.data);
const saveGoals    = () => LS.set(lsKey('goals', STATE.year), STATE.goals);
const saveName     = () => LS.set('fin_name_v5',     STATE.name);
const saveSettings = () => LS.set('fin_settings_v5', STATE.settings);

const D = () => STATE.data[STATE.month];

// ═══════════════════════════════════════════════════════
//  MATH
// ═══════════════════════════════════════════════════════
const fmt = v => (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtShort = v => {
  const abs = Math.abs(v || 0);
  if (abs >= 1000) return (v < 0 ? '-' : '') + 'R$' + (abs / 1000).toFixed(1) + 'k';
  return fmt(v);
};

const sum   = arr => arr.reduce((a, r) => a + (r.valor || 0), 0);
const sumE  = ()  => sum(D().entradas);
const sumG  = ()  => sum(D().gastos);
const sumC  = ()  => sum(D().contas);
const sumR  = ()  => sum(D().reservas);
const sumDeb  = () => sum(D().gastos.filter(g => g.forma === 'Débito'));
const sumCred = () => sum(D().gastos.filter(g => g.forma === 'Crédito'));
const netBalance = () => sumE() - sumG() - sumR();

function prevMonthSum(field, filter) {
  if (STATE.month === 0) return 0;
  const arr = STATE.data[STATE.month - 1][field] || [];
  return sum(filter ? arr.filter(filter) : arr);
}

function monthTotals(mi) {
  const md = STATE.data[mi];
  const e = sum(md.entradas), g = sum(md.gastos), r = sum(md.reservas);
  return { e, g, r, net: e - g - r };
}

// ═══════════════════════════════════════════════════════
//  INIT
// ═══════════════════════════════════════════════════════
function init() {
  const now = new Date();
  document.getElementById('tb-date').textContent = now.toLocaleDateString('pt-BR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  document.getElementById('g-date-small').textContent = `Hoje é ${now.toLocaleDateString('pt-BR')}`;

  buildMonthTabs();
  updateYearDisplay();
  updateNameDisplay();
  renderAll();

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
    if (e.key === 'Enter' && document.getElementById('overlay').classList.contains('open')) saveModal();
  });
}

function buildMonthTabs() {
  const wrap = document.getElementById('mtabs');
  wrap.innerHTML = '';
  MONTHS.forEach((m, i) => {
    const t = document.createElement('div');
    t.className = 'mtab' + (i === STATE.month ? ' active' : '');
    t.textContent = m;
    t.onclick = () => { STATE.month = i; activateTab(i); renderAll(); };
    wrap.appendChild(t);
  });
}

function activateTab(i) {
  document.querySelectorAll('.mtab').forEach((t, idx) => t.classList.toggle('active', idx === i));
}

function updateYearDisplay() {
  document.getElementById('tb-year').textContent   = STATE.year;
  document.getElementById('brand-year').textContent = STATE.year;
  document.getElementById('annual-year').textContent = STATE.year;
  document.title = `Organização Financeira ${STATE.year}`;
}

function updateNameDisplay() {
  document.getElementById('tb-name').textContent = STATE.name;
  document.getElementById('g-name').textContent  = STATE.name;
}

function changeYear(delta) {
  const next = STATE.year + delta;
  if (next < 2020 || next > 2040) return;
  loadYear(next);
  updateYearDisplay();
  buildMonthTabs();
  renderAll();
  toast(`📅 Exibindo ${next}`);
}

function switchMonth(i) {
  STATE.month = i;
  activateTab(i);
  renderAll();
  document.querySelector('.mtabs').querySelectorAll('.mtab')[i]
    .scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
}

// ═══════════════════════════════════════════════════════
//  RENDER ALL
// ═══════════════════════════════════════════════════════
let _donut = null, _fluxo = null, _alloc = null, _trend = null;

function renderAll() {
  document.getElementById('g-month').textContent = `Organização de ${MONTHS[STATE.month]} ${STATE.year}`;
  rSummary();
  rAnnual();
  rGoals();
  rDonut();
  rFluxo();
  rAlloc();
  rTrend();
  rEntradas();
  rGastos();
  rContas();
  rReservas();
}

// ─── SUMMARY CARDS ────────────────────────────────────
function rSummary() {
  const ent = sumE(), gas = sumG(), res = sumR(), deb = sumDeb(), cred = sumCred(), net = netBalance();
  const cards = [
    { label: 'Total | Entradas',                val: ent,  prev: prevMonthSum('entradas'), dot: 'g' },
    { label: 'Total | Saídas',                  val: gas,  prev: prevMonthSum('gastos'),   dot: 'r', neg: true },
    { label: 'Total | Reservas & Investimentos', val: res,  prev: prevMonthSum('reservas'), dot: 'a' },
    { label: 'Uso do Débito',                   val: deb,  prev: prevMonthSum('gastos', g => g.forma === 'Débito') },
    { label: 'Uso do Crédito',                  val: cred, prev: prevMonthSum('gastos', g => g.forma === 'Crédito'), alert: cred > 0 },
    { label: 'Saldo Líquido',                   val: net,  dot: net >= 0 ? 'g' : 'r', neg: net < 0, isNet: true },
  ];
  document.getElementById('sc-grid').innerHTML = cards.map(c => `
    <div class="sc${c.alert ? ' alert-card' : ''}${c.isNet ? ' net-card' : ''}">
      ${c.dot ? `<div class="sc-dot ${c.dot}"></div>` : ''}
      <div class="sc-label">${c.label}</div>
      <div class="sc-val${c.neg ? ' neg' : ''}">${fmt(c.val)}</div>
      ${c.prev !== undefined ? `<div class="sc-prev">Mês anterior: ${fmt(c.prev)}</div>` : ''}
      ${c.alert ? `<div class="sc-alert">⚠️ Verifique o saldo do crédito</div>` : ''}
    </div>`).join('');
}

// ─── ANNUAL OVERVIEW ──────────────────────────────────
function rAnnual() {
  let yearE = 0, yearG = 0, yearR = 0, yearNet = 0;
  const rows = MONTHS.map((m, i) => {
    const t = monthTotals(i);
    yearE += t.e; yearG += t.g; yearR += t.r; yearNet += t.net;
    const isActive = i === STATE.month;
    const hasData  = t.e > 0 || t.g > 0 || t.r > 0;
    return `<div class="annual-row${isActive ? ' active' : ''}${!hasData ? ' empty-month' : ''}" onclick="switchMonth(${i})">
      <div class="annual-month">${MONTHS_SHORT[i]}</div>
      <div class="annual-val g">${hasData ? fmtShort(t.e) : '—'}</div>
      <div class="annual-val r">${hasData ? fmtShort(t.g) : '—'}</div>
      <div class="annual-val a">${hasData ? fmtShort(t.r) : '—'}</div>
      <div class="annual-val ${t.net >= 0 ? 'g' : 'r'}">${hasData ? fmtShort(t.net) : '—'}</div>
    </div>`;
  }).join('');

  document.getElementById('annual-table').innerHTML = `
    <div class="annual-header">
      <div class="annual-month">Mês</div>
      <div class="annual-val">Entradas</div>
      <div class="annual-val">Gastos</div>
      <div class="annual-val">Reservas</div>
      <div class="annual-val">Saldo</div>
    </div>
    ${rows}
    <div class="annual-total">
      <div class="annual-month">Total</div>
      <div class="annual-val g">${fmtShort(yearE)}</div>
      <div class="annual-val r">${fmtShort(yearG)}</div>
      <div class="annual-val a">${fmtShort(yearR)}</div>
      <div class="annual-val ${yearNet >= 0 ? 'g' : 'r'}">${fmtShort(yearNet)}</div>
    </div>`;
}

// ─── GOALS ────────────────────────────────────────────
function rGoals() {
  const g = STATE.goals;
  let totalEmerg = 0;
  for (let i = 0; i < 12; i++) {
    totalEmerg += sum((STATE.data[i].reservas || []).filter(r =>
      r.tipo === 'Reserva de Emergência' || r.nome.toLowerCase().includes('emerg')));
  }
  const emMeta = g.emergencia.meta || 0;
  const emPct  = emMeta > 0 ? Math.min(100, (totalEmerg / emMeta) * 100) : 0;
  const emThisMonth = sum(D().reservas.filter(r =>
    r.tipo === 'Reserva de Emergência' || r.nome.toLowerCase().includes('emerg')));

  let html = `
    <div class="goal-section-label">🆘 Reserva de Emergência</div>
    <div class="goal-edit-row">
      <span class="goal-edit-label">Meta:</span>
      <input class="goal-edit-input" type="number" value="${emMeta}" min="0" step="100"
        onchange="updateEmergMeta(this.value)" placeholder="2000">
    </div>
    <div class="goal-header">
      <span class="goal-name">Progresso</span>
      <span class="goal-pct">${emPct.toFixed(1)}%</span>
    </div>
    <div class="goal-bar"><div class="goal-fill" style="width:${emPct}%"></div></div>
    <div class="goal-details">
      <div class="gd">Meta: <span>${fmt(emMeta)}</span></div>
      <div class="gd">Total: <span>${fmt(totalEmerg)}</span></div>
      <div class="gd">Este mês: <span>${fmt(emThisMonth)}</span></div>
      <div class="gd">Faltam: <span>${fmt(Math.max(0, emMeta - totalEmerg))}</span></div>
    </div>`;

  g.custom.forEach((goal, i) => {
    let tot = 0;
    const nm = goal.nome.toLowerCase();
    for (let mi = 0; mi < 12; mi++) {
      tot += sum((STATE.data[mi].reservas || []).filter(r => r.nome.toLowerCase() === nm));
    }
    const pct   = goal.meta > 0 ? Math.min(100, (tot / goal.meta) * 100) : 0;
    const thisM = sum(D().reservas.filter(r => r.nome.toLowerCase() === nm));
    html += `
      <div class="goal-sep"></div>
      <div class="goal-section-label">
        <span>🎯 ${goal.nome}</span>
        <button onclick="removeGoal(${i})" style="background:none;border:none;cursor:pointer;color:var(--red);font-size:13px;line-height:1;padding:0 2px">✕</button>
      </div>
      <div class="goal-edit-row">
        <span class="goal-edit-label">Meta:</span>
        <input class="goal-edit-input" type="number" value="${goal.meta}" min="0" step="100"
          onchange="updateCustomMeta(${i}, this.value)" placeholder="0">
      </div>
      <div class="goal-header">
        <span class="goal-name">Progresso</span>
        <span class="goal-pct">${pct.toFixed(1)}%</span>
      </div>
      <div class="goal-bar"><div class="goal-fill" style="width:${pct}%"></div></div>
      <div class="goal-details">
        <div class="gd">Meta: <span>${fmt(goal.meta)}</span></div>
        <div class="gd">Total: <span>${fmt(tot)}</span></div>
        <div class="gd">Este mês: <span>${fmt(thisM)}</span></div>
        <div class="gd">Faltam: <span>${fmt(Math.max(0, goal.meta - tot))}</span></div>
      </div>`;
  });

  html += `<button class="add-goal-btn" onclick="openModal('meta')">＋ Nova meta de poupança</button>`;
  document.getElementById('goals-inner').innerHTML = html;
}

function updateEmergMeta(v)     { STATE.goals.emergencia.meta = parseFloat(v) || 0; saveGoals(); rGoals(); }
function updateCustomMeta(i, v) { STATE.goals.custom[i].meta  = parseFloat(v) || 0; saveGoals(); rGoals(); }
function removeGoal(i)          { STATE.goals.custom.splice(i, 1); saveGoals(); rGoals(); toast('🗑 Meta removida'); }

// ─── DONUT ────────────────────────────────────────────
function rDonut() {
  const gasto = sumG() + sumR();
  const rest  = Math.max(0, sumE() - gasto);
  document.getElementById('donut-val').textContent = fmt(rest);
  const ctx = document.getElementById('donutChart').getContext('2d');
  if (_donut) _donut.destroy();
  _donut = new Chart(ctx, {
    type: 'doughnut',
    data: { datasets: [{ data: [gasto, rest], backgroundColor: ['#227068','#e5e7eb'], borderWidth: 0, hoverOffset: 4 }] },
    options: {
      cutout: '72%',
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => ' ' + fmt(c.raw) } } },
      animation: { duration: 700 },
    },
  });
}

// ─── TREND (evolução mensal anual) ────────────────────
function rTrend() {
  const ctx = document.getElementById('trendChart').getContext('2d');
  if (_trend) _trend.destroy();
  const entradas = [], gastos = [], reservas = [];
  for (let i = 0; i < 12; i++) {
    const t = monthTotals(i);
    entradas.push(t.e); gastos.push(t.g); reservas.push(t.r);
  }
  _trend = new Chart(ctx, {
    type: 'line',
    data: {
      labels: MONTHS_SHORT,
      datasets: [
        { label: 'Entradas', data: entradas, borderColor: '#3db87a', backgroundColor: 'rgba(61,184,122,.08)', tension: .35, pointRadius: 3, fill: true  },
        { label: 'Gastos',   data: gastos,   borderColor: '#e05252', backgroundColor: 'rgba(224,82,82,.06)',  tension: .35, pointRadius: 3, fill: true  },
        { label: 'Reservas', data: reservas, borderColor: '#4db8ae', backgroundColor: 'rgba(77,184,174,.06)', tension: .35, pointRadius: 3, fill: false },
      ],
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        y: { grid: { color: '#f0fafa' }, ticks: { font: { size: 9 }, callback: v => fmtShort(v) } },
        x: { grid: { display: false },  ticks: { font: { size: 10 } } },
      },
      animation: { duration: 600 },
    },
  });
}

// ─── FLUXO ────────────────────────────────────────────
function rFluxo() {
  const ctx = document.getElementById('fluxoChart').getContext('2d');
  if (_fluxo) _fluxo.destroy();
  const contas = D().contas.slice(0, 7);
  if (!contas.length) { ctx.clearRect(0, 0, 9999, 9999); return; }
  _fluxo = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: contas.map(c => c.nome),
      datasets: [
        { label: 'Planejado', data: contas.map(c => c.planejado), backgroundColor: '#227068', borderRadius: 4 },
        { label: 'Real',      data: contas.map(c => c.valor),     backgroundColor: '#80cfc8', borderRadius: 4 },
      ],
    },
    options: {
      indexAxis: 'y',
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: '#f0fafa' }, ticks: { font: { size: 9 } } },
        y: { grid: { display: false },   ticks: { font: { size: 10, weight: '600' } } },
      },
      animation: { duration: 600 },
    },
  });
}

// ─── ALLOC ────────────────────────────────────────────
function rAlloc() {
  const ctx = document.getElementById('allocChart').getContext('2d');
  if (_alloc) _alloc.destroy();
  const cats = {};
  D().gastos.forEach(g => { cats[g.categoria] = (cats[g.categoria] || 0) + g.valor; });
  const labels = Object.keys(cats), vals = Object.values(cats);
  if (!labels.length) { ctx.clearRect(0, 0, 9999, 9999); return; }
  const colors = ['#0d3b38','#1a5c56','#2a857c','#4db8ae','#80cfc8','#b3e4e0','#329990','#227068'];
  _alloc = new Chart(ctx, {
    type: 'bar',
    data: { labels, datasets: [{ data: vals, backgroundColor: colors.slice(0, labels.length), borderRadius: 4 }] },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        y: { grid: { color: '#f0fafa' }, ticks: { font: { size: 9 } } },
        x: { grid: { display: false },  ticks: { font: { size: 9 }, maxRotation: 28 } },
      },
      animation: { duration: 600 },
    },
  });
}

// ─── TAG HELPERS ──────────────────────────────────────
const catCls = { Restaurante:'rest', Mercado:'merc', Alimentação:'alim', Transporte:'trans', Saúde:'sau', Assinaturas:'ass', Lazer:'laz' };
function catTag(c) { const cl = catCls[c] || 'out'; return `<span class="tag t-${cl}">${c}</span>`; }

const payCls = { Débito:'deb', Crédito:'cred', Dinheiro:'din', PIX:'pix' };
function payTag(p) { const cl = payCls[p] || 'deb'; return `<span class="tag t-${cl}">${p}</span>`; }

const invCls   = { 'Renda Variável':'rv', 'Reserva de Emergência':'res', 'Meta':'meta', 'Renda Fixa':'rf' };
const invShort = { 'Renda Variável':'Renda Var.', 'Reserva de Emergência':'Reserva Em.', 'Meta':'Meta', 'Renda Fixa':'Renda Fix.' };
function invTag(t) { const cl = invCls[t] || 'rv'; return `<span class="tag t-${cl}">${invShort[t] || t}</span>`; }

// ─── TABLE: ENTRADAS ──────────────────────────────────
function rEntradas() {
  const total = sumE();
  document.getElementById('t-entradas').innerHTML = D().entradas.length
    ? D().entradas.map(e => `
      <div class="tr" style="grid-template-columns:1.8fr 1fr .8fr 18px">
        <div class="tr-name" title="${e.nome}">${e.nome}</div>
        <div class="tr-val">${fmt(e.valor)}</div>
        <div class="tr-pct">${total > 0 ? ((e.valor / total) * 100).toFixed(1) + '%' : '—'}</div>
        <button class="del-btn" onclick="delItem('entradas','${e.id}')">✕</button>
      </div>`).join('')
    : '<div class="empty-row">Nenhuma entrada cadastrada</div>';
  document.getElementById('tot-ent').textContent = fmt(total);
}

// ─── TABLE: GASTOS ────────────────────────────────────
function rGastos() {
  const total = sumG();
  document.getElementById('t-gastos').innerHTML = D().gastos.length
    ? D().gastos.map(g => `
      <div class="tr" style="grid-template-columns:1.1fr .95fr .9fr .85fr 22px 18px">
        <div>${catTag(g.categoria)}</div>
        <div>${payTag(g.forma)}</div>
        <div class="tr-val r">${fmt(g.valor)}</div>
        <div class="tr-date">${g.data}</div>
        <div><span class="ess-dot ${g.essencial ? 'y' : 'n'}"></span></div>
        <button class="del-btn" onclick="delItem('gastos','${g.id}')">✕</button>
      </div>`).join('')
    : '<div class="empty-row">Nenhum gasto cadastrado</div>';
  document.getElementById('tot-gas').textContent = fmt(total);
}

// ─── TABLE: CONTAS ────────────────────────────────────
function rContas() {
  const total = sumC();
  document.getElementById('t-contas').innerHTML = D().contas.length
    ? D().contas.map(c => `
      <div class="tr" style="grid-template-columns:1.1fr .9fr .9fr .9fr 18px;cursor:pointer" onclick="togglePago('${c.id}')">
        <div class="tr-name" title="${c.nome}">${c.nome}</div>
        <div class="tr-val">${fmt(c.planejado)}</div>
        <div class="tr-val ${c.valor > c.planejado ? 'r' : 'g'}">${fmt(c.valor)}</div>
        <div class="tr-date">${c.dataPago}<br><span class="paid-chip ${c.pago ? 'y' : 'n'}">${c.pago ? '✓ Pago' : '⏳ Pend.'}</span></div>
        <button class="del-btn" onclick="event.stopPropagation();delItem('contas','${c.id}')">✕</button>
      </div>`).join('')
    : '<div class="empty-row">Nenhuma conta cadastrada</div>';
  document.getElementById('tot-con').textContent = fmt(total);
}

function togglePago(id) {
  const c = D().contas.find(x => x.id === id);
  if (c) { c.pago = !c.pago; save(); rContas(); toast(c.pago ? '✅ Marcada como paga' : '⏳ Marcada como pendente'); }
}

// ─── TABLE: RESERVAS ──────────────────────────────────
function rReservas() {
  const total = sumR();
  document.getElementById('t-reservas').innerHTML = D().reservas.length
    ? D().reservas.map(r => `
      <div class="tr" style="grid-template-columns:1.1fr .9fr .9fr .85fr 18px">
        <div class="tr-name" title="${r.nome}">${r.nome}</div>
        <div>${invTag(r.tipo)}</div>
        <div class="tr-val g">${fmt(r.valor)}</div>
        <div class="tr-date">${r.data}</div>
        <button class="del-btn" onclick="delItem('reservas','${r.id}')">✕</button>
      </div>`).join('')
    : '<div class="empty-row">Nenhuma reserva cadastrada</div>';
  document.getElementById('tot-res').textContent = fmt(total);
}

// ─── DELETE ───────────────────────────────────────────
function delItem(table, id) {
  const arr = D()[table];
  const idx = arr.findIndex(x => x.id === id);
  if (idx > -1) { arr.splice(idx, 1); save(); renderAll(); toast('🗑 Item removido'); }
}

// ═══════════════════════════════════════════════════════
//  MODAL
// ═══════════════════════════════════════════════════════
let _modalType = '';

const FORMS = {
  entrada: {
    title: '➕ Nova Entrada',
    fields: [
      { id: 'f-nome',  label: 'Nome',      type: 'text',   ph: 'Ex: Salário', req: true },
      { id: 'f-valor', label: 'Valor (R$)', type: 'number', ph: '0,00', step: '.01', req: true },
    ],
  },
  gasto: {
    title: '⬇️ Novo Gasto',
    fields: () => [
      { id: 'f-cat',      label: 'Categoria',          type: 'select', opts: STATE.settings.categories || DEFAULT_CATS },
      { id: 'f-forma',    label: 'Forma de pagamento',  type: 'select', opts: PAY_METHODS },
      { id: 'f-valor',    label: 'Valor (R$)',           type: 'number', ph: '0,00', step: '.01', req: true },
      { id: 'f-data',     label: 'Data',                 type: 'date' },
      { id: 'f-essencial', label: 'Essencial?',          type: 'select', opts: ['Sim', 'Não'] },
    ],
  },
  conta: {
    title: '🧾 Nova Conta',
    fields: [
      { id: 'f-nome',  label: 'Nome',                type: 'text',   ph: 'Ex: Luz', req: true },
      { id: 'f-plan',  label: 'Valor Planejado (R$)', type: 'number', ph: '0,00', step: '.01' },
      { id: 'f-valor', label: 'Valor Pago (R$)',      type: 'number', ph: '0,00', step: '.01', req: true },
      { id: 'f-data',  label: 'Data',                 type: 'date' },
      { id: 'f-pago',  label: 'Pago?',                type: 'select', opts: ['Sim', 'Não'] },
    ],
  },
  reserva: {
    title: '📈 Nova Reserva / Investimento',
    fields: [
      { id: 'f-nome',  label: 'Nome',      type: 'text',   ph: 'Ex: MXRF11', req: true },
      { id: 'f-tipo',  label: 'Tipo',      type: 'select', opts: INV_TYPES },
      { id: 'f-valor', label: 'Valor (R$)', type: 'number', ph: '0,00', step: '.01', req: true },
      { id: 'f-data',  label: 'Data',      type: 'date' },
    ],
  },
  meta: {
    title: '🎯 Nova Meta de Poupança',
    fields: [
      { id: 'f-nome',  label: 'Nome da meta',    type: 'text',   ph: 'Ex: Viagem, Carro...', req: true },
      { id: 'f-valor', label: 'Valor alvo (R$)', type: 'number', ph: '0,00', step: '.01', req: true },
    ],
  },
};

function openModal(type) {
  _modalType = type;
  const def    = FORMS[type];
  const fields = typeof def.fields === 'function' ? def.fields() : def.fields;
  document.getElementById('modal-title').textContent = def.title;
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('modal-form').innerHTML = fields.map(f => `
    <div class="fg">
      <label class="fl">${f.label}${f.req ? ' *' : ''}</label>
      ${f.type === 'select'
        ? `<select class="fs" id="${f.id}">${f.opts.map(o => `<option>${o}</option>`).join('')}</select>`
        : `<input class="fi" id="${f.id}" type="${f.type}"
            ${f.ph   ? `placeholder="${f.ph}"` : ''}
            ${f.step ? `step="${f.step}" min="0"` : ''}
            ${f.type === 'date' ? `value="${today}"` : ''}>`
      }
    </div>`).join('');
  document.getElementById('overlay').classList.add('open');
  setTimeout(() => { const el = document.getElementById(fields[0].id); if (el) el.focus(); }, 80);
}

function closeModal()    { document.getElementById('overlay').classList.remove('open'); }
function overlayClick(e) { if (e.target.id === 'overlay') closeModal(); }
function getVal(id)  { const el = document.getElementById(id); return el ? el.value : ''; }
function getNum(id)  { return parseFloat(getVal(id)) || 0; }
function isoToDisplay(iso) { if (!iso) return ''; const [y, m, d] = iso.split('-'); return `${d}/${m}/${y}`; }

function saveModal() {
  const d = D();
  if (_modalType === 'entrada') {
    const nome = getVal('f-nome').trim(), val = getNum('f-valor');
    if (!nome || !val) return shakeModal();
    d.entradas.push({ id: uid(), nome, valor: val });

  } else if (_modalType === 'gasto') {
    const val = getNum('f-valor');
    if (!val) return shakeModal();
    d.gastos.push({ id: uid(), categoria: getVal('f-cat'), forma: getVal('f-forma'), valor: val,
      data: isoToDisplay(getVal('f-data')), essencial: getVal('f-essencial') === 'Sim' });

  } else if (_modalType === 'conta') {
    const nome = getVal('f-nome').trim();
    if (!nome) return shakeModal();
    d.contas.push({ id: uid(), nome, planejado: getNum('f-plan'), valor: getNum('f-valor'),
      dataPago: isoToDisplay(getVal('f-data')), pago: getVal('f-pago') === 'Sim' });

  } else if (_modalType === 'reserva') {
    const nome = getVal('f-nome').trim(), val = getNum('f-valor');
    if (!nome || !val) return shakeModal();
    d.reservas.push({ id: uid(), nome, tipo: getVal('f-tipo'), valor: val, data: isoToDisplay(getVal('f-data')) });

  } else if (_modalType === 'meta') {
    const nome = getVal('f-nome').trim(), val = getNum('f-valor');
    if (!nome || !val) return shakeModal();
    STATE.goals.custom.push({ nome, meta: val });
    saveGoals(); closeModal(); rGoals(); toast('🎯 Meta criada!'); return;
  }
  save(); closeModal(); renderAll(); toast('✅ Salvo com sucesso!');
}

function shakeModal() {
  const m = document.querySelector('.modal');
  m.style.animation = 'none'; void m.offsetHeight; m.style.animation = 'shake .35s ease';
}

// ═══════════════════════════════════════════════════════
//  NAME EDIT
// ═══════════════════════════════════════════════════════
function editName() {
  const n = prompt('Digite seu nome:', STATE.name);
  if (n && n.trim()) { STATE.name = n.trim(); saveName(); updateNameDisplay(); toast('👤 Nome atualizado!'); }
}

// ═══════════════════════════════════════════════════════
//  EXPORT / IMPORT
// ═══════════════════════════════════════════════════════
function exportData() {
  const payload = {
    version:    5,
    year:       STATE.year,
    exportedAt: new Date().toISOString(),
    data:       STATE.data,
    goals:      STATE.goals,
    name:       STATE.name,
    settings:   STATE.settings,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const a    = document.createElement('a');
  a.href     = URL.createObjectURL(blob);
  a.download = `financas_${STATE.year}_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
  toast('📥 Dados exportados!');
}

function importData(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const payload = JSON.parse(e.target.result);
      if (!payload.data || !payload.year) throw new Error('Formato inválido');
      if (!confirm(`Importar dados de ${payload.year}?\nIsso substituirá os dados desse ano.`)) return;
      STATE.data = payload.data;
      loadYear(payload.year);
      if (payload.goals)    STATE.goals    = payload.goals;
      if (payload.name)     { STATE.name   = payload.name; }
      if (payload.settings) STATE.settings = payload.settings;
      save(); saveGoals(); saveName(); saveSettings();
      updateYearDisplay(); updateNameDisplay(); buildMonthTabs(); renderAll();
      toast('📤 Dados importados com sucesso!');
    } catch {
      toast('❌ Erro ao importar: arquivo inválido');
    }
    event.target.value = '';
  };
  reader.readAsText(file);
}

// ═══════════════════════════════════════════════════════
//  RESET
// ═══════════════════════════════════════════════════════
function confirmReset() {
  if (confirm(`⚠️ Apagar TODOS os dados de ${STATE.year}?\n\nEsta ação não pode ser desfeita.`)) {
    STATE.data  = defaultAllData(STATE.year);
    STATE.goals = defaultGoals();
    save(); saveGoals(); renderAll();
    toast('🗑 Todos os dados foram apagados');
  }
}

// ═══════════════════════════════════════════════════════
//  TOAST
// ═══════════════════════════════════════════════════════
let _toastTimer;
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg; el.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove('show'), 2800);
}

// ═══════════════════════════════════════════════════════
//  START
// ═══════════════════════════════════════════════════════
init();
