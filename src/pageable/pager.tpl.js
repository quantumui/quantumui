'use strict';
angular.module('ngQuantum.pageable.pager')
.run(['$templateCache', function ($templateCache) {
    $templateCache.put('pageable/pager.tpl.html',
        '<ul class="pager">'
            + '<li ng-class="{disabled:$currentPage < 2, previous:$aligned}" class="page-button previous"><a role="button" tabindex="0" ng-click="$prev()"><i class="fic fu-angle-l"></i> {{$locale.previousText}}</a></li>'
            + '<li ng-class="{disabled:$totalPages == $currentPage, previous:$aligned}" class="page-button next"><a role="button" tabindex="0" ng-click="$next()">{{$locale.nextText}} <i class="fic fu-angle-r"></i> </a></li>'
        + '</ul>'
        + '<div ng-show="$pagerWarning"><span class="label label-warning"></span><span ng-bind="$pagerWarning"></span></div>'
    );
}])
