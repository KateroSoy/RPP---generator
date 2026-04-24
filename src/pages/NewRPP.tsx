import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateRPP } from '../lib/gemini';
import { useAuth } from '../AuthContext';
import { saveRppDocument, canGenerateRPP, incrementGenerateCount } from '../lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input, Button, Label, Select, Textarea } from '../components/ui/forms';
import { LoadingScreen } from '../components/ui/loading-screen';
import { Loader2 } from 'lucide-react';


export default function NewRPP() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    curriculumType: 'Kurikulum Merdeka',
    schoolName: '',
    teacherName: user?.displayName || '',
    nip: '',
    educationLevel: 'SMA',
    grade: '',
    semester: '1',
    subject: '',
    topic: '',
    academicYear: '',
    timeAllocation: '',
    phase: '',
    headmasterName: '',
    
    // Step 2
    materialSummary: '',
    learningObjectives: '',
    competencyStandards: '', // K13
    profilPelajarPancasila: '', // Merdeka
    learningModel: '',
    learningMethods: '',
    mediaAndSources: ''
  });

  const updateForm = (key: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleAutoFill = () => {
    setFormData({
      curriculumType: 'Kurikulum Merdeka',
      schoolName: 'SMP Negeri 1 Nusantara',
      teacherName: user?.displayName || 'Budi Santoso, S.Pd',
      nip: '198001012010011001',
      educationLevel: 'SMP',
      grade: 'VII',
      semester: '1',
      subject: 'Ilmu Pengetahuan Alam',
      topic: 'Ekosistem dan Jaring-jaring Makanan',
      academicYear: '2023/2024',
      timeAllocation: '2 x 40 Menit',
      phase: 'D',
      headmasterName: 'Dr. Siti Aminah, M.Pd.',
      materialSummary: 'Komponen biotik dan abiotik dalam ekosistem. Hubungan saling kebergantungan (rantai makanan, jaring-jaring makanan, piramida makanan).',
      learningObjectives: 'Melalui diskusi kelompok dan pengamatan lingkungan, peserta didik mampu mengidentifikasi komponen ekosistem dan menganalisis peran masing-masing komponen dalam jaring-jaring makanan dengan benar.',
      competencyStandards: '',
      profilPelajarPancasila: 'Beriman bertakwa kepada Tuhan YME, Bernalar Kritis, Gotong Royong',
      learningModel: 'Problem Based Learning (PBL)',
      learningMethods: 'Diskusi, Observasi, Tanya Jawab, Presentasi',
      mediaAndSources: 'Buku Paket IPA Kelas VII, LCD Proyektor, Video Pembelajaran Ekosistem, Lingkungan Sekitar Sekolah'
    });
  };

  const handleGenerate = async () => {
    if (!user) {
      alert("Harap login terlebih dahulu.");
      return;
    }
    if (!canGenerateRPP(user.uid)) {
      alert("Anda telah mencapai batas maksimal 5 kali generate RPP untuk hari ini. Silakan coba lagi besok.");
      return;
    }

    setLoading(true);
    try {
      const generatedHtml = await generateRPP(formData);
      
      const docData = {
        userId: user?.uid,
        title: 'RPP ' + formData.subject + ' - ' + formData.topic,
        curriculumType: formData.curriculumType,
        schoolName: formData.schoolName,
        teacherName: formData.teacherName,
        educationLevel: formData.educationLevel,
        grade: formData.grade,
        semester: formData.semester,
        subject: formData.subject,
        topic: formData.topic,
        academicYear: formData.academicYear,
        timeAllocation: formData.timeAllocation,
        status: 'Draft',
        contentHtml: generatedHtml,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      
      const docId = saveRppDocument(docData);
      incrementGenerateCount(user.uid);
      navigate('/rpp/' + docId + '/edit');
    } catch (e) {
      console.error(e);
      alert('Gagal membuat RPP, periksa koneksi atau coba lagi. (' + e + ')');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <LoadingScreen isLoading={loading} />

      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Buat Perangkat Ajar Baru</h1>
            <p className="text-gray-500 text-sm">Isi data yang diperlukan, AI akan membuat draft dokumen komplit Anda.</p>
          </div>
          <Button variant="outline" onClick={handleAutoFill} className="text-xs py-1 px-3 h-auto">
            Isi Kolom Otomatis
          </Button>
        </div>
        
        <div className="flex gap-2 mt-6">
          <div className={"flex-1 h-2 rounded-full " + (step >= 1 ? 'bg-green-600' : 'bg-gray-200')}></div>
          <div className={"flex-1 h-2 rounded-full " + (step >= 2 ? 'bg-green-600' : 'bg-gray-200')}></div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{step === 1 ? 'Langkah 1: Identitas Sekolah' : 'Langkah 2: Materi dan Tujuan'}</CardTitle>
        </CardHeader>
        <CardContent>
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Kurikulum *</Label>
                  <Select value={formData.curriculumType} onChange={e => updateForm('curriculumType', e.target.value)}>
                    <option value="Kurikulum Merdeka">Kurikulum Merdeka</option>
                    <option value="K13">Kurikulum 2013 (K13)</option>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Jenjang *</Label>
                  <Select value={formData.educationLevel} onChange={e => updateForm('educationLevel', e.target.value)}>
                    <option value="SD">SD</option>
                    <option value="SMP">SMP</option>
                    <option value="SMA">SMA</option>
                    <option value="SMK">SMK</option>
                  </Select>
                </div>
                
                <div className="space-y-1 sm:col-span-2">
                  <Label>Nama Sekolah *</Label>
                  <Input placeholder="Contoh: SMA Negeri 1 Jakarta" value={formData.schoolName} onChange={e => updateForm('schoolName', e.target.value)} />
                </div>
                
                <div className="space-y-1">
                  <Label>Mata Pelajaran *</Label>
                  <Input placeholder="Contoh: Biologi" value={formData.subject} onChange={e => updateForm('subject', e.target.value)} />
                </div>
                
                <div className="space-y-1">
                  <Label>Topik / Materi Pokok *</Label>
                  <Input placeholder="Contoh: Sistem Pencernaan Manusia" value={formData.topic} onChange={e => updateForm('topic', e.target.value)} />
                </div>

                <div className="space-y-1">
                  <Label>Kelas *</Label>
                  <Input placeholder="Contoh: XI" value={formData.grade} onChange={e => updateForm('grade', e.target.value)} />
                </div>
                
                <div className="space-y-1">
                  <Label>Semester *</Label>
                  <Select value={formData.semester} onChange={e => updateForm('semester', e.target.value)}>
                    <option value="1">Ganjil</option>
                    <option value="2">Genap</option>
                  </Select>
                </div>

                {formData.curriculumType === 'Kurikulum Merdeka' && (
                  <div className="space-y-1">
                    <Label>Fase (Opsional)</Label>
                    <Input placeholder="Contoh: Fase F" value={formData.phase} onChange={e => updateForm('phase', e.target.value)} />
                  </div>
                )}
                
                <div className="space-y-1">
                  <Label>Alokasi Waktu *</Label>
                  <Input placeholder="Contoh: 2 x 45 Menit" value={formData.timeAllocation} onChange={e => updateForm('timeAllocation', e.target.value)} />
                </div>

                <div className="space-y-1">
                  <Label>Nama Guru *</Label>
                  <Input value={formData.teacherName} onChange={e => updateForm('teacherName', e.target.value)} />
                </div>
                
                <div className="space-y-1">
                  <Label>NIP (Opsional)</Label>
                  <Input value={formData.nip} onChange={e => updateForm('nip', e.target.value)} />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <Label>Nama Kepala Sekolah (Opsional)</Label>
                  <Input value={formData.headmasterName} onChange={e => updateForm('headmasterName', e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-green-600 mb-4 bg-green-50 p-3 rounded-md border border-green-100">
                Semakin detail input di sini, semakin akurat hasil AI. Biarkan kosong jika ingin AI mengembangkannya secara otomatis.
              </p>
              
              <div className="space-y-1">
                <Label>Tujuan Pembelajaran</Label>
                <Textarea placeholder="Peserta didik mampu memahami... (Kosongkan agar AI membuatkan otomatis)" 
                  value={formData.learningObjectives} onChange={e => updateForm('learningObjectives', e.target.value)} />
              </div>

              {formData.curriculumType === 'K13' ? (
                <div className="space-y-1">
                  <Label>Kompetensi Dasar & Indikator</Label>
                  <Textarea placeholder="KD 3.1..." 
                    value={formData.competencyStandards} onChange={e => updateForm('competencyStandards', e.target.value)} />
                </div>
              ) : (
                <div className="space-y-1">
                  <Label>Profil Pelajar Pancasila</Label>
                  <Input placeholder="Bernalar kritis, Mandiri" 
                    value={formData.profilPelajarPancasila} onChange={e => updateForm('profilPelajarPancasila', e.target.value)} />
                </div>
              )}
              
              <div className="space-y-1">
                <Label>Ringkasan Materi (Opsional)</Label>
                <Textarea placeholder="Poin penting materi yang perlu diajarkan..." 
                  value={formData.materialSummary} onChange={e => updateForm('materialSummary', e.target.value)} />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Model Pembelajaran</Label>
                  <Input placeholder="Misal: Project Based Learning" 
                    value={formData.learningModel} onChange={e => updateForm('learningModel', e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Metode</Label>
                  <Input placeholder="Misal: Diskusi, Tanya Jawab" 
                    value={formData.learningMethods} onChange={e => updateForm('learningMethods', e.target.value)} />
                </div>
              </div>

              <div className="space-y-1">
                <Label>Media, Alat, dan Sumber Belajar</Label>
                <Textarea placeholder="Proyektor, Buku Paket, Video..." 
                  value={formData.mediaAndSources} onChange={e => updateForm('mediaAndSources', e.target.value)} />
              </div>
            </div>
          )}

          <div className="flex justify-between mt-8 pt-4 border-t border-gray-100">
            {step > 1 ? (
              <Button variant="outline" onClick={() => setStep(step - 1)}>Kembali</Button>
            ) : <div/>}

            {step < 2 ? (
              <Button onClick={() => setStep(step + 1)}>Selanjutnya</Button>
            ) : (
              <Button onClick={handleGenerate} disabled={loading} className="gap-2 min-w-[140px]">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>Generate RPP</>
                )}
              </Button>

            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
