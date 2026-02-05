import Text "mo:core/Text";
import Array "mo:core/Array";
import Runtime "mo:core/Runtime";
import Map "mo:core/Map";
import Order "mo:core/Order";
import Iter "mo:core/Iter";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import Stripe "stripe/stripe";
import OutCall "http-outcalls/outcall";
import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";
import Migration "migration";

// Use migration module which is automatically called on canister upgrade
(with migration = Migration.run)
actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);
  include MixinStorage();

  public type UserRole = AccessControl.UserRole;

  public type AccountType = {
    #client;
    #worker;
  };

  public type UserProfile = {
    accountType : ?AccountType;
    name : Text;
  };

  public type PaymentStatus = {
    #pending : { createdTimestamp : Int };
    #completed : { paymentSessionId : Text };
  };

  public type PaymentStatusUpdate = {
    principal : Principal;
    previousStatus : ?PaymentStatus;
    updatedStatus : ?PaymentStatus;
  };

  public type SubscriptionPayment = {
    status : PaymentStatus;
    gracePeriodEnd : Int;
  };

  public type AdminSettings = {
    maintenanceMode : Bool;
    appName : Text;
    subscriptionFeeInCents : Nat;
  };

  // Backend-facing admin settings only (includes sensitive data, only accessible by admins)
  public type AdminManagedSignInPageSettings = {
    adminSignInTitle : Text;
    adminSignInSubtitle : Text;
    adminSignInHelperText : Text;
    adminSettings : AdminSettings;
  };

  // Public-facing settings for admin sign-in page (non-sensitive, accessible by anyone)
  public type AdminSignInPagePublicSettings = {
    adminSignInTitle : Text;
    adminSignInSubtitle : Text;
    adminSignInHelperText : Text;
  };

  // Plaintext admin credentials type
  public type AdminCredentials = {
    username : Text;
    password : Text;
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
    phoneNumber : Text;
    profileImage : ?Storage.ExternalBlob;
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
    phoneNumber : Text;
  };

  public type NewBooking = {
    worker : Principal;
    dateTime : Text;
    jobDetails : Text;
    location : Text;
  };

  public type AdminRoleChange = {
    adminCount : Nat;
    principal : Principal;
    isAdmin : Bool;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();
  let workerProfiles = Map.empty<Principal, WorkerProfile>();

  var bookingCounter = 0;
  let bookings = Map.empty<Nat, Booking>();

  var stripeConfiguration : ?Stripe.StripeConfiguration = null;

  // Add admin credentials
  var adminCredentials : ?AdminCredentials = ?{
    username = "adminumar";
    password = "umar9945";
  };

  // Store explicit admin principal mapping
  var adminCount = 1;
  let adminPrincipals = Map.empty<Principal, Bool>();

  // Store public-facing settings for Admin Sign-In page (non-sensitive) - now mutable
  var adminSignInPagePublicSettings : AdminSignInPagePublicSettings = {
    adminSignInTitle = "Welcome to the Admin Portal";
    adminSignInSubtitle = "Please enter your credentials to access the admin console.";
    adminSignInHelperText = "Contact your super admin if you encounter login issues.";
  };

  // Store backend-facing, admin-only settings including sensitive information
  var adminSettings : AdminSettings = {
    maintenanceMode = false;
    appName = "Service Exchange Platform";
    subscriptionFeeInCents = 999;
  };

  let subscriptionPayments = Map.empty<Principal, SubscriptionPayment>();

  // Store admin recovery phone number
  var adminRecoveryPhoneNumber : Text = "9945008686";

  // Rate limiting for credential reset attempts
  var lastResetAttemptTime : Int = 0;
  let RESET_COOLDOWN_NANOSECONDS : Int = 300_000_000_000; // 5 minutes

  // II Admin Bootstrap Token
  var adminBootstrapToken : ?Text = ?"S3RV1C37ADMN3T!NG74";

  // Helper function to check if user has valid subscription (paid or within grace period)
  func hasValidSubscription(caller : Principal) : Bool {
    // Admins bypass subscription checks
    if (AccessControl.isAdmin(accessControlState, caller)) {
      return true;
    };

    // Check if user has a profile (required for subscription tracking)
    if (not userProfiles.containsKey(caller)) {
      return false;
    };

    // Check subscription payment status
    switch (subscriptionPayments.get(caller)) {
      case (null) {
        // No payment record means user hasn't completed onboarding
        false;
      };
      case (?payment) {
        switch (payment.status) {
          case (#completed _) {
            // Payment completed - valid subscription
            true;
          };
          case (#pending { createdTimestamp }) {
            // Check if still within grace period
            let currentTime = Time.now();
            currentTime <= payment.gracePeriodEnd;
          };
        };
      };
    };
  };

  public query func isStripeConfigured() : async Bool {
    stripeConfiguration != null;
  };

  public shared ({ caller }) func setStripeConfiguration(config : Stripe.StripeConfiguration) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    stripeConfiguration := ?config;
  };

  func getStripeConfiguration() : Stripe.StripeConfiguration {
    switch (stripeConfiguration) {
      case (null) { Runtime.trap("Stripe needs to be first configured") };
      case (?config) { config };
    };
  };

  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  public func getStripeSessionStatus(sessionId : Text) : async Stripe.StripeSessionStatus {
    await Stripe.getSessionStatus(getStripeConfiguration(), sessionId, transform);
  };

  public shared ({ caller }) func createCheckoutSession(items : [Stripe.ShoppingItem], successUrl : Text, cancelUrl : Text) : async Text {
    await Stripe.createCheckoutSession(getStripeConfiguration(), caller, items, successUrl, cancelUrl, transform);
  };

  // Admin Sign-In Page Public Endpoints
  public query func getAdminSignInPageSettings() : async AdminSignInPagePublicSettings {
    adminSignInPagePublicSettings;
  };

  // Returns true if admin credentials exist (for frontend visibility)
  public query func isAdminSignInConfigured() : async Bool {
    adminCredentials != null;
  };

  // Get new admin sign-in pages and verify backend credentials
  public query func getAdminSignInPageWithCredentialsCheck() : async {
    settings : AdminSignInPagePublicSettings;
    hasCredentials : Bool;
  } {
    {
      settings = adminSignInPagePublicSettings;
      hasCredentials = adminCredentials != null;
    };
  };

  // Admin sign-in verification - grants admin role to caller upon successful authentication
  public shared ({ caller }) func adminSignInWithCredentials(username : Text, password : Text) : async Bool {
    switch (adminCredentials) {
      case (?{ username = storedUsername; password = storedPassword }) {
        if (username == storedUsername and password == storedPassword) {
          AccessControl.assignRole(accessControlState, caller, caller, #admin);
          return true;
        };
      };
      case (null) {};
    };
    false;
  };

  // Check if the caller is currently an admin (via AccessControl)
  public query ({ caller }) func isAdminLoggedIn() : async Bool {
    AccessControl.isAdmin(accessControlState, caller);
  };

  // Revoke admin role from caller
  public shared ({ caller }) func logOutAdmin() : async Bool {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can log out");
    };
    AccessControl.assignRole(accessControlState, caller, caller, #guest);
    true;
  };

  public shared ({ caller }) func updateAdminSignInPageSettings(newSettings : AdminSignInPagePublicSettings) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update admin sign-in page settings");
    };
    adminSignInPagePublicSettings := newSettings;
  };

  public query ({ caller }) func canRevokeAdmin() : async Bool {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can check revocation status");
    };
    adminCount > 1;
  };

  public query ({ caller }) func getAdminRoleChanges() : async [AdminRoleChange] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view role changes");
    };
    adminPrincipals.toArray().map(func((principal, isAdmin)) { { adminCount; principal; isAdmin } });
  };

  public query ({ caller }) func getAdminRoleChangeStatus() : async AdminRoleChange {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view role change status");
    };
    {
      adminCount;
      principal = caller;
      isAdmin = switch (adminPrincipals.get(caller)) {
        case (null) { false };
        case (?bool) { bool };
      };
    };
  };

  public query ({ caller }) func getIsAdmin() : async Bool {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can check admin status");
    };
    adminPrincipals.get(caller) == ?true;
  };

  public query ({ caller }) func getIsAdminWithCount() : async AdminRoleChange {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view status with count");
    };
    {
      adminCount;
      principal = caller;
      isAdmin = adminPrincipals.get(caller) == ?true;
    };
  };

  public query ({ caller }) func getAdminRoleChangesWithCount() : async [AdminRoleChange] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view role changes with count");
    };
    adminPrincipals.toArray().map(func((principal, isAdmin)) { { adminCount; principal; isAdmin } });
  };

  public query ({ caller }) func getAdminSettings() : async AdminSettings {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view admin settings");
    };
    adminSettings;
  };

  public shared ({ caller }) func updateAdminSettings(newSettings : AdminSettings) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update settings");
    };
    adminSettings := newSettings;
  };

  public query func isMaintenanceMode() : async Bool {
    adminSettings.maintenanceMode;
  };

  public query func getSubscriptionFeeInCents() : async Nat {
    adminSettings.subscriptionFeeInCents;
  };

  public shared ({ caller }) func updateSubscriptionFeeInCents(newFee : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update subscription fee");
    };
    adminSettings := {
      adminSettings with
      subscriptionFeeInCents = newFee;
    };
  };

  public query ({ caller }) func forceCheckSubscriptionStatuses() : async [(Principal, PaymentStatus)] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view all payment statuses");
    };
    let _currentTime = Time.now();
    let allExpired = subscriptionPayments.toArray();
    allExpired.map(
      func((principal, subscription)) {
        (principal, subscription.status);
      }
    );
  };

  public shared ({ caller }) func clearExpiredPendingStatuses() : async [(Principal, PaymentStatusUpdate)] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can clear expired payments");
    };

    let currentTime = Time.now();
    let expiredEntries = subscriptionPayments.toArray().filter(
      func((_, subPayment)) {
        switch (subPayment.status) {
          case (#pending { createdTimestamp }) {
            currentTime - createdTimestamp > 172800000000000; // 2 days in nanoseconds
          };
          case (_) { false };
        };
      }
    );
    expiredEntries.map<(Principal, SubscriptionPayment), (Principal, PaymentStatusUpdate)>(
      func((principal, subPayment)) {
        let prevStatus = ?subPayment.status;
        subscriptionPayments.remove(principal);
        (principal, { principal; previousStatus = prevStatus; updatedStatus = null });
      }
    );
  };

  public shared ({ caller }) func confirmPaymentSuccessful(paymentSessionId : Text) : async Bool {
    // Must be authenticated user
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can confirm payment");
    };
    if (not userProfiles.containsKey(caller)) {
      Runtime.trap("Unauthorized: Must create user profile before confirming payment");
    };

    switch (subscriptionPayments.get(caller)) {
      case (null) {
        Runtime.trap("No pending payment found for this user");
      };
      case (?payment) {
        switch (payment.status) {
          case (#pending _) {
            let paymentStatus = await Stripe.getSessionStatus(getStripeConfiguration(), paymentSessionId, transform);
            switch (paymentStatus) {
              case (#completed _) {
                let updatedStatus : PaymentStatus = #completed { paymentSessionId };
                subscriptionPayments.add(
                  caller,
                  {
                    payment with
                    status = updatedStatus;
                  },
                );
                true;
              };
              case (_) { false };
            };
          };
          case (#completed _) {
            Runtime.trap("Payment already completed");
          };
        };
      };
    };
  };

  public query ({ caller }) func getAllPendingPaymentUsers() : async [(Principal, PaymentStatus)] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view pending payments");
    };
    let allPayments = subscriptionPayments.toArray();
    let filtered = allPayments.filter(
      func((_, subPayment)) {
        switch (subPayment.status) {
          case (#pending _) { true };
          case (_) { false };
        };
      }
    );
    filtered.map(
      func((principal, subPayment)) {
        (principal, subPayment.status);
      }
    );
  };

  public query ({ caller }) func getPendingPaymentUsersCount() : async Nat {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view pending payment count");
    };
    let allPayments = subscriptionPayments.toArray();
    let pendingPayments = allPayments.filter(
      func((_, subPayment)) {
        switch (subPayment.status) {
          case (#pending _) { true };
          case (_) { false };
        };
      }
    );
    pendingPayments.size();
  };

  // Admin User Management Endpoints

  public query ({ caller }) func listAllUsers() : async [(Principal, UserProfile)] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can list all users");
    };
    userProfiles.entries().toArray();
  };

  public query ({ caller }) func searchUserByPrincipal(principalText : Text) : async ?(Principal, UserProfile) {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can search users");
    };
    let searchPrincipal = Principal.fromText(principalText);
    switch (userProfiles.get(searchPrincipal)) {
      case (null) { null };
      case (?profile) { ?(searchPrincipal, profile) };
    };
  };

  // User Profile Management (required by frontend)
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };

    // Enforce subscription payment after grace period
    if (not hasValidSubscription(caller)) {
      Runtime.trap("Subscription payment required: Grace period has expired");
    };

    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };

    // Enforce subscription for non-admin callers
    if (caller == user and not hasValidSubscription(caller)) {
      Runtime.trap("Subscription payment required: Grace period has expired");
    };

    userProfiles.get(user);
  };

  public query ({ caller }) func getUserSubscriptionStatus() : async Bool {
    userProfiles.containsKey(caller);
  };

  public query ({ caller }) func getPrincipalPaymentStatus(principal : Principal) : async ?PaymentStatus {
    // Only allow viewing own payment status or admin viewing any
    if (caller != principal and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own payment status");
    };

    switch (subscriptionPayments.get(principal)) {
      case (null) { null };
      case (?payment) { ?payment.status };
    };
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };

    // Allow profile creation without payment (first time only)
    if (not userProfiles.containsKey(caller)) {
      let currentTime = Time.now();
      let paymentStatus : PaymentStatus = #pending {
        createdTimestamp = currentTime;
      };
      let gracePeriod = 172800000000000; // 2 days in nanoseconds

      let subscriptionPayment : SubscriptionPayment = {
        status = paymentStatus;
        gracePeriodEnd = currentTime + gracePeriod;
      };
      subscriptionPayments.add(caller, subscriptionPayment);
      userProfiles.add(caller, profile);
    } else {
      // For profile updates, enforce subscription
      if (not hasValidSubscription(caller)) {
        Runtime.trap("Subscription payment required: Grace period has expired");
      };
      userProfiles.add(caller, profile);
    };
  };

  // Worker Profiles
  public query ({ caller }) func getWorkerProfile(worker : Principal) : async ?WorkerProfile {
    // Check maintenance mode for non-admins
    if (adminSettings.maintenanceMode and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Service unavailable: Application is in maintenance mode");
    };

    // Enforce subscription for authenticated users
    if (AccessControl.hasPermission(accessControlState, caller, #user) and not hasValidSubscription(caller)) {
      Runtime.trap("Subscription payment required: Grace period has expired");
    };

    workerProfiles.get(worker);
  };

  public query ({ caller }) func browseWorkers() : async [WorkerProfile] {
    if (adminSettings.maintenanceMode and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Service unavailable: Application is in maintenance mode");
    };

    // Enforce subscription for authenticated users
    if (AccessControl.hasPermission(accessControlState, caller, #user) and not hasValidSubscription(caller)) {
      Runtime.trap("Subscription payment required: Grace period has expired");
    };

    workerProfiles.values().toArray();
  };

  public query ({ caller }) func browseWorkersByCategory(category : ServiceCategory) : async [WorkerProfile] {
    if (adminSettings.maintenanceMode and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Service unavailable: Application is in maintenance mode");
    };

    // Enforce subscription for authenticated users
    if (AccessControl.hasPermission(accessControlState, caller, #user) and not hasValidSubscription(caller)) {
      Runtime.trap("Subscription payment required: Grace period has expired");
    };

    let filtered = workerProfiles.values().toArray().filter(
      func(profile : WorkerProfile) : Bool {
        profile.category == category;
      }
    );
    filtered;
  };

  public query ({ caller }) func browseWorkersByRateAscending() : async [WorkerProfile] {
    if (adminSettings.maintenanceMode and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Service unavailable: Application is in maintenance mode");
    };

    // Enforce subscription for authenticated users
    if (AccessControl.hasPermission(accessControlState, caller, #user) and not hasValidSubscription(caller)) {
      Runtime.trap("Subscription payment required: Grace period has expired");
    };

    workerProfiles.values().toArray().sort(WorkerProfile.compareByHourlyRate);
  };

  public query ({ caller }) func browseWorkersByRateDescending() : async [WorkerProfile] {
    if (adminSettings.maintenanceMode and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Service unavailable: Application is in maintenance mode");
    };

    // Enforce subscription for authenticated users
    if (AccessControl.hasPermission(accessControlState, caller, #user) and not hasValidSubscription(caller)) {
      Runtime.trap("Subscription payment required: Grace period has expired");
    };

    workerProfiles.values().toArray().sort(WorkerProfile.compareByHourlyRate).reverse();
  };

  public shared ({ caller }) func createWorkerProfile(profile : PartialWorkerProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can create worker profiles");
    };
    if (adminSettings.maintenanceMode and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Service unavailable: Application is in maintenance mode");
    };

    // Enforce subscription payment
    if (not hasValidSubscription(caller)) {
      Runtime.trap("Subscription payment required: Grace period has expired");
    };

    if (not userProfiles.containsKey(caller)) {
      Runtime.trap("Unauthorized: Must complete user profile onboarding before creating worker profile");
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
      phoneNumber = profile.phoneNumber;
      profileImage = null;
    };
    workerProfiles.add(caller, fullProfile);
  };

  public shared ({ caller }) func updateWorkerProfile(profile : PartialWorkerProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can update worker profiles");
    };
    if (adminSettings.maintenanceMode and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Service unavailable: Application is in maintenance mode");
    };

    // Enforce subscription payment
    if (not hasValidSubscription(caller)) {
      Runtime.trap("Subscription payment required: Grace period has expired");
    };

    if (not userProfiles.containsKey(caller)) {
      Runtime.trap("Unauthorized: Must complete user profile onboarding before updating worker profile");
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
          phoneNumber = profile.phoneNumber;
          profileImage = existingProfile.profileImage;
        };
        workerProfiles.add(caller, fullProfile);
      };
    };
  };

  public shared ({ caller }) func uploadProfileImage(blob : Storage.ExternalBlob) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can upload profile images");
    };
    if (adminSettings.maintenanceMode and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Service unavailable: Application is in maintenance mode");
    };

    // Enforce subscription payment
    if (not hasValidSubscription(caller)) {
      Runtime.trap("Subscription payment required: Grace period has expired");
    };

    switch (workerProfiles.get(caller)) {
      case (null) {
        Runtime.trap("Worker profile does not exist");
      };
      case (?existingProfile) {
        if (existingProfile.owner != caller) {
          Runtime.trap("Unauthorized: Can only update your own worker profile");
        };
        let updatedProfile : WorkerProfile = {
          existingProfile with
          profileImage = ?blob;
        };
        workerProfiles.add(caller, updatedProfile);
      };
    };
  };

  public shared ({ caller }) func removeProfileImage() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can remove profile images");
    };
    if (adminSettings.maintenanceMode and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Service unavailable: Application is in maintenance mode");
    };

    // Enforce subscription payment
    if (not hasValidSubscription(caller)) {
      Runtime.trap("Subscription payment required: Grace period has expired");
    };

    switch (workerProfiles.get(caller)) {
      case (null) {
        Runtime.trap("Worker profile does not exist");
      };
      case (?existingProfile) {
        if (existingProfile.owner != caller) {
          Runtime.trap("Unauthorized: Can only update your own worker profile");
        };
        let updatedProfile : WorkerProfile = {
          existingProfile with
          profileImage = null;
        };
        workerProfiles.add(caller, updatedProfile);
      };
    };
  };

  public query ({ caller }) func getWorkerProfileImage(worker : Principal) : async ?Storage.ExternalBlob {
    if (adminSettings.maintenanceMode and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Service unavailable: Application is in maintenance mode");
    };

    // Enforce subscription for authenticated users
    if (AccessControl.hasPermission(accessControlState, caller, #user) and not hasValidSubscription(caller)) {
      Runtime.trap("Subscription payment required: Grace period has expired");
    };

    switch (workerProfiles.get(worker)) {
      case (null) { null };
      case (?profile) { profile.profileImage };
    };
  };

  // Bookings
  public shared ({ caller }) func createBookingRequest(newBooking : NewBooking) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can create bookings");
    };
    if (adminSettings.maintenanceMode and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Service unavailable: Application is in maintenance mode");
    };

    // Enforce subscription payment
    if (not hasValidSubscription(caller)) {
      Runtime.trap("Subscription payment required: Grace period has expired");
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
    if (adminSettings.maintenanceMode and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Service unavailable: Application is in maintenance mode");
    };

    // Enforce subscription payment
    if (not hasValidSubscription(caller)) {
      Runtime.trap("Subscription payment required: Grace period has expired");
    };

    switch (bookings.get(bookingId)) {
      case (null) { Runtime.trap("Booking does not exist") };
      case (?booking) {
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

    // Enforce subscription payment
    if (not hasValidSubscription(caller)) {
      Runtime.trap("Subscription payment required: Grace period has expired");
    };

    switch (bookings.get(bookingId)) {
      case (null) { Runtime.trap("Booking does not exist") };
      case (?booking) {
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

    // Enforce subscription payment
    if (not hasValidSubscription(caller)) {
      Runtime.trap("Subscription payment required: Grace period has expired");
    };

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

    // Enforce subscription payment
    if (not hasValidSubscription(caller)) {
      Runtime.trap("Subscription payment required: Grace period has expired");
    };

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

    // Enforce subscription payment
    if (not hasValidSubscription(caller)) {
      Runtime.trap("Subscription payment required: Grace period has expired");
    };

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

  // Admin recovery phone number management
  public query ({ caller }) func getAdminRecoveryPhoneNumber() : async Text {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view recovery phone number");
    };
    adminRecoveryPhoneNumber;
  };

  public shared ({ caller }) func updateAdminRecoveryPhoneNumber(newPhoneNumber : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update recovery phone number");
    };
    adminRecoveryPhoneNumber := newPhoneNumber;
  };

  // Admin credential reset with rate limiting and abuse protection
  public shared ({ caller }) func resetAdminCredentialsByPhoneNumber(
    phoneNumber : Text,
    newUsername : Text,
    newPassword : Text,
  ) : async Bool {
    let currentTime = Time.now();

    // Rate limiting: enforce cooldown period between reset attempts
    if (currentTime - lastResetAttemptTime < RESET_COOLDOWN_NANOSECONDS) {
      // Return generic failure to avoid leaking timing information
      return false;
    };

    // Update last attempt time regardless of success/failure to prevent timing attacks
    lastResetAttemptTime := currentTime;

    // Verify phone number matches (constant-time comparison would be ideal but Text doesn't support it easily)
    if (phoneNumber != adminRecoveryPhoneNumber) {
      // Generic failure response - don't reveal whether phone number was correct
      return false;
    };

    // Update credentials
    adminCredentials := ?{
      username = newUsername;
      password = newPassword;
    };

    true;
  };

  // Admin credential update (requires existing admin authentication)
  public shared ({ caller }) func updateAdminCredentials(newUsername : Text, newPassword : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can update admin credentials");
    };
    adminCredentials := ?{
      username = newUsername;
      password = newPassword;
    };
  };

  // Secure Internet Identity (II) Admin Bootstrap Endpoint
  public shared ({ caller }) func bootstrapAdminRole(token : Text) : async Bool {
    switch (adminBootstrapToken) {
      case (null) {
        // Token already used or not configured
        return false;
      };
      case (?storedToken) {
        if (token != storedToken) {
          return false;
        };
        AccessControl.initialize(accessControlState, caller, storedToken, token);

        // Track admin status in local map
        adminPrincipals.add(caller, true);
        adminCount += 1;

        // Clear the bootstrap token for one-time use
        adminBootstrapToken := null;

        return true;
      };
    };
  };
};
