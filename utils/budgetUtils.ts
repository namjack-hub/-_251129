import { Book, BudgetSettings, BudgetStatus, CategoryStatus } from '../types';

// Default allocations if none provided
export const DEFAULT_BUDGET_SETTINGS: BudgetSettings = {
  totalBudget: 10000000, // 10 million KRW
  startDate: new Date().toISOString().split('T')[0],
  endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
  allocations: [
    { id: 'lit', name: '문학', percentage: 30 },
    { id: 'soc', name: '사회과학', percentage: 20 },
    { id: 'sci', name: '자연과학', percentage: 15 },
    { id: 'art', name: '예술', percentage: 10 },
    { id: 'tech', name: '기술/컴퓨터', percentage: 10 },
    { id: 'child', name: '아동/청소년', percentage: 10 },
    { id: 'other', name: '기타', percentage: 5 },
  ]
};

// Helper to determine alert level
export const getAlertLevel = (percentage: number): 'safe' | 'warning' | 'danger' => {
  if (percentage >= 100) return 'danger';
  if (percentage >= 80) return 'warning';
  return 'safe';
};

// Map a book's Aladin category string to a defined budget category
// Aladin categories are like "Domestic > Fiction > Korean Fiction"
export const matchCategory = (bookCategory: string | undefined, settings: BudgetSettings): string => {
  if (!bookCategory) return 'other';
  
  const allocations = settings.allocations;
  
  // Try to find a match in the book category string
  for (const alloc of allocations) {
    if (alloc.id === 'other') continue;
    // Simple inclusion check. "Literature" matches "Korean Literature"
    // Ideally user defines mapping keywords, but for now we match by name
    if (bookCategory.includes(alloc.name)) {
      return alloc.id;
    }
    // Mapping common synonyms
    if (alloc.name === '문학' && (bookCategory.includes('소설') || bookCategory.includes('에세이') || bookCategory.includes('시'))) return alloc.id;
    if (alloc.name === '기술/컴퓨터' && (bookCategory.includes('공학') || bookCategory.includes('IT'))) return alloc.id;
    if (alloc.name === '사회과학' && (bookCategory.includes('경제') || bookCategory.includes('경영') || bookCategory.includes('정치'))) return alloc.id;
  }
  
  const otherCat = allocations.find(a => a.id === 'other');
  return otherCat ? otherCat.id : allocations[0]?.id || 'unknown';
};

export const calculateBudgetStatus = (books: Book[], settings: BudgetSettings): BudgetStatus => {
  const { totalBudget, allocations } = settings;
  
  // Initialize category calculations
  const catMap = new Map<string, CategoryStatus>();
  
  allocations.forEach(alloc => {
    const allocatedAmount = Math.floor(totalBudget * (alloc.percentage / 100));
    catMap.set(alloc.id, {
      id: alloc.id,
      name: alloc.name,
      allocatedAmount,
      usedAmount: 0,
      remainingAmount: allocatedAmount,
      usagePercentage: 0,
      bookCount: 0,
      isExceeded: false
    });
  });

  // Accumulate usage
  let totalUsed = 0;
  
  books.forEach(book => {
    const price = book.priceSales;
    totalUsed += price;
    
    const catId = matchCategory(book.categoryName, settings);
    const catStat = catMap.get(catId);
    
    if (catStat) {
      catStat.usedAmount += price;
      catStat.bookCount += 1;
    } else {
        // Fallback if 'other' is missing or matching failed oddly, add to first or create temp
        // Ideally should be covered by matchCategory returning valid ID
    }
  });

  // Finalize category stats
  const categoryStatuses: CategoryStatus[] = [];
  catMap.forEach(stat => {
    stat.remainingAmount = stat.allocatedAmount - stat.usedAmount;
    stat.usagePercentage = stat.allocatedAmount > 0 ? (stat.usedAmount / stat.allocatedAmount) * 100 : 0;
    stat.isExceeded = stat.usedAmount > stat.allocatedAmount;
    categoryStatuses.push(stat);
  });

  const totalUsagePercentage = totalBudget > 0 ? (totalUsed / totalBudget) * 100 : 0;
  
  return {
    totalBudget,
    totalUsed,
    totalRemaining: totalBudget - totalUsed,
    totalUsagePercentage,
    categoryStatuses,
    isTotalExceeded: totalUsed > totalBudget,
    alertLevel: getAlertLevel(totalUsagePercentage)
  };
};
