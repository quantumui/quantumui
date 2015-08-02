'use strict';
angular.module('ngQuantum.pageable.zeroresult', [])
.directive('nqZeroResult', [function () {
    return {
        restrict: 'A',
        templateUrl: function (element, attr) {
            if (angular.isDefined(attr.noTemplate))
                return false;
            if (angular.isDefined(attr.templateUrl))
                return attr.templateUrl;
            return 'pageable/zeroresult.tpl.html'
        },
        require: '^nqPageable',
        link: function (scope, element, attr, controller) {
            element.addClass("pageable-zero-result");
            angular.forEach(['zeroTitle', 'zeroDescription'], function (val, key) {
                attr[val] && attr.$observe(val, function (newVal) {
                    newVal && (scope['$' + val] = newVal)
                })
            })
            scope.$watch('totalResult', function (newVal, oldVal) {
                if (newVal) {
                    element.removeClass('visible')
                    controller.tableElement && controller.tableElement.show();
                    controller.$container && controller.$container.removeClass('no-result-found')
                } else {
                    controller.tableElement && controller.tableElement.hide();
                    controller.$container && controller.$container.addClass('no-result-found')
                    element.addClass('visible')
                }
            })

        }
    };
}])