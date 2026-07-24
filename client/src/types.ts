export type UserRole = "CUSTOMER" | "SUPER_ADMIN" | "ADMIN" | "EMPLOYEE";
export type UserLevel = "STARTER" | "SILVER" | "GOLD" | "VIP" | "VVIP";
export type OrderStatus = "WAITING_ASSIGNMENT" | "PRODUCT_ASSIGNED" | "WAITING_SHIPMENT" | "PENDING_DELIVERY" | "DELIVERED" | "REJECTED";
export type TransactionStatus = "PENDING" | "APPROVED" | "REJECTED";
export type TransactionType = "TOPUP" | "WITHDRAWAL" | "REWARD";

export type User = {
  id: string;
  username: string;
  displayName: string;
  phone?: string;
  role: UserRole;
  level: UserLevel;
  balance: number;
  totalOrders: number;
  invitationCode?: string;
  adminCode?: string;
  registrationBonus: number;
  withdrawalLocked: boolean;
  withdrawalRemarks?: string;
  isActive?: boolean;
  createdAt?: string;
  lastLoginAt?: string;
  lastSeenAt?: string;
  referrer?: { id?: string; displayName: string; invitationCode?: string };
};

export type Product = {
  id: string;
  code: string;
  name: string;
  description?: string;
  price: number;
  commission: number;
  requiredBalance: number;
  quantity: number;
  category: string;
  imageUrl: string;
  active: boolean;
};

// Storefront-only data. It deliberately has no commission, task balance,
// quantity, or OrderItem fields.
export type CatalogProduct = {
  id: string;
  code: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  imageUrl: string;
  active: boolean;
};

export type CatalogBanner = {
  id: string;
  code: string;
  title: string;
  altText: string;
  imageUrl: string;
  sortOrder: number;
  active: boolean;
};

export type Bank = {
  id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  minimumDeposit: number;
  active: boolean;
};

export type Transaction = {
  id: string;
  requestNumber: string;
  userId: string;
  type: TransactionType;
  amount: number;
  status: TransactionStatus;
  senderName?: string;
  proofOriginalName?: string;
  withdrawalBankName?: string;
  withdrawalAccountName?: string;
  withdrawalAccountNumber?: string;
  proofPath?: string;
  balanceDeductedAt?: string;
  creditedAt?: string;
  createdAt: string;
  user?: Pick<User, "username" | "displayName">;
};

export type OrderItem = {
  id: string;
  productId?: string;
  productCode: string;
  productName: string;
  price: number;
  commission: number;
  quantity: number;
  total: number;
  product?: { imageUrl: string } | null;
};

export type Order = {
  id: string;
  referenceNumber: string;
  userId: string;
  status: OrderStatus;
  totalValue: number;
  commission: number;
  requiredBalance: number;
  requiresCustomerApproval: boolean;
  assignedAt?: string;
  submittedAt?: string;
  completedAt?: string;
  commissionCreditedAt?: string;
  createdAt: string;
  items: OrderItem[];
  user?: Pick<User, "username" | "displayName" | "balance" | "totalOrders" | "level">;
};

export type BootstrapData = {
  catalogProducts: CatalogProduct[];
  catalogBanners: CatalogBanner[];
  banks: Bank[];
  settings: Record<string, string>;
};
