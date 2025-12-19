// 🔥 GANTI DENGAN CONFIG FIREBASE KAMU
const firebaseConfig = {
  apiKey: "AIzaSyAbakIzjnb1C5c5tdPHDy4plx03VHp_Yy0",
  authDomain: "dailyreport-d25fa.firebaseapp.com",
  projectId: "dailyreport-d25fa",
  storageBucket: "dailyreport-d25fa.firebasestorage.app",
  messagingSenderId: "1048280817872",
  appId: "1:1048280817872:web:476e86e3aea827e5ffbed5",
  measurementId: "G-4DJ5YRZ99Q",
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// =========================
// THEME MANAGEMENT
// =========================
function initTheme() {
  const savedTheme = localStorage.getItem("theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

  if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
    document.documentElement.setAttribute("data-theme", "dark");
    updateThemeIcon(true);
  } else {
    document.documentElement.removeAttribute("data-theme");
    updateThemeIcon(false);
  }
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute("data-theme");
  const newTheme = currentTheme === "dark" ? "light" : "dark";

  if (newTheme === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
  } else {
    document.documentElement.removeAttribute("data-theme");
  }

  localStorage.setItem("theme", newTheme);
  updateThemeIcon(newTheme === "dark");
}

function updateThemeIcon(isDark) {
  const btn = document.getElementById("themeToggle");
  if (!btn) return;

  if (isDark) {
    // Sun icon (for switching to light)
    btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
  } else {
    // Moon icon (for switching to dark)
    btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
  }
}

// Init theme immediately
document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  const btn = document.getElementById("themeToggle");
  if (btn) btn.addEventListener("click", toggleTheme);
});

// Set Auth Persistence to SESSION (logout on tab close)
auth.setPersistence(firebase.auth.Auth.Persistence.SESSION).catch((error) => {
  console.error("Auth Persistence Error:", error);
});

let currentUser = null;

// =========================
// AUTO LOGOUT (IDLE TIMEOUT)
// =========================
const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
let idleTimer;

function resetIdleTimer() {
  clearTimeout(idleTimer);
  if (currentUser) {
    idleTimer = setTimeout(() => {
      handleIdleTimeout();
    }, IDLE_TIMEOUT_MS);
  }
}

function handleIdleTimeout() {
  if (currentUser) {
    auth.signOut().then(() => {
      Swal.fire({
        icon: "warning",
        title: "Sesi Berakhir",
        text: "Anda telah logout otomatis karena tidak ada aktivitas selama 30 menit.",
        confirmButtonText: "OK",
      });
    });
  }
}

// Attach idle listeners
["mousemove", "keydown", "click", "scroll", "touchstart"].forEach((evt) => {
  document.addEventListener(evt, resetIdleTimer, { passive: true });
});

// =========================
// HELPER
// =========================
function getSelectedCodes() {
  return Array.from(
    document.querySelectorAll("input[type=checkbox]:checked")
  ).map((cb) => cb.value);
}

function calculateDuration(start, end) {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return eh * 60 + em - (sh * 60 + sm);
}

function formatDuration(minutes) {
  return minutes === 1 ? "1 Minute" : `${minutes} Minutes`;
}

function pad(n) {
  return String(n).padStart(2, "0");
}
function nowHM() {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function todayStr() {
  const t = new Date();
  return `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`;
}

const form = document.getElementById("reportForm");
const btnMulai = document.getElementById("btn_mulai");
const btnSelesai = document.getElementById("btn_selesai");
const labelMulai = document.getElementById("label_mulai");
const labelSelesai = document.getElementById("label_selesai");
const tanggalInput = document.getElementById("tanggal");
const elapsedTimer = document.getElementById("elapsed_timer");
let timerInterval = null;
let startTimeMs = null;
const invInput = document.getElementById("inv_code");
const btnAddActivity = document.getElementById("btn_add_activity");
const activitiesContainer = document.getElementById("activities");
const historyContainer = document.getElementById("history_activities");
const historyDateInput = document.getElementById("historyDate");
const btnHistoryMore = document.getElementById("btn_history_more");
let historyTodayLimit = 10;
const activityTimers = {};
const activeCol = db.collection("daily_reports_active");
const exportDateInput = document.getElementById("exportTanggal");
const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");
const btnLogin = document.getElementById("btn_login");
const btnLogout = document.getElementById("btn_logout");
const authStatus = document.getElementById("auth_status");
const btnLoginGoogle = document.getElementById("btn_login_google");
const btnSignup = document.getElementById("btn_signup");
const btnReset = document.getElementById("btn_reset");

function updateAuthStatus(text) {
  if (authStatus) authStatus.textContent = text || "";
}

if (btnLogin) {
  btnLogin.addEventListener("click", async () => {
    const email = loginEmail ? loginEmail.value : "";
    const password = loginPassword ? loginPassword.value : "";
    try {
      await auth.signInWithEmailAndPassword(email, password);
    } catch (e) {
      updateAuthStatus(e && e.message ? e.message : "Gagal login");
    }
  });
}

if (btnLogout) {
  btnLogout.addEventListener("click", async () => {
    try {
      const res = await Swal.fire({
        title: "Konfirmasi Logout",
        text: "Apakah Anda yakin ingin logout?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Logout",
        cancelButtonText: "Batal",
      });
      if (!res.isConfirmed) return;
      await auth.signOut();
    } catch (e) {
      updateAuthStatus(e && e.message ? e.message : "Gagal logout");
    }
  });
}

if (btnLoginGoogle) {
  btnLoginGoogle.addEventListener("click", async () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
      await auth.signInWithPopup(provider);
    } catch (e) {
      updateAuthStatus(e && e.message ? e.message : "Gagal login Google");
    }
  });
}

if (btnSignup) {
  btnSignup.addEventListener("click", async () => {
    const email = loginEmail ? loginEmail.value : "";
    const password = loginPassword ? loginPassword.value : "";
    if (!email) {
      updateAuthStatus("Email tidak boleh kosong");
      return;
    }
    if (!password || password.length < 6) {
      updateAuthStatus("Password minimal 6 karakter");
      return;
    }
    try {
      await auth.createUserWithEmailAndPassword(email, password);
    } catch (e) {
      let msg = e && e.message ? e.message : "Gagal membuat akun";
      if (e && e.code === "auth/operation-not-allowed")
        msg = "Metode Email/Password belum diaktifkan di Firebase Console";
      else if (e && e.code === "auth/email-already-in-use")
        msg = "Email sudah terdaftar";
      else if (e && e.code === "auth/invalid-email")
        msg = "Format email tidak valid";
      else if (e && e.code === "auth/weak-password")
        msg = "Password terlalu lemah (minimal 6 karakter)";
      updateAuthStatus(msg);
    }
  });
}

if (btnReset) {
  btnReset.addEventListener("click", async (e) => {
    e.preventDefault();
    const email = loginEmail ? loginEmail.value : "";
    try {
      if (!email) {
        updateAuthStatus("Masukkan email untuk reset password");
        return;
      }
      await auth.sendPasswordResetEmail(email);
      updateAuthStatus("Tautan reset dikirim ke email");
    } catch (e) {
      updateAuthStatus(e && e.message ? e.message : "Gagal mengirim reset");
    }
  });
}
function setUIAuthState() {
  const logged = !!currentUser;
  const submitBtn = document.querySelector('#reportForm button[type="submit"]');
  const mulaiBtn = document.getElementById("btn_mulai");
  const selesaiBtn = document.getElementById("btn_selesai");
  const btnLogout = document.getElementById("btn_logout");
  if (submitBtn) submitBtn.disabled = !logged;
  if (mulaiBtn) mulaiBtn.disabled = !logged;
  if (selesaiBtn) selesaiBtn.disabled = !logged;
  if (btnAddActivity) btnAddActivity.disabled = !logged;
  if (btnLogout) btnLogout.disabled = !logged;
  const formEl = document.getElementById("reportForm");
  if (formEl) {
    const fields = formEl.querySelectorAll("input, select, textarea");
    fields.forEach((el) => {
      el.disabled = !logged;
    });
  }
  const btnExport = document.getElementById("btn_export_excel");
  if (btnExport) btnExport.disabled = !logged;
}

auth.onAuthStateChanged((user) => {
  currentUser = user || null;
  if (currentUser) {
    updateAuthStatus(`Login as ${currentUser.email || currentUser.uid}`);
    resetIdleTimer(); // Start idle timer on login
  } else {
    updateAuthStatus("");
    clearTimeout(idleTimer); // Clear timer on logout
  }
  setUIAuthState();
  refreshDraftsListener();
  const hDate = (historyDateInput && historyDateInput.value) || todayStr();
  loadHistoryForDate(hDate);
  const isLoginPage = !!document.getElementById("loginForm");
  if (!currentUser && !isLoginPage) {
    try {
      window.location.href = "login.html";
    } catch {}
  }
  if (currentUser && isLoginPage) {
    try {
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Berhasil login",
        showConfirmButton: false,
        timer: 1600,
        timerProgressBar: true,
        showClass: { popup: "swal2-animate-fade-up-in" },
        hideClass: { popup: "swal2-animate-fade-up-out" },
      }).then(() => {
        window.location.href = "index.html";
      });
    } catch {}
  }
});

function stopAllActivityTimers() {
  Object.keys(activityTimers).forEach((k) => {
    const rec = activityTimers[k];
    if (rec && rec.interval) clearInterval(rec.interval);
  });
  for (const k in activityTimers) delete activityTimers[k];
}

function loadDraftsRealtime() {
  if (!activitiesContainer) return null;
  if (!currentUser) {
    activitiesContainer.innerHTML = "";
    if (historyContainer) historyContainer.innerHTML = "";
    const statusEl = document.getElementById("drafts_status");
    if (statusEl) statusEl.textContent = "Silakan login untuk melihat draf";
    return null;
  }
  const tanggal = todayStr();
  const statusEl = document.getElementById("drafts_status");
  let q = activeCol
    .where("uid", "==", currentUser.uid)
    .where("tanggal", "==", tanggal);
  const unsub = q.onSnapshot(
    (snap) => {
      if (statusEl) statusEl.textContent = "";

      const currentIds = new Set();
      let activeCount = 0;

      snap.forEach((doc) => {
        const d = { id: doc.id, ...doc.data() };
        // Hanya tampilkan yang belum selesai di daftar Draft
        if (!d.finished) {
          activeCount += 1;
          currentIds.add(d.id);
          const existingEl = activitiesContainer.querySelector(
            `.activity-item[data-id="${d.id}"]`
          );
          if (existingEl) {
            updateActivityElement(existingEl, d);
          } else {
            renderActivity(d, activitiesContainer);
          }
        }
      });

      // Hapus item yang tidak ada di snapshot
      const allItems = Array.from(
        activitiesContainer.querySelectorAll(".activity-item")
      );
      allItems.forEach((el) => {
        if (!currentIds.has(el.dataset.id)) {
          if (activityTimers[el.dataset.id]) {
            clearInterval(activityTimers[el.dataset.id].interval);
            delete activityTimers[el.dataset.id];
          }
          el.remove();
        }
      });

      if (activeCount === 0) {
        if (
          activitiesContainer.querySelectorAll(".activity-item").length === 0
        ) {
          activitiesContainer.innerHTML =
            '<div style="text-align:center;padding:16px;color:#777;">No Activities</div>';
        }
      } else {
        const placeholder = Array.from(activitiesContainer.children).find(
          (c) => !c.classList.contains("activity-item")
        );
        if (placeholder) placeholder.remove();
      }
    },
    (err) => {
      if (statusEl)
        statusEl.textContent = `Tidak dapat memuat draf: ${err.code}`;
    }
  );
  return unsub;
}

let unsubDrafts = null;
function refreshDraftsListener() {
  if (unsubDrafts) {
    unsubDrafts();
    unsubDrafts = null;
  }
  unsubDrafts = loadDraftsRealtime();
}

let unsubHistory = null;
let historyData = [];

async function loadHistoryForDate(dateStr) {
  if (!historyContainer) return;
  // if (unsubHistory) {
  //   unsubHistory();
  //   unsubHistory = null;
  // }
  historyContainer.innerHTML = "";
  if (!currentUser) {
    historyContainer.innerHTML =
      '<div style="text-align:center;padding:16px;color:#777;">Silakan login</div>';
    return;
  }
  if (btnHistoryMore) btnHistoryMore.style.display = "none";

  try {
    const snapshot = await db
      .collection("daily_reports")
      .where("uid", "==", currentUser.uid)
      .where("tanggal", "==", dateStr)
      .get();

    if (snapshot.empty) {
      historyContainer.innerHTML =
        '<div style="text-align:center;padding:16px;color:#777;">No Activities</div>';
      return;
    }
    historyData = [];
    snapshot.forEach((doc) => {
      historyData.push({
        id: doc.id,
        ...doc.data(),
        started: true,
        finished: true,
      });
    });
    renderHistoryList();
  } catch (err) {
    historyContainer.innerHTML =
      '<div style="text-align:center;padding:16px;color:#c00;">Gagal memuat histori</div>';
  }
}

function parseHM(hm) {
  if (!hm || typeof hm !== "string") return -1;
  const parts = hm.split(":");
  if (parts.length < 2) return -1;
  const h = Number(parts[0]);
  const m = Number(parts[1]);
  if (Number.isNaN(h) || Number.isNaN(m)) return -1;
  return h * 60 + m;
}

function renderHistoryList() {
  if (!historyContainer) return;
  historyContainer.innerHTML = "";

  const sorted = historyData.slice().sort((a, b) => {
    const am = parseHM(a.jam_selesai);
    const bm = parseHM(b.jam_selesai);
    if (am !== -1 && bm !== -1) return bm - am;
    const at = a.created_at && a.created_at.seconds ? a.created_at.seconds : 0;
    const bt = b.created_at && b.created_at.seconds ? b.created_at.seconds : 0;
    return bt - at;
  });

  const slice = sorted.slice(0, historyTodayLimit);
  if (slice.length === 0) {
    historyContainer.innerHTML =
      '<div style="text-align:center;padding:16px;color:#777;">No Activities</div>';
  } else {
    slice.forEach((d) => {
      renderActivitySummary(d, historyContainer);
    });
  }
  if (btnHistoryMore) {
    const hasMore = sorted.length > historyTodayLimit;
    btnHistoryMore.style.display = hasMore ? "inline-block" : "none";
  }
}

async function undoActivity(historyId) {
  const result = await Swal.fire({
    title: "Konfirmasi Undo",
    text: "Kembalikan aktivitas ini ke status draft (bisa diedit)?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Ya, Undo!",
    cancelButtonText: "Batal",
  });

  if (!result.isConfirmed) return;

  // Cari data history lokal untuk fallback jika perlu
  const histItem = historyData.find((x) => x.id === historyId);

  try {
    // 1. Cari dokumen active yang link ke history ini
    const snapshot = await activeCol
      .where("uid", "==", currentUser.uid)
      .where("report_doc_id", "==", historyId)
      .limit(1)
      .get();

    if (!snapshot.empty) {
      const activeDoc = snapshot.docs[0];
      // Update jadi belum finish
      await activeCol.doc(activeDoc.id).update({
        finished: false,
        jam_selesai: firebase.firestore.FieldValue.delete(),
        report_doc_id: firebase.firestore.FieldValue.delete(),
      });
    } else {
      // Jika dokumen active asli sudah hilang, buat baru dari data history
      if (histItem) {
        const newData = { ...histItem };
        delete newData.id; // hapus id history
        delete newData.started; // reset flag view
        delete newData.finished; // reset flag view
        // set status active
        newData.finished = false;
        newData.started = true;
        newData.jam_selesai = "";
        // pastikan uid
        if (!newData.uid && currentUser) newData.uid = currentUser.uid;

        await activeCol.add(newData);
      } else {
        Swal.fire(
          "Gagal",
          "Data lokal tidak ditemukan, gagal restore draft.",
          "error"
        );
        return;
      }
    }

    // 2. Hapus dari history (daily_reports)
    await db.collection("daily_reports").doc(historyId).delete();

    // 3. Update UI History secara manual (hapus item dari DOM & array)
    historyData = historyData.filter((x) => x.id !== historyId);
    renderHistoryList();

    // Draft list otomatis update karena listener onSnapshot di loadDraftsRealtime
    Swal.fire({
      toast: true,
      position: "top-end",
      icon: "success",
      title: "Berhasil Undo",
      text: "Aktivitas dikembalikan ke Draft",
      timer: 1500,
      timerProgressBar: true,
      showConfirmButton: false,
      showClass: { popup: "swal2-animate-fade-up-in" },
      hideClass: { popup: "swal2-animate-fade-up-out" },
    });
  } catch (err) {
    Swal.fire("Error", "Gagal Undo: " + (err.message || err), "error");
  }
}

if (btnHistoryMore) {
  btnHistoryMore.addEventListener("click", () => {
    historyTodayLimit += 10;
    renderHistoryList();
  });
}

function formatHMS(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

function updateTimer() {
  if (startTimeMs == null || !elapsedTimer) return;
  const diff = Date.now() - startTimeMs;
  elapsedTimer.textContent = formatHMS(diff);
}

function startTimer() {
  startTimeMs = Date.now();
  updateTimer();
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(updateTimer, 1000);
}

function startTimerFrom(ms) {
  startTimeMs = ms;
  updateTimer();
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(updateTimer, 1000);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

if (tanggalInput && !tanggalInput.value) {
  const t = new Date();
  tanggalInput.value = `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(
    t.getDate()
  )}`;
}
if (historyDateInput && !historyDateInput.value) {
  const t = new Date();
  historyDateInput.value = `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(
    t.getDate()
  )}`;
}
if (exportDateInput && !exportDateInput.value) {
  const t = new Date();
  exportDateInput.value = `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(
    t.getDate()
  )}`;
}
if (historyDateInput) {
  historyDateInput.addEventListener("change", () => {
    const val = historyDateInput.value || todayStr();
    historyTodayLimit = 10;
    loadHistoryForDate(val);
  });
}

if (btnMulai) {
  btnMulai.addEventListener("click", async () => {
    if (!currentUser) {
      alert("Silakan login terlebih dahulu");
      return;
    }
    const t = nowHM();
    document.getElementById("jam_mulai").value = t;
    if (labelMulai) labelMulai.textContent = t;
    btnMulai.disabled = true;
    if (btnSelesai) btnSelesai.disabled = false;
    startTimer();
  });
}

if (btnSelesai) {
  btnSelesai.addEventListener("click", () => {
    const start = document.getElementById("jam_mulai").value;
    if (!start) {
      alert("Klik Mulai Tugas terlebih dahulu");
      return;
    }
    const t = nowHM();
    document.getElementById("jam_selesai").value = t;
    if (labelSelesai) labelSelesai.textContent = t;
    stopTimer();
    form.requestSubmit();
  });
}

if (form) {
  form.addEventListener("submit", () => {
    if (labelMulai) labelMulai.textContent = "Not Started";
    if (labelSelesai) labelSelesai.textContent = "In Progress";
    if (btnMulai) btnMulai.disabled = false;
    if (btnSelesai) btnSelesai.disabled = true;
    stopTimer();
    if (elapsedTimer) elapsedTimer.textContent = "00:00:00";
  });
}

if (invInput) {
  invInput.addEventListener("input", () => {
    const s = invInput.selectionStart;
    const e = invInput.selectionEnd;
    invInput.value = invInput.value.toUpperCase();
    if (s != null && e != null) invInput.setSelectionRange(s, e);
  });
}

const locations = [
  { value: "Blue Office", label: "Blue Office" },
  { value: "Clinic", label: "Clinic" },
  { value: "Control Room", label: "Control Room" },
  { value: "Dark Room", label: "Dark Room" },
  { value: "Green Office", label: "Green Office" },
  { value: "HRD", label: "HR Department" },
  { value: "HSE Yard", label: "HSE Yard" },
  { value: "IT Server", label: "IT Server" },
  { value: "IT Store", label: "IT Store" },
  { value: "Multi Purposes Building", label: "Multi Purposes Building" },
  { value: "Red Office", label: "Red Office" },
  { value: "Security", label: "Security" },
  { value: "Store 1", label: "Store 1" },
  { value: "Store 2", label: "Store 2" },
  { value: "Store 3", label: "Store 3" },
  { value: "Store 4", label: "Store 4" },
  { value: "Store 5", label: "Store 5" },
  { value: "Store 6", label: "Store 6" },
  { value: "Warehouse", label: "Warehouse" },
  { value: "White Office", label: "White Office" },
  { value: "White Office 2nd Fl", label: "White Office 2nd Floor" },
  { value: "White Office 3rd Fl", label: "White Office 3rd Floor" },
  { value: "Welding School", label: "Welding School" },
  { value: "Workshop9", label: "Workshop 9" },
  { value: "Workshop10", label: "Workshop 10" },
  { value: "Workshop11", label: "Workshop 11" },
  { value: "Workshop12", label: "Workshop 12" },
  { value: "Yard", label: "Yard" },
  { value: "Rest Area", label: "Rest Area" },
  { value: "Lainlain", label: "Other Location" },
];

const codesList = ["HW", "SW", "NW", "MV", "OT", "DR"];

function buildLocationOptions() {
  return locations
    .map((o) => `<option value="${o.value}">${o.label}</option>`)
    .join("");
}

function buildCodeChips(namePrefix) {
  return codesList
    .map(
      (c) =>
        `<label class="chip"><input type="checkbox" name="${namePrefix}_code" value="${c}" /><span>${c}</span></label>`
    )
    .join("");
}

function updateActivityElement(el, d) {
  const updateInput = (selector, value) => {
    const input = el.querySelector(selector);
    if (input && document.activeElement !== input) {
      input.value = value || "";
    }
  };

  const updateSelect = (selector, value) => {
    const input = el.querySelector(selector);
    if (input && document.activeElement !== input) {
      input.value = value || "";
    }
  };

  updateSelect('select[name="lokasi"]', d.lokasi);
  updateInput('input[name="pengguna"]', d.pengguna);
  updateInput('textarea[name="remarks"]', d.remarks);
  updateSelect('select[name="quality"]', d.quality || "Finish");

  if (Array.isArray(d.kode_pekerjaan)) {
    const currentCodes = new Set(d.kode_pekerjaan);
    const checkboxes = el.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach((cb) => {
      // Check if this checkbox belongs to the code group (it should, based on structure)
      if (
        cb.name &&
        cb.name.endsWith("_code") &&
        document.activeElement !== cb
      ) {
        cb.checked = currentCodes.has(cb.value);
      }
    });
  }

  const labelMulai = el.querySelector('[data-role="label_mulai"]');
  const inputMulai = el.querySelector('input[name="jam_mulai"]');
  const inputSelesai = el.querySelector('input[name="jam_selesai"]');
  const btnStart = el.querySelector('[data-role="start"]');
  const btnFinish = el.querySelector('[data-role="finish"]');
  const btnSaveManual = el.querySelector('[data-role="save_manual"]');

  if (d.jam_mulai) {
    if (inputMulai && document.activeElement !== inputMulai)
      inputMulai.value = d.jam_mulai;
    if (labelMulai) labelMulai.textContent = d.jam_mulai;
  }
  if (d.jam_selesai) {
    if (inputSelesai && document.activeElement !== inputSelesai)
      inputSelesai.value = d.jam_selesai;

    // Toggle buttons based on jam_selesai existence
    if (inputSelesai && inputSelesai.value) {
      if (btnFinish) btnFinish.style.display = "none";
      if (btnSaveManual) btnSaveManual.style.display = "inline-block";
    } else {
      if (btnFinish) btnFinish.style.display = "inline-block";
      if (btnSaveManual) btnSaveManual.style.display = "none";
    }
  }

  if (d.started) {
    if (btnStart) {
      btnStart.disabled = true;
      btnStart.style.display = "none";
    }
    if (btnFinish) btnFinish.disabled = false;
  } else {
    if (btnStart) {
      btnStart.disabled = false;
      btnStart.style.display = "";
    }
    if (btnFinish) btnFinish.disabled = true;
  }

  if (d.finished) {
    if (btnStart) btnStart.disabled = true;
    if (btnFinish) btnFinish.disabled = true;
    if (btnSaveManual) btnSaveManual.style.display = "none";
  }

  // Timer logic
  const id = d.id;
  if (d.startMs && !d.finished) {
    if (!activityTimers[id]) {
      activityTimers[id] = { startMs: d.startMs, interval: null };
      const timer = el.querySelector('[data-role="timer"]');
      const update = () => {
        const diff = Date.now() - activityTimers[id].startMs;
        if (timer) timer.textContent = formatHMS(diff);
      };
      update();
      activityTimers[id].interval = setInterval(update, 1000);
    } else if (activityTimers[id].startMs !== d.startMs) {
      clearInterval(activityTimers[id].interval);
      activityTimers[id] = { startMs: d.startMs, interval: null };
      const timer = el.querySelector('[data-role="timer"]');
      const update = () => {
        const diff = Date.now() - activityTimers[id].startMs;
        if (timer) timer.textContent = formatHMS(diff);
      };
      update();
      activityTimers[id].interval = setInterval(update, 1000);
    }
  } else {
    if (activityTimers[id]) {
      if (activityTimers[id].interval)
        clearInterval(activityTimers[id].interval);
      delete activityTimers[id];
    }
  }
}

function renderActivity(d, container) {
  const el = document.createElement("div");
  el.className = "activity-item";
  el.dataset.id = d.id;
  el.innerHTML = `
    <div class="form-group">
      <label>Inv Code</label>
      <input type="text" name="item_inv_code" placeholder="PC20024MEB" />
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Lokasi</label>
        <select name="lokasi">${buildLocationOptions()}</select>
      </div>
      <div class="form-group">
        <label>Pengguna</label>
        <input type="text" name="pengguna" placeholder="Nama pengguna" />
      </div>
    </div>
    <div class="form-group">
      <label>Kode / Code</label>
      <div class="checkbox-group">${buildCodeChips(d.id)}</div>
    </div>
    <div class="form-group">
      <label>Keterangan / Remarks</label>
      <textarea name="remarks"></textarea>
    </div>
    <div class="form-group">
      <label>Kendali Mutu / Quality Assurance</label>
      <select name="quality">
        <option value="Finish">Finish</option>
        <option value="Continue">Continue</option>
      </select>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Waktu Mulai</label>
        <div class="time-display" data-role="label_mulai">Not Started</div>
        <input type="hidden" name="jam_mulai" />
        <button type="button" class="btn-secondary" data-role="start">Start</button>
      </div>
      <div class="form-group">
        <label>Waktu Selesai</label>
        <input type="time" name="jam_selesai" class="form-control" style="width: 100%; padding: 8px; margin-bottom: 8px;" />
        <button type="button" class="btn-secondary" data-role="finish" disabled>Selesaikan</button>
        <button type="button" class="btn-success" data-role="save_manual" style="display:none;">Simpan</button>
      </div>
    </div>
    <div class="form-group">
      <label>Durasi</label>
      <div class="timer" data-role="timer">00:00:00</div>
    </div>
    <div class="activity-actions">
      <span class="muted" data-role="status"></span>
      <div style="flex: 1"></div>
      <button type="button" class="btn-danger btn-sm" data-role="delete" title="Delete Activity">
         <i class="fas fa-trash-alt"></i>
      </button>
    </div>
  `;
  (container || activitiesContainer).appendChild(el);
  const selLokasi = el.querySelector('select[name="lokasi"]');
  const inInvCode = el.querySelector('input[name="item_inv_code"]');
  const inPengguna = el.querySelector('input[name="pengguna"]');
  const taRemarks = el.querySelector('textarea[name="remarks"]');
  const selQuality = el.querySelector('select[name="quality"]');
  if (inInvCode) {
    if (d.inv_code) {
      inInvCode.value = d.inv_code;
    } else {
      const globalInvEl = document.getElementById("inv_code");
      const globalInv = (globalInvEl && globalInvEl.value) || "";
      if (globalInv) {
        inInvCode.value = globalInv.toUpperCase();
        try {
          if (currentUser && d.id) {
            activeCol
              .doc(d.id)
              .set(
                { inv_code: globalInv.toUpperCase(), uid: currentUser.uid },
                { merge: true }
              );
          }
        } catch (e) {}
      }
    }
    inInvCode.addEventListener("input", () => {
      const s = inInvCode.selectionStart;
      const e = inInvCode.selectionEnd;
      inInvCode.value = (inInvCode.value || "").toUpperCase();
      if (s != null && e != null) inInvCode.setSelectionRange(s, e);
    });
  }
  if (selLokasi && d.lokasi) selLokasi.value = d.lokasi;
  if (inPengguna && d.pengguna) inPengguna.value = d.pengguna;
  if (taRemarks && d.remarks) taRemarks.value = d.remarks;
  if (selQuality && d.quality) selQuality.value = d.quality;
  if (Array.isArray(d.kode_pekerjaan)) {
    d.kode_pekerjaan.forEach((code) => {
      const cb = el.querySelector(
        `input[name="${d.id}_code"][value="${code}"]`
      );
      if (cb) cb.checked = true;
    });
  }
  const labelMulai = el.querySelector('[data-role="label_mulai"]');
  const inputMulai = el.querySelector('input[name="jam_mulai"]');
  const inputSelesai = el.querySelector('input[name="jam_selesai"]');
  const btnStart = el.querySelector('[data-role="start"]');
  const btnFinish = el.querySelector('[data-role="finish"]');
  const btnSaveManual = el.querySelector('[data-role="save_manual"]');

  if (d.jam_mulai) {
    inputMulai.value = d.jam_mulai;
    if (labelMulai) labelMulai.textContent = d.jam_mulai;
  }
  if (d.jam_selesai) {
    inputSelesai.value = d.jam_selesai;

    // Toggle buttons based on jam_selesai existence
    if (inputSelesai.value) {
      if (btnFinish) btnFinish.style.display = "none";
      if (btnSaveManual) btnSaveManual.style.display = "inline-block";
    } else {
      if (btnFinish) btnFinish.style.display = "inline-block";
      if (btnSaveManual) btnSaveManual.style.display = "none";
    }
  }
  if (d.started) {
    if (btnStart) {
      btnStart.disabled = true;
      btnStart.style.display = "none";
    }
    if (btnFinish) btnFinish.disabled = false;
  }
  if (d.finished) {
    if (btnStart) btnStart.disabled = true;
    if (btnFinish) btnFinish.disabled = true;
    if (btnSaveManual) btnSaveManual.style.display = "none";
  }
  if (d.startMs && !d.finished) {
    const id = d.id;
    activityTimers[id] = { startMs: d.startMs, interval: null };
    const timer = el.querySelector('[data-role="timer"]');
    const update = () => {
      const diff = Date.now() - activityTimers[id].startMs;
      if (timer) timer.textContent = formatHMS(diff);
    };
    update();
    activityTimers[id].interval = setInterval(update, 1000);
  }
}

function getDurationMinutes(d) {
  if (typeof d.durasi_menit === "number" && d.durasi_menit > 0)
    return d.durasi_menit;
  if (d.jam_mulai && d.jam_selesai) {
    const n = calculateDuration(d.jam_mulai, d.jam_selesai);
    return n > 0 ? n : 1;
  }
  return null;
}

function renderActivitySummary(d, container) {
  const el = document.createElement("div");
  el.className = "activity-summary";
  el.dataset.id = d.id;
  const dur = getDurationMinutes(d);
  const durClass = getDurationClass(dur);
  const codes =
    Array.isArray(d.kode_pekerjaan) && d.kode_pekerjaan.length
      ? d.kode_pekerjaan.join(" & ")
      : "";
  const docId = d.report_doc_id || d.id || "";
  const last3 = docId ? docId.slice(-3) : "";
  const activityId = codes ? `${codes}-${last3}` : last3;
  el.innerHTML = `
    <div class="summary-row">
      <div class="summary-main">
        <div class="summary-title">${d.inv_code || ""}</div>
        <div class="summary-sub">${codes}</div>
      </div>
      <div class="summary-meta">
        <div>${d.lokasi || ""}</div>
        <div>${d.pengguna || ""}</div>
      </div>
    </div>
    <div class="summary-times">
      <span>${d.jam_mulai || "-"}</span> - <span>${d.jam_selesai || "-"}</span>
      <span class="summary-duration ${durClass}">${
    dur != null ? formatDuration(dur) : ""
  }</span>
      <span style="margin-left:8px;">${d.quality || ""}</span>
    </div>
    <div class="summary-remarks">${d.remarks || ""}</div>
    
    <div class="summary-id">Activity ID: ${activityId}</div>
    ${
      d.tanggal === todayStr()
        ? `<div class="summary-footer">
             <button type="button" class="btn-danger btn-sm" onclick="undoActivity('${d.id}')">
               <i class="fas fa-undo"></i> Undo
             </button>
           </div>`
        : ""
    }
  `;
  (container || historyContainer).appendChild(el);
}

function getDurationClass(n) {
  if (n == null) return "";
  if (n > 120) return "high";
  if (n > 60) return "mid";
  return "low";
}

let activityCounter = 0;
async function addActivity() {
  if (!currentUser) {
    alert("Silakan login terlebih dahulu");
    return;
  }
  activityCounter += 1;
  const t = new Date();
  const tanggal = `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(
    t.getDate()
  )}`;
  const bulan = tanggal.slice(0, 7);
  const inv = (document.getElementById("inv_code").value || "").toUpperCase();
  try {
    await activeCol.add({
      tanggal,
      bulan,
      inv_code: inv,
      lokasi: "",
      remarks: "",
      pengguna: "",
      kode_pekerjaan: [],
      jam_mulai: "",
      jam_selesai: "",
      started: false,
      finished: false,
      startMs: null,
      created_at: firebase.firestore.FieldValue.serverTimestamp(),
      uid: currentUser.uid,
      user_email: currentUser.email || "",
    });
  } catch (err) {
    alert(
      err && err.code === "permission-denied"
        ? "Akses ditolak oleh Firestore Rules saat menambahkan aktivitas."
        : "Gagal menambahkan aktivitas: " +
            (err && err.message ? err.message : "Unknown error")
    );
  }
}

function startActivityTimer(item) {
  const labelMulai = item.querySelector('[data-role="label_mulai"]');
  const inputMulai = item.querySelector('input[name="jam_mulai"]');
  const btnStart = item.querySelector('[data-role="start"]');
  const btnFinish = item.querySelector('[data-role="finish"]');
  const timer = item.querySelector('[data-role="timer"]');
  const t = nowHM();
  inputMulai.value = t;
  if (labelMulai) labelMulai.textContent = t;
  if (btnStart) {
    btnStart.disabled = true;
    btnStart.style.display = "none";
  }
  if (btnFinish) btnFinish.disabled = false;
  const id = item.dataset.id;
  activityTimers[id] = { startMs: Date.now(), interval: null };
  const update = () => {
    const diff = Date.now() - activityTimers[id].startMs;
    if (timer) timer.textContent = formatHMS(diff);
  };
  update();
  activityTimers[id].interval = setInterval(update, 1000);
}

function stopActivityTimer(item) {
  const id = item.dataset.id;
  const rec = activityTimers[id];
  if (rec && rec.interval) {
    clearInterval(rec.interval);
    rec.interval = null;
  }
}

async function finishActivity(item, isManual = false) {
  const inputMulai = item.querySelector('input[name="jam_mulai"]');
  const inputSelesai = item.querySelector('input[name="jam_selesai"]');
  // const labelSelesai = item.querySelector('[data-role="label_selesai"]'); // Removed
  const btnFinish = item.querySelector('[data-role="finish"]');
  const status = item.querySelector('[data-role="status"]');
  const t = nowHM();
  if (!inputMulai.value) {
    alert("Klik Mulai terlebih dahulu");
    return;
  }

  if (!isManual) {
    inputSelesai.value = t;
  }

  // if (labelSelesai) labelSelesai.textContent = inputSelesai.value; // Removed logic
  stopActivityTimer(item);

  const idForTimer = item.dataset.id;
  const recTimer = activityTimers[idForTimer];
  const tanggal = todayStr();
  const bulan = tanggal.slice(0, 7);
  let inv = "";
  try {
    const activeSnap = await activeCol.doc(idForTimer).get();
    if (activeSnap.exists) {
      inv = (activeSnap.data().inv_code || "").toUpperCase();
    }
  } catch (e) {}
  if (!inv) {
    const invInputEl = document.getElementById("inv_code");
    inv = invInputEl && invInputEl.value ? invInputEl.value.toUpperCase() : "";
  }
  const qualityEl = item.querySelector('select[name="quality"]');
  const quality = qualityEl ? qualityEl.value : "Finish";
  const lokasi = item.querySelector('select[name="lokasi"]').value;
  const remarks = item.querySelector('textarea[name="remarks"]').value;
  const pengguna = item.querySelector('input[name="pengguna"]').value;
  const codes = Array.from(
    item.querySelectorAll('input[name$="_code"]:checked')
  ).map((cb) => cb.value);

  const durasiMenit = calculateDuration(inputMulai.value, inputSelesai.value);
  if (durasiMenit < 0) {
    alert("Jam selesai harus lebih besar dari jam mulai!");
    return null;
  }

  const reportData = {
    tanggal,
    bulan,
    inv_code: inv,
    kode_pekerjaan: codes,
    lokasi,
    remarks,
    pengguna,
    jam_mulai: inputMulai.value,
    jam_selesai: inputSelesai.value,
    durasi_menit: durasiMenit,
    quality,
    created_at: firebase.firestore.FieldValue.serverTimestamp(),
    uid: currentUser.uid,
    user_email: currentUser.email || "",
  };

  try {
    const docRef = await db.collection("daily_reports").add(reportData);
    try {
      await activeCol
        .doc(idForTimer)
        .set({ report_doc_id: docRef.id }, { merge: true });
    } catch (e) {}

    if (btnFinish) btnFinish.disabled = true;
    const btnStart = item.querySelector('[data-role="start"]');
    if (btnStart) btnStart.disabled = true;
    const timer = item.querySelector('[data-role="timer"]');
    if (timer) timer.textContent = "00:00:00";
    if (status) status.textContent = "Tersimpan";

    return { id: docRef.id, ...reportData };
  } catch (err) {
    alert(
      err && err.code === "permission-denied"
        ? "Akses ditolak oleh Firestore Rules saat menyimpan laporan selesai."
        : "Gagal menyimpan laporan: " +
            (err && err.message ? err.message : "Unknown error")
    );
    return null;
  }
}

if (activitiesContainer) {
  if (btnAddActivity) btnAddActivity.addEventListener("click", addActivity);
  activitiesContainer.addEventListener("click", async (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    const item = btn.closest(".activity-item");
    if (!item) return;
    if (!currentUser) {
      alert("Silakan login terlebih dahulu");
      return;
    }
    const role = btn.getAttribute("data-role");
    const id = item.dataset.id;
    if (role === "delete") {
      const result = await Swal.fire({
        title: "Hapus Aktivitas?",
        text: "Aktivitas ini akan dihapus permanen.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#dc2626",
        confirmButtonText: "Ya, Hapus!",
        cancelButtonText: "Batal",
      });

      if (!result.isConfirmed) return;

      try {
        stopActivityTimer(item);
        await activeCol.doc(id).delete();
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "success",
          title: "Aktivitas dihapus",
          text: "Aktivitas telah dihapus dari daftar Aktif",
          timer: 1500,
          timerProgressBar: true,
          showConfirmButton: false,
          showClass: { popup: "swal2-animate-fade-up-in" },
          hideClass: { popup: "swal2-animate-fade-up-out" },
        });
        // Item will be removed automatically by onSnapshot listener
      } catch (err) {
        alert(
          err && err.code === "permission-denied"
            ? "Akses ditolak oleh Firestore Rules saat menghapus aktivitas."
            : "Gagal menghapus aktivitas: " +
                (err && err.message ? err.message : "Unknown error")
        );
      }
    }
    if (role === "start") {
      startActivityTimer(item);
      const jm = item.querySelector('input[name="jam_mulai"]').value;
      try {
        await activeCol.doc(id).set(
          {
            jam_mulai: jm,
            started: true,
            startMs: Date.now(),
            uid: currentUser.uid,
          },
          { merge: true }
        );
      } catch (err) {
        alert(
          err && err.code === "permission-denied"
            ? "Akses ditolak oleh Firestore Rules saat memulai aktivitas."
            : "Gagal memulai aktivitas: " +
                (err && err.message ? err.message : "Unknown error")
        );
      }
    }
    if (role === "finish") {
      const newReport = await finishActivity(item, false); // Realtime sets jam_selesai = now
      if (!newReport) return; // Abort if validation failed
      try {
        await activeCol.doc(id).set(
          {
            finished: true,
            jam_selesai: newReport.jam_selesai,
            uid: currentUser.uid,
          },
          { merge: true }
        );

        const currentHistoryDate = historyDateInput
          ? historyDateInput.value
          : todayStr();
        if (currentHistoryDate === newReport.tanggal) {
          historyData.push(newReport);
          renderHistoryList();
        }
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "success",
          title: "Aktivitas diselesaikan",
          text: "Aktivitas dipindahkan ke Activities Done (Today)",
          timer: 1500,
          timerProgressBar: true,
          showConfirmButton: false,
          showClass: { popup: "swal2-animate-fade-up-in" },
          hideClass: { popup: "swal2-animate-fade-up-out" },
        });
        if (item && item.parentElement) {
          item.remove();
        }
      } catch (err) {
        alert(
          err && err.code === "permission-denied"
            ? "Akses ditolak oleh Firestore Rules saat menandai selesai."
            : "Gagal menandai selesai: " +
                (err && err.message ? err.message : "Unknown error")
        );
      }
    }
    if (role === "save_manual") {
      const newReport = await finishActivity(item, true); // Manual
      try {
        const selesai = item.querySelector('input[name="jam_selesai"]').value;
        if (!newReport) return; // If validation failed in finishActivity

        await activeCol.doc(id).set(
          {
            finished: true,
            jam_selesai: selesai,
            uid: currentUser.uid,
          },
          { merge: true }
        );

        if (newReport) {
          const currentHistoryDate = historyDateInput
            ? historyDateInput.value
            : todayStr();
          if (currentHistoryDate === newReport.tanggal) {
            historyData.push(newReport);
            renderHistoryList();
          }
        }
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "success",
          title: "Aktivitas diselesaikan",
          text: "Aktivitas dipindahkan ke Activities Done (Today)",
          timer: 1500,
          timerProgressBar: true,
          showConfirmButton: false,
          showClass: { popup: "swal2-animate-fade-up-in" },
          hideClass: { popup: "swal2-animate-fade-up-out" },
        });
        if (item && item.parentElement) {
          item.remove();
        }
      } catch (err) {
        alert(
          err && err.code === "permission-denied"
            ? "Akses ditolak oleh Firestore Rules saat menyimpan manual."
            : "Gagal menyimpan manual: " +
                (err && err.message ? err.message : "Unknown error")
        );
      }
    }
  });
  activitiesContainer.addEventListener("input", async (e) => {
    if (e.target.name === "jam_selesai") {
      const item = e.target.closest(".activity-item");
      const val = e.target.value;
      const btnFinish = item.querySelector('[data-role="finish"]');
      const btnSave = item.querySelector('[data-role="save_manual"]');
      const inputMulai = item.querySelector('input[name="jam_mulai"]');
      const timer = item.querySelector('[data-role="timer"]');
      const id = item.dataset.id;

      if (val) {
        if (btnFinish) btnFinish.style.display = "none";
        if (btnSave) btnSave.style.display = "inline-block";

        // Stop real-time timer if exists
        stopActivityTimer(item);

        // Calculate static duration based on input
        if (inputMulai && inputMulai.value) {
          const mins = calculateDuration(inputMulai.value, val);
          if (mins > 0) {
            timer.textContent = formatDuration(mins); // Use formatDuration (e.g. "X Minutes") or formatHMS if preferred
            // If you prefer HH:MM:SS format:
            const h = Math.floor(mins / 60);
            const m = mins % 60;
            timer.textContent = formatHMS(h * 3600000 + m * 60000);
          } else {
            timer.textContent = "Invalid Time";
          }
        }
      } else {
        if (btnFinish) btnFinish.style.display = "inline-block";
        if (btnSave) btnSave.style.display = "none";

        // Restart real-time timer
        // We need to fetch startMs from Firestore or reconstruct it.
        // Since we don't have startMs easily here, we can rely on updateActivityElement
        // which sets up the timer if startMs exists in the data.
        // Or simpler: check if we have a timer running for this ID, if not start it?
        // But startMs is needed.
        // Let's rely on the fact that the data in Firestore (startMs) hasn't changed.
        // We just need to restart the interval using the original startMs.
        // However, 'd' is not available here. We can assume the item has data-id.
        // We can check activityTimers[id].

        // Better approach: Let's re-fetch or re-trigger the timer logic.
        // Since we stopped it, we need to restart it.
        // But we need 'startMs'. We can't get it from DOM easily unless stored.
        // Wait, 'activityTimers[id]' might still have startMs if we only cleared interval.

        if (activityTimers[id] && activityTimers[id].startMs) {
          const update = () => {
            const diff = Date.now() - activityTimers[id].startMs;
            if (timer) timer.textContent = formatHMS(diff);
          };
          update();
          activityTimers[id].interval = setInterval(update, 1000);
        }
      }
    }

    const item = e.target.closest(".activity-item");
    if (!item) return;
    if (!currentUser) return;
    const id = item.dataset.id;
    const lokasiEl = item.querySelector('select[name="lokasi"]');
    const invItemEl = item.querySelector('input[name="item_inv_code"]');
    const penggunaEl = item.querySelector('input[name="pengguna"]');
    const remarksEl = item.querySelector('textarea[name="remarks"]');
    const qualityEl = item.querySelector('select[name="quality"]');
    const codes = Array.from(
      item.querySelectorAll('input[name$="_code"]:checked')
    ).map((cb) => cb.value);
    try {
      const payload = {
        lokasi: lokasiEl ? lokasiEl.value : "",
        pengguna: penggunaEl ? penggunaEl.value : "",
        remarks: remarksEl ? remarksEl.value : "",
        quality: qualityEl ? qualityEl.value : "Finish",
        kode_pekerjaan: codes,
        uid: currentUser.uid,
      };
      if (invItemEl) {
        payload.inv_code = (invItemEl.value || "").toUpperCase();
      }
      await activeCol.doc(id).set(payload, { merge: true });
    } catch (err) {
      alert(
        err && err.code === "permission-denied"
          ? "Akses ditolak oleh Firestore Rules saat mengubah aktivitas."
          : "Gagal mengubah aktivitas: " +
              (err && err.message ? err.message : "Unknown error")
      );
    }
  });
  refreshDraftsListener();
  if (invInput) invInput.addEventListener("input", refreshDraftsListener);
}

// main draft flow removed

// =========================
// SIMPAN DATA
// =========================
const reportFormEl = document.getElementById("reportForm");
if (reportFormEl)
  reportFormEl.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!currentUser) {
      alert("Silakan login terlebih dahulu");
      return;
    }

    const tanggal = todayStr();
    const bulan = tanggal.slice(0, 7);
    const inv = document.getElementById("inv_code").value.toUpperCase();
    const lokasi = document.getElementById("lokasi").value;
    const remarks = document.getElementById("remarks").value;
    const pengguna = document.getElementById("pengguna").value;
    const codes = Array.from(
      document.querySelectorAll(
        "#reportForm .checkbox-group input[type=checkbox]:checked"
      )
    ).map((cb) => cb.value);
    const jm = nowHM();
    try {
      await activeCol.add({
        tanggal,
        bulan,
        inv_code: inv,
        lokasi,
        remarks,
        pengguna,
        kode_pekerjaan: codes,
        jam_mulai: jm,
        jam_selesai: "",
        started: true,
        finished: false,
        startMs: Date.now(),
        created_at: firebase.firestore.FieldValue.serverTimestamp(),
        uid: currentUser.uid,
        user_email: currentUser.email || "",
      });
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Aktivitas Ditambahkan",
        text: "Aktivitas baru telah ditambahkan ke daftar Aktif",
        timer: 1500,
        timerProgressBar: true,
        showConfirmButton: false,
        showClass: { popup: "swal2-animate-fade-up-in" },
        hideClass: { popup: "swal2-animate-fade-up-out" },
      });
      e.target.reset();

      // Preserve checkbox state reset explicitly if needed, though reset() usually handles it
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Gagal Menambahkan",
        text:
          err && err.message
            ? err.message
            : "Terjadi kesalahan saat menambahkan aktivitas",
      });
    }
  });

// =========================
// EXPORT EXCEL
// =========================
async function exportExcel() {
  if (!currentUser) {
    alert("Silakan login terlebih dahulu");
    return;
  }
  const tgl = document.getElementById("exportTanggal").value;
  if (!tgl) {
    alert("Pilih tanggal export!");
    return;
  }
  let snapshot;
  try {
    snapshot = await db
      .collection("daily_reports")
      .where("uid", "==", currentUser.uid)
      .where("tanggal", "==", tgl)
      .get();
  } catch (err) {
    if (err && err.code === "permission-denied") {
      alert(
        "Akses ditolak oleh Firestore Rules. Izinkan read pada daily_reports."
      );
      return;
    }
    if (err && err.code === "failed-precondition") {
      alert(
        "Index belum dibuat untuk query uid+tanggal pada daily_reports. Buat index di Firestore."
      );
      return;
    }
    alert(
      "Gagal mengambil data: " +
        (err && err.message ? err.message : "Unknown error")
    );
    return;
  }
  const header = [
    [
      "Tgl. / Date",
      "Kode Inv. (uraian) / Inv. Code ( Description)",
      "Kode / Code",
      "Lokasi /         Location 1)",
      "Keterangan / Remarks",
      "Pengguna / User",
      "Durasi / Duration",
      "Kendali Mutu /        Quality Assurance",
    ],
  ];
  const toDMY = (ymd) => {
    if (!ymd || typeof ymd !== "string") return "";
    const [y, m, d] = ymd.split("-");
    return `${d}/${m}/${y}`;
  };
  const rows = snapshot.docs.map((doc) => {
    const d = doc.data();
    const dur = getDurationMinutes(d);
    return [
      toDMY(d.tanggal),
      d.inv_code || "",
      Array.isArray(d.kode_pekerjaan) ? d.kode_pekerjaan.join(" & ") : "",
      "Bintan / " + (d.lokasi || ""),
      d.remarks || "",
      d.pengguna || "",
      dur != null ? formatDuration(dur) : "",
      d.quality || "Finish",
    ];
  });
  if (window.ExcelJS && window.ExcelJS.Workbook) {
    const wb2 = new ExcelJS.Workbook();
    const ws2 = wb2.addWorksheet(`Daily Report ${tgl}`);
    ws2.pageSetup = {
      orientation: "landscape",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
    };
    ws2.mergeCells("B1:D3");
    ws2.getCell("B1").value = "PT MEINDO ELANG INDAH";
    ws2.getCell("B1").font = {
      bold: true,
      size: 14,
      color: { argb: "FF000000" },
    };
    ws2.getCell("B1").alignment = { vertical: "middle", horizontal: "left" };

    ws2.mergeCells("E1:I3");
    ws2.getCell("E1").value =
      "No. Form: PAT-SIT-801-PO1\nRev.00 Tanggal: 28-01-2019";
    ws2.getCell("E1").font = {
      bold: true,
      size: 10,
      color: { argb: "FF000000" },
    };
    ws2.getCell("E1").alignment = {
      vertical: "middle",
      horizontal: "right",
      wrapText: true,
    };
    ws2.mergeCells("B4:I4");
    ws2.getCell("B4").value = "AKTIVITAS-AKTIVITAS IT / IT ACTIVITIES";
    ws2.getCell("B4").font = {
      bold: true,
      size: 12,
      color: { argb: "FF000000" },
    };
    ws2.getCell("B4").alignment = { vertical: "middle", horizontal: "center" };

    ws2.mergeCells("B6:D6");
    ws2.getCell("B6").value = `Nama / Name : Riko Hermansyah`;
    ws2.getCell("A6").font = { bold: true, size: 10 };
    ws2.getCell("A6").alignment = { vertical: "middle", horizontal: "left" };
    ws2.mergeCells("E6:H6");
    ws2.getCell("E6").value = `Period : ${tgl.slice(0, 7)}`;
    ws2.getCell("E6").font = { bold: true, size: 10 };
    ws2.getCell("E6").alignment = { vertical: "middle", horizontal: "right" };
    const pxToWch = (px) => Math.round(px / 7);
    const pxToPt = (px) => Math.round(px * 0.75);
    ws2.getColumn(1).width = pxToWch(15);
    ws2.getColumn(2).width = pxToWch(83);
    ws2.getColumn(3).width = pxToWch(113);
    ws2.getColumn(4).width = pxToWch(86);
    ws2.getColumn(5).width = pxToWch(181);
    ws2.getColumn(6).width = pxToWch(487);
    ws2.getColumn(7).width = pxToWch(126);
    ws2.getColumn(8).width = pxToWch(126);
    ws2.getColumn(9).width = pxToWch(123);
    const headerRowIndex = 10;
    ws2.getRow(headerRowIndex).height = pxToPt(69);
    const headers = header[0];
    const aligns = [
      { horizontal: "right", vertical: "middle", wrapText: true, indent: 1 },
      { horizontal: "center", vertical: "middle", wrapText: true },
      { horizontal: "center", vertical: "middle", wrapText: true },
      { horizontal: "center", vertical: "middle", wrapText: true },
      { horizontal: "center", vertical: "middle", wrapText: true },
      { horizontal: "center", vertical: "middle", wrapText: true },
      { horizontal: "center", vertical: "middle", wrapText: true },
      { horizontal: "center", vertical: "middle", wrapText: true },
    ];
    for (let i = 0; i < headers.length; i++) {
      const cell = ws2.getCell(headerRowIndex, 2 + i);
      cell.value = headers[i];
      cell.font = { name: "Arial", bold: true, size: 10 };
      cell.alignment = aligns[i];
      cell.border = {
        top: { style: "thick" },
        left: { style: "thick" },
        bottom: { style: "thick" },
        right: { style: "thick" },
      };
    }
    let rowIndex = headerRowIndex + 1;
    rows.forEach((arr) => {
      for (let i = 0; i < arr.length; i++) {
        const cell = ws2.getCell(rowIndex, 2 + i);
        cell.value = arr[i];
        cell.font = { name: "Arial", size: 10 };
        let horiz = "left";
        let vert = "top";
        let indent = 0;
        let wrap = false;
        if (i === 0) horiz = "right";
        if (i === 2) horiz = "center";
        if (i === 4) wrap = true;
        if (i === 4 || i === 7) indent = 0;
        if (i === 7) {
          horiz = "center";
          vert = "bottom";
          indent = 0;
        }
        cell.alignment = {
          horizontal: horiz,
          vertical: vert,
          wrapText: wrap,
          indent,
        };
        cell.border = {
          top: { style: "hair" },
          left: { style: "hair" },
          bottom: { style: "hair" },
          right: { style: "hair" },
        };
      }
      ws2.getRow(rowIndex).height = pxToPt(20);
      rowIndex += 1;
    });
    const emptyRowsCount = 2;
    for (let k = 0; k < emptyRowsCount; k++) {
      for (let i = 0; i < headers.length; i++) {
        const cell = ws2.getCell(rowIndex, 2 + i);
        cell.value = "";
        cell.font = { name: "Arial", size: 10 };
        cell.alignment = {
          horizontal: "left",
          vertical: "top",
          wrapText: false,
        };
        cell.border = {
          top: { style: "hair" },
          left: { style: "hair" },
          bottom: { style: "hair" },
          right: { style: "hair" },
        };
      }
      rowIndex += 1;
    }
    const setBorderSide = (cell, side, style) => {
      const b = cell.border || {};
      const merged = {
        top: b.top,
        left: b.left,
        bottom: b.bottom,
        right: b.right,
      };
      merged[side] = { style };
      cell.border = merged;
    };
    const tableFirstRow = headerRowIndex;
    const tableLastRow = rowIndex - 1;
    const tableFirstCol = 2;
    const tableLastCol = 2 + headers.length - 1;
    for (let c = tableFirstCol; c <= tableLastCol; c++) {
      setBorderSide(ws2.getCell(tableFirstRow, c), "top", "thick");
      setBorderSide(ws2.getCell(tableLastRow, c), "bottom", "thick");
    }
    for (let r = tableFirstRow; r <= tableLastRow; r++) {
      setBorderSide(ws2.getCell(r, tableFirstCol), "left", "thick");
      setBorderSide(ws2.getCell(r, tableLastCol), "right", "thick");
    }
    // ws2.views = [{ state: "frozen", xSplit: 1, ySplit: headerRowIndex }];
    // const spacer = ws2.addRow(["", "", "", "", "", "", "", "", ""]);
    // spacer.height = 10;
    // ws2.mergeCells(`B${spacer.number + 1}:D${spacer.number + 3}`);
    // ws2.getCell(`B${spacer.number + 1}`).value = "Supervisor / Manager";
    // ws2.getCell(`B${spacer.number + 1}`).alignment = {
    //   horizontal: "center",
    //   vertical: "middle",
    // };
    // ws2.mergeCells(`E${spacer.number + 1}:I${spacer.number + 3}`);
    // ws2.getCell(`E${spacer.number + 1}`).value = "Prepared By";
    // ws2.getCell(`E${spacer.number + 1}`).alignment = {
    //   horizontal: "center",
    //   vertical: "middle",
    // };
    // [
    //   ws2.getCell(`B${spacer.number + 1}`),
    //   ws2.getCell(`E${spacer.number + 1}`),
    // ].forEach((cell) => {
    //   cell.border = {
    //     top: { style: "thin" },
    //     left: { style: "thin" },
    //     bottom: { style: "thin" },
    //     right: { style: "thin" },
    //   };
    // });
    const buf = await wb2.xlsx.writeBuffer();
    const blob = new Blob([buf], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    if (typeof saveAs === "function") {
      saveAs(blob, "Daily_Report_Riko.xlsx");
    } else {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Daily_Report_Riko.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    }
    return;
  }
  const ws = XLSX.utils.aoa_to_sheet([...header, ...rows]);
  ws["!cols"] = [
    { wch: 10 },
    { wch: 35 },
    { wch: 18 },
    { wch: 20 },
    { wch: 40 },
    { wch: 18 },
    { wch: 12 },
    { wch: 18 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, `${tgl}`);
  XLSX.writeFile(wb, "Daily_Report_Riko.xlsx");
}
