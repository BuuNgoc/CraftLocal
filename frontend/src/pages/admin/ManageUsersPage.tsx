import React, { useEffect, useState } from 'react';
import dashboardApi from '../../api/dashboardApi';
import { ROLE_LABELS } from '../../utils/constants';
import type { User } from '../../types/user.type';
import Loading from '../../components/common/Loading';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';

const ManageUsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = () => {
    dashboardApi.getAdminUsers()
      .then((res) => {
        const d = res.data.data;
        setUsers(Array.isArray(d) ? d : d?.users || []);
      })
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleBlock = async (id: string) => {
    try {
      setLoading(true);
      await dashboardApi.blockUser(id);
      fetchUsers();
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleUnblock = async (id: string) => {
    try {
      setLoading(true);
      await dashboardApi.unblockUser(id);
      fetchUsers();
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  if (loading) return <Loading text="Đang tải danh sách người dùng..." />;

  return (
    <div className="space-y-6">
      <PageHeader title="Quản lý người dùng" subtitle="Xem danh sách tài khoản du khách, nghệ nhân chủ xưởng, hướng dẫn viên và kiểm soát trạng thái hoạt động." />

      <div className="bg-white rounded-3xl border border-[#E6DED5] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E6DED5] bg-[#FAF7F2]/50 text-[#7A6A5E]">
                <th className="p-4 text-left font-bold uppercase tracking-wider text-xs">Họ và tên</th>
                <th className="p-4 text-left font-bold uppercase tracking-wider text-xs">Email</th>
                <th className="p-4 text-left font-bold uppercase tracking-wider text-xs">Vai trò</th>
                <th className="p-4 text-left font-bold uppercase tracking-wider text-xs">Trạng thái</th>
                <th className="p-4 text-center font-bold uppercase tracking-wider text-xs">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-[#7A6A5E] italic">
                    Chưa có người dùng nào trên hệ thống.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u._id} className="border-b border-[#E6DED5]/50 hover:bg-[#FAF7F2]/10 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#A65A3A]/10 flex items-center justify-center font-bold text-[#A65A3A] text-sm">
                          {u.fullName ? u.fullName[0].toUpperCase() : 'U'}
                        </div>
                        <span className="font-bold text-[#2F2722]">{u.fullName}</span>
                      </div>
                    </td>
                    <td className="p-4 text-[#7A6A5E] font-medium">{u.email}</td>
                    <td className="p-4">
                      <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#A65A3A]/10 text-[#A65A3A]">
                        {ROLE_LABELS[u.role] || u.role}
                      </span>
                    </td>
                    <td className="p-4">
                      <StatusBadge status={u.status} type="user" />
                    </td>
                    <td className="p-4 text-center">
                      {u.status === 'ACTIVE' ? (
                        <button
                          onClick={() => handleBlock(u._id)}
                          className="px-3 py-1.5 text-xs font-bold text-[#DC2626] border border-red-100 rounded-xl hover:bg-red-50 transition-colors"
                        >
                          Khóa tài khoản
                        </button>
                      ) : u.status === 'BLOCKED' ? (
                        <button
                          onClick={() => handleUnblock(u._id)}
                          className="px-3 py-1.5 text-xs font-bold text-green-700 border border-green-100 rounded-xl hover:bg-green-50 transition-colors"
                        >
                          Mở khóa
                        </button>
                      ) : (
                        <span className="text-xs text-[#7A6A5E] italic font-semibold">Chờ duyệt</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ManageUsersPage;
