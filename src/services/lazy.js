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
})
//.service('lazyLoad', ['$document', '$q', '$timeout', function ($document, $q, $timeout){
//    var document = $document[0];
//    function loader(createElement) {
//        var promises = {};
//        return function(url) {
//            if (typeof promises[url] === 'undefined') {
//                var deferred = $q.defer();
//                var element = createElement(url);
//                element.onload = element.onreadystatechange = function (e) {
//                    if (element.readyState && element.readyState !== 'complete' && element.readyState !== 'loaded') {
//                        return;
//                    }
//                    deferred.resolve(e);
//                };
//                element.onerror = function (e) {
//                    deferred.reject(e);
//                };
//                promises[url] = deferred.promise;
//                return deferred.promise;
//            }
//            return promises[url];
//        };
//    }
//    this.loadScript = loader(function (src) {
//        var script = document.createElement('script');
//        script.src = src;
//        document.body.appendChild(script);
//        return script;
//    });
//    this.loadCSS = loader(function (href) {
//        var style = document.createElement('link');
//        style.rel = 'stylesheet';
//        style.type = 'text/css';
//        style.href = href;
//        document.head.appendChild(style);
//        return style;
//    });

//}]);