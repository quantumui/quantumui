+function (window, angular, undefined) {
'use strict';
    angular.module('ngQuantum.collapse', [])
    .provider('$collapse', function () {
        var defaults = this.defaults = {
            dimension: 'height',
            collapsed:true
        };
        this.$get = ['$timeout',
          function ($timeout) {
              function Factory(target, element, config) {
                  var $collapse = {}, position, size, dimension, collapsed;
                  var options = $collapse.$options = angular.extend({}, defaults, config);
                  dimension = options.dimension;
                  $collapse.collapsed = options.collapsed;
                 target.addClass('collapse');
                  !$collapse.collapsed && target.addClass('in')
                  function toggle() {
                      if ($collapse.collapsed) {
                          position = target[0].style.position || '';
                          target.css('position', 'absolute').show();
                          size = target[dimension]();

                          target.css('display', '')[dimension](0).css('position', position);
                          target.addClass('in collapsing');
                          setTimeout(function () {
                              target[dimension](size)
                              .transitionEnd(function () {
                                  target.removeClass('collapsing');
                                  $collapse.collapsed = false;
                                  options.onToggle && options.onToggle(false);
                              });
                          }, 1)

                      } else {
                          size = target[dimension]();
                          target[dimension](size)
                          setTimeout(function () {
                              target.addClass('collapsing')[dimension](0)
                              .transitionEnd(function () {
                                  target[dimension]('');
                                  target.removeClass('collapsing').removeClass('in').css(dimension, '');
                                  $collapse.collapsed = true;
                                  options.onToggle && options.onToggle(true);
                              });
                          }, 1)
                          
                      }
                  }
                  element && element.on('click', function (evt) {
                      evt.preventDefault();
                      evt.stopPropagation();
                      toggle();

                  });
                  $collapse.toggle = toggle;
                  return $collapse;
              }
              return Factory;
          }
        ];
    })
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
    .directive("nqCollapse", ['$collapse',function ($collapse) {
            return {
                restrict: 'EAC',
                require: '?ngModel',
                compile: function (tElm, tAttrs, transclude) {
                    var collapsed = true, target = angular.element(tAttrs.targetId),
                        dimension = angular.isDefined(tAttrs.dimension) && tAttrs.dimension == 'width' ? tAttrs.dimension : 'height';
                    if (angular.isDefined(tAttrs.collapsed) && (tAttrs.collapsed == 'false' || tAttrs.collapsed == false))
                        collapsed = false;
                    var options = {
                        collapsed: collapsed,
                        dimension: dimension,
                    }
                    var index = tAttrs.targetIndex ? parseInt(tAttrs.targetIndex) : 0,
                        collapse,
                        elm = !angular.isDefined(tAttrs.ngModel) ? tElm : null;
                    if (target.length) {
                        collapse = new $collapse(target, elm, options)
                    }

                    return function postLink(scope, element, attr, controller) {
                        collapse && angular.isDefined(tAttrs.ngModel) && scope.$watch(attr.ngModel, function (value, old) {
                            if (value == undefined)
                                return;
                            if (value == index || !collapse.collapsed)
                                collapse.toggle();
                        })

                    }
                }
            };
        }]);
}(window, window.angular);