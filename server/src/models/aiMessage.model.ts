import mongoose, { Schema, Document } from 'mongoose';

export interface IAIMessage extends Document {
  conversationId: mongoose.Types.ObjectId;
  clientMessageId?: string;
  role: 'USER' | 'AI' | 'SYSTEM';
  content: string;
  intent?: string;
  data?: any;
  createdAt: Date;
}

const aiMessageSchema = new Schema<IAIMessage>(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: 'AIConversation', required: true, index: true },
    clientMessageId: { type: String, sparse: true },
    role: { type: String, enum: ['USER', 'AI', 'SYSTEM'], required: true },
    content: { type: String, required: true },
    intent: String,
    data: Schema.Types.Mixed,
  },
  { timestamps: true }
);

aiMessageSchema.index({ conversationId: 1, createdAt: 1 });
aiMessageSchema.index({ clientMessageId: 1 }, { sparse: true });

export default mongoose.model<IAIMessage>('AIMessage', aiMessageSchema);
