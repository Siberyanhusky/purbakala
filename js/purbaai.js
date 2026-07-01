// =====================================================
// PURBA AI
// =====================================================

const overlay = document.getElementById("purba-overlay");
const closeBtn = document.getElementById("purba-close");
const sendBtn = document.getElementById("purba-send");
const chatBox = document.getElementById("purba-chat");
const input = document.getElementById("purba-message");

// =====================================================
// OPEN
// =====================================================

function openPurbaAI(context = "") {

    overlay.classList.add("active");

    if (chatBox.children.length === 0) {

        appendAI(
`Halo! 👋

Saya adalah PurbaAI.

Saya dapat membantu Anda memahami materi manusia purba, prasejarah Indonesia, serta menjelaskan bagian-bagian Meganthropus.

Silakan ajukan pertanyaan.`);

    }

    if (context !== "") {

        input.value = context;

        input.focus();

    }

}

// =====================================================
// CLOSE
// =====================================================

function closePurbaAI() {

    overlay.classList.remove("active");

}

closeBtn.addEventListener("click", closePurbaAI);

overlay.addEventListener("click", e => {

    if (e.target === overlay) {

        closePurbaAI();

    }

});

// =====================================================
// MESSAGE
// =====================================================

function appendUser(text) {

    const div = document.createElement("div");

    div.className = "message user";

    div.textContent = text;

    chatBox.appendChild(div);

    scrollBottom();

}

function appendAI(text) {

    const div = document.createElement("div");

    div.className = "message ai";

    div.textContent = text;

    chatBox.appendChild(div);

    scrollBottom();

}

// =====================================================
// TYPING
// =====================================================

function showTyping() {

    const typing = document.createElement("div");

    typing.className = "typing";

    typing.id = "typing";

    typing.innerHTML = `

        <span></span>

        <span></span>

        <span></span>

    `;

    chatBox.appendChild(typing);

    scrollBottom();

}

function hideTyping() {

    const typing = document.getElementById("typing");

    if (typing) typing.remove();

}

// =====================================================
// SEND
// =====================================================

async function sendMessage() {

    const message = input.value.trim();

    if (!message) return;

    appendUser(message);

    input.value = "";

    showTyping();

    // Bikin bubble AI kosong yang bakal diisi progresif
    const aiDiv = document.createElement("div");
    aiDiv.className = "message ai";
    let aiText = "";

    try {
        const res = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message })
        });

        if (!res.ok || !res.body) {
            throw new Error("Response gagal");
        }

        hideTyping();
        chatBox.appendChild(aiDiv);

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            // SSE format: baris dipisah "\n\n", tiap baris data mulai "data: "
            const lines = buffer.split("\n");
            buffer = lines.pop(); // sisa baris belum lengkap, simpan buat next loop

            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed.startsWith("data:")) continue;

                const payload = trimmed.replace("data:", "").trim();
                if (payload === "[DONE]") continue;

                try {
                    const json = JSON.parse(payload);
                    const delta = json.choices?.[0]?.delta?.content;
                    if (delta) {
                        aiText += delta;
                        aiDiv.textContent = aiText;
                        scrollBottom();
                    }
                } catch (e) {
                    // chunk belum lengkap, skip
                }
            }
        }

        if (!aiText) {
            aiDiv.textContent = "PurbaAI tidak dapat memberikan jawaban.";
        }

    } catch (err) {
        hideTyping();
        if (!aiDiv.textContent) {
            aiDiv.textContent = "PurbaAI sedang tidak dapat dihubungi.";
            chatBox.appendChild(aiDiv);
        }
        scrollBottom();
    }
}

// =====================================================
// EVENT
// =====================================================

sendBtn.addEventListener("click", sendMessage);

input.addEventListener("keydown",(e)=>{

    if(e.key==="Enter" && !e.shiftKey){

        e.preventDefault();

        sendMessage();

    }

});

// =====================================================
// SCROLL
// =====================================================

function scrollBottom(){

    chatBox.scrollTop=chatBox.scrollHeight;

}

// =====================================================
// GLOBAL
// =====================================================

window.openPurbaAI=openPurbaAI;
