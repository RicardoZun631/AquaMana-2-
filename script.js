document.addEventListener('DOMContentLoaded', function () {

  /* ── ELEMENT REFERENCES ─────────────────────────────────── */

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
  var txNote       = document.getElementById('tx-note');
  var saveBtn      = document.getElementById('save-btn');
  var cancelBtn    = document.getElementById('cancel-edit-btn');
  var txTitleError = document.getElementById('tx-title-error');
  var txAmtError   = document.getElementById('tx-amount-error');
  var txTbody      = document.getElementById('tx-tbody');
  var txEmpty      = document.getElementById('tx-empty');
  var searchInput  = document.getElementById('search-input');
  var filterBtns   = document.querySelectorAll('.filter-btn');

  // Product link panel (inside transaction form)
  var productLinkToggle  = document.getElementById('product-link-toggle');
  var productLinkBody    = document.getElementById('product-link-body');
  var productLinkArrow   = document.getElementById('product-link-arrow');
  var txProductSelect    = document.getElementById('tx-product');
  var txProdQty          = document.getElementById('tx-prod-qty');
  var txProdQtyError     = document.getElementById('tx-prod-qty-error');
  var prodLinkInfo       = document.getElementById('prod-link-info');

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

  // Image upload
  var imgUploadArea  = document.getElementById('img-upload-area');
  var imgFileInput   = document.getElementById('inv-image');
  var imgPreview     = document.getElementById('img-preview');
  var imgPlaceholder = document.getElementById('img-placeholder');
  var removeImgBtn   = document.getElementById('remove-img-btn');

  // Sell modal
  var sellModal      = document.getElementById('sell-modal');
  var sellModalName  = document.getElementById('sell-modal-name');
  var sellQtyInput   = document.getElementById('sell-qty');
  var sellQtyError   = document.getElementById('sell-qty-error');
  var sellTotal      = document.getElementById('sell-total');
  var sellConfirmBtn = document.getElementById('sell-confirm-btn');
  var sellCancelBtn  = document.getElementById('sell-cancel-btn');

  /* ── STATE ──────────────────────────────────────────────── */
  var transactions  = [];
  var inventory     = [];
  var activeFilter  = 'all';
  var searchQuery   = '';
  var sellTargetId  = null;
  var currentImgB64 = null;  // base64 string of image being added/edited
  var LOW_STOCK     = 5;

  /* ── STORAGE ────────────────────────────────────────────── */
  function saveTx()  { localStorage.setItem('am_tx',  JSON.stringify(transactions)); }
  function loadTx()  { var r = localStorage.getItem('am_tx');  return r ? JSON.parse(r) : []; }
  function saveInv() { localStorage.setItem('am_inv', JSON.stringify(inventory)); }
  function loadInv() { var r = localStorage.getItem('am_inv'); return r ? JSON.parse(r) : []; }

  /* ── HELPERS ────────────────────────────────────────────── */
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

  /* ── DASHBOARD ──────────────────────────────────────────── */
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
        '<div>' +
          '<div class="recent-title">' + esc(tx.title) + '</div>' +
          '<div class="recent-date">'  + fmtDate(tx.date) + '</div>' +
        '</div>' +
        '<div style="display:flex;align-items:center;gap:8px;">' +
          '<span class="' + (tx.type==='income'?'amount-income':'amount-expense') + '">' +
            (tx.type==='income'?'+':'-') + fmt(tx.amount) +
          '</span>' +
          '<span class="badge badge-' + tx.type + '">' + tx.type + '</span>' +
        '</div>';
      recentList.appendChild(el);
    });
  }

  /* ── TRANSACTIONS TABLE ─────────────────────────────────── */
  function renderTable() {
    var list = transactions.slice();
    if (activeFilter !== 'all') {
      list = list.filter(function(t){ return t.type === activeFilter; });
    }
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
          (tx.type==='income'?'+':'-') + fmt(tx.amount) +
        '</td>' +
        '<td><span class="badge badge-' + tx.type + '">' + tx.type + '</span></td>' +
        '<td class="tx-note-cell">' + esc(tx.note || '—') + '</td>' +
        '<td>' + fmtDate(tx.date) + '</td>' +
        '<td><div class="action-btns">' +
          '<button class="btn-edit"   onclick="AM.editTx(\''   + tx.id + '\')">Edit</button>' +
          '<button class="btn-delete" onclick="AM.deleteTx(\'' + tx.id + '\')">Delete</button>' +
        '</div></td>';
      txTbody.appendChild(tr);
    });
  }

  function refreshAll() { updateDashboard(); renderTable(); renderInventory(); }

  /* ── PRODUCT LINK PANEL TOGGLE ──────────────────────────── */
  productLinkToggle.addEventListener('click', function() {
    var isHidden = productLinkBody.classList.contains('hidden');
    if (isHidden) {
      productLinkBody.classList.remove('hidden');
      productLinkArrow.classList.add('open');
    } else {
      productLinkBody.classList.add('hidden');
      productLinkArrow.classList.remove('open');
    }
  });

  /* ── POPULATE PRODUCT DROPDOWN ──────────────────────────── */
  function populateProductDropdown() {
    // Save current selection
    var currentVal = txProductSelect.value;
    txProductSelect.innerHTML = '<option value="">— None —</option>';
    inventory.forEach(function(p) {
      var opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = p.name + ' (Stock: ' + p.qty + ' at  ' + fmt(p.price) + ')';
      if (p.qty === 0) opt.textContent += ' — OUT OF STOCK';
      txProductSelect.appendChild(opt);
    });
    txProductSelect.value = currentVal;
    updateProdLinkInfo();
  }

  /* ── PRODUCT LINK INFO BOX ──────────────────────────────── */
  function updateProdLinkInfo() {
    var pid = txProductSelect.value;
    var qty = parseInt(txProdQty.value) || 0;

    if (!pid) {
      prodLinkInfo.classList.add('empty');
      prodLinkInfo.innerHTML = '';
      return;
    }

    var p = inventory.find(function(p){ return p.id === pid; });
    if (!p) { prodLinkInfo.classList.add('empty'); return; }

    prodLinkInfo.classList.remove('empty');

    var total    = qty > 0 ? fmt(qty * p.price) : '—';
    var stockWarn = '';
    if (p.qty === 0) {
      stockWarn = '<div class="prod-link-info-stock-warn">⚠ Out of stock!</div>';
    } else if (p.qty <= LOW_STOCK) {
      stockWarn = '<div class="prod-link-info-stock-warn">⚠ Low stock: ' + p.qty + ' left</div>';
    }

    prodLinkInfo.innerHTML =
      '<div class="prod-link-info-name">' + esc(p.name) + '</div>' +
      '<div class="prod-link-info-row">Price: ' + fmt(p.price) + ' / unit</div>' +
      '<div class="prod-link-info-row">In stock: ' + p.qty + '</div>' +
      (qty > 0 ? '<div class="prod-link-info-row">Total: <strong>' + total + '</strong></div>' : '') +
      stockWarn;

    // Auto-fill the amount field
    if (qty > 0) {
      txAmount.value = (qty * p.price).toFixed(2);
    }
  }

  txProductSelect.addEventListener('change', function() {
    txProdQty.value = '';
    updateProdLinkInfo();
    // Auto-fill title if empty
    if (txProductSelect.value && !txTitle.value.trim()) {
      var p = inventory.find(function(p){ return p.id === txProductSelect.value; });
      if (p) txTitle.value = 'Sale: ' + p.name;
    }
  });

  txProdQty.addEventListener('input', updateProdLinkInfo);

  /* ── TRANSACTION FORM — SAVE ────────────────────────────── */
  saveBtn.addEventListener('click', function() {
    // Clear errors
    txTitleError.textContent = '';
    txAmtError.textContent   = '';
    txProdQtyError.textContent = '';

    var valid = true;

    if (!txTitle.value.trim()) {
      txTitleError.textContent = 'Title required.';
      valid = false;
    }

    var amt = parseFloat(txAmount.value);
    if (!txAmount.value || isNaN(amt) || amt <= 0) {
      txAmtError.textContent = 'Enter amount > 0.';
      valid = false;
    }

    // Validate product link if a product is selected
    var linkedProductId = txProductSelect.value;
    var linkedQty       = parseInt(txProdQty.value);

    if (linkedProductId) {
      if (!txProdQty.value || isNaN(linkedQty) || linkedQty <= 0) {
        txProdQtyError.textContent = 'Enter quantity > 0.';
        valid = false;
      } else {
        var linkedProd = inventory.find(function(p){ return p.id === linkedProductId; });
        if (linkedProd && linkedQty > linkedProd.qty) {
          txProdQtyError.textContent = 'Only ' + linkedProd.qty + ' in stock.';
          valid = false;
        }
      }
    }

    if (!valid) return;

    var id = editIdInput.value;

    if (id) {
      // ── EDIT existing transaction ──
      var i = transactions.findIndex(function(t){ return t.id === id; });
      if (i !== -1) {
        transactions[i].title  = txTitle.value.trim();
        transactions[i].amount = amt;
        transactions[i].type   = txType.value;
        transactions[i].note   = txNote.value.trim();
      }
      exitTxEdit();
    } else {
      // ── ADD new transaction ──
      var newTx = {
        id:        genId(),
        title:     txTitle.value.trim(),
        amount:    amt,
        type:      txType.value,
        note:      txNote.value.trim(),
        date:      new Date().toISOString(),
        linkedProductId: linkedProductId || null,
        linkedQty:       linkedProductId ? linkedQty : null
      };
      transactions.push(newTx);

      // Reduce inventory stock if a product was linked
      if (linkedProductId) {
        var pIdx = inventory.findIndex(function(p){ return p.id === linkedProductId; });
        if (pIdx !== -1) {
          inventory[pIdx].qty -= linkedQty;
          if (inventory[pIdx].qty < 0) inventory[pIdx].qty = 0;
          saveInv();
        }
      }

      // Clear form
      txTitle.value  = '';
      txAmount.value = '';
      txType.value   = 'income';
      txNote.value   = '';
      txProductSelect.value = '';
      txProdQty.value = '';
      prodLinkInfo.classList.add('empty');
      prodLinkInfo.innerHTML = '';
    }

    saveTx();
    refreshAll();
  });

  /* ── EDIT TRANSACTION ───────────────────────────────────── */
  function editTx(id) {
    var tx = transactions.find(function(t){ return t.id === id; });
    if (!tx) return;

    editIdInput.value     = tx.id;
    txTitle.value         = tx.title;
    txAmount.value        = tx.amount;
    txType.value          = tx.type;
    txNote.value          = tx.note || '';
    formTitle.textContent = 'Edit Transaction';
    saveBtn.textContent   = 'Save Changes';
    cancelBtn.classList.remove('hidden');

    document.querySelector('#section-transactions .form-card')
      .scrollIntoView({ behavior:'smooth', block:'start' });
  }

  function exitTxEdit() {
    editIdInput.value     = '';
    formTitle.textContent = 'Add Transaction';
    saveBtn.textContent   = 'Add Transaction';
    cancelBtn.classList.add('hidden');
    txTitle.value  = '';
    txAmount.value = '';
    txType.value   = 'income';
    txNote.value   = '';
    txTitleError.textContent = '';
    txAmtError.textContent   = '';
  }

  cancelBtn.addEventListener('click', exitTxEdit);

  /* ── DELETE TRANSACTION ─────────────────────────────────── */
  function deleteTx(id) {
    if (!confirm('Delete this transaction?')) return;
    transactions = transactions.filter(function(t){ return t.id !== id; });
    saveTx();
    refreshAll();
  }

  /* ── SEARCH & FILTER ────────────────────────────────────── */
  searchInput.addEventListener('input', function(){ searchQuery = this.value; renderTable(); });

  filterBtns.forEach(function(btn) {
    btn.addEventListener('click', function() {
      filterBtns.forEach(function(b){ b.classList.remove('active'); });
      this.classList.add('active');
      activeFilter = this.dataset.filter;
      renderTable();
    });
  });

  /* ── IMAGE UPLOAD ───────────────────────────────────────── */

  // When a file is chosen via the file picker
  imgFileInput.addEventListener('change', function() {
    if (this.files && this.files[0]) {
      readImageFile(this.files[0]);
    }
  });


  imgUploadArea.addEventListener('dragover', function(e) {
    e.preventDefault();
    imgUploadArea.classList.add('drag-over');
  });
  imgUploadArea.addEventListener('dragleave', function() {
    imgUploadArea.classList.remove('drag-over');
  });
  imgUploadArea.addEventListener('drop', function(e) {
    e.preventDefault();
    imgUploadArea.classList.remove('drag-over');
    var file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      readImageFile(file);
    }
  });

  // Convert image file to base64
  function readImageFile(file) {
    if (file.size > 2 * 1024 * 1024) {
      alert('Image is too large. Please use an image under 2MB.');
      return;
    }
    var reader = new FileReader();
    reader.onload = function(e) {
      currentImgB64 = e.target.result;
      showImgPreview(currentImgB64);
    };
    reader.readAsDataURL(file);  // converts file to base64
  }

  function showImgPreview(src) {
    imgPreview.src = src;
    imgPreview.classList.remove('hidden');
    imgPlaceholder.classList.add('hidden');
    removeImgBtn.classList.remove('hidden');
  }

  function clearImgPreview() {
    currentImgB64 = null;
    imgPreview.src = '';
    imgPreview.classList.add('hidden');
    imgPlaceholder.classList.remove('hidden');
    removeImgBtn.classList.add('hidden');
    imgFileInput.value = '';
  }

  removeImgBtn.addEventListener('click', clearImgPreview);

  /* ── INVENTORY RENDER ───────────────────────────────────── */
  function renderInventory() {
    invGrid.innerHTML = '';

    // Low stock check
    var lowItems = inventory.filter(function(p){ return p.qty <= LOW_STOCK; });
    if (lowItems.length) {
      lowStockBanner.classList.remove('hidden');
      lowStockNames.textContent = lowItems
        .map(function(p){ return p.name + ' (' + p.qty + ')'; })
        .join(', ');
    } else {
      lowStockBanner.classList.add('hidden');
    }

    if (!inventory.length) { invEmpty.classList.remove('hidden'); return; }
    invEmpty.classList.add('hidden');

    inventory.forEach(function(p) {
      var isLow = p.qty <= LOW_STOCK;
      var card  = document.createElement('div');
      card.className = 'product-card' + (isLow ? ' low-stock' : '');

      // Image or placeholder
      var imgHtml = p.image
        ? '<img class="product-img" src="' + p.image + '" alt="' + esc(p.name) + '" />'
        : '<div class="product-img-placeholder">📦</div>';

      card.innerHTML =
        imgHtml +
        '<div class="product-body">' +
          '<div class="product-name">' + esc(p.name) + '</div>' +
          '<div class="product-desc">' + esc(p.desc || '') + '</div>' +
          '<div class="product-meta">' +
            '<div class="product-qty">Stock: <strong>' + p.qty + '</strong></div>' +
            '<div class="product-price">' + fmt(p.price) + '/unit</div>' +
          '</div>' +
          (isLow ? '<span class="low-stock-tag">⚠ Low Stock</span>' : '') +
          '<div class="product-actions">' +
            '<button class="btn-sell" onclick="AM.openSell(\'' + p.id + '\')" ' +
              (p.qty === 0 ? 'disabled' : '') + '>💰 Sell</button>' +
            '<button class="btn-edit"   onclick="AM.editProd(\''   + p.id + '\')">Edit</button>' +
            '<button class="btn-delete" onclick="AM.deleteProd(\'' + p.id + '\')">Delete</button>' +
          '</div>' +
        '</div>';

      invGrid.appendChild(card);
    });

    // Keep transaction product dropdown in sync
    populateProductDropdown();
  }

  /* ── INVENTORY FORM — SAVE ──────────────────────────────── */
  invSaveBtn.addEventListener('click', function() {
    invNameError.textContent  = '';
    invQtyError.textContent   = '';
    invPriceError.textContent = '';

    var valid = true;
    if (!invName.value.trim()) { invNameError.textContent  = 'Name required.';      valid = false; }
    var qty   = parseInt(invQty.value);
    var price = parseFloat(invPrice.value);
    if (invQty.value   === '' || isNaN(qty)   || qty   < 0) { invQtyError.textContent   = 'Enter qty ≥ 0.';   valid = false; }
    if (invPrice.value === '' || isNaN(price) || price < 0) { invPriceError.textContent = 'Enter price ≥ 0.'; valid = false; }
    if (!valid) return;

    var id = invEditId.value;

    if (id) {
      // EDIT existing product
      var i = inventory.findIndex(function(p){ return p.id === id; });
      if (i !== -1) {
        inventory[i].name  = invName.value.trim();
        inventory[i].desc  = invDesc.value.trim();
        inventory[i].qty   = qty;
        inventory[i].price = price;
        // update image if a new one was selected
        if (currentImgB64 !== null) {
          inventory[i].image = currentImgB64;
        }
      }
      exitInvEdit();
    } else {
      // ADD new product
      inventory.push({
        id:    genId(),
        name:  invName.value.trim(),
        desc:  invDesc.value.trim(),
        qty:   qty,
        price: price,
        image: currentImgB64 || null
      });
      invName.value  = '';
      invDesc.value  = '';
      invQty.value   = '';
      invPrice.value = '';
      clearImgPreview();
    }

    saveInv();
    renderInventory();
  });

  /* ── EDIT PRODUCT ───────────────────────────────────────── */
  function editProd(id) {
    var p = inventory.find(function(p){ return p.id === id; });
    if (!p) return;

    invEditId.value          = p.id;
    invName.value            = p.name;
    invDesc.value            = p.desc || '';
    invQty.value             = p.qty;
    invPrice.value           = p.price;
    invFormTitle.textContent = 'Edit Product';
    invSaveBtn.textContent   = 'Save Changes';
    invCancelBtn.classList.remove('hidden');

    // Show existing image if there is one
    if (p.image) {
      showImgPreview(p.image);
      currentImgB64 = null;
    } else {
      clearImgPreview();
    }

    document.querySelector('#section-inventory .form-card')
      .scrollIntoView({ behavior:'smooth', block:'start' });
  }

  function exitInvEdit() {
    invEditId.value          = '';
    invFormTitle.textContent = 'Add Product';
    invSaveBtn.textContent   = 'Add Product';
    invCancelBtn.classList.add('hidden');
    invName.value  = '';
    invDesc.value  = '';
    invQty.value   = '';
    invPrice.value = '';
    invNameError.textContent  = '';
    invQtyError.textContent   = '';
    invPriceError.textContent = '';
    clearImgPreview();
  }

  invCancelBtn.addEventListener('click', exitInvEdit);

  /* ── DELETE PRODUCT ─────────────────────────────────────── */
  function deleteProd(id) {
    if (!confirm('Delete this product?')) return;
    inventory = inventory.filter(function(p){ return p.id !== id; });
    saveInv();
    renderInventory();
  }

  /* ── SELL MODAL ─────────────────────────────────────────── */
  function openSell(id) {
    var p = inventory.find(function(p){ return p.id === id; });
    if (!p) return;
    sellTargetId              = id;
    sellModalName.textContent = p.name + '  —  ' + fmt(p.price) + '/unit  (Stock: ' + p.qty + ')';
    sellQtyInput.value        = '1';
    sellQtyError.textContent  = '';
    sellTotal.textContent     = fmt(p.price);
    sellModal.classList.remove('hidden');
    sellQtyInput.focus();
  }

  sellQtyInput.addEventListener('input', function() {
    var p = inventory.find(function(p){ return p.id === sellTargetId; });
    if (p) sellTotal.textContent = fmt((parseInt(this.value) || 0) * p.price);
  });

  sellConfirmBtn.addEventListener('click', function() {
    sellQtyError.textContent = '';
    var p   = inventory.find(function(p){ return p.id === sellTargetId; });
    if (!p) return;
    var qty = parseInt(sellQtyInput.value);
    if (!sellQtyInput.value || isNaN(qty) || qty <= 0) { sellQtyError.textContent = 'Enter qty > 0.'; return; }
    if (qty > p.qty) { sellQtyError.textContent = 'Only ' + p.qty + ' in stock.'; return; }

    var total = qty * p.price;
    p.qty -= qty;
    saveInv();

    transactions.push({
      id:    genId(),
      title: 'Sale: ' + p.name + ' x' + qty,
      amount: total,
      type:  'income',
      note:  'Sold from Inventory',
      date:  new Date().toISOString()
    });
    saveTx();

    sellModal.classList.add('hidden');
    sellTargetId = null;
    refreshAll();
    alert('Sale recorded! ' + fmt(total) + ' added as income.');
  });

  sellCancelBtn.addEventListener('click', function() { sellModal.classList.add('hidden'); });
  sellModal.addEventListener('click', function(e) {
    if (e.target === sellModal) sellModal.classList.add('hidden');
  });

  /* ── LOGIN ──────────────────────────────────────────────── */
  loginBtn.addEventListener('click', function() {
    emailError.textContent    = '';
    passwordError.textContent = '';
    var email = emailInput.value.trim();
    var pass  = passwordInput.value;
    var valid = true;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      emailError.textContent = 'Enter a valid email.';
      valid = false;
    }
    if (!pass || pass.length < 6) {
      passwordError.textContent = 'Password needs 6+ characters.';
      valid = false;
    }
    if (!valid) return;

    transactions = loadTx();
    inventory    = loadInv();
    loginPage.classList.add('hidden');
    app.classList.remove('hidden');
    topbarEmail.textContent = email;
    refreshAll();
  });

  passwordInput.addEventListener('keydown', function(e){
    if (e.key === 'Enter') loginBtn.click();
  });

  /* ── LOGOUT ─────────────────────────────────────────────── */
  logoutBtn.addEventListener('click', function() {
    app.classList.add('hidden');
    loginPage.classList.remove('hidden');
    emailInput.value    = '';
    passwordInput.value = '';
    transactions        = [];
    inventory           = [];
  });

  /* ── NAVIGATION ─────────────────────────────────────────── */
  function showSection(name) {
    document.querySelectorAll('.section').forEach(function(s){
      s.classList.remove('active');
    });
    var t = document.getElementById('section-' + name);
    if (t) t.classList.add('active');
    navItems.forEach(function(n){
      n.classList.toggle('active', n.dataset.section === name);
    });
    topbarTitle.textContent = name.charAt(0).toUpperCase() + name.slice(1);
  }

  navItems.forEach(function(item) {
    item.addEventListener('click', function(e){
      e.preventDefault();
      showSection(item.dataset.section);
    });
  });

  showSection('dashboard');

  /* ── EXPOSE GLOBALS for inline onclick handlers ─────────── */
  window.AM = {
    editTx:     editTx,
    deleteTx:   deleteTx,
    editProd:   editProd,
    deleteProd: deleteProd,
    openSell:   openSell
  };

}); 
