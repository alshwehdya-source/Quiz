import React, { useState } from 'react';
import { generateQuizFromContent } from './services/geminiService';
import InputSection from './components/InputSection';
import QuizDisplay from './components/QuizDisplay';
import QuizConfig from './components/QuizConfig';
import { QuizData, QuizConfiguration, MediaItem } from './types';
import { BookOpen, Sparkles } from 'lucide-react';

type AppStep = 'input' | 'config' | 'quiz';

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>('input');
  
  const [pendingText, setPendingText] = useState<string>('');
  const [pendingMedia, setPendingMedia] = useState<MediaItem[]>([]);

  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputComplete = (text: string, mediaItems: MediaItem[]) => {
    setPendingText(text);
    setPendingMedia(mediaItems);
    setStep('config');
  };

  const handleStartQuiz = async (config: QuizConfiguration) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await generateQuizFromContent({
        text: pendingText || undefined,
        mediaItems: pendingMedia,
        config: config
      });
      setQuizData(data);
      setStep('quiz');
    } catch (err) {
      console.error(err);
      setError("حدث خطأ أثناء إنشاء الاختبار. يرجى التأكد من جودة الصور أو حجم الملفات.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setQuizData(null);
    setError(null);
    setStep('input');
    setPendingText('');
    setPendingMedia([]);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans overflow-x-hidden">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm backdrop-blur-md bg-white/80">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={handleReset}>
            <div className="bg-gray-900 p-3 rounded-2xl text-white group-hover:bg-emerald-600 transition-colors shadow-lg shadow-gray-200">
               <BookOpen size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight leading-none">Quiz AI <span className="text-emerald-600">2026</span></h1>
              <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">Digital Teacher</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-black text-emerald-700 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100">
            <Sparkles size={12} className="text-emerald-500 animate-pulse" />
            <span>AI ENGINE ENABLED</span>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-6xl mx-auto px-6 py-12">
        {error && (
          <div className="mb-10 p-6 bg-red-50 border-r-8 border-red-500 text-red-700 rounded-3xl flex items-center justify-between animate-fadeIn shadow-xl shadow-red-100/50">
            <p className="font-black text-lg">{error}</p>
            <button onClick={() => setError(null)} className="text-red-500 hover:scale-125 transition-transform font-bold text-2xl">✕</button>
          </div>
        )}

        {step === 'input' && (
          <div className="animate-fadeIn">
            <div className="text-center mb-16">
              <h2 className="text-5xl md:text-6xl font-black text-gray-900 mb-6 tracking-tighter">
                طور دراستك <span className="text-emerald-600">بذكاء</span>
              </h2>
              <p className="text-xl text-gray-500 max-w-2xl mx-auto font-medium leading-relaxed">
                ارفع كتبك، مذكراتك، أو صور أوراقك.. وسيقوم <span className="font-black text-gray-900 underline decoration-emerald-400 decoration-4">Quiz AI</span> بتوليد اختبارات ذكية فوراً.
              </p>
            </div>
            <InputSection onContinue={handleInputComplete} isLoading={false} />
          </div>
        )}

        {step === 'config' && (
          <QuizConfig onStartQuiz={handleStartQuiz} onBack={() => setStep('input')} isLoading={isLoading} />
        )}

        {step === 'quiz' && quizData && (
          <QuizDisplay quizData={quizData} onReset={handleReset} />
        )}
      </main>

      <footer className="bg-white border-t border-gray-100 py-16 mt-auto">
        <div className="max-w-6xl mx-auto px-6 flex flex-col items-center gap-8">
          <div className="text-center">
            <p className="text-gray-900 font-black text-4xl mb-2">Quiz AI</p>
            <p className="text-gray-400 text-lg font-medium">مستقبلك يبدأ بمراجعة ذكية.</p>
          </div>
          
          <div className="flex gap-6">
            <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 border border-gray-100 font-bold">AI</div>
            <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 border border-gray-100 font-bold">2026</div>
          </div>
          
          <div className="w-full h-px bg-gray-50 max-w-sm"></div>
          
          <p className="text-gray-400 text-sm font-bold">
            © {new Date().getFullYear()} كافة الحقوق محفوظة.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;