+function (window, angular, undefined) {
    var props = ['placement', 'delayShow', 'delayHide', 'effect', 'speed', 'theme', 'showArrow', 'holdHoverDelta'];
    var app  = angular.module('ngQuantum.popMaster', ['ngQuantum.services', 'ngQuantum.directives'])
        .provider('$popMaster', function () {
            var defaults = this.defaults = {
                effect: 'fade-in',
                speed: 'fastest',
                typeClass: 'pop',
                prefixEvent: 'pop',
                fireEmit: false,
                fireBroadcast: false,
                container: false,
                placement: 'top',
                offsetTop: 0,
                offsetLeft: 0,
                targetElement: false,
                template: angular.element('<div style="min-width:100px; padding:3px; border:1px; solid #aaa">You should prepare a content will replace here...</div>'),
                contentTemplate: false,
                trigger: 'hover focus',
                keyboard: false,
                html: false,
                show: false,
                clearExists: true,
                autoDestroy: true,
                displayReflow: true,
                theme: false,
                delayShow: 0,
                delayHide:0

            }
            this.$get = ['$window', '$rootScope', '$compile', '$parse', '$http', '$timeout', '$animate', '$placement', '$helpers', 'templateHelper','$q',
              function ($window, $rootScope, $compile, $parse, $http, $timeout, $animate, $placement, $helpers, templateHelper, $q) {
                  var trim = String.prototype.trim;
                  var isTouch = $helpers.isTouch();
                  var htmlReplaceRegExp = /ng-bind="/gi;
                  var $$rAF = $helpers.injectModule('$$rAF', 'ngAnimate');
                  function MasterFactory(element, config) {
                      var $master = {};
                      var reopen = false;
                      $master.$currentElement = undefined;
                      var options = $master.$options = config = angular.extend({}, defaults, config);
                      var lastplacement = options.placement;
                      var scope = $master.$scope = options.$scope || $rootScope.$new();
                      options.delayShow = $helpers.ensureNumber(options.delayShow),
                          options.delayHide = $helpers.ensureNumber(options.delayHide);
                      if (angular.isDefined(options.onShow) || angular.isDefined(options.onHide))
                          options.fireBroadcast = options.fireEmit = true;
                      if (!options.instanceName)
                          options.instanceName = options.typeClass
                      var originalOptions = $master.$originalOptions = angular.extend({}, options);
                      isTouch && (options.keyboard = false);
                      angular.forEach(['hide', 'show', 'toggle'], function (value) {
                          scope['$' + value] = function () {
                              scope.$$postDigest(function () {
                                  $master[value]();
                              });
                          }
                      })
                      $master.$isShown = scope.$isShown = false;
                      var timeout, hoverState, linker, $target, $container, $animateTarget, shouldCompile;


                      options.hasClick = false;
                      $master.init = function () {
                          if (element && options.trigger) {
                              $helpers.unBindTriggers(element, options.trigger, $master);
                              options.hasClick = $helpers.bindTriggers(element, options.trigger, $master);
                          }
                          if (!options.buildOnShow || options.show)
                              build();
                          if (options.show) {
                              scope.$$postDigest(function () {
                                  options.trigger === 'focus' && element ? element.focus() : $master.show();
                              });
                          }

                      }
                      function start() {
                          if (!options.buildOnShow || options.show) {
                              if (options.targetElement) {
                                  $master.$promise = templateHelper.fetchContent(options.targetElement);
                              }
                              else {
                                  if (angular.isElement(options.template))
                                      $master.$promise = templateHelper.fetchContent(options.template);
                                  else if (options.template.indexOf('.html') > -1)
                                      $master.$promise = templateHelper.fetchTemplate(options.template);
                                  else
                                      $master.$promise = templateHelper.fetchContent(angular.element(options.template));
                                  shouldCompile = true;
                              }
                              if (options.contentTemplate) {
                                  $master.$promise = templateHelper.fetchContentTemplate($master)
                                  shouldCompile = true;
                              }
                              $master.$promise.then(function (template) {
                                  if (angular.isElement(template))
                                      linker = template;
                                  else {
                                      if (options.html)
                                          template = template.replace(htmlReplaceRegExp, 'ng-bind-html="');
                                      if (options.htmlObject)
                                          template = template.replace(/ng-bind="content"/gi, 'nq-bind="content"')
                                                             .replace(/ng-bind-html="content"/gi, 'nq-bind="content"');
                                      linker = trim.apply(template);
                                  }
                                  options.buildOnShow = false;
                                  $master.init();
                              });
                          }
                          else
                              $master.$promise = $q.when($master.init());

                          if(element && options.readonly)
                              element.attr('readonly', true)
                      }

                      $master.destroy = function () {
                          $master.isDestroyed = true;
                          angular.element('body').off('click', onBodyClick);
                          if (element && options.trigger)
                              $helpers.unBindTriggers(element, options.trigger, $master);
                          if ($target) {
                              $target.off();
                              $target.remove();
                              $target = null;
                          }
                          !options.$scope && scope.$destroy();
                      };
                      $master.enter = function () {
                          var promise;
                          if (this !== $master)
                              $master.$currentElement = angular.element(this);
                          clearTimeout(timeout);
                          hoverState = 'in';
                          if (!options.delayShow) {
                              return $master.show();
                          }
                          timeout = setTimeout(function () {
                              if (hoverState === 'in')
                                  promise =   $master.show();
                          }, options.delayShow);
                          return promise;
                      };
                      $master.show = function (callback) {
                          var lasttheme;
                          var promise;
                          if (options.buildOnShow) {
                              options.show = true;
                              options.buildOnShow = false;
                              start();
                              return false;
                          }
                          options = $master.$options;
                          if (($master.$isShown || $master.$isShowing || $master.$isHidding))
                              return false;
                          if (options.clearExists)
                              $master.clearExists();
                          element = $master.$currentElement || element;
                          var modal;
                          if (element)
                              modal = element.closest('.modal');
                          if (modal && modal.length)
                              $container = modal;
                          var parent = $container ? $container : null;

                          var after = $container ? angular.element(parent[0].lastChild) : element;
                          if (after && after.length < 1)
                              after = null;
                          if (!$target || $target.length < 1)
                              build();
                          else
                              ensureFixedPlacement();
                          if (options.theme) {
                              $target.removeClass(lasttheme);
                              lasttheme = options.instanceName + '-' + options.theme;
                              $target.addClass(lasttheme);
                          }

                          if (angular.isFunction($master['beforeShow'])) {
                              $master['beforeShow'](element, $target)
                          }
                          $target.removeClass(lastplacement);
                          lastplacement = options.placement;
                          $target.css({ display: 'block', top: '', left: '' }).addClass(lastplacement);
                          $target.removeClass('with-arrow');

                          $master.$isShowing= true;
                          if (options.effect) {
                              if (options.displayReflow) {
                                  $target.addClass(options.effect).addClass(options.speed);
                                  if (options.effect.indexOf('collapse') > -1)
                                      $target.height($target.outerHeight());
                                  
                                  promise = $animate.enter($target, parent, after).then(function () {
                                      complateShow(callback)
                                      $master.fireEvents('show');
                                      $master.$isShowing = false;
                                      $timeout(function () {
                                          $master.$isShown = scope.$isShown = true;
                                      }, 0)
                                  });
                                  $$rAF && $$rAF($master.$applyPlacement);
                                  

                              }
                              else {
                                  $animateTarget.removeClass('ng-animate').removeClass(options.speed).removeClass(options.effect + '-remove').removeClass(options.effect + '-remove-active');
                                  $master.$applyPlacement();
                                  $animateTarget.addClass(options.speed);
                                  if (options.effect.indexOf('collapse') > -1)
                                      $animateTarget.height($target.outerHeight());

                                  $animateTarget.css('display', 'block');
                                  $animateTarget && $animateTarget.css('visibility', "");
                                  $target && $target.css('display', 'block')
                                  promise = $animate.addClass($animateTarget, options.effect).then(function () {
                                      complateShow(callback);
                                      $master.fireEvents('show');
                                      $animateTarget.show();
                                      $master.$isShowing = false;
                                      $timeout(function () {
                                          $master.$isShown = scope.$isShown = true;
                                      }, 0)

                                  });
                              }
                          }
                          else {
                              $master.$applyPlacement();
                              promise = $q.when(complateShow(callback))
                              $master.fireEvents('show');
                              $master.$isShowing = false;
                              $master.$isShown = scope.$isShown = true;
                          }

                          
                          scope.$$phase || scope.$digest();
                          if (/dropdown|popover|datepicker|colorpicker/.test(options.instanceName))
                              options.showArrow && $target.addClass('with-arrow')
                          return promise;
                      };
                      $master.leave = function (evt) {
                          var promise;
                          if (this !== $master)
                              $master.$currentElement = angular.element(this);
                          clearTimeout(timeout);
                          hoverState = 'out';
                          var exrtadelay = options.delayHide || 0;
                          if (evt && evt.type == 'mouseleave') {
                              $master.$isShowing = false;
                              !exrtadelay && (exrtadelay = 10);
                          }
                          timeout = setTimeout(function () {
                              if (hoverState === 'out') {
                                  promise = $master.hide();
                              }
                          }, exrtadelay);
                          return promise;
                      };
                      $master.hide = function (callback) {
                          
                          var promise;
                          if (!$target)
                              return false;
                          
                          if (!options.forceHide) {
                              if (!$master.$isShown)
                                  return false;
                              if ($master.$isShowing || $master.$isHidding)
                                  return false;
                          }
                          if ($master.beforeHide)
                              $master.beforeHide();
                          $master.$isHidding = true;
                          element = $master.$currentElement && $master.$currentElement || element;
                          if (options.effect) {
                              if (options.displayReflow)
                                  promise = $animate.leave($target).then(function () {
                                      complateHide(callback);
                                      if (options.effect.indexOf('collapse') > -1)
                                          $target.css('height', '');
                                      $master.fireEvents('hide')
                                      $timeout(function () {
                                          $master.$isShown = scope.$isShown = false;
                                      },0)
                                  });
                              else {
                                  $animateTarget.animationEnd(function (evt) {
                                      !$master.$isShowing && $animateTarget.hide();
                                     });
                                  $animateTarget && $animateTarget.css('visibility', "hidden");
                                  promise = $animate.removeClass($animateTarget, options.effect).then(function () {
                                     $animateTarget.hide();
                                      if ($target) {
                                          $target.hide();
                                          if (options.effect.indexOf('collapse') > -1)
                                              $animateTarget && $animateTarget.css('height', '');
                                          complateHide(callback);
                                          $master.fireEvents('hide');
                                          $timeout(function () {
                                              $master.$isShown = scope.$isShown = false;
                                          },0)
                                          
                                      }
                                  });
                              }
                          }
                          else {
                              if ($target) {
                                  $target.hide();
                                  promise = $q.when(complateHide(callback));
                                  $master.fireEvents('hide');
                                  $master.$isShown = scope.$isShown = false;
                              }
                          }
                          
                          scope.$$phase || scope.$digest();
                          return promise;

                      };
                      $master.toggle = function (elem) {
                          if (angular.isElement(elem))
                              $master.$currentElement = elem;
                          else if (this !== $master)
                              $master.$currentElement = angular.element(this);

                          $master.$isShown ? $master.leave() : $master.enter();
                      };
                      $master.focus = function () {
                          $target && $target.focus();
                      };
                      $master.clearExists = function () {
                          var exists = angular.element('.' + options.typeClass);
                          angular.forEach(exists, function (key, value) {
                              var sc = angular.element(key).scope();
                              sc && (sc.$id != scope.$id) && sc.$isShown && sc.$hide();

                          })
                      };
                      $master.$onKeyUp = function (evt) {
                          evt.which === 27 && $master.hide();
                      };
                      $master.$onFocusKeyUp = function (evt) {
                          evt.which === 27 && element.blur();
                      };
                      $master.$onFocusElementMouseDown = function (evt) {
                          if (options.isInput)
                              return true;
                          evt.preventDefault();
                          evt.stopPropagation();
                          $master.$isShown ? element.blur() : element.focus();
                      };
                      $master.$applyPlacement = function () {
                          if (options.inline)
                              return;
                          if ($container && options.container !== 'self')
                              $target.appendTo($container)
                          if (!options.preventReplace) {
                              $placement.applyPlacement($master.$toElement && $master.$toElement || $master.$currentElement && $master.$currentElement || element, $target, options)
                              $target && $target.css({ position: '' })
                          }

                      };
                      $master.fireEvents = function (status) {
                          if (options.fireEmit)
                              scope.$emit(options.prefixEvent + '.' + status, $target);
                          if (options.fireBroadcast)
                              scope.$broadcast(options.prefixEvent + '.' + status, $target);

                      };

                      $master.applyEvents = function (status) {

                          if (angular.isDefined(options.onShow))
                              scope.$on(options.prefixEvent + '.show', function () {
                                  options.$scope.$eval(options.onShow);
                                  options.$scope.$apply();
                              });
                          if (options.onHide)
                              scope.$on(options.prefixEvent + '.hide', function () {
                                  options.$scope.$eval(options.onHide);
                                  options.$scope.$apply();
                              });
                      };


                      
                      $rootScope.$on('$locationChangeStart', function (event, next, current) {
                          $master && $master.$isShown && $master.leave();
                      });
                      function onBodyClick(evt) {
                          if (evt.isDefaultPrevented())
                              return false;
                          var elm = $master.$currentElement && $master.$currentElement || element;
                          if (evt.target === elm[0])
                              return false;
                          else if (elm.has(angular.element(evt.target)))
                              return false;
                          else if ((options.multiple || options.overseeingTarget) && (evt.target == $master.$target[0] || $master.$target.has(evt.target)))
                              return false;
                          return evt.target !== elm[0] && $master.leave();
                      }
                      function outerHoverTrigger(evt) {
                          if ($master.$target[0] == evt.target || $master.$target.has(angular.element(evt.target))) {
                              if (evt.type == 'mouseenter')
                                  return hoverState = 'in';
                              else if (evt.type == 'mouseleave') {
                                  return $master.leave();
                              }
                          }
                      }
                      function build() {
                          if (options.container === 'self') {
                              $container = element;
                          } else if (options.container) {
                              var modal;
                              if (element)
                                  modal = element.closest('.modal');
                              if (modal && modal.length)
                                  $container = modal;
                              else
                                  $container = angular.isElement(options.container) ? options.container : angular.element(options.container);
                          }
                          if (!element && (!$container || $container.length < 1))
                              $container = angular.element('body');
                          $target = $master.$target = shouldCompile ? $compile(linker)(scope, function (clonedElement, scope) {
                          }) : linker;
                          ensureFixedPlacement();
                          scrollCheck();
                          $target.addClass('pop-master')
                          if (options.typeClass)
                              $target.addClass(options.typeClass)
                          if (options.displayReflow && options.effect) {
                              if ($target)
                                  $target.remove();
                          }
                          else {
                              $target.hide();
                              if ($container) {
                                  if (/input|button/.test($container[0].tagName.toLowerCase())) {
                                      $container.after($target)
                                  } else
                                      $container.append($target);
                              }
                              else
                                  element.after($target)
                          }
                          $master.applyEvents();

                          if (options.animateTarget) {
                              $animateTarget = $target.find(options.animateTarget)
                              if ($animateTarget.length < 0)
                                  $animateTarget = $target
                              else
                                  $master.$animateTarget = $animateTarget;
                          }
                          else {
                              $animateTarget = $target
                          }

                          scope.builded = true;
                          if (!$target.data('$scope'))
                              $target.data('$scope', scope);
                      }
                      function complateHide(callback) {
                          $master.$hoverShown = false;
                          if (options.keyboard && !options.isInput) {
                              angular.element(document).off('keyup', $master.$onKeyUp);
                              angular.element(document).off('keyup', $master.$onFocusKeyUp);
                          }
                          if (options.blur && options.trigger === 'focus') {
                              element && element.blur();
                          }
                          element && element.removeClass('active')
                          if (options.clearExists && (options.hasClick || options.clearStrict)) {
                              angular.element('body').off('click', onBodyClick)
                          }
                          if (options.holdHoverDelta)
                              $target.off('mouseenter mouseleave', outerHoverTrigger);
                          callback && callback.call($master);
                          $target && $target.css({ top: '', left: '' }).removeClass(lastplacement).removeClass(options.speed);
                          if (options.theme)
                              $target.removeClass(options.theme).removeClass(options.instanceName + '-' +options.theme);
                          $master.$isHidding = false;

                      }
                      function complateShow(callback) {
                          $master.$hoverShown = true;
                          if (options.keyboard && !options.isInput) {
                              if (options.trigger !== 'focus') {
                                  angular.element(document).on('keyup', $master.$onKeyUp);
                              } else {
                                  element && angular.element(document).on('keyup', $master.$onFocusKeyUp);
                              }
                          }
                          element && element.addClass('active')

                          if (options.clearExists && (options.hasClick || options.clearStrict)) {
                              angular.element('body').on('click', onBodyClick)
                          }
                          if (options.holdHoverDelta)
                              $target.on('mouseenter mouseleave', outerHoverTrigger);
                          callback && callback.call($master)

                      }
                      function ensureFixedPlacement() {
                          if (options.ensurePlacement && (!options.container || ($container && $container.css("position") === "fixed"))) {
                              if ($container && $container.css("position") === "fixed") {
                                  options.insideFixed = true;
                                  return false;
                              }
                                
                              var $checkElements = $target.add($target.parents());
                              var isFixed = false;
                              var scaleW = angular.element(window).width() / 2;
                              var scaleH = angular.element(window).height() / 2;
                              angular.forEach($checkElements, function (node) {
                                  var fx = angular.element(node);
                                  if (fx.css("position") === "fixed") {
                                      options.insideFixed = true;
                                      var val = fx.css("bottom");
                                      if ((val != 'auto' || val != 'initial') && parseInt(val) < scaleH && options.placement.indexOf("bottom-") > -1) {
                                          options.placement = options.placement.replace('bottom', 'top');
                                          options.offsetTop = -1 * options.offsetTop;
                                          return false;
                                      }
                                      val = fx.css("top");
                                      if ((val != 'auto' || val != 'initial') && parseInt(val) < scaleH && options.placement.indexOf("top-") > -1) {
                                          options.placement = options.placement.replace('top', 'bottom');
                                          options.offsetTop = -1 * options.offsetTop;
                                          return false;
                                      }
                                      val = fx.css("left");
                                      if ((val != 'auto' || val != 'initial') && parseInt(val) < scaleW && options.placement.indexOf("left-") > -1) {
                                          options.placement = options.placement.replace('left', 'right');
                                          options.offsetLeft = -1 * options.offsetLeft;
                                          return false;
                                      }
                                      val = fx.css("right");
                                      if ((val != 'auto' || val != 'initial') && parseInt(val) < scaleW && options.placement.indexOf("right-") > -1) {
                                          options.placement = options.placement.replace('right', 'left');
                                          options.offsetLeft = -1 * options.offsetLeft;
                                          return false;
                                      }
                                      return false;
                                  }
                              });
                          }


                      }
                      function scrollCheck() {
                          if (options.insideFixed && options.typeClass !== 'modal') {
                              scope.$on('staticContentScroll', function () { })
                              scope.$on('staticContentScroll', function (obj, top) {
                                  if ($master.$isShown) {
                                      $master.$applyPlacement();
                                  }
                              })
                          }
                      }
                      start();
                      return $master;
                  }
                  return MasterFactory;
              }
            ];
        })
    angular.forEach(['Modal', 'Dropdown', 'Popover'], function (directive) {
        app.directive('nqToggle' + directive, ['$helpers', '$rootScope', '$sce', '$timeout', function ($helpers, $rootScope, $sce, $timeout) {
            return {
                restrict: 'EA',
                priority: 1000,
                link: function postLink(scope, element, attr, transclusion) {

                    var itemId = attr['nqToggle' + directive], target, service, options = {}, togglerId, trigger;
                    
                    if (itemId) {
                        target = angular.element(itemId);
                    }
                    
                    if (!itemId || (target && !target.length))
                        return;
                    togglerId = $helpers.id();
                    angular.forEach(props, function (key) {
                        if (angular.isDefined(attr[key]))
                            attr.$observe(key, function (newValue, oldValue) {
                                options[key] = newValue;
                            })
                    });
                    $timeout(function () {
                        build();
                    }, 300)
                    function build() {
                        service = target.data('$nq' + directive);
                        trigger = angular.isDefined(attr.trigger) ? attr.trigger : 'click';
                        if (!angular.isObject(service))
                            return;
                        options = angular.extend({}, service.$originalOptions, options);
                        trigger = angular.isDefined(attr.trigger) ? attr.trigger : options.trigger || 'click';
                        if (trigger.indexOf('click'))
                            options.hasClick = true;
                      
                        element.on(trigger, function () {
                            if (service.$isShown) {
                                service.hide(function () {
                                    if (service.togglerId && togglerId !== service.togglerId)
                                        $timeout(function () {
                                            show();
                                        }, 10)
                                });
                            } else {
                                show();
                            }
                        })
                        
                    }
                    function show() {
                        service.$currentElement = element;
                        service.$options = angular.extend({}, options);
                        service.togglerId = togglerId;
                        extendScope();
                        service.show();
                    }
                    function extendScope() {
                        var sScope = service.$scope;
                        if (angular.isDefined(attr.qsTitle))
                            sScope.title = $sce.trustAsHtml(scope.$eval(attr.qsTitle) || attr.qsTitle);
                        if (angular.isDefined(attr.qsContent)) {
                            var newContent = scope.$eval(attr.qsContent) || attr.qsContent;
                            if (angular.isObject(newContent))
                                angular.extend(sScope, newContent);
                            else
                                sScope.content = $sce.trustAsHtml(newContent);
                        }
                            
                    }
                    scope.$on('$destroy', function () {
                        element.off(trigger)
                    });
                }
            };
        }]);
    })
}(window, window.angular);