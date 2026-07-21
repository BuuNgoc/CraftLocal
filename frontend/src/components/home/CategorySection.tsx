import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import categoryApi from '../../api/categoryApi';

interface Category {
  _id: string;
  name: string;
  slug: string;
  icon: string;
  description?: string;
}

const CategorySection: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    categoryApi.getAll({ type: 'WORKSHOP' })
      .then((res) => setCategories(res.data.data || []))
      .catch(() => setCategories([]));
  }, []);

  if (categories.length === 0) return null;

  return (
    <section className="py-16 md:py-20 max-w-[1280px] mx-auto px-5 md:px-8 lg:px-16">
      <div className="text-center mb-12">
        <span className="text-[#964824] font-semibold text-sm tracking-wider uppercase">Danh mục</span>
        <h2 className="font-headline-lg text-headline-md text-[#3D2B1F] mt-2 mb-3">Khám phá theo làng nghề</h2>
        <p className="text-[#7A6255] max-w-lg mx-auto">Lựa chọn trải nghiệm văn hóa phù hợp với sở thích của bạn</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
        {categories.map((cat) => (
          <Link
            key={cat._id}
            to={`/workshops?category=${cat.slug}`}
            className="group flex flex-col items-center gap-3 p-5 rounded-2xl border border-transparent hover:border-[#EAD8CC] hover:bg-white hover:shadow-[0_8px_30px_rgba(61,43,31,0.08)] transition-all duration-300"
          >
            <div className="w-14 h-14 rounded-2xl bg-[#964824]/8 flex items-center justify-center group-hover:bg-[#964824]/15 group-hover:scale-110 transition-all duration-300">
              <span className="text-2xl">{cat.icon}</span>
            </div>
            <span className="text-sm font-semibold text-[#3D2B1F] text-center">{cat.name}</span>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default CategorySection;
