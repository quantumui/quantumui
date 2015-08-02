+function (window, angular, undefined) {
'use strict';
    angular.module('ngQuantum.carousel', ['ngQuantum.services.helpers'])
    .run(['$templateCache', function ($templateCache) {
        'use strict';
        $templateCache.put('carousel/carousel.tpl.html',
                 '<div class="carousel" ng-style="{width:$outerWidth}">'
                   + '<ol class="carousel-indicators">'
                       + '<li ng-repeat="item in items"  indicator-transclude="item" ng-class="{active: item.active}" ng-click="item.select($index)">'
                           + '<span class="indicator-no">{{$index + 1}}</span>'
                       + '</li>'
                   + '</ol>'
                   + '<div class="carousel-inner" ng-transclude ng-style="{height:$innerHeight}"></div>'
                   + '<div class="carousel-control left"  ng-click="$prev()">'
                        + '<span class="icon-prev"></span>'
                    + '</div>'
                    + '<div class="carousel-control right" ng-click="$next()">'
                        + '<span class="icon-next"></span>'
                    + '</div>'
               + '</div>'
        );
    }])
    .provider('$carousel', function () {
        var defaults = this.defaults = {
            effect: 'slide-left-right',
            type: 'carousel',
            speed: 'fastest',
            prefixEvent: 'carousel',
            directive: 'nqCarousel',
            instanceName: 'carousel',
            keyboard: true,
            hoverStop: true,
            showIndicator: true,
            showPrevNext: true,
            showPause: true,
            showPlay: true,
            autoPlay: true,
            outerWidth: '650px',
            innerHeight: '405px',
            interval: 5000
        };
        this.$get = ['$timeout', '$interval', '$filter', '$compile', '$sce', '$animate',
          function ($timeout, $interval, $filter, $compile, $sce, $animate) {
              function CarouselFactory($element, $scope, config) {

                  var $carousel = {},
                  options = $carousel.$options = angular.extend({}, defaults, config),
                  items = $carousel.items = $scope.items = [];
                  var lastIndex = $carousel.$lastIndex = 0;
                  var stopFunc;
                  angular.forEach(['next', 'prev', 'play', 'pause'], function (value) {
                      $scope['$' + value] = function (evt) {
                          $carousel[value](evt);
                      }
                  })
                  angular.forEach(['outerWidth', 'innerHeight'], function (value) {
                      $scope['$' + value] = options[value];
                  })
                  if ($element.hasClass('thumb-navigation') || $element.hasClass('number-navigation')) {
                      $carousel.$watchIndicator = true;
                  }
                  $carousel.init = function () {
                      if (options.autoPlay) {
                          $carousel.play()
                          hoverStop();
                      }
                      $timeout(function () {
                          if (parseInt($scope.$outerWidth) > $element.width()) {
                              $scope.$innerHeight = ((parseInt($scope.$innerHeight) / parseInt($scope.$outerWidth)) * $element.width()) + 'px';
                          }
                      }, 800)
                  };
                  $carousel.select = function (index) {
                      var selectedItem = items[index];
                      angular.forEach(items, function (item) {
                          if (item.active && item !== selectedItem) {
                              item.active = false;
                              item.activeClasses = '';
                          }
                      });
                      if (selectedItem) {
                          selectedItem.active = true;
                          lastIndex = $carousel.$lastIndex = index;
                      }
                      
                  };
                  $carousel.pause = function () {
                      $interval.cancel(stopFunc)
                  };
                  $carousel.play = function () {
                      stopFunc = $interval($carousel.next, options.interval)
                  };
                  $carousel.next = function (evt) {
                      var i = lastIndex < items.length - 1 ? lastIndex + 1 : 0
                      $carousel.select(i);
                  };
                  $carousel.prev = function () {
                      var i = lastIndex > 0 ? lastIndex - 1 : items.length - 1
                      $carousel.select(i);
                  };
                  $carousel.addItem = function (item) {
                      items.push(item);
                      if (items.length === 1) {
                          item.active = true;
                      } else if (item.active) {
                          $carousel.select(items.indexOf(item));
                      }
                  };
                  $carousel.removeItem = function (item) {
                      var index = items.indexOf(item);
                      if (item.active && items.length > 1) {
                          var newActiveIndex = index == items.length - 1 ? index - 1 : index + 1;
                          $carousel.select(newActiveIndex);
                      }
                      items.splice(index, 1);
                  };
                  $carousel.init();

                  function hoverStop() {
                      if (options.hoverStop) {
                          $element.on('mouseenter', function () {
                              $carousel.pause();
                          })
                          $element.on('mouseleave', function () {
                              $carousel.play();
                          })
                      }
                  }

                  return $carousel;
              }
              return CarouselFactory;
          }
        ];
    })
    .directive('nqCarousel', ['$carousel', '$helpers', function ($carousel, $helpers) {
        return {
            restrict: 'EA',
            transclude: true,
            replace: true,
            scope: {},
            templateUrl: 'carousel/carousel.tpl.html',
            controller: ['$scope', '$element', '$attrs', function ($scope, $element, $attrs) {
                var that = this, options = {};
                angular.forEach(['effect', 'speed', 'interval', 'keyboard', 'hoverStop', 'autoPlay', 'outerWidth', 'innerHeight'],
                    function (key) {
                        angular.isDefined($attrs[key]) && (options[key] = $helpers.parseConstant($attrs[key]))
                    })
                var ctrl = new $carousel($element, $scope, options)
                that = angular.extend(that, ctrl)
                return that;
            }]
        };
    }])
    .directive('carouselItem', ['$parse', function ($parse) {
        return {
            require: '^nqCarousel',
            restrict: 'EA',
            replace: true,
            template: '<div class="item" carousel-item-transclude="" ng-swipe-left="$parent.$next()"  ng-swipe-right="$parent.$prev()"></div>',
            transclude: true,
            scope: {
                active: '=?',
                heading: '@',
            },
            controller: function () {
            },
            compile: function (elm, attrs, transclude) {
                return function postLink(scope, elm, attrs, controller) {
                    scope.effect = controller.$options.effect;
                    scope.speed = controller.$options.speed;
                    angular.isDefined(attrs.effect) && (scope.effect = attrs.effect)
                    angular.isDefined(attrs.speed) && (scope.effect = attrs.speed)


                    scope.select = function (index) {
                        index = index || scope.$index || 0;
                        controller.select(index);
                    };
                    controller.addItem(scope);
                    scope.$on('$destroy', function () {
                        controller.removeItem(scope);
                    });

                    scope.$transcludeFn = transclude;
                };
            }
        };
    }])

    .directive('indicatorTransclude', [function () {
        return {
            restrict: 'A',
            require: '^nqCarousel',
            link: function (scope, elm, attrs, controller) {
                var item = scope.$eval(attrs.indicatorTransclude);
                if (controller.$watchIndicator && scope.$first) {
                    controller.thumbWidth = elm.width();
                    controller.thumbHeight = elm.height();
                    controller.visibleThumb = parseInt((elm.closest('.carousel').width() - 100) / controller.thumbWidth)
                }
                scope.$watch(function () { return item.thumbImage }, function (image) {
                    if (image) {
                        angular.element(image).on('load',function () {
                            var c = document.createElement("canvas"),
                                w = controller.thumbWidth,
                                h = controller.thumbHeight,
                            ow = controller.$options.outherWidth;
                            c.width = w - 2; c.height = h - 2;
                            c.getContext("2d").drawImage(this, 0, 0, w - 2, h - 2);

                            elm.html(c)
                        });
                    }
                });
                if (controller.$watchIndicator) {
                    scope.$watch(function () { return controller.$lastIndex }, function (index) {
                        if (controller.visibleThumb > 0) {
                            if (scope.$index + controller.visibleThumb < (index + 2))
                                elm.hide();
                            else if (elm.css('display') == 'none')
                                elm.show();
                        }
                    });
                }
            }
        };
    }])
    .directive('carouselItemTransclude', ['$animate', '$timeout', function ($animate, $timeout) {
        return {
            restrict: 'A',
            require: '^carouselItem',
            link: function (scope, elm, attrs, controller) {
                scope.$watch('$transcludeFn', function (value) {
                    scope.$transcludeFn(scope.$parent, function (contents) {
                        angular.forEach(contents, function (node) {
                            var nodeEl = angular.element(node)
                            if (nodeEl.hasClass('thumb-image')) {
                                scope.thumbImage = nodeEl;
                            }
                            else if (nodeEl.hasClass('generate-thumb')) {
                                scope.thumbImage = nodeEl;
                                elm.append(node);
                            }
                            else
                                elm.append(node);
                        });
                    });
                });
                scope.$watch('active', function (value) {
                    value ? show() : hide();
                });
                function show() {
                    elm.show();
                    if (scope.effect) {
                        elm.addClass(scope.speed)
                        $animate.addClass(elm, scope.effect).then(function () {
                        });
                    }

                }
                function hide() {
                    if (scope.effect) {
                        
                        $animate.removeClass(elm, scope.effect).then(function () {
                            elm.hide();
                        });
                        elm.animationEnd(function (evt) {
                            !scope.active &&  elm.hide();
                        });
                    }
                    else
                        elm.hide();
                }
            }
        };
    }]);
}(window, window.angular);