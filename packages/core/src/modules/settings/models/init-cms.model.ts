export type InitCmsModel = {
  adminEmail: string;
  adminFirstName: string;
  adminLastName: string;
  adminPassword: string;

  siteName: string;
  siteUrl: string;
  siteDescription?: string;
  defaultLanguage: string;

  allowIndexing?: boolean;
};
