import { useState } from "react";
import ReactJson from "react-json-view";
import { useTranslation } from "react-i18next";
import { XIcon, ClipboardIcon, CheckIcon } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { ScrollArea } from "./ui/scroll-area";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";

interface JsonModalProps {
  data: object;
  isOpen: boolean;
  onClose: () => void;
}

export function JsonModal({ data, isOpen, onClose }: JsonModalProps) {
  const { t } = useTranslation("components");
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent className="p-0 bg-white rounded-lg shadow-lg flex flex-col">
        <DialogHeader className="flex flex-row justify-between items-center p-4">
          <div className="flex items-center gap-2">
            <DialogTitle className="text-xl font-semibold text-gray-900">
              {t("json-modal.title")}
            </DialogTitle>
            {data && Object.keys(data).length > 0 && (
              <span className="text-sm text-gray-400">
                ({Object.keys(data).length} {t("json-modal.keys")})
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleCopy}
              className="text-gray-500 hover:text-black transition flex items-center gap-1"
            >
              {copied ? (
                <CheckIcon className="w-5 h-5 text-green-600" />
              ) : (
                <ClipboardIcon className="w-5 h-5" />
              )}
              <span className="text-sm">
                {copied ? t("json-modal.copied") : t("json-modal.copy")}
              </span>
            </button>

            <DialogClose className="flex items-center gap-2 text-gray-500 hover:text-black transition cursor-pointer">
              <Badge
                variant="outline"
                className="bg-gray-100 text-gray-400 border-gray-400 font-medium px-2 py-0.5"
              >
                Esc
              </Badge>
              <XIcon className="w-5 h-5" />
            </DialogClose>
          </div>
        </DialogHeader>

        <Separator className="w-full" />

        <ScrollArea className="flex-1 overflow-auto p-6 h-full">
          <ReactJson
            src={data}
            theme="rjv-default"
            enableClipboard={false}
            displayDataTypes={false}
            displayObjectSize={true}
            indentWidth={2}
            collapseStringsAfterLength={38}
            collapsed={2}
          />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
