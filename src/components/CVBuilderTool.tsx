import React, { useState, useRef } from 'react';
import { ArrowLeft, Download, Upload, User, LayoutTemplate, Edit3, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';

interface CVData {
  name: string;
  title: string;
  email: string;
  phone: string;
  address: string;
  summary: string;
  experience: { company: string; role: string; duration: string; description: string }[];
  education: { school: string; degree: string; year: string }[];
  skills: string[];
  imageUrl: string;
}

const defaultData: CVData = {
  name: 'John Doe',
  title: 'Senior Software Engineer',
  email: 'john.doe@example.com',
  phone: '+1 234 567 8900',
  address: 'San Francisco, CA',
  summary: 'Passionate software engineer with 5+ years of experience in building scalable web applications. Strong expertise in React, Node.js, and Cloud Infrastructure.',
  experience: [
    { company: 'Tech Corp', role: 'Senior Developer', duration: '2020 - Present', description: 'Led frontend team. Improved performance by 40%.' },
    { company: 'Web Solutions', role: 'Web Developer', duration: '2018 - 2020', description: 'Developed e-commerce platforms using React.' }
  ],
  education: [
    { school: 'University of Technology', degree: 'B.S. Computer Science', year: '2014 - 2018' }
  ],
  skills: ['React', 'TypeScript', 'Node.js', 'Tailwind CSS', 'AWS', 'Docker'],
  imageUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&auto=format&fit=crop'
};

const PRESETS = [
  { id: 1, name: 'Modern Minimal', layout: 'grid grid-cols-1', colors: 'text-slate-900 bg-white', font: 'font-sans' },
  { id: 2, name: 'Classic Serif', layout: 'grid grid-cols-1', colors: 'text-slate-900 bg-white', font: 'font-serif' },
  { id: 3, name: 'Two Column Modern', layout: 'grid grid-cols-3', colors: 'text-slate-900 bg-white', font: 'font-sans' },
  { id: 4, name: 'Dark Mode Edge', layout: 'grid grid-cols-1', colors: 'text-slate-100 bg-slate-900', font: 'font-mono' },
  { id: 5, name: 'Blue Horizon', layout: 'grid grid-cols-3', colors: 'text-slate-800 bg-blue-50', font: 'font-sans' },
  { id: 6, name: 'Green Eco', layout: 'grid grid-cols-1', colors: 'text-slate-800 bg-emerald-50', font: 'font-serif' },
  { id: 7, name: 'Purple Creative', layout: 'grid grid-cols-3', colors: 'text-purple-900 bg-purple-50', font: 'font-sans' },
  { id: 8, name: 'Orange Spark', layout: 'grid grid-cols-1', colors: 'text-orange-950 bg-orange-50', font: 'font-sans' },
  { id: 9, name: 'Rose Elegant', layout: 'grid grid-cols-3', colors: 'text-rose-950 bg-rose-50', font: 'font-serif' },
  { id: 10, name: 'Navy Executive', layout: 'grid grid-cols-1', colors: 'text-slate-100 bg-slate-800', font: 'font-serif' },
  { id: 11, name: 'Teal Modern', layout: 'grid grid-cols-3', colors: 'text-teal-950 bg-teal-50', font: 'font-sans' },
  { id: 12, name: 'Yellow Sunshine', layout: 'grid grid-cols-1', colors: 'text-yellow-900 bg-yellow-50', font: 'font-sans' },
  { id: 13, name: 'Indigo Corporate', layout: 'grid grid-cols-3', colors: 'text-indigo-950 bg-indigo-50', font: 'font-sans' },
  { id: 14, name: 'Fuchsia Bold', layout: 'grid grid-cols-1', colors: 'text-fuchsia-950 bg-fuchsia-50', font: 'font-mono' },
  { id: 15, name: 'Slate Brutalist', layout: 'grid grid-cols-1 border-4 border-black', colors: 'text-black bg-white', font: 'font-mono uppercase tracking-tighter' }
];

export function CVBuilderTool({ onBack }: { onBack: () => void }) {
  const [data, setData] = useState<CVData>(defaultData);
  const [preset, setPreset] = useState(PRESETS[0]);
  const [activeTab, setActiveTab] = useState<'edit' | 'presets'>('edit');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setData(prev => ({ ...prev, imageUrl: url }));
    }
  };

  const cvRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handlePrint = async () => {
    if (!cvRef.current) return;
    
    try {
      setIsExporting(true);
      // Dynamic import to avoid SSR issues if this was SSR, and keeping bundle smaller
                  const domtoimage = (await import('dom-to-image-more')).default;
      const { jsPDF } = await import('jspdf');

      const elemW = cvRef.current.scrollWidth || 794;
      const elemH = cvRef.current.scrollHeight || 1123;

      const imgData = await domtoimage.toJpeg(cvRef.current, {
        quality: 1.0,
        scale: 4,
        bgcolor: '#ffffff',
        width: elemW,
        height: elemH
      });

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (elemH * pdfWidth) / elemW;
      const pageHeight = pdf.internal.pageSize.getHeight();

      let heightLeft = pdfHeight;
      let position = 0;

      pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`${data.name.replace(/\s+/g, '_')}_CV.pdf`);
      toast.success('CV PDF exported successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleChange = (field: keyof CVData, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayChange = (field: 'experience' | 'education' | 'skills', index: number, key: string, value: string) => {
    setData(prev => {
      const newArray = [...prev[field]] as any[];
      if (typeof newArray[index] === 'string') {
        newArray[index] = value;
      } else {
        newArray[index] = { ...newArray[index], [key]: value };
      }
      return { ...prev, [field]: newArray };
    });
  };

  const addArrayItem = (field: 'experience' | 'education' | 'skills') => {
    setData(prev => {
      let newItem: any;
      if (field === 'experience') newItem = { company: '', role: '', duration: '', description: '' };
      else if (field === 'education') newItem = { school: '', degree: '', year: '' };
      else newItem = '';
      return { ...prev, [field]: [...prev[field], newItem] };
    });
  };

  return (
    <div className="flex flex-col h-[85vh] bg-slate-50 rounded-2xl overflow-hidden border border-slate-200 shadow-sm print:h-auto print:bg-white print:border-none print:shadow-none">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white border-b border-slate-200 shrink-0 print:hidden">
        <div className="flex items-center space-x-3">
          <button onClick={onBack} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-bold text-slate-800">CV Builder</h2>
        </div>
        <div className="flex items-center space-x-2">
          <button onClick={handlePrint} disabled={isExporting} className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-70 disabled:cursor-not-allowed">
            <Download className="w-4 h-4" />
            <span>{isExporting ? 'Exporting...' : 'Export PDF'}</span>
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden print:overflow-visible">
        {/* Sidebar Controls */}
        <div className="w-80 bg-white border-r border-slate-200 flex flex-col shrink-0 print:hidden overflow-y-auto">
          <div className="flex p-2 space-x-1 border-b border-slate-100 bg-slate-50 sticky top-0 z-10">
            <button
              onClick={() => setActiveTab('edit')}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${activeTab === 'edit' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit Details</span>
            </button>
            <button
              onClick={() => setActiveTab('presets')}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${activeTab === 'presets' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <LayoutTemplate className="w-4 h-4" />
              <span>15 Presets</span>
            </button>
          </div>

          <div className="p-4 space-y-6">
            {activeTab === 'edit' ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 mb-2">Profile Image</h3>
                  <div className="flex items-center space-x-3">
                    <img src={data.imageUrl} alt="Profile" className="w-12 h-12 rounded-full object-cover border border-slate-200" />
                    <button onClick={() => fileInputRef.current?.click()} className="flex items-center space-x-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-sm transition-colors">
                      <Upload className="w-4 h-4" />
                      <span>Replace</span>
                    </button>
                    <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-800 mb-2">Personal Info</h3>
                  <div className="space-y-2">
                    <input type="text" value={data.name} onChange={(e) => handleChange('name', e.target.value)} placeholder="Full Name" className="w-full text-sm border border-slate-200 rounded-md px-3 py-2" />
                    <input type="text" value={data.title} onChange={(e) => handleChange('title', e.target.value)} placeholder="Job Title" className="w-full text-sm border border-slate-200 rounded-md px-3 py-2" />
                    <input type="email" value={data.email} onChange={(e) => handleChange('email', e.target.value)} placeholder="Email" className="w-full text-sm border border-slate-200 rounded-md px-3 py-2" />
                    <input type="text" value={data.phone} onChange={(e) => handleChange('phone', e.target.value)} placeholder="Phone" className="w-full text-sm border border-slate-200 rounded-md px-3 py-2" />
                    <input type="text" value={data.address} onChange={(e) => handleChange('address', e.target.value)} placeholder="Address" className="w-full text-sm border border-slate-200 rounded-md px-3 py-2" />
                    <textarea value={data.summary} onChange={(e) => handleChange('summary', e.target.value)} placeholder="Professional Summary" rows={3} className="w-full text-sm border border-slate-200 rounded-md px-3 py-2" />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-bold text-slate-800">Experience</h3>
                    <button onClick={() => addArrayItem('experience')} className="text-xs text-indigo-600 hover:underline">+ Add</button>
                  </div>
                  <div className="space-y-3">
                    {data.experience.map((exp, i) => (
                      <div key={i} className="p-3 bg-slate-50 rounded-md border border-slate-100 space-y-2">
                        <input type="text" value={exp.company} onChange={(e) => handleArrayChange('experience', i, 'company', e.target.value)} placeholder="Company" className="w-full text-xs border border-slate-200 rounded px-2 py-1" />
                        <input type="text" value={exp.role} onChange={(e) => handleArrayChange('experience', i, 'role', e.target.value)} placeholder="Role" className="w-full text-xs border border-slate-200 rounded px-2 py-1" />
                        <input type="text" value={exp.duration} onChange={(e) => handleArrayChange('experience', i, 'duration', e.target.value)} placeholder="Duration" className="w-full text-xs border border-slate-200 rounded px-2 py-1" />
                        <textarea value={exp.description} onChange={(e) => handleArrayChange('experience', i, 'description', e.target.value)} placeholder="Description" rows={2} className="w-full text-xs border border-slate-200 rounded px-2 py-1" />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-bold text-slate-800">Education</h3>
                    <button onClick={() => addArrayItem('education')} className="text-xs text-indigo-600 hover:underline">+ Add</button>
                  </div>
                  <div className="space-y-3">
                    {data.education.map((edu, i) => (
                      <div key={i} className="p-3 bg-slate-50 rounded-md border border-slate-100 space-y-2">
                        <input type="text" value={edu.school} onChange={(e) => handleArrayChange('education', i, 'school', e.target.value)} placeholder="School" className="w-full text-xs border border-slate-200 rounded px-2 py-1" />
                        <input type="text" value={edu.degree} onChange={(e) => handleArrayChange('education', i, 'degree', e.target.value)} placeholder="Degree" className="w-full text-xs border border-slate-200 rounded px-2 py-1" />
                        <input type="text" value={edu.year} onChange={(e) => handleArrayChange('education', i, 'year', e.target.value)} placeholder="Year" className="w-full text-xs border border-slate-200 rounded px-2 py-1" />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-bold text-slate-800">Skills</h3>
                    <button onClick={() => addArrayItem('skills')} className="text-xs text-indigo-600 hover:underline">+ Add</button>
                  </div>
                  <div className="space-y-2">
                    {data.skills.map((skill, i) => (
                      <input key={i} type="text" value={skill} onChange={(e) => handleArrayChange('skills', i, '', e.target.value)} placeholder="Skill" className="w-full text-xs border border-slate-200 rounded px-2 py-1" />
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {PRESETS.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setPreset(p)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${preset.id === p.id ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600' : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'}`}
                  >
                    <div className="font-bold text-sm text-slate-800">Preset {p.id}: {p.name}</div>
                    <div className="text-xs text-slate-500 mt-1 capitalize">{p.layout.split(' ')[1]} layout, {p.font.split('-')[1]}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Live Preview Area */}
        <div className="flex-1 bg-[#f0f2f5] p-8 overflow-y-auto print:p-0 print:bg-white flex justify-center">
          <div ref={cvRef} className={`w-full max-w-[21cm] min-h-[29.7cm] shadow-xl print:shadow-none p-10 ${preset.colors} ${preset.font} ${preset.layout} gap-8 transition-colors duration-300`}>
            
            {preset.layout.includes('grid-cols-3') ? (
              <>
                {/* 1/3 Column (Sidebar) */}
                <div className="col-span-1 space-y-8">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <img src={data.imageUrl} alt="Profile" className="w-40 h-40 rounded-full object-cover shadow-md border-4 border-white/20" />
                    <div>
                      <h1 className="text-2xl font-bold leading-tight">{data.name}</h1>
                      <p className="opacity-80 mt-1">{data.title}</p>
                    </div>
                  </div>

                  <div>
                    <h2 className="text-lg font-bold border-b border-current pb-2 mb-4 opacity-90 uppercase tracking-wider text-sm">Contact</h2>
                    <ul className="space-y-2 text-sm opacity-90">
                      <li>{data.email}</li>
                      <li>{data.phone}</li>
                      <li>{data.address}</li>
                    </ul>
                  </div>

                  <div>
                    <h2 className="text-lg font-bold border-b border-current pb-2 mb-4 opacity-90 uppercase tracking-wider text-sm">Skills</h2>
                    <div className="flex flex-wrap gap-2">
                      {data.skills.map((s, i) => (
                        <span key={i} className="px-2 py-1 bg-white/10 rounded text-xs opacity-90">{s}</span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 2/3 Column (Main Content) */}
                <div className="col-span-2 space-y-8 pl-4 border-l border-current/10">
                  <div>
                    <h2 className="text-xl font-bold border-b border-current pb-2 mb-4 opacity-90 uppercase tracking-wider">Profile</h2>
                    <p className="text-sm leading-relaxed opacity-90">{data.summary}</p>
                  </div>

                  <div>
                    <h2 className="text-xl font-bold border-b border-current pb-2 mb-4 opacity-90 uppercase tracking-wider">Experience</h2>
                    <div className="space-y-6">
                      {data.experience.map((exp, i) => (
                        <div key={i}>
                          <h3 className="font-bold text-lg">{exp.role}</h3>
                          <div className="flex justify-between text-sm opacity-80 mb-2 font-medium">
                            <span>{exp.company}</span>
                            <span>{exp.duration}</span>
                          </div>
                          <p className="text-sm opacity-90">{exp.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h2 className="text-xl font-bold border-b border-current pb-2 mb-4 opacity-90 uppercase tracking-wider">Education</h2>
                    <div className="space-y-4">
                      {data.education.map((edu, i) => (
                        <div key={i}>
                          <h3 className="font-bold">{edu.degree}</h3>
                          <div className="flex justify-between text-sm opacity-80 font-medium">
                            <span>{edu.school}</span>
                            <span>{edu.year}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* Single Column Layout */
              <div className="space-y-8 max-w-3xl mx-auto w-full">
                <div className="flex items-center space-x-6 border-b border-current pb-8">
                  <img src={data.imageUrl} alt="Profile" className="w-32 h-32 rounded-full object-cover shadow-sm border-2 border-current/20" />
                  <div>
                    <h1 className="text-4xl font-bold tracking-tight mb-2">{data.name}</h1>
                    <p className="text-xl opacity-80 font-light mb-4">{data.title}</p>
                    <div className="flex flex-wrap gap-4 text-sm opacity-75">
                      <span>{data.email}</span>
                      <span>•</span>
                      <span>{data.phone}</span>
                      <span>•</span>
                      <span>{data.address}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-xl font-bold mb-3 uppercase tracking-wider opacity-90">Professional Summary</h2>
                  <p className="text-base leading-relaxed opacity-90">{data.summary}</p>
                </div>

                <div>
                  <h2 className="text-xl font-bold mb-4 uppercase tracking-wider opacity-90 border-b border-current pb-2">Experience</h2>
                  <div className="space-y-6">
                    {data.experience.map((exp, i) => (
                      <div key={i}>
                        <div className="flex justify-between items-baseline mb-1">
                          <h3 className="font-bold text-lg">{exp.role}</h3>
                          <span className="text-sm font-medium opacity-80">{exp.duration}</span>
                        </div>
                        <h4 className="font-medium text-base opacity-90 mb-2">{exp.company}</h4>
                        <p className="text-sm opacity-80">{exp.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <h2 className="text-xl font-bold mb-4 uppercase tracking-wider opacity-90 border-b border-current pb-2">Education</h2>
                    <div className="space-y-4">
                      {data.education.map((edu, i) => (
                        <div key={i}>
                          <h3 className="font-bold">{edu.degree}</h3>
                          <p className="opacity-90">{edu.school}</p>
                          <p className="text-sm opacity-70">{edu.year}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h2 className="text-xl font-bold mb-4 uppercase tracking-wider opacity-90 border-b border-current pb-2">Skills</h2>
                    <ul className="list-disc list-inside space-y-1 opacity-90">
                      {data.skills.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
            
          </div>
        </div>
      </div>
    </div>
  );
}
