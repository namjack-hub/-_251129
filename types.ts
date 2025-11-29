

export interface Book {
  id: string;
  title: string;
  author: string;
  publisher: string;
  pubDate: string;
  cover: string;
  description: string;
  isbn13: string;
  priceStandard: number;
  priceSales: number;
  link: string;
  categoryName?: string;
  status?: BookStatus; // New field for Kanban
}

export type BookStatus = 'discovery' | 'review' | 'confirmed';

export interface ApiKeys {
  aladinTtb: string;
  nlkApiKey?: string; // National Library of Korea API Key
}

export type FetchSource = 'combined' | 'bestseller' | 'itemNewSpecial' | 'editorRecommend';

export type SearchTarget = 'Keyword' | 'Title' | 'Author' | 'Publisher';

export interface CartItem extends Book {
  addedAt: number;
}

export interface GeminiAnalysis {
  summary: string;
  budgetAnalysis: string;
  categoryBreakdown: string;
  recommendationScore: number;
}

// --- New Types for Filtering & Sorting ---

export type PriceRangeOption = 'all' | 'under_10k' | '10k_20k' | '20k_30k' | 'over_30k';
export type PubYearOption = 'all' | '1yr' | '3yr' | '5yr';
export type SortField = 'pubDate' | 'priceSales' | 'title' | 'author';
export type SortDirection = 'asc' | 'desc';

export interface FilterState {
  priceRange: PriceRangeOption;
  categories: string[]; // Selected category names
  pubYear: PubYearOption;
  publishers: string[]; // Selected publisher names
}

export interface SortState {
  field: SortField;
  direction: SortDirection;
}

// --- Budget Management Types ---

export interface CategoryAllocation {
  id: string;
  name: string; // e.g., "Literature", "Science"
  percentage: number; // 0-100
}

export interface BudgetSettings {
  totalBudget: number;
  startDate: string;
  endDate: string;
  allocations: CategoryAllocation[];
}

export interface CategoryStatus {
  id: string;
  name: string;
  allocatedAmount: number;
  usedAmount: number;
  remainingAmount: number;
  usagePercentage: number;
  bookCount: number;
  isExceeded: boolean;
}

export interface BudgetStatus {
  totalBudget: number;
  totalUsed: number;
  totalRemaining: number;
  totalUsagePercentage: number;
  categoryStatuses: CategoryStatus[];
  isTotalExceeded: boolean;
  alertLevel: 'safe' | 'warning' | 'danger'; // <80%, 80-99%, >=100%
}
