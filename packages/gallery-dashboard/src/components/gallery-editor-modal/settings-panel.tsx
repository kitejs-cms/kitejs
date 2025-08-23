import { ScrollArea } from "@kitejs-cms/dashboard-core/components/ui/scroll-area";
import { Button, Label, Input, Switch } from "@kitejs-cms/dashboard-core";
import { XIcon, Monitor, Tablet, Smartphone } from "lucide-react";
import { DEFAULT_SETTINGS } from "../../constant/empty-gallery";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type {
  GallerySettingsModel,
  GalleryMode,
  Breakpoint,
  BreakpointSettingsModel,
} from "@kitejs-cms/gallery-plugin";

type SettingsPanelProps = {
  settings: GallerySettingsModel;
  onChange?: (next: GallerySettingsModel) => void;
  onClose: () => void;
};

export function SettingsPanel({
  settings,
  onChange,
  onClose,
}: SettingsPanelProps) {
  const [draft, setDraft] = useState<GallerySettingsModel>(settings);
  const { t } = useTranslation("gallery");

  useEffect(() => setDraft(settings), [settings]);

  const currentMode: GalleryMode = draft.mode;
  //const currentLayout: GalleryLayout = draft.layout;

  const getBp = (bp: Breakpoint): BreakpointSettingsModel => {
    if (currentMode === "responsive") {
      return draft.responsive?.[bp] ?? { columns: 1, gap: 0 };
    }
    return draft.manual ?? { columns: 1, gap: 0 };
  };

  const emit = (next: GallerySettingsModel) => {
    setDraft(next);
    onChange?.(next);
  };

  //const setLayout = (layout: GalleryLayout) => emit({ ...draft, layout });

  const setMode = (mode: GalleryMode) => {
    if (mode === draft.mode) return;
    if (mode === "responsive") {
      emit({
        ...draft,
        mode,
        responsive: {
          desktop:
            draft.responsive?.desktop ?? DEFAULT_SETTINGS.responsive.desktop,
          tablet:
            draft.responsive?.tablet ?? DEFAULT_SETTINGS.responsive.tablet,
          mobile:
            draft.responsive?.mobile ?? DEFAULT_SETTINGS.responsive.mobile,
        },
      });
    } else {
      emit({
        ...draft,
        mode,
        manual: draft.manual ?? DEFAULT_SETTINGS.manual,
      });
    }
  };

  const setResponsiveBp = (
    bp: Breakpoint,
    patch: Partial<BreakpointSettingsModel>
  ) => {
    const safe = {
      desktop: draft.responsive?.desktop ?? DEFAULT_SETTINGS.responsive.desktop,
      tablet: draft.responsive?.tablet ?? DEFAULT_SETTINGS.responsive.tablet,
      mobile: draft.responsive?.mobile ?? DEFAULT_SETTINGS.responsive.mobile,
    };
    emit({
      ...draft,
      mode: "responsive",
      responsive: { ...safe, [bp]: { ...safe[bp], ...patch } },
    });
  };

  const setManual = (patch: Partial<BreakpointSettingsModel>) => {
    const manual = { ...(draft.manual ?? DEFAULT_SETTINGS.manual), ...patch };
    emit({ ...draft, mode: "manual", manual });
  };

  return (
    <div className="relative w-full md:max-w-md md:border-l md:border-t-0 h-full min-h-0">
      <ScrollArea className="p-4 h-full min-h-0">
        <div className="space-y-6">
          {/* header */}
          <div className="flex items-center justify-between gap-2">
            <div className="space-y-1">
              <p className="text-sm font-medium">
                {t("editor.settings.title")}
              </p>
              <p className="text-xs text-gray-500">
                {t("editor.settings.subtitle")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="icon"
                onClick={onClose}
                title={t("editor.settings.close")}
                aria-label={t("editor.settings.close")}
              >
                <XIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* <div className="h-px bg-gray-200" /> */}

          {/* layout */}
          {/*  <div className="space-y-2">
            <Label className="block text-sm font-medium">Layout</Label>
            <Select
              value={currentLayout}
              onValueChange={(v) => setLayout(v as GalleryLayout)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleziona layout" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="grid">Grid</SelectItem>
                <SelectItem value="masonry">Masonry</SelectItem>
                <SelectItem value="slider">Slider</SelectItem>
              </SelectContent>
            </Select>
          </div> */}

          <div className="h-px bg-gray-200" />

          {/* mode */}
          <div className="space-y-2">
            <Label className="block text-sm font-medium">
              {t("editor.settings.mode")}
            </Label>
            <div className="flex items-center gap-2">
              <Switch
                id="mode-switch"
                checked={currentMode === "responsive"}
                onCheckedChange={(checked) =>
                  setMode(checked ? "responsive" : "manual")
                }
              />
              <Label htmlFor="mode-switch" className="text-sm text-gray-600">
                {currentMode === "responsive"
                  ? t("editor.settings.responsive")
                  : t("editor.settings.manual")}
              </Label>
            </div>
          </div>

          {/* responsive */}
          <div
            className={`${currentMode !== "responsive" ? "opacity-60 pointer-events-none" : ""}`}
          >
            <div className="grid grid-cols-3 gap-4">
              {(["desktop", "tablet", "mobile"] as Breakpoint[]).map((bp) => {
                const icon =
                  bp === "desktop" ? (
                    <Monitor className="w-4 h-4" />
                  ) : bp === "tablet" ? (
                    <Tablet className="w-4 h-4" />
                  ) : (
                    <Smartphone className="w-4 h-4" />
                  );
                const v = getBp(bp);
                return (
                  <div key={bp} className="rounded-lg border p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase text-gray-600">
                        {t(`editor.settings.breakpoint.${bp}`)}
                      </span>
                      {icon}
                    </div>
                    <Label className="mb-1 block text-xs">
                      {t("editor.settings.columns")}
                    </Label>
                    <Input
                      type="number"
                      min={1}
                      value={v.columns}
                      onChange={(e) =>
                        setResponsiveBp(bp, {
                          columns: Math.max(1, Number(e.target.value) || 1),
                        })
                      }
                      inputMode="numeric"
                    />
                    <Label className="mt-2 mb-1 block text-xs">
                      {t("editor.settings.gap")}
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      value={v.gap}
                      onChange={(e) =>
                        setResponsiveBp(bp, {
                          gap: Math.max(0, Number(e.target.value) || 0),
                        })
                      }
                      inputMode="numeric"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* manual */}
          <div
            className={`${currentMode !== "manual" ? "opacity-60 pointer-events-none" : ""}`}
          >
            <Label className="mb-2 block">
              {t("editor.settings.columnsManual")}
            </Label>
            <Input
              type="number"
              min={1}
              value={draft.manual?.columns ?? DEFAULT_SETTINGS.manual.columns}
              onChange={(e) =>
                setManual({ columns: Math.max(1, Number(e.target.value) || 1) })
              }
              inputMode="numeric"
            />
            <Label className="mt-3 mb-2 block">
              {t("editor.settings.gapManual")}
            </Label>
            <Input
              type="number"
              min={0}
              value={draft.manual?.gap ?? DEFAULT_SETTINGS.manual.gap}
              onChange={(e) =>
                setManual({ gap: Math.max(0, Number(e.target.value) || 0) })
              }
              inputMode="numeric"
            />
            <p className="mt-2 text-xs text-gray-500">
              {t("editor.settings.manualNote")}
            </p>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
