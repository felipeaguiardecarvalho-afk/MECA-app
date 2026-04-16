export type DiagnosticOverviewRow = {
  user_id: string;
  email: string | null;
  can_take_diagnostic: boolean;
  code: string;
  grant_created_at: string;
  response_count: number;
};
