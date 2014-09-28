import AuthenticationService = require('../services/authenticationService');

class EntranceController {
    /**
     * @ngInject
     */
    constructor(private $scope: ng.IScope,
                private $state: ng.ui.IStateService,
                private authenticationService: IAuthenticationService) {
        authenticationService.isAuthorized(Date.now()).then((authorized) => {
            if (authorized) $state.go('welcome');
        });
    }

    authenticate(): void {
        this.authenticationService.authenticate(Date.now())
            .finally(() => this.$state.go('welcome'));
    }
}

export = EntranceController;