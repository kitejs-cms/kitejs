import { useEffect, useMemo } from "react";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  Button,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@kitejs-cms/dashboard-core";
import { useSettingsContext } from "@kitejs-cms/dashboard-core";
import { Plus } from "lucide-react";

interface CollectionLanguageTabsProps {
  languages: string[];
  activeLanguage: string;
  onLanguageChange: (language: string) => void;
  onAddLanguage: (language: string) => void;
}

export function CollectionLanguageTabs({
  languages,
  activeLanguage,
  onLanguageChange,
  onAddLanguage,
}: CollectionLanguageTabsProps) {
  const { cmsSettings } = useSettingsContext();

  const supportedLanguages = useMemo(
    () => cmsSettings?.supportedLanguages ?? [],
    [cmsSettings?.supportedLanguages]
  );

  const sortedLanguages = useMemo(() => {
    return [...languages].sort((a, b) => {
      if (a === cmsSettings?.defaultLanguage) return -1;
      if (b === cmsSettings?.defaultLanguage) return 1;
      return a.localeCompare(b);
    });
  }, [languages, cmsSettings?.defaultLanguage]);

  const missingLanguages = useMemo(
    () => supportedLanguages.filter((language) => !languages.includes(language)),
    [languages, supportedLanguages]
  );

  useEffect(() => {
    if (!languages.includes(activeLanguage)) {
      const fallback =
        sortedLanguages[0] ?? supportedLanguages[0] ?? cmsSettings?.defaultLanguage ?? "en";
      if (fallback) {
        onLanguageChange(fallback);
      }
    }
  }, [
    activeLanguage,
    languages,
    sortedLanguages,
    supportedLanguages,
    cmsSettings?.defaultLanguage,
    onLanguageChange,
  ]);

  return (
    <Tabs value={activeLanguage} onValueChange={onLanguageChange}>
      <TabsList className="flex-wrap h-auto gap-2">
        {sortedLanguages.map((language) => (
          <TabsTrigger key={language} value={language} className="text-sm">
            {language.toUpperCase()}
            {language === cmsSettings?.defaultLanguage && (
              <span className="ml-1 text-xs text-muted-foreground">(default)</span>
            )}
          </TabsTrigger>
        ))}

        {missingLanguages.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8">
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {missingLanguages.map((language) => (
                <DropdownMenuItem key={language} onClick={() => onAddLanguage(language)}>
                  {language.toUpperCase()}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </TabsList>
    </Tabs>
  );
}
