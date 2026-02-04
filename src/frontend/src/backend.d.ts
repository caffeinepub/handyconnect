import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface NewBooking {
    jobDetails: string;
    worker: Principal;
    dateTime: string;
    location: string;
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
export interface WorkerProfile {
    serviceArea: string;
    displayName: string;
    owner: Principal;
    hourlyRate: bigint;
    description: string;
    isActive: boolean;
    category: ServiceCategory;
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
export interface UserProfile {
    name: string;
    accountType?: AccountType;
}
export interface PartialWorkerProfile {
    serviceArea: string;
    displayName: string;
    hourlyRate: bigint;
    description: string;
    isActive: boolean;
    category: ServiceCategory;
}
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
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    browseWorkers(): Promise<Array<WorkerProfile>>;
    browseWorkersByCategory(category: ServiceCategory): Promise<Array<WorkerProfile>>;
    browseWorkersByRateAscending(): Promise<Array<WorkerProfile>>;
    browseWorkersByRateDescending(): Promise<Array<WorkerProfile>>;
    createBookingRequest(newBooking: NewBooking): Promise<bigint>;
    createWorkerProfile(profile: PartialWorkerProfile): Promise<void>;
    getBooking(bookingId: bigint): Promise<Booking>;
    getBookingsByClient(client: Principal): Promise<Array<Booking>>;
    getBookingsByStatus(status: BookingStatus): Promise<Array<Booking>>;
    getBookingsByWorker(worker: Principal): Promise<Array<Booking>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getWorkerProfile(worker: Principal): Promise<WorkerProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateBookingStatus(bookingId: bigint, newStatus: BookingStatus): Promise<void>;
    updateWorkerProfile(profile: PartialWorkerProfile): Promise<void>;
}
