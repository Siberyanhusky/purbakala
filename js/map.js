const marker = document.getElementById("marker");
const card = document.getElementById("card");
const startLearning = document.getElementById("startLearning");

// Klik marker
marker.addEventListener("click", () => {

    card.classList.add("show");

});

// Klik di luar card untuk menutup
document.addEventListener("click", (e) => {

    if (
        !card.contains(e.target) &&
        e.target !== marker
    ) {

        card.classList.remove("show");

    }

});

// Tombol Mulai Belajar
startLearning.addEventListener("click", () => {

    window.location.href="../materi/";

});
