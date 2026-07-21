import React, { useState } from 'react';
import { aiApi } from '../../api/aiApi';

interface AIDescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'WORKSHOP' | 'PRODUCT';
  title: string;
  category?: string;
  location?: string;
  onApply: (data: { shortDescription: string; description: string; titleSuggestion?: string }) => void;
}

const TONES = [
  { value: 'ấm áp, truyền thống', label: 'Ấm áp, truyền thống' },
  { value: 'chuyên nghiệp, hiện đại', label: 'Chuyên nghiệp, hiện đại' },
  { value: 'trẻ trung, năng động', label: 'Trẻ trung, năng động' },
  { value: 'cao cấp, sang trọng', label: 'Cao cấp, sang trọng' },
];

const AIDescriptionModal: React.FC<AIDescriptionModalProps> = ({
  isOpen, onClose, type, title, category, location, onApply,
}) => {
  const [keyPoints, setKeyPoints] = useState('');
  const [tone, setTone] = useState(TONES[0].value);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [selectedVersion, setSelectedVersion] = useState(0);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!title.trim()) {
      setError('Vui lòng nhập "Tiêu đề trải nghiệm" trên form trước khi dùng AI.');
      return;
    }
    if (!keyPoints.trim()) {
      setError('Vui lòng nhập ít nhất 1 điểm nổi bật.');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await aiApi.generateDescription({
        type,
        title,
        category,
        location,
        keyPoints: keyPoints.split('\n').filter((p) => p.trim()),
        tone,
      });
      setResult(res.data?.data || res.data);
      setSelectedVersion(res.data?.data?.recommendedVersion || 0);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Lỗi khi gọi AI. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (!result?.versions?.[selectedVersion]) return;
    const version = result.versions[selectedVersion];
    onApply({
      shortDescription: version.shortDescription,
      description: version.description,
      titleSuggestion: version.titleSuggestion || version.nameSuggestion,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-amber-800">
              ✨ Trợ lý AI viết mô tả {type === 'WORKSHOP' ? 'Workshop' : 'Sản phẩm'}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
          </div>

          <div className="bg-amber-50/50 rounded-xl p-3 mb-4 text-sm text-amber-700">
            ✨ Nhập các từ khóa chính, chọn giọng điệu văn bản để AI tự tạo mô tả phù hợp.
          </div>

          {/* Workshop info */}
          <div className="bg-gray-50 rounded-xl p-3 mb-3 flex items-center gap-3">
            <span className="text-xs font-semibold text-gray-500 uppercase shrink-0">Workshop:</span>
            <span className="text-sm font-bold text-[#2F2722] truncate">{title || <span className="text-red-400 font-normal italic">Chưa nhập tiêu đề</span>}</span>
          </div>

          {/* Input */}
          <div className="mb-3">
            <label className="text-xs font-semibold text-gray-500 uppercase">Giọng điệu mong muốn</label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="w-full p-2.5 border rounded-xl text-sm bg-white"
            >
              {TONES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {location && (
            <div className="mb-3">
              <label className="text-xs font-semibold text-gray-500 uppercase">Địa điểm tổ chức</label>
              <input value={location} readOnly className="w-full p-2.5 bg-gray-50 border rounded-xl text-sm" />
            </div>
          )}

          <div className="mb-4">
            <label className="text-xs font-semibold text-gray-500 uppercase">Điểm nổi bật chính (Mỗi ý 1 dòng) *</label>
            <textarea
              value={keyPoints}
              onChange={(e) => setKeyPoints(e.target.value)}
              placeholder="Nghệ nhân hướng dẫn trực tiếp&#10;Khách được mang sản phẩm về nhà&#10;Trải nghiệm mới lạ"
              className="w-full p-3 border rounded-xl resize-none h-24 text-sm focus:ring-2 focus:ring-amber-400"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 text-red-700 text-sm">
              ⚠️ {error}
            </div>
          )}

          {/* Generate button */}
          {!result && (
            <div className="flex justify-end gap-3">
              <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl transition">
                Hủy bỏ
              </button>
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="px-6 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-medium hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 transition"
              >
                {loading ? '🔄 Đang tạo...' : '✨ Bắt đầu tạo mô tả'}
              </button>
            </div>
          )}

          {/* Results */}
          {result?.versions && (
            <div className="space-y-4">
              {/* Version tabs */}
              <div className="flex gap-2">
                {result.versions.map((v: any, i: number) => (
                  <button
                    key={i}
                    onClick={() => setSelectedVersion(i)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                      selectedVersion === i
                        ? 'bg-amber-500 text-white shadow'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {v.style} {result.recommendedVersion === i && '⭐'}
                  </button>
                ))}
              </div>

              {/* Selected version */}
              {result.versions[selectedVersion] && (
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-500">MÔ TẢ NGẮN</label>
                    <p className="text-sm text-gray-700 mt-1">{result.versions[selectedVersion].shortDescription}</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500">MÔ TẢ CHI TIẾT</label>
                    <p className="text-sm text-gray-700 mt-1 whitespace-pre-line">{result.versions[selectedVersion].description}</p>
                  </div>
                </div>
              )}

              {/* Quality score */}
              {result.qualityScore && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Chất lượng:</span>
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-400 to-green-400 rounded-full transition-all"
                      style={{ width: `${result.qualityScore}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-amber-700">{result.qualityScore}/100</span>
                </div>
              )}

              {/* SEO Keywords */}
              {result.seoKeywords?.length > 0 && (
                <div>
                  <label className="text-xs font-semibold text-gray-500">TỪ KHÓA SEO</label>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {result.seoKeywords.map((kw: string, i: number) => (
                      <span key={i} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">{kw}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={handleGenerate}
                  disabled={loading}
                  className="px-4 py-2 border border-amber-300 text-amber-700 rounded-xl hover:bg-amber-50 transition text-sm"
                >
                  🔄 Tạo lại
                </button>
                <button
                  onClick={handleApply}
                  className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-medium hover:from-green-600 hover:to-emerald-600 transition"
                >
                  ✅ Áp dụng vào form
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIDescriptionModal;
