import React, { useState } from 'react';
import { aiApi } from '../../api/aiApi';

const LOCATIONS = ['Hội An', 'Đà Nẵng', 'Huế', 'Hà Nội', 'TP.HCM'];
const PACES = [
  { value: 'RELAXED', label: '🧘 Nhẹ nhàng' },
  { value: 'BALANCED', label: '⚖️ Cân bằng' },
  { value: 'FULL', label: '🚀 Đầy đủ' },
];

const AIItineraryPage: React.FC = () => {
  const [location, setLocation] = useState('');
  const [guests, setGuests] = useState<number | ''>('');
  const [budget, setBudget] = useState<number | ''>('');
  const [pace, setPace] = useState('BALANCED');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await aiApi.generateItinerary({
        location: location || undefined,
        guests: guests || undefined,
        budget: budget || undefined,
        pace,
        note: note || undefined,
      });
      setResult(res.data?.data || res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Lỗi khi tạo lịch trình.');
    } finally {
      setLoading(false);
    }
  };

  const typeIcons: Record<string, string> = {
    WORKSHOP: '🏺', FOOD: '🍜', MOVE: '🚶', SHOPPING: '🛍️', REST: '☕', NOTE: '📝',
  };

  const typeColors: Record<string, string> = {
    WORKSHOP: 'border-amber-400 bg-amber-50',
    FOOD: 'border-green-400 bg-green-50',
    MOVE: 'border-blue-400 bg-blue-50',
    SHOPPING: 'border-purple-400 bg-purple-50',
    REST: 'border-gray-400 bg-gray-50',
    NOTE: 'border-gray-300 bg-gray-50',
  };

  return (
    <div className="bg-gradient-to-br from-[#FFF7ED] via-[#FEF3E2] to-[#FFF1EB] min-h-[60vh]">
      <div className="max-w-[1280px] mx-auto px-5 md:px-8 lg:px-16 py-10">
        {/* Header */}
        <div className="text-center mb-8">
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-orange-500 to-rose-500 text-white text-xs font-semibold tracking-wider uppercase rounded-full mb-4">
            📋 AI Trợ lý
          </span>
          <h1 className="font-headline-lg text-3xl md:text-4xl text-deep-earth">
            AI Tạo Lịch Trình
          </h1>
          <p className="text-on-surface-variant mt-2">
            AI sẽ tạo lịch trình trải nghiệm cá nhân hóa cho bạn
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white/80 backdrop-blur rounded-2xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="p-3 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-amber-400 text-sm"
            >
              <option value="">📍 Khu vực</option>
              {LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>

            <input
              type="number"
              value={guests}
              onChange={(e) => setGuests(e.target.value ? parseInt(e.target.value) : '')}
              placeholder="👥 Số khách"
              min={1}
              className="p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-400 text-sm"
            />

            <input
              type="number"
              value={budget}
              onChange={(e) => setBudget(e.target.value ? parseInt(e.target.value) : '')}
              placeholder="💰 Ngân sách (VNĐ)"
              min={0}
              step={100000}
              className="p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-400 text-sm"
            />
          </div>

          <div className="flex gap-2 mb-4">
            {PACES.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setPace(p.value)}
                className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium transition ${
                  pace === p.value
                    ? 'bg-amber-500 text-white shadow'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ghi chú thêm (tuỳ chọn): VD: Tôi thích ẩm thực, muốn mua quà..."
            className="w-full p-3 border border-gray-200 rounded-xl resize-none h-16 focus:ring-2 focus:ring-amber-400 text-sm mb-4"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl hover:from-amber-600 hover:to-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '🔄 Đang tạo lịch trình...' : '📋 Tạo lịch trình'}
          </button>
        </form>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-red-700">
            ⚠️ {error}
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="space-y-4">
            {/* Title & Summary */}
            <div className="bg-white/80 backdrop-blur rounded-2xl shadow p-5">
              <h2 className="text-xl font-bold text-gray-800">{result.title}</h2>
              <p className="text-gray-600 mt-1">{result.summary}</p>
              {result.estimatedBudget > 0 && (
                <p className="text-amber-600 font-semibold mt-2">
                  💰 Tổng chi phí ước tính: {result.estimatedBudget?.toLocaleString('vi-VN')}đ
                </p>
              )}
              {result.engine === 'RULE_BASED_FALLBACK' && (
                <p className="text-xs text-amber-600 mt-2">⚡ Lịch trình tự động (AI tạm bận)</p>
              )}
            </div>

            {/* Timeline */}
            {result.timeline?.length > 0 && (
              <div className="relative">
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-amber-200" />
                <div className="space-y-4">
                  {result.timeline.map((item: any, idx: number) => (
                    <div key={item.id || idx} className="relative pl-14">
                      <div className="absolute left-4 top-3 w-5 h-5 rounded-full bg-white border-2 border-amber-400 flex items-center justify-center text-xs z-10">
                        {typeIcons[item.type] || '📌'}
                      </div>
                      <div className={`rounded-xl border-l-4 p-4 shadow-sm ${typeColors[item.type] || 'border-gray-300 bg-white'}`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-semibold text-gray-800">
                            🕐 {item.time}
                          </span>
                          <span className="text-xs text-gray-500 uppercase font-medium">{item.type}</span>
                        </div>
                        <h3 className="font-bold text-gray-800">{item.activity}</h3>
                        {item.note && <p className="text-sm text-gray-600 mt-1">{item.note}</p>}
                        {item.whyThisActivity && <p className="text-sm text-amber-700 mt-1 italic">💡 {item.whyThisActivity}</p>}
                        {item.estimatedCost > 0 && (
                          <p className="text-sm text-green-700 font-medium mt-1">
                            💰 {item.estimatedCost?.toLocaleString('vi-VN')}đ
                          </p>
                        )}

                        {/* Workshop card */}
                        {item.type === 'WORKSHOP' && item.workshop && (
                          <div className="mt-3 bg-white rounded-lg p-3 border border-amber-200">
                            <div className="flex gap-3">
                              {item.workshop.thumbnail && (
                                <img src={item.workshop.thumbnail} alt="" className="w-20 h-20 rounded-lg object-cover flex-shrink-0" />
                              )}
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-sm truncate">{item.workshop.title}</h4>
                                <p className="text-xs text-gray-500">📍 {item.workshop.locationLabel}</p>
                                <p className="text-amber-600 font-bold text-sm mt-1">
                                  {item.workshop.price?.toLocaleString('vi-VN')}đ
                                </p>
                                <a
                                  href={`/workshops/${item.workshop._id}`}
                                  className="text-xs text-amber-600 hover:underline"
                                >
                                  Xem chi tiết →
                                </a>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tips */}
            {result.preparationTips?.length > 0 && (
              <div className="bg-blue-50 rounded-2xl p-5">
                <h3 className="font-semibold text-blue-800 mb-2">🎒 Chuẩn bị:</h3>
                <ul className="list-disc list-inside text-blue-700 text-sm space-y-1">
                  {result.preparationTips.map((tip: string, i: number) => (
                    <li key={i}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AIItineraryPage;
