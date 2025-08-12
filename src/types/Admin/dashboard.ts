// New type for realtime overview response
export interface AdminOverviewRealtimeResponse {
  isSuccess: boolean;
  statusCode: number;
  message: string;
  data: AdminOverviewRealtimeData;
  errors: unknown;
}

export interface AdminOverviewRealtimeData {
  totalUsers: number;
  totalEvents: number;
  totalNews: number;
  totalTicketsSold: number;
  totalTickets: number;
  totalRevenue: number;
  platformRevenue: number;
  pendingWithdrawals: number;
  pendingEventApprovals: number;
  pendingNewsApprovals: number;
  activeEvents: number;
  activeNews: number;
  activeUsers: number;
  completedEvents: number;
  pendingReports: number;
  growth: {
    usersGrowth: number;
    eventsGrowth: number;
    revenueGrowth: number;
    ticketsGrowth: number;
  };
}

// --- NEW ANALYTICS API RESPONSE TYPES ---

// Financial Analytics
export interface AdminFinancialAnalyticsResponse {
  isSuccess: boolean;
  statusCode: number;
  message: string;
  data: AdminFinancialAnalyticsData;
  errors: unknown;
}

export interface AdminFinancialAnalyticsData {
  todayRevenue: number | null;
  weekRevenue: number | null;
  monthRevenue: number | null;
  yearRevenue: number | null;
  totalRevenue: number;
  revenueFilter: number;
  netRevenue: number;
  netRevenueFilter: number;
  platformFee: number;
  platformFeeFilter: number;
  revenueTimeline: FinancialRevenueTimelineItem[];
  topEventsByRevenue: FinancialTopEventByRevenue[];
  withdrawalStats: FinancialWithdrawalStats;
  withdrawalStatsAllTime: FinancialWithdrawalStats;
  platformFees: FinancialPlatformFees;
  platformFeesAllTime: FinancialPlatformFees;
}

export interface FinancialRevenueTimelineItem {
  period: string;
  revenue: number;
  platformFee: number;
  transactionCount: number;
  periodLabel: string;
}

export interface FinancialTopEventByRevenue {
  eventId: string;
  eventName: string;
  eventManagerName: string;
  revenue: number;
  ticketsSold: number;
  eventDate: string;
  status: number;
  // For platformFees.topContributingEvents
  feeCollected?: number;
  eventRevenue?: number;
}

export interface FinancialWithdrawalStats {
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  totalWithdrawn: number;
  pendingAmount: number;
  averageWithdrawalAmount: number;
  averageProcessingTimeHours: number;
}

export interface FinancialPlatformFees {
  totalCollected: number;
  totalCollectFilter: number;
  averagePerEventFilter: number;
  averagePerEvent: number;
  topContributingEvents: Array<{
    eventId: string;
    eventName: string;
    feeCollected: number;
    eventRevenue: number;
  }>;
}

// Event Analytics
export interface AdminEventAnalyticsResponse {
  isSuccess: boolean;
  statusCode: number;
  message: string;
  data: AdminEventAnalyticsData;
  errors: unknown;
}

export interface AdminEventAnalyticsData {
  overview: EventOverview;
  eventsByStatus: unknown[];
  eventsByCategory: EventByCategory[];
  topPerformingEvents: EventTopPerformingEvent[];
  approvalMetrics: EventApprovalMetrics;
}

export interface EventOverview {
  totalEvents: number;
  totalActiveEvents: number;
  totalEventsFilter: number;
  totalActiveEventsFilter: number;
  eventsThisMonth: number | null;
  eventsThisYear: number | null;
  upcomingEvents: number;
  ongoingEvents: number;
  completedEvents: number;
  pendingEvents: number;
  rejectedEvents: number;
  cancelledEvents: number;
  averageTicketPrice: number;
  averageEventDuration: number;
}

export interface EventByCategory {
  categoryId: string;
  categoryName: string;
  count: number;
  revenue: number;
  ticketsSold: number;
}

export interface EventTopPerformingEvent {
  eventId: string;
  eventName: string;
  eventManagerName: string;
  revenue: number;
  ticketsSold: number;
  totalTickets: number;
  soldPercentage: number;
  eventDate: string;
  status: number;
}

export interface EventApprovalMetrics {
  totalEvents: number;
  pendingApprovals: number;
  approvedToday: number | null;
  rejectedToday: number | null;
  approvedThisWeek: number | null;
  rejectedThisWeek: number | null;
  approvedEvents: number;
  rejectedEvents: number;
  cancelledEvents: number;
  averageApprovalTimeHours: number;
  approvalTrend: EventApprovalTrendItem[];
}

export interface EventApprovalTrendItem {
  period: string;
  approved: number;
  rejected: number;
  pending: number;
  periodLabel: string;
}

// User Analytics
export interface AdminUserAnalyticsResponse {
  isSuccess: boolean;
  statusCode: number;
  message: string;
  data: AdminUserAnalyticsData;
  errors: unknown;
}

export interface AdminUserAnalyticsData {
  growth: UserGrowth;
  demographics: UserDemographics;
  activity: UserActivity;
}

export interface UserGrowth {
  newUsersToday: number | null;
  newUsersThisWeek: number | null;
  newUsersThisMonth: number | null;
  newUsersThisYear: number | null;
  totalUsers: number;
  newUsers: number;
  activeNewUsers: number;
  inactiveNewUsers: number;
  onlineUsers: number;
  growthChart: UserGrowthChartItem[];
  usersByRole: Record<string, number>;
  activeUsers: number;
  inactiveUsers: number;
}

export interface UserGrowthChartItem {
  period: string;
  newUsers: number;
  totalUsers: number;
  periodLabel: string;
}

export interface UserDemographics {
  usersByGender: Record<string, number>;
  usersByLocation: Record<string, number>;
  usersByAgeGroup: Record<string, number>;
  averageAge: number;
}

export interface UserActivity {
  dailyActiveUsers: number;
  weeklyActiveUsers: number;
  monthlyActiveUsers: number;
  activityTrend: unknown[];
}

// News Analytics
export interface AdminNewsAnalyticsResponse {
  isSuccess: boolean;
  statusCode: number;
  message: string;
  data: AdminNewsAnalyticsData;
  errors: unknown;
}

export interface AdminNewsAnalyticsData {
  overview: NewsOverview;
  newsByStatus: unknown[];
  newsByEvent: NewsByEvent[];
  newsByAuthor: NewsByAuthor[];
  recentNews: unknown[];
  approvalMetrics: NewsApprovalMetrics;
  growthTrend: unknown[];
}

export interface NewsOverview {
  totalNews: number;
  totalNewsActive: number;
  newsToday: number | null;
  newsThisWeek: number | null;
  newsThisMonth: number | null;
  newsThisYear: number | null;
  pendingNews: number;
  approvedNews: number;
  rejectedNews: number;
  visibleNews: number;
  hiddenNews: number;
}

export interface NewsByEvent {
  eventId: string;
  eventName: string;
  newsCount: number;
  approvedCount: number;
  pendingCount: number | null;
  lastNewsDate: string;
}

export interface NewsByAuthor {
  authorId: string;
  authorName: string;
  totalNews: number;
  approvedNews: number;
  pendingNews: number | null;
  rejectedNews: number | null;
  approvalRate: number;
  lastNewsDate: string;
}

export interface NewsApprovalMetrics {
  totalNews: number;
  pendingApprovals: number;
  approvedNews: number;
  rejectedNews: number;
  visibleNews: number;
  hiddenNews: number;
  approvedToday: number | null;
  rejectedToday: number | null;
  approvedThisWeek: number | null;
  rejectedThisWeek: number | null;
  averageApprovalTimeHours: number;
  approvalRate: number;
  approvalTrend: NewsApprovalTrendItem[];
}

export interface NewsApprovalTrendItem {
  period: string;
  approved: number;
  rejected: number;
  pending: number;
  periodLabel: string;
}

// --- EXPORT ANALYTICS TYPES ---

export interface ExportAnalyticsRequest {
  analyticsType: string;
  filter?: ExportAnalyticsFilter;
  language?: ExportLanguage;
}

export interface ExportAnalyticsFilter {
  period?: number;
  customStartDate?: string;
  customEndDate?: string;
  groupBy?: number;
}

export enum ExportLanguage {
  Default = 0,
  Vie = 1,
  Eng = 2,
}

export interface ExportAnalyticsResponse {
  isSuccess: boolean;
  statusCode: number;
  message: string;
  data: Blob;
  errors: unknown;
}
