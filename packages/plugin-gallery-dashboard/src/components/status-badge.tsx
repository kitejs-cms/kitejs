import { useTranslation } from "react-i18next";
import { Badge } from "@kitejs-cms/dashboard-core";

export function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation("gallery");

  const getStatusDisplay = () => {
    if (!status) return null;

    const upperStatus = status.toUpperCase();
    const statusMap = {
      PUBLISHED: {
        style: "border-green-700 bg-green-50",
        text: t("status.published"),
      },
      DRAFT: {
        style: "border-yellow-700 bg-yellow-50",
        text: t("status.draft"),
      },
      ARCHIVED: {
        style: "border-red-700 bg-red-50",
        text: t("status.archived"),
      },
    } as Record<string, { style: string; text: string }>;

    return (
      statusMap[upperStatus] || {
        style: "border-gray-200 bg-gray-50",
        text: status,
      }
    );
  };

  const display = getStatusDisplay();
  if (!display) return null;

  return (
    <Badge variant="outline" className={`${display.style} font-normal`}>
      {display.text}
    </Badge>
  );
}
