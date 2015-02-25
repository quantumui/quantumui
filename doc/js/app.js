(function () {
    'use strict';
    var app = angular.module('myApp', [
        'ngSanitize',
        'ngAnimate',
        'ngQuantum'
    ]);
    app.run(['$templateCache', '$cacheFactory', '$rootScope',
        function ($templateCache, $cacheFactory, $rootScope) {
            $templateCache = false;
        }]);

    app.config(['$httpProvider',
        function ($httpProvider) {
            $httpProvider.defaults.cache = false;
        }]);

})();