'use strict';
if (/chrome/.test(navigator.userAgent.toLowerCase()))
    angular.element('html').addClass('webkitscrollbar');
angular.module('ngQuantum.scrollbar', ['ngQuantum.services.helpers', 'ngQuantum.services.mouse'])
    .provider('$scrollbar', function () {
        var defaults = this.defaults = {
            barSize: 'slimest', // number in pixel or slimmest|slim|normal|thick|thickest
            barOffset: 10,
            maxWidth: false,
            placementOffset: false,
            maxHeight: false,
            useWebkit: false,
            showButtons: false,
            hideRail: false,
            padHorizontal: false,
            allDigest: false,
            step: 30,
            duration: 200,
            theme: false,
            allTags: true, // if set false tags like table, ul, ol would be ignored for scrolling,
            forceWrapper: false, //deprecated
            forceScroll: false, //deprecated
            wrapContainer: false,
            axis: 'y',
            verticalPlacement: 'right', //left|right|both
            horizontalPlacement: 'bottom', //top|bottom|both
            visible: false,
            keyboard: true
        };
        this.$get = ['$mouse','$window',
          '$compile', '$timeout',
          '$q', '$rootScope', '$helpers', function ($mouse, $window, $compile, $timeout, $q, $rootScope, $helpers) {
              var isTouch = 'createTouch' in $window.document;
              function Factory(element, config, attr) {
                  var $bar = {};
                  config = $helpers.parseOptions(attr, config);
                  var options = angular.extend({}, defaults, config);
                  var scope = options.$scope && options.$scope.$new() || $rootScope.$new(), $x = {}, $y = {}, $size = {}, $container, $barListItem;
                  $helpers.observeOptions(attr, options);
                  $bar.$scope = scope;
                  $bar.$options = options;
                  scope.scrollTop = 0, scope.scrollLeft = 0;
                  element.data('$scrollBar', $bar);
                  angular.forEach(['increase', 'decrease'], function (value) {
                      scope['$' + value] = function (axis) {
                          scope.$$postDigest(function () {
                              $bar[value](axis);
                          });
                      }
                  });
                  $bar.increase = function (axis) {
                      var a = axis == 'y' ? $y : $x;
                      var offval = options.step + (axis == 'y' ? scope.scrollTop : scope.scrollLeft),
                          tval = a.stepSize + a.thumbStep;
                      axis == 'y' ? scrollTop(offval, tval) : scrollLeft(offval, tval);
                  }
                  $bar.decrease = function (axis) {
                      var a = axis == 'y' ? $y : $x;
                      var offval = (axis == 'y' ? scope.scrollTop : scope.scrollLeft) - options.step,
                          tval = a.stepSize - a.thumbStep;
                      axis == 'y' ? scrollTop(offval, tval) : scrollLeft(offval, tval);
                  }
                  $bar.init = function () {
                      optimize();
                      buildTemplate();
                      if(!$bar.$eventsBuilded)
                          buildEvents()
                  }
                  $bar.destroy = function () {
                      element && element.off();
                      angular.element(document).off('.scrollbar');
                      angular.element(document).off('keydown', $bar.$onKeyDown);
                      scope.$destroy();
                      $bar = null;
                  }
                  $bar.$onKeyDown = function (e) {
                      if (!/(37|38|39|40)/.test(e.keyCode))
                          return;
                      if (!e.isDefaultPrevented()) {
                          e.preventDefault();
                          var code = e.keyCode, evt = e;
                          switch (code) {
                              case 37:
                              case 38:
                                  evt.deltaY = 1
                                  break
                              case 39:
                              case 40:
                                  evt.deltaY = -1
                                  break;
                          }

                          mouseWheel(evt);
                      }
                      

                  };
                  $bar.scrollStepTop = function (val) {
                      if (angular.isNumber(val)) {
                          var tval = ((val / options.step) * $y.thumbStep) + $y.stepSize;
                          scrollTop(scope.scrollTop + val, tval);
                      }

                  }
                  $bar.scrollTo = function (val, axis, diff) {
                      if (angular.isNumber(val)) {
                          !axis && (axis = 'y');
                          var a = axis != 'x' ? $y : $x;
                          var tval = (val / options.step) * a.thumbStep;
                          axis == 'y' ? scrollTop(val, tval) : scrollLeft(val, tval);
                      }
                      else {
                          var elm = [];
                          if (angular.isString(val))
                              elm = element.find(val);
                          else if (angular.isElement(val))
                              elm = val;
                          if (elm.length) {
                              if (/y|both/.test(options.axis)) {
                                  setTimeout(function () {
                                      var lval = elm[0].offsetTop - (diff || 0);
                                      var tval = (lval / options.step) * $y.thumbStep;
                                      scrollTop(lval, tval);
                                  }, 0)
                                  
                              }
                              if (/x|both/.test(options.axis)) {
                                  setTimeout(function () {
                                      var lval = elm[0].offsetLeft;
                                      var tval = (lval / options.step) * $x.thumbStep;
                                      scrollLeft(lval, tval);
                                  }, 0)
                                  
                              }
                          }
                      }
                  }
                  $bar.refresh = function (timeout) {
                      timeout = timeout || 700;
                      setTimeout(function () {
                          findSizes();
                          watchResult();
                      }, timeout)
                      
                  };
                  function optimize() {
                      if (!/y|x|both/.test(options.axis))
                          options.axis = 'y';
                      !angular.isNumber(options.barOffset) && (options.barOffset = 10)
                      !angular.isNumber(options.step) && (options.step = 30)

                      if (!/slimmest|slim|normal|thick|thickest/.test(options.barSize)) {
                          $size.barSize = parseInt(options.barSize) || 6;
                      }
                      else {
                          scope.sizeClass = 'bar-' + options.barSize
                          switch (options.barSize) {
                              case 'slimmest':
                                  $size.barSize = 4;
                                  break;
                              case 'slim':
                                  $size.barSize = 8;
                                  break;
                              case 'normal':
                                  $size.barSize = 12;
                                  break;
                              case 'thick':
                                  $size.barSize = 16;
                                  break;
                              case 'thickest':
                                  $size.barSize = 20;
                                  break;
                              default:
                                  $size.barSize = 6;
                                  break;
                          }
                      }
                      if ($size.barSize <= 12)
                          $size.buttonSize = 12;
                      else
                          $size.buttonSize = $size.barSize;
                      if (options.axis == 'both' && options.barOffset < $size.buttonSize)
                          options.barOffset = $size.buttonSize + 5;
                      if (options.useWebkit && angular.element('html').hasClass('webkitscrollbar'))
                          scope.useWebkit = true;
                  }
                  
                  function buildTemplate() {
                      if ($bar && $bar.$templateReady)
                          return;
                      $bar.$templateReady = true;
                      checkAdaptable();
                      $container.addClass('scrollable')
                      var pos = $container.css('position');
                      scope.elPosition = pos;
                      if (scope.useWebkit) {
                          if (/y|both/.test(options.axis))
                              $container.css('overflow-y', 'auto');
                          if (/x|both/.test(options.axis))
                              $container.css('overflow-x', 'auto');
                          return;
                      }
                      if (options.axis == 'y')
                          $container.css('overflow-y', 'hidden');
                      else if (options.axis == 'x')
                          $container.css('overflow-x', 'hidden');
                      else
                          $container.css('overflow', 'hidden');
                      if (!/relative|absolute|fixed/.test(pos)) {
                          $container.css('position', 'relative')
                      }
                      var barBody = $barListItem ? $barListItem : $container;
                      if (/y|both/.test(options.axis)) {
                          $y.bar = angular.element('<div class="scrollbar vertical-bar"></div>').appendTo(barBody).addClass('bar-' + options.verticalPlacement);
                          $y.track = angular.element('<div class="scrollbar-track"></div>').appendTo($y.bar);
                          $y.trackInner = angular.element('<div class="track-inner"></div>').appendTo($y.track).css('width', $size.barSize);
                          $y.thumb = angular.element('<div class="scrollbar-thumb"></div>').appendTo($y.trackInner);
                          if (options.showButtons) {
                              $y.increment = angular.element('<a class="bar-increment" ng-click="$increase(\'y\')"><span></span></a>').appendTo($y.bar).css('height', $size.buttonSize)
                              $y.decrement = angular.element('<a class="bar-decrement" ng-click="$decrease(\'y\')"><span></span></a>').prependTo($y.bar).css('height', $size.buttonSize)
                              $compile($y.bar)(scope);
                          }
                          if (angular.isNumber(options.placementOffset)) {
                              $y.bar.css(options.verticalPlacement, options.placementOffset)
                          }
                          $y.placementOffset = parseInt($y.bar.css(options.verticalPlacement)) || 0;
                          if (!isTouch) {
                              $y.trackInner.on('click', function (evt) {
                                  if (evt.target == this) {
                                      var tp = evt.offsetY
                                      if (tp > $y.stepSize)
                                          tp = tp - $y.thumb.height();
                                      var step = parseInt(tp / $y.thumbStep);
                                      var top = options.step * step, ttop = step * $y.thumbStep;
                                      scrollTop(top, ttop);
                                  }
                              })
                              $y.thumb.on('mousedown', function (e) {
                                  var last = $y.stepSize;
                                  if (e.which != 1)
                                      return true;
                                  angular.element(document).on('mousemove.scrollbar', function (evt) {
                                      var i = (evt.pageY - e.pageY) + last;
                                      var step = i / $y.thumbStep;
                                      var top = (options.step * step), ttop = (step * $y.thumbStep);
                                      scrollTop(top, ttop);
                                  })
                              })
                          }   
                      }
                      if (/x|both/.test(options.axis)) {
                          var pad = options.showButtons ? $size.buttonSize : $size.barSize
                          $x.bar = angular.element('<div class="scrollbar horizontal-bar"></div>').appendTo(barBody).addClass('bar-' + options.horizontalPlacement);
                          $x.track = angular.element('<div class="scrollbar-track"></div>').appendTo($x.bar);
                          $x.trackInner = angular.element('<div class="track-inner"></div>').appendTo($x.track).css('height', $size.barSize);
                          $x.thumb = angular.element('<div class="scrollbar-thumb"></div>').appendTo($x.trackInner);
                          if (options.showButtons) {
                              $x.increment = angular.element('<a class="bar-increment" ng-click="$increase(\'x\')"><span></span></a>').appendTo($x.bar)
                              $x.decrement = angular.element('<a class="bar-decrement" ng-click="$decrease(\'x\')"><span></span></a>').prependTo($x.bar)
                              $compile($x.bar)(scope)

                          }
                          if (options.padHorizontal)
                              if (options.horizontalPlacement == 'top') {
                                  var pt = parseInt($container.css('padding-top')) || 0;
                                  $container.css('padding-top', pad + pt + 10)
                              }
                              else {
                                  var pt = parseInt($container.css('padding-bottom')) || 0;
                                  $container.css('padding-bottom', pad + pt + 10)
                              }
                          if (angular.isNumber(options.placementOffset)) {
                              $x.bar.css(options.horizontalPlacement, options.placementOffset)
                          }
                          $x.placementOffset = parseInt($x.bar.css(options.horizontalPlacement)) || 0;
                          if (!isTouch) {
                              $x.trackInner.on('click', function (evt) {
                                  if (evt.target == this) {
                                      var tp = evt.offsetX
                                      if (tp > $x.stepSize)
                                          tp = tp - $x.thumb.width();
                                      var step = parseInt(tp / $x.thumbStep);
                                      var left = options.step * step, tleft = step * $x.thumbStep;
                                      scrollLeft(left, tleft);
                                  }
                              })
                              $x.thumb.on('mousedown', function (e) {
                                  angular.element(document).off('.scrollbar')
                                  var last = $x.stepSize;
                                  if (e.which != 1)
                                      return true;
                                  angular.element(document).on('mousemove.scrollbar', function (evt) {
                                      var i = (evt.pageX - e.pageX) + last;
                                      var step = i / $x.thumbStep;
                                      var left = (options.step * step), tleft = (step * $x.thumbStep);
                                      scrollLeft(left, tleft);
                                  })
                              })
                          }
                          
                      }
                    !isTouch &&  angular.element('body').on('mouseup', function (evt) {
                          angular.element(document).off('.scrollbar')
                      });
                      
                      
                      $container.addClass('show-bar-button')
                  }
                  function buildEvents() {
                      if (!scope.useWebkit || isTouch) {
                          if (options.allDigest)
                              scope.$watch(function (newVal, oldVal) {
                                  setTimeout(function () {
                                      watchResult();
                                  }, 0)
                              })
                          else {
                              var el = $container || element;
                              if (/y|both/.test(options.axis))
                                  scope.$watch(function () { return el[0].scrollHeight }, function (newVal, oldVal) {
                                      setTimeout(function () {
                                          watchResult();
                                      }, 0)

                                  })
                              if (/x|both/.test(options.axis))
                                  scope.$watch(function () { return el[0].scrollWidth }, function (newVal, oldVal) {
                                      setTimeout(function () {
                                          watchResult();
                                      }, 0)
                                  })
                          }

                          if (!isTouch) {
                              $mouse.onWheel(element, mouseWheel);
                              element.on('mouseenter', function (e) {
                                  if (/y|both/.test(options.axis) && !scope._scrollHeight)
                                      watchResult();
                                  if (/x|both/.test(options.axis) && !scope._scrollWidth)
                                      watchResult();
                                  if (options.keyboard) {
                                      angular.element(document).off('.scrollbarkeyboard', $bar.$onKeyDown);
                                      angular.element(document).on('keydown.scrollbarkeyboard', $bar.$onKeyDown);
                                  }

                              })
                              options.keyboard && element.on('mouseleave', function (e) {
                                  angular.element(document).off('keydown', $bar.$onKeyDown);
                              })
                          }
                          else {
                              element.on('touchstart', function (event) {
                                  var lastY = $y.stepSize || 0, lastX = $x.stepSize || 0;
                                  var sTouch = event.originalEvent.touches[0] || event.originalEvent.changedTouches[0];
                                  $y.bar && $y.bar.css('visibility', 'visible');
                                  $x.bar && $x.bar.css('visibility', 'visible');
                                  angular.element(document).on('touchmove.scrollbar', function (evt) {
                                      var touch = evt.originalEvent.touches[0] || evt.originalEvent.changedTouches[0];
                                      var newY = (sTouch.pageY - touch.pageY) + lastY;
                                      var newX = (sTouch.pageX - touch.pageX) + lastX;
                                      var retuned = false;
                                      if (/y|both/.test(options.axis)) {
                                          if (!$y.maxOffset && options.axis == 'y')
                                              retuned = true;
                                          if (scope.scrollTop == $y.maxOffset && sTouch.pageY > touch.pageY)
                                              retuned = true;
                                          if (scope.scrollTop == 0 && sTouch.pageY < touch.pageY)
                                              retuned = true;
                                      }
                                      if (/x|both/.test(options.axis)) {
                                          if (!$x.maxOffset && options.axis == 'x')
                                              retuned = true;
                                          if (scope.scrollLeft == $x.maxOffset && sTouch.pageX > touch.pageX)
                                              retuned = true;
                                          if (scope.scrollLeft == 0 && sTouch.pageX > touch.pageX)
                                              retuned = true;
                                      }
                                      if (options.axis == 'both' && !$y.maxOffset && !$x.maxOffset)
                                          retuned = true;
                                      if (retuned)
                                          return true;
                                      event.preventDefault();
                                      evt.preventDefault();
                                      if (/y|both/.test(options.axis)) {
                                          var step = newY / $y.thumbStep;
                                          var top = (options.step * step), ttop = (step * $y.thumbStep);
                                          scrollTop(top, ttop);
                                      }
                                      if (/x|both/.test(options.axis)) {
                                          var step = newX / $x.thumbStep;
                                          var left = (options.step * step), tleft = (step * $x.thumbStep);
                                          scrollLeft(left, tleft);
                                      }

                                  })
                              })
                              angular.element(document).on('touchend.scrollbar touchcancel.scrollbar', function (evt) {
                                  $y.bar && $y.bar.css('visibility', 'hidden');
                                  $x.bar && $x.bar.css('visibility', 'hidden');
                                  angular.element(document).off('touchmove')
                              })
                          }


                      }
                      $bar.$eventsBuilded = true;
                  }
                  
                  function watchResult() {
                      if ($container && $container.height() < 0 || !$container && element && element.height() < 1)
                          return;
                      $y.bar && $y.bar.hide();
                      $x.bar && $x.bar.hide();
                      var tag = element[0].tagName, width = 0, height = 0;
                      var pad = options.showButtons ? $size.buttonSize : $size.barSize;
                      if (/td|th|table/.test(tag.toLowerCase())) {
                          if ($container) {
                              height = $container[0].scrollHeight - pad;
                              width = $container[0].scrollWidth;
                          }
                          else {
                              height = element[0].clientHeight - pad;
                              width = element[0].clientWidth;
                          }
                      }
                      else {
                          height = element[0].scrollHeight - pad;
                          width = element[0].scrollWidth;
                      }
                      if (/y|both/.test(options.axis)) {
                          if (height > 0 && scope.maxHeight < height && $container && $container.outerHeight() >= scope.maxHeight && ($container[0].scrollHeight > $container[0].clientHeight)) {
                                  scope._scrollHeight = height, applyY(height);
                              $y.bar && $y.bar.css('visibilty', '').show();
                              $y.bar.visible = true;
                          } else {
                              $container.scrollTop(0)
                              $y.bar && $y.bar.css('visibilty', 'hidden');
                              $y.bar.visible = false;
                          }
                          if (scope.scrollTop > 0 && $container.height() < height) {
                              $container.scrollTop(scope.scrollTop);
                          }
                      }
                      if (/x|both/.test(options.axis)) {
                          if (width > 0 && scope.maxWidth < width && $container.outerWidth() >= scope.maxWidth && $container && ($container[0].scrollWidth > $container[0].clientWidth)) {
                                  scope._scrollWidth = width, applyX(width);
                              $x.bar && $x.bar.css('visibilty', '').show();
                              $x.bar.visible = true;
                          } else {
                              $container.scrollLeft(0)
                              $x.bar && $x.bar.css('visibilty', 'hidden')
                              $x.bar.visible = false;
                          };


                          if (scope.scrollLeft > 0 && $container.width() < width) {
                              $container.scrollLeft(scope.scrollLeft);
                          }
                      }
                  }
                  function mouseWheel(event) {
                      if (options.axis == 'y') {
                          if (!$y.bar.visible)
                              return true;
                          if (!scope._scrollHeight)
                              watchResult();
                          if (!$y.maxOffset)
                              return true;
                          if (scope.scrollTop >= $y.maxOffset && event.deltaY < 0)
                              return true;
                          
                          if (scope.scrollTop == 0 && event.deltaY > 0)
                              return true;
                          event.preventDefault();
                          wheelTop(event)
                      }
                      else if (options.axis == 'x') {
                          if (!$x.bar.visible)
                              return true;
                          if (!$x.maxOffset)
                              return true;
                          if (scope.scrollLeft >= $x.maxOffset && event.deltaY < 0)
                              return true;
                          if (scope.scrollLeft == 0 && event.deltaY > 0)
                              return true;
                          event.preventDefault();
                          wheelLeft(event)
                      }
                      else if (options.axis == 'both') {
                          if ($y.maxOffset && scope.scrollTop < $y.maxOffset && event.deltaY < 0) {
                              event.preventDefault();
                              wheelTop(event)
                          }
                          else if ($x.maxOffset && scope.scrollLeft < $x.maxOffset && event.deltaY < 0) {
                              event.preventDefault();
                              wheelLeft(event)
                          }
                          else if (scope.scrollLeft > 0 && event.deltaY > 0) {
                              event.preventDefault();
                              wheelLeft(event)
                          }
                          else if (scope.scrollTop > 0 && event.deltaY > 0) {
                              event.preventDefault();
                              wheelTop(event)
                          }
                          else
                              return true;
                      }
                  }
                  function wheelTop(event) {
                      var top = scope.scrollTop;
                      top = event.deltaY > 0 ? top - options.step : top + options.step;
                      var mtop = event.deltaY > 0 ? $y.stepSize - $y.thumbStep : $y.stepSize + $y.thumbStep;
                      
                      scrollTop(top, mtop)
                  }
                  function scrollTop(btop, ttop) {
                      btop = validateOffset(btop, $y.maxOffset)
                      ttop = validateOffset(ttop, $y.maxThumbOffset);
                      $y.stepSize = ttop;
                      $container.scrollTop(btop);
                      $y.thumb && $y.thumb.css('top', ttop + 'px');
                      $y.bar && $y.bar.css('top', btop + options.barOffset + 'px')
                      if ($x.bar) {
                          $x.bar.css(options.horizontalPlacement, -(btop - $x.placementOffset))
                      }
                      scope.scrollTop = btop;
                  }
                  function wheelLeft(event) {
                      var left = scope.scrollLeft;
                      left = event.deltaY > 0 ? left - options.step : left + options.step;
                      var mleft = event.deltaY > 0 ? $x.stepSize - $x.thumbStep : $x.stepSize + $x.thumbStep;

                      scrollLeft(left, mleft);
                  }
                  function scrollLeft(left, mleft) {
                      left = validateOffset(left, $x.maxOffset)
                      mleft = validateOffset(mleft, $x.maxThumbOffset)
                      $x.stepSize = mleft;
                      $container.scrollLeft(left);
                      $x.thumb && $x.thumb.css('left', mleft + 'px');
                      $x.bar && $x.bar.css('left', left + options.barOffset + 'px')
                      if ($y.bar) {
                          $y.bar.css(options.verticalPlacement, -(left - $y.placementOffset))
                      }
                      scope.scrollLeft = left;

                  }
                  function validateOffset(val, max) {
                      var result = val;
                      if (val > max)
                          result = max + 0.1;
                      if (val < 0)
                          result = 0
                      return result;
                  }
                  function barSizes(axis, newsize, elsize) {
                      var $a = axis, oldStepRange = ($a.stepSize && $a.thumbStep) && ($a.stepSize / $a.thumbStep);
                      var s = elsize,
                      bs = s - (2 * options.barOffset),
                       ts = s * s / newsize;
                      $a.barSize = bs;
                      $a.trackSize = bs;
                      if (options.showButtons) {
                          $a.trackSize = bs - ($size.buttonSize * 2) - 6;
                      }
                      $a.thumbSize = ts;
                      $a.maxOffset = newsize - s;
                      var mts = $a.trackSize - ts;
                      $a.maxThumbOffset = mts;
                      $a.thumbStep = (($a.trackSize - ts) / ($a.maxOffset / options.step))
                      $a.stepSize = oldStepRange ? (oldStepRange * $a.thumbStep) : 0;
                      $a.stepSize > $a.maxThumbOffset && ($a.stepSize = $a.maxThumbOffset);
                      return $a;
                  }
                  function checkAdaptable() {
                      var tag = element[0].tagName;
                      findSizes();
                      if (/ul|ol/.test(tag.toLowerCase()) && !scope.useWebkit) {
                          $barListItem = angular.element('<li class="scrollbar-list-item"></li>').appendTo(element);
                          $container = element;
                      }
                      else if (tag.toLowerCase() == 'table') {
                          $container = angular.element('<div class="scrollbar-container"></div>').insertBefore(element).append(element);
                          applySizes();
                      }
                      else if (/td|th/.test(tag.toLowerCase())) {
                          $container = angular.element('<div class="scrollbar-container"></div>').appendTo(element);
                          applySizes();
                      }
                      else {
                          $container = element;
                          if (options.maxWidth || options.maxHeight)
                              applySizes();
                      }
                      scope.sizeClass && $container.addClass(scope.sizeClass);
                      options.theme && $container.addClass('bar-' + options.theme);
                      options.visible && $container.addClass('bar-visible');
                      options.hideRail && $container.addClass('hide-rail');
                      !scope.useWebkit && $container.addClass('no-webkit');
                      !options.showButtons && $container.addClass('hide-bar-button');
                  }
                  function findSizes() {
                      var exchild = false;
                      $size.width = options.maxWidth ? options.maxWidth : element.css('max-width') || element.css('width');
                      $size.height = options.maxHeight ? options.maxHeight : element.css('max-height') || element.css('height');
                      scope.maxWidth = angular.isNumber($size.width) ? $size.width : angular.isString($size.width)
                          ? $size.width.indexOf('%') !== -1 ? (element.parent().innerWidth() * ((parseFloat($size.width) / 100) || 0)) : parseFloat($size.width) || 0 : 0;
                      scope.maxHeight = angular.isNumber($size.height) ? $size.height : angular.isString($size.height)
                          ? $size.height.indexOf('%') !== -1 ?
                          function () {
                              exchild = true;
                              return element.parent().innerHeight() * ((parseFloat($size.height) / 100) || 0)
                          }() : parseFloat($size.height) || 0 : 0;
                  }
                  function applySizes(elm) {
                      var cont = elm ? elm : $container;
                      if (/y|both/.test(options.axis)) {
                          cont.css('max-height', $size.height)
                      }
                      if (/x|both/.test(options.axis))
                          cont.css('max-width', $size.width)
                  }
                  function applyY(newval) {
                      newval = newval || $container[0].scrollHeight;
                      
                      var maxtop = $container[0].scrollHeight - $container.outerHeight();
                      if (maxtop < scope.scrollTop)
                          scope.scrollTop = maxtop;
                      if (newval && /y|both/.test(options.axis)) {
                          var h = $container.outerHeight(true);
                          $y = barSizes($y, newval, h);
                          if (!$bar || !$bar.$templateReady)
                              buildTemplate();
                          $y.bar.css({
                              top: (scope.scrollTop || 0) + options.barOffset + 'px',
                              bottom: options.barOffset + 'px',
                              height: $y.barSize + 'px'
                          })
                          $y.thumb.css({
                              height: $y.thumbSize + 'px',
                              top: $y.stepSize + 'px'
                          })
                          $y.track.css({
                              height: $y.trackSize + 6 + 'px'
                          })
                      }
                  }
                  function applyX(newval) {
                      newval = newval || $container[0].scrollWidth;
                      var maxleft = $container[0].scrollWidth - $container.outerWidth();
                      if (maxleft < scope.scrollLeft)
                          scope.scrollTop = maxleft;
                      if (newval && /x|both/.test(options.axis)) {
                          var w = $container.outerWidth(true)
                          $x = barSizes($x, newval, w);
                          
                          if (!$bar.$templateReady)
                              buildTemplate();
                          $x.bar.css({
                              left: (scope.scrollLeft || 0) + options.barOffset + 'px',
                              right: options.barOffset + 'px',
                              width: $x.barSize + 'px'
                          })
                          $x.thumb.css({
                              width: $x.thumbSize + 'px',
                              left: $x.stepSize + 'px'
                          })
                          $x.track.css({
                              width: $x.trackSize + 6 + 'px'
                          })
                      }
                  }
                  options.$scope && options.$scope.$on('$destroy', function () {
                      $bar.destroy();

                  })
                  var windowResize = function () {
                      $timeout(function () {
                          $bar.refresh(200)
                      }, 100)
                  };
                  
                  window.addResizeEvent(windowResize)
                  angular.element(document).ready(function () {
                      setTimeout(function () {
                          windowResize();
                      }, 200)
                      
                  })
                  $bar.init();
                  return $bar;
              };
              return Factory;
          }];
    })
    .directive('nqScroll',
      ['$scrollbar', '$timeout', function ($scrollbar, $timeout) {
          return {
              restrict: 'AC',
              isolate: false,
              link: function postLink(scope, element, attr) {
                  setTimeout(function () {
                      var bar = $scrollbar(element, { $scope: scope }, attr)
                      if (attr.barModel)
                          scope[attr.barModel] = bar;
                  }, 10)
              }
          };
      }])
