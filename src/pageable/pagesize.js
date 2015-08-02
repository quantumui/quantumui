
'use strict';
angular.module('ngQuantum.pageable.pagesize', ['ngQuantum.services.templateHelper', 'ngQuantum.services.helpers'])
.directive('nqPagingSizes', ['$helpers', '$parse', function ($helpers, $parse) {
    return {
        restrict: 'A',
        require: '^nqPageable',
        templateUrl: function (element, attr) {
            if (angular.isDefined(attr.noTemplate))
                return false;
            if (angular.isDefined(attr.templateUrl))
                return attr.templateUrl;
            return attr.nqPagingSizes == 'buttons' ? 'pageable/pagesize.buttongroup.tpl.html' : 'pageable/pagesize.select.tpl.html';
        },
        link: function postLink(scope, element, attr, controller) {
            var type = attr.nqPagingSizes || 'select';

            var sizeOptions = angular.isDefined(attr.sizeOptions) ? $helpers.parseConstant(attr.sizeOptions) : controller.$options.sizeOptions;
            if (!angular.isArray(sizeOptions))
                sizeOptions = controller.$options.sizeOptions;
            scope.sizeOptions = sizeOptions;
            if (type !== 'buttons')
                scope.$selectClasses = 'btn-sm btn-default';
            else {
                scope.$buttonClasses = 'btn-default';
                scope.$buttonGroupClasses = 'btn-group-sm'
            }
            scope.$locale = scope.$locale || {};
            scope.$locale.sizesText = ($helpers.parseConstant(attr.sizesText) !== false) && (attr.sizesText || controller.$options.sizesText || false);
            angular.forEach(['selectClasses', 'buttonGroupClasses', 'buttonClasses'], function (val, key) {
                if (angular.isDefined(attr[val]))
                    attr.$observe(val, function (newVal) {
                        newVal && (scope['$' + val] = newVal)
                    })
            })
            var onSizeChange = attr.onSizeChange ? $parse(attr.onSizeChange) : false;
            if (onSizeChange)
                scope.$watch('$pageSize', function (newVal) {
                    onSizeChange(scope, { $pageSize: newVal })
                })
        }
    };
}])