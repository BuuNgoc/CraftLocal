import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Play, Calendar, Clock, MapPin } from 'lucide-react';
import tourGuideApi from '../../api/tourGuideApi';
import type { Timeslot } from '../../types/timeslot.type';
import Loading from '../../components/common/Loading';
import EmptyState from '../../components/common/EmptyState';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/common/StatusBadge';

const AssignedSchedulePage: React.FC = () => {
  const [timeslots, setTimeslots] = useState<Timeslot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    tourGuideApi.getSchedules()
      .then((res) => setTimeslots(res.data.data || []))
      .catch(() => setTimeslots([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading text="Đang tải lịch trình gán..." />;

  if (timeslots.length === 0) {
    return (
      <div className="max-w-[1280px] mx-auto px-5 md:px-8 lg:px-12 py-12">
        <EmptyState
          title="Chưa có lịch gán"
          description="Hiện tại bạn chưa được phân công phụ trách khung giờ nào từ xưởng."
          icon={<Calendar size={48} className="text-[#A65A3A] opacity-60" />}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lịch trình được gán"
        subtitle="Danh sách các khung giờ hoạt động workshop được chủ xưởng phân công phụ trách."
      />

      <div className="space-y-5 mt-6">
        {timeslots.map((ts) => {
          const dateStr = new Date(ts.startTime).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
          const startStr = new Date(ts.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
          const endStr = new Date(ts.endTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

          return (
            <div
              key={ts._id}
              className="bg-white rounded-3xl border border-[#E6DED5] p-5 md:p-6 shadow-xs hover:shadow-md transition-all duration-300 relative overflow-hidden"
            >
              {/* Left border accent */}
              <div className="absolute top-0 bottom-0 left-0 w-1 bg-[#FAF7F2]" />

              <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-[#7A6A5E] bg-[#FAF7F2] border border-[#E6DED5] px-2.5 py-0.5 rounded-lg">
                      Mã: {ts._id.slice(-8).toUpperCase()}
                    </span>
                    <StatusBadge status={ts.status} type="timeslot" />
                  </div>

                  <h3 className="font-headline-md text-base md:text-lg font-bold text-[#2F2722]">
                    {ts.workshopId?.title || 'Workshop'}
                  </h3>

                  <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-[#7A6A5E] font-medium pt-0.5">
                    <span className="flex items-center gap-1.5 capitalize"><Calendar size={15} className="text-[#A65A3A]" /> {dateStr}</span>
                    <span className="flex items-center gap-1.5"><Clock size={15} className="text-[#A65A3A]" /> {startStr} - {endStr}</span>
                    <span className="flex items-center gap-1.5"><Users size={15} className="text-[#A65A3A]" /> {ts.bookedSlots} / {ts.totalSlots} khách đã đặt</span>
                  </div>
                </div>

                <div className="flex gap-2.5 w-full md:w-auto shrink-0 border-t border-[#E6DED5]/60 md:border-t-0 pt-4 md:pt-0">
                  <Link to={`/tour-guide/timeslots/${ts._id}/customers`} className="flex-1 sm:flex-initial">
                    <Button variant="outline" size="sm" className="w-full flex items-center justify-center gap-1.5 font-bold">
                      <Users size={14} /> Khách hàng
                    </Button>
                  </Link>
                  <Link to={`/tour-guide/trip-progress/${ts._id}`} className="flex-1 sm:flex-initial">
                    <Button size="sm" className="w-full flex items-center justify-center gap-1.5 font-bold shadow-xs">
                      <Play size={14} /> Chuyến đi
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AssignedSchedulePage;
