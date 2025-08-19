import { useTranslation } from "react-i18next";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Label,
  Input,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@kitejs-cms/dashboard-core";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@kitejs-cms/dashboard-core/components/ui/dialog";
import type { GalleryItemModel } from "@kitejs-cms/gallery-plugin";
import { GalleryItemsSection } from "./items-section";
import { SettingsSection } from "./settings-section";

interface Item extends GalleryItemModel {
  id: string;
}

interface GridSettings {
  layout: string;
  columns: string;
  gap: string;
  ratio: string;
}

interface GalleryEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: Item[];
  gridSettings: GridSettings;
  onUpload: (file: File) => void;
  onSort: (ids: string[]) => void;
  onGridChange: (field: keyof GridSettings, value: string) => void;
}

export function GalleryEditorModal({
  isOpen,
  onClose,
  items,
  gridSettings,
  onUpload,
  onSort,
  onGridChange,
}: GalleryEditorModalProps) {
  const { t } = useTranslation("gallery");

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{t("title.editGallery")}</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="items" className="mt-4">
          <TabsList>
            <TabsTrigger value="items">{t("sections.items")}</TabsTrigger>
            <TabsTrigger value="grid">{t("sections.grid")}</TabsTrigger>
          </TabsList>
          <TabsContent value="items" className="mt-4">
            <GalleryItemsSection items={items} onUpload={onUpload} onSort={onSort} />
          </TabsContent>
          <TabsContent value="grid" className="mt-4">
            <SettingsSection title={t("sections.grid")}> 
              <div>
                <Label className="mb-2 block">{t("fields.layout")}</Label>
                <Select
                  value={gridSettings.layout}
                  onValueChange={(val) => onGridChange("layout", val)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("fields.layout")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grid">Grid</SelectItem>
                    <SelectItem value="masonry">Masonry</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-2 block">{t("fields.columns")}</Label>
                <Input
                  type="number"
                  value={gridSettings.columns}
                  onChange={(e) => onGridChange("columns", e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <Label className="mb-2 block">{t("fields.gap")}</Label>
                <Input
                  type="number"
                  value={gridSettings.gap}
                  onChange={(e) => onGridChange("gap", e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <Label className="mb-2 block">{t("fields.ratio")}</Label>
                <Input
                  value={gridSettings.ratio}
                  onChange={(e) => onGridChange("ratio", e.target.value)}
                  className="w-full"
                />
              </div>
            </SettingsSection>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
