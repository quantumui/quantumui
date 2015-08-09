'use strict';
angular.module('ngQuantum.pageable.pager')
.run(['$templateCache','$interpolate', function ($templateCache,$interpolate) {
    var START = $interpolate.startSymbol();
    var END   = $interpolate.endSymbol();
    $templateCache.put('pageable/pager.tpl.html',
        '<ul class="pager">'
            + '<li ng-class="{disabled:$currentPage < 2, previous:$aligned}" class="page-button previous"><a role="button" tabindex="0" ng-click="$prev()"><i class="fic fu-angle-l"></i> ' + START + '$locale.previousText' + END+ '</a></li>'
            + '<li ng-class="{disabled:$totalPages == $currentPage, previous:$aligned}" class="page-button next"><a role="button" tabindex="0" ng-click="$next()">' + START + '$locale.nextText' + END+ ' <i class="fic fu-angle-r"></i> </a></li>'
        + '</ul>'
        + '<div ng-show="$pagerWarning"><span class="label label-warning"></span><span ng-bind="$pagerWarning"></span></div>'
    );
}])
