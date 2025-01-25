export type UserRole = "ADMIN" | "USER" | "FINANCE";

export interface DashboardUser {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  role: UserRole;
  joinedAt: Date;
}

export interface RecentActivity {
  id: string;
  type: "BLOCK_CREATED" | "REQUEST_CREATED";
  description: string;
  user: string;
  date: Date;
}

export interface ExpenseCategory {
  category: string;
  amount: number;
}

export interface Metrics {
  totalUsers: number;
  pendingRequests: number;
  totalApproved: number;
  openBlocks: number;
  userGrowth: number;
  totalExpenses: number;
}

export interface AdminDashboardData {
  metrics: Metrics;
  recentUsers: DashboardUser[];
  recentActivity: RecentActivity[];
  expensesByCategory: ExpenseCategory[];
}

export interface AdminDashboardProps {
  data: AdminDashboardData;
  pendingRequestsCount: number;
  userRole: UserRole;
}
