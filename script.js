/* AguaMana — script.js */

/* ── FIREBASE CONFIG ────────────────────────────────────────── */
var firebaseConfig = {
  apiKey: "AIzaSyDgYaAfXLU-j2g8TFsSkAL73qwqwXlGERc",
  authDomain: "aquamana-be3d8.firebaseapp.com",
  projectId: "aquamana-be3d8",
  storageBucket: "aquamana-be3d8.firebasestorage.app",
  messagingSenderId: "461157381690",
  appId: "1:461157381690:web:d70804952f7d625a25e703",
  measurementId: "G-KXFWSTXQ16"
};
firebase.initializeApp(firebaseConfig);
var auth = firebase.auth();
var db = firebase.firestore();

/* ── EMAILJS CONFIG ─────────────────────────────────────────── */
var EJS_SERVICE = "service_qra8hni";
var EJS_TEMPLATE = "template_q7bc1pb";
var EJS_KEY = "c8pnyj3ZHpF97_Qjx";
emailjs.init({ publicKey: EJS_KEY });

/* ══════════════════════════════════════════════════════════════
   TOAST NOTIFICATION SYSTEM
══════════════════════════════════════════════════════════════ */
var toastContainer = document.getElementById("toast-container");

/* ══════════════════════════════════════════════════════════════
   CUSTOM CONFIRM MODAL
══════════════════════════════════════════════════════════════ */
var confirmModal = document.getElementById("confirm-modal");
var confirmTitle = document.getElementById("confirm-title");
var confirmMessage = document.getElementById("confirm-message");
var confirmIcon = document.getElementById("confirm-icon");
var confirmOkBtn = document.getElementById("confirm-ok-btn");
var confirmCancelBtn = document.getElementById("confirm-cancel-btn");
var _confirmCallback = null;

function showConfirm(title, message, icon, okLabel, callback) {
  if (!confirmModal || !confirmTitle || !confirmMessage || !confirmIcon || !confirmOkBtn) {
    if (window.confirm(message)) {
      if (callback) callback();
    }
    return;
  }

  confirmTitle.textContent = title;
  confirmMessage.textContent = message;
  confirmIcon.textContent = icon || "⚠️";
  confirmOkBtn.textContent = okLabel || "Confirm";
  _confirmCallback = callback;
  confirmModal.classList.remove("hidden");
}

if (confirmOkBtn && confirmCancelBtn && confirmModal) {
  confirmOkBtn.addEventListener("click", function () {
    confirmModal.classList.add("hidden");
    if (_confirmCallback) {
      _confirmCallback();
      _confirmCallback = null;
    }
  });

  confirmCancelBtn.addEventListener("click", function () {
    confirmModal.classList.add("hidden");
    _confirmCallback = null;
  });

  confirmModal.addEventListener("click", function (e) {
    if (e.target === confirmModal) {
      confirmModal.classList.add("hidden");
      _confirmCallback = null;
    }
  });
}

function toast(title, message, type, duration) {
  type = type || "info";
  duration = duration || 3000;

  var icons = { success: "✅", error: "❌", warning: "⚠️", info: "ℹ️" };

  var el = document.createElement("div");
  el.className = "toast toast-" + type;
  el.innerHTML =
    '<span class="toast-icon">' + icons[type] + "</span>" +
    '<div class="toast-body">' +
    '<div class="toast-title">' + title + "</div>" +
    (message ? '<div class="toast-msg">' + message + "</div>" : "") +
    "</div>" +
    '<button class="toast-close" onclick="this.parentElement._remove()">✕</button>';

  el._remove = function () {
    el.classList.add("removing");
    setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 280);
  };

  if (toastContainer) {
    toastContainer.appendChild(el);
    setTimeout(function () { el._remove(); }, duration);
  }
}

/* ══════════════════════════════════════════════════════════════
   EMAIL SYSTEM (EmailJS)
══════════════════════════════════════════════════════════════ */
function sendEmail(toEmail, subject, message) {
  return emailjs.send(EJS_SERVICE, EJS_TEMPLATE, {
    to_email: toEmail,
    subject: subject,
    message: message
  }).then(function (response) {
    console.log("Email sent:", subject, response);
    return response;
  }).catch(function (err) {
    console.error('EmailJS error for "' + subject + '":', err);
    throw err;
  });
}

function sendWelcomeEmail(name, email) {
  var msg =
    "Hi " + name + "! 👋\n\n" +
    "Welcome to AguaMana — your small business finance dashboard.\n\n" +
    "Your account has been created successfully.\n\n" +
    "Here's what you can do:\n" +
    "• Track your income and expenses\n" +
    "• Manage your product inventory\n" +
    "• View monthly financial summaries\n" +
    "• Get alerts for low stock and high expenses\n\n" +
    "Get started by adding your first transaction!\n\n" +
    "— The AguaMana Team 💧";

  return sendEmail(email, "Welcome to AguaMana! 💧", msg);
}

function sendDailySummaryEmail(name, email, txList, income, expenses, balance) {
  var today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  });

  var txLines = txList.length
    ? txList.map(function (tx) {
        return "  " + (tx.type === "income" ? "[+]" : "[-]") + " " + tx.title + " — " + tx.amount.toFixed(2);
      }).join("\n")
    : "  No transactions today.";

  var msg =
    "Hi " + name + ",\n\n" +
    "Here is your AguaMana daily summary for " + today + ":\n\n" +
    "📊 TODAY'S TRANSACTIONS:\n" + txLines + "\n\n" +
    "💰 ALL-TIME TOTALS:\n" +
    "  Total Income:   " + income + "\n" +
    "  Total Expenses: " + expenses + "\n" +
    "  Balance:        " + balance + "\n\n" +
    "Keep up the great work! 💪\n\n" +
    "— AguaMana 💧";

  return sendEmail(email, "AguaMana Daily Summary — " + today, msg);
}

function sendLowStockEmail(name, email, lowProducts) {
  var lines = lowProducts.map(function (p) {
    return "  • " + p.name + " — only " + p.qty + " unit" + (p.qty === 1 ? "" : "s") + " left";
  }).join("\n");

  var msg =
    "Hi " + name + ",\n\n" +
    "⚠️ The following products in your AguaMana inventory are running low:\n\n" +
    lines + "\n\n" +
    "Please restock soon to avoid running out.\n\n" +
    "— AguaMana 💧";

  return sendEmail(email, "⚠️ AguaMana Low Stock Alert", msg);
}

function sendExpenseWarningEmail(name, email, balance, income, expenses) {
  var msg =
    "Hi " + name + ",\n\n" +
    "🚨 Your AguaMana expenses have exceeded your income!\n\n" +
    "  Total Income:   " + income + "\n" +
    "  Total Expenses: " + expenses + "\n" +
    "  Current Balance: " + balance + "\n\n" +
    "Consider reviewing your recent expenses to get back on track.\n\n" +
    "— AguaMana 💧";

  return sendEmail(email, "🚨 AguaMana Expense Warning", msg);
}
/* ══════════════════════════════════════════════════════════════
   MAIN APP LOGIC
══════════════════════════════════════════════════════════════ */
document.addEventListener("DOMContentLoaded", function () {
  var loginPage = document.getElementById("login-page");
  var app = document.getElementById("app");
  var authLoading = document.getElementById("auth-loading");
  var signinForm = document.getElementById("signin-form");
  var emailInput = document.getElementById("email");
  var passwordInput = document.getElementById("password");
  var emailError = document.getElementById("email-error");
  var passwordError = document.getElementById("password-error");
  var signinError = document.getElementById("signin-error");
  var loginBtn = document.getElementById("login-btn");
  var registerForm = document.getElementById("register-form");
  var regName = document.getElementById("reg-name");
  var regBusiness = document.getElementById("reg-business");
  var regEmail = document.getElementById("reg-email");
  var regPassword = document.getElementById("reg-password");
  var regNameError = document.getElementById("reg-name-error");
  var regEmailError = document.getElementById("reg-email-error");
  var regPwError = document.getElementById("reg-password-error");
  var registerError = document.getElementById("register-error");
  var registerBtn = document.getElementById("register-btn");
  var tabSignin = document.getElementById("tab-signin");
  var tabRegister = document.getElementById("tab-register");
  var topbarTitle = document.getElementById("topbar-title");
  var topbarName = document.getElementById("topbar-name");
  var topbarEmailSub = document.getElementById("topbar-email");
  var topbarAvatar = document.getElementById("topbar-avatar");
  var logoutBtn = document.getElementById("logout-btn");
  var navItems = document.querySelectorAll(".nav-item");

  var elIncome = document.getElementById("total-income");
  var elExpenses = document.getElementById("total-expenses");
  var elBalance = document.getElementById("total-balance");
  var elCount = document.getElementById("total-count");
  var recentList = document.getElementById("recent-list");
  var monthSelect = document.getElementById("month-select");
  var monthlyCards = document.getElementById("monthly-cards");
  var monthlyTxSec = document.getElementById("monthly-tx-section");
  var monthlyHolder = document.getElementById("monthly-placeholder");
  var monthIncome = document.getElementById("month-income");
  var monthExpenses = document.getElementById("month-expenses");
  var monthBalance = document.getElementById("month-balance");
  var monthCount = document.getElementById("month-count");
  var monthlyTxList = document.getElementById("monthly-tx-list");
  var monthlySearch = document.getElementById("monthly-search");
  var monthlyPagBar = document.getElementById("monthly-pagination");
  var monthlyPrevBtn = document.getElementById("monthly-prev-btn");
  var monthlyNextBtn = document.getElementById("monthly-next-btn");
  var monthlyPageInfo = document.getElementById("monthly-page-info");
  var txPrevBtn = document.getElementById("tx-prev-btn");
  var txNextBtn = document.getElementById("tx-next-btn");
  var txPageInfo = document.getElementById("tx-page-info");

  var formTitle = document.getElementById("form-title");
  var editIdInput = document.getElementById("edit-id");
  var txTitle = document.getElementById("tx-title");
  var txAmount = document.getElementById("tx-amount");
  var txType = document.getElementById("tx-type");
  var txNote = document.getElementById("tx-note");
  var saveBtn = document.getElementById("save-btn");
  var cancelBtn = document.getElementById("cancel-edit-btn");
  var txTitleError = document.getElementById("tx-title-error");
  var txAmtError = document.getElementById("tx-amount-error");
  var txTbody = document.getElementById("tx-tbody");
  var txEmpty = document.getElementById("tx-empty");
  var searchInput = document.getElementById("search-input");
  var filterBtns = document.querySelectorAll(".filter-btn");
  var currencyLabels = document.querySelectorAll(".currency-label");

  var productLinkToggle = document.getElementById("product-link-toggle");
  var productLinkBody = document.getElementById("product-link-body");
  var productLinkArrow = document.getElementById("product-link-arrow");
  var txProductSelect = document.getElementById("tx-product");
  var txProdQty = document.getElementById("tx-prod-qty");
  var txProdQtyError = document.getElementById("tx-prod-qty-error");
  var prodLinkInfo = document.getElementById("prod-link-info");

  var invFormTitle = document.getElementById("inv-form-title");
  var invEditId = document.getElementById("inv-edit-id");
  var invName = document.getElementById("inv-name");
  var invDesc = document.getElementById("inv-desc");
  var invQty = document.getElementById("inv-qty");
  var invPrice = document.getElementById("inv-price");
  var invSaveBtn = document.getElementById("inv-save-btn");
  var invCancelBtn = document.getElementById("inv-cancel-btn");
  var invNameError = document.getElementById("inv-name-error");
  var invQtyError = document.getElementById("inv-qty-error");
  var invPriceError = document.getElementById("inv-price-error");
  var invGrid = document.getElementById("inv-grid");
  var invEmpty = document.getElementById("inv-empty");
  var lowStockBanner = document.getElementById("low-stock-banner");
  var lowStockNames = document.getElementById("low-stock-names");
  var imgUploadArea = document.getElementById("img-upload-area");
  var imgFileInput = document.getElementById("inv-image");
  var imgPreview = document.getElementById("img-preview");
  var imgPlaceholder = document.getElementById("img-placeholder");
  var removeImgBtn = document.getElementById("remove-img-btn");
  var sellModal = document.getElementById("sell-modal");
  var sellModalName = document.getElementById("sell-modal-name");
  var sellQtyInput = document.getElementById("sell-qty");
  var sellQtyError = document.getElementById("sell-qty-error");
  var sellTotal = document.getElementById("sell-total");
  var sellConfirmBtn = document.getElementById("sell-confirm-btn");
  var sellCancelBtn = document.getElementById("sell-cancel-btn");

  var setName = document.getElementById("set-name");
  var setEmail = document.getElementById("set-email");
  var setBusiness = document.getElementById("set-business");
  var saveProfileBtn = document.getElementById("save-profile-btn");
  var profileSaved = document.getElementById("profile-saved");
  var setCurrency = document.getElementById("set-currency");
  var saveCurrencyBtn = document.getElementById("save-currency-btn");
  var currencySaved = document.getElementById("currency-saved");
  var toggleLowStock = document.getElementById("toggle-low-stock");
  var toggleExpWarn = document.getElementById("toggle-expense-warn");
  var toggleDailyEmail = document.getElementById("toggle-daily-email");
  var setThreshold = document.getElementById("set-threshold");
  var saveThresholdBtn = document.getElementById("save-threshold-btn");
  var resetDataBtn = document.getElementById("reset-data-btn");

  var transactions = [];
  var inventory = [];
  var activeFilter = "all";
  var searchQuery = "";
  var sellTargetId = null;
  var currentImgB64 = null;
  var LOW_STOCK = 5;
  var currentUser = null;
  var expWarnEmailSentToday = false;
  var ITEMS_PER_PAGE = 50;
  var txCurrentPage = 1;
  var monthlyCurrentPage = 1;
  var monthlySearchQuery = "";
  var currentMonthTxs = [];

  var settings = {
    name: "",
    email: "",
    business: "",
    currency: "$",
    lowStockAlert: true,
    expenseWarn: true,
    dailyEmail: true,
    lowStockThreshold: 5
  };

  function txKey() { return "am_tx_" + (currentUser ? currentUser.uid : "guest"); }
  function invKey() { return "am_inv_" + (currentUser ? currentUser.uid : "guest"); }
  function saveTx() { localStorage.setItem(txKey(), JSON.stringify(transactions)); }
  function loadTx() {
    var r = localStorage.getItem(txKey());
    return r ? JSON.parse(r) : [];
  }
  function saveInv() { localStorage.setItem(invKey(), JSON.stringify(inventory)); }
  function loadInv() {
    var r = localStorage.getItem(invKey());
    return r ? JSON.parse(r) : [];
  }

  function genId() { return "id_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6); }
  function fmt(n) {
    return settings.currency + Number(n).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }
  function fmtDate(iso) {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  }
  function esc(str) {
    var d = document.createElement("div");
    d.appendChild(document.createTextNode(String(str || "")));
    return d.innerHTML;
  }
  function showLoading() { if (authLoading) authLoading.classList.remove("hidden"); }
  function hideLoading() { if (authLoading) authLoading.classList.add("hidden"); }
    function clearAuthErrors() {
    [signinError, registerError].forEach(function (el) {
      if (el) {
        el.classList.add("hidden");
        el.textContent = "";
      }
    });
    [emailError, passwordError, regNameError, regEmailError, regPwError].forEach(function (el) {
      if (el) el.textContent = "";
    });
  }

  function updateTopbar() {
    if (!currentUser) return;
    var displayName = settings.name || currentUser.email.split("@")[0];
    if (topbarName) topbarName.textContent = displayName;
    if (topbarEmailSub) topbarEmailSub.textContent = currentUser.email;
    if (topbarAvatar) topbarAvatar.textContent = displayName.charAt(0).toUpperCase();
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

    currencyLabels.forEach(function (el) {
      el.textContent = settings.currency;
    });
  }

  if (tabSignin) {
    tabSignin.addEventListener("click", function () {
      tabSignin.classList.add("active");
      if (tabRegister) tabRegister.classList.remove("active");
      if (signinForm) signinForm.classList.remove("hidden");
      if (registerForm) registerForm.classList.add("hidden");
      clearAuthErrors();
    });
  }

  if (tabRegister) {
    tabRegister.addEventListener("click", function () {
      tabRegister.classList.add("active");
      if (tabSignin) tabSignin.classList.remove("active");
      if (registerForm) registerForm.classList.remove("hidden");
      if (signinForm) signinForm.classList.add("hidden");
      clearAuthErrors();
    });
  }

  if (loginBtn) {
    loginBtn.addEventListener("click", function () {
      clearAuthErrors();
      var email = emailInput ? emailInput.value.trim() : "";
      var pass = passwordInput ? passwordInput.value : "";
      var valid = true;

      if (!email) {
        if (emailError) emailError.textContent = "Email is required.";
        valid = false;
      }
      if (!pass) {
        if (passwordError) passwordError.textContent = "Password is required.";
        valid = false;
      }
      if (!valid) return;

      showLoading();
      loginBtn.disabled = true;

      auth.signInWithEmailAndPassword(email, pass)
        .catch(function (err) {
          hideLoading();
          loginBtn.disabled = false;
          var msg = "Sign in failed.";
          if (err.code === "auth/user-not-found") msg = "No account found with this email.";
          if (err.code === "auth/wrong-password") msg = "Incorrect password.";
          if (err.code === "auth/invalid-credential") msg = "Invalid email or password.";
          if (err.code === "auth/too-many-requests") msg = "Too many attempts. Please wait.";
          if (signinError) {
            signinError.textContent = msg;
            signinError.classList.remove("hidden");
          }
        });
    });
  }

  if (passwordInput) {
    passwordInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && loginBtn) loginBtn.click();
    });
  }

  if (registerBtn) {
    registerBtn.addEventListener("click", function () {
      clearAuthErrors();

      var name = regName ? regName.value.trim() : "";
      var business = regBusiness ? regBusiness.value.trim() : "";
      var email = regEmail ? regEmail.value.trim() : "";
      var pass = regPassword ? regPassword.value : "";
      var valid = true;

      if (!name) {
        if (regNameError) regNameError.textContent = "Name is required.";
        valid = false;
      }
      if (!email) {
        if (regEmailError) regEmailError.textContent = "Email is required.";
        valid = false;
      }
      if (!pass || pass.length < 6) {
        if (regPwError) regPwError.textContent = "Password must be 6+ characters.";
        valid = false;
      }
      if (!valid) return;

      showLoading();
      registerBtn.disabled = true;

      auth.createUserWithEmailAndPassword(email, pass)
        .then(function (result) {
          var user = result.user;
          return db.collection("users").doc(user.uid).set({
            name: name,
            business: business,
            email: email,
            currency: "$",
            lowStockAlert: true,
            expenseWarn: true,
            dailyEmail: true,
            lowStockThreshold: 5,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          }).then(function () {
            return sendWelcomeEmail(name, email);
          });
        })
        .catch(function (err) {
          hideLoading();
          registerBtn.disabled = false;
          var msg = "Registration failed.";
          if (err.code === "auth/email-already-in-use") msg = "An account with this email already exists.";
          if (err.code === "auth/weak-password") msg = "Password is too weak.";
          if (registerError) {
            registerError.textContent = msg;
            registerError.classList.remove("hidden");
          }
        });
    });
  }

  auth.onAuthStateChanged(function (user) {
    if (user) {
      currentUser = user;
      db.collection("users").doc(user.uid).get()
        .then(function (doc) {
          if (doc.exists) {
            var d = doc.data();
            settings.name = d.name || "";
            settings.business = d.business || "";
            settings.currency = d.currency || "$";
            settings.lowStockAlert = d.lowStockAlert !== undefined ? d.lowStockAlert : true;
            settings.expenseWarn = d.expenseWarn !== undefined ? d.expenseWarn : true;
            settings.dailyEmail = d.dailyEmail !== undefined ? d.dailyEmail : true;
            settings.lowStockThreshold = d.lowStockThreshold !== undefined ? d.lowStockThreshold : 5;
            LOW_STOCK = settings.lowStockThreshold;
          }
          settings.email = user.email;
          transactions = loadTx();
          inventory = loadInv();
          showApp(user);
        })
        .catch(function () {
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
      if (loginBtn) loginBtn.disabled = false;
      if (registerBtn) registerBtn.disabled = false;
      if (loginPage) loginPage.classList.remove("hidden");
      if (app) app.classList.add("hidden");
    }
  });

  function showApp(user) {
    hideLoading();
    if (loginPage) loginPage.classList.add("hidden");
    if (app) app.classList.remove("hidden");
    applySettings();
    updateTopbar();
    refreshAll();
    showSection("dashboard");
    checkDailySummaryEmail();
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", function () {
      auth.signOut().then(function () {
        if (txProductSelect) txProductSelect.innerHTML = '<option value="">— None —</option>';
        if (txProdQty) txProdQty.value = "";
        if (prodLinkInfo) {
          prodLinkInfo.classList.add("empty");
          prodLinkInfo.innerHTML = "";
        }
        LOW_STOCK = 5;
        expWarnEmailSentToday = false;
        toast("Signed out", "See you next time!", "info");
      });
    });
  }
    /* ══════════════════════════════════════════════════════════
     DAILY SUMMARY EMAIL
  ══════════════════════════════════════════════════════════ */
  function checkDailySummaryEmail() {
    if (!settings.dailyEmail || !currentUser) return;

    var key = "am_daily_" + currentUser.uid;
    var lastSent = localStorage.getItem(key);
    var today = new Date().toDateString();

    if (lastSent === today) return;

    var todayTxs = transactions.filter(function (tx) {
      return new Date(tx.date).toDateString() === today;
    });

    var inc = 0, exp = 0;
    transactions.forEach(function (tx) {
      if (tx.type === "income") inc += tx.amount;
      else exp += tx.amount;
    });

    sendDailySummaryEmail(
      settings.name || "there",
      currentUser.email,
      todayTxs,
      fmt(inc),
      fmt(exp),
      fmt(inc - exp)
    ).then(function () {
      localStorage.setItem(key, today);
      toast("Daily Summary", "Your daily summary email has been sent!", "info", 4000);
    }).catch(function (err) {
      toast("Daily Summary Failed", "Could not send the summary email. Please check your EmailJS setup.", "error", 5000);
      console.error("Daily summary failed:", err);
    });
  }

  /* ══════════════════════════════════════════════════════════
     DASHBOARD
  ══════════════════════════════════════════════════════════ */
  function updateDashboard() {
    var income = 0, expenses = 0;
    transactions.forEach(function (tx) {
      if (tx.type === "income") income += tx.amount;
      else expenses += tx.amount;
    });

    var balance = income - expenses;

    if (elIncome) elIncome.textContent = fmt(income);
    if (elExpenses) elExpenses.textContent = fmt(expenses);
    if (elBalance) {
      elBalance.textContent = fmt(balance);
      elBalance.style.color = (settings.expenseWarn && balance < 0) ? "var(--expense)" : "var(--accent)";
    }
    if (elCount) elCount.textContent = transactions.length;

    if (settings.expenseWarn && balance < 0 && !expWarnEmailSentToday && currentUser) {
      sendExpenseWarningEmail(settings.name || "there", currentUser.email, fmt(balance), fmt(income), fmt(expenses))
        .then(function () {
          expWarnEmailSentToday = true;
          toast("Expense Warning", "Your expenses exceed your income. An alert email was sent.", "warning", 5000);
        })
        .catch(function (err) {
          toast("Expense Alert Failed", "The warning email could not be sent.", "error", 5000);
          console.error("Expense warning email failed:", err);
        });
    }

    if (recentList) {
      recentList.innerHTML = "";
      if (!transactions.length) {
        recentList.innerHTML = '<p class="empty-state">No transactions yet.</p>';
      } else {
        transactions.slice().sort(function (a, b) {
          return new Date(b.date) - new Date(a.date);
        }).slice(0, 5).forEach(function (tx) {
          var el = document.createElement("div");
          el.className = "recent-item";
          el.innerHTML =
            "<div><div class=\"recent-title\">" + esc(tx.title) + "</div><div class=\"recent-date\">" + fmtDate(tx.date) + "</div></div>" +
            "<div style=\"display:flex;align-items:center;gap:8px;\">" +
            "<span class=\"" + (tx.type === "income" ? "amount-income" : "amount-expense") + "\">" + (tx.type === "income" ? "+" : "-") + fmt(tx.amount) + "</span>" +
            "<span class=\"badge badge-" + tx.type + "\">" + tx.type + "</span></div>";
          recentList.appendChild(el);
        });
      }
    }

    buildMonthDropdown();
  }

  function buildMonthDropdown() {
    if (!monthSelect) return;

    var current = monthSelect.value;
    var months = {};
    transactions.forEach(function (tx) {
      var d = new Date(tx.date);
      var key = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
      months[key] = true;
    });

    var sorted = Object.keys(months).sort(function (a, b) { return b.localeCompare(a); });
    monthSelect.innerHTML = '<option value="">— Select a month —</option>';

    sorted.forEach(function (key) {
      var p = key.split("-");
      var label = new Date(parseInt(p[0]), parseInt(p[1]) - 1, 1).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric"
      });
      var opt = document.createElement("option");
      opt.value = key;
      opt.textContent = label;
      monthSelect.appendChild(opt);
    });

    if (current && months[current]) {
      monthSelect.value = current;
      renderMonthlySummary(current);
    } else {
      monthSelect.value = "";
      if (monthlyCards) monthlyCards.classList.add("hidden");
      if (monthlyTxSec) monthlyTxSec.classList.add("hidden");
      if (monthlyHolder) monthlyHolder.classList.remove("hidden");
    }
  }

  function renderMonthlySummary(key) {
    if (!key) {
      if (monthlyCards) monthlyCards.classList.add("hidden");
      if (monthlyTxSec) monthlyTxSec.classList.add("hidden");
      if (monthlyHolder) monthlyHolder.classList.remove("hidden");
      return;
    }

    var p = key.split("-");
    var yr = parseInt(p[0]);
    var mo = parseInt(p[1]) - 1;

    var allMonthTxs = transactions.filter(function (tx) {
      var d = new Date(tx.date);
      return d.getFullYear() === yr && d.getMonth() === mo;
    });

    var inc = 0, exp = 0;
    allMonthTxs.forEach(function (tx) {
      if (tx.type === "income") inc += tx.amount;
      else exp += tx.amount;
    });

    var bal = inc - exp;

    if (monthIncome) monthIncome.textContent = fmt(inc);
    if (monthExpenses) monthExpenses.textContent = fmt(exp);
    if (monthBalance) {
      monthBalance.textContent = fmt(bal);
      monthBalance.style.color = bal < 0 ? "var(--expense)" : "var(--accent)";
    }
    if (monthCount) monthCount.textContent = allMonthTxs.length;
    if (monthlyCards) monthlyCards.classList.remove("hidden");
    if (monthlyTxSec) monthlyTxSec.classList.remove("hidden");
    if (monthlyHolder) monthlyHolder.classList.add("hidden");

    var filtered = allMonthTxs.slice();
    if (monthlySearchQuery.trim()) {
      var q = monthlySearchQuery.toLowerCase();
      filtered = filtered.filter(function (tx) {
        return tx.title.toLowerCase().indexOf(q) !== -1;
      });
    }

    filtered.sort(function (a, b) {
      return new Date(b.date) - new Date(a.date);
    });

    currentMonthTxs = filtered;
    renderMonthlyPage();
  }
    function renderMonthlyPage() {
    if (!monthlyTxList) return;
    monthlyTxList.innerHTML = "";

    if (!currentMonthTxs.length) {
      monthlyTxList.innerHTML = '<p class="empty-state">No transactions match your search.</p>';
      if (monthlyPagBar) monthlyPagBar.classList.add("hidden");
      return;
    }

    var totalPages = Math.ceil(currentMonthTxs.length / ITEMS_PER_PAGE);
    if (monthlyCurrentPage > totalPages) monthlyCurrentPage = totalPages;
    if (monthlyCurrentPage < 1) monthlyCurrentPage = 1;

    var start = (monthlyCurrentPage - 1) * ITEMS_PER_PAGE;
    var page = currentMonthTxs.slice(start, start + ITEMS_PER_PAGE);

    page.forEach(function (tx) {
      var row = document.createElement("div");
      row.className = "monthly-tx-row";
      row.innerHTML =
        '<div class="monthly-tx-left">' +
          '<div class="monthly-tx-title">' + esc(tx.title) + "</div>" +
          (tx.note ? '<div class="monthly-tx-note">' + esc(tx.note) + "</div>" : "") +
          '<div class="monthly-tx-note">' + fmtDate(tx.date) + "</div>" +
        "</div>" +
        '<div class="monthly-tx-right">' +
          '<span class="' + (tx.type === "income" ? "amount-income" : "amount-expense") + '">' +
            (tx.type === "income" ? "+" : "-") + fmt(tx.amount) +
          "</span>" +
          '<span class="badge badge-' + tx.type + '">' + tx.type + "</span>" +
        "</div>";
      monthlyTxList.appendChild(row);
    });

    if (currentMonthTxs.length > ITEMS_PER_PAGE) {
      if (monthlyPagBar) monthlyPagBar.classList.remove("hidden");
      if (monthlyPageInfo) monthlyPageInfo.textContent = "Page " + monthlyCurrentPage + " of " + totalPages + " (" + currentMonthTxs.length + " shown)";
      if (monthlyPrevBtn) monthlyPrevBtn.disabled = monthlyCurrentPage <= 1;
      if (monthlyNextBtn) monthlyNextBtn.disabled = monthlyCurrentPage >= totalPages;
    } else {
      if (monthlyPagBar) monthlyPagBar.classList.add("hidden");
    }
  }

  if (monthlyPrevBtn) monthlyPrevBtn.addEventListener("click", function () { monthlyCurrentPage--; renderMonthlyPage(); });
  if (monthlyNextBtn) monthlyNextBtn.addEventListener("click", function () { monthlyCurrentPage++; renderMonthlyPage(); });

  if (monthlySearch) {
    monthlySearch.addEventListener("input", function () {
      monthlySearchQuery = this.value;
      monthlyCurrentPage = 1;
      renderMonthlySummary(monthSelect ? monthSelect.value : "");
    });
  }

  if (monthSelect) {
    monthSelect.addEventListener("change", function () {
      monthlySearchQuery = "";
      if (monthlySearch) monthlySearch.value = "";
      monthlyCurrentPage = 1;
      renderMonthlySummary(this.value);
    });
  }

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
    if (!txTbody) return;

    var list = transactions.slice();

    if (activeFilter !== "all") {
      list = list.filter(function (t) { return t.type === activeFilter; });
    }
    if (searchQuery.trim()) {
      var q = searchQuery.toLowerCase();
      list = list.filter(function (t) {
        return t.title.toLowerCase().indexOf(q) !== -1;
      });
    }

    list.sort(function (a, b) { return new Date(b.date) - new Date(a.date); });
    txTbody.innerHTML = "";

    if (!list.length) {
      if (txEmpty) txEmpty.classList.remove("hidden");
      return;
    }
    if (txEmpty) txEmpty.classList.add("hidden");

    list.forEach(function (tx) {
      var tr = document.createElement("tr");
      tr.innerHTML =
        "<td>" + esc(tx.title) + "</td>" +
        '<td class="' + (tx.type === "income" ? "amount-income" : "amount-expense") + '">' +
          (tx.type === "income" ? "+" : "-") + fmt(tx.amount) +
        "</td>" +
        '<td><span class="badge badge-' + tx.type + '">' + tx.type + "</span></td>" +
        '<td class="tx-note-cell">' + esc(tx.note || "—") + "</td>" +
        "<td>" + fmtDate(tx.date) + "</td>" +
        '<td><div class="action-btns">' +
          '<button class="btn-edit" onclick="AM.editTx(\'' + tx.id + '\')">Edit</button>' +
          '<button class="btn-delete" onclick="AM.deleteTx(\'' + tx.id + '\')">Delete</button>' +
        "</div></td>";
      txTbody.appendChild(tr);
    });
  }

  if (searchInput) {
    searchInput.addEventListener("input", function () {
      searchQuery = this.value;
      renderTable();
    });
  }

  filterBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      filterBtns.forEach(function (b) { b.classList.remove("active"); });
      this.classList.add("active");
      activeFilter = this.dataset.filter;
      renderTable();
    });
  });

  if (productLinkToggle) {
    productLinkToggle.addEventListener("click", function () {
      var h = productLinkBody && productLinkBody.classList.contains("hidden");
      if (productLinkBody) productLinkBody.classList.toggle("hidden", !h);
      if (productLinkArrow) productLinkArrow.classList.toggle("open", h);
    });
  }

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
    if (!txProductSelect || !prodLinkInfo) return;

    var pid = txProductSelect.value;
    var qty = parseInt(txProdQty ? txProdQty.value : 0) || 0;

    if (!pid) {
      prodLinkInfo.classList.add("empty");
      prodLinkInfo.innerHTML = "";
      return;
    }

    var p = inventory.find(function (p) { return p.id === pid; });
    if (!p) {
      prodLinkInfo.classList.add("empty");
      return;
    }

    prodLinkInfo.classList.remove("empty");

    var warn = p.qty === 0
      ? '<div class="prod-link-info-stock-warn">⚠ Out of stock!</div>'
      : p.qty <= LOW_STOCK
      ? '<div class="prod-link-info-stock-warn">⚠ Low stock: ' + p.qty + " left</div>"
      : "";

    prodLinkInfo.innerHTML =
      '<div class="prod-link-info-name">' + esc(p.name) + "</div>" +
      '<div class="prod-link-info-row">Price: ' + fmt(p.price) + "/unit</div>" +
      '<div class="prod-link-info-row">In stock: ' + p.qty + "</div>" +
      (qty > 0 ? '<div class="prod-link-info-row">Total: <strong>' + fmt(qty * p.price) + "</strong></div>" : "") +
      warn;

    if (qty > 0 && txAmount) txAmount.value = (qty * p.price).toFixed(2);
  }      if(settings.lowStockAlert && qty<=LOW_STOCK && currentUser) {
        sendLowStockEmail(settings.name||'there', currentUser.email, [{name:newProd.name,qty:qty}])
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

  function editProd(id){
    var p = inventory.find(function(p){ return p.id===id; });
    if(!p) return;
    invEditId.value = p.id;
    invName.value = p.name;
    invDesc.value = p.desc || '';
    invQty.value = p.qty;
    invPrice.value = p.price;
    invFormTitle.textContent = 'Edit Product';
    invSaveBtn.textContent = 'Save Changes';
    invCancelBtn.classList.remove('hidden');
    if(p.image){
      showImgPreview(p.image);
      currentImgB64 = null;
    } else {
      clearImgPreview();
    }
    document.querySelector('#section-inventory .form-card').scrollIntoView({behavior:'smooth',block:'start'});
  }

  function exitInvEdit(){
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

  function deleteProd(id){
    var p = inventory.find(function(p){ return p.id===id; });
    var name = p ? p.name : 'Product';
    showConfirm(
      'Delete Product',
      'Delete "' + name + '" from inventory? This cannot be undone.',
      '📦',
      'Yes, Delete',
      function() {
        inventory = inventory.filter(function(p){ return p.id!==id; });
        saveInv();
        renderInventory();
        toast('Product Deleted', '"' + name + '" removed from inventory.', 'error', 3000);
      }
    );
  }

  function openSell(id){
    var p = inventory.find(function(p){ return p.id===id; });
    if(!p) return;
    sellTargetId = id;
    sellModalName.textContent = p.name + '  —  ' + fmt(p.price) + '/unit  (Stock: ' + p.qty + ')';
    sellQtyInput.value = '1';
    sellQtyError.textContent = '';
    sellTotal.textContent = fmt(p.price);
    sellModal.classList.remove('hidden');
    sellQtyInput.focus();
  }

  sellQtyInput.addEventListener('input', function(){
    var p = inventory.find(function(p){ return p.id===sellTargetId; });
    if(p) sellTotal.textContent = fmt((parseInt(this.value) || 0) * p.price);
  });

  sellConfirmBtn.addEventListener('click', function(){
    sellQtyError.textContent = '';
    var p = inventory.find(function(p){ return p.id===sellTargetId; });
    if(!p) return;

    var qty = parseInt(sellQtyInput.value);
    if(!sellQtyInput.value || isNaN(qty) || qty <= 0){
      sellQtyError.textContent = 'Enter qty > 0.';
      return;
    }
    if(qty > p.qty){
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

    if(settings.lowStockAlert && p.qty <= LOW_STOCK && currentUser) {
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

  sellCancelBtn.addEventListener('click', function(){
    sellModal.classList.add('hidden');
  });

  sellModal.addEventListener('click', function(e){
    if(e.target === sellModal) sellModal.classList.add('hidden');
  });

  /* ══════════════════════════════════════════════════════════
     SETTINGS
  ══════════════════════════════════════════════════════════ */
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

  saveProfileBtn.addEventListener('click',function(){
    if(!currentUser) return;
    settings.name = setName.value.trim();
    settings.business = setBusiness.value.trim();

    db.collection('users').doc(currentUser.uid).update({
      name: settings.name,
      business: settings.business
    })
    .then(function(){
      if (profileSaved) {
        profileSaved.classList.remove('hidden');
        setTimeout(function(){ profileSaved.classList.add('hidden'); }, 2500);
      }
      updateTopbar();
      toast('Profile Saved', 'Your profile has been updated.', 'success');
    })
    .catch(function(err){
      toast('Save Failed', err.message, 'error');
    });
  });

  saveCurrencyBtn.addEventListener('click',function(){
    settings.currency = setCurrency.value;
    currencyLabels.forEach(function(el){ el.textContent = settings.currency; });
    refreshAll();

    if (currencySaved) {
      currencySaved.classList.remove('hidden');
      setTimeout(function(){ currencySaved.classList.add('hidden'); }, 2500);
    }

    toast('Currency Updated', 'All amounts now show in ' + settings.currency, 'success');
    if(currentUser) {
      db.collection('users').doc(currentUser.uid).update({ currency: settings.currency });
    }
  });

  toggleLowStock.addEventListener('change',function(){
    settings.lowStockAlert = this.checked;
    renderInventory();
    toast(
      this.checked ? 'Low Stock Alerts ON' : 'Low Stock Alerts OFF',
      this.checked ? 'You will be notified when stock is low.' : 'Low stock alerts are now disabled.',
      this.checked ? 'success' : 'info'
    );
    if(currentUser) {
      db.collection('users').doc(currentUser.uid).update({ lowStockAlert: settings.lowStockAlert });
    }
  });

  toggleExpWarn.addEventListener('change',function(){
    settings.expenseWarn = this.checked;
    updateDashboard();
    toast(this.checked ? 'Expense Warning ON' : 'Expense Warning OFF', '', this.checked ? 'success' : 'info', 2000);
    if(currentUser) {
      db.collection('users').doc(currentUser.uid).update({ expenseWarn: settings.expenseWarn });
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
      db.collection('users').doc(currentUser.uid).update({ lowStockThreshold: val });
    }
  });

  toggleDailyEmail.addEventListener('change',function(){
    settings.dailyEmail = this.checked;
    toast(
      this.checked ? 'Daily Emails ON' : 'Daily Emails OFF',
      this.checked ? 'You will receive a daily summary email.' : 'Daily summary emails are disabled.',
      this.checked ? 'success' : 'info'
    );
    if(currentUser) {
      db.collection('users').doc(currentUser.uid).update({ dailyEmail: settings.dailyEmail });
    }
  });

  resetDataBtn.addEventListener('click',function(){
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

  function showSection(name){
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

  navItems.forEach(function(item){
    item.addEventListener('click', function(e){
      e.preventDefault();
      showSection(item.dataset.section);
    });
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

  window.AM = {
    editTx: editTx,
    deleteTx: deleteTx,
    editProd: editProd,
    deleteProd: deleteProd,
    openSell: openSell
  };

});
