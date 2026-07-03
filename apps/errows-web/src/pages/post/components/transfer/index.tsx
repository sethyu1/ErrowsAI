import React, { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { CheckIcon } from "lucide-react";
import { CameraIcon } from "@errows/icons";
import { Button } from "@errows/design";
import { cn } from "@errows/design/lib/utils";
import { uploadPostImageApi } from "@/apis/post";
import { toast } from "sonner";

interface MediaItem {
  id: string;
  url: string;
  type?: "local" | "remote";
}

interface TransferProps {
  /** 角色 ID，用于上传图片 */
  characterId: string;
  availableMedia?: MediaItem[];
  selectedMedia?: MediaItem[];
  onSelectedChange?: (selected: MediaItem[]) => void;
  maxSelected?: number;
}

export const Transfer: React.FC<TransferProps> = ({
  characterId,
  availableMedia = [],
  selectedMedia: controlledSelected,
  onSelectedChange,
  maxSelected = 9,
}) => {
  const { t } = useTranslation();
  const [internalSelected, setInternalSelected] = useState<MediaItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedMedia = controlledSelected ?? internalSelected;
  const setSelectedMedia = onSelectedChange ?? setInternalSelected;

  const handleToggleSelect = (item: MediaItem) => {
    const isSelected = selectedMedia.some((s) => s.id === item.id);

    if (isSelected) {
      setSelectedMedia(selectedMedia.filter((s) => s.id !== item.id));
    } else {
      if (maxSelected && selectedMedia.length >= maxSelected) {
        return;
      }
      setSelectedMedia([...selectedMedia, item]);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // 检查数量限制
    const availableSlots = maxSelected ? maxSelected - selectedMedia.length : files.length;
    if (availableSlots <= 0) {
      toast.error(t("post.maximumSelectionLimitReached"));
      return;
    }

    const filesToUpload = Array.from(files).slice(0, availableSlots);
    
    setUploading(true);
    try {
      // 并发上传所有图片
      const uploadPromises = filesToUpload.map((file) =>
        uploadPostImageApi(characterId, file)
      );
      
      const results = await Promise.all(uploadPromises);
      
      // 将上传成功的图片添加到选中列表
      const newItems: MediaItem[] = results.map((result) => ({
        id: result.id,
        url: result.url,
        type: "remote" as const,
      }));
      
      setSelectedMedia([...selectedMedia, ...newItems]);
      toast.success(t("post.successfullyUploadedImages", { count: newItems.length }));
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error(t("post.imageUploadFailed"));
    } finally {
      setUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const isSelected = (item: MediaItem) =>
    selectedMedia.some((s) => s.id === item.id);

  return (
    <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
      {/* Left Panel - My Multimedia */}
      <div className="flex flex-col gap-3">
        <h3 className="text-base font-medium text-gray-300">{t("post.myMultimedia")}</h3>
        <div className="grid grid-cols-5 gap-3 p-4 bg-[#1A1A24] rounded-lg border border-[#2C2C38] min-h-[300px] content-start">
          {availableMedia.map((item) => (
            <div
              key={item.id}
              onClick={() => handleToggleSelect(item)}
              className={cn(
                "relative aspect-square rounded-lg overflow-hidden cursor-pointer transition-all",
                "hover:scale-105",
                isSelected(item)
                  ? "ring-2 ring-white ring-offset-2 ring-offset-[#1A1A24]"
                  : "ring-1 ring-[#2C2C38]"
              )}
            >
              <img
                src={item.url}
                alt=""
                className="w-full h-full object-cover"
              />
              {isSelected(item) && (
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center">
                    <CheckIcon className="w-4 h-4 text-black" />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel - My Selected */}
      <div className="flex flex-col gap-3">
        <h3 className="text-base font-medium text-gray-300">{t("post.mySelected")}</h3>
        <div className="grid grid-cols-5 gap-3 p-4 bg-[#1A1A24] rounded-lg border border-[#2C2C38] min-h-[300px] content-start">
          {selectedMedia.map((item) => (
            <div
              key={item.id}
              onClick={() => handleToggleSelect(item)}
              className="relative aspect-square rounded-lg overflow-hidden cursor-pointer hover:scale-105 transition-all ring-1 ring-[#2C2C38]"
            >
              <img
                src={item.url}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
          ))}

          {/* Upload Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="aspect-square rounded-lg bg-[#1D1E27]/50 border border-solid border-[#3C3C48] hover:border-grep-500 hover:bg-[#2C2C38] transition-all flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <CameraIcon className="w-4 h-4 text-[#4A4E58]" />
            )}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      </div>
    </div>
  );
};
