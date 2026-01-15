import React, { useState } from 'react';
import { QuizConfiguration, QuestionType, Difficulty } from '../types';
import { Settings, Users, Layers, ListChecks, ChevronLeft, ChevronDown } from 'lucide-react';

interface QuizConfigProps {
  onStartQuiz: (config: QuizConfiguration) => void;
  onBack: () => void;
  isLoading: boolean;
}

const QuizConfig: React.FC<QuizConfigProps> = ({ onStartQuiz, onBack, isLoading }) => {
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.Mixed);
  const [targetAge, setTargetAge] = useState<string>('16-18');
  const [selectedTypes, setSelectedTypes] = useState<QuestionType[]>([
    QuestionType.MultipleChoice,
    QuestionType.TrueFalse
  ]);

  const toggleType = (type: QuestionType) => {
    setSelectedTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const handleSubmit = () => {
    if (selectedTypes.length === 0) {
      alert("يرجى اختيار نوع واحد من الأسئلة على الأقل");
      return;
    }
    onStartQuiz({
      questionCount,
      difficulty,
      targetAge,
      questionTypes: selectedTypes
    });
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-emerald-100 animate-fadeIn">
      <div className="bg-emerald-600 p-6 text-white flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-1">إعدادات الاختبار</h2>
          <p className="opacity-90 text-sm">خصص الاختبار ليناسب احتياجاتك</p>
        </div>
        <Settings className="opacity-50" size={32} />
      </div>

      <div className="p-8 space-y-8">
        {/* Question Types */}
        <div>
          <label className="flex items-center gap-2 text-gray-800 font-bold mb-4">
            <ListChecks size={20} className="text-emerald-600" />
            أنواع الأسئلة
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { id: QuestionType.TrueFalse, label: 'صح أم خطأ' },
              { id: QuestionType.MultipleChoice, label: 'اختيار من متعدد' },
              { id: QuestionType.ShortAnswer, label: 'إجابة قصيرة' }
            ].map((type) => (
              <div 
                key={type.id}
                onClick={() => toggleType(type.id)}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all text-center font-medium
                  ${selectedTypes.includes(type.id)
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-gray-200 hover:border-emerald-200 text-gray-500'
                  }`}
              >
                {type.label}
              </div>
            ))}
          </div>
        </div>

        {/* Count and Age */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <label className="flex items-center gap-2 text-gray-800 font-bold mb-4">
              <Layers size={20} className="text-emerald-600" />
              عدد الأسئلة: {questionCount}
            </label>
            <input 
              type="range" 
              min="1" 
              max="20" 
              value={questionCount}
              onChange={(e) => setQuestionCount(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-2">
              <span>1</span>
              <span>10</span>
              <span>20</span>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-gray-800 font-bold mb-4">
              <Users size={20} className="text-emerald-600" />
              المرحلة الدراسية / العمر
            </label>
            <div className="relative">
              <select 
                value={targetAge}
                onChange={(e) => setTargetAge(e.target.value)}
                className="w-full p-3 pr-4 pl-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none appearance-none font-medium text-gray-700 bg-white"
              >
                <option value="6-9">6-9 سنوات (ابتدائي أولية)</option>
                <option value="10-12">10-12 سنة (ابتدائي عليا)</option>
                <option value="13-15">13-15 سنة (متوسط)</option>
                <option value="16-18">16-18 سنة (ثانوي)</option>
                <option value="19+">19+ سنة (جامعي/بالغين)</option>
              </select>
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-500">
                <ChevronDown size={20} />
              </div>
            </div>
          </div>
        </div>

        {/* Difficulty */}
        <div>
          <label className="flex items-center gap-2 text-gray-800 font-bold mb-4">
            <Settings size={20} className="text-emerald-600" />
            مستوى الصعوبة
          </label>
          <div className="flex bg-gray-100 p-1 rounded-xl">
            {[
              { id: Difficulty.Easy, label: 'سهل' },
              { id: Difficulty.Medium, label: 'متوسط' },
              { id: Difficulty.Hard, label: 'صعب' },
              { id: Difficulty.Mixed, label: 'مختلط' }
            ].map((lvl) => (
              <button
                key={lvl.id}
                onClick={() => setDifficulty(lvl.id)}
                className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all
                  ${difficulty === lvl.id
                    ? 'bg-white text-emerald-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                {lvl.label}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="pt-6 flex gap-4 border-t border-gray-100">
          <button
            onClick={onBack}
            disabled={isLoading}
            className="px-6 py-4 rounded-xl font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors flex items-center gap-2"
          >
            <ChevronLeft size={20} className="rotate-180" />
            رجوع
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex-1 bg-emerald-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                جاري إعداد الاختبار...
              </>
            ) : (
              'بدء الاختبار الآن ✨'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizConfig;