// =====================================================
// ar.js — KURBUTEKS WebAR
// Framework : MindAR Image Tracking + A-Frame
// Revised   : All 10 logic bugs fixed
// =====================================================
// Kompatibel dengan:
//   ar/index.html  |  css/ar.css
//   assets/data/meganthropus.json
//   assets/audio/meganthropus/*.mp3
// =====================================================
//
// Struktur JSON yang diharapkan:
// {
//   "id": "meganthropus",
//   "title": "...",
//   "sections": {
//     "intro":  { "title":"...", "audio":"...", "caption":"..." },
//     "kepala": { "title":"...", "audio":"...", "caption":"..." },
//     ...
//   }
// }
// =====================================================


// ┌─────────────────────────────────────────────────┐
// │  1. CONFIG                                       │
// └─────────────────────────────────────────────────┘

const CONFIG = {
  jsonPath : "../assets/data/meganthropus.json",
  quizPath : "../quiz/",
  scale: {
    userDefault : 1.0,   // userScale awal (dikalikan ke focusScale)
    step        : 0.15,
    min         : 0.5,
    max         : 3.0
  },
  // Durasi animasi transisi model (ms)
  // — dipakai untuk lerp rotation + position + scale
  transition: {
    duration : 600,      // total ms
    fps      : 60
  }
};

// ─────────────────────────────────────────────────────
// MODEL_CONFIG — tuning manual per-bagian
//
// FIX BUG 4  : Semua rotation disesuaikan agar model
//              menghadap user (base offset Y = 180).
// FIX BUG 10 : Fokus dilakukan via kombinasi rotation +
//              position + focusScale karena model satu mesh.
//
// Nilai di bawah adalah TITIK AWAL yang masuk akal untuk
// model GLB yang origin-nya tegak dan menghadap +Z.
// Fine-tune angka ini setelah uji coba di HP.
//
// !! Kalau model lu menghadap ke samping (origin +X),
//    ganti base rotation Y dari 180 → 90 atau -90. !!
// ─────────────────────────────────────────────────────
const MODEL_CONFIG = {
  kepala: {
    rotation  : "15 180 0",   // sedikit mendongak agar kepala di tengah layar
    position  : "0 -0.15 0",  // geser ke bawah supaya kepala pas di viewport
    focusScale: 0.80
  },
  rahang: {
    rotation  : "25 180 0",   // lebih mendongak, rahang bawah masuk frame
    position  : "0 -0.10 0",
    focusScale: 0.80
  },
  badan: {
    rotation  : "0 180 0",    // tampak depan penuh
    position  : "0 0 0",
    focusScale: 0.50
  },
  lengan: {
    rotation  : "-5 210 0",   // sedikit rotasi Y supaya lengan kelihatan
    position  : "0.05 0 0",
    focusScale: 0.55
  },
  kaki: {
    rotation  : "-15 180 0",  // kamera "lihat dari atas" sedikit, kaki masuk
    position  : "0 0.15 0",   // geser ke atas agar kaki pas di tengah
    focusScale: 0.55
  }
};

// Posisi & rotasi default model (sebelum user pilih bagian)
const MODEL_DEFAULT = {
  rotation  : "0 180 0",
  position  : "0 0 0",
  focusScale: 0.50
};


// ┌─────────────────────────────────────────────────┐
// │  2. STATE                                        │
// └─────────────────────────────────────────────────┘

const STATE = {
  // Data dari JSON — dibaca via data.sections[part]
  sections     : {},

  // Audio
  currentAudio : null,
  isPlaying    : false,
  introPlayed  : false,

  // Scale: finalScale = focusScale × userScale
  focusScale   : MODEL_DEFAULT.focusScale,
  userScale    : CONFIG.scale.userDefault,

  // Focus
  activePart   : null,

  // Progress — hanya bertambah setelah audio "ended" tanpa error
  exploredParts: new Set(),

  // Animasi transisi
  animFrame    : null
};


// ┌─────────────────────────────────────────────────┐
// │  3. JSON LOADER                                  │
// └─────────────────────────────────────────────────┘

// FIX BUG 1: Baca data.sections, bukan data langsung.

async function loadFocusData() {
  try {
    const res = await fetch(CONFIG.jsonPath);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    // Validasi struktur JSON
    if (!data.sections) throw new Error("JSON tidak memiliki properti 'sections'.");
    STATE.sections = data.sections;

    console.log("[JSONLoader] Sections dimuat:", Object.keys(STATE.sections));
  } catch (err) {
    console.warn("[JSONLoader] Gagal muat JSON:", err);
    STATE.sections = {};
  } finally {
    initManagers();
  }
}


// ┌─────────────────────────────────────────────────┐
// │  4. AUDIO MANAGER                                │
// └─────────────────────────────────────────────────┘

const AudioManager = {

  /**
   * Hentikan dan reset audio aktif.
   * Tidak memanggil onEnded — stop bukan selesai.
   */
  stop() {
    if (!STATE.currentAudio) return;
    // Hapus listener ended agar tidak terpanggil setelah di-stop
    STATE.currentAudio.onended = null;
    STATE.currentAudio.pause();
    STATE.currentAudio.currentTime = 0;
    STATE.currentAudio = null;
    STATE.isPlaying    = false;
  },

  /**
   * Putar audio dari elemen <audio> yang sudah di-preload di HTML.
   *
   * FIX BUG 5 (audio error): onEnded hanya dipanggil dari event "ended",
   * BUKAN dari blok catch. Kalau audio gagal, progress tidak bertambah.
   *
   * @param {string} audioId  - id elemen <audio> (tanpa prefix "audio-")
   * @param {Function} [onEnded] - callback saat audio benar-benar selesai
   */
  play(audioId, onEnded) {
    this.stop();

    const el = document.getElementById("audio-" + audioId);
    if (!el) {
      // Audio element tidak ditemukan — jangan tambah progress
      console.warn(`[AudioManager] Element #audio-${audioId} tidak ditemukan.`);
      FocusController.setButtonsEnabled(true, STATE.activePart);
      return;
    }

    STATE.currentAudio = el;
    STATE.isPlaying    = true;
    el.currentTime     = 0;

    // Nonaktifkan tombol selain yang sedang aktif
    FocusController.setButtonsEnabled(false, STATE.activePart);

    // FIX BUG 5: onEnded HANYA dari event "ended" — bukan dari catch
    el.onended = () => {
      STATE.isPlaying    = false;
      STATE.currentAudio = null;
      el.onended         = null;
      FocusController.setButtonsEnabled(true, STATE.activePart);
      onEnded && onEnded();   // progress bertambah di sini
    };

    el.play().catch(err => {
      console.warn(`[AudioManager] Gagal putar audio-${audioId}:`, err);
      // FIX BUG 5: Gagal = tidak panggil onEnded = progress tidak bertambah
      STATE.isPlaying    = false;
      STATE.currentAudio = null;
      el.onended         = null;
      FocusController.setButtonsEnabled(true, STATE.activePart);
      // onEnded sengaja TIDAK dipanggil
    });
  },

  /**
   * Putar audio intro saat marker pertama kali ditemukan.
   * FIX BUG 2: Caption intro juga ditampilkan.
   */
  playIntro() {
    if (STATE.introPlayed) return;
    STATE.introPlayed = true;

    const introData = STATE.sections["intro"];
    if (!introData) return;

    // Tampilkan caption intro dulu, baru play audio
    CaptionController.show(introData.caption || "");
    AudioManager.play("intro");   // intro tidak menambah progress
  }
};


// ┌─────────────────────────────────────────────────┐
// │  5. MODEL CONTROLLER                             │
// └─────────────────────────────────────────────────┘

/**
 * Helper: parse string "x y z" ke array float [x, y, z]
 */
function parseVec3(str) {
  return str.trim().split(/\s+/).map(Number);
}

/**
 * Helper: lerp satu nilai
 */
function lerp(a, b, t) {
  return a + (b - a) * t;
}

const ModelController = {

  /**
   * FIX BUG 3: Transisi animasi halus untuk rotation, position, scale.
   * Menggunakan requestAnimationFrame + lerp selama CONFIG.transition.duration ms.
   *
   * @param {object} target - { rotation, position, focusScale }
   */
  animateTo(target) {
    // Batalkan animasi sebelumnya kalau masih jalan
    if (STATE.animFrame) {
      cancelAnimationFrame(STATE.animFrame);
      STATE.animFrame = null;
    }

    const el = DOM.model;

    // Baca state saat ini dari A-Frame
    const fromRot = [
      el.object3D.rotation.x * (180 / Math.PI),
      el.object3D.rotation.y * (180 / Math.PI),
      el.object3D.rotation.z * (180 / Math.PI)
    ];
    const fromPos = [
      el.object3D.position.x,
      el.object3D.position.y,
      el.object3D.position.z
    ];
    const fromScale = el.object3D.scale.x;   // uniform scale

    const toRot   = parseVec3(target.rotation);
    const toPos   = parseVec3(target.position);
    const toScale = target.focusScale * STATE.userScale;

    const duration  = CONFIG.transition.duration;
    const startTime = performance.now();

    function tick(now) {
      const elapsed  = now - startTime;
      const rawT     = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const t        = 1 - Math.pow(1 - rawT, 3);

      const rx = lerp(fromRot[0], toRot[0], t);
      const ry = lerp(fromRot[1], toRot[1], t);
      const rz = lerp(fromRot[2], toRot[2], t);

      const px = lerp(fromPos[0], toPos[0], t);
      const py = lerp(fromPos[1], toPos[1], t);
      const pz = lerp(fromPos[2], toPos[2], t);

      const s  = lerp(fromScale, toScale, t);

      el.setAttribute("rotation", `${rx} ${ry} ${rz}`);
      el.setAttribute("position", `${px} ${py} ${pz}`);
      el.setAttribute("scale",    `${s} ${s} ${s}`);

      if (rawT < 1) {
        STATE.animFrame = requestAnimationFrame(tick);
      } else {
        STATE.animFrame = null;
      }
    }

    STATE.animFrame = requestAnimationFrame(tick);
  },

  /**
   * Terapkan perubahan userScale tanpa mengubah rotation/position.
   * Langsung (tanpa animasi) supaya slider terasa responsif.
   */
  applyUserScale() {
    const s = (STATE.focusScale * STATE.userScale).toFixed(3);
    DOM.model.setAttribute("scale", `${s} ${s} ${s}`);
  },

  /**
   * FIX BUG 7: Reset model ke default saat targetLost.
   */
  reset() {
    STATE.focusScale = MODEL_DEFAULT.focusScale;
    this.animateTo({
      rotation  : MODEL_DEFAULT.rotation,
      position  : MODEL_DEFAULT.position,
      focusScale: MODEL_DEFAULT.focusScale
    });
  }
};


// ┌─────────────────────────────────────────────────┐
// │  6. SCALE CONTROLLER                             │
// └─────────────────────────────────────────────────┘

// FIX BUG 5 (scale): focusScale dan userScale dipisah.
// ScaleController hanya mengubah userScale.
// finalScale = focusScale (dari MODEL_CONFIG) × userScale (dari user).
// FIX BUG 5 (position): posisi tidak diubah saat user zoom —
// hanya scale yang berubah, model tetap di atas marker.

const ScaleController = {
  up() {
    STATE.userScale = Math.min(STATE.userScale + CONFIG.scale.step, CONFIG.scale.max);
    ModelController.applyUserScale();
  },
  down() {
    STATE.userScale = Math.max(STATE.userScale - CONFIG.scale.step, CONFIG.scale.min);
    ModelController.applyUserScale();
  },
  // Reset hanya userScale — focusScale (dari bagian aktif) tetap
  reset() {
    STATE.userScale = CONFIG.scale.userDefault;
    ModelController.applyUserScale();
  }
};


// ┌─────────────────────────────────────────────────┐
// │  7. FOCUS CONTROLLER                             │
// └─────────────────────────────────────────────────┘

const FocusController = {

  /**
   * Aktifkan fokus pada satu bagian tubuh.
   * Urutan:
   * 1. Stop audio sebelumnya (termasuk intro)
   * 2. Highlight tombol aktif
   * 3. Animasi transform model
   * 4. Tampilkan caption
   * 5. Play audio → progress bertambah HANYA kalau audio selesai normal
   *
   * FIX BUG 1  : STATE.sections[part] bukan STATE.focusData[part]
   * FIX BUG 3  : Animasi transisi
   * FIX BUG 5  : Progress hanya dari onEnded
   * FIX BUG 6  : Tombol aktif tidak di-disable
   */
  activate(part) {
    const data = STATE.sections[part];
    const cfg  = MODEL_CONFIG[part];
    if (!cfg) {
      console.warn(`[FocusController] Tidak ada MODEL_CONFIG untuk: ${part}`);
      return;
    }

    // 1. Stop audio sebelumnya
    AudioManager.stop();

    // 2. Catat bagian aktif SEBELUM setButtonsEnabled dipanggil
    STATE.activePart = part;

    // 3. Highlight tombol
    DOM.focusBtns.forEach(btn =>
      btn.classList.toggle("active", btn.dataset.part === part)
    );

    // 4. Animasi transform model
    STATE.focusScale = cfg.focusScale;
    ModelController.animateTo({
      rotation  : cfg.rotation,
      position  : cfg.position,
      focusScale: cfg.focusScale
    });

    // 5. Caption
    CaptionController.show(data?.caption || "");

    // 6. Play audio → kalau selesai normal → tandai progress
    AudioManager.play(part, () => {
      ProgressController.markExplored(part);
    });
  },

  /**
   * FIX BUG 6: Disable semua tombol KECUALI yang sedang aktif.
   * @param {boolean} enabled
   * @param {string|null} excludePart - bagian yang tidak di-disable
   */
  setButtonsEnabled(enabled, excludePart) {
    DOM.focusBtns.forEach(btn => {
      const isActive = btn.dataset.part === excludePart;
      // Tombol aktif selalu enabled; tombol lain ikut parameter
      btn.disabled = isActive ? false : !enabled;
      btn.classList.toggle("disabled", !isActive && !enabled);
    });
  }
};


// ┌─────────────────────────────────────────────────┐
// │  8. CAPTION CONTROLLER                           │
// └─────────────────────────────────────────────────┘

const CaptionController = {
  show(text) {
    const el = DOM.caption;
    el.style.opacity = "0";
    setTimeout(() => {
      el.textContent   = text;
      el.style.opacity = "1";
    }, 200);
  },
  clear() {
    DOM.caption.textContent = "";
  }
};


// ┌─────────────────────────────────────────────────┐
// │  9. PROGRESS CONTROLLER                          │
// └─────────────────────────────────────────────────┘

// FIX BUG 5 (progress): markExplored hanya dipanggil dari onEnded callback,
// TIDAK dari blok catch AudioManager.

const ProgressController = {

  markExplored(part) {
    if (STATE.exploredParts.has(part)) return;  // hindari duplikat
    STATE.exploredParts.add(part);
    this.updateDots();
    this.updateButton(part);
    this.checkQuizUnlock();
  },

  updateDots() {
    DOM.dots.forEach(dot => {
      const done = STATE.exploredParts.has(dot.dataset.part);
      dot.textContent = done ? "●" : "○";
      dot.classList.toggle("done", done);
    });
  },

  updateButton(part) {
    const btn = document.querySelector(`.focus-btn[data-part="${part}"]`);
    if (btn) btn.classList.add("done");
  },

  checkQuizUnlock() {
    const totalParts = Object.keys(MODEL_CONFIG).length;
    if (STATE.exploredParts.size >= totalParts) {
      DOM.quizBtn.disabled    = false;
      DOM.quizBtn.textContent = "🧠 Mulai Quiz";
    }
  }
};


// ┌─────────────────────────────────────────────────┐
// │  10. QUIZ CONTROLLER                             │
// └─────────────────────────────────────────────────┘

const QuizController = {
  start() {
    AudioManager.stop();
    window.location.href = CONFIG.quizPath;
  }
};


// ┌─────────────────────────────────────────────────┐
// │  11. DOM CACHE                                   │
// └─────────────────────────────────────────────────┘

const DOM = {
  loading      : document.getElementById("loading"),
  scene        : document.getElementById("ar-scene"),
  target       : document.querySelector("[mindar-image-target]"),
  model        : document.getElementById("model"),
  infoPanel    : document.getElementById("info-panel"),
  caption      : document.getElementById("caption"),
  quizBtn      : document.getElementById("quiz-btn"),

  closeInfo    : document.getElementById("close-info"),
  openInfo     : document.getElementById("open-info"),

  scaleControls: document.getElementById("scale-controls"),
  focusBtns    : document.querySelectorAll(".focus-btn"),
  dots         : document.querySelectorAll(".dot"),
  backBtn      : document.getElementById("back-btn")
};

// ┌─────────────────────────────────────────────────┐
// │  12. EVENT LISTENERS                             │
// └─────────────────────────────────────────────────┘

function initManagers() {

  // ── Back Button ──────────────────────────────────
  DOM.backBtn.addEventListener("click", () => {
    AudioManager.stop();
    history.back();
  });

  // ── Scale Controls ───────────────────────────────
  document.getElementById("scale-up")
    .addEventListener("click", () => ScaleController.up());
  document.getElementById("scale-down")
    .addEventListener("click", () => ScaleController.down());
  document.getElementById("scale-reset")
    .addEventListener("click", () => ScaleController.reset());

  // ── Focus Buttons ────────────────────────────────
  DOM.focusBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      // Jangan aktifkan kalau audio sedang jalan dan bukan tombol ini
      if (STATE.isPlaying && btn.dataset.part !== STATE.activePart) return;
      FocusController.activate(btn.dataset.part);
    });
  });

  // ── Quiz Button ───────────────────────────────────
  DOM.quizBtn.addEventListener("click", () => QuizController.start());

  // ── Info Panel Toggle ─────────────────────────────

DOM.closeInfo.addEventListener("click", () => {

    DOM.infoPanel.style.display = "none";

    DOM.openInfo.hidden = false;

});

DOM.openInfo.addEventListener("click", () => {

    DOM.infoPanel.style.display = "block";

    DOM.openInfo.hidden = true;

});

  // ── MindAR Target Events ─────────────────────────
  DOM.target.addEventListener("targetFound", () => {

    DOM.loading.style.display       = "none";

    DOM.infoPanel.style.display     = "block";

    DOM.scaleControls.style.display = "flex";

    DOM.openInfo.hidden = true;

    AudioManager.playIntro();

});

  // FIX BUG 7: Reset model saat marker hilang
DOM.target.addEventListener("targetLost", () => {

    DOM.infoPanel.style.display     = "none";

    DOM.scaleControls.style.display = "none";

    DOM.openInfo.hidden = true;

    AudioManager.stop();

    ModelController.reset();

    CaptionController.clear();

});

  // ── A-Frame Scene Events ─────────────────────────
  DOM.scene.addEventListener("arReady", () => {
    console.log("[AR] MindAR Ready");

    // Pastikan video kamera tidak tertutup canvas
    document.querySelectorAll("video").forEach(v => {
      Object.assign(v.style, {
        display   : "block",
        visibility: "visible",
        opacity   : "1",
        position  : "fixed",
        inset     : "0",
        width     : "100%",
        height    : "100%",
        objectFit : "cover",
        zIndex    : "0"
      });
    });
  });

  DOM.scene.addEventListener("arError", () => {
    DOM.loading.style.display = "block";
    const p = DOM.loading.querySelector("p");
    if (p) p.textContent =
      "AR error. Pastikan izin kamera aktif lalu muat ulang halaman.";
  });

  // ── Wake Lock: Cegah layar mati ──────────────────
  if ("wakeLock" in navigator) {
    navigator.wakeLock.request("screen").catch(console.warn);
  }
}


// ┌─────────────────────────────────────────────────┐
// │  BOOT                                            │
// └─────────────────────────────────────────────────┘
//
// Ganti CONFIG.jsonPath + MODEL_CONFIG untuk objek lain
// (Homo erectus, Pithecanthropus, dll.) — logika tidak berubah.
// ─────────────────────────────────────────────────────

loadFocusData();
