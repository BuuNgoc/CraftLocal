import React, { useState, useEffect } from 'react';
import tourGuideApi from '../../api/tourGuideApi';
import workshopApi from '../../api/workshopApi';
import type { Timeslot } from '../../types/timeslot.type';
import type { User } from '../../types/user.type';
import type { Workshop } from '../../types/workshop.type';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import Stepper from '../../components/common/Stepper';
import Select from '../../components/common/Select';
import { UserCheck, Users } from 'lucide-react';

const AssignGuidePage: React.FC = () => {
  const [timeslots, setTimeslots] = useState<Timeslot[]>([]);
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [guides, setGuides] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedWorkshop, setSelectedWorkshop] = useState('');
  const [selectedTimeslot, setSelectedTimeslot] = useState('');
  const [selectedGuide, setSelectedGuide] = useState('');

  const fetchData = async () => {
    try {
      const [tsRes, wsRes, gRes] = await Promise.all([
        tourGuideApi.getHostTimeslots(),
        workshopApi.getByHost(),
        tourGuideApi.getByHost()
      ]);
      const tsData = tsRes.data.data || [];
      const wsData = wsRes.data.data || [];
      const gData = gRes.data.data || [];

      setTimeslots(tsData);
      setWorkshops(wsData);
      setGuides(gData);

      // Parse query parameters
      const params = new URLSearchParams(window.location.search);
      const queryWsId = params.get('workshopId');
      const queryTsId = params.get('timeslotId');
      if (queryWsId) {
        setSelectedWorkshop(queryWsId);
      }
      if (queryTsId) {
        setSelectedTimeslot(queryTsId);
      }
    } catch (err) {
      console.error(err);
    } finaly: {
      // handled below
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAssign = async () => {
    if (!selectedTimeslot || !selectedGuide) return;
    try {
      setLoading(true);
      await tourGuideApi.assignToTimeslot(selectedTimeslot, selectedGuide);
      setSelectedTimeslot('');
      setSelectedGuide('');
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gán thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleUnassign = async (timeslotId: string) => {
    if (!window.confirm('Bạn có chắc muốn bỏ gán hướng dẫn viên này không?')) return;
    try {
      setLoading(true);
      await tourGuideApi.assignToTimeslot(timeslotId, '');
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Bỏ gán thất bại');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading text="Đang xử lý phân công..." />;

  const activeTimeslots = timeslots.filter(ts => !['CANCELLED', 'COMPLETED'].includes(ts.status));

  const filteredTimeslotsForDropdown = activeTimeslots.filter(ts => {
    if (selectedWorkshop && ts.workshopId?._id !== selectedWorkshop) return false;
    return !ts.tourGuideId || ts._id === selectedTimeslot;
  });

  const params = new URLSearchParams(window.location.search);
  const filterGuideId = params.get('guideId');

  const assignedTimeslots = timeslots.filter((ts) => {
    if (!ts.tourGuideId) return false;
    if (filterGuideId) {
      return (ts.tourGuideId._id || ts.tourGuideId) === filterGuideId;
    }
    return true;
  });

  const formatTimeslotLabel = (ts: Timeslot) => {
    const date = new Date(ts.startTime).toLocaleDateString('vi-VN');
    const startStr = new Date(ts.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const endStr = new Date(ts.endTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    return `${date} (${startStr} - ${endStr})`;
  };

  // Determine current stepper step
  let currentStep = 0;
  if (selectedWorkshop) currentStep = 1;
  if (selectedTimeslot) currentStep = 2;
  if (selectedGuide) currentStep = 3;

  const steps = [
    { label: 'Chọn Workshop', description: 'Chọn chủ đề trải nghiệm' },
    { label: 'Chọn Khung giờ', description: 'Chọn giờ hoạt động trống' },
    { label: 'Chọn Hướng dẫn viên', description: 'Gán nhân sự phụ trách' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Phân công Hướng dẫn viên"
        subtitle="Quản lý nhân sự và gán hướng dẫn viên quản lý lớp học check-in du khách."
      />

      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-2xs">
        <Stepper steps={steps} currentStep={currentStep >= 3 ? 2 : currentStep} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form panel */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-2xs h-fit space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-150">
            <UserCheck size={18} className="text-[#A65A3A]" />
            <h2 className="text-[14px] font-extrabold text-[#0F172A]">Phân công công việc</h2>
          </div>

          <div className="space-y-4">
            <Select
              label="1. Chọn Workshop"
              value={selectedWorkshop}
              onChange={(e) => {
                setSelectedWorkshop(e.target.value);
                setSelectedTimeslot('');
              }}
              options={workshops.map(ws => ({ value: ws._id, label: ws.title }))}
              placeholder="-- Chọn Workshop --"
            />

            <Select
              label="2. Chọn Khung giờ trống"
              value={selectedTimeslot}
              onChange={(e) => setSelectedTimeslot(e.target.value)}
              options={filteredTimeslotsForDropdown.map(ts => ({ value: ts._id, label: formatTimeslotLabel(ts) }))}
              placeholder={filteredTimeslotsForDropdown.length === 0 ? 'Không có khung giờ trống khả dụng' : '-- Chọn Khung giờ --'}
              disabled={!selectedWorkshop || filteredTimeslotsForDropdown.length === 0}
            />

            <Select
              label="3. Chọn Hướng dẫn viên"
              value={selectedGuide}
              onChange={(e) => setSelectedGuide(e.target.value)}
              options={guides.map(g => ({ value: g._id, label: `${g.fullName} (${g.phone})` }))}
              placeholder="-- Chọn Hướng dẫn viên --"
              disabled={!selectedTimeslot}
            />

            <Button
              onClick={handleAssign}
              disabled={!selectedTimeslot || !selectedGuide}
              fullWidth
              className="mt-2"
            >
              Xác nhận phân công
            </Button>
          </div>
        </div>

        {/* History Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-150">
            <div className="flex items-center gap-2">
              <Users size={18} className="text-[#A65A3A]" />
              <h2 className="text-[14px] font-extrabold text-[#0F172A]">Lịch sử phân công hoạt động</h2>
            </div>
            {filterGuideId && (
              <button
                onClick={() => {
                  window.history.replaceState({}, '', window.location.pathname);
                  fetchData();
                }}
                className="text-xs font-bold text-[#A65A3A] hover:underline"
              >
                Xem tất cả
              </button>
            )}
          </div>

          <div className="overflow-x-auto rounded-xl border border-[#E5E7EB]">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#E5E7EB] bg-gray-50 text-gray-500 font-bold uppercase tracking-wider">
                  <th className="p-3.5 text-left font-bold">Workshop</th>
                  <th className="p-3.5 text-left font-bold">Thời gian</th>
                  <th className="p-3.5 text-left font-bold">Hướng dẫn viên</th>
                  <th className="p-3.5 text-center font-bold">Khách</th>
                  <th className="p-3.5 text-left font-bold">Trạng thái</th>
                  <th className="p-3.5 text-center font-bold">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {assignedTimeslots.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-400 font-bold italic">
                      Chưa có khung giờ nào được gán hướng dẫn viên.
                    </td>
                  </tr>
                ) : (
                  assignedTimeslots.map((ts) => (
                    <tr key={ts._id} className="border-b border-gray-150 hover:bg-gray-50/50 transition-colors">
                      <td className="p-3.5 font-bold text-gray-900">{ts.workshopId?.title || 'Workshop'}</td>
                      <td className="p-3.5 font-medium text-gray-500">
                        {new Date(ts.startTime).toLocaleDateString('vi-VN')} |{' '}
                        {new Date(ts.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="p-3.5 font-bold text-[#A65A3A]">
                        {ts.tourGuideId?.fullName || 'N/A'}
                      </td>
                      <td className="p-3.5 text-center font-bold text-gray-950">
                        {ts.bookedSlots} / {ts.totalSlots}
                      </td>
                      <td className="p-3.5">
                        <StatusBadge status={ts.status} type="timeslot" />
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="flex justify-center items-center gap-3">
                          <button
                            onClick={() => {
                              setSelectedWorkshop(ts.workshopId?._id || '');
                              setSelectedTimeslot(ts._id);
                              setSelectedGuide(ts.tourGuideId?._id || ts.tourGuideId || '');
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="text-xs font-bold text-[#2563EB] hover:underline"
                            disabled={['CANCELLED', 'COMPLETED'].includes(ts.status)}
                          >
                            Đổi HĐV
                          </button>
                          <span className="text-gray-200">|</span>
                          <button
                            onClick={() => handleUnassign(ts._id)}
                            className="text-xs font-bold text-[#DC2626] hover:underline"
                            disabled={['CANCELLED', 'COMPLETED'].includes(ts.status)}
                          >
                            Bỏ gán
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignGuidePage;
