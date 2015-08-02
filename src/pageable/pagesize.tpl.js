'use strict';
angular.module('ngQuantum.pageable.pagesize')
.run(['$templateCache', function ($templateCache) {
    $templateCache.put('pageable/pagesize.select.tpl.html',
        '<div class="page-size-container">'
           + '<small class="size-text" ng-bind="$locale.sizesText"></small>'
           + '<button type="button" ng-model="$pageSize" nq-select="" ng-change="$parent.$pageSize = $pageSize" data-qo-filterable="false" data-qo-html="false" ng-options="item for item in sizeOptions"'
                      + ' data-ng-bind="$locale.sizesText" data-qo-placeholder="size..." data-qo-disable-clear="true" class="btn page-size-select" ng-class="$selectClasses">'
           + '</button>'
        + '<div>'
    );
    $templateCache.put('pageable/pagesize.buttongroup.tpl.html',
        '<div class="page-size-container">'
           + '<small class="size-text" ng-bind="$locale.sizesText"></small>'
           + '<div ng-model="$parent.$pageSize" nq-radio-group=""  class="btn-group btn-group-page-size" ng-class="$buttonGroupClasses">'
               + '<label ng-repeat="item in sizeOptions" class="btn"  ng-class="$buttonClasses"><input name="pageSizeValue" type="radio" ng-value="item"/><span ng-bind="item"></span></label>'
           +'</div>'
        + '<div>'
    );
}])