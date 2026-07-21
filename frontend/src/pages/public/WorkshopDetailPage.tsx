import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Clock, Users, Star, Check, Calendar, ArrowLeft, ShieldCheck, Heart } from 'lucide-react';
import workshopApi from '../../api/workshopApi';
import reviewApi from '../../api/reviewApi';
import bookingApi from '../../api/bookingApi';
import paymentApi from '../../api/paymentApi';
import type { Workshop } from '../../types/workshop.type';
import type { Timeslot } from '../../types/timeslot.type';
import { formatCurrencyShort } from '../../utils/formatCurrency';
import { useAuth } from '../../hooks/useAuth';
import { TIMESLOT_STATUS_LABELS } from '../../utils/constants';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';
import StatusBadge from '../../components/common/StatusBadge';
import Card from '../../components/common/Card';

import ImageWithFallback from '../../components/common/ImageWithFallback';

const WorkshopDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [workshop, setWorkshop] = useState<Workshop | null>(null);
  const [timeslots, setTimeslots] = useState<Timeslot[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTimeslot, setSelectedTimeslot] = useState('');
  const [guests, setGuests] = useState(1);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      workshopApi.getById(id),
      workshopApi.getTimeslots(id).catch(() => ({ data: { data: [] } })),
      reviewApi.getByWorkshop(id).catch(() => ({ data: { data: [] } })),
    ]).then(([wsRes, tsRes, rvRes]) => {
      setWorkshop(wsRes.data.data);
      setTimeslots(tsRes.data.data || []);
      setReviews(rvRes.data.data || []);
    }).catch((err) => {
      console.error(err);
      setWorkshop(null);
    })
    .finally(() => setLoading(false));
  }, [id]);

  const handleBook = async () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    if (!selectedTimeslot || !id) return;
    setBooking(true);
    try {
      // Step 1: Create booking (or get existing pending)
      const bookingRes = await bookingApi.create({
        timeslotId: selectedTimeslot,
        quantity: guests,
      });
      const data = bookingRes.data.data;
      const bookingId = data?.bookingId || data?.booking?._id;

      if (!bookingId) {
        throw new Error('Không nhận được thông tin booking');
      }

      // If reused pending booking already has a payment link, redirect directly
      if (data?.reusePendingBooking && data?.payment?.checkoutUrl) {
        window.location.href = data.payment.checkoutUrl;
        return;
      }

      // Step 2: Create payOS payment link
      const paymentRes = await paymentApi.createBookingPayment(bookingId);
      const paymentData = paymentRes.data.data;

      // Step 3: Redirect to payOS checkout
      if (paymentData?.checkoutUrl) {
        window.location.href = paymentData.checkoutUrl;
      } else {
        throw new Error('Không nhận được link thanh toán');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Đặt vé thất bại');
    } finally {
      setBooking(false);
    }
  };

  if (loading) return <Loading text="Đang tải chi tiết workshop..." />;
  if (!workshop) {
    return (
      <div className="text-center py-20 bg-[#FAF7F2] min-h-screen flex flex-col items-center justify-center">
        <p className="text-lg text-[#7A6A5E] mb-4">Không tìm thấy workshop hoặc đã xảy ra lỗi.</p>
        <Button onClick={() => navigate(-1)} variant="outline">
          <ArrowLeft size={16} className="mr-2" /> Quay lại
        </Button>
      </div>
    );
  }

  const selectedTsObject = timeslots.find(t => t._id === selectedTimeslot);

  return (
    <div className="bg-[#FAF7F2] min-h-screen pb-16">
      {/* Back navigation & Cover Gallery */}
      <div className="max-w-[1280px] mx-auto px-5 md:px-8 lg:px-12 pt-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-[#7A6A5E] hover:text-[#A65A3A] font-semibold text-sm mb-6 transition-colors"
        >
          <ArrowLeft size={16} /> Quay lại danh sách
        </button>

        {/* Gallery */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 rounded-3xl overflow-hidden shadow-sm border border-[#E6DED5]">
          <div className="md:col-span-2 h-[320px] md:h-[450px] overflow-hidden">
            <ImageWithFallback
              src={workshop.images?.[0] || workshop.thumbnail || ''}
              fallbackSrc="/images/fallback-workshop.jpg"
              alt={workshop.title}
              className="w-full h-full object-cover hover:scale-102 transition-transform duration-500"
            />
          </div>
          <div className="hidden md:flex flex-col gap-4 h-[450px]">
            <div className="flex-1 overflow-hidden">
              <ImageWithFallback
                src={workshop.images?.[1] || workshop.images?.[0] || workshop.thumbnail || ''}
                fallbackSrc="/images/fallback-workshop.jpg"
                alt={workshop.title}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="flex-1 overflow-hidden relative">
              <ImageWithFallback
                src={workshop.images?.[2] || workshop.images?.[0] || workshop.thumbnail || ''}
                fallbackSrc="/images/fallback-workshop.jpg"
                alt={workshop.title}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white font-bold text-sm">
                +{workshop.images?.length || 1} Ảnh
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-5 md:px-8 lg:px-12 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* Main Info Columns */}
          <div className="lg:col-span-2 space-y-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="px-3 py-1 bg-[#A65A3A]/10 text-[#A65A3A] rounded-full text-xs font-bold uppercase tracking-wider">
                  {workshop.categoryId?.name || 'Trải nghiệm'}
                </span>
                <span className="px-3 py-1 bg-[#2F2722]/5 text-[#2F2722]/70 rounded-full text-xs font-semibold">
                  Mức độ: {workshop.difficulty || 'Trung bình'}
                </span>
              </div>
              <h1 className="font-headline-lg text-3xl md:text-4xl font-bold text-[#2F2722] leading-tight mb-4">
                {workshop.title}
              </h1>
              
              <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-sm text-[#7A6A5E] font-medium border-b border-[#E6DED5]/60 pb-6">
                <span className="flex items-center gap-1.5"><MapPin size={16} className="text-[#A65A3A]" /> {workshop.locationLabel}</span>
                <span className="flex items-center gap-1.5"><Clock size={16} className="text-[#A65A3A]" /> {workshop.duration} phút</span>
                <span className="flex items-center gap-1.5"><Users size={16} className="text-[#A65A3A]" /> Tối đa {workshop.maxGuestsPerSlot || 12} khách/lượt</span>
                <span className="flex items-center gap-1.5">
                  <Star size={16} className="text-amber-500 fill-amber-500" /> 
                  <strong className="text-[#2F2722]">{workshop.averageRating || 0}</strong> ({workshop.totalReviews || 0} đánh giá)
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-3">
              <h2 className="text-xl font-bold text-[#2F2722] font-headline-md">Mô tả chi tiết</h2>
              <p className="text-[#2F2722]/90 leading-relaxed text-[15px] whitespace-pre-line">
                {workshop.description}
              </p>
            </div>

            {/* Included / Required items */}
            {workshop.includedItems && workshop.includedItems.length > 0 && (
              <div className="bg-white rounded-2xl border border-[#E6DED5] p-6 space-y-4 shadow-sm">
                <h3 className="text-lg font-bold text-[#2F2722]">Chi phí bao gồm</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {workshop.includedItems.map((item) => (
                    <div key={item} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-[#2F855A]/10 flex items-center justify-center text-[#2F855A]">
                        <Check size={12} strokeWidth={3} />
                      </div>
                      <span className="text-sm font-medium text-[#2F2722]/85">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Address & Location details */}
            {workshop.address && (
              <div className="space-y-3">
                <h2 className="text-xl font-bold text-[#2F2722] font-headline-md">Địa điểm trải nghiệm</h2>
                <div className="p-5 bg-white border border-[#E6DED5] rounded-2xl flex items-start gap-4">
                  <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#E6DED5] text-[#A65A3A]">
                    <MapPin size={22} />
                  </div>
                  <div>
                    <p className="font-bold text-[#2F2722] text-sm">Địa chỉ chi tiết</p>
                    <p className="text-sm text-[#7A6A5E] mt-1">
                      {typeof workshop.address === 'string' ? workshop.address : workshop.address?.fullAddress || ''}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Timeslots Selector */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-[#2F2722] font-headline-md">Chọn khung giờ trải nghiệm</h2>
              {timeslots.length === 0 ? (
                <div className="p-5 rounded-2xl border border-red-200 bg-red-50 text-red-700 text-sm font-semibold">
                  Workshop này hiện chưa có khung giờ khả dụng nào từ nghệ nhân.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {timeslots.map((ts) => {
                    const isPast = new Date(ts.startTime).getTime() <= Date.now();
                    const isFull = ts.status === 'FULL' || ts.availableSlots <= 0;
                    const isDisabled = isPast || isFull;
                    const isSelected = selectedTimeslot === ts._id;
                    const dateStr = new Date(ts.startTime).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                    const startStr = new Date(ts.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                    const endStr = new Date(ts.endTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

                    return (
                      <button
                        key={ts._id}
                        onClick={() => !isDisabled && setSelectedTimeslot(ts._id)}
                        disabled={isDisabled}
                        className={`w-full p-4.5 rounded-2xl border text-left flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-all ${
                          isSelected && !isDisabled
                            ? 'border-[#A65A3A] bg-[#A65A3A]/5 shadow-[0_0_0_1px_#A65A3A]'
                            : isDisabled
                            ? 'border-[#E6DED5]/60 bg-gray-50 opacity-50 cursor-not-allowed'
                            : 'border-[#E6DED5] bg-white hover:border-[#A65A3A]/40'
                        }`}
                      >
                        <div className="flex items-start gap-3.5">
                          <div className={`p-2.5 rounded-xl border ${isSelected && !isDisabled ? 'bg-[#A65A3A]/10 border-[#A65A3A]/20 text-[#A65A3A]' : 'bg-[#FAF7F2] border-[#E6DED5] text-[#7A6A5E]'}`}>
                            <Calendar size={20} />
                          </div>
                          <div>
                            <p className="font-bold text-[#2F2722] text-[15px] capitalize">{dateStr}</p>
                            <p className="text-xs text-[#7A6A5E] font-medium mt-0.5">{startStr} - {endStr}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 self-end sm:self-center">
                          <div className="text-right hidden sm:block">
                            <p className="text-xs text-[#7A6A5E] font-semibold">Khả dụng</p>
                            <p className="text-sm font-bold text-[#2F2722]">{ts.availableSlots} / {ts.totalSlots} chỗ</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            isPast
                              ? 'bg-gray-200 text-gray-500'
                              : isFull 
                              ? 'bg-red-100 text-red-700' 
                              : isSelected
                              ? 'bg-[#A65A3A] text-white'
                              : 'bg-[#2F855A]/10 text-[#2F855A]'
                          }`}>
                            {isPast ? 'Đã qua' : isFull ? 'Hết chỗ' : isSelected ? 'Đang chọn' : 'Còn chỗ'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Reviews */}
            <div className="space-y-4 border-t border-[#E6DED5]/60 pt-8">
              <h2 className="text-xl font-bold text-[#2F2722] font-headline-md">Đánh giá từ du khách ({reviews.length})</h2>
              {reviews.length === 0 ? (
                <p className="text-sm text-[#7A6A5E] italic">Chưa có đánh giá nào cho trải nghiệm này.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {reviews.map((r: any) => (
                    <Card key={r._id} className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#A65A3A]/15 flex items-center justify-center font-bold text-[#A65A3A] text-sm">
                          {(r.touristId?.fullName || 'K')[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-[#2F2722]">{r.touristId?.fullName || 'Du khách ẩn danh'}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                size={12}
                                className={i < r.rating ? 'text-amber-500 fill-amber-500' : 'text-gray-300'}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-[#7A6A5E] leading-relaxed italic">
                        "{r.comment || 'Trải nghiệm tuyệt vời!'}"
                      </p>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Booking Side Widget */}
          <div>
            <div className="sticky top-24 bg-white rounded-3xl border border-[#E6DED5] p-6 shadow-xl space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-[#7A6A5E] font-semibold block uppercase tracking-wider">Đơn giá</span>
                  <span className="text-3xl font-extrabold text-[#A65A3A]">{formatCurrencyShort(workshop.price)}</span>
                  <span className="text-xs text-[#7A6A5E] font-medium"> / khách</span>
                </div>
                {workshop.hostName && (
                  <div className="text-right">
                    <span className="text-xs text-[#7A6A5E] font-semibold block">Nghệ nhân</span>
                    <span className="text-sm font-bold text-[#A65A3A]">{workshop.hostName}</span>
                  </div>
                )}
              </div>

              <div className="space-y-4 border-t border-[#E6DED5]/60 pt-4">
                <div>
                  <label className="text-xs font-bold text-[#2F2722] block mb-2 uppercase tracking-wide">Số khách</label>
                  <input
                    type="number"
                    min={1}
                    max={workshop.maxGuestsPerSlot || 12}
                    value={guests}
                    onChange={(e) => setGuests(Math.max(1, Number(e.target.value)))}
                    className="w-full px-4 h-12 border border-[#E6DED5] rounded-xl text-center font-bold text-[#2F2722] outline-none focus:border-[#A65A3A] focus:ring-4 focus:ring-[#A65A3A]/10 transition-all"
                  />
                </div>

                {selectedTsObject && (
                  <div className="p-3.5 bg-[#FAF7F2] rounded-2xl border border-[#E6DED5] space-y-1 text-xs">
                    <p className="font-bold text-[#2F2722]">Khung giờ đã chọn:</p>
                    <p className="text-[#7A6A5E]">
                      {new Date(selectedTsObject.startTime).toLocaleDateString('vi-VN')}
                    </p>
                    <p className="text-[#A65A3A] font-semibold">
                      {new Date(selectedTsObject.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - {new Date(selectedTsObject.endTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                )}
              </div>

              <div className="border-t border-[#E6DED5]/60 pt-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-[#7A6A5E]">Tạm tính ({guests} khách)</span>
                  <span className="text-sm font-semibold text-[#2F2722]">{formatCurrencyShort(workshop.price * guests)}</span>
                </div>
                <div className="flex justify-between items-center font-extrabold text-lg border-t border-dashed border-[#E6DED5] pt-2">
                  <span className="text-[#2F2722]">Tổng tiền</span>
                  <span className="text-[#A65A3A] text-xl">{formatCurrencyShort(workshop.price * guests)}</span>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <Button
                  fullWidth
                  size="lg"
                  disabled={timeslots.length === 0 || !selectedTimeslot || booking}
                  isLoading={booking}
                  onClick={handleBook}
                  className="shadow-md"
                >
                  Đặt trải nghiệm ngay
                </Button>
                {timeslots.length === 0 ? (
                  <p className="text-xs text-center text-[#DC2626] font-semibold">
                    Hiện chưa có lịch đặt khả dụng.
                  </p>
                ) : !selectedTimeslot ? (
                  <p className="text-xs text-center text-[#7A6A5E] font-medium">
                    Vui lòng chọn khung giờ cụ thể ở danh sách bên cạnh.
                  </p>
                ) : null}
              </div>

              <div className="flex items-center justify-center gap-2 text-[11px] text-[#7A6A5E] font-semibold text-center border-t border-[#E6DED5]/40 pt-4">
                <ShieldCheck size={14} className="text-[#2F855A]" />
                <span>Thanh toán bảo mật · Nhận vé điện tử tức thì</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkshopDetailPage;
