import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Camera, Save, X, CheckCircle, AlertCircle, User, MapPin, Shield, Mail, Phone, CalendarDays, Loader2, FileText, Check, ExternalLink } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import authApi from '../api/authApi';
import type { UpdateProfilePayload } from '../api/authApi';
import { uploadApi } from '../api/uploadApi';
import { hostApplicationApi } from '../api/hostApplicationApi';
import axiosClient from '../api/axiosClient';
import { ROLE_LABELS } from '../utils/constants';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import PageHeader from '../components/common/PageHeader';
import Loading from '../components/common/Loading';

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_PDF_SIZE = 10 * 1024 * 1024; // 10MB


const ProfilePage: React.FC = () => {
  const { user, updateCurrentUser, fetchProfile } = useAuth();

  // Form state
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');

  // Address state
  const [addrFullName, setAddrFullName] = useState('');
  const [addrPhone, setAddrPhone] = useState('');
  const [addrLine, setAddrLine] = useState('');
  const [addrWard, setAddrWard] = useState('');
  const [addrDistrict, setAddrDistrict] = useState('');
  const [addrCity, setAddrCity] = useState('');
  const [addrProvince, setAddrProvince] = useState('');
  const [addrNote, setAddrNote] = useState('');

  // Avatar state
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // UI state
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [pageLoading, setPageLoading] = useState(true);

  // Host application state
  const [application, setApplication] = useState<any>(null);
  const [appLoading, setAppLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [showHostForm, setShowHostForm] = useState(false);

  // Host form state
  const [workshopName, setWorkshopName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [businessAddrLine, setBusinessAddrLine] = useState('');
  const [businessAddrWard, setBusinessAddrWard] = useState('');
  const [businessAddrDistrict, setBusinessAddrDistrict] = useState('');
  const [businessAddrCity, setBusinessAddrCity] = useState('');
  const [businessAddrProvince, setBusinessAddrProvince] = useState('');
  const [description, setDescription] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [experience, setExperience] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const fetchMyApplication = async () => {
    try {
      const res = await hostApplicationApi.getMyApplication();
      setApplication(res.data.data?.application || null);
    } catch (err) {
      console.error("Lỗi lấy thông tin ứng tuyển:", err);
    } finally {
      setAppLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Populate form from user data
  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setPhone(user.phone || '');
      setAvatarPreview(user.avatar || null);

      // Address
      const addr = user.defaultAddress;
      if (addr) {
        setAddrFullName(addr.fullName || '');
        setAddrPhone(addr.phone || '');
        setAddrLine(addr.addressLine || '');
        setAddrWard(addr.ward || '');
        setAddrDistrict(addr.district || '');
        setAddrCity(addr.city || '');
        setAddrProvince(addr.province || '');
        setAddrNote(addr.note || '');
      }
      setPageLoading(false);
      fetchMyApplication();
    }
  }, [user]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setErrorMsg('Chỉ chấp nhận ảnh JPG, PNG hoặc WEBP.');
      return;
    }
    // Validate size
    if (file.size > MAX_FILE_SIZE) {
      setErrorMsg('Ảnh tối đa 5MB.');
      return;
    }

    setErrorMsg('');
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(user?.avatar || null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      setErrorMsg('Họ và tên không được để trống.');
      return;
    }

    setErrorMsg('');
    setSuccessMsg('');
    setSaving(true);

    try {
      let avatarUrl = user?.avatar || '';

      // Upload new avatar if selected
      if (avatarFile) {
        setUploading(true);
        try {
          const uploadRes = await uploadApi.uploadSingle(avatarFile, 'avatars');
          const uploadData = uploadRes.data.data;
          avatarUrl = uploadData.secureUrl || uploadData.url || '';
        } catch (uploadErr: any) {
          setErrorMsg(uploadErr.response?.data?.message || 'Lỗi upload ảnh. Vui lòng thử lại.');
          setSaving(false);
          setUploading(false);
          return;
        }
        setUploading(false);
      }

      // Build update payload
      const payload: UpdateProfilePayload = {
        fullName: fullName.trim(),
        phone: phone.trim() || undefined,
        avatar: avatarUrl || undefined,
      };

      // Include address if any field is filled
      const hasAddress = addrFullName || addrPhone || addrLine || addrWard || addrDistrict || addrCity || addrProvince;
      if (hasAddress) {
        // Build full address string
        const parts = [addrLine, addrWard, addrDistrict, addrCity, addrProvince].filter(Boolean);
        payload.defaultAddress = {
          fullName: addrFullName.trim() || undefined,
          phone: addrPhone.trim() || undefined,
          addressLine: addrLine.trim() || undefined,
          ward: addrWard.trim() || undefined,
          district: addrDistrict.trim() || undefined,
          city: addrCity.trim() || undefined,
          province: addrProvince.trim() || undefined,
          country: 'Việt Nam',
          fullAddress: parts.join(', ') || undefined,
          note: addrNote.trim() || undefined,
        };
      }

      const res = await authApi.updateProfile(payload);
      const updatedUser = res.data.data?.user || res.data.data;

      // Sync user in AuthContext → header updates immediately
      updateCurrentUser(updatedUser);
      setAvatarFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setSuccessMsg('Cập nhật hồ sơ thành công!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Cập nhật thất bại. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (!user) return;
    setFullName(user.fullName || '');
    setPhone(user.phone || '');
    setAvatarPreview(user.avatar || null);
    setAvatarFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';

    const addr = user.defaultAddress;
    setAddrFullName(addr?.fullName || '');
    setAddrPhone(addr?.phone || '');
    setAddrLine(addr?.addressLine || '');
    setAddrWard(addr?.ward || '');
    setAddrDistrict(addr?.district || '');
    setAddrCity(addr?.city || '');
    setAddrProvince(addr?.province || '');
    setAddrNote(addr?.note || '');

    setErrorMsg('');
    setSuccessMsg('');
  };

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setErrorMsg('Chỉ chấp nhận file PDF.');
      return;
    }

    if (file.size > MAX_PDF_SIZE) {
      setErrorMsg('File PDF không được vượt quá 10MB.');
      return;
    }

    setErrorMsg('');
    setPdfFile(file);
  };

  const handleApplyHost = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[DEBUG] handleApplyHost triggered');

    if (!workshopName.trim()) {
      setErrorMsg('Vui lòng nhập Tên xưởng.');
      alert('Vui lòng nhập Tên xưởng.');
      return;
    }
    if (!ownerName.trim()) {
      setErrorMsg('Vui lòng nhập Họ tên chủ xưởng.');
      alert('Vui lòng nhập Họ tên chủ xưởng.');
      return;
    }
    if (!ownerPhone.trim()) {
      setErrorMsg('Vui lòng nhập Số điện thoại chủ xưởng.');
      alert('Vui lòng nhập Số điện thoại chủ xưởng.');
      return;
    }
    if (!businessAddrLine.trim()) {
      setErrorMsg('Vui lòng nhập Địa chỉ chi tiết.');
      alert('Vui lòng nhập Địa chỉ chi tiết.');
      return;
    }
    if (!businessAddrCity.trim()) {
      setErrorMsg('Vui lòng nhập Thành phố.');
      alert('Vui lòng nhập Thành phố.');
      return;
    }
    if (!businessAddrProvince.trim()) {
      setErrorMsg('Vui lòng nhập Tỉnh / Thành phố trực thuộc.');
      alert('Vui lòng nhập Tỉnh / Thành phố trực thuộc.');
      return;
    }
    if (!description.trim()) {
      setErrorMsg('Vui lòng nhập Mô tả hoạt động của xưởng.');
      alert('Vui lòng nhập Mô tả hoạt động của xưởng.');
      return;
    }
    if (!pdfFile) {
      setErrorMsg('Vui lòng tải lên file PDF chứng nhận/giấy phép.');
      alert('Vui lòng tải lên file PDF chứng nhận/giấy phép.');
      return;
    }

    setErrorMsg('');
    setSuccessMsg('');
    setApplying(true);
    setUploadingPdf(true);

    try {
      console.log('[DEBUG] Step 1: Uploading PDF file...', pdfFile.name);
      // 1. Upload PDF trực tiếp bằng axiosClient để tránh lỗi import cache của Vite
      const formData = new FormData();
      formData.append("file", pdfFile);
      formData.append("folder", "host-applications");
      
      const uploadRes = await axiosClient.post("/upload/pdf", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      console.log('[DEBUG] PDF upload response:', uploadRes);
      
      const pdfData = uploadRes.data.data;
      const certificateFile = {
        url: pdfData.url,
        secureUrl: pdfData.secureUrl,
        downloadUrl: pdfData.downloadUrl || pdfData.secureUrl,
        publicId: pdfData.publicId,
        resourceType: pdfData.resourceType || 'raw',
        localPath: pdfData.localPath || '',
        originalName: pdfData.originalName || pdfFile.name,
        format: pdfData.format || 'pdf',
        size: pdfData.size || pdfFile.size,
      };

      setUploadingPdf(false);

      console.log('[DEBUG] Step 2: Sending apply payload...');
      // 2. Gửi yêu cầu apply
      const parts = [businessAddrLine, businessAddrWard, businessAddrDistrict, businessAddrCity, businessAddrProvince].filter(Boolean);
      const fullAddress = parts.join(', ') + ', Việt Nam';

      const payload = {
        workshopName: workshopName.trim(),
        ownerName: ownerName.trim(),
        ownerPhone: ownerPhone.trim(),
        businessAddress: {
          addressLine: businessAddrLine.trim(),
          ward: businessAddrWard.trim() || undefined,
          district: businessAddrDistrict.trim() || undefined,
          city: businessAddrCity.trim(),
          province: businessAddrProvince.trim(),
          country: 'Việt Nam',
          fullAddress,
        },
        description: description.trim(),
        specialization: specialization.trim() || undefined,
        experience: experience.trim() || undefined,
        certificateFile,
      };

      const res = await hostApplicationApi.apply(payload);
      console.log('[DEBUG] Apply response:', res);
      
      setSuccessMsg(res.data.message || 'Gửi yêu cầu thành công!');
      alert(res.data.message || 'Gửi yêu cầu xét duyệt thành công!');
      setShowHostForm(false);
      
      // Reset form
      setWorkshopName('');
      setOwnerName('');
      setOwnerPhone('');
      setBusinessAddrLine('');
      setBusinessAddrWard('');
      setBusinessAddrDistrict('');
      setBusinessAddrCity('');
      setBusinessAddrProvince('');
      setDescription('');
      setSpecialization('');
      setExperience('');
      setPdfFile(null);
      if (pdfInputRef.current) pdfInputRef.current.value = '';

      fetchMyApplication();
    } catch (err: any) {
      console.error('[DEBUG] Error occurred during submission:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Gửi yêu cầu thất bại. Vui lòng thử lại.';
      setErrorMsg(errorMessage);
      alert('Lỗi: ' + errorMessage);
    } finally {
      setApplying(false);
      setUploadingPdf(false);
    }
  };

  if (pageLoading || !user) return <Loading text="Đang tải hồ sơ cá nhân..." />;

  const initial = user.fullName ? user.fullName[0].toUpperCase() : 'U';
  const memberSince = user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' }) : '';

  return (
    <div className="max-w-[900px] mx-auto px-5 md:px-8 lg:px-12 py-10 min-h-screen">
      <PageHeader
        title="Hồ sơ cá nhân"
        subtitle="Quản lý thông tin tài khoản và ảnh đại diện của bạn."
      />

      {/* Success / Error Messages */}
      {successMsg && (
        <div className="mb-6 flex items-center gap-3 px-5 py-3.5 bg-green-50 border border-green-200 rounded-2xl animate-[slideDown_0.2s_ease-out]">
          <CheckCircle size={18} className="text-green-500 shrink-0" />
          <p className="text-sm font-semibold text-green-700">{successMsg}</p>
        </div>
      )}
      {errorMsg && (
        <div className="mb-6 flex items-center gap-3 px-5 py-3.5 bg-red-50 border border-red-200 rounded-2xl animate-[slideDown_0.2s_ease-out]">
          <AlertCircle size={18} className="text-red-500 shrink-0" />
          <p className="text-sm font-semibold text-red-600">{errorMsg}</p>
          <button onClick={() => setErrorMsg('')} className="ml-auto text-red-400 hover:text-red-600">
            <X size={16} />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Avatar Card */}
        <div className="bg-white rounded-3xl border border-[#E5E7EB] p-6 md:p-8 shadow-2xs">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Avatar */}
            <div className="relative group">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Avatar"
                  className="w-28 h-28 rounded-full object-cover border-4 border-[#E6DED5] shadow-sm"
                  onError={() => setAvatarPreview(null)}
                />
              ) : (
                <div className="w-28 h-28 rounded-full bg-gradient-to-br from-[#A65A3A]/20 to-[#A65A3A]/5 flex items-center justify-center border-4 border-[#E6DED5] shadow-sm">
                  <span className="text-4xl font-bold text-[#A65A3A]">{initial}</span>
                </div>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-9 h-9 bg-[#A65A3A] rounded-full flex items-center justify-center text-white shadow-md hover:bg-[#904C2F] transition-colors border-2 border-white"
              >
                <Camera size={16} />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>

            {/* User info summary */}
            <div className="flex-1 text-center sm:text-left space-y-1.5">
              <h2 className="text-xl font-extrabold text-[#0F172A]">{user.fullName}</h2>
              <p className="text-sm text-[#7A6A5E] flex items-center gap-1.5 justify-center sm:justify-start">
                <Mail size={14} /> {user.email}
              </p>
              <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start mt-2">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 bg-[#A65A3A]/10 text-[#A65A3A] rounded-full">
                  <Shield size={11} /> {ROLE_LABELS[user.role] || user.role}
                </span>
                {memberSince && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-gray-400 px-2.5 py-1 bg-gray-100 rounded-full">
                    <CalendarDays size={11} /> Thành viên từ {memberSince}
                  </span>
                )}
              </div>
            </div>

            {/* Avatar actions */}
            {avatarFile && (
              <div className="flex flex-col gap-2">
                <span className="text-[10px] text-green-600 font-bold text-center">Ảnh mới đã chọn</span>
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  className="text-xs font-semibold text-red-500 hover:text-red-700 transition-colors"
                >
                  Hủy chọn ảnh
                </button>
              </div>
            )}
          </div>
          <p className="text-[11px] text-gray-400 mt-4 text-center sm:text-left font-medium">
            JPG, PNG hoặc WEBP. Tối đa 5MB.
          </p>
        </div>

        {/* Section 2: Personal Info */}
        <div className="bg-white rounded-3xl border border-[#E5E7EB] p-6 md:p-8 shadow-2xs space-y-5">
          <div className="flex items-center gap-2 mb-1">
            <User size={18} className="text-[#A65A3A]" />
            <h3 className="text-sm font-extrabold text-[#0F172A] uppercase tracking-wider">Thông tin cá nhân</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Họ và tên *"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nhập họ và tên"
              required
            />
            <Input
              label="Email"
              value={user.email}
              readOnly
              disabled
              className="bg-gray-50 cursor-not-allowed opacity-70"
            />
            <Input
              label="Số điện thoại"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Nhập số điện thoại"
              type="tel"
            />
            <Input
              label="Phương thức đăng nhập"
              value={user.authProvider === 'GOOGLE' ? 'Google' : 'Email & Mật khẩu'}
              readOnly
              disabled
              className="bg-gray-50 cursor-not-allowed opacity-70"
            />
          </div>
        </div>

        {/* Section 3: Default Address */}
        <div className="bg-white rounded-3xl border border-[#E5E7EB] p-6 md:p-8 shadow-2xs space-y-5">
          <div className="flex items-center gap-2 mb-1">
            <MapPin size={18} className="text-[#A65A3A]" />
            <h3 className="text-sm font-extrabold text-[#0F172A] uppercase tracking-wider">Địa chỉ mặc định</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Họ tên người nhận"
              value={addrFullName}
              onChange={(e) => setAddrFullName(e.target.value)}
              placeholder="Nhập tên người nhận"
            />
            <Input
              label="Số điện thoại người nhận"
              value={addrPhone}
              onChange={(e) => setAddrPhone(e.target.value)}
              placeholder="Nhập SĐT người nhận"
              type="tel"
            />
          </div>

          <Input
            label="Địa chỉ"
            value={addrLine}
            onChange={(e) => setAddrLine(e.target.value)}
            placeholder="Số nhà, tên đường..."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <Input
              label="Phường / Xã"
              value={addrWard}
              onChange={(e) => setAddrWard(e.target.value)}
              placeholder="Phường / Xã"
            />
            <Input
              label="Quận / Huyện"
              value={addrDistrict}
              onChange={(e) => setAddrDistrict(e.target.value)}
              placeholder="Quận / Huyện"
            />
            <Input
              label="Tỉnh / Thành phố"
              value={addrProvince}
              onChange={(e) => setAddrProvince(e.target.value)}
              placeholder="Tỉnh / Thành phố"
            />
          </div>

          <Input
            label="Ghi chú giao hàng"
            value={addrNote}
            onChange={(e) => setAddrNote(e.target.value)}
            placeholder="Ví dụ: Gọi trước khi giao, tầng 3..."
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2 pb-6">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={saving}
            className="order-2 sm:order-1"
          >
            <X size={16} className="mr-1.5" /> Hủy thay đổi
          </Button>
          <Button
            type="submit"
            isLoading={saving}
            disabled={saving || !fullName.trim()}
            className="order-1 sm:order-2"
          >
            {uploading ? (
              <><Loader2 size={16} className="mr-1.5 animate-spin" /> Đang upload ảnh...</>
            ) : (
              <><Save size={16} className="mr-1.5" /> Lưu thay đổi</>
            )}
          </Button>
        </div>
      </form>

      {/* Section 4: Host Application Upgrade */}
      <div className="mt-12 pt-8 border-t border-gray-200">
        <PageHeader
          title="Đăng ký làm Chủ xưởng"
          subtitle="Trở thành đối tác của CraftLocal để bắt đầu kinh doanh các hoạt động workshop thủ công và sản phẩm văn hóa."
        />

        {appLoading ? (
          <div className="py-6 flex items-center justify-center">
            <Loader2 size={24} className="text-[#A65A3A] animate-spin" />
            <span className="ml-2 text-sm text-gray-500 font-semibold">Đang tải thông tin đăng ký...</span>
          </div>
        ) : user.role === 'HOST' ? (
          <div className="bg-green-50 border border-green-200 rounded-3xl p-6 md:p-8 space-y-4">
            <div className="flex items-center gap-3">
              <CheckCircle size={32} className="text-green-500 shrink-0" />
              <div>
                <h4 className="text-base font-extrabold text-green-800">Tài khoản của bạn đã là Chủ xưởng</h4>
                <p className="text-xs text-green-700 font-semibold mt-0.5">Bạn có thể truy cập vào Bảng điều khiển để quản lý workshop và sản phẩm.</p>
              </div>
            </div>
            <div className="pt-2">
              <Link to="/host/dashboard">
                <Button variant="secondary" size="md">Đi tới bảng điều khiển Chủ xưởng</Button>
              </Link>
            </div>
          </div>
        ) : application && application.status === 'PENDING' ? (
          <div className="bg-amber-50 border border-amber-250 rounded-3xl p-6 md:p-8 space-y-5">
            <div className="flex items-start gap-3">
              <Loader2 size={28} className="text-amber-500 shrink-0 animate-spin mt-0.5" />
              <div>
                <h4 className="text-base font-extrabold text-amber-800">Yêu cầu đăng ký Chủ xưởng đang chờ phê duyệt</h4>
                <p className="text-xs text-amber-700 font-semibold mt-0.5">Chúng tôi đang xem xét hồ sơ của bạn. Quá trình xét duyệt có thể mất từ 1 - 3 ngày làm việc.</p>
              </div>
            </div>

            {/* Application details */}
            <div className="bg-white rounded-2xl border border-amber-200/60 p-5 space-y-3.5 text-xs text-gray-600 font-semibold">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div>
                  <span className="text-[10px] text-gray-400 block uppercase mb-0.5">Tên xưởng</span>
                  <strong className="text-gray-900 text-sm">{application.workshopName}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 block uppercase mb-0.5">Người đại diện xưởng</span>
                  <strong className="text-gray-900 text-sm">{application.ownerName}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 block uppercase mb-0.5">Số điện thoại liên hệ</span>
                  <strong className="text-gray-900 text-sm">{application.ownerPhone}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 block uppercase mb-0.5">Địa chỉ hoạt động</span>
                  <strong className="text-gray-900 text-sm">{application.businessAddress?.fullAddress}</strong>
                </div>
              </div>
              <div className="border-t border-gray-100 pt-3">
                <span className="text-[10px] text-gray-400 block uppercase mb-1">Hồ sơ chứng nhận (PDF)</span>
                <a
                  href={application.certificateFile?.secureUrl || application.certificateFile?.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[#A65A3A] hover:text-[#904C2F] font-bold"
                >
                  <FileText size={14} /> {application.certificateFile?.originalName || 'Xem file chứng nhận'} <ExternalLink size={12} />
                </a>
              </div>
            </div>
          </div>
        ) : showHostForm ? (
          <div className="space-y-6">
            {/* If previously rejected, show message above the form */}
            {application && application.status === 'REJECTED' && (
              <div className="bg-red-50 border border-red-200 rounded-3xl p-6 md:p-8 space-y-2">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertCircle size={20} className="shrink-0" />
                  <h4 className="text-sm font-extrabold uppercase tracking-wider">Yêu cầu trước đó bị từ chối</h4>
                </div>
                <p className="text-xs text-red-600 font-bold leading-relaxed">
                  Lý do từ chối: <span className="text-gray-900 font-semibold">{application.rejectReason || 'Không có lý do chi tiết.'}</span>
                </p>
              </div>
            )}

            {/* Application Form */}
            <form onSubmit={handleApplyHost} className="bg-white rounded-3xl border border-[#E5E7EB] p-6 md:p-8 shadow-2xs space-y-6">
              <div className="flex items-center justify-between border-b border-gray-150 pb-3">
                <div className="flex items-center gap-2">
                  <Shield size={18} className="text-[#A65A3A]" />
                  <h3 className="text-sm font-extrabold text-[#0F172A] uppercase tracking-wider">Form đăng ký đối tác chủ xưởng</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowHostForm(false)}
                  className="text-xs text-gray-400 hover:text-gray-600 font-bold"
                >
                  Thu gọn
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Tên xưởng *"
                  value={workshopName}
                  onChange={(e) => setWorkshopName(e.target.value)}
                  placeholder="Ví dụ: Xưởng Gốm Thanh Hà"
                  required
                />
                <Input
                  label="Họ tên chủ xưởng *"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn A"
                  required
                />
                <Input
                  label="Số điện thoại chủ xưởng *"
                  value={ownerPhone}
                  onChange={(e) => setOwnerPhone(e.target.value)}
                  placeholder="Nhập SĐT liên hệ"
                  type="tel"
                  required
                />
                <Input
                  label="Chuyên môn / Lĩnh vực"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  placeholder="Ví dụ: Làm gốm, Dệt vải..."
                />
              </div>

              <Input
                label="Kinh nghiệm tổ chức / hoạt động"
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                placeholder="Ví dụ: 5 năm kinh nghiệm, đạt danh hiệu nghệ nhân..."
              />

              <div className="space-y-4">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Địa chỉ kinh doanh / hoạt động</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Địa chỉ chi tiết *"
                    value={businessAddrLine}
                    onChange={(e) => setBusinessAddrLine(e.target.value)}
                    placeholder="Số nhà, tên đường..."
                    required
                  />
                  <Input
                    label="Phường / Xã"
                    value={businessAddrWard}
                    onChange={(e) => setBusinessAddrWard(e.target.value)}
                    placeholder="Nhập phường / xã"
                  />
                  <Input
                    label="Quận / Huyện"
                    value={businessAddrDistrict}
                    onChange={(e) => setBusinessAddrDistrict(e.target.value)}
                    placeholder="Nhập quận / huyện"
                  />
                  <Input
                    label="Thành phố *"
                    value={businessAddrCity}
                    onChange={(e) => setBusinessAddrCity(e.target.value)}
                    placeholder="Ví dụ: Hội An"
                    required
                  />
                  <Input
                    label="Tỉnh / Thành phố trực thuộc *"
                    value={businessAddrProvince}
                    onChange={(e) => setBusinessAddrProvince(e.target.value)}
                    placeholder="Ví dụ: Quảng Nam"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col w-full">
                <label className="mb-1.5 block text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Mô tả hoạt động của xưởng *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Giới thiệu về xưởng, lịch sử hình thành, quy trình trải nghiệm..."
                  rows={4}
                  className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#A65A3A]/30 focus:border-[#A65A3A] transition-all font-semibold text-gray-900"
                  required
                />
              </div>

              {/* PDF Certificate file upload */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Giấy phép kinh doanh / Chứng nhận nghệ nhân (PDF) *
                </label>
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => pdfInputRef.current?.click()}
                    disabled={applying}
                    size="sm"
                  >
                    Tải lên file PDF
                  </Button>
                  <input
                    ref={pdfInputRef}
                    type="file"
                    accept="application/pdf"
                    onChange={handlePdfChange}
                    className="hidden"
                  />
                  {pdfFile ? (
                    <div className="flex items-center gap-1.5 text-xs text-green-600 font-bold bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg">
                      <Check size={14} /> {pdfFile.name} ({(pdfFile.size / (1024 * 1024)).toFixed(2)} MB)
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400 font-medium">Chưa chọn file nào. Yêu cầu định dạng PDF, tối đa 10MB.</span>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-gray-150 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowHostForm(false)}
                  disabled={applying}
                >
                  Hủy bỏ
                </Button>
                <Button
                  type="submit"
                  isLoading={applying}
                  disabled={applying || uploadingPdf}
                >
                  {uploadingPdf ? (
                    <><Loader2 size={16} className="mr-1.5 animate-spin" /> Đang upload tài liệu...</>
                  ) : (
                    <><Save size={16} className="mr-1.5" /> Gửi yêu cầu xét duyệt</>
                  )}
                </Button>
              </div>
            </form>
          </div>
        ) : (
          <div className="space-y-6">
            {/* If rejected, show the rejection box and a Re-apply button */}
            {application && application.status === 'REJECTED' ? (
              <div className="bg-red-50 border border-red-200 rounded-3xl p-6 md:p-8 space-y-4 animate-[slideDown_0.2s_ease-out]">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertCircle size={20} className="shrink-0" />
                  <h4 className="text-sm font-extrabold uppercase tracking-wider">Yêu cầu đăng ký của bạn bị từ chối</h4>
                </div>
                <p className="text-xs text-red-600 font-bold leading-relaxed">
                  Lý do từ chối: <span className="text-gray-900 font-semibold">{application.rejectReason || 'Không có lý do chi tiết.'}</span>
                </p>
                <div className="pt-2">
                  <Button type="button" onClick={() => setShowHostForm(true)}>Gửi lại hồ sơ</Button>
                </div>
              </div>
            ) : (
              /* Default Partner Card */
              <div className="bg-gradient-to-br from-[#FAF7F2] to-white border border-[#E6DED5] rounded-3xl p-6 md:p-8 shadow-2xs space-y-6">
                <div>
                  <h4 className="text-lg font-extrabold text-[#2F2722]">Trở thành đối tác Chủ xưởng</h4>
                  <p className="text-xs text-gray-500 font-semibold mt-1">
                    Mở bán workshop trải nghiệm và giới thiệu các sản phẩm văn hóa thủ công độc đáo của bạn đến khách du lịch trên CraftLocal.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-4.5 rounded-2xl border border-gray-100 space-y-2">
                    <span className="text-2xl">🏺</span>
                    <h5 className="font-bold text-[#2F2722] text-xs">Tạo và quản lý workshop</h5>
                    <p className="text-[11px] text-[#7A6A5E] font-medium leading-relaxed">Tự do thiết kế, định giá và thiết lập khung giờ cho các workshop trải nghiệm truyền thống.</p>
                  </div>
                  <div className="bg-white p-4.5 rounded-2xl border border-gray-100 space-y-2">
                    <span className="text-2xl">🛍️</span>
                    <h5 className="font-bold text-[#2F2722] text-xs">Bán sản phẩm thủ công</h5>
                    <p className="text-[11px] text-[#7A6A5E] font-medium leading-relaxed">Đăng bán các tác phẩm nghệ thuật, đồ lưu niệm và sản phẩm đặc trưng của cơ sở bạn.</p>
                  </div>
                  <div className="bg-white p-4.5 rounded-2xl border border-gray-100 space-y-2">
                    <span className="text-2xl">📊</span>
                    <h5 className="font-bold text-[#2F2722] text-xs">Theo dõi & tăng doanh thu</h5>
                    <p className="text-[11px] text-[#7A6A5E] font-medium leading-relaxed">Dashboard quản lý booking chuyên nghiệp, báo cáo thống kê doanh số rõ ràng.</p>
                  </div>
                </div>

                <div className="pt-2">
                  <Button type="button" onClick={() => setShowHostForm(true)}>Trở thành Chủ xưởng</Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
