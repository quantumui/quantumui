(function (window, angular) {
    'use strict';
    var pApp = angular.module('ngQuantum.pageable.directives', ['ngQuantum.pageable.factory']);
    pApp.directive('nqPageable', ['$pageable', function ($pageable) {
        return {
            restrict: 'EA',
            require: 'nqPageable',
            scope: true,
            controller: ['$scope', '$element', '$attrs', function ($scope, $element, $attrs) {
                var that = this;
                var options = {
                    $scope: $scope
                };
                $element.addClass('pageable-container');
                $element.css('position', 'relative');
                that = angular.extend(that, new $pageable($element, options, $attrs));
                that.$container = $element;
                $scope.$watch($attrs.nqPageable, function (newVal, oldVal) {
                    that.setModelData(newVal);
                })
                if (angular.isDefined($attrs.qoAlias) && angular.isString($attrs.qoAlias)) {
                    $scope.$parent[$attrs.qoAlias] = that;

                }
                return that;
            }]
        };
    }])
    angular.forEach(['pageableRepeat', 'pageableRepeatStart', 'pageableRepeatEnd'], function (directive, dIndex) {
        pApp.directive(directive, ['$compile', function ($compile) {
            return {
                require: '^nqPageable',
                restrict: 'EA',
                terminal: true,
                scope: false,
                priority: 1000,
                compile: function (tElm, tAttrs, transclude) {
                    var repeatString = tAttrs.pageableRepeat;
                    var tagName = tElm[0].tagName.toLowerCase();
                    if (dIndex < 2) {
                        tElm.removeAttr('pageable-repeat');
                        tElm.removeAttr('data-pageable-repeat');
                        tElm.removeAttr('pageable-repeat-start');
                        tElm.removeAttr('data-pageable-repeat-start');
                        var arrkey = repeatString.substr(repeatString.indexOf("in"), repeatString.length).split(' ')[1].split('=')[0];
                        var replace = repeatString.replace(arrkey.trim(), '$currentRows');
                        var rowField = repeatString.split(' ')[0];
                        if (repeatString.indexOf("track") < 0)
                            replace += ' track by  $index';
                        var repeatAttr = dIndex == 0 ? 'ng-repeat':'ng-repeat-start'
                        tElm.attr(repeatAttr, replace);
                        tElm.addClass('pageable-item')
                    }else{
                        tElm.removeAttr('pageable-repeat-end');
                        tElm.removeAttr('data-pageable-repeat-end');
                        var attEnd = document.createAttribute("ng-repeat-end");
                        tElm[0].setAttributeNode(attEnd);
                    }
                   

                    return function postLink(scope, element, attr, controller) {
                        if (controller.$options.effect)
                            element.addClass(controller.$options.effect).addClass(controller.$options.speed);

                        $compile(element)(scope)
                        scope.$$postDigest(function () {
                            controller.rowField = rowField;
                            if (tagName == 'tr') {
                                controller.tableElement = element.closest('table');
                            }
                            controller.shellElement = element.parent();
                            controller.elementTag = tagName;
                        })
                    }
                }
            };
        }])
    });
    
    pApp.directive('pageableItem', function () {
        return {
            require: '^nqPageable',
            restrict: 'EAC',
            link: function postLink(scope, element, attr, controller) {

                var copt = controller.$options;
                element.removeClass(copt.selectionClass);
                if (copt.selectionMode == 'row' && copt.selectable) {
                    element.on('click', function (evt) {
                        if (!evt.isDefaultPrevented()) {
                            element.toggleClass(copt.selectionClass);
                            scope.$apply(function () {
                                controller.setRowSelection(scope[controller.rowField])
                            })
                        }

                    })
                    scope.$watch(controller.rowField, function () {
                        element.removeClass(copt.selectionClass);
                    });
                    scope.$on('$refreshPager', function () {
                        element.removeClass(copt.selectionClass);
                    })
                }
                scope.removeRow = function (item) {
                    item = item || scope[controller.rowField];
                    controller.removeRow(item);
                }
                scope.deleteRow = function (item) {
                    item = item || scope[controller.rowField];
                    controller.deleteRow(item);
                }
                if (scope.$last) {
                    scope.$parent.$emit('$pageableItemsRendered')
                }
                scope.$isPageableItem = true;
            }
        };
    });
})(window, angular, undefined);
