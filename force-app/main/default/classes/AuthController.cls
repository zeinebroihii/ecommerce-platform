public without sharing class AuthController {

    /**
     * Authenticate a user on the Experience Cloud site.
     * Returns the redirect URL on success, throws AuraHandledException on failure.
     */
    @AuraEnabled
    public static String loginUser(String username, String password, String startUrl) {
        try {
            ApexPages.PageReference ref = Site.login(username, password,
                String.isBlank(startUrl) ? '/s/' : startUrl);
            if (ref != null) return ref.getUrl();
            throw new AuraHandledException('Identifiants incorrects.');
        } catch (AuraHandledException e) {
            throw e;
        } catch (Exception e) {
            throw new AuraHandledException('Email ou mot de passe incorrect.');
        }
    }

    /**
     * Self-register a B2C customer directly on the Experience Cloud site.
     * Creates Account + Contact + Community user, then auto-logs in.
     * No lead conversion required.
     */
    @AuraEnabled
    public static String selfRegisterB2C(String firstName, String lastName, String email, String password) {
        try {
            // 1. Create account and contact
            Account acc = new Account(Name = firstName + ' ' + lastName);
            insert acc;

            Contact con = new Contact(
                FirstName = firstName,
                LastName  = lastName,
                Email     = email,
                AccountId = acc.Id
            );
            insert con;

            // 2. Resolve B2C profile (Customer Community User preferred)
            List<Profile> profiles = [
                SELECT Id FROM Profile
                WHERE Name IN ('Customer Community User',
                               'Customer Community Login User',
                               'Customer Community Plus Login User',
                               'Customer Community Plus User')
                ORDER BY Name ASC
                LIMIT 1
            ];
            if (profiles.isEmpty()) {
                throw new AuraHandledException('Profil communautaire B2C introuvable. Contactez l\'administrateur.');
            }

            // 3. Build the community user
            String alias = (firstName.length() > 1 ? firstName.substring(0, 1) : firstName)
                         + (lastName.length()  > 4 ? lastName.substring(0, 4)  : lastName);
            User u = new User(
                Username          = email,
                Email             = email,
                FirstName         = firstName,
                LastName          = lastName,
                Alias             = alias,
                ProfileId         = profiles[0].Id,
                ContactId         = con.Id,
                TimeZoneSidKey    = 'Europe/Paris',
                LocaleSidKey      = 'fr_FR',
                LanguageLocaleKey = 'fr',
                EmailEncodingKey  = 'UTF-8'
            );

            // 4. Create external user (returns userId or null on failure)
            String userId = Site.createExternalUser(u, acc.Id, password, false);
            if (String.isBlank(userId)) {
                throw new AuraHandledException('Impossible de créer le compte. L\'email est peut-être déjà utilisé.');
            }

            // 5. Auto-login and redirect to portal
            PageReference ref = Site.login(email, password, '/shop/s/');
            return ref != null ? ref.getUrl() : '/shop/s/';

        } catch (AuraHandledException e) {
            throw e;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    /**
     * Change / set password for the current site user.
     * For forgot-password flows the reset token is automatically read
     * from the current Site context (URL parameter).
     */
    @AuraEnabled
    public static void changeUserPassword(String newPassword, String verifyPassword) {
        try {
            // Site.changePassword returns a PageReference on success, null on failure
            PageReference ref = Site.changePassword(newPassword, verifyPassword, '');
            if (ref == null) {
                // Check ApexPages for error messages
                String errMsg = '';
                for (ApexPages.Message m : ApexPages.getMessages()) {
                    errMsg += m.getSummary() + ' ';
                }
                throw new AuraHandledException(
                    String.isNotBlank(errMsg)
                        ? errMsg.trim()
                        : 'Impossible de changer le mot de passe. Veuillez réessayer.'
                );
            }
        } catch (AuraHandledException e) {
            throw e;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
}
