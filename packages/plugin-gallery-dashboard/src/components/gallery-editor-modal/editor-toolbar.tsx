import {
  Button,
  Tabs,
  TabsList,
  TabsTrigger,
} from "@kitejs-cms/dashboard-core";
import {
  Settings2,
  UploadCloud,
  Info,
  Monitor,
  Tablet,
  Smartphone,
} from "lucide-react";
import { useMinWidth } from "../../hooks/use-min-width";
import { useTranslation } from "react-i18next";

export type PreviewMode = "desktop" | "tablet" | "mobile";

type EditorToolbarProps = {
  preview: PreviewMode;
  onPreviewChange: (mode: PreviewMode) => void;
  settingsOpen: boolean;
  onOpenSettings: () => void;
  onBrowseClick: () => void;
};

export function EditorToolbar({
  preview,
  onPreviewChange,
  settingsOpen,
  onOpenSettings,
  onBrowseClick,
}: EditorToolbarProps) {
  const { t } = useTranslation("gallery");
  const is1120Up = useMinWidth(1120);

  const baseCss = is1120Up
    ? "mb-3 flex w-full gap-2 justify-between flex-row"
    : "mb-3 flex w-full gap-2 justify-between flex-col-reverse";

  return (
    <div className={baseCss}>
      {/* Upload File */}
      <div className="flex items-center gap-2 text-xs text-gray-600 sm:w-auto border p-2 rounded-md">
        <UploadCloud className="w-4 h-4 shrink-0" />
        <span className="font-medium">{t("editor.toolbar.dragHere")}</span>
        <span className="opacity-70">{t("editor.toolbar.or")}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onBrowseClick}
          className="h-7"
          aria-label={t("editor.toolbar.browse")}
        >
          {t("editor.toolbar.browse")}
        </Button>
        <span className="inline-flex items-center gap-1 text-[11px] text-gray-500">
          <Info className="w-3 h-3" /> {t("editor.toolbar.support")}
        </span>
      </div>

      {/* Tabs + Settings */}
      <div className="flex items-center gap-2 justify-between md:flex-end">
        <Tabs
          value={preview}
          onValueChange={(v) => onPreviewChange(v as PreviewMode)}
        >
          <TabsList className="flex-wrap">
            <TabsTrigger
              value="desktop"
              className="text-sm"
              aria-label={t("editor.toolbar.previewDesktop")}
            >
              <Monitor className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger
              value="tablet"
              className="text-sm"
              aria-label={t("editor.toolbar.previewTablet")}
            >
              <Tablet className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger
              value="mobile"
              className="text-sm"
              aria-label={t("editor.toolbar.previewMobile")}
            >
              <Smartphone className="w-4 h-4" />
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {!settingsOpen && (
          <Button
            variant="secondary"
            size="icon"
            className="shrink-0"
            onClick={onOpenSettings}
            title={t("editor.toolbar.openSettings")}
            aria-label={t("editor.toolbar.openSettings")}
          >
            <Settings2 className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
