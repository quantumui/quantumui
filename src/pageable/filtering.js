'use strict';
angular.module('ngQuantum.pageable.filtering', [])
.directive('nqFilterField', [function () {
    return {
        restrict: 'A',
        scope:true,
        require: ['^nqPageable', '?ngModel'],
        link: function (scope, element, attr, controllers) {
            scope.$active = false;
            var field = attr.nqFilterField,
                comperator = attr.comperator,
                controller = controllers[0],
                ngModel = controllers[1];
            if (!angular.isDefined(attr.ngModel)) {
                element.on('click', function () {
                    scope.$apply(function () {
                        scope.$active = !scope.$active;
                        if (scope.$active)
                            controller.setFilterKey(field, attr.filterValue);
                        else
                            controller.removeFilterKey(field, attr.filterValue);
                        controller.filterTable();

                    })
                    
                })
            }

        }
    };
}])
.directive('nqRemoveFilterField', [function () {
    return {
        restrict: 'A',
        scope: true,
        require: ['^nqPageable'],
        link: function (scope, element, attr, controllers) {
            scope.$active = false;
            var field = attr.nqFilterField,
                comperator = attr.comperator,
                controller = controllers[0],
                ngModel = controllers[1];
            if (!angular.isDefined(attr.ngModel)) {
                element.on('click', function () {
                    scope.$apply(function () {
                        scope.$active = !scope.$active;
                        if (scope.$active) {
                            element.addClass('active')
                        }

                        else {
                            element.removeClass('active');
                        }
                        controller.filterTable();

                    })

                })
            }


        }
    };
}])