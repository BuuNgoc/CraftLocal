import mongoose, { Schema, Document } from 'mongoose';

export interface IAIConversation extends Document {
  userId?: mongoose.Types.ObjectId;
  sessionId: string;
  status: 'ACTIVE' | 'CLOSED';
  currentIntent?: string;
  pendingIntent?: string;
  slots: {
    location?: string;
    date?: string;
    guests?: number;
    budget?: number;
    minPrice?: number;
    maxPrice?: number;
    sort?: string;
    limit?: number;
    category?: string;
    difficulty?: string;
    interests?: string[];
    mood?: string;
    pace?: string;
    startTime?: string;
    endTime?: string;
    workshopName?: string;
    productName?: string;
  };
  lastQuestion?: string;
  lastMessageAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const aiConversationSchema = new Schema<IAIConversation>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    sessionId: { type: String, required: true, index: true },
    status: { type: String, enum: ['ACTIVE', 'CLOSED'], default: 'ACTIVE' },
    currentIntent: String,
    pendingIntent: String,
    slots: {
      location: String,
      date: String,
      guests: Number,
      budget: Number,
      minPrice: Number,
      maxPrice: Number,
      sort: String,
      limit: Number,
      category: String,
      difficulty: String,
      interests: [String],
      mood: String,
      pace: String,
      startTime: String,
      endTime: String,
      workshopName: String,
      productName: String,
    },
    lastQuestion: String,
    lastMessageAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

aiConversationSchema.index({ userId: 1, status: 1 });
aiConversationSchema.index({ lastMessageAt: -1 });

export default mongoose.model<IAIConversation>('AIConversation', aiConversationSchema);
