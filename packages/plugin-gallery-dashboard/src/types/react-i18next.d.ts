declare module "react-i18next" {
  export function useTranslation(
    ns?: string
  ): { t: (key: string) => string; i18n: { language: string } };
}
