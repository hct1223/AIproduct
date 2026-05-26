/**
 * Types for the AI Food Consumer Insights & Trend Analysis System
 */

// Keyword dimensions
export type TrendDimension = 'flavor' | 'texture' | 'productType' | 'visual' | 'scene';

// Individual Keyword Trend Data
export interface KeywordTrend {
  id: string;
  keyword: string;
  dimension: TrendDimension;
  volume: number;          // Current Internet Volume score (derived from counts, likes, shares, comments)
  prevVolume: number;      // Previous period Volume score
  growthRate: number;      // (volume - prevVolume) / prevVolume * 100
  warning: boolean;        // Trigger warning if growthRate > 200
  lifecycle: '萌芽期' | '成成长' | '成熟期' | '衰退期'; // (萌芽, 成长, 成熟, 衰退)
  forecastSentiment: number; // Forcasted sentiment next 7-14 days (0-10)
  platformDistribution: {
    xiaohongshu: number;   // % share
    douyin: number;
    bilibili: number;
    meituan: number;
  };
  sentimentPositive: number; // % Positive
  sentimentNegative: number; // % Negative
  sentimentNeutral: number;  // % Neutral
  keyOpportunities: string[];
  keyRisks: string[];
}

// Scraped Feed Source
export interface ScrapedDataFeed {
  id: string;
  platform: string;
  title?: string;
  content: string;
  author: string;
  authorFollowers?: number;
  publishedAt: string;
  engagement: {
    likes: number;
    comments: number;
    shares?: number;
    favorites?: number;
  };
  aiAnalysis?: {
    sentimentScore: number; // 0-10
    sentimentLabel: '正面' | '中性' | '负面';
    posKeywords: string[];
    negKeywords: string[];
    extractedDimensions: {
      flavor?: string[];
      texture?: string[];
      productType?: string[];
      visual?: string[];
      scene?: string[];
    };
    rawSummary: string;
  };
}

// Competitor Track Element
export interface CompetitorBrand {
  id: string;
  brandName: string;
  avgRating: number;
  activeDishesCount: number;
  newLaunchDishes: Array<{
    name: string;
    launchDate: string;
    price: number;
    userRating: number;
    keySellingPoints: string[];
    aiCustomerPainPoints: string[];
  }>;
  recentKolCampaigns: string[];
  pricingRange: string;
  scoreComparison: {
    taste: number;
    service: number;
    environment: number;
    valueForMoney: number;
  };
}

// Saved Client-Side Custom POS/CRM Ingested Data
export interface EnterpriseDataUpload {
  id: string;
  dataType: 'POS' | 'CRM' | 'MiniProgram' | 'CustomerComplaint';
  uploadedAt: string;
  title: string;
  summary: string;
  recordCount: number;
  rawJson?: string;
}

// Saved Client-Side Customer Persona Structure
export interface CustomerPersona {
  id: string;
  avatar: string; // Emoji identifier
  name: string;   // e.g., "格子间低卡维稳族"
  genderDistribution: string; // e.g., "女性 72% / 男性 28%"
  ageGroup: string; // e.g., "24-34 岁"
  incomeLevel: string; // e.g., "12k-20k/月"
  flavorPreferences: string[];
  texturePreferences: string[];
  preferredScenes: string[];
  painPoints: string[];
  purchasingDrivers: {
    health: number; // 0-100
    flavor: number;
    visual: number;
    price: number;
    convenience: number;
  };
  preferredChannels: string[];
  spendingTrend: 'premium' | 'balanced' | 'budget';
  aiDescription: string;
}

// AI Prepared Report Structure
export interface IntelligenceReport {
  id: string;
  title: string;
  type: 'daily' | 'weekly' | 'monthly' | 'special_alert';
  createdAt: string;
  summary: string;
  generatedByAI: boolean;
  contentMarkdown: string; // Dynamic rich markdown report content
}

// AI Marketing Strategy Structure
export interface MarketingStrategyProposal {
  id: string;
  title: string;
  targetKeyword: string;
  targetAudience: string;
  productBrief: {
    flavorSuggestion: string;
    textureSuggestion: string;
    visualDesign: string;
    pricingEstimate: string;
  };
  socialCampaignCopy: {
    xiaohongshuTitle: string;
    xiaohongshuBody: string;
    douyinVideoConcept: string;
    douyinHookLines: string[];
  };
  eventPlanning: {
    theme: string;
    promotions: string;
    kolTypes: string[];
  };
  predictedOutcome: string;
}

// Knowledge Base Definition
export interface KnowledgeBase {
  id: string;
  title: string;
  description: string;
  category: 'formula' | 'competitor' | 'insight' | 'marketing' | 'policy';
  createdAt: string;
  documentCount: number;
  owner: string;
  isPublic: boolean;
  permittedRoles: string[]; // e.g., ["研发组", "策划组", "高管层", "销售组"]
  securityLevel: 'L1' | 'L2' | 'L3'; // L1-公开, L2-团队内部, L3-绝对机密
}

// Knowledge Document Definition
export interface KnowledgeDocument {
  id: string;
  kbId: string;
  title: string;
  content: string;
  updatedAt: string;
  author: string;
  tags: string[];
}

