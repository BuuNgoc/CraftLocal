import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IAddress {
  addressLine: string;
  ward?: string;
  district?: string;
  city: string;
  province: string;
  country: string;
  fullAddress: string;
  note?: string;
  mapLocation?: { lat: number; lng: number };
}

export interface IUser extends Document {
  fullName: string;
  email: string;
  password?: string;
  phone?: string;
  avatar?: string;
  role: 'ADMIN' | 'HOST' | 'TOUR_GUIDE' | 'TOURIST';
  status: 'PENDING' | 'ACTIVE' | 'BLOCKED';
  authProvider: 'LOCAL' | 'GOOGLE';
  googleId?: string;
  hostId?: mongoose.Types.ObjectId;
  createdBy?: mongoose.Types.ObjectId;
  hostProfile?: {
    workshopName?: string;
    ownerName?: string;
    ownerPhone?: string;
    businessAddress?: IAddress;
    description?: string;
    specialization?: string;
    experience?: string;
    identityCardFront?: string;
    identityCardBack?: string;
    certificate?: string;
    certificateFile?: {
      url: string;
      secureUrl: string;
      publicId: string;
      originalName?: string;
      format?: string;
      size?: number;
    };
    bankName?: string;
    bankAccountNumber?: string;
    bankAccountHolder?: string;
    approvedAt?: Date;
    approvedBy?: mongoose.Types.ObjectId;
    rejectedReason?: string;
  };
  defaultAddress?: IAddress;
  lastLoginAt?: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const addressSchema = {
  addressLine: String,
  ward: String,
  district: String,
  city: String,
  province: String,
  country: { type: String, default: 'Việt Nam' },
  fullAddress: String,
  note: String,
  mapLocation: { lat: Number, lng: Number },
};

const userSchema = new Schema<IUser>(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, select: false },
    phone: { type: String, trim: true },
    avatar: String,
    role: { type: String, enum: ['ADMIN', 'HOST', 'TOUR_GUIDE', 'TOURIST'], default: 'TOURIST' },
    status: { type: String, enum: ['PENDING', 'ACTIVE', 'BLOCKED'], default: 'ACTIVE' },
    authProvider: { type: String, enum: ['LOCAL', 'GOOGLE'], default: 'LOCAL' },
    googleId: { type: String },
    hostId: { type: Schema.Types.ObjectId, ref: 'User' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    hostProfile: {
      workshopName: String,
      ownerName: String,
      ownerPhone: String,
      businessAddress: addressSchema,
      description: String,
      specialization: String,
      experience: String,
      identityCardFront: String,
      identityCardBack: String,
      certificate: String,
      certificateFile: {
        url: String,
        secureUrl: String,
        publicId: String,
        originalName: String,
        format: String,
        size: Number,
      },
      bankName: String,
      bankAccountNumber: String,
      bankAccountHolder: String,
      approvedAt: Date,
      approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      rejectedReason: String,
    },
    defaultAddress: addressSchema,
    lastLoginAt: Date,
  },
  { timestamps: true }
);

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ googleId: 1 }, { sparse: true });
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });
userSchema.index({ hostId: 1 });
userSchema.index({ 'hostProfile.workshopName': 'text' });

// Only hash password when it exists and is modified
userSchema.pre('save', async function (next) {
  if (!this.password || !this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Never return password in JSON responses
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

export default mongoose.model<IUser>('User', userSchema);
