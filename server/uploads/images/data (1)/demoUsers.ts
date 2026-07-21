import { User } from '../types/user';

export interface DemoUserEntry extends User {
  password: string;
}

export const demoUsers: DemoUserEntry[] = [
  {
    id: 'user-1',
    fullName: 'Nguyễn Ngọc Bữu',
    email: 'demo@gmail.com',
    password: '123456',
    phone: '0900000001',
    role: 'user',
    avatar: 'https://picsum.photos/id/64/200/200',
  },
  {
    id: 'owner-1',
    fullName: 'Chủ xưởng Non Nước',
    email: 'owner@gmail.com',
    password: '123456',
    phone: '0900000002',
    role: 'owner',
    workshopName: 'Xưởng đá mỹ nghệ Non Nước',
    workshopAddress: 'Phường Hòa Hải, Ngũ Hành Sơn, Đà Nẵng',
    avatar: 'https://picsum.photos/id/91/200/200',
  },
  {
    id: 'admin-1',
    fullName: 'Quản trị viên',
    email: 'admin@gmail.com',
    password: '123456',
    phone: '0900000003',
    role: 'admin',
    avatar: 'https://picsum.photos/id/65/200/200',
  },
];
