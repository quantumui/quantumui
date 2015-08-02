'use strict';
angular.module('ngQuantum.tabset', ['ngQuantum.services.helpers'])
    .run(['$templateCache', function ($templateCache) {
        'use strict';
        $templateCache.put('tabs/tabset.tpl.html',
                 '<div class="tab-container {{theme}}">'
                   + '<ul class="nav {{navClasses}}" nav-placement="{{placement}}">'
                   + '<li ng-repeat="pane in panes | orderBy:$paneindex" ng-class="{active: pane.active, disabled: pane.disabled}">'
                       + '<a role="button" tabindex="0" tab-heading-transclude="pane">{{pane.heading}}</a>'
                   + '</li>'
                   + '</ul>'
                   + '<div class="tab-content clearfix" ng-transclude></div>'
               + '</div>'
        );
        $templateCache.put('tabs/tabset.responsive.tpl.html',
                '<div class="tab-container {{theme}}">'
                 + '<ul class="nav {{navClasses}}" nav-placement="{{placement}}">'
                 + '<li ng-repeat="pane in panes" ng-show="!pane.stored"  ng-class="{active: pane.active, disabled: pane.disabled}">'
                     + '<a role="button" tabindex="0" tab-heading-transclude="pane">{{pane.heading}}</a>'
                 + '</li>'
                 + '<li ng-show="showMore">'
                    + '<a role="button" tabindex="0" nq-dropdown="" class="dropdown-toggle" data-placement="{{ddPlacement}}">More</a>'
                     + '<ul class="dropdown-menu">'
                         + '<li ng-repeat="pane in panes | filter:{stored:true}" ng-class="{active: pane.active, disabled: pane.disabled}">'
                              + '<a role="button" tabindex="0" ng-click="pane.select()" ng-bind-html="pane.htmlString"></a>'
                         + '</li>'
                     + '</ul>'
                 + '</li>'
                 + '</ul>'
                 + '<div class="tab-content" ng-transclude></div>'
               + '</div>'
        );
    }])
    .provider('$tabset', function () {
        var defaults = this.defaults = {
            effect: 'slide-right-left',
            type: 'tabs',
            speed: 'fastest',
            placement: 'top',
            justified: false,
            prefixEvent: 'tabs',
            directive: 'nqTab',
            instanceName: 'tabs',
            fireEmit: false,
            fireBroadcast: false,
            keyboard: false,
            theme: false,
            trigger: 'click',
            responsive: true,
            delay: 0
        };
        this.$get = ['$timeout', '$filter', '$compile', '$sce', '$animate',
          function ($timeout, $filter, $compile, $sce, $animate) {
              function TabFactory($scope, config) {

                  var $tabset = {},
                  options = $tabset.$options = angular.extend({}, defaults, config),

                  panes = $tabset.panes = $scope.panes = [];
                  var nc = 'nav-' + options.type;
                  if (options.justified)
                      nc = nc + ' nav-justified'
                  else if (/right|left/.test(options.placement)) {
                      nc = nc + ' nav-stacked'
                      options.responsive = false;
                  }
                  $scope.ddPlacement = 'bottom-right'
                  $scope.navClasses = nc
                  $scope.theme = (options.theme && 'nav-' + options.theme) + ' tab-' + options.placement;
                  $scope.placement = options.placement;
                  if (options.placement == "bottom")
                      $scope.ddPlacement = 'top-right'
                  $tabset.select = function (selectedPane) {
                      angular.forEach(panes, function (pane) {
                          if (pane.active && pane !== selectedPane) {
                              pane.active = false;
                              pane.activeClasses = '';
                              pane.onDeselect();
                          }
                      });
                      selectedPane.active = true;
                      selectedPane.onSelect();
                  };

                  $tabset.addPane = function (pane) {
                      panes.push(pane);
                      if (panes.length === 1) {
                          pane.active = true;
                      } else if (pane.active) {
                          $tabset.select(pane);
                      }
                      $tabset.lastStoredIndex++;
                  };
                  $tabset.removePane = function (pane) {
                      var index = panes.indexOf(pane);
                      if (pane.active && panes.length > 1) {
                          var newActiveIndex = index == panes.length - 1 ? index - 1 : index + 1;
                          $tabset.select(panes[newActiveIndex]);
                      }
                      panes.splice(index, 1);
                  };

                  $tabset.panesWidth = 0;
                  $tabset.lastStoredIndex = -1;
                  return $tabset;
              }
              return TabFactory;
          }
        ];
    })
    .directive('nqTabset', ['$tabset', '$compile', '$timeout', '$helpers',function ($tabset, $compile, $timeout, $helpers) {
        return {
            restrict: 'EA',
            transclude: true,
            replace: true,
            scope: {},
            templateUrl: function (element, attr) {
                if(angular.isDefined(attr.template))
                    return attr.template;
                if (attr.responsive && !/right|left/.test(attr.placement))
                    return 'tabs/tabset.responsive.tpl.html';
                return 'tabs/tabset.tpl.html';
            },
            controller: ['$scope', '$element', '$attrs', function ($scope, $element, $attrs) {
                var that = this;
                var options = {};
                angular.forEach(['theme', 'justified', 'effect', 'type', 'speed', 'placement', 'keyboard', 'trigger', 'responsive'],
                    function (key) {
                        angular.isDefined($attrs[key]) && (options[key] = $helpers.parseConstant($attrs[key]))
                    })
                var ctrl = new $tabset($scope, options);
                that = angular.extend(that, ctrl);
                if ($attrs.tabsetModel)
                    $scope.$parent[$attrs.tabsetModel] = that;
                return that;
            }],

            link: function postLink(scope, elm, attrs, controller, transcludeFn) {
                attrs.nqTabset && scope.$parent.$watch(attrs.nqTabset, function (newValue, oldValue) {
                    var content = elm.find('.tab-content');
                    if (newValue && newValue.length && content.length) {
                        for (var j = 0; j < newValue.length; j++) {
                            var paneelm = angular.element('<div data-nq-tab=""></div>').append('<span data-tab-heading="">' + newValue[j].heading + '</span>')
                                                 .append(newValue[j].content)
                            content.append(paneelm)
                            $compile(paneelm)(scope)
                        }
                    }
                }, true);
                if (controller.$options.responsive) {
                    scope.$watch(function () { return elm.width(); }, function (newValue, oldValue) {
                        setTimeout(function () {
                            scope.$apply(function () {
                                responsiveDesign(elm.innerWidth() - 90, newValue)
                            });
                        }, 0)
                    });
                    
                }
                function responsiveDesign(value, oldValue) {
                    !oldValue && (oldValue = 0)
                    !value && (value = 0)
                    var dif = Math.abs(controller.panesWidth - value)
                    if (!value || !controller.panes.length || dif < 10)
                        return;
                    if (value < controller.panesWidth) {
                        if (controller.panes.length <= controller.lastStoredIndex || controller.lastStoredIndex == -1)
                            controller.lastStoredIndex = controller.panes.length - 1;
                        while (value < controller.panesWidth && controller.lastStoredIndex > 0) {
                            var p = controller.panes[controller.lastStoredIndex];

                            if (!p.stored) {
                                controller.panesWidth -= p.widht;
                                p.stored = true;
                                scope.showMore = true;
                            }
                            controller.lastStoredIndex--
                        }
                    }
                    else if (value > controller.panesWidth) {
                        while (value > controller.panesWidth && controller.panes.length > controller.lastStoredIndex) {
                            var p = controller.panes[controller.lastStoredIndex];
                           
                            if (p && p.stored == true) {
                                controller.panesWidth += p.widht;
                                p.stored = false;
                            }

                            controller.lastStoredIndex++;
                            (controller.panes.length == controller.lastStoredIndex) && (scope.showMore = false)
                        }
                    }
                }

            }
        };
    }])
    .directive('nqTab', ['$parse', '$timeout', function ($parse, $timeout) {
        return {
            require: '^nqTabset',
            restrict: 'EA',
            replace: true,
            template: '<div class="tab-pane clearfix" tab-content-transclude=""></div>',
            transclude: true,
            scope: {
                heading: '@',
                onSelect: '&select',
                onDeselect: '&deselect'
            },
            controller: function () {
            },
            compile: function (elm, attrs, transclude) {
                return function postLink(scope, elm, attrs, controller) {
                    scope.effect = controller.$options.effect;
                    scope.speed = controller.$options.speed;
                    angular.isDefined(attrs.effect) && (scope.effect = attrs.effect)
                    angular.isDefined(attrs.speed) && (scope.effect = attrs.speed)
                    if (angular.isDefined(attrs.active)) {
                        scope.$$postDigest(function () {
                            scope.select()
                        });
                    }
                    scope.$watch('active', function (active) {
                        if (active) {
                            controller.select(scope);
                        }
                    });

                    scope.disabled = false;
                    if (attrs.disabled) {
                        scope.$parent.$watch($parse(attrs.disabled), function (value) {
                            scope.disabled = !!value;
                        });
                    }

                    scope.select = function () {
                        if (!scope.disabled) {
                            scope.active = true;
                        }
                    };
                    scope.$paneindex = elm.index() || scope.$index;;
                    controller.addPane(scope);
                    scope.$on('$destroy', function () {
                        controller.removePane(scope);
                    });

                    $timeout(function () {
                        scope.$transcludeFn = transclude;
                    }, 0)
                    
                };
            }
        };
    }])
    .directive('tabHeadingTransclude', ['$compile',function ($compile) {
        return {
            restrict: 'A',
            require: '^nqTabset',
            link: function (scope, elm, attrs, controller) {
                var pane = scope.$eval(attrs.tabHeadingTransclude);
                scope.$watch(function () { return pane.headingElement }, function (heading) {
                    if (heading) {
                        elm.html($compile(angular.element(heading))(scope));
                        pane.widht = elm.parent().outerWidth(true);

                    }
                    else
                        pane.widht = elm.parent().outerWidth(true);
                    if (pane.oldWidth)
                        controller.panesWidth -= pane.oldWidth;
                    pane.oldWidth = pane.widht
                    controller.panesWidth += pane.widht;
                    pane.htmlString = elm.html();
                });
                elm.on('click', function (evt) {
                    evt.preventDefault();
                    evt.stopPropagation();
                    console.log(pane)
                    if (pane.active) return;

                    scope.$apply(function () {
                        pane.select();
                    })
                })
            }
        };
    }])
    .directive('navPlacement', [function () {
        return {
            restrict: 'A',
            require: '^nqTabset',
            link: function (scope, elm, attrs, controller) {
                attrs.$observe('navPlacement', function (value) {
                    if (/bottom|right/.test(value)) {
                        elm.parent().append(elm)
                    }
                })
            }
        };
    }])
   
    .directive('tabContentTransclude', ['$animate', '$timeout', function ($animate, $timeout) {
        return {
            restrict: 'A',
            require: '^nqTab',
            link: function (scope, elm, attrs, controller) {
                scope.$watch('$transcludeFn', function (value) {
                    value && scope.$transcludeFn(scope.$parent, function (contents) {
                        angular.forEach(contents, function (node, i) {
                            if (isTabHeading(node)) {
                                scope.headingElement = node;
                            } else {
                                elm.append(node);
                            }
                        });
                            
                    });
                });
                scope.$watch('active', function (value) {
                    value ? show() : hide();
                });
                function show() {
                    elm.css('display', 'block');
                    elm.css('visibility', 'visible');
                    if (scope.effect) {
                        elm.addClass(scope.speed);
                        var content = elm.closest('.tab-content');
                        content.css('overflow', 'hidden');
                        $animate.addClass(elm, scope.effect).then(function () {
                            content.css('overflow', '')
                        });
                    }

                }
                function hide() {
                    elm.css('visibility', 'hidden');
                    elm.css('display', 'none');
                    if (scope.effect) {
                        elm.removeClass(scope.speed)
                        elm.removeClass(scope.effect)
                    }
                }
            }
        };
        function isTabHeading(node) {
            return node.tagName && (
              node.hasAttribute('tab-heading') ||
              node.hasAttribute('data-tab-heading') ||
              node.tagName.toLowerCase() === 'tab-heading' ||
              node.tagName.toLowerCase() === 'data-tab-heading'
            );
        }
    }]);
