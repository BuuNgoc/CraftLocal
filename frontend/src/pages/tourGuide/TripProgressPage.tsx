import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Circle, PlayCircle, StopCircle, ArrowLeft, Calendar } from 'lucide-react';
import tourGuideApi from '../../api/tourGuideApi';
import Button from '../../components/common/Button';
import PageHeader from '../../components/common/PageHeader';

type TripStatus = 'NOT_STARTED' | 'ONGOING' | 'FINISHED';

const tripLabels: Record<TripStatus, string> = {
  NOT_STARTED: 'Chưa bắt đầu',
  ONGOING: 'Đang diễn ra',
  FINISHED: 'Đã hoàn thành',
};

const steps = [
  { label: 'Đón khách', desc: 'Kiểm tra vé check-in tại quầy và giới thiệu tổng quan' },
  { label: 'Bắt đầu workshop', desc: 'Dẫn khách vào khu vực làm việc và nghệ nhân giới thiệu kỹ thuật' },
  { label: 'Thực hành', desc: 'Khách tự tay thực hiện nhào đất, nặn gốm dưới sự hướng dẫn' },
  { label: 'Hoàn thiện', desc: 'Đưa sản phẩm đi nung nhiệt hoặc phơi khô và trang trí hoàn thiện' },
  { label: 'Kết thúc', desc: 'Đóng gói sản phẩm gửi tặng khách, chào tạm biệt & chụp ảnh lưu niệm' },
];

const TripProgressPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tripStatus, setTripStatus] = useState<TripStatus>('NOT_STARTED');
  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const handleStart = async () => {
    try {
      setSubmitting(true);
      if (id) await tourGuideApi.startTimeslot(id);
      setTripStatus('ONGOING');
      setCurrentStep(0);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể bắt đầu chuyến đi');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinish = async () => {
    try {
      setSubmitting(true);
      if (id) await tourGuideApi.finishTimeslot(id);
      setTripStatus('FINISHED');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể kết thúc chuyến đi');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Tiến độ chuyến đi" subtitle="Cập nhật từng bước hoạt động của workshop để báo cáo trạng thái thời gian thực." />
        <button
          onClick={() => navigate('/tour-guide/schedules')}
          className="flex items-center gap-1.5 text-xs font-semibold text-[#7A6A5E] hover:text-[#A65A3A] transition-colors"
        >
          <ArrowLeft size={16} /> Quay lại lịch gán
        </button>
      </div>

      <div className="bg-white rounded-[32px] border border-[#E6DED5] overflow-hidden shadow-sm">
        {/* Status Header Banner */}
        <div className="bg-[#2F2722] p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-sm">🏺</div>
            <span className="font-bold text-sm tracking-wide uppercase">Trạng thái workshop</span>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider ${
            tripStatus === 'NOT_STARTED'
              ? 'bg-gray-100/15 text-gray-200 border border-gray-200/20'
              : tripStatus === 'ONGOING'
              ? 'bg-[#A65A3A]/20 text-[#EADCCB] border border-[#A65A3A]/30'
              : 'bg-[#2F855A]/20 text-green-200 border border-green-200/30'
          }`}>
            {tripLabels[tripStatus]}
          </span>
        </div>

        {/* Milestone Steps */}
        <div className="p-6 md:p-8 space-y-6">
          <div className="relative border-l-2 border-[#E6DED5]/80 ml-3 space-y-8 py-2">
            {steps.map((step, i) => {
              const isDone = i < currentStep || tripStatus === 'FINISHED';
              const isActive = i === currentStep && tripStatus === 'ONGOING';
              const isFuture = i > currentStep && tripStatus !== 'FINISHED';

              return (
                <div key={i} className="relative pl-7 flex items-start gap-4">
                  {/* Step Dot */}
                  <div className="absolute -left-[11px] top-1">
                    {isDone ? (
                      <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-white ring-4 ring-green-100">
                        <CheckCircle size={14} />
                      </div>
                    ) : isActive ? (
                      <div className="w-5 h-5 rounded-full bg-[#A65A3A] flex items-center justify-center text-white ring-4 ring-[#A65A3A]/25 animate-pulse">
                        <PlayCircle size={14} />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-white border-2 border-[#E6DED5] flex items-center justify-center" />
                    )}
                  </div>

                  {/* Step Label */}
                  <div className={`${isDone || isActive ? 'opacity-100' : 'opacity-40'} transition-opacity`}>
                    <p className="font-bold text-[#2F2722] text-[15px]">{step.label}</p>
                    <p className="text-xs text-[#7A6A5E] font-medium mt-1 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Button Controls */}
      <div className="flex gap-3">
        {tripStatus === 'NOT_STARTED' && (
          <Button onClick={handleStart} fullWidth size="lg" isLoading={submitting}>
            <PlayCircle size={18} className="mr-2" /> Bắt đầu chuyến đi ngay
          </Button>
        )}
        {tripStatus === 'ONGOING' && currentStep < steps.length - 1 && (
          <Button onClick={() => setCurrentStep(currentStep + 1)} fullWidth size="lg">
            Hoàn thành bước này & Tiếp theo
          </Button>
        )}
        {tripStatus === 'ONGOING' && currentStep === steps.length - 1 && (
          <Button onClick={handleFinish} variant="secondary" fullWidth size="lg" isLoading={submitting}>
            <StopCircle size={18} className="mr-2" /> Kết thúc chuyến đi
          </Button>
        )}
        {tripStatus === 'FINISHED' && (
          <div className="p-6 bg-green-50 border border-green-200 rounded-3xl text-center w-full shadow-xs">
            <CheckCircle size={36} className="mx-auto mb-2.5 text-green-500" />
            <p className="font-bold text-green-800">Chuyến đi đã kết thúc tốt đẹp!</p>
            <p className="text-xs text-green-600 font-semibold mt-1">Cảm ơn bạn đã hoàn thành phân công công việc.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TripProgressPage;
