/* AguaMana — script.js */

document.addEventListener('DOMContentLoaded', function () {

  /* ── GRAB ELEMENTS (must match index.html IDs exactly) ── */

  // Login
  var loginPage     = document.getElementById('login-page');
  var app           = document.getElementById('app');
  var emailInput    = document.getElementById('email');
  var passwordInput = document.getElementById('password');
  var loginBtn      = document.getElementById('login-btn');
  var emailError    = document.getElementById('email-error');
  var passwordError = document.getElementById('password-error');
  var logoutBtn     = document.getElementById('logout-btn');
  var topbarTitle   = document.getElementById('topbar-title');
  var topbarEmail   = document.getElementById('topbar-email');

  // Navigation
  var navItems = document.querySelectorAll('.nav-item');

  // Dashboard
  var elIncome   = document.getElementById('total-income');
  var elExpenses = document.getElementById('total-expenses');
  var elBalance  = document.getElementById('total-balance');
  var elCount    = document.getElementById('total-count');
  var recentList = document.getElementById('recent-list');

  // Transaction form
  var formTitle    = document.getElementById('form-title');
  var editIdInput  = document.getElementById('edit-id');
  var txTitle      = document.getElementById('tx-title');
  var txAmount     = document.getElementById('tx-amount');
  var txType       = document.getElementById('tx-type');
  var saveBtn      = document.getElementById('save-btn');
  var cancelBtn    = document.getElementById('cancel-edit-btn');
  var txTitleError = document.getElementById('tx-title-error');
  var txAmtError   = document.getElementById('tx-amount-error');
  var txTbody      = document.getElementById('tx-tbody');
  var txEmpty      = document.getElementById('tx-empty');
  var searchInput  = document.getElementById('search-input');
  var filterBtns   = document.querySelectorAll('.filter-btn');

  // Inventory form
  var invFormTitle  = document.getElementById('inv-form-title');
  var invEditId     = document.getElementById('inv-edit-id');
  var invName       = document.getElementById('inv-name');
  var invDesc       = document.getElementById('inv-desc');
  var invQty        = document.getElementById('inv-qty');
  var invPrice      = document.getElementById('inv-price');
  var invSaveBtn    = document.getElementById('inv-save-btn');
  var invCancelBtn  = document.getElementById('inv-cancel-btn');
  var invNameError  = document.getElementById('inv-name-error');
  var invQtyError   = document.getElementById('inv-qty-error');
  var invPriceError = document.getElementById('inv-price-error');
  var invGrid       = document.getElementById('inv-grid');
  var invEmpty      = document.getElementById('inv-empty');
  var lowStockBanner= document.getElementById('low-stock-banner');
  var lowStockNames = document.getElementById('low-stock-names');

  // Sell modal
  var sellModal      = document.getElementById('sell-modal');
  var sellModalName  = document.getElementById('sell-modal-name');
  var sellQtyInput   = document.getElementById('sell-qty');
  var sellQtyError   = document.getElementById('sell-qty-error');
  var sellTotal      = document.getElementById('sell-total');
  var sellConfirmBtn = document.getElementById('sell-confirm-btn');
  var sellCancelBtn  = document.getElementById('sell-cancel-btn');

  /* ── STATE ── */
  var transactions = [];
  var inventory    = [];
  var activeFilter = 'all';
  var searchQuery  = '';
  var sellTargetId = null;
  var LOW_STOCK    = 5;

  /* ── STORAGE ── */
  function saveTx()  { localStorage.setItem('am_tx',  JSON.stringify(transactions)); }
  function loadTx()  { var r = localStorage.getItem('am_tx');  return r ? JSON.parse(r) : []; }
  function saveInv() { localStorage.setItem('am_inv', JSON.stringify(inventory));    }
  function loadInv() { var r = localStorage.getItem('am_inv'); return r ? JSON.parse(r) : []; }

  /* ── HELPERS ── */
  function genId() { return 'id_' + Date.now() + '_' + Math.random().toString(36).slice(2,6); }

  function fmt(n) {
    return '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits:2, maximumFractionDigits:2 });
  }

  function fmtDate(iso) {
    return new Date(iso).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
  }

  function esc(str) {
    var d = document.createElement('div');
    d.appendChild(document.createTextNode(String(str || '')));
    return d.innerHTML;
  }

  /* ── DASHBOARD ── */
  function updateDashboard() {
    var income = 0, expenses = 0;
    transactions.forEach(function(tx) {
      if (tx.type === 'income') income += tx.amount;
      else expenses += tx.amount;
    });
    var balance = income - expenses;
    elIncome.textContent   = fmt(income);
    elExpenses.textContent = fmt(expenses);
    elBalance.textContent  = fmt(balance);
    elCount.textContent    = transactions.length;
    elBalance.style.color  = balance < 0 ? 'var(--expense)' : 'var(--accent)';

    recentList.innerHTML = '';
    if (!transactions.length) {
      recentList.innerHTML = '<p class="empty-state">No transactions yet.</p>';
      return;
    }
    var recent = transactions.slice()
      .sort(function(a,b){ return new Date(b.date) - new Date(a.date); })
      .slice(0, 5);
    recent.forEach(function(tx) {
      var el = document.createElement('div');
      el.className = 'recent-item';
      el.innerHTML =
        '<div><div class="recent-title">' + esc(tx.title) + '</div>' +
        '<div class="recent-date">' + fmtDate(tx.date) + '</div></div>' +
        '<div style="display:flex;align-items:center;gap:8px;">' +
        '<span class="' + (tx.type==='income'?'amount-income':'amount-expense') + '">' +
        (tx.type==='income'?'+':'-') + fmt(tx.amount) + '</span>' +
        '<span class="badge badge-' + tx.type + '">' + tx.type + '</span></div>';
      recentList.appendChild(el);
    });
  }

  /* ── TRANSACTIONS TABLE ── */
  function renderTable() {
    var list = transactions.slice();
    if (activeFilter !== 'all') list = list.filter(function(t){ return t.type === activeFilter; });
    if (searchQuery.trim()) {
      var q = searchQuery.toLowerCase();
      list = list.filter(function(t){ return t.title.toLowerCase().indexOf(q) !== -1; });
    }
    list.sort(function(a,b){ return new Date(b.date) - new Date(a.date); });
    txTbody.innerHTML = '';
    if (!list.length) { txEmpty.classList.remove('hidden'); return; }
    txEmpty.classList.add('hidden');
    list.forEach(function(tx) {
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td>' + esc(tx.title) + '</td>' +
        '<td class="' + (tx.type==='income'?'amount-income':'amount-expense') + '">' +
        (tx.type==='income'?'+':'-') + fmt(tx.amount) + '</td>' +
        '<td><span class="badge badge-' + tx.type + '">' + tx.type + '</span></td>' +
        '<td>' + fmtDate(tx.date) + '</td>' +
        '<td><div class="action-btns">' +
        '<button class="btn-edit"   onclick="AM.editTx(\''   + tx.id + '\')">Edit</button>' +
        '<button class="btn-delete" onclick="AM.deleteTx(\'' + tx.id + '\')">Delete</button>' +
        '</div></td>';
      txTbody.appendChild(tr);
    });
  }

  function refreshAll() { updateDashboard(); renderTable(); renderInventory(); }

  /* ── TX FORM ── */
  saveBtn.addEventListener('click', function() {
    txTitleError.textContent = ''; txAmtError.textContent = '';
    var valid = true;
    if (!txTitle.value.trim()) { txTitleError.textContent = 'Title required.'; valid = false; }
    var amt = parseFloat(txAmount.value);
    if (!txAmount.value || isNaN(amt) || amt <= 0) { txAmtError.textContent = 'Enter amount > 0.'; valid = false; }
    if (!valid) return;

    var id = editIdInput.value;
    if (id) {
      var i = transactions.findIndex(function(t){ return t.id === id; });
      if (i !== -1) { transactions[i].title=txTitle.value.trim(); transactions[i].amount=amt; transactions[i].type=txType.value; }
      exitTxEdit();
    } else {
      transactions.push({ id:genId(), title:txTitle.value.trim(), amount:amt, type:txType.value, date:new Date().toISOString() });
      txTitle.value=''; txAmount.value=''; txType.value='income';
    }
    saveTx(); refreshAll();
  });

  function editTx(id) {
    var tx = transactions.find(function(t){ return t.id===id; });
    if (!tx) return;
    editIdInput.value=tx.id; txTitle.value=tx.title; txAmount.value=tx.amount; txType.value=tx.type;
    formTitle.textContent='Edit Transaction'; saveBtn.textContent='Save Changes';
    cancelBtn.classList.remove('hidden');
    document.querySelector('#section-transactions .form-card').scrollIntoView({behavior:'smooth'});
  }

  function exitTxEdit() {
    editIdInput.value=''; formTitle.textContent='Add Transaction'; saveBtn.textContent='Add Transaction';
    cancelBtn.classList.add('hidden');
    txTitle.value=''; txAmount.value=''; txType.value='income';
    txTitleError.textContent=''; txAmtError.textContent='';
  }

  cancelBtn.addEventListener('click', exitTxEdit);

  function deleteTx(id) {
    if (!confirm('Delete this transaction?')) return;
    transactions = transactions.filter(function(t){ return t.id!==id; });
    saveTx(); refreshAll();
  }

  searchInput.addEventListener('input', function(){ searchQuery=this.value; renderTable(); });

  filterBtns.forEach(function(btn) {
    btn.addEventListener('click', function() {
      filterBtns.forEach(function(b){ b.classList.remove('active'); });
      this.classList.add('active');
      activeFilter = this.dataset.filter;
      renderTable();
    });
  });

  /* ── INVENTORY ── */
  function renderInventory() {
    invGrid.innerHTML = '';
    var lowItems = inventory.filter(function(p){ return p.qty <= LOW_STOCK; });
    if (lowItems.length) {
      lowStockBanner.classList.remove('hidden');
      lowStockNames.textContent = lowItems.map(function(p){ return p.name + ' (' + p.qty + ')'; }).join(', ');
    } else {
      lowStockBanner.classList.add('hidden');
    }
    if (!inventory.length) { invEmpty.classList.remove('hidden'); return; }
    invEmpty.classList.add('hidden');
    inventory.forEach(function(p) {
      var isLow = p.qty <= LOW_STOCK;
      var card = document.createElement('div');
      card.className = 'product-card' + (isLow ? ' low-stock' : '');
      card.innerHTML =
        '<div class="product-name">' + esc(p.name) + '</div>' +
        '<div class="product-desc">' + esc(p.desc) + '</div>' +
        '<div class="product-meta">' +
          '<div class="product-qty">Stock: <strong>' + p.qty + '</strong></div>' +
          '<div class="product-price">' + fmt(p.price) + ' / unit</div>' +
        '</div>' +
        (isLow ? '<span class="low-stock-tag">⚠ Low Stock</span>' : '') +
        '<div class="product-actions">' +
          '<button class="btn-sell" onclick="AM.openSell(\'' + p.id + '\')" ' + (p.qty===0?'disabled':'') + '>💰 Sell</button>' +
          '<button class="btn-edit" onclick="AM.editProd(\'' + p.id + '\')">Edit</button>' +
          '<button class="btn-delete" onclick="AM.deleteProd(\'' + p.id + '\')">Delete</button>' +
        '</div>';
      invGrid.appendChild(card);
    });
  }

  invSaveBtn.addEventListener('click', function() {
    invNameError.textContent=''; invQtyError.textContent=''; invPriceError.textContent='';
    var valid = true;
    if (!invName.value.trim()) { invNameError.textContent='Name required.'; valid=false; }
    var qty = parseInt(invQty.value);
    if (invQty.value==='' || isNaN(qty) || qty<0) { invQtyError.textContent='Enter qty ≥ 0.'; valid=false; }
    var price = parseFloat(invPrice.value);
    if (invPrice.value==='' || isNaN(price) || price<0) { invPriceError.textContent='Enter price ≥ 0.'; valid=false; }
    if (!valid) return;

    var id = invEditId.value;
    if (id) {
      var i = inventory.findIndex(function(p){ return p.id===id; });
      if (i !== -1) { inventory[i].name=invName.value.trim(); inventory[i].desc=invDesc.value.trim(); inventory[i].qty=qty; inventory[i].price=price; }
      exitInvEdit();
    } else {
      inventory.push({ id:genId(), name:invName.value.trim(), desc:invDesc.value.trim(), qty:qty, price:price });
      invName.value=''; invDesc.value=''; invQty.value=''; invPrice.value='';
    }
    saveInv(); renderInventory();
  });

  function editProd(id) {
    var p = inventory.find(function(p){ return p.id===id; });
    if (!p) return;
    invEditId.value=p.id; invName.value=p.name; invDesc.value=p.desc||''; invQty.value=p.qty; invPrice.value=p.price;
    invFormTitle.textContent='Edit Product'; invSaveBtn.textContent='Save Changes';
    invCancelBtn.classList.remove('hidden');
    document.querySelector('#section-inventory .form-card').scrollIntoView({behavior:'smooth'});
  }

  function exitInvEdit() {
    invEditId.value=''; invFormTitle.textContent='Add Product'; invSaveBtn.textContent='Add Product';
    invCancelBtn.classList.add('hidden');
    invName.value=''; invDesc.value=''; invQty.value=''; invPrice.value='';
    invNameError.textContent=''; invQtyError.textContent=''; invPriceError.textContent='';
  }

  invCancelBtn.addEventListener('click', exitInvEdit);

  function deleteProd(id) {
    if (!confirm('Delete this product?')) return;
    inventory = inventory.filter(function(p){ return p.id!==id; });
    saveInv(); renderInventory();
  }

  /* ── SELL MODAL ── */
  function openSell(id) {
    var p = inventory.find(function(p){ return p.id===id; });
    if (!p) return;
    sellTargetId = id;
    sellModalName.textContent = p.name + '  —  ' + fmt(p.price) + '/unit  (Stock: ' + p.qty + ')';
    sellQtyInput.value = '1';
    sellQtyError.textContent = '';
    sellTotal.textContent = fmt(p.price);
    sellModal.classList.remove('hidden');
    sellQtyInput.focus();
  }

  sellQtyInput.addEventListener('input', function() {
    var p = inventory.find(function(p){ return p.id===sellTargetId; });
    if (p) sellTotal.textContent = fmt((parseInt(this.value) || 0) * p.price);
  });

  sellConfirmBtn.addEventListener('click', function() {
    sellQtyError.textContent = '';
    var p = inventory.find(function(p){ return p.id===sellTargetId; });
    if (!p) return;
    var qty = parseInt(sellQtyInput.value);
    if (!sellQtyInput.value || isNaN(qty) || qty <= 0) { sellQtyError.textContent = 'Enter qty > 0.'; return; }
    if (qty > p.qty) { sellQtyError.textContent = 'Only ' + p.qty + ' in stock.'; return; }

    var total = qty * p.price;
    p.qty -= qty;
    saveInv();

    transactions.push({ id:genId(), title:'Sale: '+p.name+' x'+qty, amount:total, type:'income', date:new Date().toISOString() });
    saveTx();

    sellModal.classList.add('hidden');
    sellTargetId = null;
    refreshAll();
    alert('Sale recorded! ' + fmt(total) + ' added as income.');
  });

  sellCancelBtn.addEventListener('click', function() { sellModal.classList.add('hidden'); });
  sellModal.addEventListener('click', function(e) { if (e.target===sellModal) sellModal.classList.add('hidden'); });

  /* ── LOGIN ── */
  loginBtn.addEventListener('click', function() {
    emailError.textContent = ''; passwordError.textContent = '';
    var email = emailInput.value.trim();
    var pass  = passwordInput.value;
    var valid = true;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { emailError.textContent = 'Enter a valid email.'; valid=false; }
    if (!pass || pass.length < 6) { passwordError.textContent = 'Password needs 6+ characters.'; valid=false; }
    if (!valid) return;

    transactions = loadTx();
    inventory    = loadInv();
    loginPage.classList.add('hidden');
    app.classList.remove('hidden');
    topbarEmail.textContent = email;
    refreshAll();
  });

  passwordInput.addEventListener('keydown', function(e){ if (e.key==='Enter') loginBtn.click(); });

  /* ── LOGOUT ── */
  logoutBtn.addEventListener('click', function() {
    app.classList.add('hidden');
    loginPage.classList.remove('hidden');
    emailInput.value=''; passwordInput.value='';
    transactions=[]; inventory=[];
  });

  /* ── NAVIGATION ── */
  function showSection(name) {
    document.querySelectorAll('.section').forEach(function(s){ s.classList.remove('active'); });
    var t = document.getElementById('section-'+name);
    if (t) t.classList.add('active');
    navItems.forEach(function(n){ n.classList.toggle('active', n.dataset.section===name); });
    topbarTitle.textContent = name.charAt(0).toUpperCase() + name.slice(1);
  }

  navItems.forEach(function(item) {
    item.addEventListener('click', function(e){ e.preventDefault(); showSection(item.dataset.section); });
  });

  showSection('dashboard');

  /* ── EXPOSE to inline onclick handlers ── */
  window.AM = { editTx:editTx, deleteTx:deleteTx, editProd:editProd, deleteProd:deleteProd, openSell:openSell };

});
