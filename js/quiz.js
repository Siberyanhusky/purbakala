let quiz = [];

let current = 0;
let score = 0;
let selected = null;
let userAnswers = [];

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

const reviewList=document.getElementById("review-list");

const askAI=document.getElementById("ask-ai");

async function loadQuiz(){

    const res = await fetch("../assets/data/meganthropus.json");

    const data = await res.json();

    quiz = data.quiz;

    total.textContent = quiz.length;

}

document.getElementById("start-btn").onclick = async ()=>{

    if(quiz.length===0){

        await loadQuiz();

    }

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
  
userAnswers[current]=index;
  
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

    if(reviewList){

        reviewList.innerHTML="";

        quiz.forEach((q,index)=>{

            const benar=userAnswers[index]===q.answer;

            reviewList.innerHTML+=`

            <div class="review-item">

                <h4>${benar?"✅":"❌"} Soal ${index+1}</h4>

                <p><b>${q.question}</b></p>

                <p>Jawaban Anda :
                ${q.options[userAnswers[index]]}</p>

               <p><strong>Jawaban Anda:</strong><br>
                ${q.options[userAnswers[index]]}</p>
                
                ${benar
                ? "<p style='color:green;'>✔ Jawaban Anda benar.</p>"
                : `
                <p style='color:#d97706;'>⚠ Jawaban Anda masih kurang tepat.</p>
                
                <button
                class="ask-ai-btn"
                data-question="${index}">
                
                🤖 Tanya PurbaAI
                
                </button>
                `
                }

                <hr>

            </div>

            `;

        });

    }

}

if(askAI){

    askAI.onclick=()=>{

        alert("PurbaAI akan segera tersedia.");

    };

}
