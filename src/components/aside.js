(function (window, angular, undefined) {
'use strict';
var asideoptions = {
    effect: 'slide-left',
    speed: 'fastest',
    side: 'left',
    opened: false,
    pinned: false,
    collapsed: false,
    collapsible: false,
    pinnable: false,
    pinnedScreenSize: 1300,
    collapsedScreenSize: 991,
    closedScreenSize: 767,
    position: 'fixed',   // can be fixed|relative|absolute
    offCanvas: 'mobile', // can be all|desktop|touches or false,
    offCanvasBody: 'body',
    container: 'self',
    theme: false,
    backDrop: false,
    topOffset: 50,
    scrollOffsetTop:false, //if you navbar is fixed set this false
    bottomOffset: 0,
    width:false,
    enlargeHover: false, //ngSwipeLeft and ngSwipeRight can be used for touch devices
};
    angular.module('ngQuantum.aside', ['ngQuantum.services.helpers'])
    .provider('$aside', function () {
        var defaults = this.defaults = asideoptions;
        
        this.$get = ['$rootScope', '$animate', '$timeout', '$window',
        function ($rootScope, $animate, $timeout, $window) {
            var isTouch = "createTouch" in $window.document && window.ontouchstart != null;
              function Factory(element, config, attr) {
                  var $aside = {}
                  var options = $aside.$options = angular.extend({}, defaults, config);
                  var scope = options.$scope || $rootScope.$new();
                  var body = angular.element(options.offCanvasBody), $container, applyBody = options.pinnable || options.collapsible;
                  var classes = ['aside-pinned', 'aside-collapsed', 'aside-opened', 'aside-closed'], backDrop;
                  

                  if (attr && attr.$$observers) {
                      angular.forEach(attr.$$observers, function (value, key) {
                          if (angular.isDefined(options[key])) {
                              attr.$observe(key, function (newValue, oldValue) {
                                  if (newValue != options[key]) {
                                      changeOptions(key, newValue)
                                      options[key] = newValue;
                                  }
                                      
                              });
                          }

                      });
                  }
                      
                  $aside.toggle = function () {
                      if ($aside.$isOpen) {
                          $aside.close()
                      }
                      else {
                          $aside.open()
                      }
                      scope.$$phase || scope.$digest();
                  };
                  $aside.toggleCollapse = function (collapse) {
                      if (!options.collapsible)
                          return;
                      if ($aside.$collapsed) {
                          if (collapse)
                              return;
                          element.removeClass('aside-collapsed');
                          applyBody && body.removeClass(options.side + '-aside-collapsed');
                          $timeout(function () {
                              $aside.$collapsed = false;
                          }, 0)
                          
                          if (options.enlargeHover && !isTouch) {
                              element.off('mouseenter mouseleave')
                              $aside.$isOpen && element.on('mouseleave', function () {
                                  $aside.toggleCollapse();
                              })
                          }
                      }
                      else {
                          if (!$aside.$isOpen || collapse == false)
                              return;
                          if (options.enlargeHover && !isTouch) {
                              element.off('mouseenter mouseleave')
                              element.on('mouseenter', function () {
                                  $aside.toggleCollapse();
                              })
                          }
                          element.addClass('aside-collapsed');
                          applyBody && body.addClass(options.side + '-aside-collapsed');
                          $timeout(function () {
                              $aside.$collapsed = true;
                          }, 0)
                          
                      }
                  };
                  $aside.close = function () {
                      if ($aside.$isOpen == false)
                          return;
                      
                      if (options.effect) {
                          element.off('mouseenter mouseleave')
                            element.removeClass('aside-opened');
                            element.show();
                            element.addClass(options.speed);
                            $animate.removeClass(element, options.effect).then(function () {
                                element.hide();
                                element.addClass('aside-closed');
                                element.removeClass(options.speed);
                                element.removeClass('ng-animate');
                            })
                      } else {
                          element.removeClass('aside-opened');
                          element.addClass('aside-closed');
                          element.removeClass(options.speed);
                          element.removeClass(options.effect);
                      }
                      clearStyle();
                      $timeout(function () {
                          $aside.$isOpen = false;
                      }, 0)
                      
                      backDrop && backDrop.detach();
                  };
                  $aside.open = function () {
                      if ($aside.$isOpen)
                          return;
                      clearStyle();
                      element.removeClass('aside-closed');
                      $container && $container.append(element);
                      if (options.effect) {
                          element.show();
                          element.addClass(options.speed);
                          element.animationEnd(function () {
                              element.removeClass(options.speed);
                              element.removeClass('ng-animate');
                          });
                          $animate.addClass(element, options.effect);
                          element.addClass('aside-opened');

                      } else
                          element.addClass('aside-opened');
                      applyBody && body.addClass(options.side + '-aside-opened');

                      $aside.$isOpen = true;
                      $aside.togglePin($aside.$pinned || false)
                      $aside.toggleCollapse($aside.$collapsed || false);
                      backDrop && element.after(backDrop);
                      $timeout(function () {
                          $aside.$collapsed = false;
                          $aside.$isOpen = true;
                      }, 0)
                  };
                  $aside.togglePin = function (pin) {
                      if (!options.pinnable)
                          return;
                      if ($aside.$pinned) {
                          if (pin) {
                              if (!$aside.$isOpen) {
                                  $aside.open()
                                  return;
                              }
                              element.addClass('aside-pinned');
                              applyBody && body.addClass(options.side + '-aside-pinned');
                              $aside.$pinned = true;
                              return;
                          };
                          element.removeClass('aside-pinned');
                          applyBody && body.removeClass(options.side + '-aside-pinned');
                          $aside.$pinned = false;
                      }
                      else {
                          if (!$aside.$isOpen || pin == false)
                              return;
                          element.addClass('aside-pinned');
                          applyBody && body.addClass(options.side + '-aside-pinned');
                          $aside.$pinned = true;
                      }
                      if (!options.enlargeHover || options.enlargeHover == 'false')
                          element.off('mouseenter mouseleave');
                      else {
                          element.off('mouseenter mouseleave')
                          element.on('mouseenter', function () {
                              $aside.toggleCollapse();
                          })
                      }
                  };
                  function refresh() {
                      element.addClass('aside')
                      clearStyle();
                      if (!options.opened) {
                          $aside.close();
                      } else {
                          $aside.open();
                          options.pinned && $aside.togglePin(true)
                          options.collapsed && $aside.toggleCollapse(true);
                      }
                      applyOptions();
                      addBackdrop();
                      addToContainer();
                      clearTheme(options.theme)
                      clearPosition(options.position)
                      clearOffCanvas(options.offCanvas)
                      checkSizes();
                  };
                  window.addResizeEvent(function () {
                      $timeout(function () {
                          var newVal = $window.innerWidth;
                          checkSizes(newVal);
                      }, 0)
                  })
                  function clearStyle() {
                      applyBody && body.removeClasses([options.side + '-aside-opened', options.side + '-aside-collapsed', options.side + '-aside-pinned']);
                      element && element.removeClasses(classes);
                  }
                  function checkSizes(newVal) {
                      newVal = newVal || $window.innerWidth;
                      if (newVal == $aside.windowWidth)
                          return;
                      if (options.closedScreenSize && options.closedScreenSize >= newVal) {
                          $aside.close();
                      } else {
                          if (options.collapsedScreenSize && options.collapsedScreenSize >= newVal) {
                              $aside.toggleCollapse(true);
                          }
                          if (options.pinnedScreenSize && options.pinnedScreenSize <= newVal) {
                              $aside.togglePin(true);
                          }
                      }
                      $aside.windowWidth = newVal;
                  }
                  function addBackdrop() {
                      if (backDrop) {
                          backDrop.off();
                          backDrop.remove();
                      }
                      if (!options.backDrop)
                          return;
                      backDrop = angular.element('<div class="aside-overlay"></div>')
                                .on('click', function () {
                                    $aside ? $aside.close() : backDrop.remove();
                                });
                  }
                  function changeOptions(key, value) {
                      switch(key){
                          case "theme":
                              clearTheme(value)
                              break;
                          case "position":
                              clearPosition(value)
                              break;
                          case "offCanvas":
                              clearOffCanvas(value)
                              break;
                          case "topOffset":
                              element.css('top', value);
                              break;
                          case "bottomOffset":
                              element.css('bottom', value);
                              break;
                          case "backDrop":
                              addBackdrop();
                              break;
                          case "side":
                              $aside.close();
                              $aside.open();
                              break;
                      }

                  }
                  function applyOptions() {
                      element.addClass('aside-'+ options.side);
                      element.css('top', options.topOffset && options.topOffset || 0);
                      element.css('bottom', options.bottomOffset && options.bottomOffset || 0);
                      if (options.width)
                          element.css('width', options.width);
                      if (options.collapsible)
                          applyBody && body.addClass(options.side + '-aside-collapsible');
                  }
                  function addToContainer() {
                      if (options.container && options.container !== 'self') {
                          var cont = angular.element(options.container);
                          if (cont.length) {
                              $container = angular.element(cont[0]);
                              $container.append(element);
                          }
                      }
                  }
                  function clearPosition(value) {
                      if (options.position) {
                          element.removeClass('aside-' + options.position)
                          applyBody && body.removeClass(options.side + '-aside-' + options.position)
                      }
                      if (value) {
                          element.addClass('aside-' + value)
                          applyBody && body.addClass(options.side + '-aside-' + value)
                      }
                  }
                  function clearOffCanvas(value) {
                      if (options.offCanvas) {
                          element.removeClass('off-canvas-' + options.offCanvas)
                          applyBody && body.removeClass(options.side + '-off-canvas-' + options.offCanvas)
                      }
                      if (value) {
                          element.addClass('off-canvas-' + value)
                          applyBody && body.addClass(options.side + '-off-canvas-' + value)
                      }
                  }
                  function clearTheme(value) {
                      options.theme && element.removeClass('aside-' + options.theme)
                      value && element.addClass('aside-' + value);
                  }
                  refresh();
                  scope.$$postDigest(function () {
                      scope.$aside = $aside
                  });
                  angular.element(window).on('scroll', function (evt) {
                      if(options.scrollOffsetTop && options.topOffset > 0){
                          var top = angular.element(window).scrollTop()
                          if(top > options.topOffset)
                              element.css('top', 0)
                          else if(top == 0)
                              element.css('top', options.topOffset)
                          else
                              element.css('top', options.topOffset - top)
                      }
                      
                  })
                  scope.$on('$destroy', function() {
                      if (backDrop) {
                          backDrop.off();
                          backDrop.remove();
                      }
                      $aside && ($aside == null);
                      element && element.off();
                      clearStyle();
                  });
                  angular.element(document).ready(function () {
                      setTimeout(function () {
                          if (element.height() > window.innerHeight) {
                              element.css('position', 'relative')
                              setTimeout(function () {
                                  element.css('position', '')
                              }, 100)
                          }
                              
                      }, 10)
                  })
                  return $aside;
              }
              return Factory;
          }
        ];
    })
    .directive("nqAside", ["$aside", '$helpers', function ($aside, $helpers) {
        return {
            restrict: "AC",
            scope: true,
            link: function postLink(scope, element, attr, controller) {
                var options = {
                    $scope: scope,
                    id : attr.id || 'aside-' + scope.$id
                }
                angular.forEach(asideoptions, function (val, key) {
                    if (angular.isDefined(attr[key]) && attr[key].indexOf('{{') < 0)
                        options[key] = $helpers.parseConstant(attr[key]);
                        
                });
                var header = element.find('.aside-header');
                if (header.length) {
                    var hh = header.outerHeight(true);
                    element.css('padding-top', hh), header.css('margin-top', -hh)
                }
                var footer = element.find('.aside-footer')
                if (footer.length) {
                    var fh = footer.outerHeight(true);
                    element.css('padding-bottom', fh);
                }
                var aside = new $aside(element, options, attr);
                var asideName = attr.nqAside;
                if (asideName)
                    scope.$parent[asideName] = aside;
            }
        };
    }])
    .directive('asideToggle', ['$timeout', function ($timeout) {
        return {
            restrict: 'A',
            link: function postLink(scope, element, attr) {
                element.on('click', function () {
                    var asideEl = attr.asideToggle ? angular.element(attr.asideToggle) : false;
                    if (asideEl.length) {
                        var aScope = asideEl.scope();
                        if (aScope && aScope.$aside) {
                            $timeout(function () {
                                aScope.$aside.toggle();
                            }, 0);
                        }
                            
                        
                    }

                })
            }
        };
    }])
})(window, window.angular);