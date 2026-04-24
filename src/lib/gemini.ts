import { puter } from '@heyputer/puter.js';

const PROMPT_TEMPLATE = `Anda adalah seorang Ahli Kurikulum dan Guru Penggerak bersertifikasi dari Kemendikbudristek Indonesia.
Tugas Anda adalah merancang Rencana Pelaksanaan Pembelajaran (RPP) atau Modul Ajar yang sangat detail, profesional, mutakhir, dan berstandar nasional.
Output HARUS BERUPA HTML SAJA. Jangan menggunakan tag <html>, <head>, atau <body>, cukup berikan HTML konten menggunakan tag dasar seperti <div>, <h2>, <h3>, <table>, <ul>, <ol>, dll.`;

export async function generateRPP(data: any) {
  console.log("Starting RPP generation process...");
  try {
    // Primary method: Use Puter.ai (Free & Unlimited)
    try {
      if (!puter) throw new Error("Puter SDK not found");


      const inputText = Object.entries(data)
        .filter(([_, value]) => value !== undefined && value !== "")
        .map(([key, value]) => '- ' + key + ': ' + value)
        .join("\n");
        
      const fullPrompt = `${PROMPT_TEMPLATE}\n\nBerikut adalah data RPP yang diinput oleh guru:\n${inputText}`;

      console.log("Attempting generation via Puter.ai (gemini-2.0-flash)...");
      const response = await puterObj.ai.chat(fullPrompt, { 
        model: 'gemini-2.0-flash' // Some SDK versions prefer just the name
      });
      
      console.log("Puter.ai raw response received.");
      let rawHtml = response.message?.content || "";
      rawHtml = rawHtml.replace(/```html/g, "").replace(/```/g, "").trim();
      
      if (rawHtml) {
        console.log("Generation via Puter.ai successful!");
        return rawHtml;
      }
      console.warn("Puter.ai returned empty content.");
    } catch (puterError: any) {
      console.error("Puter.ai failed:", puterError.message || puterError);
      console.log("Falling back to server API...");
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



