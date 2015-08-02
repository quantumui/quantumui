'use strict';
angular.module('ngQuantum.pageable.results', [])
.directive('nqPageableResults', function () {
    return {
        restrict: 'A',
        templateUrl: function (element, attr) {
            if (angular.isDefined(attr.noTemplate))
                return false;
            if (angular.isDefined(attr.templateUrl))
                return attr.templateUrl;
            return 'pageable/pageableResults.tpl.html'
        },
        require: '^nqPageable',
        link: function (scope, elm, attr, controller) {
            var copt = controller.$options; scope.$locale = scope.$locale || {};
            var theme = attr.theme || copt.theme;
            if (theme)
                elm.addClass('pageable-results-' + theme);
            angular.forEach(['currentPageText', 'totalResultText', 'totalPageText'],
                    function (key) {
                        if (angular.isDefined(attr[key])) {
                            scope.$locale[key] = attr[key];
                        }
                        else if (angular.isDefined(copt[key])) {
                            scope.$locale[key] = copt[key];
                        }
                    });

        }
    };
})