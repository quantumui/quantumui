'use strict';
angular.module('ngQuantum.pageable.editing')
.run(['$templateCache', function ($templateCache) {
    'use strict';
    $templateCache.put('pageable/editing.panel.tpl.html',
             '<div class="panel pageable-edit-panel panel-stretch" ng-class="$panelClasses">'
               + '<div class="panel-heading">'
                    +'<h2 class="panel-title" ng-bind-html="panelTitle || defaultTitle"></h2>'
               +'</div>'
               + '<div class="panel-body pageable-template-transclude">'
               +'</div>'
               + '<div class="panel-footer clearfix">'
                   + '<div class="pull-left">'
                        + '<button class="btn btn-danger" type="button" ng-click="$back()">Back</button>'
                        + '<button class="btn btn-warning" type="button" ng-click="$cancel()"  ng-if="templateType != \'detail\'">Cancel</button>'
                   + '</div>'
                   + '<div class="pull-right" ng-if="templateType != \'detail\'">'
                        + '<button class="btn btn-primary" type="button" ng-click="$submit($event)">Save</button>'
                   + '</div>'
               +'</div>'
           + '</div>'
    );
}])
