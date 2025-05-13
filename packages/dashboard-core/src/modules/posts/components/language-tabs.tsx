import { useEffect } from "react";
import { Tabs, TabsList, TabsTrigger } from "../../../components/ui/tabs";
import { Button } from "../../../components/ui/button";
import { useSettingsContext } from "../../../context/settings-context";
import type { CategoryTranslation } from "@kitejs-cms/core/index";
import { Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../../../components/ui/dropdown-menu";

interface LanguageTabsProps {
  translations: Record<string, CategoryTranslation>;
  activeLang: string;
  onLanguageChange: (lang: string) => void;
  onAddLanguage: (lang: string) => void;
}

export function LanguageTabs({
  translations,
  activeLang,
  onAddLanguage,
  onLanguageChange,
}: LanguageTabsProps) {
  const { cmsSettings } = useSettingsContext();

  const supported = cmsSettings?.supportedLanguages;
  const existing = Object.keys(translations);

  const langs = existing.sort((a, b) => {
    if (a === cmsSettings?.defaultLanguage) return -1;
    if (b === cmsSettings?.defaultLanguage) return 1;
    return a.localeCompare(b);
  });

  const missing = supported.filter((lng) => !existing.includes(lng));

  useEffect(() => {
    if (translations && !existing.includes(activeLang)) {
      onLanguageChange(langs[0] || supported[0] || "");
    }
  }, [translations, existing, activeLang, onLanguageChange, langs, supported]);

  return (
    <Tabs value={activeLang} onValueChange={onLanguageChange}>
      <TabsList className="flex-wrap h-auto">
        {langs.map((lang) => (
          <TabsTrigger key={lang} value={lang} className="text-sm">
            {lang.toUpperCase()}
            {lang === cmsSettings?.defaultLanguage && (
              <span className="ml-1 text-xs text-muted-foreground">
                (default)
              </span>
            )}
          </TabsTrigger>
        ))}

        {missing.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8">
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {missing.map((lang, key) => (
                <DropdownMenuItem key={key} onClick={() => onAddLanguage(lang)}>
                  {lang.toUpperCase()}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </TabsList>
    </Tabs>
  );
}
