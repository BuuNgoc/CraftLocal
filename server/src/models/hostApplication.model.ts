import mongoose, { Schema, Document } from 'mongoose';

export interface IHostApplication extends Document {
  userId: mongoose.Types.ObjectId;
  fullName: string;
  email: string;
  phone: string;
  workshopName: string;
  ownerName: string;
  ownerPhone: string;
  businessAddress: {
    addressLine: string;
    ward?: string;
    district?: string;
    city: string;
    province: string;
    country: string;
    fullAddress: string;
  };
  description: string;
  specialization?: string;
  experience?: string;
  certificateFile: {
    url: string;
    secureUrl: string;
    downloadUrl?: string;
    publicId: string;
    resourceType?: string;
    localPath?: string;
    originalName?: string;
    format?: string;
    size?: number;
  };
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectReason?: string;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  submittedAt: Date;
}

const hostApplicationSchema = new Schema<IHostApplication>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    workshopName: { type: String, required: true },
    ownerName: { type: String, required: true },
    ownerPhone: { type: String, required: true },
    businessAddress: {
      addressLine: { type: String, required: true },
      ward: String,
      district: String,
      city: { type: String, required: true },
      province: { type: String, required: true },
      country: { type: String, default: 'Việt Nam' },
      fullAddress: { type: String, required: true },
    },
    description: { type: String, required: true },
    specialization: String,
    experience: String,
    certificateFile: {
      url: { type: String, required: true },
      secureUrl: { type: String, required: true },
      downloadUrl: String,
      publicId: { type: String, required: true },
      resourceType: String,
      localPath: String,
      originalName: String,
      format: String,
      size: Number,
    },
    status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
    rejectReason: String,
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: Date,
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

hostApplicationSchema.index({ userId: 1 });
hostApplicationSchema.index({ status: 1 });
hostApplicationSchema.index({ reviewedBy: 1 });
hostApplicationSchema.index({ submittedAt: -1 });

export default mongoose.model<IHostApplication>('HostApplication', hostApplicationSchema);
