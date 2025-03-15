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
    <Dialog onClose={onClose} open={isOpen}>
      <DialogContent className="p-2 rounded-md bg-zinc-900">
        <DialogHeader className="flex flex-row justify-between items-center bg-zinc-900 py-4 px-2 border-zinc-700">
          <div className="flex items-center gap-2">
            <DialogTitle className="text-white font-light">
              {t("json-modal.title")}
            </DialogTitle>
            {data && Object.keys(data).length > 0 && (
              <span className="text-sm text-zinc-400">
                ({Object.keys(data).length} {t("json-modal.keys")})
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleCopy}
              className="text-zinc-400 hover:text-white transition flex items-center gap-1"
            >
              {copied ? (
                <CheckIcon className="w-5 h-5 text-green-400" />
              ) : (
                <ClipboardIcon className="w-5 h-5" />
              )}
              <span className="text-sm">
                {copied ? t("json-modal.copied") : t("json-modal.copy")}
              </span>
            </button>

            <DialogClose className="flex items-center gap-2 text-zinc-400 hover:text-white transition cursor-pointer">
              <Badge
                variant="outline"
                className="bg-zinc-800 text-zinc-400 border-zinc-400 font-light"
              >
                Esc
              </Badge>
              <XIcon className="w-5 h-5" />
            </DialogClose>
          </div>
        </DialogHeader>

        <ScrollArea
          className="bg-zinc-800 rounded-md p-4"
          style={{ height: "calc(100vh - 88px)" }}
        >
          <ReactJson
            src={data}
            style={{
              backgroundColor: "#27272B",
              padding: "10px",
              borderRadius: "6px",
            }}
            theme="tube"
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
