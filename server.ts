import express from "express";
import dotenv from "dotenv";
dotenv.config({ override: true });
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROMPT_TEMPLATE = `Anda adalah seorang Ahli Kurikulum dan Guru Penggerak bersertifikasi dari Kemendikbudristek Indonesia.
Tugas Anda adalah merancang Rencana Pelaksanaan Pembelajaran (RPP) atau Modul Ajar yang sangat detail, profesional, mutakhir, dan berstandar nasional, siap digunakan langsung oleh guru untuk keperluan akreditasi, supervisi, dan proses Kegiatan Belajar Mengajar (KBM) yang sebenarnya.
Gunakan Bahasa Indonesia formal (EYD), susunan kalimat yang jelas, dan gaya bahasa instruksional tingkat lanjut.

Berikut adalah data RPP yang diinput oleh guru:
{DATA_INPUT}

ATURAN STRUKTUR DOKUMEN:
Jika Kurikulum yang dipilih adalah K13, wajib gunakan struktur ini (Sangat Rinci):
A. Identitas RPP (Nama sekolah, Mata pelajaran, Kelas/smt, Materi pokok, Alokasi waktu, Tahun ajaran)
B. Kompetensi Dasar (KD) dan Indikator Pencapaian Kompetensi (IPK)
C. Tujuan Pembelajaran (jelas, terukur, realistis, gunakan kaidah ABCD - Audience, Behavior, Condition, Degree)
D. Materi / Bahan Ajar Pembelajaran (Ringkasan/poin utama secara sangat detail dan mendalam)
E. Metode Pembelajaran (Sebutkan Pendekatan, Model, dan Metode dengan spesifik)
F. Media, Alat, dan Sumber Belajar
G. Langkah-Langkah Pembelajaran (Gunakan tabel detail. Bagi menjadi: 1. Pendahuluan, 2. Kegiatan Inti, 3. Penutup. Sertakan Sintaks Model Pembelajaran, Aktivitas Guru, Aktivitas Peserta Didik secara terpisah, Nilai Karakter/Literasi/4C, Estimasi Waktu, dan Output Per Menit)
H. Penilaian (1. Sikap observasi, 2. Pengetahuan HOTS, 3. Keterampilan unjuk kerja, lengkapi dengan instrumen detail, kisi-kisi, soal pilihan ganda & essay HOTS, rubrik, dan skoring)
I. Remedial dan Pengayaan (Sangat detail dan implementatif)
J. Bagian Tanda Tangan (Mengetahui: Kepala Sekolah di kiri, Guru Mata Pelajaran di kanan; cantumkan Nama dan NIP jika ada)

Jika Kurikulum yang dipilih adalah Kurikulum Merdeka, wajib gunakan struktur ini (Modul Ajar Sangat Detail):
A. Informasi Umum (Satuan pendidikan, Nama guru, Jenjang/kelas/fase, Mata pelajaran, Topik, Alokasi waktu, Tahun ajaran otomatis terisi dari input guru)
B. Capaian Pembelajaran (CP) dan Alur Tujuan Pembelajaran (ATP)
C. Tujuan Pembelajaran (Sangat spesifik dan kontekstual)
D. Pemahaman Bermakna (Mendalam)
E. Pertanyaan Pemantik (HOTS)
F. Profil Pelajar Pancasila (Jelaskan setiap dimensi yang relevan)
G. Sarana, Prasarana, dan Media Pembelajaran (Lingkungan belajar, alat pendukung)
H. Target Peserta Didik & Model/Metode Pembelajaran
I. Langkah Kegiatan Pembelajaran (Gunakan tabel detail: 1. Pendahuluan, 2. Inti, 3. Penutup. Jabarkan tindakan eksplisit untuk diferensiasi konten/proses/produk jika ada, dan pembabakan waktu rinci)
J. Rencana Asesmen (Asesmen Diagnostik/Awal, Formatif, Sumatif. Berikan contoh rubrik penilaian holistik, instrumen tertulis, checklist lembar observasi)
K. Pengayaan dan Remedial
L. Refleksi Guru dan Peserta Didik
M. Lampiran (Bahan Bacaan Guru dan Peserta Didik, Glosarium terperinci, Daftar Pustaka Lengkap)
N. Bagian Tanda Tangan (Mengetahui: Kepala Sekolah di kiri, Guru Mata Pelajaran di kanan; cantumkan Nama dan NIP)

PENTING:
- Buat isi setiap poin SANGAT PANJANG, RINCI, DAN PROFESIONAL SEKALI. Jangan tinggalkan placeholder kosong jika bisa diinferensi. Berikan contoh soal HOTS sungguhan. Berikan panduan penilaian sungguhan.
- Output HARUS BERUPA HTML SAJA. Jangan menggunakan tag <html>, <head>, atau <body>, cukup berikan HTML konten menggunakan tag dasar seperti <div>, <h2>, <h3>, <table>, <ul>, <ol>, dll.
- JANGAN sertakan tag pembuka dan penutup html.
- Desain HTML yang dikembalikan harus sangat rapi untuk dicetak. Berikan inline CSS pada tabel agar memiliki border solid (<table style="border-collapse: collapse; width: 100%; table-layout: fixed; word-wrap: break-word; overflow-wrap: break-word;" border="1"> dan <td style="padding: 8px; word-wrap: break-word; overflow-wrap: break-word; vertical-align: top;">).
- Gunakan perataan teks justified (<p style="text-align: justify;">).
- PASTIKAN ANDA MENGHASILKAN DOKUMEN SECARA LENGKAP DARI AWAL HINGGA BAGIAN TANDA TANGAN TANPA KEPOTONG/TERPOTONG. JANGAN menyingkat atau memotong kalimat.
`;

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));

  // API Route for generating RPP
  app.post("/api/generate", async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY environment variable is missing on the server" });
      }

      const { data } = req.body;
      if (!data) {
        return res.status(400).json({ error: "Data is required" });
      }

      const inputText = Object.entries(data)
        .filter(([_, value]) => value !== undefined && value !== "")
        .map(([key, value]) => '- ' + key + ': ' + value)
        .join("\n");
        
      const prompt = PROMPT_TEMPLATE.replace("{DATA_INPUT}", inputText);

      console.log("Generating RPP via /api/generate (using ai.models.generateContent)");
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({

        model: "gemini-2.0-flash",

        contents: prompt,
        config: {
          temperature: 0.7,
          maxOutputTokens: 8192,
        },
      });

      const responseText = response.text || "";
      res.json({ text: responseText });


    } catch (error: any) {
      console.error("API error details:", JSON.stringify(error, null, 2));
      console.error("API error message:", error.message);
      
      let errMsg = error.message || "Failed to generate RPP";

      // Attempt Fallback to OpenAI if Gemini fails with Quota or other issues
      const openAIKey = process.env.OPENAI_API_KEY;
      if (openAIKey && openAIKey !== "MY_OPENAI_API_KEY") {
        console.log("Gemini failed, attempting fallback to OpenAI...");
        try {
          const openai = new OpenAI({ apiKey: openAIKey });
          const { data } = req.body;
          const inputText = Object.entries(data)
            .filter(([_, value]) => value !== undefined && value !== "")
            .map(([key, value]) => '- ' + key + ': ' + value)
            .join("\n");
          const prompt = PROMPT_TEMPLATE.replace("{DATA_INPUT}", inputText);

          const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
              { role: "system", content: "You are an expert curriculum designer." },
              { role: "user", content: prompt }
            ],
          });

          const responseText = completion.choices[0].message.content || "";
          console.log("OpenAI fallback successful");
          return res.json({ text: responseText });
        } catch (openaiError: any) {
          console.error("OpenAI Fallback also failed:", openaiError.message);
        }
      }

      if (errMsg.includes("API key not valid") || errMsg.includes("API_KEY_INVALID")) {
        errMsg = "API Key Gemini tidak valid! Silakan periksa file .env Anda.";
      } else if (errMsg.includes("429") || errMsg.includes("quota")) {
        errMsg = "Quota Gemini habis. Mohon masukkan API Key OpenAI yang valid di file .env untuk menggunakan fallback otomatis.";
      }
      
      res.status(500).json({ error: errMsg });
    }

  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // Support React Router HTML5 History
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
