import React, { useState, useMemo } from 'react';
import { QuizData, QuestionType, Difficulty, Question } from '../types';
import { CheckCircle, HelpCircle, FileText, Check, RotateCcw, List, CheckSquare, Type, Loader2, Sparkles, Trophy, Award, Target } from 'lucide-react';
import { gradeShortAnswers } from '../services/geminiService';

interface QuizDisplayProps {
  quizData: QuizData;
  onReset: () => void;
}

interface GradeResult {
  questionId: number;
  isCorrect: boolean;
  feedback: string;
}

const QuizDisplay: React.FC<QuizDisplayProps> = ({ quizData, onReset }) => {
  const [showAnswers, setShowAnswers] = useState(false);
  const [isGrading, setIsGrading] = useState(false);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [aiGrades, setAiGrades] = useState<Record<number, GradeResult>>({});

  const normalizeText = (text: string | undefined): string => {
    if (!text) return "";
    return text.trim().toLowerCase()
      .replace(/[أإآ]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/ى/g, 'ي')
      .replace(/[\u064B-\u0652\u0670]/g, '')
      .replace(/\s+/g, ' ');
  };

  const getDifficultyLabel = (diff: string) => {
    switch (diff) {
      case 'Easy': return { text: 'سهل', color: 'bg-green-100 text-green-700 border-green-200' };
      case 'Medium': return { text: 'متوسط', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' };
      case 'Hard': return { text: 'صعب', color: 'bg-red-100 text-red-700 border-red-200' };
      default: return { text: 'مختلط', color: 'bg-gray-100 text-gray-700 border-gray-200' };
    }
  };

  const isAnswerCorrectLocal = (userAns: string | undefined, correctAns: string, type: QuestionType): boolean => {
    if (!userAns) return false;
    // We let AI handle ShortAnswer and FillInBlanks
    if (type === QuestionType.ShortAnswer || type === QuestionType.FillInBlanks) return false; 
    
    const normUser = normalizeText(userAns);
    const normCorrect = normalizeText(correctAns);

    const trueVariants = ["صح", "true", "yes", "صحيح", "صواب"];
    const falseVariants = ["خطا", "false", "no", "خاطئ", "خاطئه"];

    const isUserTrue = trueVariants.includes(normUser);
    const isUserFalse = falseVariants.includes(normUser);
    const isCorrectTrue = trueVariants.some(v => normCorrect.includes(v));
    const isCorrectFalse = falseVariants.some(v => normCorrect.includes(v));

    if (isUserTrue && isCorrectTrue) return true;
    if (isUserFalse && isCorrectFalse) return true;

    return normUser === normCorrect;
  };

  const handleFinishExam = async () => {
    setIsGrading(true);
    try {
      const textAnswerResults = await gradeShortAnswers(quizData.questions, userAnswers);
      const gradesMap: Record<number, GradeResult> = {};
      textAnswerResults.forEach(res => { gradesMap[res.questionId] = res; });
      setAiGrades(gradesMap);
      setShowAnswers(true);
      
      setTimeout(() => {
        const resultSection = document.getElementById('final-summary-card');
        resultSection?.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    } catch (error) {
      console.error(error);
      setShowAnswers(true);
    } finally {
      setIsGrading(false);
    }
  };

  const calculateScore = () => {
    let correct = 0;
    quizData.questions.forEach(q => {
      if (q.type === QuestionType.ShortAnswer || q.type === QuestionType.FillInBlanks) {
        if (aiGrades[q.id]?.isCorrect) correct++;
      } else {
        if (isAnswerCorrectLocal(userAnswers[q.id], q.correctAnswer, q.type)) correct++;
      }
    });
    return correct;
  };

  const groupedQuestions = useMemo(() => {
    const groups: Record<string, Question[]> = { 
      [QuestionType.TrueFalse]: [], 
      [QuestionType.MultipleChoice]: [], 
      [QuestionType.ShortAnswer]: [],
      [QuestionType.FillInBlanks]: []
    };
    quizData.questions.forEach(q => { if (groups[q.type]) groups[q.type].push(q); });
    return [
      { type: QuestionType.TrueFalse, label: 'الصح والخطأ', icon: <CheckSquare size={20} />, questions: groups[QuestionType.TrueFalse] },
      { type: QuestionType.MultipleChoice, label: 'الاختيار من متعدد', icon: <List size={20} />, questions: groups[QuestionType.MultipleChoice] },
      { type: QuestionType.FillInBlanks, label: 'إكمال الفراغ', icon: <Type size={20} />, questions: groups[QuestionType.FillInBlanks] },
      { type: QuestionType.ShortAnswer, label: 'الأسئلة المقالية', icon: <FileText size={20} />, questions: groups[QuestionType.ShortAnswer] }
    ].filter(g => g.questions.length > 0);
  }, [quizData]);

  const score = calculateScore();
  const total = quizData.questions.length;
  const percentage = Math.round((score / total) * 100);

  return (
    <div className="w-full max-w-4xl mx-auto pb-32">
      {isGrading && (
        <div className="fixed inset-0 bg-white/95 backdrop-blur-xl z-50 flex flex-col items-center justify-center animate-fadeIn">
          <Loader2 size={64} className="text-emerald-600 animate-spin mb-4" />
          <h3 className="text-2xl font-black text-gray-900">يتم الآن تصحيح اختبارك</h3>
          <p className="text-lg text-gray-500 mt-2 font-medium">رجاء الانتظار قليلاً...</p>
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 mb-10 flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-gray-900 mb-2">{quizData.topic || 'مراجعة المادة'}</h2>
          <div className="flex items-center gap-4 text-gray-500 font-bold">
            <span className="flex items-center gap-1"><FileText size={18}/> {total} أسئلة</span>
          </div>
        </div>
        <button onClick={onReset} className="flex items-center gap-2 text-red-500 bg-red-50 px-6 py-3 rounded-2xl font-black hover:bg-red-100 transition-all">
          <RotateCcw size={20} /> إعادة الاختبار
        </button>
      </div>

      <div className="space-y-12">
        {groupedQuestions.map((group) => (
          <div key={group.type} className="space-y-8">
            <div className="flex items-center gap-4 px-2">
              <div className="bg-gray-900 text-white p-3 rounded-2xl shadow-lg shadow-gray-200">{group.icon}</div>
              <h3 className="text-2xl font-black text-gray-800">{group.label}</h3>
            </div>

            {group.questions.map((q, idx) => {
              const userAnswer = userAnswers[q.id];
              const isCorrect = (q.type === QuestionType.ShortAnswer || q.type === QuestionType.FillInBlanks)
                ? aiGrades[q.id]?.isCorrect 
                : isAnswerCorrectLocal(userAnswer, q.correctAnswer, q.type);
              const diff = getDifficultyLabel(q.difficulty);

              return (
                <div key={q.id} className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden transition-all duration-300">
                  <div className={`px-8 py-5 border-b flex justify-between items-center ${showAnswers ? (isCorrect ? 'bg-green-50/50' : 'bg-red-50/50') : 'bg-gray-50/30'}`}>
                    <div className="flex items-center gap-4">
                      <span className={`w-10 h-10 flex items-center justify-center rounded-2xl font-black text-lg ${showAnswers ? (isCorrect ? 'bg-green-500 text-white' : 'bg-red-500 text-white') : 'bg-gray-900 text-white'}`}>
                        {idx + 1}
                      </span>
                      <span className="text-xs font-black text-gray-400 uppercase">سؤال {idx + 1}</span>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-wider ${diff.color}`}>
                      {diff.text}
                    </span>
                  </div>

                  <div className="p-10">
                    <h4 className="text-2xl font-bold text-gray-900 mb-10 leading-relaxed">{q.questionText}</h4>

                    {q.type === QuestionType.TrueFalse && (
                      <div className="flex gap-4">
                        {['صح', 'خطأ'].map(val => {
                          const isSelected = userAnswer === val;
                          const normVal = normalizeText(val);
                          const normCorrect = normalizeText(q.correctAnswer);
                          
                          const trueVariants = ["صح", "true", "yes", "صحيح"];
                          const falseVariants = ["خطا", "false", "no", "خاطئ"];
                          const isCorrectOption = (trueVariants.includes(normVal) && trueVariants.some(v => normCorrect.includes(v))) ||
                                                 (falseVariants.includes(normVal) && falseVariants.some(v => normCorrect.includes(v)));

                          let c = isSelected ? "border-emerald-600 bg-emerald-50 ring-2 ring-emerald-500/20" : "border-gray-200 hover:border-emerald-200";
                          if (showAnswers) {
                            if (isCorrectOption) c = "border-green-500 bg-green-50 ring-2 ring-green-200";
                            else if (isSelected) c = "border-red-500 bg-red-50 opacity-100";
                            else c = "opacity-40 grayscale";
                          }

                          return (
                            <button key={val} onClick={() => !showAnswers && setUserAnswers({...userAnswers, [q.id]: val})} className={`flex-1 py-6 rounded-3xl border-4 font-black text-xl transition-all ${c}`}>{val}</button>
                          );
                        })}
                      </div>
                    )}

                    {q.type === QuestionType.MultipleChoice && q.options && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {q.options.map((opt, i) => {
                          const isSelected = userAnswer === opt;
                          const isThisCorrect = normalizeText(opt) === normalizeText(q.correctAnswer);
                          let c = isSelected ? "border-emerald-600 bg-emerald-50 ring-2 ring-emerald-500/20" : "border-gray-200 hover:border-emerald-200";
                          if (showAnswers) c = isThisCorrect ? "border-green-500 bg-green-50 ring-2 ring-green-200" : (isSelected ? "border-red-500 bg-red-50 opacity-100" : "opacity-40 grayscale");
                          return (
                            <button key={i} onClick={() => !showAnswers && setUserAnswers({...userAnswers, [q.id]: opt})} className={`p-6 rounded-3xl border-4 text-right flex items-center gap-4 font-bold text-lg transition-all ${c}`}>
                              <span className="w-10 h-10 rounded-2xl bg-gray-100 flex items-center justify-center border text-gray-500 font-black">{i+1}</span>
                              <span className="flex-1">{opt}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {(q.type === QuestionType.ShortAnswer || q.type === QuestionType.FillInBlanks) && (
                      <textarea
                        disabled={showAnswers}
                        className={`w-full p-8 rounded-[2rem] border-4 text-xl font-bold bg-gray-50/50 min-h-[140px] outline-none transition-all ${showAnswers ? (isCorrect ? 'border-green-500 bg-green-50/50' : 'border-red-500 bg-red-50/50') : 'border-gray-100 focus:border-emerald-500 focus:bg-white'}`}
                        placeholder={q.type === QuestionType.FillInBlanks ? "اكتب الكلمة الناقصة هنا..." : "أجب هنا..."}
                        value={userAnswers[q.id] || ''}
                        onChange={(e) => setUserAnswers({...userAnswers, [q.id]: e.target.value})}
                      />
                    )}

                    {showAnswers && (
                      <div className="mt-10 animate-fadeIn bg-gray-50/80 rounded-[2rem] p-8 border border-gray-100">
                        {aiGrades[q.id]?.feedback && (
                          <div className="mb-6 pb-6 border-b border-gray-200/50 flex gap-4">
                            <Sparkles className="text-emerald-500 shrink-0" size={24} />
                            <div>
                               <p className="font-black text-emerald-800 text-sm mb-1 uppercase tracking-wider">رأي الخبير:</p>
                               <p className="text-gray-700 font-medium">"{aiGrades[q.id].feedback}"</p>
                            </div>
                          </div>
                        )}
                        {!isCorrect && (
                          <div className="mb-6 flex items-start gap-4">
                             <CheckCircle className="text-green-500 shrink-0" size={24} />
                             <div>
                               <p className="font-black text-green-800 text-sm mb-1">الإجابة الصحيحة:</p>
                               <p className="text-gray-900 font-bold text-lg">{q.correctAnswer}</p>
                             </div>
                          </div>
                        )}
                        <div className="flex items-start gap-4">
                           <HelpCircle className="text-emerald-400 shrink-0" size={24} />
                           <div>
                             <p className="font-black text-gray-400 text-sm mb-1">توضيح إضافي:</p>
                             <p className="text-gray-600 font-medium leading-relaxed">{q.explanation}</p>
                           </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {!showAnswers && (
        <div className="mt-20 flex justify-center">
          <button onClick={handleFinishExam} className="w-full max-w-md bg-gray-900 text-white py-8 rounded-[2.5rem] font-black text-2xl shadow-2xl hover:bg-emerald-600 hover:-translate-y-2 transition-all flex items-center justify-center gap-4">
            <Check size={32} className="text-emerald-400" /> إنهاء وتصحيح الاختبار
          </button>
        </div>
      )}

      {showAnswers && (
        <div id="final-summary-card" className="mt-24 animate-fadeIn">
          <div className="bg-white rounded-[3rem] p-12 text-gray-900 shadow-2xl border-4 border-emerald-500 text-center relative overflow-hidden">
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
                {percentage >= 50 ? <Trophy size={48} className="text-emerald-600" /> : <Target size={48} className="text-emerald-600" />}
              </div>
              
              <h2 className="text-4xl font-black mb-10">النتيجة النهائية</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-lg my-6">
                <div className="bg-gray-50 rounded-3xl p-8 border-2 border-gray-100">
                  <p className="text-emerald-600 font-black text-5xl mb-2">{score} من {total}</p>
                  <p className="text-gray-400 text-sm font-bold uppercase">الإجابات الصحيحة</p>
                </div>
                <div className="bg-emerald-600 rounded-3xl p-8 shadow-xl shadow-emerald-200">
                  <p className="text-white font-black text-6xl mb-2 tracking-tighter">%{percentage}</p>
                  <p className="text-white/80 text-sm font-bold uppercase">النسبة المئوية</p>
                </div>
              </div>

              <div className="my-10 px-6">
                <p className="text-xl font-bold text-gray-700 italic">
                   {percentage === 100 ? "أداء ممتاز! لقد أجبت على كافة الأسئلة بشكل صحيح." :
                    percentage >= 70 ? "عمل رائع! مستواك جيد جداً في هذه المادة." :
                    "بداية جيدة! راجع الأخطاء الموضحة أعلاه لتقوية معلوماتك."}
                </p>
              </div>

              <button onClick={onReset} className="bg-gray-900 text-white px-12 py-5 rounded-2xl font-black text-xl hover:bg-emerald-600 transition-all flex items-center gap-3">
                <RotateCcw size={24} /> اختبار جديد
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizDisplay;