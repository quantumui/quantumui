+function(){'use strict';
angular.module('ngQuantum.alert', ['ngQuantum.popMaster', 'ngQuantum.services.helpers'])
    .run(['$templateCache', function ($templateCache) {
        'use strict';
        $templateCache.put('alert/alert.tpl.html',
          "<div class=\"alert alert-dismissable\" tabindex=\"-1\" ng-class=\"alertType\"><div class=\"alert-inner\"><div class=\"alert-bg\" ng-class=\"alertType\"></div><a role=\"button\" tabindex=\"0\" class=\"close\" ng-click=\"$hide()\"><i ng-class=\"$closeIcon\"></i></a> <strong class=\"alert-title\" ng-if=\"title\" ng-bind=\"title\"></strong><span  ng-if=\"title\" ng-bind-html=\"content\"></span><div ng-if=\"!title\" ng-bind-html=\"content\"></div></div></div>"
        );

    }])
    .provider('$alert', function () {
        var defaults = this.defaults = {
            effect: 'fade-in',
            typeClass: 'alert',
            prefixEvent: 'alert',
            placement: 'top-right',
            fireEmit: true,
            template: 'alert/alert.tpl.html',
            container: false,
            directive: 'nqAlert',
            instanceName: 'alert',
            backdrop: false, //NOT USED
            displayReflow: true,
            clearExists: false,
            keyboard: true,
            trigger:'click',
            show: true,
            html:true,
            independent: true,
            preventReplace: true,
            alertType: 'info',
            duration: 3000,
            autoDestroy: false,
            onHide: false,
            closeIcon: 'fic fu-cross'
        };
        this.$get = ['$timeout', '$rootScope', '$popMaster', '$compile', '$helpers', '$sce', '$parse',
          function ($timeout, $rootScope, $popMaster, $compile, $helpers, $sce, $parse) {
              function AlertFactory(config, title, alertType, placement) {
                  var $alert = {}, attr;
                  if (angular.isString(config)) {
                      config = {
                          content: config,
                          title: title,
                          alertType: alertType || defaults.alertType,
                          placement: placement || defaults.placement
                      }
                  }
                  if (!config.$scope) {
                      config.autoDestroy = true;
                  }
                  angular.isObject(title) && (attr = title)
                  attr && (config = $helpers.parseOptions(attr, config))
                  var options = angular.extend({}, defaults, config);
                  if (options.containerSelf)
                      options.container = options.containerSelf;
                  var container
                  if (!options.container)
                      getContainer();
                  $alert = $popMaster(null, options);
                  var scope = $alert.$scope;
                  if (attr)
                      options = $alert.$options = $helpers.observeOptions(attr, $alert.$options);
                  else {
                      options.content && (scope.content = options.content)
                      options.title && (scope.title = options.title)

                  }
                  if (attr && attr.onHide)
                      options.onHide = $parse(attr.onHide);
                  var show = $alert.show;
                  $alert.show = function () {
                      scope.$closeIcon = options.closeIcon;
                      options.alertType && (scope.alertType = 'alert-' + options.alertType)
                      container && container.show()
                      var promise = show();
                      $compile($alert.$target)(scope);
                      if (options.duration)
                          $timeout(function () {
                              $alert &&  $alert.hide();
                          }, $helpers.ensureNumber(options.duration, 3000));
                      return promise;
                  };
                  var hide = $alert.hide;
                  $alert.hide = function () {
                      var promise = hide();
                      promise && promise.then(function () {
                          options.onHide && options.onHide(scope);
                          if (container) {
                              var chlids = container.children();
                              if (!chlids || chlids.length < 1) {
                                  container.hide();
                              }
                          }
                          options.autoDestroy && $alert && $alert.destroy();
                      })
                      return promise;
                  };
                  function getContainer() {
                      var placement = '';
                      options.placement && (placement = '.' + options.placement)
                      container = angular.element('body').find('.alert-container' + placement);
                      if (!container || container.length < 1) {
                          container = angular.element('<div class="alert-container ' + options.placement + '"></div>');
                          container.prependTo('body')
                      }
                      options.container = container;
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
                          attr[options.directive] && options.$scope.$watch(attr[options.directive], function (newValue, oldValue) {
                              if (angular.isObject(newValue)) {
                                  angular.extend(scope, newValue);
                              } else {
                                  scope.content = newValue;
                              }
                          }, true);
                      }
                  }
                  scope.$on('$destroy', function () {
                      $alert && !$alert.isDestroyed && $alert.destroy();
                      $alert = null;
                  });
                  return $alert;
              }
              return AlertFactory;
          }
        ];
    })
    .directive("nqAlert", ['$alert',
        function ($alert) {
            return {
                restrict: 'EAC',
                scope: true,
                link: function postLink(scope, element, attr, transclusion) {
                    var firstLoad;
                    var options = {
                        $scope: scope
                    };
                    options.uniqueId = attr.qoUniqueId || attr.id || options.$scope.$id;
                    !angular.isDefined(attr.qsContent) && (scope.content = element.html(), element.html(''))
                    if (angular.isDefined(attr.qoContainer) && attr.qoContainer == 'self') {
                        options.containerSelf = element;
                    }
                    !attr.qoShow && (options.show = false);

                    var alert = $alert(options, attr);
                    if (angular.isDefined(attr.qsShowOn)) {
                        scope.$watch(attr.qsShowOn, function (value) {
                            (firstLoad || value) && alert.toggle();
                            firstLoad = true;
                        })
                    }
                    if (!angular.isDefined(attr.qoContainer) || !attr.qoContainer == 'self') {
                        element.on('click', function () {
                            alert.toggle();
                        })
                    }

                }
            };
        }]);
 }();