const quiz = [

{

question:"Bagian tubuh Meganthropus yang memiliki struktur paling kuat adalah...",

options:[

"Rahang",

"Lengan",

"Kaki",

"Punggung"

],

answer:0

},

{

question:"Fungsi rahang Meganthropus diperkirakan untuk...",

options:[

"Mengunyah makanan keras",

"Berbicara",

"Berlari",

"Memanjat"

],

answer:0

},

{

question:"Tubuh Meganthropus memiliki ciri...",

options:[

"Tegap dan kekar",

"Kecil",

"Pendek",

"Langsing"

],

answer:0

},

{

question:"Lengan Meganthropus menunjukkan bahwa ia memiliki...",

options:[

"Kekuatan fisik",

"Sayap",

"Sirip",

"Ekor"

],

answer:0

},

{

question:"Kaki Meganthropus berfungsi untuk...",

options:[

"Berjalan tegak",

"Terbang",

"Berenang",

"Melompat di pohon"

],

answer:0

}

];

let current=0;

let score=0;

let selected=null;

const intro=document.getElementById("intro-screen");

const quizScreen=document.getElementById("quiz-screen");

const result=document.getElementById("result-screen");

const question=document.getElementById("question");

const options=document.getElementById("options");

const next=document.getElementById("next-btn");

const progress=document.getElementById("progress-bar");

const qNumber=document.getElementById("question-number");

const total=document.getElementById("total-question");

const scoreCircle=document.getElementById("score-circle");

const scoreText=document.getElementById("score-text");

const resultMessage=document.getElementById("result-message");

total.textContent=quiz.length;

document.getElementById("start-btn").onclick=()=>{

intro.classList.add("hidden");

quizScreen.classList.remove("hidden");

render();

};

function render(){

selected=null;

next.disabled=true;

qNumber.textContent=current+1;

progress.style.width=((current+1)/quiz.length)*100+"%";

question.textContent=quiz[current].question;

options.innerHTML="";

quiz[current].options.forEach((opt,index)=>{

const btn=document.createElement("button");

btn.className="option";

btn.textContent=opt;

btn.onclick=()=>{

document.querySelectorAll(".option").forEach(x=>x.classList.remove("selected"));

btn.classList.add("selected");

selected=index;

next.disabled=false;

};

options.appendChild(btn);

});

}

next.onclick=()=>{

if(selected===quiz[current].answer){

score++;

}

current++;

if(current<quiz.length){

render();

}else{

finish();

}

};

function finish(){

quizScreen.classList.add("hidden");

result.classList.remove("hidden");

const nilai=Math.round(score/quiz.length*100);

scoreCircle.textContent=nilai;

scoreText.textContent="Nilai : "+nilai;

if(nilai===100){

resultMessage.textContent="Luar biasa! Semua jawaban benar.";

}

else if(nilai>=80){

resultMessage.textContent="Bagus! Pemahaman Anda sudah sangat baik.";

}

else if(nilai>=60){

resultMessage.textContent="Cukup baik. Pelajari kembali materi AR.";

}

else{

resultMessage.textContent="Silakan pelajari kembali materi sebelum mengulang quiz.";

}

}

document.getElementById("retry-btn").onclick=()=>{

location.reload();

};

document.getElementById("finish-btn").onclick=()=>{

window.location.href="../";

};

document.getElementById("back-btn").onclick=()=>{

history.back();

};
