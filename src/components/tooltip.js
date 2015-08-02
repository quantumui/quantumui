'use strict';
angular.module('ngQuantum.tooltip', ['ngQuantum.popMaster'])
    .run(['$templateCache', function ($templateCache) {
        'use strict';

        $templateCache.put('tooltip/tooltip.tpl.html',
          "<div class=\"tooltip in\" ng-show=\"title\"><div class=\"tooltip-arrow\"></div><div class=\"tooltip-inner\" ng-bind=\"title\"></div></div>"
        );

    }])
    .provider('$tooltip', function () {
        this.$get = [
          '$sce',
          '$rootScope',
          '$popMaster', '$helpers',
          function ($sce, $rootScope, $popMaster, $helpers) {
              var defaults = this.defaults = {
                  title: false,
                  template: 'tooltip/tooltip.tpl.html',
                  directive: 'nqTooltip',
                  typeClass: 'tooltip',
                  prefixEvent: 'tooltip',
                  container: 'body',
                  displayReflow: true,
                  autoDestroy: false,
                  forceHide: true,
                  clearExists: false,
              }
              function TooltipFactory(element, config, attr) {
                  var $tooltip = {};
                  config = $helpers.parseOptions(attr, config);
                  var options = config = angular.extend({}, defaults, config);

                  $tooltip = new $popMaster(element, options);
                  var scope = $tooltip.$scope
                  options = $tooltip.$options = $helpers.observeOptions(attr, $tooltip.$options);
                  if (options.title) {
                      scope.title = options.title;
                  }

                  if (attr) {
                      attr.qsTitle && (scope.title = attr.qsTitle);
                      attr.$$observers && attr.$$observers.qsTitle && attr.$observe('qsTitle', function (newValue, oldValue) {
                          scope.title = newValue;
                          angular.isDefined(oldValue) && $tooltip.$applyPlacement();
                      });
                  }
                  scope.$on('$destroy', function () {
                      $tooltip && $tooltip.destroy();
                      $tooltip = null;
                  });
                  return $tooltip;
              }
              return TooltipFactory;
          }
        ];
    })
    .directive('nqTooltip', [
      '$tooltip',
      function ($tooltip) {
          return {
              restrict: 'EAC',
              link: function postLink(scope, element, attr, transclusion) {
                  var options = {
                      $scope: scope.$new()
                  };
                  if (element[0].tagName.toLowerCase() == 'input')
                      options.isInput = true;
                  var tooltip = $tooltip(element, options, attr);
                  scope.$on('$destroy', function () {
                      options.$scope.$destroy();
                  })
              }
          };
      }
    ]);
