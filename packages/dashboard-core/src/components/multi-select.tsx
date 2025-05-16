import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { X, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Checkbox } from "./ui/checkbox";

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
        aria-label={t("multi-select.removeAriaLabel", { tag })}
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

interface Option {
  value: string;
  label: string;
}

interface MultiSelectInputProps {
  options: Option[];
  selectedTags: string[];
  onTagToggle: (tag: string) => void;
}

const MultiSelectInput: React.FC<MultiSelectInputProps> = ({
  options,
  selectedTags,
  onTagToggle,
}) => {
  const { t } = useTranslation("components");
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={isOpen}
          className="w-full justify-between"
        >
          {t("multi-select.placeholder")}
          {isOpen ? (
            <ChevronUp className="h-4 w-4 ml-2" />
          ) : (
            <ChevronDown className="h-4 w-4 ml-2" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <div className="max-h-60 overflow-y-auto w-full p-2">
          {options.map((option) => (
            <div
              key={option.value}
              className="flex items-center p-2 hover:bg-gray-50 cursor-pointer w-full gap-3"
              onClick={() => onTagToggle(option.value)}
            >
              <Checkbox
                checked={selectedTags.includes(option.value)}
                id={option.value}
                className="flex-shrink-0"
              />
              <label
                htmlFor={option.value}
                className="text-sm font-medium leading-none cursor-pointer flex-1"
              >
                {option.label}
              </label>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export interface MultiSelectProps {
  initialTags?: string[];
  options: Option[];
  onChange?: (tags: string[]) => void;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  initialTags = [],
  options,
  onChange,
}) => {
  const [tags, setTags] = useState<string[]>(initialTags);

  const handleTagToggle = (tag: string) => {
    const updatedTags = tags.includes(tag)
      ? tags.filter((t) => t !== tag)
      : [...tags, tag];

    setTags(updatedTags);
    onChange?.(updatedTags);
  };

  const handleRemoveTag = (tag: string) => {
    const updatedTags = tags.filter((t) => t !== tag);
    setTags(updatedTags);
    onChange?.(updatedTags);
  };

  return (
    <div className="space-y-2 w-full">
      <MultiSelectInput
        options={options}
        selectedTags={tags}
        onTagToggle={handleTagToggle}
      />
      <TagsDisplay tags={tags} onRemoveTag={handleRemoveTag} />
    </div>
  );
};
