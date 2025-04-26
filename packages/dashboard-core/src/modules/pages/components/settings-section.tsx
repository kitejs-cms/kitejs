import { Separator } from "../../../components/ui/separator";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { TagsInput } from "../../../components/tag-input";
import { Button } from "../../../components/ui/button";
import { FileJson } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../../components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../../../components/ui/select";
import type { PageStatus } from "@kitejs-cms/core/modules/pages/models/page-status.enum";

interface SettingsSectionProps {
  status: PageStatus;
  publishAt: string;
  expireAt: string;
  tags: string[];
  createdBy: string;
  updatedBy: string;
  onChange: (
    field: "status" | "publishAt" | "expireAt" | "tags",
    value: string | string[]
  ) => void;
  onViewJson: () => void;
}

export function SettingsSection({
  status,
  publishAt,
  expireAt,
  tags,
  createdBy,
  updatedBy,
  onChange,
  onViewJson,
}: SettingsSectionProps) {
  // format ISO to datetime-local
  const toInputDate = (iso: string) => new Date(iso).toISOString().slice(0, 16);

  return (
    <Card className="w-full shadow-neutral-50 gap-0 py-0">
      <CardHeader className="bg-secondary text-primary py-4 rounded-t-xl">
        <div className="flex items-center justify-between">
          <CardTitle>Settings</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onViewJson}
            className="flex items-center"
          >
            <FileJson className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="p-4 md:p-6 space-y-4">
        {/* Status with controlled Select */}
        <div>
          <Label className="mb-2 block">Status</Label>
          <Select
            value={status}
            onValueChange={(val) => onChange("status", val)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Publish At and Expire At as datetime-local inputs */}
        <div>
          <Label className="mb-2 block">Publish At</Label>
          <Input
            type="datetime-local"
            value={toInputDate(publishAt)}
            onChange={(e) => onChange("publishAt", e.target.value)}
            className="w-full"
          />
        </div>
        <div>
          <Label className="mb-2 block">Expire At</Label>
          <Input
            type="datetime-local"
            value={toInputDate(expireAt)}
            onChange={(e) => onChange("expireAt", e.target.value)}
            className="w-full"
          />
        </div>

        {/* Created/Modified By readonly */}
        <div>
          <Label className="mb-2 block">Created By</Label>
          <Input
            value={createdBy}
            disabled
            className="w-full cursor-not-allowed"
          />
        </div>
        <div>
          <Label className="mb-2 block">Modified By</Label>
          <Input
            value={updatedBy}
            disabled
            className="w-full cursor-not-allowed"
          />
        </div>

        {/* Tags */}
        <div>
          <Label className="mb-2 block">Tags</Label>
          <TagsInput
            initialTags={tags}
            onChange={(newTags) => onChange("tags", newTags)}
          />
        </div>
      </CardContent>
    </Card>
  );
}
