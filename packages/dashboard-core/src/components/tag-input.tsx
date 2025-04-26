import React, { useState, KeyboardEvent, ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";

interface TagItemProps {
  tag: string;
  onRemove: (tag: string) => void;
}

const TagItem: React.FC<TagItemProps> = ({ tag, onRemove }) => {
  const { t } = useTranslation("components");
  return (
    <Badge
      variant="outline"
      className="border-gray-200 bg-gray-50 font-normal flex items-center gap-1"
    >
      <span>{tag}</span>
      <button
        type="button"
        onClick={() => onRemove(tag)}
        className="rounded-full pl-0.5 cursor-pointer"
        aria-label={t("tags-input.removeAriaLabel", { tag })}
      >
        <X className="h-3 w-3" />
      </button>
    </Badge>
  );
};

interface TagsDisplayProps {
  tags: string[];
  onRemoveTag: (tag: string) => void;
}

const TagsDisplay: React.FC<TagsDisplayProps> = ({ tags, onRemoveTag }) => (
  <div className="flex flex-wrap gap-2 mt-2">
    {tags.map((tag) => (
      <TagItem key={tag} tag={tag} onRemove={onRemoveTag} />
    ))}
  </div>
);

interface TagInputFieldProps {
  value: string;
  onChange: (value: string) => void;
  onAddTag: () => void;
}

const TagInputField: React.FC<TagInputFieldProps> = ({
  value,
  onChange,
  onAddTag,
}) => {
  const { t } = useTranslation("components");

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onAddTag();
    }
  };

  return (
    <Input
      placeholder={t("tags-input.placeholder")}
      value={value}
      onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
      onKeyDown={handleKeyDown}
      className="w-full"
    />
  );
};

export interface TagsInputProps {
  initialTags?: string[];
  onChange?: (tags: string[]) => void;
}

export const TagsInput: React.FC<TagsInputProps> = ({
  initialTags = [],
  onChange,
}) => {
  const [tags, setTags] = useState<string[]>(initialTags);
  const [inputValue, setInputValue] = useState<string>("");

  const handleAddTag = () => {
    const newTag = inputValue.trim();
    if (newTag && !tags.includes(newTag)) {
      const updatedTags = [...tags, newTag];
      setTags(updatedTags);
      onChange?.(updatedTags);
      setInputValue("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    const updatedTags = tags.filter((t) => t !== tag);
    setTags(updatedTags);
    onChange?.(updatedTags);
  };

  return (
    <div className="space-y-2 w-full">
      <TagInputField
        value={inputValue}
        onChange={setInputValue}
        onAddTag={handleAddTag}
      />
      <TagsDisplay tags={tags} onRemoveTag={handleRemoveTag} />
    </div>
  );
};
