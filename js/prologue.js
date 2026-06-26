const video = document.getElementById("introVideo");

const playBtn = document.getElementById("playBtn");

const cover = document.getElementById("cover");

const overlay = document.getElementById("overlay");

const skipBtn = document.getElementById("skipBtn");

const startBtn = document.getElementById("startBtn");

playBtn.onclick = () =>{

    cover.classList.add("hide");

    video.play();

}

video.onended = ()=>{

    overlay.classList.add("show");

}

skipBtn.onclick = ()=>{

    video.pause();

    video.currentTime = video.duration;

    overlay.classList.add("show");

}

startBtn.onclick = ()=>{

    window.location.href="../map/index.html";

}
