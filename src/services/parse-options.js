'use strict';
angular.module('ngQuantum.services.parseOptions', [])
        .provider('$parseOptions', function () {
            var defaults = this.defaults = { regexp: /^\s*(.*?)(?:\s+as\s+(.*?))?(?:\s+group\s+by\s+(.*))?\s+for\s+(?:([\$\w][\$\w]*)|(?:\(\s*([\$\w][\$\w]*)\s*,\s*([\$\w][\$\w]*)\s*\)))\s+in\s+(.*?)(?:\s+track\s+by\s+(.*?))?$/ };
            this.$get = [
              '$parse',
              '$q',
              function ($parse, $q) {
                  function ParseOptionsFactory(attr, $element) {
                      var $parseOptions = {};
                      var options = angular.extend({}, defaults);
                      $parseOptions.$values = [];
                      var match, displayFn, valueName, keyName, groupByFn, valueFn, valuesFn;
                      $parseOptions.init = function () {
                          $parseOptions.$match = match = attr.match(options.regexp);
                          displayFn = $parse(match[2] || match[1]), valueName = match[4] || match[6], keyName = match[5], groupByFn = $parse(match[3] || ''), valueFn = $parse(match[2] ? match[1] : valueName), valuesFn = $parse(match[7]);

                      };
                      $parseOptions.valuesFn = function (scope, controller) {
                          return $q.when(valuesFn(scope, controller)).then(function (values) {
                              $parseOptions.$values = values ? parseValues(values) : {};
                              return $parseOptions.$values;
                          });
                      };
                      $parseOptions.parseInit = function () {
                        
                          $parseOptions.$values = parseElement($element)
                      }
                      $parseOptions.valuesParse = function (elem) {
                          return $q.when(elem).then(function (el) {
                              $parseOptions.$values = parseElement(el) || [];
                              return $parseOptions.$values;
                          });
                      };
                      function parseValues(values) {
                          return values.map(function (match, index) {
                              var locals = {}, label, value, group;
                              locals[valueName] = match;
                              label = displayFn(locals);
                              value = valueFn(locals) || label;
                              group = groupByFn(locals);
                              return {
                                  label: label,
                                  value: value,
                                  group: group ? { label: group } : undefined,
                                  disabled: match.disabled
                              };
                          });
                      }

                      function parseElement(element) {
                          var array = [];

                          angular.forEach(element.children(), function (value, key) {
                              if (angular.element(value).is("option")) {
                                  array.push(optionToData(angular.element(value)))
                              }
                              else if (angular.element(value).is("optgroup")) {
                                  var group = optionGroupToData(angular.element(value));
                                  angular.forEach(angular.element(value).children(), function (gval, gkey) {
                                      array.push(optionToData(angular.element(gval), group))
                                  })

                              }
                              

                          })
                          return array;
                      }

                      function optionToData(element, group) {
                          return {
                              value: element.prop("value"),
                              label: element.text(),
                              group: group,
                              disabled: element.prop("disabled") || group && group.disabled
                          };
                      }
                     
                      function optionGroupToData(element) {
                          return {
                              label: element.attr("label"),
                              disabled: element.prop("disabled")
                          };
                      }
                    
                      if ($element)
                          $parseOptions.parseInit();
                      else
                          $parseOptions.init();
                      return $parseOptions;
                  }
                  return ParseOptionsFactory;
              }
            ];
        });