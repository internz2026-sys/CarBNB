// ===== ENUMS =====

export enum OwnerStatus {
  PENDING = "Pending Verification",
  VERIFIED = "Verified",
  SUSPENDED = "Suspended",
  REJECTED = "Rejected",
  INACTIVE = "Inactive",
}

export enum TransactionType {
  COMMISSION = "Commission",
  REFUND = "Refund",
  DEPOSIT = "Deposit",
  PAYOUT = "Payout",
}

export enum ListingStatus {
  DRAFT = "Draft",
  PENDING_APPROVAL = "Pending Approval",
  ACTIVE = "Active",
  UNAVAILABLE = "Unavailable",
  BOOKED = "Booked",
  SUSPENDED = "Suspended",
  REJECTED = "Rejected",
  ARCHIVED = "Archived",
}

export enum BookingStatus {
  PENDING = "Pending",
  CONFIRMED = "Confirmed",
  ONGOING = "Ongoing",
  COMPLETED = "Completed",
  CANCELLED = "Cancelled",
  REJECTED = "Rejected",
}

export enum PaymentStatus {
  UNPAID = "Unpaid",
  PARTIALLY_PAID = "Partially Paid",
  PAID = "Paid",
  REFUNDED = "Refunded",
}

export enum PayoutStatus {
  PENDING = "Pending Payout",
  RELEASED = "Released",
  PARTIALLY_PAID = "Partially Paid",
}

export enum Transmission {
  AUTOMATIC = "Automatic",
  MANUAL = "Manual",
}

export enum FuelType {
  GASOLINE = "Gasoline",
  DIESEL = "Diesel",
  ELECTRIC = "Electric",
  HYBRID = "Hybrid",
}

export enum DayOfWeek {
  MONDAY = "Monday",
  TUESDAY = "Tuesday",
  WEDNESDAY = "Wednesday",
  THURSDAY = "Thursday",
  FRIDAY = "Friday",
  SATURDAY = "Saturday",
  SUNDAY = "Sunday",
}

// ===== INTERFACES =====

export interface Owner {
  id: string;
  fullName: string;
  contactNumber: string;
  email: string;
  address: string;
  validIdUrl?: string;
  driversLicenseUrl?: string;
  proofOfOwnershipUrl?: string;
  orCrDetails?: string;
  bankDetails?: string;
  eWalletDetails?: string;
  status: OwnerStatus;
  remarks?: string;
  carsCount: number;
  totalEarnings: number;
  createdAt: string;
  updatedAt: string;
}

export interface OwnerDocument {
  id: string;
  ownerId: string;
  type: string;
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
}

export interface CarListing {
  id: string;
  ownerId: string;
  ownerName: string;
  plateNumber: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  transmission: Transmission;
  fuelType: FuelType;
  seatingCapacity: number;
  location: string;
  dailyPrice: number;
  description?: string;
  photos: string[];
  status: ListingStatus;
  notes?: string;
  availabilitySummary?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CarAvailabilityRule {
  id: string;
  carListingId: string;
  dayOfWeek: DayOfWeek;
  isAvailable: boolean;
  startTime?: string; // HH:mm
  endTime?: string;   // HH:mm
}

export interface CarAvailabilityException {
  id: string;
  carListingId: string;
  date: string;       // YYYY-MM-DD
  isAvailable: boolean;
  reason?: string;
}

export interface Customer {
  id: string;
  fullName: string;
  contactNumber: string;
  email: string;
  address?: string;
  validIdUrl?: string;
  driversLicenseUrl?: string;
  totalBookings: number;
  createdAt: string;
}

export interface Booking {
  id: string;
  referenceNumber: string;
  customerId: string;
  customerName: string;
  carListingId: string;
  carName: string;
  carPhoto?: string;
  plateNumber: string;
  seatingCapacity: number;
  ownerId: string;
  ownerName: string;
  pickupDate: string;
  returnDate: string;
  totalAmount: number;
  platformFee: number;
  ownerPayout: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  notes?: string;
  createdAt: string;
}

export interface AccountingEntry {
  id: string;
  bookingId: string;
  bookingRef: string;
  customerName: string;
  carName: string;
  ownerName: string;
  bookingAmount: number;
  platformFee: number;
  ownerPayout: number;
  paymentStatus: PaymentStatus;
  payoutStatus: PayoutStatus;
  date: string;
  type?: TransactionType; // Added type here
}

export interface OwnerPayout {
  id: string;
  ownerId: string;
  ownerName: string;
  totalEarnings: number;
  platformCommission: number;
  netPayout: number;
  payoutMethod: string;
  payoutStatus: PayoutStatus;
  dateReleased?: string;
}

export interface DashboardStats {
  totalOwners: number;
  totalCars: number;
  activeListings: number;
  pendingOwnerApprovals: number;
  pendingCarApprovals: number;
  activeBookings: number;
  carsUnavailableToday: number;
  bookingsToday: number;
  totalRevenue: number;
  pendingVerifications: number;
}

export interface ActivityLogEntry {
  id: string;
  action: string;
  description: string;
  timestamp: string;
  type: "owner" | "car" | "booking" | "system";
}
