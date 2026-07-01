export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ reply: "Method not allowed." });
    }

    try {
        const { message } = req.body;

        const response = await fetch("https://gateway.dahono.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.DAHONO_API_KEY}`
            },
            body: JSON.stringify({
                model: "dahono/claude-sonnet-4.5-free",
                messages: [
                    {
                        role: "system",
                        content: `
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
                        - Jawaban maksimal 200 kata.
                        `
                    },
                    {
                        role: "user",
                        content: message
                    }
                ]
            })
        });

        const data = await response.json();
        console.log("STATUS =", response.status);
        console.log("DATA =", JSON.stringify(data, null, 2));

        if (!response.ok) {
            console.error(data);
            return res.status(response.status).json({ reply: "PurbaAI sedang mengalami gangguan." });
        }

        // ✅ Extract teks balasan dari struktur OpenAI-compatible response
        const reply = data.choices?.[0]?.message?.content ?? "PurbaAI tidak dapat memberikan jawaban.";

        return res.status(200).json({ reply });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ reply: "Terjadi kesalahan pada server." });
    }
}
