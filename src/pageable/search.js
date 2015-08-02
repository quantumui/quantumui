'use strict';
angular.module('ngQuantum.pageable.search', [])
.directive('nqTableSearch', [function () {
    return {
        restrict: 'A',
        require: '^nqPageable',
        scope: true,
        templateUrl: function (element, attr) {
            if (angular.isDefined(attr.noTemplate))
                return false;
            if (angular.isDefined(attr.templateUrl))
                return attr.templateUrl;
            return 'pageable/tablesearch.tpl.html'
        },
        link: function (scope, element, attr, controller) {
            element.addClass('page-searching');
            scope.$inputGroupClasses = 'input-group-sm input-group-rounded';
            scope.$searchButtonClasses = 'btn-default';
            angular.forEach(['formClasses', 'inputGroupClasses', 'formControlClasses', 'searchButtonClasses'], function (val, key) {
                    attr[val] &&  attr.$observe(val, function (newVal) {
                        newVal && (scope['$' + val] = newVal)
                    })
            })
            scope.$searchPlaceholder = attr.searchPlaceholder || 'search...';
            var fileds = [];
            if (attr.searchFields) {
                fileds = attr.searchFields.split(',')
            }
            if (attr.autoSearch && (attr.autoSearch == true) || (attr.autoSearch == 'true')) {
                scope.$watch('searchTerm', function (newValue, oldValue) {
                    newValue && scope.$searchTable(); !newValue && oldValue && scope.$clearSearch();
                })
            }
            scope.$clearSearch = function () {
                scope.searchTerm = '';
                controller.refresh();
            }
            scope.$searchTable = function (value) {
                if (scope.searchTerm && (fileds.length || controller.$options.remotePaging)) {
                    controller.searchTable(fileds, scope.searchTerm);
                }
            }


        }
    };
}])
