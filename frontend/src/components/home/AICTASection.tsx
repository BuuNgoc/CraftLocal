import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, MapPin, Calendar, ArrowRight, Wand2, Bot } from 'lucide-react';

const features = [
  {
    icon: <Sparkles size={22} />,
    title: 'Tư vấn Workshop',
    desc: 'AI phân tích sở thích, ngân sách và khu vực để gợi ý workshop phù hợp nhất cho bạn.',
    link: '/ai/advisor',
    cta: 'Nhờ AI tư vấn',
    color: 'from-amber-500 to-orange-500',
    bgIcon: 'bg-amber-100 text-amber-600',
  },
  {
    icon: <Calendar size={22} />,
    title: 'Tạo Lịch Trình',
    desc: 'AI lên kế hoạch trải nghiệm cả ngày với workshop, ẩm thực và di chuyển tối ưu.',
    link: '/ai/itinerary',
    cta: 'Tạo lịch trình',
    color: 'from-orange-500 to-rose-500',
    bgIcon: 'bg-rose-100 text-rose-600',
  },
];

const AICTASection: React.FC = () => (
  <section className="py-16 md:py-24 bg-gradient-to-br from-[#FFF7ED] via-[#FEF3E2] to-[#FFF1EB] relative overflow-hidden">
    {/* Decorative */}
    <div className="absolute top-0 right-0 w-80 h-80 bg-amber-200/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
    <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-200/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />

    <div className="max-w-[1280px] mx-auto px-5 md:px-8 lg:px-16 relative z-10">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        {/* Left — Description */}
        <div>
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-semibold tracking-wider uppercase rounded-full mb-6">
            <Bot size={14} /> Trợ lý AI
          </span>
          <h2 className="font-headline-lg text-3xl md:text-4xl text-deep-earth mt-2 mb-6 leading-snug">
            Trải nghiệm thông minh hơn<br className="hidden md:inline" /> với trợ lý AI CraftLocal.
          </h2>
          <p className="text-on-surface-variant leading-relaxed mb-8 text-lg">
            AI hiểu văn hóa Việt Nam, phân tích dữ liệu thực từ hệ thống workshop để giúp bạn
            tìm trải nghiệm phù hợp nhất — không bịa đặt, không đoán mò.
          </p>

          <div className="space-y-4 mb-8">
            {[
              { icon: <Sparkles size={16} />, text: 'Gợi ý dựa trên sở thích, ngân sách và đánh giá thực' },
              { icon: <MapPin size={16} />, text: 'Lọc theo khu vực: Hội An, Đà Nẵng, Huế, Hà Nội...' },
              { icon: <Wand2 size={16} />, text: 'Tạo lịch trình trải nghiệm cá nhân hóa trong 10 giây' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                  {item.icon}
                </div>
                <span className="text-on-surface font-medium text-sm">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right — Feature Cards */}
        <div className="space-y-4">
          {features.map((f, idx) => (
            <Link
              key={idx}
              to={f.link}
              className="group block bg-white rounded-2xl p-5 shadow-md hover:shadow-xl border border-gray-100 hover:border-amber-200 transition-all duration-300"
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-2xl ${f.bgIcon} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                  {f.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg text-deep-earth mb-1 group-hover:text-primary transition-colors">
                    {f.title}
                  </h3>
                  <p className="text-on-surface-variant text-sm leading-relaxed mb-3">{f.desc}</p>
                  <span className={`inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r ${f.color} text-white text-xs font-semibold rounded-xl shadow-sm group-hover:shadow-md transition-shadow`}>
                    {f.cta} <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </div>
            </Link>
          ))}

          {/* Quick Try */}
          <div className="bg-white/60 backdrop-blur rounded-2xl p-4 border border-dashed border-amber-300/50">
            <p className="text-xs text-on-surface-variant font-medium text-center">
              💡 Thử ngay: <span className="font-semibold text-amber-700">"Gợi ý workshop rẻ nhất ở Hội An"</span> hoặc <span className="font-semibold text-amber-700">"Tạo lịch trình 1 ngày ở Đà Nẵng"</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default AICTASection;
