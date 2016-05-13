'use strict';
angular.module('ngQuantum.services.templateHelper', []).factory('templateHelper', [
      '$http',
      '$q',
      '$templateCache',
      '$timeout',
      function ($http, $q, $templateCache, $timeout) {
          var fn = {};
          fn.fetchTemplate = function (template) {
              return $q.when($templateCache.get(template) || $http.get(template)).then(function (res) {
                  if (angular.isObject(res)) {
                      return res.data;
                  }
                  return res;
              });
          }
          fn.fetchContentTemplate = function ($object) {
              return $object.$promise.then(function (template) {
                  var tm = angular.element(template);
                  var tel = tm.find('[ng-bind="content"], [ng-bind-html="content"]');
                  var ct = $object.$options.contentTemplate;
                  if ((angular.isString(ct) && ct.indexOf('.html') > -1)) {
                      return fn.fetchTemplate($object.$options.contentTemplate).then(function (contentTemplate) {
                          if (tel.length) {
                              tel.removeAttr('ng-bind').removeAttr('ng-bind-html').html(contentTemplate)
                              return tm;
                          }
                          else
                              return contentTemplate
                      });
                  }
                  return template;

              });
          }
          fn.fetchContent = function ($object) {
              return $q.when($object).then(function (template) {
                  return template;
              });
          }
          return fn;
      }
    ]);