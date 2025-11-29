import React, { useState, useEffect } from 'react';
import { BudgetSettings, CategoryAllocation } from '../types';
import { X, Plus, Trash2, Save, PieChart, AlertTriangle } from 'lucide-react';
import { DEFAULT_BUDGET_SETTINGS } from '../utils/budgetUtils';

interface BudgetManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: BudgetSettings) => void;
  currentSettings: BudgetSettings | null;
}

const BudgetManager: React.FC<BudgetManagerProps> = ({ isOpen, onClose, onSave, currentSettings }) => {
  const [settings, setSettings] = useState<BudgetSettings>(DEFAULT_BUDGET_SETTINGS);
  
  useEffect(() => {
    if (isOpen) {
      setSettings(currentSettings || DEFAULT_BUDGET_SETTINGS);
    }
  }, [isOpen, currentSettings]);

  if (!isOpen) return null;

  const handleTotalChange = (val: string) => {
    const num = parseInt(val.replace(/,/g, ''), 10) || 0;
    setSettings({ ...settings, totalBudget: num });
  };

  const updateAllocation = (id: string, field: keyof CategoryAllocation, value: string | number) => {
    const newAllocations = settings.allocations.map(alloc => {
      if (alloc.id === id) {
        return { ...alloc, [field]: value };
      }
      return alloc;
    });
    setSettings({ ...settings, allocations: newAllocations });
  };

  const addAllocation = () => {
    const newId = `cat_${Date.now()}`;
    setSettings({
      ...settings,
      allocations: [...settings.allocations, { id: newId, name: '새 카테고리', percentage: 0 }]
    });
  };

  const removeAllocation = (id: string) => {
    setSettings({
      ...settings,
      allocations: settings.allocations.filter(a => a.id !== id)
    });
  };

  const totalPercentage = settings.allocations.reduce((sum, a) => sum + Number(a.percentage), 0);
  const isValid = totalPercentage === 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      <div className="glass-panel relative w-full max-w-2xl overflow-hidden rounded-2xl shadow-2xl animate-fade-in-up bg-white dark:bg-slate-900 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-xl font-bold">
              <PieChart className="h-6 w-6" />
              예산 관리 설정
            </h2>
            <button onClick={onClose} className="rounded-full p-1 hover:bg-white/10">
              <X size={20} />
            </button>
          </div>
          <p className="mt-2 text-sm text-emerald-100">
             연간 도서 구입 예산과 카테고리별 배정 비율을 설정하세요.
          </p>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
          
          {/* Total Budget Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">총 예산 (원)</label>
                <div className="relative">
                   <input 
                     type="text" 
                     value={settings.totalBudget.toLocaleString()}
                     onChange={(e) => handleTotalChange(e.target.value)}
                     className="w-full rounded-lg border border-gray-300 bg-gray-50 p-3 text-lg font-bold outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-gray-600 dark:bg-slate-700 dark:text-white"
                   />
                   <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">원</span>
                </div>
             </div>
             <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">예산 기간</label>
                <div className="flex gap-2">
                  <input 
                    type="date"
                    value={settings.startDate}
                    onChange={(e) => setSettings({...settings, startDate: e.target.value})}
                    className="flex-1 rounded-lg border border-gray-300 bg-gray-50 p-3 text-sm outline-none dark:border-gray-600 dark:bg-slate-700 dark:text-white"
                  />
                  <input 
                    type="date"
                    value={settings.endDate}
                    onChange={(e) => setSettings({...settings, endDate: e.target.value})}
                    className="flex-1 rounded-lg border border-gray-300 bg-gray-50 p-3 text-sm outline-none dark:border-gray-600 dark:bg-slate-700 dark:text-white"
                  />
                </div>
             </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700"></div>

          {/* Allocation Section */}
          <div className="space-y-4">
             <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-800 dark:text-gray-200">카테고리별 예산 배분</h3>
                <div className={`text-sm font-bold px-3 py-1 rounded-full ${isValid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                   합계: {totalPercentage}%
                </div>
             </div>
             
             <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 dark:bg-slate-800 dark:border-gray-700">
                <div className="space-y-3">
                   {settings.allocations.map((alloc) => (
                      <div key={alloc.id} className="flex items-center gap-3">
                         <input 
                           type="text"
                           value={alloc.name}
                           onChange={(e) => updateAllocation(alloc.id, 'name', e.target.value)}
                           className="flex-1 rounded-md border border-gray-300 p-2 text-sm outline-none focus:border-emerald-500 dark:border-gray-600 dark:bg-slate-700 dark:text-white"
                           placeholder="카테고리명"
                         />
                         <div className="flex items-center gap-2 w-32">
                            <input 
                              type="number"
                              value={alloc.percentage}
                              onChange={(e) => updateAllocation(alloc.id, 'percentage', parseFloat(e.target.value) || 0)}
                              className="w-full rounded-md border border-gray-300 p-2 text-sm outline-none focus:border-emerald-500 dark:border-gray-600 dark:bg-slate-700 dark:text-white"
                            />
                            <span className="text-gray-500">%</span>
                         </div>
                         <div className="w-32 text-right text-xs text-gray-500">
                            {(settings.totalBudget * (alloc.percentage / 100)).toLocaleString()}원
                         </div>
                         <button 
                           onClick={() => removeAllocation(alloc.id)}
                           className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                           disabled={settings.allocations.length <= 1}
                         >
                            <Trash2 size={16} />
                         </button>
                      </div>
                   ))}
                </div>
                <button 
                  onClick={addAllocation}
                  className="mt-4 flex items-center gap-2 text-sm font-medium text-emerald-600 hover:text-emerald-700"
                >
                   <Plus size={16} /> 카테고리 추가
                </button>
             </div>
             
             {!isValid && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg dark:bg-red-900/20 dark:text-red-400">
                   <AlertTriangle size={16} />
                   비율의 합계는 반드시 100%가 되어야 합니다. (현재 {totalPercentage}%)
                </div>
             )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 bg-gray-50 p-6 dark:border-gray-700 dark:bg-slate-800 shrink-0 flex justify-end gap-3">
           <button 
             onClick={onClose}
             className="px-5 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-slate-700"
           >
              취소
           </button>
           <button 
             onClick={() => {
                if(isValid) {
                   onSave(settings);
                   onClose();
                }
             }}
             disabled={!isValid}
             className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-600/20"
           >
              <Save size={16} /> 설정 저장
           </button>
        </div>
      </div>
    </div>
  );
};

export default BudgetManager;
