import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => (
  <footer className="bg-[#2F2722] text-[#FAF7F2]/80 border-t border-[#E6DED5]/10">
    <div className="max-w-[1280px] mx-auto px-5 md:px-8 lg:px-12 py-16">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
        {/* Brand */}
        <div className="space-y-4">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="text-3xl">🏺</span>
            <span className="font-headline-lg text-2xl font-bold text-white tracking-wide">CraftLocal</span>
          </Link>
          <p className="text-[#FAF7F2]/60 text-[14px] leading-relaxed max-w-xs">
            Chúng tôi nỗ lực gìn giữ di sản thông qua các trải nghiệm văn hóa chọn lọc và hỗ trợ cộng đồng nghệ nhân địa phương trên khắp Việt Nam.
          </p>
        </div>

        {/* Khám phá */}
        <div>
          <h4 className="font-bold text-white mb-5 text-xs uppercase tracking-widest text-[#EADCCB]">Khám phá</h4>
          <div className="space-y-3">
            <Link to="/workshops" className="block text-sm hover:text-[#EADCCB] transition-colors font-medium">Trải nghiệm</Link>
            <Link to="/products" className="block text-sm hover:text-[#EADCCB] transition-colors font-medium">Sản phẩm thủ công</Link>
            <Link to="/about" className="block text-sm hover:text-[#EADCCB] transition-colors font-medium">Giới thiệu</Link>
          </div>
        </div>

        {/* Dành cho nghệ nhân */}
        <div>
          <h4 className="font-bold text-white mb-5 text-xs uppercase tracking-widest text-[#EADCCB]">Dành cho nghệ nhân</h4>
          <div className="space-y-3">
            <Link to="/register" className="block text-sm hover:text-[#EADCCB] transition-colors font-medium">Trở thành Chủ xưởng</Link>
            <Link to="/login" className="block text-sm hover:text-[#EADCCB] transition-colors font-medium">Bảng điều khiển Chủ xưởng</Link>
          </div>
        </div>

        {/* Liên hệ */}
        <div>
          <h4 className="font-bold text-white mb-5 text-xs uppercase tracking-widest text-[#EADCCB]">Liên hệ</h4>
          <div className="space-y-3 text-sm font-medium text-[#FAF7F2]/70">
            <p className="hover:text-white transition-colors cursor-pointer">hello@craftlocal.vn</p>
            <p>+84 28 1234 5678</p>
            <p>Hà Nội & TP. Hồ Chí Minh, Việt Nam</p>
          </div>
        </div>
      </div>

      <div className="border-t border-[#FAF7F2]/10 mt-16 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-xs text-[#FAF7F2]/40">© {new Date().getFullYear()} CraftLocal. Bảo lưu mọi quyền.</p>
        <div className="flex items-center gap-6 text-xs text-[#FAF7F2]/40">
          <span className="hover:text-white cursor-pointer transition-colors">Chính sách bảo mật</span>
          <span className="hover:text-white cursor-pointer transition-colors">Điều khoản dịch vụ</span>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
