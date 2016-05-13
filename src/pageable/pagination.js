'use strict';
angular.module('ngQuantum.pageable.pagination', [])
.directive('nqPagination', ['$timeout', function ($timeout) {
    return {
        require: '^nqPageable',
        restrict: 'EA',
        templateUrl: function (element, attr) {
            if (angular.isDefined(attr.noTemplate))
                return false;
            if (angular.isDefined(attr.templateUrl))
                return attr.templateUrl;
            return 'pageable/pagination.tpl.html'
        },
        scope: true,
        link: function postLink(scope, element, attr, controller) {
            var locale = scope.$locale = scope.$locale || {}, copt = controller.$options;
            scope.pages = [];
            angular.forEach(['firstText', 'lastText', 'previousText', 'nextText'],
                function (key) {
                    if (angular.isDefined(attr[key])) {
                        scope.$locale[key] = attr[key];
                    }
                    else if (angular.isDefined(copt[key])) {
                        scope.$locale[key] = copt[key];
                    }
                });
            angular.forEach(['firstLast', 'prevNext', 'cssClass'],
                function (key) {
                    if (angular.isDefined(attr[key])) {
                        scope['$' + key] = attr[key];
                    }
                    else if (angular.isDefined(copt[key])) {
                        scope['$' + key] = copt[key];
                    }
                });
           
            var pageNumbers = attr.pageNumbers || copt.pageNumbers || 3;
            var theme = attr.theme || copt.theme;
            if (theme) {
                element.addClass('pagination-' + theme)
            }
            var size =  attr.sizeClass || copt.sizeClass;
            if (size) {
                element.addClass('pagination-' + size)
            }
            scope.$on('$refreshPager', function () {
                $timeout(function () {
                    scope.$pagerWarning = controller.$scope.$pagerWarning;
                    scope.$currentPage = controller.$scope.$currentPage;
                    scope.$totalResult = controller.$scope.$totalResult;
                    scope.$pageSize = controller.$scope.$pageSize;
                    var newPages = controller.splicePages(pageNumbers, scope.pages);
                    scope.pages = newPages;
                    scope.$totalPages = controller.$scope.$totalPages;
                }, 0);
            });
            scope.$$postDigest(function () {
                scope.$first = controller.$scope.$first
                scope.$last = controller.$scope.$last
                scope.$prev = controller.$scope.$prev
                scope.$next = controller.$scope.$next
                scope.$gotoPage = controller.$scope.$gotoPage
            });

        }
    };
}])