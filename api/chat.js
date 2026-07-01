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
        - Jawaban maksimal 100 kata.
        `;

        const response = await fetch("https://api.atomesus.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.ATOMESUS_API_KEY}`
            },
            body: JSON.stringify({
                model: "cipher",
                messages: [
                    // Atomesus mengabaikan role "system", jadi digabung ke "user"
                    {
                        role: "user",
                        content: `${systemPrompt}\n\nPertanyaan siswa: ${message}`
                    }
                ]
            })
        });

        const data = await response.json();
        console.log("STATUS =", response.status);
        console.log("DATA =", JSON.stringify(data, null, 2));

        if (!response.ok) {
            console.error(data);
            // Tangani error spesifik Atomesus
            if (data?.error?.code === "insufficient_credits") {
                return res.status(402).json({ reply: "Kredit PurbaAI habis, hubungi admin." });
            }
            return res.status(response.status).json({ reply: "PurbaAI sedang mengalami gangguan." });
        }

        const reply = data.choices?.[0]?.message?.content ?? "PurbaAI tidak dapat memberikan jawaban.";

        return res.status(200).json({ reply });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ reply: "Terjadi kesalahan pada server." });
    }
}
