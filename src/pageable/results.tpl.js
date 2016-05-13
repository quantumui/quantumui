'use strict';
angular.module('ngQuantum.pageable.results')
.run(['$templateCache', function ($templateCache) {
    $templateCache.put('pageable/pageableResults.tpl.html',
    '<div class="pageable-results">'
        +'<p>'
            + '<small ng-bind="$locale.currentPageText"></small> : <strong class="current-page" ng-bind="$currentPage"></strong>'
            + '<small ng-bind="$locale.totalPageText"></small> :  <strong class="total-page" ng-bind="$totalPages"></strong>'
        +'</p>'
        + '<small ng-bind="$locale.totalResultText"></small> :  <strong class="total-result" ng-bind="totalResult"></strong>'
    + '</div>'
   );
}])