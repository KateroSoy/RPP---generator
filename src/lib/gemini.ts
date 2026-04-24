export async function generateRPP(data: any) {
  try {
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




