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
      const openRouterKey = process.env.OPENROUTER_API_KEY;
      const { data } = req.body;
      if (!data) return res.status(400).json({ error: "Data is required" });

      const inputText = Object.entries(data)
        .filter(([_, value]) => value !== undefined && value !== "")
        .map(([key, value]) => '- ' + key + ': ' + value)
        .join("\n");
        
      const prompt = PROMPT_TEMPLATE.replace("{DATA_INPUT}", inputText);

      // --- PRIMARY: OPENROUTER ---
      if (openRouterKey && openRouterKey !== "YOUR_OPENROUTER_KEY") {
        console.log("Generating RPP via OpenRouter...");
        try {
          const openai = new OpenAI({
            baseURL: "https://openrouter.ai/api/v1",
            apiKey: openRouterKey,
            defaultHeaders: {
              "HTTP-Referer": process.env.APP_URL || "http://localhost:3000",
              "X-Title": "RPP Generator",
            }
          });

          const completion = await openai.chat.completions.create({
            model: "google/gemini-2.0-flash-001", // Stable model ID on OpenRouter
            messages: [
              { role: "user", content: prompt }
            ],
          });

          const responseText = completion.choices[0].message.content || "";
          return res.json({ text: responseText });
        } catch (orError: any) {
          console.error("OpenRouter failed:", orError.message);
          // fall through to Gemini
        }
      }

      // --- SECONDARY: GEMINI DIRECT ---
      const apiKeys = (process.env.GEMINI_API_KEY || "").split(",").map(k => k.trim()).filter(k => k);
      if (apiKeys.length > 0) {
        for (const apiKey of apiKeys) {
          try {
            console.log(`Generating RPP via Gemini Direct (key: ${apiKey.substring(0, 8)}...)`);
            const ai = new GoogleGenAI({ apiKey });
            const response = await ai.models.generateContent({
              model: "gemini-2.0-flash",
              contents: prompt,
              config: { temperature: 0.7, maxOutputTokens: 8192 },
            });
            return res.json({ text: response.text || "" });
          } catch (error: any) {
            console.error(`Gemini Key failed:`, error.message);
          }
        }
      }

      throw new Error("All AI services failed or were not configured.");

    } catch (error: any) {
      console.error("Critical API error:", error.message);
      res.status(500).json({ error: error.message || "Failed to generate RPP" });
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
