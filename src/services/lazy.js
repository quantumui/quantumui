'use strict';
angular.module('ngQuantum.services.lazy', [])
.provider('$lazyRequest', function () {
    var timeout = this.timeout = 2000;
    this.$get = ['$timeout', '$rootScope', '$http',
      function ($timeout, $rootScope, $http) {
          function Factory(fn, time) {
              time = time || 0;
              if (!$rootScope.$$phase) {
                  $rootScope.$apply(function () {
                      $rootScope.$pendingRequestCount = $rootScope.$pendingRequestCount || 0;
                      $rootScope.$pendingRequestCount++;
                  })
              }
              else {
                  $rootScope.$pendingRequestCount = $rootScope.$pendingRequestCount || 0;
                  $rootScope.$pendingRequestCount++;
              }
              return $timeout(function () {
                  var promise = fn();
                  if (promise && angular.isDefined(promise.then))
                      promise.then(function () {
                          $rootScope.$pendingRequestCount > 0 && $rootScope.$pendingRequestCount--;
                      })
                  return promise;
              }, time);
          }

          return Factory;
      }
    ];
});