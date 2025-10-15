// === Supabase Setup ===
const SUPABASE_URL = window.SUPABASE_URL || (typeof process !== 'undefined' ? process.env.SUPABASE_URL : null) || "";
const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || (typeof process !== 'undefined' ? process.env.SUPABASE_ANON_KEY : null) || "";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// === Elements ===
const authSection = document.getElementById('auth-section');
const appSection = document.getElementById('app-section');
const userArea = document.getElementById('user-area');
const userEmailSpan = document.getElementById('user-email');
const btnLogout = document.getElementById('btn-logout');

const formLogin = document.getElementById('form-login');
const loginEmail = document.getElementById('login-email');
const loginPass = document.getElementById('login-pass');

const formSignup = document.getElementById('form-signup');
const signupName = document.getElementById('signup-name');
const signupEmail = document.getElementById('signup-email');
const signupPass = document.getElementById('signup-pass');

const vendorSelect = document.getElementById('vendor-select');
const vendorForm = document.getElementById('vendor-form');
const vendorName = document.getElementById('vendor-name');
const vendorIdnum = document.getElementById('vendor-idnum');
const vendorRole = document.getElementById('vendor-role');

const monthKeyInput = document.getElementById('month-key');
const targetValueInput = document.getElementById('target-value');
const btnSaveTarget = document.getElementById('btn-save-target');

const saleForm = document.getElementById('sale-form');
const saleDate = document.getElementById('sale-date');
const saleTotal = document.getElementById('sale-total');
const saleSku = document.getElementById('sale-sku');
const saleQty = document.getElementById('sale-qty');

const btnRefresh = document.getElementById('btn-refresh');
const chartCanvas = document.getElementById('sales-chart');
let salesChart = null;

let vendorsCache = [];

// === Auth ===
async function refreshSession() {
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    userEmailSpan.textContent = user.email;
    userArea.classList.remove('hidden');
    authSection.classList.add('hidden');
    appSection.classList.remove('hidden');
    await ensureProfile();
    await loadVendors();
    await refreshChart();
  } else {
    userArea.classList.add('hidden');
    authSection.classList.remove('hidden');
    appSection.classList.add('hidden');
  }
}

async function ensureProfile() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('profiles').upsert({ id: user.id, full_name: user.user_metadata?.full_name || null });
}

formLogin?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = loginEmail.value.trim();
  const password = loginPass.value.trim();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return alert(error.message);
  await refreshSession();
});

formSignup?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const full_name = signupName.value.trim();
  const email = signupEmail.value.trim();
  const password = signupPass.value.trim();
  const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name } } });
  if (error) return alert(error.message);
  alert('Revisa tu correo para confirmar la cuenta.');
});

btnLogout?.addEventListener('click', async () => {
  await supabase.auth.signOut();
  await refreshSession();
});

// === Vendors ===
async function loadVendors() {
  const { data, error } = await supabase.from('vendors').select('*').order('created_at', { ascending: true });
  if (error) { console.error(error); return; }
  vendorsCache = data || [];
  vendorSelect.innerHTML = vendorsCache.map(v => `<option value="${v.id}">${v.name}</option>`).join('');
}

vendorForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return alert('Inicia sesión.');
  const payload = {
    owner: user.id,
    name: vendorName.value.trim(),
    id_number: vendorIdnum.value.trim() || null,
    role: vendorRole.value.trim() || null,
  };
  const { data, error } = await supabase.from('vendors').insert(payload).select().single();
  if (error) return alert(error.message);
  vendorsCache.push(data);
  const opt = document.createElement('option');
  opt.value = data.id; opt.textContent = data.name;
  vendorSelect.appendChild(opt);
  vendorForm.reset();
});

// === Targets ===
btnSaveTarget?.addEventListener('click', async () => {
  const vendorId = vendorSelect.value;
  const monthKey = (monthKeyInput.value || '').trim();
  const target = Number(targetValueInput.value) || 0;
  if (!vendorId || !monthKey) return alert('Selecciona vendor y mes.');
  const { error } = await supabase.from('targets').upsert({ vendor_id: vendorId, month_key: monthKey, target_sales: target });
  if (error) return alert(error.message);
  alert('Meta guardada.');
});

// === Sales ===
saleForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const vendorId = vendorSelect.value;
  const date = saleDate.value;
  const total = Number(saleTotal.value) || 0;
  const sku = saleSku.value.trim();
  const qty = Number(saleQty.value) || 0;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return alert('Inicia sesión.');
  const { data: sale, error: e1 } = await supabase
    .from('sales')
    .insert({ user_id: user.id, vendor_id: vendorId, sale_date: date, total_amount: total })
    .select().single();
  if (e1) return alert(e1.message);

  if (sku && qty > 0) {
    const { error: e2 } = await supabase.from('sale_items').insert([{ sale_id: sale.id, sku, quantity: qty }]);
    if (e2) return alert(e2.message);
  }

  saleForm.reset();
  await refreshChart();
});

btnRefresh?.addEventListener('click', refreshChart);

async function refreshChart() {
  const vendorId = vendorSelect.value;
  const monthKey = (monthKeyInput.value || '').trim() || defaultMonthKey();
  monthKeyInput.value = monthKey;

  const [mStr, yStr] = monthKey.split('-');
  const m = Number(mStr), y = Number(yStr);
  const start = new Date(y, m - 1, 1).toISOString().slice(0, 10);
  const end = new Date(y, m, 0).toISOString().slice(0, 10);

  const { data: sales, error } = await supabase
    .from('sales')
    .select('sale_date,total_amount')
    .gte('sale_date', start).lte('sale_date', end)
    .eq('vendor_id', vendorId)
    .order('sale_date', { ascending: true });
  if (error) { console.error(error); return; }

  const byDay = {};
  sales?.forEach(s => {
    byDay[s.sale_date] = (byDay[s.sale_date] || 0) + Number(s.total_amount || 0);
  });
  const labels = Object.keys(byDay).sort();
  const values = labels.map(d => byDay[d]);

  if (salesChart) { salesChart.destroy(); }
  salesChart = new Chart(chartCanvas, {
    type: 'line',
    data: { labels, datasets: [{ label: 'Ventas (COP)', data: values }] },
    options: { responsive: true, maintainAspectRatio: false }
  });
}

function defaultMonthKey() {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yyyy = now.getFullYear();
  return `${mm}-${yyyy}`;
}

// Startup
supabase.auth.onAuthStateChange(() => refreshSession());
refreshSession();
