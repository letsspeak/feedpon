class HomeController {
    /**
     * @ngInject
     */
    constructor(private $scope: ng.IScope,
                private $ionicSideMenuDelegate: ionic.ISideMenuDelegate) {
    }

    toggleLeft(): void {
        this.$ionicSideMenuDelegate.toggleLeft();
    }
}

export = HomeController;