export type RoleResponseModel = {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  source: "system" | "user";
};
