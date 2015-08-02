'use strict';
angular.module('ngQuantum.services.helpers', [])
        .factory('$helpers', ['$injector', '$window', function ($injector, $window) {
            var fn = {};
            
            fn.injectModule = function (name, base) {
                base = base ? base : name;
                var MESSAGE = 'Module ' + base + ' is not available! You either misspelled the module name or forgot to load it. If registering a module ensure that you specify the dependencies as the second argument.';
                var module;
                try {
                    module = $injector.get(name);
                }
                catch (e) {
                    console.error('ngquantum WARNING:', MESSAGE);
                }

                return module;
            }
            fn.isTouch = function () {
                return "createTouch" in $window.document && window.ontouchstart != null;
            }
            var isTouch = fn.isTouch();
            fn.isHtml = function (value) {
                return /<[a-z][\s\S]*>/i.test(value)
            }
            fn.ensureNumber = function (value, defaultval) {
                if (!value) return defaultval || 0;
                if (angular.isString(value)) {
                    return parseFloat(value);
                }
                if (angular.isNumber(value)) {
                    return value;
                }
                else return defaultval || 0;
            }
            fn.parseConstant = function (value) {
                if (/^(true|false|\d+|\-?[0-9]\d+)$/.test(value)) {
                    return eval(value)
                }
                if (angular.isString(value)) {
                    if (value[0] == '[' || (value[0] == '{' && value[1] !== '{{')) {
                        try {
                            return eval(value)
                        }
                        catch (e) {
                            return value.trimStart("'").trimEnd("'")
                        }
                    }
                    return value.trimStart("'").trimEnd("'")
                }
                    
                return value;
            }
            fn.parseOptions = function (attr, options, prefix) {
                if (attr && angular.isDefined(attr.$$element)) {
                    prefix = prefix || 'qo';
                    angular.forEach(attr.$attr, function (value, key) {
                        if (value.length && value.indexOf('qo-') > -1) {
                            var oKey = fn.getOptionKey(key)

                            options[oKey] = fn.parseConstant(attr[key]);
                        }

                    });
                }
                
                return options;
            }
            fn.observeOptions = function (attr, options, callback, prefix) {
                if (attr && angular.isDefined(attr.$$element)) {
                    prefix = prefix || 'qo';
                    if (attr.$$observers)
                        for (var key in attr.$$observers) {
                            if (key.length > 2 && key.startsWith(prefix)) {
                                var oKey = fn.getOptionKey(key, prefix.length);
                                attr.$observe(key, function (newValue, oldValue) {
                                    options[oKey] = fn.parseConstant(newValue);
                                    callback && callback(oKey);
                                });

                            };

                        };
                }
                return options;
            }
            fn.id = function (prefix, random) {
                var id = prefix ? prefix : 'nq-', rd = random || 1000;
                return id + Math.floor((Math.random() * rd) + 1);                      
            }
            fn.getOptionKey = function (key, remove) {
                remove = remove || 2;
                if(key && key.length > remove){
                    var newKey = key.slice(remove);
                    return newKey.charAt(0).toLowerCase() + newKey.slice(1);
                }
                return key
            }
            fn.formatUrl = function (url, params) {
                url = url.trimEnd('/')
                for (var o in params) {
                    params[o] &&(url += '/' + params[o]);
                }
                return url;
            }
            fn.getFieldValue = function (data, field) {
                if (field.indexOf('.') < 0)
                    return data[field]
                else {
                    var fields = field.split('.');
                    var result = data;
                    for (var i = 0; i < fields.length; i++) {
                        if (result)
                            result = result[fields[i]];
                        else
                            break;
                    }
                    return result;
                }
            }

            fn.bindTriggers = function (element, triggers, $master) {
                var array = triggers.split(' ');
                var hasclick = false;
                angular.forEach(array, function (trigger) {
                    if (trigger === 'click') {
                        element.on('click', $master.toggle);
                        hasclick = true;
                        
                    }
                    else if (trigger !== 'manual') {
                        element.on(trigger === 'hover' ? 'mouseenter' : 'focus', $master.enter);
                        element.on(trigger === 'hover' ? 'mouseleave' : 'blur', $master.leave);
                        trigger !== 'hover' && element.on(isTouch ? 'touchstart' : 'mousedown', $master.$onFocusElementMouseDown);
                    }
                });
                return hasclick;
            }
            fn.unBindTriggers = function (element, triggers, $master) {
                var array = triggers.split(' ');
                for (var i = array.length; i--;) {
                    var trigger = array[i];
                    if (trigger === 'click') {
                        element.off('click keyup', $master.toggle);
                    } else if (trigger !== 'manual') {
                        element.off(trigger === 'hover' ? 'mouseenter' : 'focus', $master.enter);
                        element.off(trigger === 'hover' ? 'mouseleave' : 'blur', $master.leave);
                        trigger !== 'hover' && element.off(isTouch ? 'touchstart' : 'mousedown', $master.$onFocusElementMouseDown);
                    }
                }
            }
            fn.stringParsers = [
              {
                  re: /rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*(\d+(?:\.\d+)?)\s*)?\)/,
                  parse: function (execResult) {
                      return [
                        execResult[1],
                        execResult[2],
                        execResult[3],
                        execResult[4]
                      ];
                  }
              },
              {
                  re: /rgba?\(\s*(\d+(?:\.\d+)?)\%\s*,\s*(\d+(?:\.\d+)?)\%\s*,\s*(\d+(?:\.\d+)?)\%\s*(?:,\s*(\d+(?:\.\d+)?)\s*)?\)/,
                  parse: function (execResult) {
                      return [
                        2.55 * execResult[1],
                        2.55 * execResult[2],
                        2.55 * execResult[3],
                        execResult[4]
                      ];
                  }
              },
              {
                  re: /#([a-fA-F0-9]{2})([a-fA-F0-9]{2})([a-fA-F0-9]{2})/,
                  parse: function (execResult) {
                      return [
                        parseInt(execResult[1], 16),
                        parseInt(execResult[2], 16),
                        parseInt(execResult[3], 16)
                      ];
                  }
              },
              {
                  re: /#([a-fA-F0-9])([a-fA-F0-9])([a-fA-F0-9])/,
                  parse: function (execResult) {
                      return [
                        parseInt(execResult[1] + execResult[1], 16),
                        parseInt(execResult[2] + execResult[2], 16),
                        parseInt(execResult[3] + execResult[3], 16)
                      ];
                  }
              }
            ]
            fn.docHeight = function () {
                var body = document.body,
                            html = document.documentElement;

                var height = Math.max(body.scrollHeight, body.offsetHeight,
                                       html.clientHeight, html.scrollHeight, html.offsetHeight);
                return height;
            }
            return fn;
        }
        ])