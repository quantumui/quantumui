'use strict';
angular.module('ngQuantum.switchButton', ['ngQuantum.services.helpers'])
    .run(['$templateCache', function ($templateCache) {
        'use strict';
        $templateCache.put('switch/switchbutton.tpl.html',
                    '<div class="btn-group btn-switch">'
                        + '<label class="btn" ng-class="$buttonTheme"><span ng-class="{visibleswitch:$checked}" ng-bind-html="$trueLabel"></span><span class="switch-bg" ng-class="{visibleswitch:!$checked}"></span><span class="switch-label" ng-class="{visibleswitch:!$checked}" ng-bind-html="$labelText"></span></label>'
                        + '<label class="btn" ng-class="$buttonTheme"><span ng-class="{visibleswitch:!$checked}" ng-bind-html="$falseLabel"></span><span class="switch-bg" ng-class="{visibleswitch:$checked}"></span><span class="switch-label" ng-class="{visibleswitch:$checked}" ng-bind-html="$labelText"></span></label>'
                  + '</div>'
        )
    }])
    .provider('$switchButton', function () {
        var defaults = this.defaults = {
            trueLabel: 'ON',
            falseLabel: 'OFF',
            trueValue: true,
            falseValue: false,
            labelText: '&nbsp;',
            effect: 'slide-left',
            theme: 'default',
            btnSize: false
        };
        this.$get = function () {
            return { defaults: defaults };
        };
    })
    .directive('nqSwitchButton', ['$switchButton', '$helpers', function ($switchButton, $helpers) {
        return {
            restrict: 'AC',
            scope: {},
            templateUrl: 'switch/switchbutton.tpl.html',
            require: 'ngModel',
            link: function postLink(scope, element, attr, controller) {
                var button = element.children();
                element.after(button);
                element.hide();
                var options = angular.extend({}, $switchButton.defaults);
                angular.forEach(['theme', 'effect', 'btnSize'], function (key) {
                    if (angular.isDefined(attr[key])) {
                        options[key] = attr[key];
                    }
                });
                angular.forEach(['trueLabel', 'falseLabel', 'labelText'], function (key) {
                    if (angular.isDefined(attr[key])) {
                        options[key] = $helpers.parseConstant(attr[key])
                    }
                    scope['$' + key] = options[key];
                });
                options.effect && button.addClass(options.effect);
                !options.theme && (options.theme == 'default')
                if (options.theme) {
                    var themes = options.theme.split(','), newThemes = '';
                    for (var i = 0; i < themes.length; i++)
                        newThemes += 'btn-' + themes[i] + ' ';
                    scope.$$postDigest(function () {
                        scope.$buttonTheme = newThemes;
                    });
                }

                options.btnSize && button.addClass('btn-group-' + options.btnSize);
                var trueValue = options.trueValue || true, falseValue = options.falseValue || false;
                angular.isDefined(attr.ngTrueValue) && (trueValue = attr.ngTrueValue);
                angular.isDefined(attr.ngFalseValue) && (trueValue = attr.ngFalseValue);


                scope.$parent.$watch(attr.ngModel, function (newVal, oldVal) {
                    if (newVal == trueValue && !scope.$checked) {
                        scope.$checked = true;
                    }
                    else if (newVal == falseValue && scope.$checked) {
                        scope.$checked = false;
                    }
                })
                button.on('click', function (e) {
                    if (scope.$disabled) {
                        e.preventDefault();
                        return false;
                    }
                    scope.$apply(function () {
                        attr.$set('checked', !scope.$checked)
                    });
                })
                attr.$observe('checked', function (newVal, oldVal) {
                    scope.$checked = newVal;
                    if (newVal)
                        controller.$setViewValue(trueValue);
                    else
                        controller.$setViewValue(falseValue);
                })
                attr.$observe('disabled', function (newVal, oldVal) {
                    scope.$disabled = newVal;
                    if (scope.$disabled)
                        button.addClass('btn-disabled')
                    else
                        button.removeClass('btn-disabled')
                })
                scope.$on('$destroy', function () {
                    button.off('click');
                    button = null;
                    options = null;
                })
            }
        };
    }])