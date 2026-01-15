import React, { useState } from 'react';
import { QuizData, QuestionType, Difficulty } from '../types';
import { CheckCircle, HelpCircle, FileText, Check, XCircle, RotateCcw } from 'lucide-react';

interface QuizDisplayProps {
  quizData: QuizData;
  onReset: () => void;
}

const QuizDisplay: React.FC<QuizDisplayProps> = ({ quizData, onReset }) => {
  const [showAnswers, setShowAnswers] = useState(false);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});

  // Sorting Logic: True/False first, then Multiple Choice, then Short Answer
  const sortOrder: Record<string, number> = {
    [QuestionType.TrueFalse]: 1,
    [QuestionType.MultipleChoice]: 2,
    [QuestionType.ShortAnswer]: 3
  };

  const sortedQuestions = [...quizData.questions].sort((a, b) => {
     const orderA = sortOrder[a.type] || 99;
     const orderB = sortOrder[b.type] || 99;
     return orderA - orderB;
  });

  const handleSelectAnswer = (questionId: number, answer: string) => {
    if (showAnswers) return; // Prevent changing answers after checking
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const getDifficultyColor = (diff: Difficulty) => {
    switch (diff) {
      case Difficulty.Easy: return 'bg-green-100 text-green-800 border-green-200';
      case Difficulty.Medium: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case Difficulty.Hard: return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type: QuestionType) => {
    switch (type) {
      case QuestionType.MultipleChoice: return 'اختيار من متعدد';
      case QuestionType.TrueFalse: return 'صح أم خطأ';
      case QuestionType.ShortAnswer: return 'إجابة قصيرة';
      default: return type;
    }
  };

  const calculateScore = () => {
    let correct = 0;
    quizData.questions.forEach(q => {
      if (userAnswers[q.id] === q.correctAnswer) correct++;
    });
    return correct;
  };

  return (
    <div className="w-full max-w-4xl mx-auto pb-20">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-1">
             {quizData.topic || 'أسئلة المراجعة'}
          </h2>
          <p className="text-gray-500 flex items-center gap-2">
            <FileText size={16} />
            <span>عدد الأسئلة: {quizData.questions.length}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          {showAnswers && (
             <div className="bg-emerald-50 text-emerald-800 px-4 py-2 rounded-xl font-bold border border-emerald-100">
                النتيجة: {calculateScore()} / {quizData.questions.length}
             </div>
          )}
          <button
            onClick={onReset}
            className="flex items-center gap-2 text-gray-500 hover:text-emerald-600 transition-colors bg-gray-50 px-4 py-2 rounded-lg"
          >
            <RotateCcw size={18} />
            <span>مراجعة جديدة</span>
          </button>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-6">
        {sortedQuestions.map((q, index) => {
          const isCorrect = userAnswers[q.id] === q.correctAnswer;
          const userAnswer = userAnswers[q.id];

          return (
            <div key={q.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden transition-all hover:shadow-md">
              {/* Question Header */}
              <div className={`p-5 border-b flex justify-between items-start ${showAnswers ? (isCorrect ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100') : 'bg-gray-50/50 border-gray-100'}`}>
                <div className="flex items-center gap-3">
                  <span className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${showAnswers ? (isCorrect ? 'bg-green-500 text-white' : 'bg-red-500 text-white') : 'bg-emerald-600 text-white'}`}>
                    {index + 1}
                  </span>
                  <div className="flex gap-2">
                    <span className={`text-xs px-2 py-1 rounded-md font-medium border ${getDifficultyColor(q.difficulty)}`}>
                        {q.difficulty === 'Easy' ? 'سهل' : q.difficulty === 'Medium' ? 'متوسط' : 'صعب'}
                    </span>
                    <span className="text-xs text-gray-400 font-medium bg-white px-2 py-1 rounded border border-gray-100">
                        {getTypeLabel(q.type)}
                    </span>
                  </div>
                </div>
                {showAnswers && (
                  <div className="text-sm font-bold flex items-center gap-1">
                    {isCorrect ? <><Check size={16} className="text-green-600" /> <span className="text-green-700">صحيح</span></> : <><XCircle size={16} className="text-red-600" /> <span className="text-red-700">خطأ</span></>}
                  </div>
                )}
              </div>

              {/* Question Body */}
              <div className="p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-6 leading-relaxed">
                  {q.questionText}
                </h3>

                {/* Options for MC */}
                {q.type === QuestionType.MultipleChoice && q.options && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                    {q.options.map((opt, i) => {
                      const isSelected = userAnswer === opt;
                      const isThisCorrect = opt === q.correctAnswer;
                      
                      let optionClass = "border-gray-200 hover:bg-gray-50 text-gray-700";
                      
                      if (showAnswers) {
                        if (isThisCorrect) optionClass = "border-green-500 bg-green-50 text-green-800";
                        else if (isSelected && !isThisCorrect) optionClass = "border-red-500 bg-red-50 text-red-800";
                        else optionClass = "border-gray-100 opacity-50";
                      } else {
                        if (isSelected) optionClass = "border-emerald-500 bg-emerald-50 text-emerald-800 shadow-sm ring-1 ring-emerald-500";
                      }

                      return (
                        <div 
                          key={i} 
                          onClick={() => handleSelectAnswer(q.id, opt)}
                          className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${optionClass}`}
                        >
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold 
                            ${showAnswers && isThisCorrect ? 'border-green-500 text-green-600' : (isSelected ? 'border-emerald-500 text-emerald-600' : 'border-gray-300 text-gray-400')}`}>
                            {['أ', 'ب', 'ج', 'د'][i]}
                          </div>
                          <span>{opt}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* True/False UI */}
                {q.type === QuestionType.TrueFalse && (
                  <div className="flex gap-4 mb-4">
                    {['صح', 'خطأ'].map((val) => {
                       const isSelected = userAnswer === val;
                       const isThisCorrect = val === q.correctAnswer; 
                       
                       let btnClass = "border-gray-200 hover:bg-gray-50 text-gray-700";
                       if (showAnswers) {
                          if (isThisCorrect) btnClass = "border-green-500 bg-green-50 text-green-800";
                          else if (isSelected && !isThisCorrect) btnClass = "border-red-500 bg-red-50 text-red-800";
                          else btnClass = "border-gray-100 opacity-50";
                       } else {
                          if (isSelected) btnClass = "border-emerald-500 bg-emerald-50 text-emerald-800 shadow-sm ring-1 ring-emerald-500";
                       }

                       return (
                        <div 
                          key={val}
                          onClick={() => handleSelectAnswer(q.id, val)}
                          className={`flex-1 p-4 rounded-lg border-2 text-center cursor-pointer font-bold transition-all ${btnClass}`}
                        >
                          {val}
                        </div>
                       )
                    })}
                  </div>
                )}

                {/* Short Answer Placeholder */}
                {q.type === QuestionType.ShortAnswer && (
                  <div className="mb-4">
                    <textarea 
                      placeholder="اكتب إجابتك هنا..." 
                      value={userAnswers[q.id] || ''}
                      onChange={(e) => handleSelectAnswer(q.id, e.target.value)}
                      readOnly={showAnswers}
                      className={`w-full p-3 rounded-lg border-2 focus:ring-1 focus:ring-emerald-500 outline-none text-sm min-h-[80px]
                        ${showAnswers 
                          ? (isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50') 
                          : 'border-gray-200'}`}
                    />
                  </div>
                )}

                {/* Explanation Section */}
                {showAnswers && (
                  <div className="mt-6 animate-fadeIn">
                    <div className="bg-emerald-50 rounded-xl border border-emerald-100 p-4 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-1 h-full bg-emerald-500"></div>
                      
                      {!isCorrect && (
                         <div className="flex items-start gap-3 mb-2 pb-2 border-b border-emerald-200/50">
                          <div className="mt-1 text-emerald-600">
                            <CheckCircle size={20} />
                          </div>
                          <div>
                            <span className="block text-sm font-bold text-emerald-800 mb-1">الإجابة الصحيحة:</span>
                            <p className="text-gray-800 font-medium">{q.correctAnswer}</p>
                          </div>
                        </div>
                      )}

                      <div className="flex items-start gap-3 mt-2">
                        <div className="mt-1 text-emerald-500 opacity-70">
                          <HelpCircle size={18} />
                        </div>
                        <div>
                          <span className="block text-xs font-bold text-emerald-700 mb-1">الشرح:</span>
                          <p className="text-sm text-gray-600 leading-relaxed">{q.explanation}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Button - Placed at the end of the list */}
      {!showAnswers && (
        <div className="mt-8 mb-12 flex justify-center">
          <button
            onClick={() => setShowAnswers(true)}
            className="w-full max-w-md bg-gray-900 text-white py-4 rounded-xl shadow-xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-gray-800 hover:scale-[1.01] transition-all"
          >
            <Check size={24} className="text-emerald-400" />
            إنهاء الاختبار وعرض النتائج
          </button>
        </div>
      )}
    </div>
  );
};

export default QuizDisplay;