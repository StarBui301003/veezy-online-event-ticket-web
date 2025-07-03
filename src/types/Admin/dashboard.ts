export interface AdminDashboardResponse {
  isSuccess: boolean;
  statusCode: number;
  message: string;
  data: AdminDashboardData;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  errors: any;
}

export interface AdminDashboardData {
  systemOverview: SystemOverview;
  financialOverview: FinancialOverview;
  userStatistics: UserStatistics;
  recentActivities: RecentActivity[];
  generatedAt: string;
}

export interface SystemOverview {
  totalUsers: number;
  totalEvents: number;
  totalTicketsSold: number;
  totalRevenue: number;
  platformRevenue: number;
  pendingWithdrawals: number;
  pendingEventApprovals: number;
  activeEvents: number;
  completedEvents: number;
  growth: {
    usersGrowth: number;
    eventsGrowth: number;
    revenueGrowth: number;
    ticketsGrowth: number;
  };
}

export interface FinancialOverview {
  todayRevenue: number;
  weekRevenue: number;
  monthRevenue: number;
  yearRevenue: number;
  revenueTimeline: RevenueTimelineItem[];
  topEventsByRevenue: TopEventByRevenue[];
  withdrawalStats: WithdrawalStats;
  platformFees: PlatformFees;
}

export interface RevenueTimelineItem {
  period: string;
  revenue: number;
  platformFee: number;
  transactionCount: number;
  periodLabel: string;
}

export interface TopEventByRevenue {
  eventId: string;
  eventName: string;
  eventManagerName: string;
  revenue: number;
  ticketsSold: number;
  eventDate: string;
  status: number;
}

export interface WithdrawalStats {
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  totalWithdrawn: number;
  pendingAmount: number;
  averageWithdrawalAmount: number;
  averageProcessingTimeHours: number;
}

export interface PlatformFees {
  totalCollected: number;
  thisMonth: number;
  thisYear: number;
  averagePerEvent: number;
  topContributingEvents: TopEventByRevenue[];
}

export interface UserStatistics {
  growth: {
    newUsersToday: number;
    newUsersThisWeek: number;
    newUsersThisMonth: number;
    newUsersThisYear: number;
    growthChart: GrowthChartItem[];
    usersByRole: Record<string, number>;
    activeUsers: number;
    inactiveUsers: number;
  };
  demographics: {
    usersByGender: Record<string, number>;
    usersByLocation: Record<string, number>;
    usersByAgeGroup: Record<string, number>;
    averageAge: number;
  };
  activity: {
    dailyActiveUsers: number;
    weeklyActiveUsers: number;
    monthlyActiveUsers: number;
    activityTrend: ActivityTrendItem[];
  };
}

export interface GrowthChartItem {
  period: string;
  value: number;
}

export interface ActivityTrendItem {
  period: string;
  value: number;
}

export interface EventStatistics {
  overview: {
    totalEvents: number;
    eventsThisMonth: number;
    eventsThisYear: number;
    upcomingEvents: number;
    ongoingEvents: number;
    completedEvents: number;
    averageTicketPrice: number;
    averageEventDuration: number;
  };
  eventsByStatus: {
    status: number;
    count: number;
    percentage: number;
  }[];
  eventsByCategory: {
    categoryId: string;
    categoryName: string;
    count: number;
    revenue: number;
    ticketsSold: number;
  }[];
  topPerformingEvents: TopEventByRevenue[];
  approvalMetrics: {
    pendingApprovals: number;
    approvedToday: number;
    rejectedToday: number;
    approvedThisWeek: number;
    rejectedThisWeek: number;
    averageApprovalTimeHours: number;
    approvalTrend: ApprovalTrendItem[];
  };
}

export interface ApprovalTrendItem {
  period: string;
  approved: number;
  rejected: number;
}

export interface RecentActivity {
  activityType: string;
  description: string;
  userName: string;
  timestamp: string;
  relatedEntityId: string;
  relatedEntityType: string;
}
