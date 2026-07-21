import React, { useState } from 'react';
import { aiApi } from '../../api/aiApi';

const LOCATIONS = ['Hội An', 'Đà Nẵng', 'Huế', 'Hà Nội', 'TP.HCM'];
const DIFFICULTIES = [
  { value: '', label: 'Tất cả' },
  { value: 'EASY', label: 'Dễ' },
  { value: 'MEDIUM', label: 'Trung bình' },
  { value: 'HARD', label: 'Khó' },
];

const AIAdvisorPage: React.FC = () => {
  const [userMessage, setUserMessage] = useState('');
  const [location, setLocation] = useState('');
  const [guests, setGuests] = useState<number | ''>('');
  const [budget, setBudget] = useState<number | ''>('');
  const [difficulty, setDifficulty] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await aiApi.recommendWorkshops({
        userMessage: userMessage || undefined,
        location: location || undefined,
        guests: guests || undefined,
        budget: budget || undefined,
        difficulty: difficulty || undefined,
      });
      setResult(res.data?.data || res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Lỗi khi gọi AI. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-[#FFF7ED] via-[#FEF3E2] to-[#FFF1EB] min-h-[60vh]">
      <div className="max-w-[1280px] mx-auto px-5 md:px-8 lg:px-16 py-10">
        {/* Header */}
        <div className="text-center mb-8">
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-semibold tracking-wider uppercase rounded-full mb-4">
            ✨ AI Trợ lý
          </span>
          <h1 className="font-headline-lg text-3xl md:text-4xl text-deep-earth">
            AI Tư vấn Workshop
          </h1>
          <p className="text-on-surface-variant mt-2">
            Mô tả trải nghiệm bạn muốn, AI sẽ tìm workshop phù hợp nhất
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white/80 backdrop-blur rounded-2xl shadow-lg p-6 mb-8">
          <div className="mb-4">
            <textarea
              value={userMessage}
              onChange={(e) => setUserMessage(e.target.value)}
              placeholder="Ví dụ: Tôi muốn trải nghiệm nhẹ nhàng ở Hội An cho 2 người, ngân sách dưới 500k..."
              className="w-full p-4 border border-gray-200 rounded-xl resize-none h-24 focus:ring-2 focus:ring-amber-400 focus:border-transparent transition"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
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
              step={50000}
              className="p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-400 text-sm"
            />

            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="p-3 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-amber-400 text-sm"
            >
              {DIFFICULTIES.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl hover:from-amber-600 hover:to-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '🔄 Đang tìm kiếm...' : '✨ Nhờ AI tư vấn'}
          </button>
        </form>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-red-700">
            ⚠️ {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-4">
            {/* Summary */}
            {result.summary && (
              <div className="bg-white/80 backdrop-blur rounded-2xl shadow p-5">
                <p className="text-gray-700">{result.summary}</p>
                {result.engine === 'RULE_BASED_FALLBACK' && (
                  <p className="text-xs text-amber-600 mt-2">⚡ Kết quả từ hệ thống gợi ý tự động</p>
                )}
              </div>
            )}

            {/* Out of scope */}
            {result.isOutOfScope && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                <p className="text-amber-800">{result.reply}</p>
                {result.quickReplies?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {result.quickReplies.map((qr: string, i: number) => (
                      <button
                        key={i}
                        onClick={() => { setUserMessage(qr); }}
                        className="px-3 py-1.5 bg-white border border-amber-300 rounded-full text-sm text-amber-700 hover:bg-amber-100 transition"
                      >
                        {qr}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Empty state */}
            {result.resultMode === 'EMPTY' && (
              <div className="bg-gray-50 rounded-2xl p-8 text-center">
                <p className="text-gray-500 text-lg">😔 {result.reply || 'Không tìm thấy workshop phù hợp'}</p>
                {result.quickReplies?.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-2 mt-4">
                    {result.quickReplies.map((qr: string, i: number) => (
                      <button
                        key={i}
                        onClick={() => { setUserMessage(qr); }}
                        className="px-4 py-2 bg-white border border-gray-300 rounded-full text-sm hover:bg-gray-100 transition"
                      >
                        {qr}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Recommendations */}
            {result.recommendations?.length > 0 && (
              <div className="grid gap-4 md:grid-cols-2">
                {result.recommendations.map((rec: any, idx: number) => {
                  const ws = rec.workshop;
                  if (!ws) return null;
                  return (
                    <div key={ws._id || idx} className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition group">
                      {ws.thumbnail && (
                        <div className="relative h-40 overflow-hidden">
                          <img src={ws.thumbnail} alt={ws.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          {result.resultMode === 'CHEAPEST' && (
                            <span className="absolute top-3 left-3 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                              Rẻ nhất #{idx + 1}
                            </span>
                          )}
                          {rec.matchScore && (
                            <span className="absolute top-3 right-3 bg-white/90 backdrop-blur text-amber-700 text-xs font-bold px-2 py-1 rounded-full">
                              Phù hợp {rec.matchScore}%
                            </span>
                          )}
                        </div>
                      )}
                      <div className="p-4">
                        <h3 className="font-bold text-lg text-gray-800">{ws.title}</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                          <span>📍 {ws.locationLabel}</span>
                          <span>•</span>
                          <span>⭐ {ws.averageRating?.toFixed(1)}</span>
                          <span>•</span>
                          <span>⏱ {ws.duration} phút</span>
                        </div>
                        <p className="text-amber-600 font-bold text-lg mt-2">
                          {ws.price?.toLocaleString('vi-VN')}đ
                        </p>
                        {rec.reason && (
                          <p className="text-sm text-gray-600 mt-2 italic">💡 {rec.reason}</p>
                        )}
                        <a
                          href={`/workshops/${ws._id}`}
                          className="block mt-3 text-center py-2 bg-gradient-to-r from-amber-400 to-orange-400 text-white rounded-xl font-medium hover:from-amber-500 hover:to-orange-500 transition"
                        >
                          Xem chi tiết →
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Tips */}
            {result.tips?.length > 0 && (
              <div className="bg-blue-50 rounded-2xl p-5">
                <h3 className="font-semibold text-blue-800 mb-2">💡 Mẹo từ AI:</h3>
                <ul className="list-disc list-inside text-blue-700 text-sm space-y-1">
                  {result.tips.map((tip: string, i: number) => (
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

export default AIAdvisorPage;
