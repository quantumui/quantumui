'use strict';
angular.module('ngQuantum.pageable.pagination')
.run(['$templateCache', function ($templateCache) {
    $templateCache.put('pageable/pagination.tpl.html',
        '<ul class="pagination" ng-class="$cssClass" ng-show="$totalPages > 1">'
            + '<li ng-if="$firstLast" ng-class="{disabled:$currentPage < 2}" class="page-button first"><a role="button" tabindex="0" ng-click="$first()" class="titip-top" data-title="{{$locale.firstText}}"><i class="fic fu-arrow-left"></i></a></li>'
            + '<li ng-if="$prevNext" ng-class="{disabled:$currentPage < 2}" class="page-button previous"><a role="button" tabindex="0" ng-click="$prev()" class="titip-top" data-title="{{$locale.previousText}}"><i class="fic fu-angle-l"></i></a></li>'
            + '<li class="page-number" ng-class="{active:page == $currentPage, lastActive: $totalPages == $currentPage}" ng-repeat="page in pages"><a role="button" tabindex="0" ng-click="$gotoPage(page)">{{page}}</a></li>'
            + '<li ng-if="$prevNext"  ng-class="{disabled:$totalPages == $currentPage}" class="page-button next"><a role="button" tabindex="0" ng-click="$next()"  class="titip-top" data-title="{{$locale.nextText}}"><i class="fic fu-angle-r"></i></a></li>'
            + '<li ng-if="$firstLast" ng-class="{disabled:$totalPages == $currentPage}" class="page-button last"><a role="button" tabindex="0" class="titip-top" data-title="{{$locale.lastText}}" ng-click="$last()"><i class="fic fu-arrow-right"></i></a></li>'
        + '</ul>'
        + '<div ng-show="$pagerWarning"><span class="label label-warning"></span><span ng-bind="$pagerWarning"></span></div>'
    );
}])
