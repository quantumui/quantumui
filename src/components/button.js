+function (window, angular, undefined) {
'use strict';
    var nqButtonsApp = angular.module('ngQuantum.button', ['ngAnimate', 'ngQuantum.services.helpers'])
        .provider('$button', function () {
            var defaults = this.defaults = {
                activeClass: 'active',
                toggleEvent: 'click',
                activeIcon:'',
            };
            this.$get = function () {
                return { defaults: defaults };
            };
        });
        angular.forEach(['CheckboxGroup', 'RadioGroup'], function (directive) {
            nqButtonsApp.directive('nq' + directive, function () {
                return {
                    restrict: 'A',
                    require: 'ngModel',
                    compile: function postLink(element, attr) {
                        var dirType = directive == 'CheckboxGroup' ? 'checkbox' : 'radio'
                        element.attr('data-toggle', 'buttons');
                        element.removeAttr('ng-model');
                        var children = element.find('input[type="' + dirType + '"]');
                        var trueVal, falseVal
                        if (dirType == 'checkbox')
                            trueVal = attr.trueValue, falseVal = attr.falseValue;

                        angular.forEach(children, function (child) {
                            var childEl = angular.element(child);
                            childEl.attr('nq-' + dirType + '-button', '');
                            if (dirType == 'checkbox') {
                                childEl.attr('ng-model', attr.ngModel + '.' + childEl.attr('value'));
                                (!childEl.attr('ng-true-value') && trueVal) && childEl.attr('ng-true-value', trueVal);
                                (!childEl.attr('ng-false-value') && falseVal) && childEl.attr('ng-false-value', falseVal)
                            }
                            else
                                childEl.attr('ng-model', attr.ngModel);
                            childEl.attr('name', attr.ngModel);
                            attr.showTick && childEl.attr('show-tick', attr.showTick)
                            if (attr.ngChange) {
                                if (angular.isDefined(childEl.attr('ng-change'))) {
                                    childEl.attr('ng-change', childEl.attr('ng-change') + ';' +attr.ngChange);
                                }
                                else
                                    childEl.attr('ng-change', attr.ngChange);
                            }

                        });
                    }
                };
            });
        })
        angular.forEach(['Checkbox', 'Radio', 'Toggle'], function (directive) {
            nqButtonsApp.directive('nq' + directive + 'Button', ['$button', '$helpers', function ($button, $helpers) {
                return {
                    restrict: 'A',
                    require: 'ngModel',
                    link: function postLink(scope, element, attr, controller) {
                        var options = $button.defaults;
                        directive = directive.toLowerCase();
                        directive == 'toggle' && (directive = 'checkbox')
                        var isInput = attr.type === directive;
                        var activeElement = isInput ? element.parent() : element;
                        var trueValue, falseValue;
                        if (directive == 'checkbox') {
                            trueValue = angular.isDefined(attr.ngTrueValue) ? $helpers.parseConstant(attr.ngTrueValue) : true;
                            falseValue = angular.isDefined(attr.ngFalseValue) ? $helpers.parseConstant(attr.ngFalseValue) : false;
                        }
                        else {
                            trueValue = attr.ngValue ? scope.$eval(attr.ngValue) : $helpers.parseConstant(attr.value);
                        }

                        if ($helpers.parseConstant(attr.showTick) == true) {
                            activeElement.addClass('tick-right')
                        }
                        attr.showTick == 'left' && activeElement.addClass('tick-left')
                        angular.isDefined(attr.checked) && controller.$setViewValue(trueValue);

                        scope.$watch(attr.ngModel, function (newValue, oldValue) {
                            var isActive = angular.equals($helpers.parseConstant(controller.$modelValue), trueValue);
                            !isActive && element.removeAttr('checked');
                            activeElement.toggleClass(options.activeClass, isActive);
                        });
                        if (!isInput) {
                            element.bind(options.toggleEvent, function () {
                                var viewValue = directive == 'radio' ? trueValue : controller.$modelValue ? $helpers.parseConstant(controller.$modelValue) == trueValue ? falseValue : trueValue : trueValue;
                                controller.$setViewValue(viewValue);
                                scope.$apply();
                            });
                        }
                    }
                };
            }])
        });
 }(window, window.angular);