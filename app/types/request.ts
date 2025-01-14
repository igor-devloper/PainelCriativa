import { RequestStatus } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

export interface RequestData {
  id: string;
  name: string;
  description: string;
  amount: Decimal;
  status: RequestStatus;
  userId: string;
  phoneNumber: string;
  financeId?: string;
  expectedDate?: Date | null;
  denialReason?: string;
  proofUrl?: string;
  whatsappMessageSid?: string;
  whatsappMessageStatus?: string;
}

export interface WhatsAppStatusData {
  MessageSid: string;
  MessageStatus: string;
  To: string;
}
