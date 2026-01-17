
import React, { useState, useRef } from 'react';
import { Camera, Upload, Type, X, FileText, ArrowLeft, Plus, Image as ImageIcon } from 'lucide-react';
import { MediaItem } from '../types';

interface InputSectionProps {
  onContinue: (text: string, mediaItems: MediaItem[]) => void;
  isLoading: boolean;
}

const InputSection: React.FC<InputSectionProps> = ({ onContinue, isLoading }) => {
  const [mode, setMode] = useState<'upload' | 'camera' | 'text'>('upload');
  const [inputText, setInputText] = useState('');
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      // Fix: Explicitly typing 'file' as File to resolve 'unknown' type errors during iteration
      Array.from(files).forEach((file: File) => {
        if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
          return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          const base64Data = result.split(',')[1];
          const newItem: MediaItem = {
            base64Data,
            mimeType: file.type,
            fileName: file.name
          };
          setMediaItems(prev => [...prev, newItem]);
        };
        reader.readAsDataURL(file);
      });
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("تعذر الوصول إلى الكاميرا.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsCameraActive(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        const base64Data = dataUrl.split(',')[1];
        setMediaItems(prev => [...prev, {
          base64Data,
          mimeType: 'image/jpeg',
          fileName: `photo_${Date.now()}.jpg`
        }]);
        stopCamera();
        setMode('upload'); // Switch back to show list
      }
    }
  };

  const removeItem = (index: number) => {
    setMediaItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleContinueClick = () => {
    if (!inputText && mediaItems.length === 0) {
      alert("يرجى إدخال نص أو ملف واحد على الأقل للمتابعة");
      return;
    }
    onContinue(inputText, mediaItems);
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden border border-emerald-100">
      <div className="bg-emerald-600 p-8 text-white text-center">
        <h2 className="text-3xl font-black mb-2">ماذا تريد أن تراجع اليوم؟</h2>
        <p className="opacity-90 font-medium">يمكنك رفع حتى 10 صور أو ملفات PDF معاً</p>
      </div>

      <div className="flex border-b border-gray-100 bg-gray-50/50">
        <button
          onClick={() => { setMode('upload'); stopCamera(); }}
          className={`flex-1 py-5 flex items-center justify-center gap-3 font-bold transition-all ${mode === 'upload' ? 'text-emerald-600 border-b-4 border-emerald-600 bg-white' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <Upload size={22} />
          <span>الملفات المرفوعة ({mediaItems.length})</span>
        </button>
        <button
          onClick={() => { setMode('camera'); startCamera(); }}
          className={`flex-1 py-5 flex items-center justify-center gap-3 font-bold transition-all ${mode === 'camera' ? 'text-emerald-600 border-b-4 border-emerald-600 bg-white' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <Camera size={22} />
          <span>التقاط صورة</span>
        </button>
        <button
          onClick={() => { setMode('text'); stopCamera(); }}
          className={`flex-1 py-5 flex items-center justify-center gap-3 font-bold transition-all ${mode === 'text' ? 'text-emerald-600 border-b-4 border-emerald-600 bg-white' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <Type size={22} />
          <span>نص مكتوب</span>
        </button>
      </div>

      <div className="p-8 min-h-[400px]">
        {mode === 'upload' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {mediaItems.map((item, index) => (
                <div key={index} className="relative group aspect-square rounded-2xl overflow-hidden border-2 border-emerald-50 bg-gray-50 flex flex-col items-center justify-center p-2">
                  {item.mimeType.startsWith('image/') ? (
                    <img src={`data:${item.mimeType};base64,${item.base64Data}`} className="w-full h-full object-cover rounded-xl" alt="Preview" />
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <FileText size={40} className="text-emerald-600" />
                      <span className="text-[10px] font-bold text-gray-500 text-center line-clamp-2 px-1">{item.fileName}</span>
                    </div>
                  )}
                  <button 
                    onClick={() => removeItem(index)}
                    className="absolute -top-1 -right-1 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              
              {mediaItems.length < 10 && (
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square rounded-2xl border-2 border-dashed border-emerald-200 flex flex-col items-center justify-center gap-2 text-emerald-600 hover:bg-emerald-50 transition-all"
                >
                  <Plus size={32} />
                  <span className="text-xs font-bold">أضف ملف</span>
                </button>
              )}
            </div>
            
            {mediaItems.length === 0 && (
              <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-3xl">
                <Upload size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-400 font-bold">لم تقم بإضافة أي ملفات بعد</p>
              </div>
            )}
            
            <input 
              ref={fileInputRef} 
              type="file" 
              multiple
              accept="image/*,application/pdf" 
              className="hidden" 
              onChange={handleFileChange}
            />
          </div>
        )}

        {mode === 'camera' && (
          <div className="w-full relative bg-gray-900 rounded-3xl overflow-hidden aspect-[4/3] shadow-inner">
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            <canvas ref={canvasRef} className="hidden" />
            <div className="absolute bottom-6 left-0 right-0 flex justify-center">
              <button onClick={capturePhoto} className="w-20 h-20 rounded-full border-8 border-white/30 bg-white hover:scale-110 transition-transform active:scale-90 shadow-2xl"></button>
            </div>
          </div>
        )}

        {mode === 'text' && (
          <textarea
            className="w-full h-72 p-6 border-2 border-gray-100 rounded-3xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 outline-none resize-none text-right text-lg font-medium bg-gray-50/30"
            placeholder="اكتب أو الصق أي نص تعليمي هنا..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          ></textarea>
        )}

        <div className="mt-10">
          <button
            onClick={handleContinueClick}
            disabled={isLoading || (mediaItems.length === 0 && !inputText)}
            className="w-full py-5 rounded-2xl bg-gray-900 text-white font-black text-xl shadow-xl hover:bg-emerald-600 hover:-translate-y-1 transition-all flex items-center justify-center gap-3 disabled:opacity-30 disabled:pointer-events-none"
          >
            المتابعة ({mediaItems.length} ملفات)
            <ArrowLeft size={24} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default InputSection;
