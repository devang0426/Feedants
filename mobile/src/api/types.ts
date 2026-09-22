/** Mirrors the backend view-model (see backend/src/services/competitionService.js). */

export type Phase =
  | 'draft'
  | 'cancelled'
  | 'upcoming'
  | 'registration_open'
  | 'registration_closed'
  | 'submission_open'
  | 'judging'
  | 'results_announced';

export type RegistrationStatus = 'pending' | 'reserved' | 'confirmed' | 'expired' | 'cancelled' | 'failed';

export type PrimaryActionType =
  | 'register'
  | 'complete_payment'
  | 'upload_submission'
  | 'update_submission'
  | 'view_results'
  | 'none';

export interface PrimaryAction {
  type: PrimaryActionType;
  enabled: boolean;
  labelKey: string;
  subLabelKey?: string;
  subLabelAt?: string;
}

export interface Countdown {
  key: 'registration_opens' | 'registration_closes' | 'submission_starts' | 'submission_ends' | 'results_in';
  targetAt: string;
  urgent: boolean;
}

export interface Capacity {
  total: number;
  booked: number;
  spotsLeft: number;
  isFull: boolean;
}

export interface Payment {
  provider: string;
  orderId: string;
  amountPaise: number;
  currency: string;
  paidAt?: string | null;
  /** "razorpay" when the backend has gateway keys, otherwise "mock". */
  mode: 'razorpay' | 'mock';
  /** Public Razorpay key id used to open checkout (null in mock mode). */
  keyId: string | null;
}

/** What the checkout hands back to confirm a registration. */
export interface CheckoutResult {
  paymentId: string;
  orderId?: string;
  signature: string;
}

export interface ViewerRegistration {
  id: string;
  status: RegistrationStatus;
  isActive: boolean;
  expiresAt: string | null;
  confirmedAt: string | null;
  payment: Payment | null;
}

export interface ViewerSubmission {
  id: string;
  title: string | null;
  mediaUrl: string;
  mediaType: 'video' | 'image' | 'audio';
  submittedAt: string;
  revision: number;
}

export interface Viewer {
  isAuthenticated: boolean;
  isRegistered: boolean;
  registration: ViewerRegistration | null;
  submission: ViewerSubmission | null;
  primaryAction: PrimaryAction;
  canCancel: boolean;
}

export interface Judge {
  name: string;
  title: string;
  experience: string;
  avatarUrl: string | null;
  introVideoUrl: string | null;
}

export interface Winner {
  name: string;
  positionLabel: string;
  imageUrl: string;
  videoUrl: string | null;
}

export interface Reward {
  position: number;
  label: string;
  amountPaise: number;
}

export interface CompetitionDetails {
  id: string;
  slug: string;
  title: string;
  category: string;
  tags: string[];
  perks: string[];
  currency: string;
  prizePoolPaise: number;
  entryFeePaise: number;
  capacity: Capacity;
  phase: Phase;
  windows: {
    registration: { opensAt: string; closesAt: string; isOpen: boolean };
    submission: { startsAt: string; endsAt: string; isOpen: boolean };
    results: { at: string; isAnnounced: boolean };
  };
  countdown: Countdown | null;
  judge: Judge | null;
  previousWinners: Winner[];
  about: string;
  judgingParameters: string[];
  rules: string[];
  rewards: Reward[];
  disclaimer: string;
  media: {
    prizeMoneyVideoUrl: string | null;
    refundPolicyUrl: string | null;
    paymentProvider: string;
  };
  referral: { rewardPaise: number; link: string | null };
  testimonialsUrl: string | null;
  viewer: Viewer;
}

export interface CompetitionSummary {
  id: string;
  slug: string;
  title: string;
  category: string;
  phase: Phase;
  entryFeePaise: number;
  prizePoolPaise: number;
  currency: string;
  capacity: Capacity;
  registrationClosesAt: string;
  judgeName: string | null;
  judgeAvatarUrl: string | null;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  referral: { code: string; link: string; earningsPaise: number };
}

export interface ApiErrorBody {
  code: string;
  message: string;
  details?: unknown;
}

export interface MutationResult {
  competition: CompetitionDetails;
  registrationStatus?: RegistrationStatus;
  payment?: Payment | null;
  reused?: boolean;
  alreadyConfirmed?: boolean;
  submissionId?: string;
  revision?: number;
}
