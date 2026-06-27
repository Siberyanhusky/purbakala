// =====================================================
// ELEMENT
// =====================================================

const loading = document.getElementById("loading");


// =====================================================
// SCENE
// =====================================================

const scene = document.querySelector("a-scene");

const target = document.querySelector("[mindar-image-target]");


// =====================================================
// BACK BUTTON
// =====================================================

const backButton = document.createElement("button");

backButton.className = "back-button";

backButton.innerHTML = "← Kembali";

document.body.appendChild(backButton);

backButton.addEventListener("click",()=>{

    history.back();

});


// =====================================================
// AUDIO BUTTON
// =====================================================

const audioButton = document.createElement("button");

audioButton.className = "floating-button";

audioButton.innerHTML = "🎧";

audioButton.style.right = "20px";

audioButton.style.bottom = "100px";

document.body.appendChild(audioButton);

audioButton.addEventListener("click",()=>{

    alert("Narasi akan diputar pada AR V2.");

});


// =====================================================
// QUIZ BUTTON
// =====================================================

const quizButton = document.createElement("button");

quizButton.className = "floating-button";

quizButton.innerHTML = "❓";

quizButton.style.right = "20px";

quizButton.style.bottom = "25px";

document.body.appendChild(quizButton);

quizButton.addEventListener("click",()=>{

    window.location.href="../quiz/";

});


// =====================================================
// INFO PANEL
// =====================================================

const info = document.createElement("div");

info.className="bottom-info";

info.style.display="none";

info.innerHTML=`

<h3>Meganthropus Paleojavanicus</h3>

<p>

Objek berhasil dikenali.

Putar perangkat Anda untuk melihat model dari berbagai sisi.

</p>

`;

document.body.appendChild(info);


// =====================================================
// TARGET EVENTS
// =====================================================

target.addEventListener("targetFound",()=>{

    console.log("Marker ditemukan");

    loading.style.display="none";

    info.style.display="block";

});


target.addEventListener("targetLost",()=>{

    console.log("Marker hilang");

    info.style.display="none";

});


// =====================================================
// SCENE EVENTS
// =====================================================

scene.addEventListener("loaded",()=>{

    console.log("MindAR Ready");

});


// =====================================================
// PREVENT SCREEN SLEEP (opsional)
// =====================================================

if("wakeLock" in navigator){

    let wakeLock=null;

    async function requestWakeLock(){

        try{

            wakeLock=await navigator.wakeLock.request("screen");

        }

        catch(err){

            console.log(err);

        }

    }

    requestWakeLock();

}
