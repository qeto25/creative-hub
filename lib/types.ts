export type UserRole = 'owner' | 'member';

export interface Profile {
  id: string;
  full_name: string;
  slug: string;
  avatar_url: string;
  cover_url?: string;
  bio?: string;
  whatsapp_number?: string;
  role: UserRole;
  skills: string[];
  tools?: string[];
  turnaround_time?: string;
  deliverables?: string[];
  source_file_price?: number;
  rush_fee?: number;
  free_revisions?: number;
  extra_revision_fee?: number;
  revision_notes?: string;
  is_working: boolean;
  is_available?: boolean;
  availability_status?: 'available' | 'busy' | 'resting';
  is_suspended?: boolean;
  suspension_reason?: string | null;
  is_locked?: boolean;
  forced_price?: number | null;
  base_price: number;
  dp_percentage: number;
  hire_count: number;
  rating: number;
  review_count: number;
  is_tester: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Portfolio {
  id: string;
  profile_id: string;
  title: string;
  description?: string;
  category: string;
  media_url: string;
  media_type: 'image' | 'video' | 'embed';
  created_at?: string;
  profile?: {
    id: string;
    full_name: string;
    slug: string;
    avatar_url: string;
    is_working: boolean;
  };
}

export interface Review {
  id: string;
  booking_id?: string;
  profile_id: string;
  client_name: string;
  rating: number;
  comment?: string;
  created_at?: string;
}

export type BookingStatus = 'pending_dp' | 'in_progress' | 'in_review' | 'completed' | 'cancelled';

export interface Booking {
  id: string;
  ticket_code: string;
  profile_id?: string;
  talent_name: string;
  client_name: string;
  client_whatsapp: string;
  deadline_date: string;
  project_brief: string;
  include_source_file: boolean;
  is_rush_order: boolean;
  include_extra_revision?: boolean;
  estimated_total: number;
  dp_amount: number;
  status: BookingStatus;
  step_progress?: 1 | 2 | 3 | 4 | 5;
  final_file_url?: string | null;
  payout_status?: 'unpaid' | 'paid';
  payout_date?: string | null;
  hub_fee?: number | null;
  talent_fee?: number | null;
  has_reviewed?: boolean;
  created_at?: string;
}

export interface MemberProvisionPayload {
  fullName: string;
  email: string;
  password?: string;
  skills: string[];
  tools?: string[];
  basePrice: number;
  dpPercentage: number;
  whatsappNumber?: string;
  bio?: string;
  avatarUrl?: string;
  coverUrl?: string;
  turnaroundTime?: string;
  deliverables?: string[];
  sourceFilePrice?: number;
  rushFee?: number;
  freeRevisions?: number;
  extraRevisionFee?: number;
  isTester?: boolean;
}
