import { useTranslation } from "react-i18next";
import { Badge } from "../../../components/ui/badge";

export function StatusBadge(status: string) {
  const { t } = useTranslation("pages");

  switch (status.toUpperCase()) {
    case "PUBLISHED":
      return (
        <Badge
          variant="outline"
          className="border-green-700 bg-green-50 font-normal"
        >
          {t("status.published")}
        </Badge>
      );
    case "DRAFT":
      return (
        <Badge
          variant="outline"
          className="border-yellow-700 bg-yellow-50 font-normal"
        >
          {t("status.draft")}
        </Badge>
      );
    case "ARCHIVED":
      return (
        <Badge
          variant="outline"
          className="border-red-700 bg-red-50 font-normal"
        >
          {t("status.archived")}
        </Badge>
      );
    default:
      return (
        <Badge
          variant="outline"
          className="border-gray-200 bg-gray-50 font-normal"
        >
          {status}
        </Badge>
      );
  }
}
