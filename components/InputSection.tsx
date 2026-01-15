import React, { useState, useRef } from 'react';
import { Camera, Upload, Type, X, Image as ImageIcon, FileText, ArrowLeft } from 'lucide-react';

interface InputSectionProps {
  onContinue: (text: string, base64Data: string | null, mimeType: string | null) => void;
  isLoading: boolean;
}

const InputSection: React.FC<InputSectionProps> = ({ onContinue, isLoading }) => {
  const [mode, setMode] = useState<'upload' | 'camera' | 'text'>('upload');
  const [inputText, setInputText] = useState('');
  const [previewData, setPreviewData] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  // File Upload Handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
        alert('يرجى رفع صورة أو ملف PDF فقط');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPreviewData(result); // Full data URL for preview/sending
        setMimeType(file.type);
        setFileName(file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  // Camera Handlers
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
      alert("تعذر الوصول إلى الكاميرا. يرجى التحقق من الأذونات.");
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
        setPreviewData(dataUrl);
        setMimeType('image/jpeg');
        setFileName('photo.jpg');
        stopCamera();
      }
    }
  };

  const handleContinueClick = () => {
    // Process inputs based on what is available
    let finalBase64 = null;
    if (previewData) {
      finalBase64 = previewData.split(',')[1];
    }
    
    if (!inputText && !finalBase64) {
      alert("يرجى إدخال نص أو صورة للمتابعة");
      return;
    }

    onContinue(inputText, finalBase64, mimeType);
  };

  const clearContent = () => {
    setPreviewData(null);
    setMimeType(null);
    setFileName(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    stopCamera();
  };

  // Clean up camera on unmount or mode switch
  React.useEffect(() => {
    return () => stopCamera();
  }, [mode]);

  return (
    <div className="w-full max-w-3xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-emerald-100">
      <div className="bg-emerald-600 p-6 text-white text-center">
        <h2 className="text-2xl font-bold mb-2">ماذا تريد أن تراجع اليوم؟</h2>
        <p className="opacity-90">قم برفع ملف PDF، صورة، أو لصق نص</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => { setMode('upload'); clearContent(); }}
          className={`flex-1 py-4 flex items-center justify-center gap-2 font-medium transition-colors ${mode === 'upload' ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Upload size={20} />
          <span>رفع ملف</span>
        </button>
        <button
          onClick={() => { setMode('camera'); startCamera(); clearContent(); }}
          className={`flex-1 py-4 flex items-center justify-center gap-2 font-medium transition-colors ${mode === 'camera' ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Camera size={20} />
          <span>الكاميرا</span>
        </button>
        <button
          onClick={() => { setMode('text'); clearContent(); }}
          className={`flex-1 py-4 flex items-center justify-center gap-2 font-medium transition-colors ${mode === 'text' ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Type size={20} />
          <span>نص مباشر</span>
        </button>
      </div>

      <div className="p-6 min-h-[300px] flex flex-col justify-center items-center">
        {mode === 'upload' && !previewData && (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="w-full border-2 border-dashed border-gray-300 rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50 transition-all group"
          >
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Upload size={32} />
            </div>
            <p className="text-gray-600 font-medium mb-1">اضغط لرفع ملف</p>
            <p className="text-gray-400 text-sm">ندعم الصور (JPG, PNG) وملفات PDF</p>
            <input 
              ref={fileInputRef} 
              type="file" 
              accept="image/*,application/pdf" 
              className="hidden" 
              onChange={handleFileChange}
            />
          </div>
        )}

        {mode === 'camera' && !previewData && (
          <div className="w-full relative bg-black rounded-xl overflow-hidden aspect-[4/3]">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="w-full h-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />
            <div className="absolute bottom-4 left-0 right-0 flex justify-center">
              <button 
                onClick={capturePhoto}
                className="w-16 h-16 rounded-full border-4 border-white bg-red-500 hover:bg-red-600 shadow-lg transition-transform active:scale-95"
              ></button>
            </div>
            {!isCameraActive && (
               <div className="absolute inset-0 flex items-center justify-center text-white bg-black/50">
                  <p>جاري تشغيل الكاميرا...</p>
               </div>
            )}
          </div>
        )}

        {mode === 'text' && (
          <textarea
            className="w-full h-64 p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none text-right"
            placeholder="الصق النص هنا..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          ></textarea>
        )}

        {/* Preview Area */}
        {previewData && (
          <div className="relative w-full max-w-md mx-auto mt-4 rounded-xl overflow-hidden border border-gray-200 shadow-md bg-gray-50">
            
            {/* Image Preview */}
            {mimeType?.startsWith('image') && (
              <img src={previewData} alt="Preview" className="w-full h-auto" />
            )}

            {/* PDF Preview */}
            {mimeType === 'application/pdf' && (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-lg flex items-center justify-center mb-3">
                  <FileText size={36} />
                </div>
                <p className="font-bold text-gray-700 break-all">{fileName}</p>
                <p className="text-sm text-gray-500 mt-1">جاهز للتحليل</p>
              </div>
            )}

            <button 
              onClick={clearContent}
              className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 shadow-sm z-10"
              title="حذف الملف"
            >
              <X size={20} />
            </button>
            
            {mode === 'camera' && (
                <button 
                onClick={() => { clearContent(); startCamera(); }}
                className="absolute bottom-2 right-2 bg-white/90 text-gray-800 px-3 py-1 rounded-lg text-sm font-medium shadow-sm z-10"
              >
                إعادة التصوير
              </button>
            )}
          </div>
        )}

        {/* Action Button */}
        <div className="w-full mt-8">
          <button
            onClick={handleContinueClick}
            disabled={isLoading || (!inputText && !previewData)}
            className={`w-full py-4 rounded-xl text-lg font-bold shadow-lg transition-all flex items-center justify-center gap-2
              ${isLoading || (!inputText && !previewData)
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-emerald-200 hover:-translate-y-1'
              }`}
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                المتابعة للإعدادات
                <ArrowLeft size={20} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InputSection;