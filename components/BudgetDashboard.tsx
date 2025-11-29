
import React, { useState } from 'react';
import { BudgetStatus } from '../types';
import { ChevronDown, ChevronUp, AlertCircle, TrendingUp, PieChart } from 'lucide-react';

interface BudgetDashboardProps {
  status: BudgetStatus;
  compact?: boolean; // For mobile modal usage
}

const ProgressBar: React.FC<{ percentage: number; colorClass?: string; height?: string }> = ({ 
  percentage, 
  colorClass = "bg-emerald-500", 
  height = "h-2.5" 
}) => {
  const safePercentage = Math.min(Math.max(percentage, 0), 100);
  return (
    <div className={`w-full rounded-full bg-gray-200 dark:bg-gray-700 ${height}`}>
      <div 
        className={`${height} rounded-full transition-all duration-500 ease-out ${colorClass}`} 
        style={{ width: `${safePercentage}%` }}
      ></div>
    </div>
  );
};

const BudgetDashboard: React.FC<BudgetDashboardProps> = ({ status, compact = false }) => {
  const [isExpanded, setIsExpanded] = useState(!compact);

  // Determine main color based on alert level
  const getMainColor = () => {
    switch (status.alertLevel) {
      case 'danger': return 'bg-red-500';
      case 'warning': return 'bg-orange-500';
      default: return 'bg-emerald-500';
    }
  };

  const getMainTextColor = () => {
    switch (status.alertLevel) {
      case 'danger': return 'text-red-600 dark:text-red-400';
      case 'warning': return 'text-orange-600 dark:text-orange-400';
      default: return 'text-emerald-600 dark:text-emerald-400';
    }
  };

  return (
    <div className={`
      bg-white border border-gray-200 shadow-sm overflow-hidden dark:bg-slate-800 dark:border-gray-700 transition-all
      ${compact ? 'rounded-xl' : 'rounded-2xl mb-4'}
    `}>
      {/* Header Summary */}
      <div 
        className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50 ${compact ? 'p-3' : 'p-4'}`} 
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${status.alertLevel === 'danger' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
               <TrendingUp size={16} />
            </div>
            <h3 className="font-bold text-gray-800 dark:text-gray-200 text-sm md:text-base">예산 현황</h3>
            {status.alertLevel !== 'safe' && (
               <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${status.alertLevel === 'danger' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                  {status.alertLevel === 'danger' ? '초과' : '주의'}
               </span>
            )}
          </div>
          {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </div>

        <div className="flex items-end justify-between mb-1">
           <span className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
              {status.totalUsed.toLocaleString()}
              <span className="text-sm font-normal text-gray-500 ml-1">원</span>
           </span>
           <span className="text-xs text-gray-500">
              {status.totalUsagePercentage.toFixed(1)}%
           </span>
        </div>
        
        <ProgressBar percentage={status.totalUsagePercentage} colorClass={getMainColor()} />
        
        <div className="mt-1 flex justify-end text-xs font-medium text-gray-500">
           잔액: {status.totalRemaining.toLocaleString()}원
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t border-gray-100 bg-gray-50/50 p-4 dark:border-gray-700 dark:bg-slate-800/50 animate-fade-in-up">
           <div className="flex items-center gap-2 mb-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
              <PieChart size={12} />
              카테고리별 현황
           </div>
           <div className="space-y-3">
              {status.categoryStatuses.map(cat => (
                 <div key={cat.id}>
                    <div className="flex justify-between text-xs mb-1">
                       <span className="font-medium text-gray-700 dark:text-gray-300">
                          {cat.name}
                       </span>
                       <span className={cat.isExceeded ? 'text-red-600 font-bold' : 'text-gray-500'}>
                          {cat.usedAmount.toLocaleString()} <span className="text-gray-300">/</span> {cat.allocatedAmount.toLocaleString()}
                       </span>
                    </div>
                    <ProgressBar 
                       percentage={cat.usagePercentage} 
                       colorClass={cat.isExceeded ? 'bg-red-500' : 'bg-blue-500'} 
                       height="h-1.5"
                    />
                 </div>
              ))}
           </div>
           
           {status.isTotalExceeded && (
              <div className="mt-4 flex items-start gap-2 rounded-lg bg-red-50 p-3 text-xs text-red-700 dark:bg-red-900/20 dark:text-red-300">
                 <AlertCircle size={14} className="mt-0.5 shrink-0" />
                 <div>
                    <span className="font-bold block mb-1">예산 초과 경고</span>
                    총 예산 범위를 초과했습니다.
                 </div>
              </div>
           )}
        </div>
      )}
    </div>
  );
};

export default BudgetDashboard;
