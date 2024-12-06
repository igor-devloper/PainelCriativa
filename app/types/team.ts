export interface Team {
  id: string;
  name: string;
  adminId: string;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    members: number;
  };
}
