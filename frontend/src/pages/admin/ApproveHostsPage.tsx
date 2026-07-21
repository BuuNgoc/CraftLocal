import React, { useEffect, useState } from 'react';
import hostApplicationApi from '../../api/hostApplicationApi';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';
import PageHeader from '../../components/common/PageHeader';
import EmptyState from '../../components/common/EmptyState';
import Input from '../../components/common/Input';
import { UserCheck, Mail, Phone, FileText, ExternalLink, Calendar, MapPin, X, AlertCircle } from 'lucide-react';

const ApproveHostsPage: React.FC = () => {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');

  // Reject modal state
  const [rejectingAppId, setRejectingAppId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState('');

  const handleViewPdf = async (applicationId: string) => {
    try {
      setLoading(true);
      const res = await hostApplicationApi.viewCertificate(applicationId);
      const blob = new Blob([res.data], { type: "application/pdf" });
      const blobUrl = window.URL.createObjectURL(blob);

      window.open(blobUrl, "_blank", "noopener,noreferrer");

      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
      }, 60000);
    } catch (error: any) {
      console.error("Lỗi xem PDF:", error);
      alert("Không thể mở file PDF. Cloudinary đang chặn quyền hoặc file bị lỗi.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async (applicationId: string, fileName = "certificate.pdf") => {
    try {
      setLoading(true);
      const res = await hostApplicationApi.downloadCertificate(applicationId);
      const blob = new Blob([res.data], { type: "application/pdf" });
      const blobUrl = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(blobUrl);
    } catch (error: any) {
      console.error("Lỗi tải PDF:", error);
      alert("Không thể tải file PDF về máy.");
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = () => {
    setLoading(true);
    hostApplicationApi.getAllForAdmin({ status: statusFilter })
      .then((res) => {
        setApplications(res.data.data?.applications || []);
      })
      .catch((err) => {
        console.error("Lỗi lấy danh sách hồ sơ:", err);
        setApplications([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchApplications();
  }, [statusFilter]);

  const handleApprove = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn phê duyệt hồ sơ này thành Chủ xưởng không?')) return;
    try {
      setLoading(true);
      await hostApplicationApi.approve(id);
      fetchApplications();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Phê duyệt thất bại.');
      setLoading(false);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectReason.trim()) {
      setRejectError('Vui lòng nhập lý do từ chối.');
      return;
    }
    if (!rejectingAppId) return;

    try {
      setLoading(true);
      await hostApplicationApi.reject(rejectingAppId, rejectReason.trim());
      setRejectingAppId(null);
      setRejectReason('');
      setRejectError('');
      fetchApplications();
    } catch (err: any) {
      setRejectError(err.response?.data?.message || 'Từ chối phê duyệt thất bại.');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Duyệt hồ sơ Chủ xưởng" subtitle="Xem xét hồ sơ nâng cấp tài khoản của Khách du lịch thành đối tác Chủ xưởng." />

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-px">
        {(['PENDING', 'APPROVED', 'REJECTED'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setStatusFilter(tab)}
            className={`px-4 py-2 text-xs font-bold transition-all border-b-2 -mb-px ${
              statusFilter === tab
                ? 'border-[#A65A3A] text-[#A65A3A]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'PENDING' && 'Chờ duyệt'}
            {tab === 'APPROVED' && 'Đã duyệt'}
            {tab === 'REJECTED' && 'Đã từ chối'}
          </button>
        ))}
      </div>

      {loading ? (
        <Loading text="Đang tải danh sách hồ sơ..." />
      ) : applications.length === 0 ? (
        <EmptyState
          title="Không có hồ sơ nào"
          description={`Không tìm thấy hồ sơ nào ở trạng thái ${
            statusFilter === 'PENDING' ? 'chờ duyệt' : statusFilter === 'APPROVED' ? 'đã duyệt' : 'đã từ chối'
          }.`}
          icon={<UserCheck size={48} className="text-[#A65A3A] opacity-60" />}
        />
      ) : (
        <div className="space-y-6">
          {applications.map((app) => (
            <div
              key={app._id}
              className="bg-white rounded-3xl border border-[#E6DED5] p-6 shadow-xs space-y-4"
            >
              {/* User Account Info */}
              <div className="flex items-start justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#A65A3A]/10 flex items-center justify-center font-bold text-[#A65A3A] text-sm">
                    {app.userId?.fullName ? app.userId.fullName[0].toUpperCase() : 'U'}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-[#2F2722] text-sm flex items-center gap-2">
                      {app.userId?.fullName || app.fullName}
                      <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded-full text-gray-500 font-bold uppercase">
                        Tài khoản nộp đơn
                      </span>
                    </h4>
                    <div className="flex items-center gap-3 text-xs text-[#7A6A5E] font-semibold mt-0.5">
                      <span className="flex items-center gap-1"><Mail size={12} /> {app.userId?.email || app.email}</span>
                      <span className="flex items-center gap-1"><Phone size={12} /> {app.userId?.phone || app.phone}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right text-xs text-gray-400 font-semibold flex items-center gap-1">
                  <Calendar size={13} /> Gửi ngày: {new Date(app.createdAt).toLocaleDateString('vi-VN')}
                </div>
              </div>

              {/* Workshop Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold text-gray-600">
                <div className="space-y-2">
                  <div>
                    <span className="text-[10px] text-gray-400 block uppercase">Tên xưởng</span>
                    <strong className="text-gray-900 text-sm">{app.workshopName}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 block uppercase">Chủ xưởng đăng ký</span>
                    <strong className="text-gray-900 text-sm">{app.ownerName}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 block uppercase">SĐT chủ xưởng</span>
                    <strong className="text-gray-900 text-sm">{app.ownerPhone}</strong>
                  </div>
                </div>

                <div className="space-y-2">
                  <div>
                    <span className="text-[10px] text-gray-400 block uppercase">Chuyên môn / Lĩnh vực</span>
                    <strong className="text-gray-900 text-sm">{app.specialization || 'Chưa cung cấp'}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 block uppercase">Kinh nghiệm hoạt động</span>
                    <strong className="text-gray-900 text-sm">{app.experience || 'Chưa cung cấp'}</strong>
                  </div>
                  <div className="flex items-start gap-1">
                    <MapPin size={14} className="text-gray-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] text-gray-400 block uppercase">Địa chỉ xưởng</span>
                      <strong className="text-gray-900">{app.businessAddress?.fullAddress}</strong>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-3 space-y-2">
                <span className="text-[10px] text-gray-400 block uppercase font-semibold">Mô tả hoạt động xưởng</span>
                <p className="text-xs text-gray-700 font-semibold leading-relaxed whitespace-pre-line bg-gray-50 p-3 rounded-xl border border-gray-100">
                  {app.description}
                </p>
              </div>

              {/* Certificate File and Actions */}
              <div className="border-t border-gray-100 pt-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1 bg-[#A65A3A]/10 text-[#A65A3A] px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase">
                    <FileText size={12} /> PDF
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-800 font-extrabold truncate max-w-[200px] md:max-w-[300px]" title={app.certificateFile?.originalName}>
                      {app.certificateFile?.originalName || 'certificate.pdf'}
                    </p>
                    {app.certificateFile?.size && (
                      <p className="text-[10px] text-gray-400 font-bold mt-0.5">
                        Dung lượng: {(app.certificateFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 ml-1">
                    <button
                      type="button"
                      onClick={() => handleViewPdf(app._id)}
                      className="inline-flex items-center gap-1 text-[11px] bg-gray-50 hover:bg-gray-100 text-gray-700 px-3 py-1.5 rounded-xl transition-colors font-bold border border-gray-250"
                    >
                      Xem PDF <ExternalLink size={11} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownloadPdf(app._id, app.certificateFile?.originalName || 'certificate.pdf')}
                      className="inline-flex items-center gap-1 text-[11px] bg-[#A65A3A] hover:bg-[#904C2F] text-white px-3 py-1.5 rounded-xl transition-colors font-bold border border-[#A65A3A]"
                    >
                      Tải xuống
                    </button>
                  </div>
                </div>

                {app.status === 'PENDING' && (
                  <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                    <Button size="sm" onClick={() => handleApprove(app._id)} className="flex-1 sm:flex-initial">
                      Phê duyệt
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setRejectingAppId(app._id)} className="flex-1 sm:flex-initial text-red-600 border-red-200 hover:bg-red-50">
                      Từ chối
                    </Button>
                  </div>
                )}

                {app.status === 'REJECTED' && (
                  <div className="text-xs text-red-600 bg-red-50 border border-red-100 px-3.5 py-2 rounded-xl font-bold flex-1">
                    Lý do từ chối: <span className="text-gray-900 font-semibold">{app.rejectReason}</span>
                  </div>
                )}

                {app.status === 'APPROVED' && (
                  <div className="text-xs text-green-600 bg-green-50 border border-green-100 px-3.5 py-2 rounded-xl font-bold">
                    Đã duyệt thành công
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {rejectingAppId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white rounded-3xl max-w-md w-full border border-gray-200 shadow-xl overflow-hidden animate-[scaleIn_0.2s_ease-out]">
            <div className="px-6 py-4 border-b border-gray-150 flex items-center justify-between">
              <h3 className="font-extrabold text-[#0F172A] text-sm uppercase tracking-wider">Từ chối yêu cầu đối tác</h3>
              <button onClick={() => { setRejectingAppId(null); setRejectReason(''); setRejectError(''); }} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRejectSubmit} className="p-6 space-y-4">
              {rejectError && (
                <div className="p-3 bg-red-50 border border-red-150 text-red-700 rounded-xl text-xs font-semibold flex items-center gap-1.5">
                  <AlertCircle size={14} className="shrink-0" />
                  {rejectError}
                </div>
              )}

              <div className="flex flex-col w-full">
                <label className="mb-1.5 block text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Lý do từ chối *
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => { setRejectReason(e.target.value); setRejectError(''); }}
                  placeholder="Ví dụ: Tài liệu chứng nhận bị mờ, không khớp thông tin..."
                  rows={4}
                  className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#A65A3A]/30 focus:border-[#A65A3A] transition-all font-semibold text-gray-900"
                  required
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => { setRejectingAppId(null); setRejectReason(''); setRejectError(''); }}>
                  Hủy bỏ
                </Button>
                <Button type="submit" variant="danger" size="sm">
                  Xác nhận từ chối
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApproveHostsPage;
