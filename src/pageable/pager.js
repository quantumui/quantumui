'use strict';
angular.module('ngQuantum.pageable.pager', [])
.directive('nqPager', ['$timeout', function ($timeout) {
    return {
        require: '^nqPageable',
        restrict: 'EA',
        templateUrl: function (element, attr) {
            if (angular.isDefined(attr.noTemplate))
                return false;
            if (angular.isDefined(attr.templateUrl))
                return attr.templateUrl;
            return 'pageable/pager.tpl.html'
        },
        scope: true,
        link: function postLink(scope, element, attr, controller) {
            var locale = scope.$locale = scope.$locale || {}, copt = controller.$options;
            angular.forEach(['previousText', 'nextText'],
                function (key) {
                    if (angular.isDefined(attr[key])) {
                        scope.$locale[key] = attr[key];
                    }
                    else if (angular.isDefined(copt[key])) {
                        scope.$locale[key] = copt[key];
                    }
                });
            var theme = attr.theme || copt.theme;
            if (theme) {
                element.addClass('pager-' + theme)
            }
            var size = attr.sizeClass || copt.sizeClass;
            if (size) {
                element.addClass('pager-' + size)
            }
            scope.$aligned = attr.aligned;
            scope.$on('$refreshPager', function () {
                $timeout(function () {
                    scope.$pagerWarning = controller.$scope.$pagerWarning;
                    scope.$currentPage = controller.$scope.$currentPage;
                    scope.$pageSize = controller.$scope.$pageSize;
                    scope.$totalResult = controller.$scope.$totalResult;
                    scope.$totalPages = controller.$scope.$totalPages;
                }, 0);
            });
            scope.$$postDigest(function () {
                scope.$prev = controller.$scope.$prev;
                scope.$next = controller.$scope.$next;
                scope.$gotoPage = controller.$scope.$gotoPage;
            });

        }
    };
}])