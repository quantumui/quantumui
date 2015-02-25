+function (window, angular, undefined) {
    'use strict';
    angular.module('ngQuantum.services', [
        'ngQuantum.services.lazy',
        'ngQuantum.services.mouse',
        'ngQuantum.services.helpers',
        'ngQuantum.services.parseOptions',
        'ngQuantum.services.templateHelper',
        'ngQuantum.services.placement',
        'ngQuantum.services.color'
    ])

}(window, window.angular);