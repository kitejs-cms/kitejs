import { Badge } from "../../../components/ui/badge";

export function LanguagesBadge(translations: Record<string, unknown>) {
  const langs = Object.keys(translations);
  return (
    <div className="flex items-center gap-1">
      {langs.map((lang, key) => (
        <Badge
          key={key}
          variant="outline"
          className="border-gray-200 bg-gray-50 font-normal"
        >
          {lang.toUpperCase()}
        </Badge>
      ))}
    </div>
  );
}
