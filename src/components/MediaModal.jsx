import React from 'react';
import { 
  X, 
  Loader2, 
  Image, 
  Pencil, 
  Trash2, 
  Camera, 
  Film, 
  Save 
} from 'lucide-react';

export default function MediaModal({
  isOpen,
  onClose,
  selectedMediaLokasi,
  uploadingMedia,
  mediaUploadProgress,
  isEditingVideo,
  setIsEditingVideo,
  videoInputUrl,
  setVideoInputUrl,
  handleUploadMedia,
  handleDeleteMedia,
  handleSaveVideoLink
}) {
  if (!isOpen || !selectedMediaLokasi) return null;

  const photos = selectedMediaLokasi.photos || [null, null, null];
  const video = selectedMediaLokasi.video || null;

  return (
    <div className="fixed inset-0 bg-[#022c22]/60 backdrop-blur-sm z-[60] flex justify-center items-center p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-emerald-50 text-emerald-950">
          <div>
            <h3 className="font-black text-lg tracking-tight">Kelola Media Lokasi</h3>
            <p className="text-xs font-bold text-emerald-600 mt-0.5">{selectedMediaLokasi.nama}</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-all duration-200">
            <X size={18} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto space-y-6 bg-slate-50 flex-1 hide-scrollbar">
          {uploadingMedia && (
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-2xl flex items-center text-sm font-bold shadow-sm">
              <Loader2 size={18} className="animate-spin mr-3"/> {mediaUploadProgress}
            </div>
          )}
          
          <div>
            <h4 className="text-sm font-black text-emerald-950 flex items-center mb-4">
              <Image size={16} className="mr-2 text-emerald-600"/> Foto Fasilitas (Maks. 3)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[0, 1, 2].map(idx => (
                <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-3 flex flex-col items-center justify-between min-h-[190px] shadow-sm hover:border-emerald-300 transition-all">
                  {photos[idx] ? (
                    <>
                      <div className="relative w-full h-32 rounded-xl overflow-hidden bg-slate-100">
                        <img src={photos[idx]} alt={`Foto ${idx+1}`} className="w-full h-full object-cover" />
                        <span className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 backdrop-blur-sm text-white text-[9px] font-bold rounded-md">
                          Foto {idx + 1}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 w-full mt-3">
                        <label className="flex-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold py-1.5 px-2.5 rounded-xl border border-emerald-200 flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-sm">
                          <Pencil size={12} className="text-emerald-700" />
                          <span>Ganti Foto</span>
                          <input type="file" accept="image/*" className="hidden" onClick={(e) => e.target.value = null} onChange={(e) => handleUploadMedia(e, 'photo', idx)} disabled={uploadingMedia} />
                        </label>
                        <button type="button" onClick={() => handleDeleteMedia('photo', idx)} className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl border border-rose-200 transition-all shadow-sm" title="Hapus Foto">
                          <Trash2 size={13}/>
                        </button>
                      </div>
                    </>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-full min-h-[160px] border-2 border-dashed border-slate-300 hover:border-emerald-400 rounded-xl cursor-pointer bg-slate-50 hover:bg-emerald-50/50 transition-colors p-4 text-center">
                      <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2">
                        <Camera size={18} />
                      </div>
                      <span className="text-[10px] font-extrabold text-slate-700 uppercase">Upload Foto {idx+1}</span>
                      <span className="text-[9px] text-slate-400 mt-0.5">Maks 900 KB (JPG/PNG)</span>
                      <input type="file" accept="image/*" className="hidden" onClick={(e) => e.target.value = null} onChange={(e) => handleUploadMedia(e, 'photo', idx)} disabled={uploadingMedia} />
                    </label>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-black text-emerald-950 flex items-center">
                <Film size={16} className="mr-2 text-blue-600"/> Video Fasilitas (Link YouTube)
              </h4>
              {video && !isEditingVideo && (
                <button 
                  type="button" 
                  onClick={() => {
                    setVideoInputUrl(video);
                    setIsEditingVideo(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl border border-blue-200 transition-all shadow-sm"
                >
                  <Pencil size={12} />
                  <span>Ganti Video</span>
                </button>
              )}
            </div>

            {isEditingVideo || !video ? (
              <div className="bg-white border-2 border-blue-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Film size={18} />
                  </div>
                  <div className="flex-1">
                    <h5 className="font-extrabold text-xs text-slate-900 uppercase tracking-wide">
                      {video ? 'Ganti Link Video YouTube' : 'Tautkan Video YouTube'}
                    </h5>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Salin dan tempel link video YouTube dari browser (contoh: https://www.youtube.com/watch?v=... atau https://youtu.be/...)
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <input 
                    type="url"
                    value={videoInputUrl}
                    onChange={(e) => setVideoInputUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSaveVideoLink(videoInputUrl);
                      }
                    }}
                  />
                  <div className="flex items-center gap-2">
                    <button 
                      type="button" 
                      disabled={uploadingMedia || !videoInputUrl.trim()}
                      onClick={() => handleSaveVideoLink(videoInputUrl)}
                      className="flex-1 sm:flex-none px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5"
                    >
                      <Save size={13} />
                      <span>Simpan Video</span>
                    </button>
                    {video && (
                      <button 
                        type="button" 
                        onClick={() => {
                          setIsEditingVideo(false);
                          setVideoInputUrl(video);
                        }}
                        className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-xs transition-all"
                      >
                        Batal
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-sm space-y-3">
                <div className="relative w-full rounded-xl overflow-hidden bg-slate-900 aspect-video max-h-[300px]">
                  {(() => {
                    const ytMatch = video.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/);
                    const ytId = (ytMatch && ytMatch[2].length === 11) ? ytMatch[2] : null;
                    return ytId ? (
                      <iframe src={`https://www.youtube.com/embed/${ytId}`} frameBorder="0" allowFullScreen className="w-full h-full object-cover" />
                    ) : (
                      <a href={video} target="_blank" rel="noreferrer" className="text-blue-500 font-bold underline p-4 break-all block text-center">{video}</a>
                    );
                  })()}
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1 border-t border-slate-100">
                  <div className="flex items-center gap-2 text-xs text-slate-600 truncate max-w-sm sm:max-w-md">
                    <span className="font-extrabold text-slate-400 uppercase text-[10px] tracking-wider">Link:</span>
                    <span className="truncate font-mono text-[11px] text-blue-700 font-semibold">{video}</span>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button 
                      type="button" 
                      onClick={() => {
                        setVideoInputUrl(video);
                        setIsEditingVideo(true);
                      }}
                      className="flex-1 sm:flex-none px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-bold text-xs border border-blue-200 transition-all flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <Pencil size={12} />
                      <span>Ganti Video</span>
                    </button>
                    <button 
                      type="button" 
                      onClick={() => handleDeleteMedia('video')} 
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl font-bold text-xs border border-rose-200 transition-all flex items-center justify-center gap-1.5 shadow-sm"
                      title="Hapus Video"
                    >
                      <Trash2 size={13} />
                      <span>Hapus</span>
                    </button>
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
