import React from "react";
import { ChromePicker, ColorResult } from "react-color";
import { Button } from "./ui/button";

export type ColorPickerProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  currentColor: string;
  onColorChange: (color: string) => void;
  onReset: () => void;
};

export const ColorPicker: React.FC<ColorPickerProps> = ({
  isOpen,
  onOpenChange,
  currentColor,
  onColorChange,
  onReset,
}) => {
  const handleColorChangeComplete = (colorResult: ColorResult) => {
    const colorHex = colorResult.hex;
    onColorChange(colorHex);
  };

  if (!isOpen) return null;

  return (
    <div className="absolute z-50 left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
      <div>
        <ChromePicker
          styles={{
            default: {
              picker: {
                boxShadow: "none",
              },
            },
          }}
          color={currentColor}
          onChangeComplete={handleColorChangeComplete}
        />
      </div>
      <div className="p-2 border-t border-gray-200 flex justify-end space-x-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="text-xs h-8 px-2"
        >
          Reset
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onOpenChange(false)}
          className="text-xs h-8 px-2"
        >
          Chiudi
        </Button>
      </div>
    </div>
  );
};
