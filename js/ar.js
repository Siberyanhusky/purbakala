// =====================================================
// DATA FOCUS — caption tiap bagian
// (Kalau meganthropus.json sudah siap, ganti ini dengan fetch)
// =====================================================
const FOCUS_DATA = {
  kepala: {
    caption : "Kepala Meganthropus berukuran besar dengan tengkorak yang tebal dan kokoh, menandakan otot rahang yang sangat kuat.",
    rotation: "0 0 0",
    scale   : 0.7
  },
  rahang: {
    caption : "Rahang Meganthropus adalah yang terbesar di antara manusia purba, diperkirakan mampu mengunyah makanan keras seperti umbi dan biji.",
    rotation: "20 0 0",
    scale   : 0.7
  },
  badan: {
    caption : "Badan Meganthropus tegap dan berotot, diperkirakan tingginya mencapai 1,8 meter — jauh lebih besar dari Homo erectus.",
    rotation: "0 0 0",
    scale   : 0.5
  },
  lengan: {
    caption : "Lengan Meganthropus panjang dan kuat, membantu aktivitas mengumpulkan makanan di hutan tropis Jawa purba.",
    rotation: "-10 30 0",
    scale   : 0.5
  },
  kaki: {
    caption : "Kaki Meganthropus sudah tegak lurus, menunjukkan kemampuan berjalan bipedal meski tubuhnya jauh lebih besar.",
    rotation: "-20 0 0",
    scale   : 0.5
  }
};

// =====================================================
// ELEMEN
// =====================================================
const loadingEl     = document.getElementById("loading");
const sceneEl       = document.getElementById("ar-scene");
const targetEl      = document.querySelector("[mindar-image-target]");
const modelEl       = document.getElementById("model");
const infoPanelEl   = document.getElementById("info-panel");
const captionEl     = document.getElementById("caption");
const quizBtnEl     = document.getElementById("quiz-btn");
const scaleControls = document.getElementById("scale-controls");
const focusBtns     = document.querySelectorAll(".focus-btn");
const dots          = document.querySelectorAll(".dot");
const backBtn       = document.getElementById("back-btn");

// =====================================================
// STATE
// =====================================================
const DEFAULT_SCALE    = 0.5;
const SCALE_STEP       = 0.1;
const SCALE_MIN        = 0.2;
const SCALE_MAX        = 1.5;

let currentScale       = DEFAULT_SCALE;
let currentAudio       = null;
let exploredParts      = new Set();
let activePart         = null;

// =====================================================
// BACK BUTTON
// =====================================================
backBtn.addEventListener("click", () => {
  stopAudio();
  history.back();
});

// =====================================================
// SCALE CONTROLS
// =====================================================
document.getElementById("scale-up").addEventListener("click", () => {
  currentScale = Math.min(currentScale + SCALE_STEP, SCALE_MAX);
  applyScale();
});

document.getElementById("scale-down").addEventListener("click", () => {
  currentScale = Math.max(currentScale - SCALE_STEP, SCALE_MIN);
  applyScale();
});

document.getElementById("scale-reset").addEventListener("click", () => {
  currentScale = DEFAULT_SCALE;
  applyScale();
});

function applyScale() {
  modelEl.setAttribute("scale", `${currentScale} ${currentScale} ${currentScale}`);
}

// =====================================================
// AUDIO
// =====================================================
function stopAudio() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
}

function playAudio(part) {
  stopAudio();
  const el = document.getElementById("audio-" + part);
  if (!el) return;
  currentAudio = el;
  el.play().catch(err => console.warn("Audio gagal:", err));
}

// =====================================================
// FOCUS MODE
// =====================================================
focusBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    const part = btn.dataset.part;
    activateFocus(part);
  });
});

function activateFocus(part) {
  const data = FOCUS_DATA[part];
  if (!data) return;

  activePart = part;

  // 1. Highlight tombol aktif
  focusBtns.forEach(b => b.classList.toggle("active", b.dataset.part === part));

  // 2. Rotate & zoom model
  modelEl.setAttribute("rotation", data.rotation);
  currentScale = data.scale;
  applyScale();

  // 3. Audio otomatis
  playAudio(part);

  // 4. Caption
  captionEl.style.opacity = "0";
  setTimeout(() => {
    captionEl.textContent  = data.caption;
    captionEl.style.opacity = "1";
  }, 200);

  // 5. Progress
  exploredParts.add(part);
  updateProgress();

  // 6. Tandai tombol sebagai done
  const btn = document.querySelector(`.focus-btn[data-part="${part}"]`);
  if (btn) btn.classList.add("done");
}

// =====================================================
// PROGRESS DOTS
// =====================================================
function updateProgress() {
  dots.forEach(dot => {
    if (exploredParts.has(dot.dataset.part)) {
      dot.textContent = "●";
      dot.classList.add("done");
    }
  });

  // Unlock quiz kalau semua 5 bagian sudah dijelajahi
  if (exploredParts.size >= 5) {
    quizBtnEl.disabled     = false;
    quizBtnEl.textContent  = "🧠 Mulai Quiz";
  }
}

// =====================================================
// QUIZ BUTTON
// =====================================================
quizBtnEl.addEventListener("click", () => {
  stopAudio();
  window.location.href = "../quiz/";
});

// =====================================================
// TARGET EVENTS — marker ditemukan / hilang
// =====================================================
targetEl.addEventListener("targetFound", () => {
  loadingEl.style.display    = "none";
  infoPanelEl.style.display  = "block";
  scaleControls.style.display = "flex";

  // Play intro sekali saat pertama kali marker ditemukan
  const introAudio = document.getElementById("audio-intro");
  if (introAudio && !introAudio.dataset.played) {
    introAudio.dataset.played = "1";
    introAudio.play().catch(() => {});
  }
});

targetEl.addEventListener("targetLost", () => {
  infoPanelEl.style.display   = "none";
  scaleControls.style.display = "none";
  stopAudio();
});

// =====================================================
// SCENE EVENTS
// =====================================================
sceneEl.addEventListener("arReady", () => {
  console.log("MindAR Ready");

  // Paksa video kamera tetap tampil
  document.querySelectorAll("video").forEach(v => {
    v.style.cssText = [
      "display:block!important",
      "visibility:visible!important",
      "opacity:1!important",
      "position:fixed!important",
      "inset:0!important",
      "width:100%!important",
      "height:100%!important",
      "object-fit:cover!important",
      "z-index:0!important"
    ].join(";");
  });
});

sceneEl.addEventListener("arError", () => {
  loadingEl.style.display = "block";
  loadingEl.querySelector("p").textContent =
    "AR error. Pastikan izin kamera aktif lalu muat ulang halaman.";
});

// =====================================================
// PREVENT SCREEN SLEEP
// =====================================================
if ("wakeLock" in navigator) {
  navigator.wakeLock.request("screen").catch(console.warn);
}

// =====================================================
// OPTIONAL: Load caption dari JSON eksternal
// Uncomment kalau meganthropus.json sudah siap
// =====================================================
// fetch("../assets/data/meganthropus.json")
//   .then(r => r.json())
//   .then(data => {
//     Object.assign(FOCUS_DATA, data);
//   })
//   .catch(console.warn);
