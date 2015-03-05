'use strict';
angular.module('ngQuantum.loading', ['ngQuantum.services.lazy'])
    .run(['$http', '$rootScope', '$timeout', function ($http, $rootScope, $timeout) {
        $rootScope.$watch(function () { return $http.pendingRequests.length }, function (newVal, oldVal) {
            $rootScope.$pendingRequestCount = $rootScope.$pendingRequestCount || 0;
            $timeout(function() {
                $rootScope.$pendingRequestCount = $rootScope.$pendingRequestCount + (newVal-oldVal);
            },0)
        })
        
    }])
    .provider('$loading', function () {
        var defaults = this.defaults = {
            placement: 'top',
            container: 'body',
            backdrop: false,
            timeout: 2000,
            delayHide: 500,
            theme: false,
            showBar: true,
            showSpinner: true,
            spinnerIcon: '<i class="fic spin-icon fu-spinner-fan spin"></i>',
            busyText: 'Loading...'
        };
        this.$get = ['$timeout', '$rootScope', '$compile', '$http',
          function ($timeout, $rootScope, $compile, $http) {
              function LoadingFactory(config, theme, placement) {
                  var $loading = {};
                  if (angular.isString(config)) {
                      config = {
                          busyText: config,
                          theme: theme,
                          placement: placement
                      }
                  }
                  var options = $loading.$options = angular.extend({}, defaults, config);
                  var container = angular.isElement(options.container) ? options.container : angular.element(options.container)
                  if (!container.length)
                      container = angular.element('body');
                  var scope = $loading.$scope = options.$scope || $rootScope.$new(), cancel;

                  var template = angular.element(getTemplate());
                  var place = options.container == 'body' ? 'prepend' : 'append';
                  $compile(template)(scope);
                  $timeout(function () {
                      container[place](template);
                  }, 0)
                  
                  scope.busyText = options.busyText;
                  if (options.theme) {
                      scope.loadingTheme = 'loading-' + options.theme;
                      scope.progressTheme = 'progress-bar-' + options.theme;
                  }
                  scope.showBar = options.showBar;
                  scope.showSpinner = options.showSpinner;
                  scope.currentRate = 0;
                  if (options.placement)
                      template.addClass('loading-' + options.placement)
                  $loading.show = function () {
                      template.css('display', 'block')
                      $loading.isShown = true;
                      if (options.showBar)
                          $timeout(function () {
                              scope.currentRate = 0;
                              $loading.updateProgress();
                          }, 0)
                          
                      options.timeout !== false &&
                      $timeout(function () {
                          $loading.hide();
                      }, options.timeout)
                  };
                  $loading.hide = function () {
                      if (!$loading.isShown)
                          return;
                      scope.currentRate = 100;
                      $timeout(function () {
                          template.css('display', 'none')
                          scope.currentRate = 0;
                          $loading.isShown = false;
                      }, options.delayHide)

                  };
                  $loading.updateProgress = function (rate) {
                      if (!$loading.isShown || $http.$pendingRequestCount > 0)
                          return;
                      if (rate)
                          scope.currentRate = rate;
                      else {
                          if (scope.currentRate < 100)
                              scope.currentRate = scope.currentRate + (scope.currentRate < 80 ? 5 : (parseInt(100 - scope.currentRate) / 2));
                       $timeout(function () {
                              if (scope.currentRate < 99)
                                  $loading.updateProgress();
                          }, 20)
                      }
                  };
                  scope.$on('$destroy', function () {
                      $loading = null;
                  });
                  $rootScope.$watch('$pendingRequestCount', function (newVal, oldVal) {
                      if (newVal <= 0) {
                          $http.$pendingRequestCount = 0;
                          $timeout(function () {
                              $loading.hide();
                          }, 10)
                      }
                      else {
                      }

                  })
                  function getTemplate() {
                      var html = '<div class="loading-container"  ng-class="loadingTheme">'
                                    + '<div class="progress" ng-show="showBar">'
                                    + '<div class="progress-bar active" ng-class="progressTheme" role="progressbar" ng-style="{\'width\':currentRate + \'%\'}" aria-valuenow="{{currentRate}}" aria-valuemin="0" aria-valuemax="100">'
                                    + '</div>'
                                    + '</div>'
                                    + '<div class="spinner-container">'
                                        + '<div class="busy-text">'+ options.spinnerIcon +' {{busyText}}</div>'
                                    + '</div>'
                                + '</div>'
                                + ''
                                + '';
                      return html;
                  }
                  return $loading;
              }
              return LoadingFactory;
          }
        ];
    })