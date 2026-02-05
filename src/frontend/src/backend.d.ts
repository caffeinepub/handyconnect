import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface PartialWorkerProfile {
    serviceArea: string;
    displayName: string;
    hourlyRate: bigint;
    description: string;
    isActive: boolean;
    category: ServiceCategory;
    phoneNumber: string;
}
export interface NewBooking {
    jobDetails: string;
    worker: Principal;
    dateTime: string;
    location: string;
}
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface PaymentStatusUpdate {
    principal: Principal;
    updatedStatus?: PaymentStatus;
    previousStatus?: PaymentStatus;
}
export interface AdminSettings {
    appName: string;
    maintenanceMode: boolean;
    subscriptionFeeInCents: bigint;
}
export interface http_header {
    value: string;
    name: string;
}
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface WorkerProfile {
    serviceArea: string;
    displayName: string;
    owner: Principal;
    profileImage?: ExternalBlob;
    hourlyRate: bigint;
    description: string;
    isActive: boolean;
    category: ServiceCategory;
    phoneNumber: string;
}
export interface ShoppingItem {
    productName: string;
    currency: string;
    quantity: bigint;
    priceInCents: bigint;
    productDescription: string;
}
export interface AdminRoleChange {
    principal: Principal;
    adminCount: bigint;
    isAdmin: boolean;
}
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export interface Booking {
    id: bigint;
    status: BookingStatus;
    client: Principal;
    jobDetails: string;
    worker: Principal;
    dateTime: string;
    location: string;
}
export type StripeSessionStatus = {
    __kind__: "completed";
    completed: {
        userPrincipal?: string;
        response: string;
    };
} | {
    __kind__: "failed";
    failed: {
        error: string;
    };
};
export interface StripeConfiguration {
    allowedCountries: Array<string>;
    secretKey: string;
}
export type PaymentStatus = {
    __kind__: "pending";
    pending: {
        createdTimestamp: bigint;
    };
} | {
    __kind__: "completed";
    completed: {
        paymentSessionId: string;
    };
};
export interface AdminSignInPagePublicSettings {
    adminSignInSubtitle: string;
    adminSignInHelperText: string;
    adminSignInTitle: string;
}
export interface UserProfile {
    name: string;
    accountType?: AccountType;
}
export type ServiceCategory = {
    __kind__: "cleaning";
    cleaning: null;
} | {
    __kind__: "other";
    other: string;
} | {
    __kind__: "plumbing";
    plumbing: null;
} | {
    __kind__: "gardening";
    gardening: null;
} | {
    __kind__: "electrical";
    electrical: null;
};
export enum AccountType {
    client = "client",
    worker = "worker"
}
export enum BookingStatus {
    requested = "requested",
    cancelled = "cancelled",
    completed = "completed",
    accepted = "accepted",
    declined = "declined"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    adminSignInWithCredentials(username: string, password: string): Promise<boolean>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    bootstrapAdminRole(token: string): Promise<boolean>;
    browseWorkers(): Promise<Array<WorkerProfile>>;
    browseWorkersByCategory(category: ServiceCategory): Promise<Array<WorkerProfile>>;
    browseWorkersByRateAscending(): Promise<Array<WorkerProfile>>;
    browseWorkersByRateDescending(): Promise<Array<WorkerProfile>>;
    canRevokeAdmin(): Promise<boolean>;
    clearExpiredPendingStatuses(): Promise<Array<[Principal, PaymentStatusUpdate]>>;
    confirmPaymentSuccessful(paymentSessionId: string): Promise<boolean>;
    createBookingRequest(newBooking: NewBooking): Promise<bigint>;
    createCheckoutSession(items: Array<ShoppingItem>, successUrl: string, cancelUrl: string): Promise<string>;
    createWorkerProfile(profile: PartialWorkerProfile): Promise<void>;
    forceCheckSubscriptionStatuses(): Promise<Array<[Principal, PaymentStatus]>>;
    getAdminRecoveryPhoneNumber(): Promise<string>;
    getAdminRoleChangeStatus(): Promise<AdminRoleChange>;
    getAdminRoleChanges(): Promise<Array<AdminRoleChange>>;
    getAdminRoleChangesWithCount(): Promise<Array<AdminRoleChange>>;
    getAdminSettings(): Promise<AdminSettings>;
    getAdminSignInPageSettings(): Promise<AdminSignInPagePublicSettings>;
    getAdminSignInPageWithCredentialsCheck(): Promise<{
        hasCredentials: boolean;
        settings: AdminSignInPagePublicSettings;
    }>;
    getAllPendingPaymentUsers(): Promise<Array<[Principal, PaymentStatus]>>;
    getBooking(bookingId: bigint): Promise<Booking>;
    getBookingsByClient(client: Principal): Promise<Array<Booking>>;
    getBookingsByStatus(status: BookingStatus): Promise<Array<Booking>>;
    getBookingsByWorker(worker: Principal): Promise<Array<Booking>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getIsAdmin(): Promise<boolean>;
    getIsAdminWithCount(): Promise<AdminRoleChange>;
    getPendingPaymentUsersCount(): Promise<bigint>;
    getPrincipalPaymentStatus(principal: Principal): Promise<PaymentStatus | null>;
    getStripeSessionStatus(sessionId: string): Promise<StripeSessionStatus>;
    getSubscriptionFeeInCents(): Promise<bigint>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getUserSubscriptionStatus(): Promise<boolean>;
    getWorkerProfile(worker: Principal): Promise<WorkerProfile | null>;
    getWorkerProfileImage(worker: Principal): Promise<ExternalBlob | null>;
    isAdminLoggedIn(): Promise<boolean>;
    isAdminSignInConfigured(): Promise<boolean>;
    isCallerAdmin(): Promise<boolean>;
    isMaintenanceMode(): Promise<boolean>;
    isStripeConfigured(): Promise<boolean>;
    listAllUsers(): Promise<Array<[Principal, UserProfile]>>;
    logOutAdmin(): Promise<boolean>;
    removeProfileImage(): Promise<void>;
    resetAdminCredentialsByPhoneNumber(phoneNumber: string, newUsername: string, newPassword: string): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    searchUserByPrincipal(principalText: string): Promise<[Principal, UserProfile] | null>;
    setStripeConfiguration(config: StripeConfiguration): Promise<void>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    updateAdminCredentials(newUsername: string, newPassword: string): Promise<void>;
    updateAdminRecoveryPhoneNumber(newPhoneNumber: string): Promise<void>;
    updateAdminSettings(newSettings: AdminSettings): Promise<void>;
    updateAdminSignInPageSettings(newSettings: AdminSignInPagePublicSettings): Promise<void>;
    updateBookingStatus(bookingId: bigint, newStatus: BookingStatus): Promise<void>;
    updateSubscriptionFeeInCents(newFee: bigint): Promise<void>;
    updateWorkerProfile(profile: PartialWorkerProfile): Promise<void>;
    uploadProfileImage(blob: ExternalBlob): Promise<void>;
}
