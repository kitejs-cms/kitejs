export type JwtPayloadModel = {
  email: string;
  sub: string;
  roles: string[];
  permissions: string[];
  iat?: number;
  exp?: number;
};
