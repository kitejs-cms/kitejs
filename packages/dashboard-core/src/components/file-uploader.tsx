import React, { useState, useRef } from "react";
import { Upload, X, Image, Video, FileText, File, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useApi } from "../hooks/use-api";

interface FileData {
  id: string;
  file: File | null;
  name: string;
  size: number;
  type: string;
  url: string;
  isDefault?: boolean;
}

interface FileUploaderProps {
  dirName?: string;
  acceptedTypes?: string;
  onChange?: (url: string | null) => void;
  defaultUrl?: string | null;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  acceptedTypes = "image/*,video/*,.pdf,.doc,.docx,.txt,.xlsx,.xls",
  onChange = () => {},
  defaultUrl = null,
  dirName,
}) => {
  const { t } = useTranslation("components");
  const { uploadFile } = useApi();

  const [file, setFile] = useState<FileData | null>(null);
  const [dragOver, setDragOver] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (defaultUrl && !file) {
      const fileName =
        defaultUrl.split("/").pop() || t("file-uploader.defaultFileName");
      const fileExtension = fileName.split(".").pop()?.toLowerCase() || "";

      let mimeType = "application/octet-stream";
      if (["jpg", "jpeg", "png", "gif", "webp"].includes(fileExtension)) {
        mimeType = `image/${fileExtension === "jpg" ? "jpeg" : fileExtension}`;
      } else if (["mp4", "webm", "ogg", "avi"].includes(fileExtension)) {
        mimeType = `video/${fileExtension}`;
      } else if (fileExtension === "pdf") {
        mimeType = "application/pdf";
      }

      const defaultFile: FileData = {
        id: "default-file",
        file: null,
        name: fileName,
        size: 0,
        type: mimeType,
        url: defaultUrl,
        isDefault: true,
      };

      setFile(defaultFile);
    }
  }, [defaultUrl, t, file]);

  const uploadFileToServer = async (fileToUpload: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", fileToUpload);
    if (dirName) formData.append("dir", dirName);

    const { data } = await uploadFile("storage/upload", formData);
    return (data as { url: string }).url;
  };

  const processFile = async (newFile: File) => {
    if (file?.url && !file.isDefault) {
      URL.revokeObjectURL(file.url);
    }

    const tempFile: FileData = {
      id: Math.random().toString(36).substr(2, 9),
      file: newFile,
      name: newFile.name,
      size: newFile.size,
      type: newFile.type,
      url: URL.createObjectURL(newFile),
    };

    setFile(tempFile);
    setIsUploading(true);

    try {
      const serverUrl = await uploadFileToServer(newFile);

      const uploadedFile: FileData = {
        ...tempFile,
        url: serverUrl,
        isDefault: false,
      };

      URL.revokeObjectURL(tempFile.url);

      setFile(uploadedFile);
      onChange(serverUrl);
    } catch (error) {
      console.error("Errore durante l'upload:", error);
      URL.revokeObjectURL(tempFile.url);
      setFile(null);
      onChange(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!isUploading) setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);

    if (isUploading) return;

    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      processFile(droppedFiles[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isUploading) return;

    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length > 0) {
      processFile(selectedFiles[0]);
    }
  };

  const removeFile = () => {
    if (file?.url && !file.isDefault) {
      URL.revokeObjectURL(file.url);
    }
    setFile(null);
    onChange(null);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = [
      t("file-uploader.sizes.bytes"),
      t("file-uploader.sizes.kb"),
      t("file-uploader.sizes.mb"),
      t("file-uploader.sizes.gb"),
    ];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return Image;
    if (type.startsWith("video/")) return Video;
    if (type === "application/pdf") return FileText;
    return File;
  };

  const renderFilePreview = () => {
    if (!file) return null;

    const { type, url, name } = file;

    if (acceptedTypes.startsWith("image/")) {
      return (
        <div className="relative w-full rounded-lg overflow-hidden bg-gray-100 group">
          <img
            src={url}
            alt={name}
            className="w-full h-auto object-contain transition-transform duration-300 group-hover:scale-105"
          />
          {isUploading && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            </div>
          )}
        </div>
      );
    }

    if (type.startsWith("video/")) {
      return (
        <div className="relative w-full h-20 rounded-lg overflow-hidden bg-gray-100">
          <video src={url} className="w-full h-full object-contain" muted />
          <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
            {isUploading ? (
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            ) : (
              <Video className="w-6 h-6 text-white" />
            )}
          </div>
        </div>
      );
    }

    const IconComponent = getFileIcon(type);
    return (
      <div className="w-full h-20 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center relative">
        <IconComponent className="w-8 h-8 text-gray-400" />
        {isUploading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-gray-600 animate-spin" />
          </div>
        )}
      </div>
    );
  };

  if (file) {
    return (
      <div className="w-full">
        <div
          className={`flex items-center gap-3 p-3 border rounded-lg transition-colors duration-200 ${
            isUploading
              ? "border-orange-300 bg-orange-50"
              : "border-gray-200 bg-gray-50"
          }`}
        >
          <div className="flex-shrink-0 w-28">{renderFilePreview()}</div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {file.name}
            </p>
            <p className="text-xs text-gray-500">
              {isUploading
                ? t("file-uploader.uploading")
                : file.isDefault
                  ? t("file-uploader.existingFile")
                  : formatFileSize(file.size)}
            </p>
          </div>

          <button
            onClick={removeFile}
            disabled={isUploading}
            className="flex-shrink-0 p-1 text-gray-400 hover:text-red-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={t("file-uploader.removeFile")}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`w-full border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 ${
        isUploading
          ? "border-orange-400 bg-orange-50 cursor-not-allowed"
          : dragOver
            ? "border-blue-400 bg-blue-50 cursor-pointer"
            : "border-gray-300 hover:border-gray-400 hover:bg-gray-50 cursor-pointer"
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => !isUploading && fileInputRef.current?.click()}
    >
      {isUploading ? (
        <Loader2 className="w-8 h-8 mx-auto mb-2 text-orange-500 animate-spin" />
      ) : (
        <Upload
          className={`w-8 h-8 mx-auto mb-2 ${dragOver ? "text-blue-500" : "text-gray-400"}`}
        />
      )}

      <p className="text-sm font-medium text-gray-700 mb-1">
        {isUploading
          ? t("file-uploader.uploadingTitle")
          : t("file-uploader.uploadTitle")}
      </p>
      <p className="text-xs text-gray-500">
        {isUploading
          ? t("file-uploader.uploadingDescription")
          : t("file-uploader.uploadDescription")}
      </p>

      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        className="hidden"
        accept={acceptedTypes}
        disabled={isUploading}
      />
    </div>
  );
};
