export interface UserRegistrationStatModel {
  date: string;
  count: number;
}

export interface UserStatsResponseModel {
  total: number;
  registrations: UserRegistrationStatModel[];
  trend: number;
}
