/* AguaMana — script.js */

/* ── FIREBASE CONFIG ────────────────────────────────────────── */
var firebaseConfig = {
  apiKey:            "AIzaSyDgYaAfXLU-j2g8TFsSkAL73qwqwXlGERc",
  authDomain:        "aquamana-be3d8.firebaseapp.com",
  projectId:         "aquamana-be3d8",
  storageBucket:     "aquamana-be3d8.firebasestorage.app",
  messagingSenderId: "461157381690",
  appId:             "1:461157381690:web:d70804952f7d625a25e703",
  measurementId:     "G-KXFWSTXQ16"
};
firebase.initializeApp(firebaseConfig);
var auth = firebase.auth();
var db   = firebase.firestore();

/* ── EMAILJS CONFIG ─────────────────────────────────────────── */
var EJS_SERVICE  = 'service_qra8hni';
var EJS_TEMPLATE = 'template_q7bc1pb';
var EJS_KEY      = 'c8pnyj3ZHpF97_Qjx';
emailjs.init({ publicKey: EJS_KEY });

/* ══════════════════════════════════════════════════════════════
   TOAST NOTIFICATION SYSTEM
══════════════════════════════════════════════════════════════ */
var toastContainer = document.getElementById('toast-container');

/* ══════════════════════════════════════════════════════════════
   CUSTOM CONFIRM MODAL
══════════════════════════════════════════════════════════════ */
var confirmModal      = document.getElementById('confirm-modal');
var confirmTitle      = document.getElementById('confirm-title');
var confirmMessage    = document.getElementById('confirm-message');
var confirmIcon       = document.getElementById('confirm-icon');
var confirmOkBtn      = document.getElementById('confirm-ok-btn');
var confirmCancelBtn  = document.getElementById('confirm-cancel-btn');
var _confirmCallback  = null;

function showConfirm(title, message, icon, okLabel, callback) {
  if (!confirmModal || !confirmTitle || !confirmMessage || !confirmIcon || !confirmOkBtn) {
    if (window.confirm(message)) {
      if (callback) callback();
    }
    return;
  }

  confirmTitle.textContent   = title;
  confirmMessage.textContent = message;
  confirmIcon.textContent    = icon || '⚠️';
  confirmOkBtn.textContent   = okLabel || 'Confirm';
  _confirmCallback = callback;
  confirmModal.classList.remove('hidden');
}

if (confirmOkBtn && confirmCancelBtn && confirmModal) {
  confirmOkBtn.addEventListener('click', function() {
    confirmModal.classList.add('hidden');
    if (_confirmCallback) {
      _confirmCallback();
      _confirmCallback = null;
    }
  });

  confirmCancelBtn.addEventListener('click', function() {
    confirmModal.classList.add('hidden');
    _confirmCallback = null;
  });

  confirmModal.addEventListener('click', function(e) {
    if (e.target === confirmModal) {
      confirmModal.classList.add('hidden');
      _confirmCallback = null;
    }
  });
}

function toast(title, message, type, duration) {
  type     = type || 'info';
  duration = duration || 3000;

  var icons = { success:'✅', error:'❌', warning:'⚠️', info:'ℹ️' };

  var el = document.createElement('div');
  el.className = 'toast toast-' + type;
  el.innerHTML =
    '<span class="toast-icon">' + icons[type] + '</span>' +
    '<div class="toast-body">' +
      '<div class="toast-title">' + title + '</div>' +
      (message ? '<div class="toast-msg">' + message + '</div>' : '') +
    '</div>' +
    '<button class="toast-close" onclick="this.parentElement._remove()">✕</button>';

  el._remove = function() {
    el.classList.add('removing');
    setTimeout(function() {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 280);
  };

  toastContainer.appendChild(el);
  setTimeout(function() { el._remove(); }, duration);
}

/* ══════════════════════════════════════════════════════════════
   EMAIL SYSTEM (EmailJS)
══════════════════════════════════════════════════════════════ */
function sendEmail(toEmail, subject, message) {
  return emailjs.send(EJS_SERVICE, EJS_TEMPLATE, {
    to_email: toEmail,
    subject:  subject,
    message:  message
  }).then(function(response) {
    console.log('Email sent:', subject, response);
    return response;
  }).catch(function(err) {
    console.error('EmailJS error for "' + subject + '":', err);
    throw err;
  });
}

function sendWelcomeEmail(name, email) {
  var msg =
    'Hi ' + name + '! 👋\n\n' +
    'Welcome to AguaMana — your small business finance dashboard.\n\n' +
    'Your account has been created successfully.\n\n' +
    'Here\'s what you can do:\n' +
    '• Track your income and expenses\n' +
    '• Manage your product inventory\n' +
    '• View monthly financial summaries\n' +
    '• Get alerts for low stock and high expenses\n\n' +
    'Get started by adding your first transaction!\n\n' +
    '— The AguaMana Team 💧';

  return sendEmail(email, 'Welcome to AguaMana! 💧', msg);
}

function sendDailySummaryEmail(name, email, txList, income, expenses, balance) {
  var today = new Date().toLocaleDateString('en-US', {
    weekday:'long',
    month:'long',
    day:'numeric',
    year:'numeric'
  });

  var txLines = txList.length
    ? txList.map(function(tx) {
        return '  ' + (tx.type === 'income' ? '[+]' : '[-]') + ' ' + tx.title + ' — ' + tx.amount.toFixed(2);
      }).join('\n')
    : '  No transactions today.';

  var msg =
    'Hi ' + name + ',\n\n' +
    'Here is your AguaMana daily summary for ' + today + ':\n\n' +
    '📊 TODAY\'S TRANSACTIONS:\n' + txLines + '\n\n' +
    '💰 ALL-TIME TOTALS:\n' +
    '  Total Income:   ' + income + '\n' +
    '  Total Expenses: ' + expenses + '\n' +
    '  Balance:        ' + balance + '\n\n' +
    'Keep up the great work! 💪\n\n' +
    '— AguaMana 💧';

  return sendEmail(email, 'AguaMana Daily Summary — ' + today, msg);
}

function sendLowStockEmail(name, email, lowProducts) {
  var lines = lowProducts.map(function(p) {
    return '  • ' + p.name + ' — only ' + p.qty + ' unit' + (p.qty === 1 ? '' : 's') + ' left';
  }).join('\n');

  var msg =
    'Hi ' + name + ',\n\n' +
    '⚠️ The following products in your AguaMana inventory are running low:\n\n' +
    lines + '\n\n' +
    'Please restock soon to avoid running out.\n\n' +
    '— AguaMana 💧';

  return sendEmail(email, '⚠️ AguaMana Low Stock Alert', msg);
}

function sendExpenseWarningEmail(name, email, balance, income, expenses) {
  var msg =
    'Hi ' + name + ',\n\n' +
    '🚨 Your AguaMana expenses have exceeded your income!\n\n' +
    '  Total Income:   ' + income + '\n' +
    '  Total Expenses: ' + expenses + '\n' +
    '  Current Balance: ' + balance + '\n\n' +
    'Consider reviewing your recent expenses to get back on track.\n\n' +
    '— AguaMana 💧';

  return sendEmail(email, '🚨 AguaMana Expense Warning', msg);
}
/* ══════════════════════════════════════════════════════════════
   MAIN APP LOGIC
══════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', function () {
  var loginPage      = document.getElementById('login-page');
  var app            = document.getElementById('app');
  var authLoading    = document.getElementById('auth-loading');
  var signinForm     = document.getElementById('signin-form');
  var emailInput     = document.getElementById('email');
  var passwordInput  = document.getElementById('password');
  var emailError     = document.getElementById('email-error');
  var passwordError  = document.getElementById('password-error');
  var signinError    = document.getElementById('signin-error');
  var loginBtn       = document.getElementById('login-btn');
  var registerForm   = document.getElementById('register-form');
  var regName        = document.getElementById('reg-name');
  var regBusiness    = document.getElementById('reg-business');
  var regEmail       = document.getElementById('reg-email');
  var regPassword    = document.getElementById('reg-password');
  var regNameError   = document.getElementById('reg-name-error');
  var regEmailError  = document.getElementById('reg-email-error');
  var regPwError     = document.getElementById('reg-password-error');
  var registerError  = document.getElementById('register-error');
  var registerBtn    = document.getElementById('register-btn');
  var tabSignin      = document.getElementById('tab-signin');
  var tabRegister    = document.getElementById('tab-register');
  var topbarTitle    = document.getElementById('topbar-title');
  var topbarName     = document.getElementById('topbar-name');
  var topbarEmailSub = document.getElementById('topbar-email');
  var topbarAvatar   = document.getElementById('topbar-avatar');
  var logoutBtn      = document.getElementById('logout-btn');
  var navItems       = document.querySelectorAll('.nav-item');

  var elIncome       = document.getElementById('total-income');
  var elExpenses     = document.getElementById('total-expenses');
  var elBalance      = document.getElementById('total-balance');
  var elCount        = document.getElementById('total-count');
  var recentList     = document.getElementById('recent-list');
  var monthSelect    = document.getElementById('month-select');
  var monthlyCards   = document.getElementById('monthly-cards');
  var monthlyTxSec   = document.getElementById('monthly-tx-section');
  var monthlyHolder  = document.getElementById('monthly-placeholder');
  var monthIncome    = document.getElementById('month-income');
  var monthExpenses  = document.getElementById('month-expenses');
  var monthBalance   = document.getElementById('month-balance');
  var monthCount     = document.getElementById('month-count');
  var monthlyTxList   = document.getElementById('monthly-tx-list');
  var monthlySearch   = document.getElementById('monthly-search');
  var monthlyPagBar   = document.getElementById('monthly-pagination');
  var monthlyPrevBtn  = document.getElementById('monthly-prev-btn');
  var monthlyNextBtn  = document.getElementById('monthly-next-btn');
  var monthlyPageInfo = document.getElementById('monthly-page-info');
  var txPagBar        = document.getElementById('tx-pagination');
  var txPrevBtn       = document.getElementById('tx-prev-btn');
  var txNextBtn       = document.getElementById('tx-next-btn');
  var txPageInfo      = document.getElementById('tx-page-info');

  var formTitle      = document.getElementById('form-title');
  var editIdInput    = document.getElementById('edit-id');
  var txTitle        = document.getElementById('tx-title');
  var txAmount       = document.getElementById('tx-amount');
  var txType         = document.getElementById('tx-type');
  var txNote         = document.getElementById('tx-note');
  var saveBtn        = document.getElementById('save-btn');
  var cancelBtn      = document.getElementById('cancel-edit-btn');
  var txTitleError   = document.getElementById('tx-title-error');
  var txAmtError     = document.getElementById('tx-amount-error');
  var txTbody        = document.getElementById('tx-tbody');
  var txEmpty        = document.getElementById('tx-empty');
  var searchInput    = document.getElementById('search-input');
  var filterBtns     = document.querySelectorAll('.filter-btn');
  var currencyLabels = document.querySelectorAll('.currency-label');

  var productLinkToggle = document.getElementById('product-link-toggle');
  var productLinkBody   = document.getElementById('product-link-body');
  var productLinkArrow  = document.getElementById('product-link-arrow');
  var txProductSelect   = document.getElementById('tx-product');
  var txProdQty         = document.getElementById('tx-prod-qty');
  var txProdQtyError    = document.getElementById('tx-prod-qty-error');
  var prodLinkInfo      = document.getElementById('prod-link-info');

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
  var imgUploadArea = document.getElementById('img-upload-area');
  var imgFileInput  = document.getElementById('inv-image');
  var imgPreview    = document.getElementById('img-preview');
  var imgPlaceholder= document.getElementById('img-placeholder');
  var removeImgBtn  = document.getElementById('remove-img-btn');
  var sellModal     = document.getElementById('sell-modal');
  var sellModalName = document.getElementById('sell-modal-name');
  var sellQtyInput  = document.getElementById('sell-qty');
  var sellQtyError  = document.getElementById('sell-qty-error');
  var sellTotal     = document.getElementById('sell-total');
  var sellConfirmBtn= document.getElementById('sell-confirm-btn');
  var sellCancelBtn = document.getElementById('sell-cancel-btn');

  var setName         = document.getElementById('set-name');
  var setEmail        = document.getElementById('set-email');
  var setBusiness     = document.getElementById('set-business');
  var saveProfileBtn  = document.getElementById('save-profile-btn');
  var profileSaved    = document.getElementById('profile-saved');
  var setCurrency     = document.getElementById('set-currency');
  var saveCurrencyBtn = document.getElementById('save-currency-btn');
  var currencySaved   = document.getElementById('currency-saved');
  var toggleLowStock  = document.getElementById('toggle-low-stock');
  var toggleExpWarn   = document.getElementById('toggle-expense-warn');
  var toggleDailyEmail  = document.getElementById('toggle-daily-email');
  var setThreshold      = document.getElementById('set-threshold');
  var saveThresholdBtn  = document.getElementById('save-threshold-btn');
  var resetDataBtn    = document.getElementById('reset-data-btn');

  var transactions  = [];
  var inventory     = [];
  var activeFilter  = 'all';
  var searchQuery   = '';
  var sellTargetId  = null;
  var currentImgB64 = null;
  var LOW_STOCK     = 5;
  var currentUser   = null;
  var expWarnEmailSentToday = false;
  var ITEMS_PER_PAGE     = 20;
  var txCurrentPage      = 1;
  var monthlyCurrentPage = 1;
  var monthlySearchQuery = '';
  var currentMonthTxs    = [];

  var settings = {
    name:          '',
    email:         '',
    business:      '',
    currency:      '$',
    lowStockAlert:      true,
    expenseWarn:        true,
    dailyEmail:         true,
    lowStockThreshold:  5
  };

  function txKey()  { return 'am_tx_'  + (currentUser ? currentUser.uid : 'guest'); }
  function invKey() { return 'am_inv_' + (currentUser ? currentUser.uid : 'guest'); }
  function saveTx()  { localStorage.setItem(txKey(),  JSON.stringify(transactions)); }
  function loadTx()  { var r = localStorage.getItem(txKey());  return r ? JSON.parse(r) : []; }
  function saveInv() { localStorage.setItem(invKey(), JSON.stringify(inventory)); }
  function loadInv() { var r = localStorage.getItem(invKey()); return r ? JSON.parse(r) : []; }

  function genId() { return 'id_' + Date.now() + '_' + Math.random().toString(36).slice(2,6); }

  function fmt(n) {
    return settings.currency + Number(n).toLocaleString('en-US', { minimumFractionDigits:2, maximumFractionDigits:2 });
  }

  function fmtDate(iso) {
    return new Date(iso).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
  }

  function esc(str) {
    var d = document.createElement('div');
    d.appendChild(document.createTextNode(String(str || '')));
    return d.innerHTML;
  }

  function showLoading()  { authLoading.classList.remove('hidden'); }
  function hideLoading()  { authLoading.classList.add('hidden'); }

  function clearAuthErrors() {
    [signinError, registerError].forEach(function(el) {
      el.classList.add('hidden');
      el.textContent = '';
    });
    [emailError, passwordError, regNameError, regEmailError, regPwError].forEach(function(el) {
      el.textContent = '';
    });
  }
    function applySettings() {
    if (setCurrency) setCurrency.value = settings.currency;
    if (setName) setName.value = settings.name;
    if (setEmail) setEmail.value = settings.email;
    if (setBusiness) setBusiness.value = settings.business;
    if (toggleLowStock) toggleLowStock.checked = settings.lowStockAlert;
    if (toggleExpWarn) toggleExpWarn.checked = settings.expenseWarn;
    if (toggleDailyEmail) toggleDailyEmail.checked = settings.dailyEmail;
    if (setThreshold) setThreshold.value = settings.lowStockThreshold || 5;

    LOW_STOCK = settings.lowStockThreshold || 5;

    currencyLabels.forEach(function(el) {
      el.textContent = settings.currency;
    });
  }

  function updateTopbar() {
    if (!currentUser) return;

    var displayName = settings.name || currentUser.email.split('@')[0];

    if (topbarName) topbarName.textContent = displayName;
    if (topbarEmailSub) topbarEmailSub.textContent = currentUser.email;
    if (topbarAvatar) topbarAvatar.textContent = displayName.charAt(0).toUpperCase();
  }

  tabSignin.addEventListener('click', function() {
    tabSignin.classList.add('active');
    tabRegister.classList.remove('active');
    signinForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
    clearAuthErrors();
  });

  tabRegister.addEventListener('click', function() {
    tabRegister.classList.add('active');
    tabSignin.classList.remove('active');
    registerForm.classList.remove('hidden');
    signinForm.classList.add('hidden');
    clearAuthErrors();
  });

  loginBtn.addEventListener('click', function() {
    clearAuthErrors();

    var email = emailInput.value.trim();
    var pass = passwordInput.value;
    var valid = true;

    if (!email) {
      emailError.textContent = 'Email is required.';
      valid = false;
    }

    if (!pass) {
      passwordError.textContent = 'Password is required.';
      valid = false;
    }

    if (!valid) return;

    showLoading();
    loginBtn.disabled = true;

    auth.signInWithEmailAndPassword(email, pass)
      .catch(function(err) {
        hideLoading();
        loginBtn.disabled = false;

        var msg = 'Sign in failed.';
        if (err.code === 'auth/user-not-found') msg = 'No account found with this email.';
        if (err.code === 'auth/wrong-password') msg = 'Incorrect password.';
        if (err.code === 'auth/invalid-credential') msg = 'Invalid email or password.';
        if (err.code === 'auth/too-many-requests') msg = 'Too many attempts. Please wait.';

        signinError.textContent = msg;
        signinError.classList.remove('hidden');
      });
  });

  passwordInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') loginBtn.click();
  });

  registerBtn.addEventListener('click', function() {
    clearAuthErrors();

    var name = regName.value.trim();
    var business = regBusiness.value.trim();
    var email = regEmail.value.trim();
    var pass = regPassword.value;
    var valid = true;

    if (!name) {
      regNameError.textContent = 'Name is required.';
      valid = false;
    }

    if (!email) {
      regEmailError.textContent = 'Email is required.';
      valid = false;
    }

    if (!pass || pass.length < 6) {
      regPwError.textContent = 'Password must be 6+ characters.';
      valid = false;
    }

    if (!valid) return;

    showLoading();
    registerBtn.disabled = true;

    auth.createUserWithEmailAndPassword(email, pass)
      .then(function(result) {
        var user = result.user;
        return db.collection('users').doc(user.uid).set({
          name: name,
          business: business,
          email: email,
          currency: '$',
          lowStockAlert: true,
          expenseWarn: true,
          dailyEmail: true,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }).then(function() {
          return sendWelcomeEmail(name, email);
        });
      })
      .catch(function(err) {
        hideLoading();
        registerBtn.disabled = false;

        var msg = 'Registration failed.';
        if (err.code === 'auth/email-already-in-use') msg = 'An account with this email already exists.';
        if (err.code === 'auth/weak-password') msg = 'Password is too weak.';

        registerError.textContent = msg;
        registerError.classList.remove('hidden');
      });
  });

  auth.onAuthStateChanged(function(user) {
    if (user) {
      currentUser = user;

      db.collection('users').doc(user.uid).get()
        .then(function(doc) {
          if (doc.exists) {
            var d = doc.data();
            settings.name          = d.name || '';
            settings.business      = d.business || '';
            settings.currency      = d.currency || '$';
            settings.lowStockAlert     = d.lowStockAlert !== undefined ? d.lowStockAlert : true;
            settings.expenseWarn       = d.expenseWarn !== undefined ? d.expenseWarn : true;
            settings.dailyEmail        = d.dailyEmail !== undefined ? d.dailyEmail : true;
            settings.lowStockThreshold = d.lowStockThreshold !== undefined ? d.lowStockThreshold : 5;
            LOW_STOCK = settings.lowStockThreshold;
          }

          settings.email = user.email;
          transactions = loadTx();
          inventory = loadInv();
          showApp(user);
        })
        .catch(function() {
          settings.email = user.email;
          transactions = loadTx();
          inventory = loadInv();
          showApp(user);
        });
    } else {
      currentUser = null;
      transactions = [];
      inventory = [];
      hideLoading();
      loginBtn.disabled = false;
      registerBtn.disabled = false;
      loginPage.classList.remove('hidden');
      app.classList.add('hidden');
    }
  });

  function showApp(user) {
    hideLoading();
    if (loginPage) loginPage.classList.add('hidden');
    if (app) app.classList.remove('hidden');
    applySettings();
    updateTopbar();
    refreshAll();
    showSection('dashboard');
    checkDailySummaryEmail();
  }

  logoutBtn.addEventListener('click', function() {
    auth.signOut().then(function() {
      txProductSelect.innerHTML = '<option value="">— None —</option>';
      txProdQty.value = '';
      prodLinkInfo.classList.add('empty');
      prodLinkInfo.innerHTML = '';
      LOW_STOCK = 5;
      expWarnEmailSentToday = false;
      toast('Signed out', 'See you next time!', 'info');
    });
  });

  /* ══════════════════════════════════════════════════════════
     DAILY SUMMARY EMAIL
  ══════════════════════════════════════════════════════════ */
  function checkDailySummaryEmail() {
    if (!settings.dailyEmail || !currentUser) return;

    var key = 'am_daily_' + currentUser.uid;
    var lastSent = localStorage.getItem(key);
    var today = new Date().toDateString();

    if (lastSent === today) return;

    var todayTxs = transactions.filter(function(tx) {
      return new Date(tx.date).toDateString() === today;
    });

    var inc = 0;
    var exp = 0;

    transactions.forEach(function(tx) {
      if (tx.type === 'income') inc += tx.amount;
      else exp += tx.amount;
    });

    sendDailySummaryEmail(
      settings.name || 'there',
      currentUser.email,
      todayTxs,
      fmt(inc),
      fmt(exp),
      fmt(inc - exp)
    ).then(function() {
      localStorage.setItem(key, today);
      toast('Daily Summary', 'Your daily summary email has been sent!', 'info', 4000);
    }).catch(function(err) {
      toast('Daily Summary Failed', 'Could not send the summary email. Please check your EmailJS setup.', 'error', 5000);
      console.error('Daily summary failed:', err);
    });
  }
    /* ══════════════════════════════════════════════════════════
     DASHBOARD
  ══════════════════════════════════════════════════════════ */
  function updateDashboard() {
    var income = 0;
    var expenses = 0;

    transactions.forEach(function(tx) {
      if (tx.type === 'income') income += tx.amount;
      else expenses += tx.amount;
    });

    var balance = income - expenses;

    elIncome.textContent   = fmt(income);
    elExpenses.textContent = fmt(expenses);
    elBalance.textContent  = fmt(balance);
    elCount.textContent    = transactions.length;
    elBalance.style.color  = (settings.expenseWarn && balance < 0) ? 'var(--expense)' : 'var(--accent)';

    if (settings.expenseWarn && balance < 0 && !expWarnEmailSentToday && currentUser) {
      sendExpenseWarningEmail(settings.name || 'there', currentUser.email, fmt(balance), fmt(income), fmt(expenses))
        .then(function() {
          expWarnEmailSentToday = true;
          toast('Expense Warning', 'Your expenses exceed your income. An alert email was sent.', 'warning', 5000);
        })
        .catch(function(err) {
          toast('Expense Alert Failed', 'The warning email could not be sent.', 'error', 5000);
          console.error('Expense warning email failed:', err);
        });
    }

    recentList.innerHTML = '';

    if (!transactions.length) {
      recentList.innerHTML = '<p class="empty-state">No transactions yet.</p>';
    } else {
      transactions.slice().sort(function(a,b) {
        return new Date(b.date) - new Date(a.date);
      }).slice(0,5).forEach(function(tx) {
        var el = document.createElement('div');
        el.className = 'recent-item';
        el.innerHTML =
          '<div><div class="recent-title">' + esc(tx.title) + '</div><div class="recent-date">' + fmtDate(tx.date) + '</div></div>' +
          '<div style="display:flex;align-items:center;gap:8px;">' +
          '<span class="' + (tx.type === 'income' ? 'amount-income' : 'amount-expense') + '">' + (tx.type === 'income' ? '+' : '-') + fmt(tx.amount) + '</span>' +
          '<span class="badge badge-' + tx.type + '">' + tx.type + '</span></div>';
        recentList.appendChild(el);
      });
    }

    buildMonthDropdown();
  }

  function buildMonthDropdown() {
    var current = monthSelect.value;
    var months = {};

    transactions.forEach(function(tx) {
      var d = new Date(tx.date);
      var key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2,'0');
      months[key] = true;
    });

    var sorted = Object.keys(months).sort(function(a,b) {
      return b.localeCompare(a);
    });

    monthSelect.innerHTML = '<option value="">— Select a month —</option>';

    sorted.forEach(function(key) {
      var p = key.split('-');
      var label = new Date(parseInt(p[0]), parseInt(p[1]) - 1, 1).toLocaleDateString('en-US', {
        month:'long',
        year:'numeric'
      });

      var opt = document.createElement('option');
      opt.value = key;
      opt.textContent = label;
      monthSelect.appendChild(opt);
    });

    if (current && months[current]) {
      monthSelect.value = current;
      renderMonthlySummary(current);
    } else {
      monthSelect.value = '';
      monthlyCards.classList.add('hidden');
      monthlyTxSec.classList.add('hidden');
      monthlyHolder.classList.remove('hidden');
    }
  }

  function renderMonthlySummary(key) {
    if (!key) {
      monthlyCards.classList.add('hidden');
      monthlyTxSec.classList.add('hidden');
      monthlyHolder.classList.remove('hidden');
      return;
    }

    var p  = key.split('-');
    var yr = parseInt(p[0]);
    var mo = parseInt(p[1]) - 1;

    var allMonthTxs = transactions.filter(function(tx) {
      var d = new Date(tx.date);
      return d.getFullYear() === yr && d.getMonth() === mo;
    });

    var inc = 0;
    var exp = 0;

    allMonthTxs.forEach(function(tx) {
      if (tx.type === 'income') inc += tx.amount;
      else exp += tx.amount;
    });

    var bal = inc - exp;

    monthIncome.textContent   = fmt(inc);
    monthExpenses.textContent = fmt(exp);
    monthBalance.textContent  = fmt(bal);
    monthCount.textContent    = allMonthTxs.length;
    monthBalance.style.color  = bal < 0 ? 'var(--expense)' : 'var(--accent)';

    monthlyCards.classList.remove('hidden');
    monthlyTxSec.classList.remove('hidden');
    monthlyHolder.classList.add('hidden');

    var filtered = allMonthTxs.slice();
    if (monthlySearchQuery.trim()) {
      var q = monthlySearchQuery.toLowerCase();
      filtered = filtered.filter(function(tx) {
        return tx.title.toLowerCase().indexOf(q) !== -1;
      });
    }

    filtered.sort(function(a,b) {
      return new Date(b.date) - new Date(a.date);
    });

    currentMonthTxs = filtered;
    renderMonthlyPage();
  }

  function renderMonthlyPage() {
    monthlyTxList.innerHTML = '';

    if (!currentMonthTxs.length) {
      monthlyTxList.innerHTML = '<p class="empty-state">No transactions match your search.</p>';
      monthlyPagBar.classList.add('hidden');
      return;
    }

    var totalPages = Math.ceil(currentMonthTxs.length / ITEMS_PER_PAGE);
    if (monthlyCurrentPage > totalPages) monthlyCurrentPage = totalPages;
    if (monthlyCurrentPage < 1) monthlyCurrentPage = 1;

    var start = (monthlyCurrentPage - 1) * ITEMS_PER_PAGE;
    var page  = currentMonthTxs.slice(start, start + ITEMS_PER_PAGE);

    page.forEach(function(tx) {
      var row = document.createElement('div');
      row.className = 'monthly-tx-row';
      row.innerHTML =
        '<div class="monthly-tx-left">' +
          '<div class="monthly-tx-title">' + esc(tx.title) + '</div>' +
          (tx.note ? '<div class="monthly-tx-note">' + esc(tx.note) + '</div>' : '') +
          '<div class="monthly-tx-note">' + fmtDate(tx.date) + '</div>' +
        '</div>' +
        '<div class="monthly-tx-right">' +
          '<span class="' + (tx.type === 'income' ? 'amount-income' : 'amount-expense') + '">' +
            (tx.type === 'income' ? '+' : '-') + fmt(tx.amount) +
          '</span>' +
          '<span class="badge badge-' + tx.type + '">' + tx.type + '</span>' +
        '</div>';
      monthlyTxList.appendChild(row);
    });

    if (currentMonthTxs.length > ITEMS_PER_PAGE) {
      monthlyPagBar.classList.remove('hidden');
      monthlyPageInfo.textContent = 'Page ' + monthlyCurrentPage + ' of ' + totalPages + '  (' + currentMonthTxs.length + ' shown)';
      monthlyPrevBtn.disabled = monthlyCurrentPage <= 1;
      monthlyNextBtn.disabled = monthlyCurrentPage >= totalPages;
    } else {
      monthlyPagBar.classList.add('hidden');
    }
  }

  monthlyPrevBtn.addEventListener('click', function() {
    monthlyCurrentPage--;
    renderMonthlyPage();
  });

  monthlyNextBtn.addEventListener('click', function() {
    monthlyCurrentPage++;
    renderMonthlyPage();
  });

  monthlySearch.addEventListener('input', function() {
    monthlySearchQuery  = this.value;
    monthlyCurrentPage  = 1;
    renderMonthlySummary(monthSelect.value);
  });

  monthSelect.addEventListener('change', function() {
    monthlySearchQuery  = '';
    monthlySearch.value = '';
    monthlyCurrentPage  = 1;
    renderMonthlySummary(this.value);
  });

  function refreshAll() {
    txCurrentPage = 1;
    updateDashboard();
    renderTable();
    renderInventory();
  }
    /* ══════════════════════════════════════════════════════════
     TRANSACTIONS
  ══════════════════════════════════════════════════════════ */
  function renderTable() {
    var list = transactions.slice();

    if (activeFilter !== 'all') {
      list = list.filter(function(t) { return t.type === activeFilter; });
    }

    if (searchQuery.trim()) {
      var q = searchQuery.toLowerCase();
      list = list.filter(function(t) {
        return t.title.toLowerCase().indexOf(q) !== -1;
      });
    }

    list.sort(function(a,b) {
      return new Date(b.date) - new Date(a.date);
    });

    txTbody.innerHTML = '';

    if (!list.length) {
      txEmpty.classList.remove('hidden');
      return;
    }

    txEmpty.classList.add('hidden');

    list.forEach(function(tx) {
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td>' + esc(tx.title) + '</td>' +
        '<td class="' + (tx.type === 'income' ? 'amount-income' : 'amount-expense') + '">' + (tx.type === 'income' ? '+' : '-') + fmt(tx.amount) + '</td>' +
        '<td><span class="badge badge-' + tx.type + '">' + tx.type + '</span></td>' +
        '<td class="tx-note-cell">' + esc(tx.note || '—') + '</td>' +
        '<td>' + fmtDate(tx.date) + '</td>' +
        '<td><div class="action-btns">' +
          '<button class="btn-edit" onclick="AM.editTx(\'' + tx.id + '\')">Edit</button>' +
          '<button class="btn-delete" onclick="AM.deleteTx(\'' + tx.id + '\')">Delete</button>' +
        '</div></td>';

      txTbody.appendChild(tr);
    });
  }

  productLinkToggle.addEventListener('click', function() {
    var h = productLinkBody.classList.contains('hidden');
    productLinkBody.classList.toggle('hidden', !h);
    productLinkArrow.classList.toggle('open', h);
  });

  function populateProductDropdown() {
    var cur = txProductSelect.value;
    txProductSelect.innerHTML = '<option value="">— None —</option>';

    inventory.forEach(function(p) {
      var opt = document.createElement("option");
      opt.value = p.id;
      opt.textContent = p.name + ' (Stock: ' + p.qty + ' at ' + fmt(p.price) + ')';
      if (p.qty === 0) opt.textContent += " — OUT OF STOCK";
      txProductSelect.appendChild(opt);
    });

    txProductSelect.value = cur;
    updateProdLinkInfo();
  }

  function updateProdLinkInfo() {
    var pid = txProductSelect.value;
    var qty = parseInt(txProdQty.value) || 0;

    if (!pid) {
      prodLinkInfo.classList.add('empty');
      prodLinkInfo.innerHTML = '';
      return;
    }

    var p = inventory.find(function(p) { return p.id === pid; });
    if (!p) {
      prodLinkInfo.classList.add('empty');
      return;
    }

    prodLinkInfo.classList.remove('empty');

    var warn = '';
    if (p.qty === 0) {
      warn = '<div class="prod-link-info-stock-warn">⚠ Out of stock!</div>';
    } else if (p.qty <= LOW_STOCK) {
      warn = '<div class="prod-link-info-stock-warn">⚠ Low stock: ' + p.qty + ' left</div>';
    }

    prodLinkInfo.innerHTML =
      '<div class="prod-link-info-name">' + esc(p.name) + '</div>' +
      '<div class="prod-link-info-row">Price: ' + fmt(p.price) + '/unit</div>' +
      '<div class="prod-link-info-row">In stock: ' + p.qty + '</div>' +
      (qty > 0 ? '<div class="prod-link-info-row">Total: <strong>' + fmt(qty * p.price) + '</strong></div>' : '') +
      warn;

    if (qty > 0) txAmount.value = (qty * p.price).toFixed(2);
  }

  txProductSelect.addEventListener('change', function() {
    txProdQty.value = '';
    updateProdLinkInfo();

    if (txProductSelect.value && !txTitle.value.trim()) {
      var p = inventory.find(function(p) { return p.id === txProductSelect.value; });
      if (p) txTitle.value = 'Sale: ' + p.name;
    }
  });

  txProdQty.addEventListener('input', updateProdLinkInfo);

  saveBtn.addEventListener('click', function() {
    txTitleError.textContent = '';
    txAmtError.textContent = '';
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

    var lid = txProductSelect.value;
    var lqty = parseInt(txProdQty.value);

    if (lid) {
      if (!txProdQty.value || isNaN(lqty) || lqty <= 0) {
        txProdQtyError.textContent = 'Enter quantity > 0.';
        valid = false;
      } else {
        var lp = inventory.find(function(p) {
          return p.id === lid;
        });

        if (lp && lqty > lp.qty) {
          txProdQtyError.textContent = 'Only ' + lp.qty + ' in stock.';
          valid = false;
        }
      }
    }

    if (!valid) return;

    var id = editIdInput.value;

    if (id) {
      var i = transactions.findIndex(function(t) {
        return t.id === id;
      });

      if (i !== -1) {
        transactions[i].title = txTitle.value.trim();
        transactions[i].amount = amt;
        transactions[i].type = txType.value;
        transactions[i].note = txNote.value.trim();
      }

      exitTxEdit();
      toast('Transaction Updated', txTitle.value.trim() + ' has been updated.', 'success');
    } else {
      var newTx = {
        id: genId(),
        title: txTitle.value.trim(),
        amount: amt,
        type: txType.value,
        note: txNote.value.trim(),
        date: new Date().toISOString(),
        linkedProductId: lid || null,
        linkedQty: lid ? lqty : null
      };

      transactions.push(newTx);

      if (lid) {
        var pi = inventory.findIndex(function(p) {
          return p.id === lid;
        });

        if (pi !== -1) {
          inventory[pi].qty -= lqty;
          if (inventory[pi].qty < 0) inventory[pi].qty = 0;
          saveInv();
        }
      }

      txTitle.value = '';
      txAmount.value = '';
      txType.value = 'income';
      txNote.value = '';
      txProductSelect.value = '';
      txProdQty.value = '';
      prodLinkInfo.classList.add('empty');
      prodLinkInfo.innerHTML = '';

      var typeLabel = newTx.type === 'income' ? '💰 Income' : '💸 Expense';
      toast(typeLabel + ' Added', newTx.title + ' — ' + fmt(newTx.amount), 'success');
    }

    saveTx();
    refreshAll();
  });

  function editTx(id) {
    var tx = transactions.find(function(t) { return t.id === id; });
    if (!tx) return;

    editIdInput.value = tx.id;
    txTitle.value = tx.title;
    txAmount.value = tx.amount;
    txType.value = tx.type;
    txNote.value = tx.note || '';

    formTitle.textContent = 'Edit Transaction';
    saveBtn.textContent = 'Save Changes';
    cancelBtn.textContent = 'Cancel Edit';

    document.querySelector('#section-transactions .form-card').scrollIntoView({
      behavior:'smooth',
      block:'start'
    });

    toast('Edit Mode', 'Editing "' + tx.title + '"', 'info', 2000);
  }

  function exitTxEdit() {
    editIdInput.value = '';
    formTitle.textContent = 'Add Transaction';
    saveBtn.textContent = 'Add Transaction';
    cancelBtn.textContent = 'Clear';
    txTitle.value = '';
    txAmount.value = '';
    txType.value = 'income';
    txNote.value = '';
    txTitleError.textContent = '';
    txAmtError.textContent = '';
  }

  cancelBtn.addEventListener('click', function() {
    if (editIdInput.value) {
      exitTxEdit();
    } else {
      txTitle.value = '';
      txAmount.value = '';
      txType.value = 'income';
      txNote.value = '';
      txProductSelect.value = '';
      txProdQty.value = '';
      prodLinkInfo.classList.add('empty');
      prodLinkInfo.innerHTML = '';
      txTitleError.textContent = '';
      txAmtError.textContent = '';
      txProdQtyError.textContent = '';
    }
  });

  function deleteTx(id) {
    var tx = transactions.find(function(t) { return t.id === id; });
    var title = tx ? tx.title : 'Transaction';

    showConfirm(
      'Delete Transaction',
      'Delete "' + title + '"? This cannot be undone.',
      '🗑️',
      'Yes, Delete',
      function() {
        transactions = transactions.filter(function(t) { return t.id !== id; });
        saveTx();
        refreshAll();
        toast('Transaction Deleted', '"' + title + '" has been removed.', 'error', 3000);
      }
    );
  }

  filterBtns.forEach(function(btn) {
    btn.addEventListener('click', function() {
      filterBtns.forEach(function(b) { b.classList.remove('active'); });
      this.classList.add('active');
      activeFilter = this.dataset.filter;
      renderTable();
    });
  });
    /* ══════════════════════════════════════════════════════════
     INVENTORY
  ══════════════════════════════════════════════════════════ */
  imgFileInput.addEventListener('change', function() {
    if (this.files && this.files[0]) readImageFile(this.files[0]);
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
    var f = e.dataTransfer.files[0];
    if (f && f.type.startsWith('image/')) readImageFile(f);
  });

  function readImageFile(file) {
    if (file.size > 2 * 1024 * 1024) {
      toast('Image Too Large', 'Please use an image under 2MB.', 'error');
      return;
    }

    var r = new FileReader();
    r.onload = function(e) {
      currentImgB64 = e.target.result;
      showImgPreview(currentImgB64);
    };
    r.readAsDataURL(file);
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

  function renderInventory() {
    invGrid.innerHTML = '';

    var lowItems = inventory.filter(function(p) { return p.qty <= LOW_STOCK; });

    if (settings.lowStockAlert && lowItems.length) {
      lowStockBanner.classList.remove('hidden');
      lowStockNames.textContent = lowItems.map(function(p) {
        return p.name + ' (' + p.qty + ')';
      }).join(', ');
    } else {
      lowStockBanner.classList.add('hidden');
    }

    if (!inventory.length) {
      invEmpty.classList.remove('hidden');
      return;
    }

    invEmpty.classList.add('hidden');

    inventory.forEach(function(p) {
      var isLow = p.qty <= LOW_STOCK;
      var card = document.createElement('div');
      card.className = 'product-card' + (isLow ? ' low-stock' : '');

      var imgHtml = p.image
        ? '<img class="product-img" src="' + p.image + '" alt="' + esc(p.name) + '" />'
        : '<div class="product-img-placeholder">📦</div>';

      card.innerHTML =
        imgHtml +
        '<div class="product-body"><div class="product-name">' + esc(p.name) + '</div><div class="product-desc">' + esc(p.desc || '') + '</div>' +
        '<div class="product-meta"><div class="product-qty">Stock: <strong>' + p.qty + '</strong></div><div class="product-price">' + fmt(p.price) + '/unit</div></div>' +
        (isLow && settings.lowStockAlert ? '<span class="low-stock-tag">⚠ Low Stock</span>' : '') +
        '<div class="product-actions"><button class="btn-sell" onclick="AM.openSell(\'' + p.id + '\')" ' + (p.qty === 0 ? 'disabled' : '') + '>💰 Sell</button>' +
        '<button class="btn-edit" onclick="AM.editProd(\'' + p.id + '\')">Edit</button><button class="btn-delete" onclick="AM.deleteProd(\'' + p.id + '\')">Delete</button></div></div>';

      invGrid.appendChild(card);
    });

    populateProductDropdown();
  }

  invSaveBtn.addEventListener('click', function() {
    invNameError.textContent = '';
    invQtyError.textContent = '';
    invPriceError.textContent = '';

    var valid = true;

    if (!invName.value.trim()) {
      invNameError.textContent = 'Name required.';
      valid = false;
    }

    var qty = parseInt(invQty.value);
    var price = parseFloat(invPrice.value);

    if (invQty.value === '' || isNaN(qty) || qty < 0) {
      invQtyError.textContent = 'Enter qty ≥ 0.';
      valid = false;
    }

    if (invPrice.value === '' || isNaN(price) || price < 0) {
      invPriceError.textContent = 'Enter price ≥ 0.';
      valid = false;
    }

    if (!valid) return;

    var id = invEditId.value;

    if (id) {
      var i = inventory.findIndex(function(p) { return p.id === id; });

      if (i !== -1) {
        inventory[i].name = invName.value.trim();
        inventory[i].desc = invDesc.value.trim();
        inventory[i].qty = qty;
        inventory[i].price = price;
        if (currentImgB64 !== null) inventory[i].image = currentImgB64;
      }

      exitInvEdit();
      toast('Product Updated', invName.value.trim() + ' has been updated.', 'success');
    } else {
      var newProd = {
        id: genId(),
        name: invName.value.trim(),
        desc: invDesc.value.trim(),
        qty: qty,
        price: price,
        image: currentImgB64 || null
      };

      inventory.push(newProd);
      invName.value = '';
      invDesc.value = '';
      invQty.value = '';
      invPrice.value = '';
      clearImgPreview();
      toast('Product Added', newProd.name + ' added to inventory.', 'success');

      if (settings.lowStockAlert && qty <= LOW_STOCK && currentUser) {
        sendLowStockEmail(settings.name || 'there', currentUser.email, [{name:newProd.name, qty:qty}])
          .then(function() {
            toast('Low Stock Alert', newProd.name + ' starts with low stock. Email alert sent.', 'warning', 4000);
          })
          .catch(function(err) {
            toast('Low Stock Email Failed', 'Could not send the low stock email.', 'error', 5000);
            console.error('Low stock email failed after product add:', err);
          });
      }
    }

    saveInv();
    renderInventory();
  });

  function editProd(id) {
    var p = inventory.find(function(p) { return p.id === id; });
    if (!p) return;

    invEditId.value = p.id;
    invName.value = p.name;
    invDesc.value = p.desc || '';
    invQty.value = p.qty;
    invPrice.value = p.price;
    invFormTitle.textContent = 'Edit Product';
    invSaveBtn.textContent = 'Save Changes';
    invCancelBtn.classList.remove('hidden');

    if (p.image) {
      showImgPreview(p.image);
      currentImgB64 = null;
    } else {
      clearImgPreview();
    }

    document.querySelector('#section-inventory .form-card').scrollIntoView({
      behavior:'smooth',
      block:'start'
    });
  }

  function exitInvEdit() {
    invEditId.value = '';
    invFormTitle.textContent = 'Add Product';
    invSaveBtn.textContent = 'Add Product';
    invCancelBtn.classList.add('hidden');
    invName.value = '';
    invDesc.value = '';
    invQty.value = '';
    invPrice.value = '';
    invNameError.textContent = '';
    invQtyError.textContent = '';
    invPriceError.textContent = '';
    clearImgPreview();
  }

  invCancelBtn.addEventListener('click', exitInvEdit);

  function deleteProd(id) {
    var p = inventory.find(function(p) { return p.id === id; });
    var name = p ? p.name : 'Product';

    showConfirm(
      'Delete Product',
      'Delete "' + name + '" from inventory? This cannot be undone.',
      '📦',
      'Yes, Delete',
      function() {
        inventory = inventory.filter(function(p) { return p.id !== id; });
        saveInv();
        renderInventory();
        toast('Product Deleted', '"' + name + '" removed from inventory.', 'error', 3000);
      }
    );
  }

  function openSell(id) {
    var p = inventory.find(function(p) { return p.id === id; });
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
    var p = inventory.find(function(p) { return p.id === sellTargetId; });
    if (p) sellTotal.textContent = fmt((parseInt(this.value) || 0) * p.price);
  });

  sellConfirmBtn.addEventListener('click', function() {
    sellQtyError.textContent = '';

    var p = inventory.find(function(p) { return p.id === sellTargetId; });
    if (!p) return;

    var qty = parseInt(sellQtyInput.value);

    if (!sellQtyInput.value || isNaN(qty) || qty <= 0) {
      sellQtyError.textContent = 'Enter qty > 0.';
      return;
    }

    if (qty > p.qty) {
      sellQtyError.textContent = 'Only ' + p.qty + ' in stock.';
      return;
    }

    var total = qty * p.price;
    p.qty -= qty;
    saveInv();

    transactions.push({
      id: genId(),
      title: 'Sale: ' + p.name + ' x' + qty,
      amount: total,
      type: 'income',
      note: 'Sold from Inventory',
      date: new Date().toISOString()
    });

    saveTx();
    sellModal.classList.add('hidden');
    sellTargetId = null;
    refreshAll();

    toast('Sale Recorded! 💰', qty + 'x ' + p.name + ' — ' + fmt(total) + ' added as income.', 'success', 4000);

    if (settings.lowStockAlert && p.qty <= LOW_STOCK && currentUser) {
      sendLowStockEmail(settings.name || 'there', currentUser.email, [{name:p.name, qty:p.qty}])
        .then(function() {
          toast('Low Stock Alert', p.name + ' is now low (' + p.qty + ' left). Email sent.', 'warning', 4000);
        })
        .catch(function(err) {
          toast('Low Stock Email Failed', 'Could not send the low stock email.', 'error', 5000);
          console.error('Low stock email failed after sale:', err);
        });
    }
  });

  sellCancelBtn.addEventListener('click', function() {
    sellModal.classList.add('hidden');
  });

  sellModal.addEventListener('click', function(e) {
    if (e.target === sellModal) sellModal.classList.add('hidden');
  });

  /* ══════════════════════════════════════════════════════════
     SETTINGS
  ══════════════════════════════════════════════════════════ */
  saveProfileBtn.addEventListener('click', function() {
    if (!currentUser) return;

    settings.name = setName.value.trim();
    settings.business = setBusiness.value.trim();

    db.collection('users').doc(currentUser.uid).update({
      name: settings.name,
      business: settings.business
    })
    .then(function() {
      if (profileSaved) {
        profileSaved.classList.remove('hidden');
        setTimeout(function() {
          profileSaved.classList.add('hidden');
        }, 2500);
      }
      updateTopbar();
      toast('Profile Saved', 'Your profile has been updated.', 'success');
    })
    .catch(function(err) {
      toast('Save Failed', err.message, 'error');
    });
  });

  saveCurrencyBtn.addEventListener('click', function() {
    settings.currency = setCurrency.value;
    currencyLabels.forEach(function(el) {
      el.textContent = settings.currency;
    });

    refreshAll();

    if (currencySaved) {
      currencySaved.classList.remove('hidden');
      setTimeout(function() {
        currencySaved.classList.add('hidden');
      }, 2500);
    }

    toast('Currency Updated', 'All amounts now show in ' + settings.currency, 'success');

    if (currentUser) {
      db.collection('users').doc(currentUser.uid).update({
        currency: settings.currency
      });
    }
  });

  toggleLowStock.addEventListener('change', function() {
    settings.lowStockAlert = this.checked;
    renderInventory();

    toast(
      this.checked ? 'Low Stock Alerts ON' : 'Low Stock Alerts OFF',
      this.checked ? 'You will be notified when stock is low.' : 'Low stock alerts are now disabled.',
      this.checked ? 'success' : 'info'
    );

    if (currentUser) {
      db.collection('users').doc(currentUser.uid).update({
        lowStockAlert: settings.lowStockAlert
      });
    }
  });

  toggleExpWarn.addEventListener('change', function() {
    settings.expenseWarn = this.checked;
    updateDashboard();

    toast(
      this.checked ? 'Expense Warning ON' : 'Expense Warning OFF',
      '',
      this.checked ? 'success' : 'info',
      2000
    );

    if (currentUser) {
      db.collection('users').doc(currentUser.uid).update({
        expenseWarn: settings.expenseWarn
      });
    }
  });

  saveThresholdBtn.addEventListener('click', function() {
    var val = parseInt(setThreshold.value);

    if (isNaN(val) || val < 1) {
      toast('Invalid Threshold', 'Please enter a number greater than 0.', 'error');
      return;
    }

    settings.lowStockThreshold = val;
    LOW_STOCK = val;
    renderInventory();
    toast('Threshold Updated', 'Low stock alerts will trigger at ' + val + ' or fewer units.', 'success');

    if (currentUser) {
      db.collection('users').doc(currentUser.uid).update({
        lowStockThreshold: val
      });
    }
  });

  toggleDailyEmail.addEventListener('change', function() {
    settings.dailyEmail = this.checked;

    toast(
      this.checked ? 'Daily Emails ON' : 'Daily Emails OFF',
      this.checked ? 'You will receive a daily summary email.' : 'Daily summary emails are disabled.',
      this.checked ? 'success' : 'info'
    );

    if (currentUser) {
      db.collection('users').doc(currentUser.uid).update({
        dailyEmail: settings.dailyEmail
      });
    }
  });

  resetDataBtn.addEventListener('click', function() {
    showConfirm(
      '⚠️ Reset All Data',
      'This will permanently delete ALL transactions and inventory. This cannot be undone.',
      '🗑️',
      'Yes, Reset Everything',
      function() {
        transactions = [];
        inventory = [];
        localStorage.removeItem(txKey());
        localStorage.removeItem(invKey());
        refreshAll();
        toast('All Data Reset', 'All transactions and inventory have been cleared.', 'warning', 4000);
      }
    );
  });

  function showSection(name) {
    document.querySelectorAll('.section').forEach(function(s) {
      s.classList.remove('active');
    });

    var t = document.getElementById('section-' + name);
    if (t) t.classList.add('active');

    navItems.forEach(function(n) {
      n.classList.toggle('active', n.dataset.section === name);
    });

    topbarTitle.textContent = name.charAt(0).toUpperCase() + name.slice(1);
  }

  navItems.forEach(function(item) {
    item.addEventListener('click', function(e) {
      e.preventDefault();
      showSection(item.dataset.section);
    });
  });

  window.AM = {
    editTx: editTx,
    deleteTx: deleteTx,
    editProd: editProd,
    deleteProd: deleteProd,
    openSell: openSell
  };
});
