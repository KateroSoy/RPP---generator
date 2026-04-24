import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Ensure the ID exists, used for PDF export wrapper
export function exportToDOCXBase(htmlContent: string, title: string = 'RPP-Draft', paperSize: string = 'a4', orientation: string = 'portrait') {
  let sizeCss = '';
  // Convert standard paper sizes to pt approx
  if (orientation === 'landscape') {
    if (paperSize === 'a3') {
      sizeCss = `@page WordSection1 { size: 1190.55pt 841.9pt; mso-page-orientation: landscape; margin: 3.0cm 2.0cm 3.0cm 2.0cm; }`;
    } else { // a4 default
      sizeCss = `@page WordSection1 { size: 841.9pt 595.3pt; mso-page-orientation: landscape; margin: 3.0cm 2.0cm 3.0cm 2.0cm; }`;
    }
  } else {
    if (paperSize === 'a3') {
      sizeCss = `@page WordSection1 { size: 841.9pt 1190.55pt; margin: 3.0cm 2.0cm 3.0cm 2.0cm; }`;
    } else { // a4 default
      sizeCss = `@page WordSection1 { size: 595.3pt 841.9pt; margin: 3.0cm 2.0cm 3.0cm 2.0cm; }`;
    }
  }

  const css = `
    <style>
      body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.5; }
      ${sizeCss}
      div.WordSection1 { page: WordSection1; }
      h1 { font-size: 16pt; font-weight: bold; text-align: center; margin-bottom: 20px; }
      h2 { font-size: 14pt; font-weight: bold; margin-top: 15px; margin-bottom: 10px; }
      h3 { font-size: 12pt; font-weight: bold; margin-top: 15px; margin-bottom: 10px; }
      p { margin-bottom: 10px; text-align: justify; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 15px; table-layout: fixed; }
      th, td { border: 1px solid black; padding: 5px; text-align: left; vertical-align: top; word-wrap: break-word; }
      th { font-weight: bold; background-color: #f2f2f2; }
      ul, ol { margin-bottom: 10px; padding-left: 20px; }
    </style>
  `;
  const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
  <head><meta charset='utf-8'><title>${title}</title>${css}</head><body><div class="WordSection1">`;
  const footer = "</div></body></html>";
  const sourceHTML = header + htmlContent + footer;
  
  const blob = new Blob(['\ufeff', sourceHTML], {
    type: 'application/msword'
  });
  const url = URL.createObjectURL(blob);
  
  const fileDownload = document.createElement("a");
  document.body.appendChild(fileDownload);
  fileDownload.href = url;
  fileDownload.download = `${title}.doc`;
  fileDownload.click();
  document.body.removeChild(fileDownload);
  URL.revokeObjectURL(url);
}
