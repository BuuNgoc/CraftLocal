import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import productApi from '../../api/productApi';
import type { Product } from '../../types/product.type';
import ProductCard from '../../components/home/ProductCard';
import Loading from '../../components/common/Loading';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';
import PageHeader from '../../components/common/PageHeader';
import { Search, SlidersHorizontal, X } from 'lucide-react';

const SORT_OPTIONS = [
  { value: 'latest', label: 'Mới nhất' },
  { value: 'price_asc', label: 'Giá tăng dần' },
  { value: 'price_desc', label: 'Giá giảm dần' },
  { value: 'rating_desc', label: 'Đánh giá cao' },
  { value: 'popular', label: 'Bán chạy' },
];

const ProductListPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // State from URL
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1', 10));
  const [limit, setLimit] = useState(parseInt(searchParams.get('limit') || '12', 10));
  const [localKeyword, setLocalKeyword] = useState(searchParams.get('keyword') || '');
  const [keyword, setKeyword] = useState(searchParams.get('keyword') || '');
  const [sort, setSort] = useState(searchParams.get('sort') || 'latest');
  const [categoryId, setCategoryId] = useState(searchParams.get('categoryId') || '');

  // Data
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Debounce keyword
  useEffect(() => {
    const timer = setTimeout(() => setKeyword(localKeyword), 400);
    return () => clearTimeout(timer);
  }, [localKeyword]);

  // Sync URL
  useEffect(() => {
    const params: Record<string, string> = {};
    if (page > 1) params.page = String(page);
    if (limit !== 12) params.limit = String(limit);
    if (keyword) params.keyword = keyword;
    if (sort && sort !== 'latest') params.sort = sort;
    if (categoryId) params.categoryId = categoryId;
    setSearchParams(params, { replace: true });
  }, [page, limit, keyword, sort, categoryId, setSearchParams]);

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [keyword, sort, categoryId, limit]);

  // Fetch
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { page, limit, sort };
      if (keyword) params.keyword = keyword;
      if (categoryId) params.categoryId = categoryId;

      const res = await productApi.getAll(params);
      const data = res.data.data;

      setProducts(data?.products || []);
      const pagination = data?.pagination;
      if (pagination) {
        setTotal(pagination.total);
        setTotalPages(pagination.totalPages);
      } else {
        setTotal(data?.total || data?.products?.length || 0);
        setTotalPages(1);
      }
    } catch {
      setProducts([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [page, limit, keyword, sort, categoryId]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleClearSearch = () => {
    setLocalKeyword('');
    setKeyword('');
    setCategoryId('');
    setSort('latest');
    setPage(1);
  };

  return (
    <div className="max-w-[1280px] mx-auto px-5 md:px-8 lg:px-12 py-10 min-h-screen">
      <PageHeader
        title="Sản phẩm thủ công"
        subtitle="Khám phá các sản phẩm thủ công độc đáo từ nghệ nhân địa phương."
      />

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 mb-8">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7A6A5E]" />
          <input
            type="text"
            value={localKeyword}
            onChange={(e) => setLocalKeyword(e.target.value)}
            placeholder="Tìm kiếm sản phẩm..."
            className="w-full pl-11 pr-10 py-3 border border-[#E6DED5] rounded-xl bg-white text-[#2F2722] placeholder:text-[#B0A59B] focus:outline-none focus:ring-2 focus:ring-[#A65A3A]/20 focus:border-[#A65A3A] transition-all"
          />
          {localKeyword && (
            <button
              onClick={() => { setLocalKeyword(''); setKeyword(''); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#7A6A5E] hover:text-[#A65A3A]"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <SlidersHorizontal size={16} className="text-[#7A6A5E]" />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="px-3 py-3 border border-[#E6DED5] rounded-xl bg-white text-[#2F2722] text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#A65A3A]/20 focus:border-[#A65A3A]"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <Loading text="Đang tải sản phẩm..." />
      ) : products.length === 0 ? (
        <EmptyState
          title="Không tìm thấy sản phẩm nào"
          description="Thử thay đổi từ khóa hoặc bộ lọc để tìm sản phẩm khác."
          action={
            keyword || categoryId ? (
              <button onClick={handleClearSearch} className="px-5 py-2.5 bg-[#A65A3A] text-white font-bold rounded-xl hover:bg-[#8e492b] transition-all">
                Xóa bộ lọc
              </button>
            ) : undefined
          }
        />
      ) : (
        <>
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm font-semibold text-[#7A6A5E]">
              Tìm thấy <span className="text-[#A65A3A] font-bold">{total}</span> sản phẩm
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((p) => <ProductCard key={p._id} product={p} />)}
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            limit={limit}
            onPageChange={setPage}
            onLimitChange={setLimit}
          />
        </>
      )}
    </div>
  );
};

export default ProductListPage;
