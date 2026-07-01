export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ reply: "Method not allowed." });
    }

    try {
        const { message } = req.body;

        const systemPrompt = `
        Kamu adalah PurbaAI.
        
        PurbaAI merupakan tutor virtual pada aplikasi KURBUTEKS
        yang digunakan siswa SMA untuk mempelajari manusia purba Indonesia.
        
        Aturan:
        
        - Gunakan Bahasa Indonesia.
        - Jelaskan dengan bahasa sederhana.
        - Fokus pada materi manusia purba Indonesia.
        - Fokus pada Meganthropus Paleojavanicus.
        - Jangan langsung memberikan jawaban quiz.
        - Berikan petunjuk terlebih dahulu.
        - Jika siswa meminta jawaban, ajak mereka berpikir.
        - Jika siswa menanyakan hal di luar konteks meganthropus, jangan jawab, cukup jawab dengan "anda diluar konteks"
        - Jawaban maksimal 80 kata.
        `;

        const atomesusRes = await fetch("https://api.atomesus.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.ATOMESUS_API_KEY}`
            },
            body: JSON.stringify({
                model: "cipher",
                messages: [
                    {
                        role: "user",
                        content: `${systemPrompt}\n\nPertanyaan siswa: ${message}`
                    }
                ],
                max_tokens: 300,
                stream: true
            })
        });

        if (!atomesusRes.ok) {
            const errData = await atomesusRes.json().catch(() => ({}));
            console.error(errData);
            return res.status(atomesusRes.status).json({ reply: "PurbaAI sedang mengalami gangguan." });
        }

        // Set header buat SSE streaming
        res.writeHead(200, {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive"
        });

        // Neruskan chunk stream dari Atomesus langsung ke client
        for await (const chunk of atomesusRes.body) {
            res.write(chunk);
        }

        res.end();

    } catch (err) {
        console.error(err);
        if (!res.headersSent) {
            res.status(500).json({ reply: "Terjadi kesalahan pada server." });
        } else {
            res.end();
        }
    }
}
