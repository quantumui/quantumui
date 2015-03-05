'use strict';
angular.module('ngQuantum.popover', ['ngQuantum.popMaster'])
    .run(['$templateCache', function ($templateCache) {
        'use strict';
        $templateCache.put('popover/popover.tpl.html',
          "<div class=\"popover\"><h3 class=\"popover-title\" ng-bind=\"title\" ng-show=\"title\"></h3><div class=\"popover-content\" ng-bind-html=\"content\"></div></div>"
        );

    }])
        .provider('$popover', function () {
            var defaults = this.defaults = {
                effect: 'flip-y',
                placement: 'right',
                template: 'popover/popover.tpl.html',
                contentTemplate: false,
                trigger: 'click',
                keyboard: true,
                html: false,
                title: '',
                content: '',
                clearExists: false,
                delay: 0,
                showArrow: true,
                container: 'body',
                directive: 'nqPopover',
                instanceName: 'popover',
                typeClass: 'popover',
                prefixEvent: 'popover',
                displayReflow: false,
                theme: false
            };
            this.$get = [
              '$popMaster', '$sce', '$helpers',
              function ($popMaster, $sce, $helpers) {
                  function PopoverFactory(element, config, attr) {

                      config = $helpers.parseOptions(attr, config)
                      var options = angular.extend({}, defaults, config);

                      if (!options.independent && !options.useTemplate) {
                          var target;
                          if (options.target)
                              target = angular.element(options.target);
                          else {
                              target = angular.element(element.find('.popover')[0]);
                              if (target.length < 1)
                                  target = angular.element(element.next('.popover')[0]);
                          }
                          if (target.length > 0)
                              options.targetElement = target
                      }
                      
                      var $popover = new $popMaster(element, options, attr);
                      var scope = $popover.$scope
                      options = $popover.$options = $helpers.observeOptions(attr, $popover.$options);

                      if (options.content) {
                          $popover.$scope.content = options.content;
                      }
                      if (attr) {
                          angular.forEach(['title', 'content'], function (key) {
                              var akey = 'qs' + key.capitaliseFirstLetter();
                              attr[akey] && (scope[key] = $sce.trustAsHtml(attr[akey]));
                              attr.$$observers && attr.$$observers[akey] && attr.$observe(akey, function (newValue, oldValue) {
                                  scope[key] = $sce.trustAsHtml(newValue);
                              });
                          });
                          if (attr && angular.isDefined(options.directive)) {
                              attr[options.directive] && scope.$watch(attr[options.directive], function (newValue, oldValue) {
                                  if (angular.isObject(newValue)) {
                                      angular.extend(scope, newValue);
                                  } else {
                                      scope.content = newValue;
                                  }
                              }, true);
                          }
                      }
                      scope.$on('$destroy', function () {
                          $popover.destroy();
                          $popover = null;
                      });
                      return $popover;
                  }
                  return PopoverFactory;
              }
            ];
        }).directive('nqPopover', ['$popover',
      function ($popover) {
          return {
              restrict: 'EAC',
              scope:true,
              link: function postLink(scope, element, attr) {
                  var options = {
                      $scope: scope
                  };

                  options.uniqueId = attr.qoUniqueId || attr.id || options.$scope.$id;
                  if (attr.qoTrigger && attr.qoTrigger.indexOf('hover') > -1) {
                      options.holdHoverDelta = true;
                      options.delayHide = 100;
                      options.delayShow = 10;
                  }

                  if (angular.isDefined(attr.qsTitle) || angular.isDefined(attr.qsContent) || attr.nqPopover
                      || angular.isDefined(attr.qoTemplate) || angular.isDefined(attr.qoContentTemplate))
                      options.useTemplate = true;
                  var popover = {};
                  if (angular.isDefined(attr.qoIndependent)) {
                      options.independent = true;
                      options.html = true;
                      options.useTemplate = false;
                      options.targetElement = element;
                      popover = $popover(null, options, attr);

                  }
                  else
                      popover = $popover(element, options, attr);
                  scope.$on('$destroy', function () {
                      popover = null;
                  })
                  element.data('$nqPopover', popover)
              }
          };
      }
        ]);
