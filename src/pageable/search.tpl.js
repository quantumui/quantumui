'use strict';
angular.module('ngQuantum.pageable.search')
.run(['$templateCache','$interpolate', function ($templateCache,$interpolate) {
    var START = $interpolate.startSymbol();
    var END   = $interpolate.endSymbol();
    $templateCache.put('pageable/tablesearch.tpl.html',
        '<form name="tableSearchForm" class="pageable-search-form" ng-class="$formClasses" ng-submit="$searchTable(searchTerm)">'
            + '<div class="input-group" ng-class="$inputGroupClasses">'
                + '<div class="form-control" ng-class="$formControlClasses">'
                    + '<input type="text" ng-model="searchTerm"  class="pageable-search-input" placeholder="" + START + "$searchPlaceholder || \'search\'' + END+ '">'
                    + '<span  ng-show="searchTerm"  class="titip-top clear-icon" data-title="Clear filter" ng-click="$clearSearch()"><i class="fic fu-backspace"></i></span>'
                + '</div>'
                + '<span class="input-group-btn">'
                    + '<button class="btn" ng-class="$searchButtonClasses" type="submit"><span class="fic fu-search"></span></button>'
                + '</span>'
            + '</div>'
        + '</form>'
    );
}])