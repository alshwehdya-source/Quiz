import React, { useState } from 'react';
import { generateQuizFromContent } from './services/geminiService';
import InputSection from './components/InputSection';
import QuizDisplay from './components/QuizDisplay';
import QuizConfig from './components/QuizConfig';
import { QuizData, QuizConfiguration } from './types';
import { BookOpen, Sparkles } from 'lucide-react';

type AppStep = 'input' | 'config' | 'quiz';

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>('input');
  
  // Stored Input Data
  const [pendingText, setPendingText] = useState<string>('');
  const [pendingBase64, setPendingBase64] = useState<string | null>(null);
  const [pendingMime, setPendingMime] = useState<string | null>(null);

  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputComplete = (text: string, base64Data: string | null, mimeType: string | null) => {
    setPendingText(text);
    setPendingBase64(base64Data);
    setPendingMime(mimeType);
    setStep('config');
  };

  const handleStartQuiz = async (config: QuizConfiguration) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await generateQuizFromContent({
        text: pendingText || undefined,
        base64Data: pendingBase64 || undefined,
        mimeType: pendingMime || undefined,
        config: config
      });
      setQuizData(data);
      setStep('quiz');
    } catch (err) {
      console.error(err);
      setError("حدث خطأ أثناء إنشاء الاختبار. يرجى المحاولة مرة أخرى.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setQuizData(null);
    setError(null);
    setStep('input');
    // We don't necessarily clear pending input here in case they want to reuse it, 
    // but typically reset means "start over".
    setPendingText('');
    setPendingBase64(null);
    setPendingMime(null);
  };

  const handleBackToInput = () => {
    setStep('input');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
      {/* Navbar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={handleReset}>
            <div className="bg-emerald-600 p-2 rounded-lg text-white">
               <BookOpen size={20} />
            </div>
            <h1 className="text-xl font-extrabold text-gray-800 tracking-tight">
              معلّم <span className="text-emerald-600">AI</span>
            </h1>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
            <Sparkles size={14} className="text-yellow-500" />
            <span>مدعوم بـ Gemini 3.0</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-8">
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-r-4 border-red-500 text-red-700 rounded-lg flex items-center justify-between">
            <p className="font-medium">{error}</p>
            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-800">
              ✕
            </button>
          </div>
        )}

        {step === 'input' && (
          <div className="animate-fade-in-up">
            <div className="text-center mb-10 mt-4">
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">
                حول موادك الدراسية إلى <span className="text-emerald-600 underline decoration-4 decoration-emerald-200">اختبار تفاعلي</span>
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                استخدم الذكاء الاصطناعي لتوليد أسئلة مراجعة ذكية من كتبك، ملفات PDF، أو صور أوراق العمل فوراً.
              </p>
            </div>
            
            <InputSection onContinue={handleInputComplete} isLoading={false} />
            
            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 text-center">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">📸</div>
                <h3 className="font-bold text-gray-800 mb-2">تحليل الصور والملفات</h3>
                <p className="text-sm text-gray-500">ارفع ملف PDF أو التقط صورة لأي صفحة وسيقوم الذكاء الاصطناعي بتحليلها.</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">🧠</div>
                <h3 className="font-bold text-gray-800 mb-2">أسئلة ذكية</h3>
                <p className="text-sm text-gray-500">خصص عدد ونوع وصعوبة الأسئلة لتناسب احتياجاتك.</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">✅</div>
                <h3 className="font-bold text-gray-800 mb-2">تصحيح فوري</h3>
                <p className="text-sm text-gray-500">احصل على الإجابات الصحيحة مع الشرح المبسط بعد المحاولة.</p>
              </div>
            </div>
          </div>
        )}

        {step === 'config' && (
          <QuizConfig 
            onStartQuiz={handleStartQuiz} 
            onBack={handleBackToInput} 
            isLoading={isLoading} 
          />
        )}

        {step === 'quiz' && quizData && (
          <div className="animate-fade-in">
             <QuizDisplay quizData={quizData} onReset={handleReset} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6 mt-auto">
        <div className="max-w-5xl mx-auto px-4 text-center text-gray-400 text-sm">
          <p>© {new Date().getFullYear()} Muallim AI. تم التطوير للمساعدة في التعلم.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;