module {
  type AdminCredentials = {
    username : Text;
    password : Text;
  };

  type OldActor = {
    adminSignInPagePublicSettings : {
      adminSignInTitle : Text;
      adminSignInSubtitle : Text;
      adminSignInHelperText : Text;
    };
  };

  type NewActor = {
    adminCredentials : ?AdminCredentials;
    adminSignInPagePublicSettings : {
      adminSignInTitle : Text;
      adminSignInSubtitle : Text;
      adminSignInHelperText : Text;
    };
  };

  public func run(old : OldActor) : NewActor {
    {
      adminCredentials = ?{ username = "adminumar"; password = "umar9945" };
      adminSignInPagePublicSettings = old.adminSignInPagePublicSettings;
    };
  };
};
