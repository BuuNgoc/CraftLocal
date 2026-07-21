import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, ImagePlus, Loader2 } from 'lucide-react';
import { uploadApi } from '../../api/uploadApi';
import ImageWithFallback from './ImageWithFallback';

interface ImageUploaderProps {
  images: string[];
  onChange: (urls: string[]) => void;
  maxImages?: number;
  folder?: string;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  images,
  onChange,
  maxImages = 5,
  folder = 'products',
}) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const uploadFiles = useCallback(async (files: FileList | File[]) => {
    setError('');
    const remaining = maxImages - images.length;
    if (remaining <= 0) {
      setError(`Tối đa ${maxImages} ảnh`);
      return;
    }

    const validFiles = Array.from(files).slice(0, remaining);
    const invalidType = validFiles.find((f) => !['image/jpeg', 'image/png', 'image/webp'].includes(f.type));
    if (invalidType) {
      setError('Chỉ hỗ trợ ảnh JPG, PNG hoặc WEBP');
      return;
    }
    const tooBig = validFiles.find((f) => f.size > 10 * 1024 * 1024);
    if (tooBig) {
      setError('Mỗi ảnh không được vượt quá 10MB.');
      return;
    }

    setUploading(true);
    try {
      const res = await uploadApi.uploadMultiple(validFiles, folder);
      const newUrls = res.data.data.images.map((img: any) => img.secureUrl || img.url);
      onChange([...images, ...newUrls]);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Lỗi upload ảnh. Vui lòng thử lại.');
    } finally {
      setUploading(false);
    }
  }, [images, maxImages, folder, onChange]);

  const removeImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files.length > 0) uploadFiles(e.dataTransfer.files);
  };

  return (
    <div className="space-y-3">
      {/* Preview grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {images.map((url, idx) => (
            <div key={idx} className="relative group rounded-xl overflow-hidden border border-[#E6DED5] aspect-square">
              <ImageWithFallback
                src={url}
                fallbackSrc={folder === 'workshops' || folder === 'workshop' ? '/images/fallback-workshop.jpg' : '/images/fallback-product.jpg'}
                alt={`Ảnh ${idx + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => removeImage(idx)}
                className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
              >
                <X size={12} />
              </button>
              {idx === 0 && (
                <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-[#964824] text-white text-[8px] font-bold rounded">Thumbnail</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload area */}
      {images.length < maxImages && (
        <div
          className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
            uploading
              ? 'border-[#964824]/50 bg-[#FAF7F2]/50'
              : 'border-[#E6DED5] hover:border-[#A65A3A]/50 hover:bg-[#FAF7F2]/30'
          }`}
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 size={24} className="text-[#964824] animate-spin" />
              <p className="text-xs font-semibold text-[#964824]">Đang upload ảnh...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <ImagePlus size={24} className="text-[#7A6A5E]" />
              <p className="text-xs font-bold text-[#2F2722]">Kéo thả hoặc nhấn để chọn ảnh</p>
              <p className="text-[10px] text-[#7A6A5E]">
                JPG, PNG, WEBP · Tối đa 10MB/ảnh · Còn {maxImages - images.length} ảnh
              </p>
            </div>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && uploadFiles(e.target.files)}
          />
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-xs text-red-500 font-semibold">⚠️ {error}</p>
      )}
    </div>
  );
};

export default ImageUploader;
