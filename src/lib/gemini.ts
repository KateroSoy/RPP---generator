import { puter } from '@heyputer/puter.js';

const PROMPT_TEMPLATE = `Anda adalah seorang Ahli Kurikulum dan Guru Penggerak bersertifikasi dari Kemendikbudristek Indonesia.
Tugas Anda adalah merancang Rencana Pelaksanaan Pembelajaran (RPP) atau Modul Ajar yang sangat detail, profesional, mutakhir, dan berstandar nasional.
Output HARUS BERUPA HTML SAJA. Jangan menggunakan tag <html>, <head>, atau <body>, cukup berikan HTML konten menggunakan tag dasar seperti <div>, <h2>, <h3>, <table>, <ul>, <ol>, dll.`;

export async function generateRPP(data: any) {
  try {
    // Primary method: Use Puter.ai (Free & Unlimited)
    try {
      const inputText = Object.entries(data)
        .filter(([_, value]) => value !== undefined && value !== "")
        .map(([key, value]) => '- ' + key + ': ' + value)
        .join("\n");
        
      const fullPrompt = `${PROMPT_TEMPLATE}\n\nBerikut adalah data RPP yang diinput oleh guru:\n${inputText}`;

      console.log("Attempting generation via Puter.ai...");
      const response = await puter.ai.chat(fullPrompt, { 
        model: 'google/gemini-2.0-flash' 
      });
      
      let rawHtml = response.message.content || "";
      rawHtml = rawHtml.replace(/```html/g, "").replace(/```/g, "").trim();
      
      if (rawHtml) {
        console.log("Generation via Puter.ai successful!");
        return rawHtml;
      }
    } catch (puterError) {
      console.warn("Puter.ai failed, falling back to server API...", puterError);
    }

    // Fallback method: Use our own API server
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ data })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Gagal membuat RPP dari server.");
    }

    const json = await response.json();
    let rawHtml = json.text || "";
    
    rawHtml = rawHtml.replace(/```html/g, "").replace(/```/g, "").trim();
    return rawHtml;
  } catch (error: any) {
    console.error("Generate RPP Error:", error);
    if (error instanceof Error && error.message) {
      throw new Error(error.message);
    }
    throw new Error("Gagal membuat RPP, silakan coba lagi.");
  }
}



