+function (window, angular, undefined) {
'use strict';
   angular.module('ngQuantum.collapse', [])
    .directive('nqAccordion', function () {
        return {
            restrict: 'A',
            require: '?ngModel',
            compile: function(element, attr) {
                var model = attr.ngModel;
                if (!model)
                    model = 'accordionModel' + Math.floor((Math.random() * 1000) + 1).toString();
                element.removeAttr('ng-model');
                var children = element.find('> .panel');
                
                angular.forEach(children, function (child, key) {
                    var childEl = angular.element(child),
                    target = childEl.find('.panel-collapse');
                    if (target.length) {
                        var id = target.attr('id')
                        if (!id) {
                            id = model + Math.floor((Math.random() * 1000) + 1).toString()
                            target.attr('id', id)
                        }
                        var link = childEl.find('.panel-title > a');
                        if (!link.length)
                            link = childEl.find('.panel-title');
                        if (!link.length)
                            link = childEl.find('.panel-heading');
                        if (link.length) {
                            link.attr('target-index', key);
                            link.attr('target-id', '#' +id);
                            link.attr('data-ng-click', model + "=" + model + "==" + key + "?" + 20000000 + ":" + key)
                            link.attr('ng-model', model);
                            link.attr('nq-collapse', '');
                        }
                        
                    }
                    

                });

            }
        };
    })
    .directive("nqCollapse", [function () {
            return {
                restrict: 'EAC',
                require: '?ngModel',
                compile: function (tElm, tAttrs, transclude) {
                    var collapsed = true, target = angular.element(tAttrs.targetId);
                    if (angular.isDefined(tAttrs.collapsed) && (tAttrs.collapsed == 'false' || tAttrs.collapsed == false))
                        collapsed = false;
                    target.length && collapsed && target.addClass('collapse');
                   var index = tAttrs.targetIndex ? parseInt(tAttrs.targetIndex) : 0;

                    return function postLink(scope, element, attr, controller) {
                        if (!target.length)
                            return;
                        var size, position, dimension = angular.isDefined(attr.dimension) && attr.dimension == 'width' ? attr.dimension : 'height';
                        attr.ngModel && scope.$watch(attr.ngModel, function (value, old) {
                            if (value == undefined)
                                return;
                            if (value == index || !collapsed)
                                toggle();
                        })
                        !attr.ngModel && element.on('click', function (evt) {
                            evt.preventDefault();
                            evt.stopPropagation();
                            toggle();
                            
                        });

                        function toggle() {
                            if (collapsed) {
                                position = target[0].style.position || '';
                                target.css('position', 'absolute').show();
                                size = target[dimension]();

                                target.css('display', '')[dimension](0).css('position', position);
                                target.addClass('in collapsing')[dimension](size)
                                    .transitionEnd(function () {
                                        target.removeClass('collapsing');
                                        collapsed = false;
                                    });
                            } else {
                                target.addClass('collapsing')[dimension](0)
                                    .transitionEnd(function () {
                                        size = target[dimension]();
                                        target.removeClass('collapsing').removeClass('in').css(dimension, '');
                                        collapsed = true;
                                    });
                            }
                        }

                    }
                }
            };
        }]);
}(window, window.angular);