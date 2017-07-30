+function (window, angular, undefined) {
'use strict';
    angular.module('ngQuantum.carousel', ['ngQuantum.services.helpers'])
    .run(['$templateCache', function ($templateCache) {
        'use strict';
        $templateCache.put('carousel/carousel.tpl.html',
                 '<div class="carousel" ng-style="{width:$outerWidth}">'
                   
                   + '<div class="carousel-inner" ng-transclude ng-style="{height:$innerHeight}" ng-swipe-left="$next()" ng-swipe-right="$prev()"></div>'
                   + '<div class="carousel-control left"  ng-click="$prev()" ng-style="{height:$conrolHeight}">'
                        + '<span class="icon-prev"></span>'
                    + '</div>'
                    + '<div class="carousel-control right" ng-click="$next()" ng-style="{height:$conrolHeight}">'
                        + '<span class="icon-next"></span>'
                    + '</div>'
                    + '<ol class="carousel-indicators" ng-if="!$hideIndicator">'
                       + '<li ng-repeat="item in items" indicator-transclude="item" ng-class="{active: item.active}" ng-click="item.select($index)">'
                           + '<span class="indicator-no">{{$index + 1}}</span>'
                       + '</li>'
                   + '</ol>'
                    + '<div class="carousel-page-control page-left" ng-click="$prevPage()" ng-if="!$hideIndicator">'
                        + '<span class="icon-page-prev fic fu-angle-l"></span>'
                    + '</div>'
                    + '<div class="carousel-page-control page-all"  ng-click="$showAllThumbs()" ng-if="!$hideIndicator">'
                        + '<span class="page-all-total" ng-bind="totalValidItems"></span>'
                        + '<span class="icon-page-all fic fu-angle-d"></span>'
                    + '</div>'
                     + '<div class="carousel-page-control page-right" ng-click="$nextPage()" ng-if="!$hideIndicator">'
                        + '<span class="icon-page-next fic fu-angle-r"></span>'
                    + '</div>'
               + '</div>'
        );
    }])
    .provider('$carousel', function () {
        var defaults = this.defaults = {
            effect: 'slide-right-left',
            prevEffect: 'slide-left-right',
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
            interval: 5000,
            maxHeightRate: false,
            hideIndicator: false,
            pageSize: 10,
            showPageButtons: false,
            allThumbsButton:false
        };
        this.$get = ['$timeout', '$interval', '$filter', '$compile', '$sce', '$animate',
          function ($timeout, $interval, $filter, $compile, $sce, $animate) {
              function CarouselFactory($element, $scope, config) {

                  var $carousel = {},
                  options = $carousel.$options = angular.extend({}, defaults, config),
                  items = $carousel.items = $scope.items = [];
                  $scope.totalAdded = 0;
                  $scope.totalRemoved = 0;
                  var lastIndex = $carousel.$lastIndex = 0;
                  var prevIndex = 0;
                  var pageIndex = $scope.$pageIndex = 0;
                  var totalPageIndex = $scope.$totalPageIndex = 0;
                  var stopFunc;
                  if (options.maxHeightRate)
                      options.maxHeightRate = parseFloat(options.maxHeightRate)
                  angular.forEach(['next', 'prev', 'play', 'pause', 'nextPage', 'prevPage', 'showAllThumbs'], function (value) {
                      $scope['$' + value] = function (evt) {
                          $carousel[value](evt);
                      }
                  })
                  angular.forEach(['outerWidth', 'innerHeight', 'hideIndicator'], function (value) {
                      $scope['$' + value] = options[value];
                  })
                  if ($element.hasClass('thumb-navigation') || $element.hasClass('number-navigation')) {
                      $carousel.$watchIndicator = true;
                  }
                  if (options.showPageButtons)
                      $element.addClass('show-page-butons')
                  if (options.allThumbsButton)
                      $element.addClass('all-thumbs-button')
                  $carousel.init = function () {
                      if (options.autoPlay) {
                          $carousel.play()
                          hoverStop();
                      }
                      $timeout(function () {
                          $scope.$conrolHeight = '';
                          var eWidth = $element.width();
                          if (eWidth > 0 && (options.maxHeightRate || parseInt($scope.$outerWidth) > $element.width())) {
                              var eHeight = ((parseInt($scope.$innerHeight) / parseInt($scope.$outerWidth)) * $element.width());
                              if (options.maxHeightRate && parseFloat(eHeight / eWidth) > options.maxHeightRate)
                                  eHeight = options.maxHeightRate * eWidth;
                              $scope.$innerHeight = eHeight + 'px';
                              if (eWidth > 767) {
                                  $scope.$conrolHeight = $scope.$innerHeight;
                              }
                          }
                      }, 800)
                  };
                  $carousel.select = function (index, isPrev) {
                      
                      if (!items.length) {
                          $carousel.pause();
                          return;
                      }
                      if ($scope.totalItems > 0 && index >= items.length - 2 && $scope.currentLimit < $scope.totalItems) {
                          var newLimit = $scope.currentLimit + $scope.pageSize;
                          if (newLimit > $scope.totalItems)
                              newLimit = $scope.totalItems;
                          $scope.currentLimit = newLimit;
                      }
                      if ($carousel.$watchIndicator)
                          $scope.totalValidItems = ($scope.totalItems ? $scope.totalItems - $scope.totalRemoved : items.length);
                      $carousel.isPrev = isPrev;
                      var selectedItem = items[index];
                      angular.forEach(items, function (item) {
                          if (item.active && item !== selectedItem) {
                              item.active = false;
                              item.activeClasses = '';
                          }
                      });
                      if (!selectedItem && items.length) {
                          prevIndex = lastIndex;
                          selectedItem = items[0];
                          lastIndex = $carousel.$lastIndex = 0;
                      }
                      if (selectedItem) {
                          prevIndex = lastIndex;
                          selectedItem.active = true;
                          lastIndex = $carousel.$lastIndex = index;
                          pageIndex = $scope.$pageIndex = parseInt(lastIndex / $scope.pageSize);
                      }
                  };
                  $carousel.pause = function () {
                      $interval.cancel(stopFunc)
                  };
                  $carousel.play = function () {
                      if (!$carousel)
                          return;
                      stopFunc = $interval($carousel.next, options.interval)
                  };
                  $carousel.next = function (evt) {
                      if (!$carousel)
                          return;
                      var i = lastIndex < items.length - 1 ? lastIndex + 1 : 0;
                      if (!angular.isNumber(i) || i < 0)
                          i = 0;
                      $carousel && $carousel.select(i);
                  };
                  
                  $carousel.prev = function () {
                      if (!$carousel)
                          return;
                      var i = lastIndex > 0 ? lastIndex - 1 : items.length - 1;
                      if (!angular.isNumber(i) || i < 0)
                          i = items.length - 1;
                      $carousel && $carousel.select(i, true);
                  };
                  $carousel.prevPage = function () {
                      if (!$carousel || ($carousel && $scope.$pageIndex == 0))
                          return;
                      
                      $carousel.goPage($scope.$pageIndex - 1);
                  };
                  $carousel.nextPage = function (evt) {
                      if (!$carousel || ($carousel && $scope.$totalPageIndex > 0 && $scope.$pageIndex >= $scope.$totalPageIndex))
                          return;
                      $carousel.goPage($scope.$pageIndex + 1);
                   
                  };
                  $carousel.showAllThumbs = function (evt) {
                      if (!$carousel)
                          return;
                      $scope.currentLimit = $scope.totalItems;
                      $carousel.visibleThumb = $scope.totalItems;
                      $carousel.$watchIndicator = false;
                      $element.addClass('shown-all-thumbs');
                  };
                  $carousel.goPage = function (_pageIndex) {
                      if (!$carousel)
                          return;
                      var totalIndex = ($scope.totalItems ? $scope.totalItems - $scope.totalRemoved : items.length) - 1;
                      
                      var pageSize = $scope.pageSize;
                      var _totalPageIndex = $scope.$totalPageIndex = totalPageIndex = parseInt(totalIndex / pageSize);
                      _pageIndex = _pageIndex < 0 ? 0 : _pageIndex > _totalPageIndex ? _totalPageIndex : _pageIndex;
                      
                      var pageStartIndex = (_pageIndex * pageSize) - 1;
                      if (pageStartIndex > totalIndex)
                          pageStartIndex = totalIndex;
                      var i = pageStartIndex + (lastIndex % pageSize);
                      if (i > totalIndex)
                          i = pageStartIndex;
                      if (!angular.isNumber(i) || i < 0) {
                          i = 0;
                          _pageIndex = 0;
                      }
                      $carousel && $carousel.select(i);
                  };
                  $carousel.addItem = function (item) {
                      items.push(item);
                      if (items.length === 1 || item.$index == lastIndex) {
                          item.active = true;
                      } else if (item.active) {
                          $carousel.select(items.indexOf(item));
                      }
                      $scope.totalAdded = $scope.totalAdded + 1;
                  };
                  $carousel.removeItem = function (item) {
                      if (!$carousel)
                          return;
                      var index = items.indexOf(item);
                      if (item.active && items.length > 1) {
                          var newActiveIndex = index == items.length - 1 ? index - 1 : index + 1;
                          $carousel && $carousel.select(newActiveIndex);
                      }
                      items.splice(index, 1);
                      $carousel.totalRemoved = $scope.totalRemoved = $scope.totalRemoved + 1;
                  };
                  $carousel.setIndicatorVisibility = function (_elm, _index) {
                      if ($carousel.visibleThumb > 0) {
                          var totalIndex = ($scope.totalItems ? $scope.totalItems - $scope.totalRemoved : items.length) - 1;
                          var visThumbs = $carousel.visibleThumb;
                          var minIndex = parseInt(lastIndex / (visThumbs - 1)) * (visThumbs - 1);
                          var maxIndex = minIndex + visThumbs;
                          if (maxIndex > totalIndex) {
                              maxIndex = totalIndex + 1;
                              minIndex = maxIndex - visThumbs;
                          }
                          if (minIndex == lastIndex && prevIndex > lastIndex && minIndex >= (visThumbs -1)) {
                              minIndex = minIndex - 1;
                              maxIndex = maxIndex + visThumbs;
                          }

                          if (minIndex <= _index && _index < maxIndex) {
                              _elm.css('display', '');
                          }
                          else {
                              _elm.css('display', 'none');
                          }
                              
                      }
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
                  $scope.$on('$destroy', function () {
                      $carousel && ($carousel = null);
                  });
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
            scope: {
                pageSize: '=?',
                totalItems: '=?',
                thumbSize: '=?'
            },
            templateUrl: 'carousel/carousel.tpl.html',
            controller: ['$scope', '$element', '$attrs', function ($scope, $element, $attrs) {
                var carWidth = $element.width() ? $element.width() : window.innerWidth;
                var pageSize = 10;
                $scope.thumbSize = $scope.thumbSize || -1;
                if ($scope.thumbSize < 1)
                    pageSize = $scope.pageSize = $scope.pageSize || 10;
                else
                    pageSize = $scope.pageSize = parseInt($scope.pageSize ? $scope.pageSize : (carWidth / ($scope.thumbSize > 0 ? $scope.thumbSize : 70)));
                
                $scope.totalItems = $scope.totalItems || 0;
                $scope.totalValidItems = $scope.totalItems;
                $scope.currentLimit = pageSize;
                var options = {};
                angular.forEach(['effect', 'prevEffect', 'speed', 'interval', 'keyboard', 'hoverStop', 'autoPlay', 'outerWidth', 'innerHeight', 'maxHeightRate', 'hideIndicator', 'showPageButtons', 'allThumbsButton'],
                    function (key) {
                        angular.isDefined($attrs[key]) && (options[key] = $helpers.parseConstant($attrs[key]))
                    })
                var ctrl = new $carousel($element, $scope, options);
                ctrl.thumbSize = $scope.thumbSize;
                ctrl.pageSize = pageSize;
                if ($scope.thumbSize < 1)
                    ctrl.thumbOuterWidth = carWidth / pageSize;
                $scope.carCtrl = ctrl;
                $scope.$on('$destroy', function () {
                    ctrl && (ctrl = null);
                });
                return ctrl;
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
                    scope.prevEffect = controller.$options.prevEffect;
                    scope.speed = controller.$options.speed;
                    angular.isDefined(attrs.effect) && (scope.effect = attrs.effect)
                    angular.isDefined(attrs.speed) && (scope.effect = attrs.speed)
                    scope.$order = angular.isDefined(attrs.order) ? parseFloat(attrs.order) : scope.$index;
                    scope.select = function (index) {
                        index = index || scope.$index || 0;
                        controller.select(index);
                    };
                    controller.addItem(scope);
                    scope.$on('$destroy', function () {
                        controller && controller.removeItem(scope);
                    });
                    scope.$parent.$remove = function (index) {
                        controller && controller.removeItem(scope);
                    };
                    scope.$transcludeFn = transclude;
                };
            }
        };
    }])

    .directive('indicatorTransclude', ['$compile', function ($compile) {
        return {
            restrict: 'A',
            require: '^nqCarousel',
            link: function (scope, elm, attrs, controller) {
                var item = scope.$eval(attrs.indicatorTransclude);
                if (controller.$watchIndicator && scope.$first) {
                    if (controller.thumbSize < 1) {
                        var indicator = elm.closest('.carousel-indicators');
                        var width = parseInt(indicator.width() / controller.pageSize);
                        controller.thumbWidth = width;
                        controller.visibleThumb = controller.pageSize;
                    } else {
                        controller.thumbWidth = elm.width();
                        controller.visibleThumb = parseInt((elm.closest('.carousel-indicators').innerWidth()) / controller.thumbWidth)
                    }
                    controller.thumbHeight = elm.height();
                }
                elm.css('width', controller.thumbWidth);
                scope.$watch(function () { return item.thumbImage }, function (image) {
                    if (image) {
                        var thumbImg = angular.isElement(image) ? image : angular.element(image);
                        if (!thumbImg.hasClass('thumb-image')) {
                            thumbImg.on('load', function () {
                                var c = document.createElement("canvas"),
                                    w = controller.thumbWidth,
                                    h = controller.thumbHeight,
                                ow = controller.$options.outherWidth;
                                c.width = w; c.height = h;
                                c.getContext("2d").drawImage(this, 0, 0, w, h);

                                elm.html(c)
                            });
                        } else {
                                elm.html(image)
                        }
                        
                    }
                });
                if (controller.$watchIndicator) {
                   var listener = scope.$watch(function () { return controller.$lastIndex }, function (index) {
                       controller.setIndicatorVisibility(elm, scope.$index);
                       if (!controller.$watchIndicator) {
                           elm.css('display', '');
                           listener();
                       }
                    });
                   var listener2 = scope.$watch(function () { return controller.totalRemoved }, function (val) {
                        if (val)
                            controller.setIndicatorVisibility(elm, scope.$index);
                        if (!controller.$watchIndicator) {
                            elm.css('display', '');
                            listener2();
                        }
                    });
                }
            }
        };
    }])
    .directive('carouselItemTransclude', ['$animate', '$timeout', function ($animate, $timeout) {
        return {
            restrict: 'A',
            require: ['^carouselItem', '^nqCarousel'],
            link: function (scope, elm, attrs, controller) {
                scope.$watch('$transcludeFn', function (value) {
                    scope.$transcludeFn(scope.$parent, function (contents) {
                        
                        angular.forEach(contents, function (node) {
                            elm.append(node);
                            var nodeEl = angular.element(node)
                            if (nodeEl.hasClass('thumb-image')) {
                                scope.noCanvas = true;
                                scope.thumbImage = nodeEl;
                            }
                            else
                                elm.append(node);
                        });
                        if (!scope.thumbImage) {
                            var thImg = elm.find('.generate-thumb');
                            scope.thumbImage = thImg;
                        }
                       
                    });
                });
                scope.$watch('active', function (value) {
                    var ctrl = controller[1];
                    value ? show(ctrl.isPrev) : hide(ctrl.isPrev);
                });
                function show(isPrev) {
                    isPrev && elm.removeClass(scope.effect);
                    elm.show();
                    if (scope.effect) {
                        elm.addClass(scope.speed)
                        $animate.addClass(elm, isPrev ? scope.prevEffect : scope.effect).then(function () {
                        });
                    }

                }
                function hide(isPrev) {
                    if (scope.effect) {
                        if (isPrev) {
                            elm.removeClass(scope.effect);
                            elm.addClass(scope.prevEffect);
                        }
                        $animate.removeClass(elm, isPrev ? scope.prevEffect : scope.effect).then(function () {
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