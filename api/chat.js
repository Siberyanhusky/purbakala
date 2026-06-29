export default async function handler(req, res) {

    if (req.method !== "POST") {
        return res.status(405).json({
            reply: "Method not allowed."
        });
    }

    try {

        const { message } = req.body;

        console.log(process.env.DAHONO_API_KEY);

        const response = await fetch(
            "https://gateway.dahono.com/v1/chat/completions",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${process.env.DAHONO_API_KEY}`
                },

                body: JSON.stringify({

                    model: "dahono/ai-chat",

                    messages: [

                        {
                            role: "system",
                            content: `
Kamu adalah PurbaAI.

Kamu adalah tutor virtual pada aplikasi KURBUTEKS.

Aturan:

- Selalu gunakan Bahasa Indonesia.
- Fokus pada manusia purba Indonesia.
- Fokus pada materi sejarah prasejarah.
- Jangan langsung membocorkan jawaban quiz.
- Berikan petunjuk sedikit demi sedikit.
- Jika siswa meminta jawaban quiz secara langsung, arahkan dengan pertanyaan balik.
- Jawab singkat, jelas, dan mudah dipahami siswa SMA.
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

            return res.status(response.status).json({
                reply: "PurbaAI sedang mengalami gangguan."
            });

        }

        return res.status(200).json({

            reply: JSON.stringify(data)
        
        });

    }

    catch (err) {

        console.error(err);

        return res.status(500).json({

            reply: "Terjadi kesalahan pada server."

        });

    }

}
