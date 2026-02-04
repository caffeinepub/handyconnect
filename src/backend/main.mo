import Text "mo:core/Text";
import Array "mo:core/Array";
import Runtime "mo:core/Runtime";
import Map "mo:core/Map";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
import Principal "mo:core/Principal";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  public type UserRole = AccessControl.UserRole;
  
  public type AccountType = {
    #client;
    #worker;
  };

  public type UserProfile = {
    accountType : ?AccountType;
    name : Text;
  };

  public type ServiceCategory = {
    #plumbing;
    #electrical;
    #cleaning;
    #gardening;
    #other : Text;
  };

  public type WorkerProfile = {
    owner : Principal;
    displayName : Text;
    category : ServiceCategory;
    description : Text;
    serviceArea : Text;
    hourlyRate : Nat;
    isActive : Bool;
  };

  public type BookingStatus = {
    #requested;
    #accepted;
    #declined;
    #cancelled;
    #completed;
  };

  public type Booking = {
    id : Nat;
    client : Principal;
    worker : Principal;
    dateTime : Text;
    jobDetails : Text;
    location : Text;
    status : BookingStatus;
  };

  module Booking {
    public func compareById(b1 : Booking, b2 : Booking) : Order.Order {
      Nat.compare(b1.id, b2.id);
    };
  };

  module WorkerProfile {
    public func compareByHourlyRate(w1 : WorkerProfile, w2 : WorkerProfile) : Order.Order {
      Nat.compare(w1.hourlyRate, w2.hourlyRate);
    };
  };

  public type PartialWorkerProfile = {
    displayName : Text;
    category : ServiceCategory;
    description : Text;
    serviceArea : Text;
    hourlyRate : Nat;
    isActive : Bool;
  };

  public type NewBooking = {
    worker : Principal;
    dateTime : Text;
    jobDetails : Text;
    location : Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();
  let workerProfiles = Map.empty<Principal, WorkerProfile>();

  var bookingCounter = 0;
  let bookings = Map.empty<Nat, Booking>();

  // User Profile Management (required by frontend)
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Worker Profiles
  public query ({ caller }) func getWorkerProfile(worker : Principal) : async ?WorkerProfile {
    // Public endpoint - anyone can view worker profiles for discovery
    workerProfiles.get(worker);
  };

  public query ({ caller }) func browseWorkers() : async [WorkerProfile] {
    // Public endpoint - anyone can browse workers
    workerProfiles.values().toArray();
  };

  public query ({ caller }) func browseWorkersByCategory(category : ServiceCategory) : async [WorkerProfile] {
    // Public endpoint - anyone can browse workers by category
    let filtered = workerProfiles.values().toArray().filter(
      func(profile : WorkerProfile) : Bool {
        profile.category == category;
      }
    );
    filtered;
  };

  public query ({ caller }) func browseWorkersByRateAscending() : async [WorkerProfile] {
    // Public endpoint - anyone can browse workers sorted by rate
    workerProfiles.values().toArray().sort(WorkerProfile.compareByHourlyRate);
  };

  public query ({ caller }) func browseWorkersByRateDescending() : async [WorkerProfile] {
    // Public endpoint - anyone can browse workers sorted by rate
    workerProfiles.values().toArray().sort(WorkerProfile.compareByHourlyRate).reverse();
  };

  public shared ({ caller }) func createWorkerProfile(profile : PartialWorkerProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can create worker profiles");
    };
    if (workerProfiles.containsKey(caller)) {
      Runtime.trap("Worker profile already exists");
    };
    let fullProfile : WorkerProfile = {
      owner = caller;
      displayName = profile.displayName;
      category = profile.category;
      description = profile.description;
      serviceArea = profile.serviceArea;
      hourlyRate = profile.hourlyRate;
      isActive = profile.isActive;
    };
    workerProfiles.add(caller, fullProfile);
  };

  public shared ({ caller }) func updateWorkerProfile(profile : PartialWorkerProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can update worker profiles");
    };
    switch (workerProfiles.get(caller)) {
      case (null) {
        Runtime.trap("Worker profile does not exist");
      };
      case (?existingProfile) {
        if (existingProfile.owner != caller) {
          Runtime.trap("Unauthorized: Can only update your own worker profile");
        };
        let fullProfile : WorkerProfile = {
          owner = caller;
          displayName = profile.displayName;
          category = profile.category;
          description = profile.description;
          serviceArea = profile.serviceArea;
          hourlyRate = profile.hourlyRate;
          isActive = profile.isActive;
        };
        workerProfiles.add(caller, fullProfile);
      };
    };
  };

  // Bookings
  public shared ({ caller }) func createBookingRequest(newBooking : NewBooking) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can create bookings");
    };
    if (not workerProfiles.containsKey(newBooking.worker)) {
      Runtime.trap("Worker does not exist");
    };
    let bookingId = bookingCounter;
    let booking : Booking = {
      id = bookingId;
      client = caller;
      worker = newBooking.worker;
      dateTime = newBooking.dateTime;
      jobDetails = newBooking.jobDetails;
      location = newBooking.location;
      status = #requested;
    };
    bookings.add(bookingId, booking);
    bookingCounter += 1;
    bookingId;
  };

  public shared ({ caller }) func updateBookingStatus(bookingId : Nat, newStatus : BookingStatus) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can update bookings");
    };
    switch (bookings.get(bookingId)) {
      case (null) { Runtime.trap("Booking does not exist") };
      case (?booking) {
        // Allow both client and worker to update status
        if (caller != booking.client and caller != booking.worker) {
          Runtime.trap("Unauthorized: Only involved parties can update the booking");
        };
        if (caller == booking.client) {
          switch (newStatus, booking.status) {
            case (#cancelled, #requested) {
              bookings.add(bookingId, { booking with status = newStatus });
              return;
            };
            case (#cancelled, _) {
              Runtime.trap("Clients can only cancel requested bookings");
            };
            case (_) {
              Runtime.trap("Clients can only cancel bookings");
            };
          };
        };
        if (caller == booking.worker) {
          switch (newStatus, booking.status) {
            case (#accepted, #requested) {
              bookings.add(bookingId, { booking with status = newStatus });
              return;
            };
            case (#declined, #requested) {
              bookings.add(bookingId, { booking with status = newStatus });
              return;
            };
            case (#completed, #accepted) {
              bookings.add(bookingId, { booking with status = newStatus });
              return;
            };
            case (_) {
              Runtime.trap("Workers can only accept/decline requested bookings or complete accepted bookings");
            };
          };
        };
        Runtime.trap("Unauthorized: Unable to update booking status");
      };
    };
  };

  public query ({ caller }) func getBooking(bookingId : Nat) : async Booking {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view bookings");
    };
    switch (bookings.get(bookingId)) {
      case (null) { Runtime.trap("Booking does not exist") };
      case (?booking) {
        // Only allow involved parties to view the booking
        if (caller != booking.client and caller != booking.worker and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Only involved parties can access booking details");
        };
        booking;
      };
    };
  };

  public query ({ caller }) func getBookingsByStatus(status : BookingStatus) : async [Booking] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can query bookings");
    };
    // Return only bookings where caller is involved
    let filtered = bookings.values().toArray().filter(
      func(booking : Booking) : Bool {
        booking.status == status and (booking.client == caller or booking.worker == caller);
      }
    );
    filtered;
  };

  public query ({ caller }) func getBookingsByWorker(worker : Principal) : async [Booking] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can query bookings");
    };
    // Only allow querying own bookings or if admin
    if (caller != worker and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only query your own bookings");
    };
    let filtered = bookings.values().toArray().filter(
      func(booking : Booking) : Bool {
        booking.worker == worker;
      }
    );
    filtered;
  };

  public query ({ caller }) func getBookingsByClient(client : Principal) : async [Booking] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can query bookings");
    };
    // Only allow querying own bookings or if admin
    if (caller != client and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only query your own bookings");
    };
    let filtered = bookings.values().toArray().filter(
      func(booking : Booking) : Bool {
        booking.client == client;
      }
    );
    filtered;
  };
};
