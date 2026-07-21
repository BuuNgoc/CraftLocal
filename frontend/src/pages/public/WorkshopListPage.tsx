import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import workshopApi from '../../api/workshopApi';
import type { Workshop } from '../../types/workshop.type';
import WorkshopCard from '../../components/home/WorkshopCard';
import Loading from '../../components/common/Loading';
import EmptyState from '../../components/common/EmptyState';
import PageHeader from '../../components/common/PageHeader';
import Pagination from '../../components/common/Pagination';
import WorkshopFilterBar from '../../components/workshop/WorkshopFilterBar';

const WorkshopListPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Filter states
  const [localKeyword, setLocalKeyword] = useState(searchParams.get('keyword') || '');
  const [keyword, setKeyword] = useState(searchParams.get('keyword') || '');
  const [location, setLocation] = useState(searchParams.get('location') || '');
  const [date, setDate] = useState(searchParams.get('date') || '');
  const [guests, setGuests] = useState(searchParams.get('guests') || '');
  const [difficulty, setDifficulty] = useState(searchParams.get('difficulty') || '');
  const [minRating, setMinRating] = useState(searchParams.get('minRating') || '');
  const [sort, setSort] = useState(searchParams.get('sort') || 'rating_desc');

  // Pagination states
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1', 10));
  const [limit, setLimit] = useState(parseInt(searchParams.get('limit') || '12', 10));

  // Data states
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Debounce keyword search
  useEffect(() => {
    const timer = setTimeout(() => setKeyword(localKeyword), 400);
    return () => clearTimeout(timer);
  }, [localKeyword]);

  // Reset page to 1 when any filter changes
  useEffect(() => {
    setPage(1);
  }, [keyword, location, date, guests, difficulty, minRating, sort, limit]);

  // Sync states to URL
  useEffect(() => {
    const params: Record<string, string> = {};
    if (keyword) params.keyword = keyword;
    if (location) params.location = location;
    if (date) params.date = date;
    if (guests) params.guests = guests;
    if (difficulty) params.difficulty = difficulty;
    if (minRating) params.minRating = minRating;
    if (sort && sort !== 'rating_desc') params.sort = sort;
    if (page > 1) params.page = String(page);
    if (limit !== 12) params.limit = String(limit);
    setSearchParams(params, { replace: true });
  }, [keyword, location, date, guests, difficulty, minRating, sort, page, limit, setSearchParams]);

  // Fetch workshops
  const fetchWorkshops = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { page, limit };

      if (keyword) params.keyword = keyword;
      if (location) params.location = location;
      if (date) params.date = date;
      if (guests) params.guests = guests;
      if (difficulty) params.difficulty = difficulty;
      if (minRating) params.minRating = minRating;
      // Map sort value to backend format
      if (sort === 'rating_desc') params.sort = '-averageRating';
      else if (sort) params.sort = sort;

      const res = await workshopApi.getAll(params);
      const data = res.data.data;

      setWorkshops(data?.workshops || []);
      const pagination = data?.pagination;
      if (pagination) {
        setTotal(pagination.total);
        setTotalPages(pagination.totalPages);
      } else {
        // Backward compat
        setTotal(data?.total || data?.workshops?.length || 0);
        setTotalPages(data?.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to fetch workshops:', err);
      setWorkshops([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [page, limit, keyword, location, date, guests, difficulty, minRating, sort]);

  useEffect(() => { fetchWorkshops(); }, [fetchWorkshops]);

  const handleResetFilters = () => {
    setLocalKeyword('');
    setKeyword('');
    setLocation('');
    setDate('');
    setGuests('');
    setDifficulty('');
    setMinRating('');
    setSort('rating_desc');
    setPage(1);
    setSearchParams({});
  };

  return (
    <div className="max-w-[1280px] mx-auto px-5 md:px-8 lg:px-12 py-10 min-h-screen">
      <PageHeader
        title="Khám phá Trải nghiệm"
        subtitle="Đặt workshop thủ công truyền thống, tìm hiểu văn hóa Việt Nam từ nghệ nhân."
      />

      {/* Filters Section */}
      <WorkshopFilterBar
        localKeyword={localKeyword}
        setLocalKeyword={setLocalKeyword}
        location={location}
        setLocation={setLocation}
        date={date}
        setDate={setDate}
        guests={guests}
        setGuests={setGuests}
        difficulty={difficulty}
        setDifficulty={setDifficulty}
        minRating={minRating}
        setMinRating={setMinRating}
        sort={sort}
        setSort={setSort}
        onReset={handleResetFilters}
      />

      {loading ? (
        <Loading text="Đang tìm kiếm các trải nghiệm phù hợp..." />
      ) : workshops.length === 0 ? (
        <EmptyState
          title="Không tìm thấy workshop nào"
          description="Rất tiếc, hiện tại không có workshop nào phù hợp với bộ lọc của bạn. Vui lòng thay đổi từ khóa hoặc bộ lọc để thử lại."
          action={
            <button
              onClick={handleResetFilters}
              className="px-5 py-2.5 bg-[#A65A3A] text-white font-bold rounded-xl hover:bg-[#8e492b] transition-all"
            >
              Đặt lại bộ lọc
            </button>
          }
        />
      ) : (
        <>
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm font-semibold text-[#7A6A5E]">
              Tìm thấy <span className="text-[#A65A3A] font-bold">{total}</span> trải nghiệm thú vị
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {workshops.map((ws) => (
              <WorkshopCard key={ws._id} workshop={ws} />
            ))}
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

export default WorkshopListPage;
