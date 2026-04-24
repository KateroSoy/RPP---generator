import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRppDocumentById, updateRppDocument } from '../lib/db';
import { useAuth } from '../AuthContext';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/forms';
import { LoadingScreen } from '../components/ui/loading-screen';

import { exportToDOCXBase } from '../lib/utils';
// @ts-ignore
import html2pdf from 'html2pdf.js';
import { Bold, Italic, Heading1, Heading2, List, Download, Save, CheckCircle2, Undo, Redo, LayoutTemplate, Monitor } from 'lucide-react';

export default function EditRPP() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [documentData, setDocumentData] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [paperSize, setPaperSize] = useState<'a4' | 'a3' | 'letter' | 'legal'>('a4');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchDoc() {
      if (!id) return;
      const data = getRppDocumentById(id);
      if (data && data.userId === user?.uid) {
        setDocumentData({ id: data.id, ...data });
      } else {
        alert("Dokumen tidak ditemukan atau akses ditolak.");
        navigate('/dashboard');
      }
    }
    fetchDoc();
  }, [id, user, navigate]);

  const handleSave = async (status: string = 'Draft') => {
    if (!editorRef.current || !documentData) return;
    setSaving(true);
    try {
      const updatedHtml = editorRef.current.innerHTML;
      updateRppDocument(documentData.id, {
        contentHtml: updatedHtml,
        status: status,
        updatedAt: Date.now()
      });
      setDocumentData({ ...documentData, contentHtml: updatedHtml, status });
      setSaveMessage('Dokumen tersimpan!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (e) {
      console.error(e);
      alert("Gagal menyimpan dokumen");
    } finally {
      setSaving(false);
    }
  };

  const handleFormat = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const exportPDF = () => {
    if (!editorRef.current) return;
    const element = editorRef.current;
    
    // Add custom print CSS wrapper temporarily
    const wrapper = document.createElement('div');
    wrapper.innerHTML = element.innerHTML;
    wrapper.className = "print-wrapper";
    // Inline minimal styles so that PDF renders nicely
    wrapper.style.fontFamily = "Times New Roman, serif";
    wrapper.style.lineHeight = "1.5";
    wrapper.style.fontSize = "12pt";
    
    // Convert table styles explicitly inside wrapper just in case html2pdf cuts off
    const tables = wrapper.querySelectorAll('table');
    tables.forEach(table => {
       table.style.width = '100%';
       table.style.tableLayout = 'fixed';
       table.style.wordWrap = 'break-word';
       const cells = table.querySelectorAll('th, td');
       cells.forEach((cell: any) => {
          cell.style.wordWrap = 'break-word';
          cell.style.overflowWrap = 'break-word';
       });
    });
    
    const opt: any = {
      margin:       15,
      filename:     (documentData?.title || 'RPP') + '.pdf',
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'mm', format: paperSize, orientation: orientation }
    };
    html2pdf().set(opt).from(wrapper).save();
  };

  const exportDOCX = () => {
    if (!editorRef.current) return;
    // Export standard HTML with styles inline for MS Word to parse.
    exportToDOCXBase(editorRef.current.innerHTML, documentData?.title, paperSize, orientation);
  };

  useEffect(() => {
    if (!editorRef.current || !documentData) return;
    const editor = editorRef.current;

    let isResizing = false;
    let currentCell: HTMLTableCellElement | null = null;
    let startX = 0;
    let startWidth = 0;

    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName.toLowerCase() === 'th' || target.tagName.toLowerCase() === 'td') {
        const rect = target.getBoundingClientRect();
        // Check if cursor is within 10px of the right edge
        if (e.clientX > rect.right - 10 && e.clientX <= rect.right) {
          isResizing = true;
          currentCell = target as HTMLTableCellElement;
          startX = e.clientX;
          startWidth = currentCell.offsetWidth;
          // Prevent text selection
          e.preventDefault();
        }
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      if (isResizing && currentCell) {
        const newWidth = startWidth + (e.clientX - startX);
        const table = currentCell.closest('table');
        if (table) {
          // Set table width to its current offsetWidth in pixels to ensure layout fixed works optimally
          if (!table.style.width || table.style.width.includes('%')) {
             table.style.width = `${table.offsetWidth}px`;
          }
          table.style.tableLayout = 'fixed';
          currentCell.style.width = `${newWidth}px`;
        }
      } else {
        const target = e.target as HTMLElement;
        if (target.tagName.toLowerCase() === 'th' || target.tagName.toLowerCase() === 'td') {
          const rect = target.getBoundingClientRect();
          if (e.clientX > rect.right - 10 && e.clientX <= rect.right) {
            target.style.cursor = 'col-resize';
          } else {
            target.style.cursor = 'text';
          }
        }
      }
    };

    const onMouseUp = () => {
      if (isResizing && currentCell) {
        isResizing = false;
        currentCell = null;
      }
    };

    editor.addEventListener('mousedown', onMouseDown);
    editor.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);

    return () => {
      editor.removeEventListener('mousedown', onMouseDown);
      editor.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, [documentData]);

  if (!documentData) return <div className="text-center p-12">Memuat dokumen...</div>;

  const getDims = () => {
    let width = '210mm';
    let height = '297mm';
    if (paperSize === 'a3') { width = '297mm'; height = '420mm'; }
    if (paperSize === 'letter') { width = '215.9mm'; height = '279.4mm'; }
    if (paperSize === 'legal') { width = '215.9mm'; height = '355.6mm'; }
    if (orientation === 'landscape') { return { width: height, height: width }; }
    return { width, height };
  };

  const dims = getDims();

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <LoadingScreen isLoading={saving} message="Sedang menyimpan..." />
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">

        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 line-clamp-1">{documentData.title}</h1>
          <p className="text-sm text-gray-500">Edit dokumen secara langsung di editor, lalu simpan atau unduh.</p>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <div className="flex items-center gap-2 border-r border-gray-300 pr-4 mr-2">
            <select
              value={paperSize}
              onChange={(e) => setPaperSize(e.target.value as any)}
              className="px-2 py-1.5 bg-white border border-gray-300 rounded-md text-sm focus:ring-green-500 focus:border-green-500"
            >
              <option value="a4">A4</option>
              <option value="a3">A3</option>
              <option value="letter">Letter</option>
              <option value="legal">Legal</option>
            </select>
            <select
              value={orientation}
              onChange={(e) => setOrientation(e.target.value as any)}
              className="px-2 py-1.5 bg-white border border-gray-300 rounded-md text-sm focus:ring-green-500 focus:border-green-500"
            >
              <option value="portrait">Portrait</option>
              <option value="landscape">Landscape</option>
            </select>
          </div>

          <Button variant="outline" onClick={() => handleSave('Draft')} disabled={saving}>
            <Save className="w-4 h-4 mr-2" /> Simpan Draft
          </Button>
          <Button onClick={() => handleSave('Selesai')} disabled={saving}>
            <CheckCircle2 className="w-4 h-4 mr-2" /> Tandai Selesai
          </Button>
          <Button variant="outline" onClick={exportPDF} title="Download PDF">
            PDF
          </Button>
          <Button variant="outline" onClick={exportDOCX} title="Download DOCX">
            DOCX
          </Button>
        </div>
      </div>
      
      {saveMessage && (
        <div className="bg-green-50 text-green-700 p-3 rounded-md text-sm text-center border border-green-100">
          {saveMessage}
        </div>
      )}

      <Card className="overflow-hidden">
        {/* Editor Toolbar */}
        <div className="bg-gray-100 border-b border-gray-200 p-2 flex gap-1 flex-wrap sticky top-16 z-10 antialiased overflow-x-auto">
          <Button variant="ghost" className="h-8 w-8 p-1 flex-shrink-0" onClick={() => handleFormat('undo')} title="Undo">
            <Undo className="w-4 h-4" />
          </Button>
          <Button variant="ghost" className="h-8 w-8 p-1 flex-shrink-0" onClick={() => handleFormat('redo')} title="Redo">
            <Redo className="w-4 h-4" />
          </Button>
          <div className="w-px h-6 bg-gray-300 mx-1 align-middle my-auto"></div>
          <Button variant="ghost" className="h-8 w-8 p-1 flex-shrink-0" onClick={() => handleFormat('bold')} title="Bold">
            <Bold className="w-4 h-4" />
          </Button>
          <Button variant="ghost" className="h-8 w-8 p-1 flex-shrink-0" onClick={() => handleFormat('italic')} title="Italic">
            <Italic className="w-4 h-4" />
          </Button>
          <div className="w-px h-6 bg-gray-300 mx-1 align-middle my-auto"></div>
          <Button variant="ghost" className="h-8 w-8 p-1 font-serif font-bold text-sm flex-shrink-0" onClick={() => handleFormat('formatBlock', 'H1')} title="Heading 1">
            H1
          </Button>
          <Button variant="ghost" className="h-8 w-8 p-1 font-serif font-bold text-sm flex-shrink-0" onClick={() => handleFormat('formatBlock', 'H2')} title="Heading 2">
            H2
          </Button>
          <Button variant="ghost" className="h-8 w-8 p-1 font-serif font-bold text-sm flex-shrink-0" onClick={() => handleFormat('formatBlock', 'H3')} title="Heading 3">
            H3
          </Button>
          <div className="w-px h-6 bg-gray-300 mx-1 align-middle my-auto"></div>
          <Button variant="ghost" className="h-8 w-8 p-1 flex-shrink-0" onClick={() => handleFormat('insertUnorderedList')} title="Bullet List">
            <List className="w-4 h-4" />
          </Button>
          <Button variant="ghost" className="h-8 w-12 p-1 text-xs font-semibold flex-shrink-0" onClick={() => handleFormat('insertOrderedList')} title="Numbered List">
            1. 2.
          </Button>
        </div>
        
        <CardContent className="p-0 overflow-x-auto w-full">
          {/* Main Editor Surface - styled like a physical page */}
          <div className="bg-gray-200 p-4 sm:p-8 flex justify-center min-w-max">
            <div 
              ref={editorRef}
              className="bg-white p-8 shadow-sm ring-1 ring-gray-900/5 focus:outline-none focus:ring-2 focus:ring-green-500 rounded-sm doc-editor"
              style={{ width: dims.width, minHeight: dims.height, maxWidth: dims.width }}
              contentEditable
              suppressContentEditableWarning
              dangerouslySetInnerHTML={{ __html: documentData.contentHtml }}
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Required note as requested */}
      <p className="text-xs text-gray-500 text-center">* Dokumen ini adalah draft yang dihasilkan AI dan dapat disesuaikan sepenuhnya oleh Anda sebagai guru. Harap periksa kembali kesesuaian dengan RPP resmi sekolah Anda.</p>
    </div>
  );
}
