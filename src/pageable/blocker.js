'use strict';
angular.module('ngQuantum.pageable.blocker', [])
.run(['$templateCache', function ($templateCache) {
    'use strict';
    $templateCache.put('pageable/blocker.tpl.html',
             '<div class="pageable-spinner"></div>'
    );
}])
.directive('nqPageableBlocker', ['$timeout', function ($timeout) {
    return {
        restrict: 'A',
        templateUrl: function (element, attr) {
            if (angular.isDefined(attr.noTemplate))
                return false;
            if (angular.isDefined(attr.templateUrl))
                return attr.templateUrl;
            return 'pageable/blocker.tpl.html'
        },
        require: '^nqPageable',
        link: function (scope, element, attr, controller) {
            var timeout = attr.timeout && parseInt(attr.timeout) || 100;
            element.addClass("pageable-blocker");
            scope.$watch('$pageableBusy', function (newVal, oldVal) {
                if (newVal) {
                    element.show();
                }
                else $timeout(function () {
                    element.hide();
                }, timeout)

            })

        }
    };
}]);