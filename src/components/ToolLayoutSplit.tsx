import React from 'react';

export function ToolLayoutSplit({ 
  title, 
  description, 
  onBack, 
  controls, 
  previewUrl, 
  previewType = 'pdf' 
}: {
  title: string;
  description: string;
  onBack: () => void;
  controls: React.ReactNode;
  previewUrl: string | null;
  previewType?: 'pdf' | 'image';
}) {
  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-[#F4F5F7] -m-6 md:-m-10">
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shrink-0">
        <div className="flex items-center space-x-4">
          <button onClick={onBack} className="text-indigo-600 hover:bg-indigo-50 p-2 rounded-full transition-colors flex items-center justify-center">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{title}</h1>
            <p className="text-sm text-slate-500">{description}</p>
          </div>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        <div className="w-full lg:w-[350px] xl:w-[400px] bg-white border-r border-slate-200 flex flex-col h-full overflow-y-auto p-6 shrink-0 z-10 relative shadow-[4px_0_12px_rgba(0,0,0,0.02)]">
          {controls}
        </div>
        
        <div className="flex-1 bg-slate-100 flex flex-col p-4 md:p-6 overflow-hidden relative">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex-1 flex flex-col overflow-hidden relative">
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex justify-between items-center shrink-0">
              <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-600 text-[20px]">visibility</span>
                Live Preview
              </h3>
            </div>
            <div className="flex-1 bg-slate-200/50 p-2 md:p-4 overflow-hidden relative flex flex-col">
              {previewUrl ? (
                previewType === 'pdf' ? (
                  <iframe src={`${previewUrl}#toolbar=0&navpanes=0&scrollbar=0`} className="w-full h-full rounded border border-slate-300 bg-white" title="Preview" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center overflow-auto">
                    <img src={previewUrl} className="max-w-full max-h-full object-contain shadow-md rounded border border-slate-300 bg-white" alt="Preview" />
                  </div>
                )
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                  <span className="material-symbols-outlined text-4xl mb-2">preview</span>
                  <p>Preview will appear here</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
