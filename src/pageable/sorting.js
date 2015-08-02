'use strict';
angular.module('ngQuantum.pageable.sorting', [])
.directive('nqColumnSort', [function () {
    return {
        restrict: 'A',
        require: '^nqPageable',
        link: function (scope, element, attr, controller) {
            var direction = attr.direction || 'asc';
            var field = attr.nqColumnSort, toggle = false, template;

            if (field) {
                if (angular.isDefined(attr.useTemplate)) {
                    element.css('position', 'relative')
                    template = angular.element('<span class="column-sorting"><span class="asc-icon"></span><span class="desc-icon"></span></span>');
                    element.append(template)
                    toggle = true;
                }
                element.on('click', function () {
                    scope.$apply(function () {
                        controller.sortTable(field, direction)
                    })
                    if (toggle) {
                        var dirClass = "sort-" + direction;
                        direction = direction == 'asc' ? 'desc' : 'asc';
                        if (controller.$options.sortingMode !== 'multiple') {
                            var cont = element.closest('.pageable-container');
                            angular.element(cont.find('.sort-asc')).removeClass('sort-asc');
                            angular.element(cont.find('.sort-desc')).removeClass('sort-desc');
                            
                        }
                        else {
                            element.removeClass("sort-" + direction)
                        }
                        element.addClass(dirClass)
                       
                    }
                })
            }


        }
    };
}])