import React, { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/forms';
import { FilePlus, FileText, Trash2, Edit } from 'lucide-react';
import { getRppDocuments, deleteRppDocument } from '../lib/db';

export default function Dashboard() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDocuments();
    }
  }, [user]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const allDocs = getRppDocuments();
      let docs = allDocs.filter((d: any) => d.userId === user?.uid);
      docs.sort((a: any, b: any) => {
        const timeA = a.createdAt;
        const timeB = b.createdAt;
        return timeB - timeA;
      });
      setDocuments(docs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Yakin ingin menghapus dokumen ini?')) {
      deleteRppDocument(id);
      fetchDocuments();
    }
  };


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Dashboard Anda</h1>
          <p className="text-sm text-gray-500">Kelola dan buat perangkat mengajar secara otomatis.</p>
        </div>
        <Link to="/rpp/new">
          <Button className="flex items-center gap-2">
            <FilePlus className="w-4 h-4" />
            <span>Buat RPP Baru</span>
          </Button>
        </Link>
      </div>

      <div className="bg-green-50 border border-green-100 rounded-lg p-4 text-sm text-green-800">
        <strong className="font-semibold">Panduan Penggunaan Singkat:</strong>
        <ol className="list-decimal pl-5 mt-1 space-y-1 text-green-700">
          <li>Klik <b>Buat RPP Baru</b> dan pilih kurikulum.</li>
          <li>Isi identitas dan detail materi pembelajaran.</li>
          <li>Klik Generate, lalu AI akan menyusun draft komplit.</li>
          <li>Review dan perbaiki draft, lalu download ke PDF/DOCX.</li>
        </ol>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Dokumen Terakhir</h2>
        
        {loading ? (
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-200 rounded-xl" />)}
          </div>
        ) : documents.length === 0 ? (
          <Card className="border-dashed border-2 py-12">
            <CardContent className="flex flex-col items-center text-center pb-0">
              <FileText className="w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">Belum ada dokumen</h3>
              <p className="text-gray-500 mb-4 max-w-sm">Anda belum membuat perangkat ajar satupun. Mulai buat sekarang.</p>
              <Link to="/rpp/new"><Button>Buat RPP Pertama</Button></Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {documents.map(doc => (
              <Card key={doc.id} className="hover:border-green-300 transition-colors">
                <CardContent className="p-5 flex flex-col justify-between h-full">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <span className={"text-xs font-semibold px-2 py-1 rounded-full " + (doc.curriculumType === 'K13' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700')}>
                        {doc.curriculumType}
                      </span>
                      <span className={"text-xs px-2 py-1 rounded-full " + (doc.status === 'Selesai' ? 'bg-gray-100 text-gray-600' : 'bg-yellow-100 text-yellow-800')}>
                        {doc.status}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900 line-clamp-1">{doc.title}</h3>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                      {doc.subject} - Kelas {doc.grade} <br/>
                      Topik: {doc.topic}
                    </p>
                  </div>
                  <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-100">
                    <span className="text-xs text-gray-400">
                      {new Date(doc.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    <div className="flex gap-2">
                      <Button variant="ghost" className="h-8 w-8 p-0" title="Hapus" onClick={() => handleDelete(doc.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                      <Link to={'/rpp/' + doc.id + '/edit'}>
                        <Button variant="outline" className="h-8 w-8 p-0" title="Edit">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
