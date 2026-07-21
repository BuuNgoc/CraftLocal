import React from 'react';
import Badge from './Badge';

interface StatusBadgeProps {
  type: 'booking' | 'timeslot' | 'order' | 'user' | 'hostApplication' | 'payment' | 'ticket' | 'product' | 'workshop' | 'review';
  status: string;
  className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ type, status, className = '' }) => {
  const normStatus = status?.toUpperCase();

  let label = status;
  let variant: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral' = 'neutral';

  if (type === 'booking') {
    switch (normStatus) {
      case 'PENDING_PAYMENT':
      case 'PENDING':
        label = 'Chờ thanh toán';
        variant = 'warning';
        break;
      case 'PAID':
        label = 'Đã thanh toán';
        variant = 'info';
        break;
      case 'CHECKED_IN':
        label = 'Đã check-in';
        variant = 'primary';
        break;
      case 'COMPLETED':
        label = 'Hoàn thành';
        variant = 'success';
        break;
      case 'CANCELLED':
        label = 'Đã hủy';
        variant = 'danger';
        break;
      case 'EXPIRED':
        label = 'Hết hạn thanh toán';
        variant = 'neutral';
        break;
      case 'REFUNDED':
        label = 'Đã hoàn tiền';
        variant = 'neutral';
        break;
    }
  } else if (type === 'timeslot') {
    switch (normStatus) {
      case 'AVAILABLE':
        label = 'Còn chỗ';
        variant = 'success';
        break;
      case 'FULL':
        label = 'Hết chỗ';
        variant = 'danger';
        break;
      case 'ONGOING':
        label = 'Đang diễn ra';
        variant = 'info';
        break;
      case 'COMPLETED':
        label = 'Hoàn thành';
        variant = 'success';
        break;
      case 'CANCELLED':
        label = 'Đã hủy';
        variant = 'danger';
        break;
    }
  } else if (type === 'order') {
    switch (normStatus) {
      case 'PENDING':
        label = 'Chờ xác nhận';
        variant = 'warning';
        break;
      case 'CONFIRMED':
        label = 'Đã xác nhận';
        variant = 'info';
        break;
      case 'PACKING':
        label = 'Đang đóng gói';
        variant = 'warning';
        break;
      case 'SHIPPING':
        label = 'Đang giao';
        variant = 'info';
        break;
      case 'COMPLETED':
        label = 'Hoàn thành';
        variant = 'success';
        break;
      case 'CANCELLED':
        label = 'Đã hủy';
        variant = 'danger';
        break;
      case 'REFUNDED':
        label = 'Đã hoàn tiền';
        variant = 'neutral';
        break;
    }
  } else if (type === 'user') {
    switch (normStatus) {
      case 'PENDING':
        label = 'Chờ duyệt';
        variant = 'warning';
        break;
      case 'ACTIVE':
        label = 'Hoạt động';
        variant = 'success';
        break;
      case 'BLOCKED':
        label = 'Đã khóa';
        variant = 'danger';
        break;
    }
  } else if (type === 'hostApplication') {
    switch (normStatus) {
      case 'PENDING':
        label = 'Chờ duyệt';
        variant = 'warning';
        break;
      case 'APPROVED':
        label = 'Đã duyệt';
        variant = 'success';
        break;
      case 'REJECTED':
        label = 'Từ chối';
        variant = 'danger';
        break;
    }
  } else if (type === 'payment') {
    switch (normStatus) {
      case 'PENDING':
        label = 'Đang chờ';
        variant = 'warning';
        break;
      case 'SUCCESS':
        label = 'Thành công';
        variant = 'success';
        break;
      case 'FAILED':
        label = 'Thất bại';
        variant = 'danger';
        break;
      case 'CANCELLED':
        label = 'Đã hủy';
        variant = 'danger';
        break;
      case 'EXPIRED':
        label = 'Hết hạn';
        variant = 'neutral';
        break;
      case 'REFUNDED':
        label = 'Đã hoàn tiền';
        variant = 'neutral';
        break;
    }
  } else if (type === 'ticket') {
    switch (normStatus) {
      case 'PENDING_PAYMENT':
        label = 'Chờ thanh toán';
        variant = 'warning';
        break;
      case 'UNUSED':
        label = 'Chưa sử dụng';
        variant = 'info';
        break;
      case 'USED':
        label = 'Đã sử dụng';
        variant = 'success';
        break;
      case 'EXPIRED':
        label = 'Hết hạn';
        variant = 'neutral';
        break;
      case 'CANCELLED':
        label = 'Đã hủy';
        variant = 'danger';
        break;
    }
  } else if (type === 'product') {
    switch (normStatus) {
      case 'ACTIVE':
        label = 'Đang bán';
        variant = 'success';
        break;
      case 'HIDDEN':
        label = 'Đã ẩn';
        variant = 'neutral';
        break;
      case 'OUT_OF_STOCK':
        label = 'Hết hàng';
        variant = 'danger';
        break;
      case 'DELETED':
        label = 'Đã xóa';
        variant = 'danger';
        break;
    }
  } else if (type === 'workshop') {
    switch (normStatus) {
      case 'DRAFT':
        label = 'Bản nháp';
        variant = 'neutral';
        break;
      case 'ACTIVE':
        label = 'Hoạt động';
        variant = 'success';
        break;
      case 'HIDDEN':
        label = 'Đã ẩn';
        variant = 'warning';
        break;
      case 'DELETED':
        label = 'Đã xóa';
        variant = 'danger';
        break;
    }
  } else if (type === 'review') {
    switch (normStatus) {
      case 'VISIBLE':
        label = 'Hiển thị';
        variant = 'success';
        break;
      case 'HIDDEN':
        label = 'Đã ẩn';
        variant = 'neutral';
        break;
    }
  }

  return (
    <Badge variant={variant} className={className}>
      {label}
    </Badge>
  );
};

export default StatusBadge;
export { StatusBadge };
