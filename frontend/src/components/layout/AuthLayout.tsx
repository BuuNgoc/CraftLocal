import React, { useState, useEffect } from 'react';
import { Outlet, Link } from 'react-router-dom';

const slides = [
  {
    image: '/src/assets/images/hero-workshop.jpg',
    title: 'Khám phá Workshop Văn hóa',
    subtitle: 'Trải nghiệm nghề thủ công truyền thống cùng nghệ nhân địa phương',
  },
  {
    image: '/src/assets/images/pottery-workshop.jpg',
    title: 'Nghệ thuật Gốm sứ',
    subtitle: 'Tự tay tạo nên những tác phẩm gốm độc đáo tại làng nghề',
  },
  {
    image: '/src/assets/images/lantern-workshop.jpg',
    title: 'Đèn lồng Hội An',
    subtitle: 'Học cách làm đèn lồng truyền thống dưới bàn tay nghệ nhân',
  },
  {
    image: '/src/assets/images/textile-workshop.jpg',
    title: 'Dệt vải truyền thống',
    subtitle: 'Khám phá nghệ thuật dệt vải với những họa tiết văn hóa đặc sắc',
  },
  {
    image: '/src/assets/images/artisan-story.jpg',
    title: 'Câu chuyện Nghệ nhân',
    subtitle: 'Lắng nghe và kết nối với những người giữ hồn văn hóa Việt',
  },
];

const AuthLayout: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex">
      {/* Left image carousel panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Slideshow images */}
        {slides.map((slide, index) => (
          <div
            key={index}
            className="absolute inset-0 transition-all duration-[1200ms] ease-in-out"
            style={{
              opacity: index === currentSlide ? 1 : 0,
              transform: index === currentSlide ? 'scale(1.0)' : 'scale(1.05)',
            }}
          >
            <img
              src={slide.image}
              alt={slide.title}
              className="w-full h-full object-cover"
            />
          </div>
        ))}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-900/40 to-slate-900/20 z-10" />

        {/* Content overlay */}
        <div className="absolute inset-0 z-20 flex flex-col justify-between p-10 lg:p-12">
          {/* Top - Logo */}
          <Link to="/" className="flex items-center gap-2.5 self-start group">
            <span className="text-3xl">🏺</span>
            <span className="text-2xl font-extrabold text-white group-hover:text-[#FFB597] transition-colors tracking-tight">CraftLocal</span>
          </Link>

          {/* Bottom - Slide content + indicators */}
          <div>
            {/* Slide text with crossfade */}
            <div className="relative h-24 mb-6">
              {slides.map((slide, index) => (
                <div
                  key={index}
                  className="absolute inset-0 transition-all duration-700 ease-in-out"
                  style={{
                    opacity: index === currentSlide ? 1 : 0,
                    transform: index === currentSlide ? 'translateY(0)' : 'translateY(8px)',
                  }}
                >
                  <h2 className="text-2xl xl:text-3xl font-extrabold text-white mb-2 leading-tight tracking-tight">
                    {slide.title}
                  </h2>
                  <p className="text-white/85 text-sm xl:text-base leading-relaxed max-w-md">
                    {slide.subtitle}
                  </p>
                </div>
              ))}
            </div>

            {/* Slide indicators */}
            <div className="flex items-center gap-1.5">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    index === currentSlide
                      ? 'w-7 bg-white'
                      : 'w-2 bg-white/30 hover:bg-white/50'
                  }`}
                  aria-label={`Slide ${index + 1}`}
                />
              ))}
            </div>

            {/* Trust stats */}
            <div className="mt-8 flex items-center gap-8 text-white/50 text-xs">
              <div className="text-center">
                <p className="text-lg font-bold text-white/95">500+</p>
                <p className="font-semibold">Trải nghiệm</p>
              </div>
              <div className="w-px h-6 bg-white/15" />
              <div className="text-center">
                <p className="text-lg font-bold text-white/95">200+</p>
                <p className="font-semibold">Nghệ nhân</p>
              </div>
              <div className="w-px h-6 bg-white/15" />
              <div className="text-center">
                <p className="text-lg font-bold text-white/95">4.9★</p>
                <p className="font-semibold">Đánh giá</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-5 md:p-10 overflow-y-auto">
        <div className="w-full max-w-[460px]">
          {/* Mobile header with background image */}
          <div className="lg:hidden mb-6 -mx-5 -mt-5 md:-mx-10 md:-mt-10">
            <div className="relative h-40 overflow-hidden">
              {slides.map((slide, index) => (
                <img
                  key={index}
                  src={slide.image}
                  alt={slide.title}
                  className="absolute inset-0 w-full h-full object-cover transition-opacity duration-[1200ms]"
                  style={{ opacity: index === currentSlide ? 1 : 0 }}
                />
              ))}
              <div className="absolute inset-0 bg-gradient-to-b from-[#0F172A]/40 to-[#F7F8FA]" />
              <div className="absolute bottom-4 left-0 right-0 text-center">
                <Link to="/" className="inline-flex items-center gap-2">
                  <span className="text-3xl">🏺</span>
                  <span className="text-2xl font-extrabold text-[#0F172A] tracking-tight">CraftLocal</span>
                </Link>
              </div>
            </div>
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
