+function (window, angular, undefined) {
'use strict';
    angular.module('ngQuantum.colorpicker', ['ngQuantum.popMaster'])
    .run(['$templateCache', function ($templateCache) {
        'use strict';
        $templateCache.put('colorpicker/colorpicker.tpl.html',
                    '<div class="popover colorpicker">'
                    + '<ul class="nav palettes-list clearfix">'
                        + '<li ng-repeat="color in palettes"  ng-click="$parent.$select($index)">'
                            + '<span class="color-pick titip-top" data-title="{{color}}" ng-style="{\'background-color\':color}"></span>'
                        + '</li>'
                    + '</ul>'
                    + '<div class="clearfix">'
                        + '<span class="color-pick titip-top" data-title="{{selectedColor}}" ng-style="{\'background-color\':selectedColor}"></span>&nbsp;&nbsp;'
                        + '<span class="color-pick titip-top" ng-click="$select(\'transparent\')" data-title="Set Transparent" style="background-color:transparent;"></span>'
                        + '<small class="pull-right color-more-label" ng-click="$showPicker()">{{$options.moreText || \'More\'}} <i ng-class="$options.iconDown" class="angle-down"></i><i ng-class="$options.iconUp" class="angle-up"></i></small>'
                    + '</div>'
                    + '<div class="color-selector-panel">'
                        + '<ul class="clearfix nav-color-current">'
                           + '<li class="color-current-label">Current</li>'
                           + '<li><span class="color-current"  ng-style="{\'background-color\':selectedColor || newColor }"></span><span class="color-new" ng-style="{\'background-color\':newColor || selectedColor}"></span></li>'
                           + '<li class="color-new-label">New</li>'
                       + '</ul>'
                       + '<div class="clearfix">'
                           + '<div class="color-saturation"><span class="sat-point"></span></div>'
                           + '<div class="color-hue"><span class="hue-slider"></span></div>'
                       + '</div>'
                       + '<div class="clearfix alpha-row">'
                           + '<div class="color-alpha"><span class="alpha-slider titip-top titip-yellow titip-xs"><span class="titip-content">{{$alphaValue}}%</span></span></div>'
                           + '<div class="color-button"><button type="button" class="btn btn-default" ng-click="$select()">ok</button></div>'
                       + '</div>'
                    + '</div>'
                + '</div>'
        )
    }])
        
    
    .provider('$colorPicker', function () {
        var defaults = this.defaults = {
            palette: [
            '#000000', '#424242', '#636363', '#9C9C94', '#CEC6CE', '#EFEFEF', '#F7F7F7', '#FFFFFF',
            '#FF0000', '#FF9C00', '#FFFF00', '#00FF00', '#00FFFF', '#0000FF', '#9C00FF', '#FF00FF',
            '#F7C6CE', '#FFE7CE', '#FFEFC6', '#D6EFD6', '#CEDEE7', '#CEE7F7', '#D6D6E7', '#E7D6DE',
            '#E79C9C', '#FFC69C', '#FFE79C', '#B5D6A5', '#A5C6CE', '#9CC6EF', '#B5A5D6', '#D6A5BD',
            '#E76363', '#F7AD6B', '#FFD663', '#94BD7B', '#73A5AD', '#6BADDE', '#8C7BC6', '#C67BA5',
            '#CE0000', '#E79439', '#EFC631', '#6BA54A', '#4A7B8C', '#3984C6', '#634AA5', '#A54A7B',
            '#9C0000', '#B56308', '#BD9400', '#397B21', '#104A5A', '#085294', '#311873', '#731842',
            '#630000', '#7B3900', '#846300', '#295218', '#083139', '#003163', '#21104A', '#4A1031'
            ],
            paletteOnly: true,
            showAlpha: true,
            defaultColor: '#000000',
            effect: 'sing',
            typeClass: 'popover',
            prefixClass: 'colorpicker',
            prefixEvent: 'colorpicker',
            instanceName: 'colorpicker',
            placement: 'bottom-left',
            template: 'colorpicker/colorpicker.tpl.html',
            trigger: 'click',
            container: 'body',
            showArrow: true,
            allowWrite: false,
            autoHide: false,
            iconDown: 'fic fu-angle-d',
            iconUp: 'fic fu-angle-u',
            moreText: 'More',
            html: true,
            displayReflow: false,
            fireEmit: true,
            keyboard: true,
            overseeingTarget: true
        };
        this.$get = ['$rootScope', '$popMaster', '$document', '$color', '$mouse','$helpers',
          function ($rootScope, $popMaster, $document, $color, $mouse, $helpers) {
              function Factory(element, config, attr) {
                  var $picker = {}, alpha, hue, saturation, target, count = 0, sizes, hueSlider, satPoint, alphaSlider;
                  config = $helpers.parseOptions(attr, config);
                  var options = angular.extend({}, defaults, config);
                  var $picker = new $popMaster(element, options);
                  var scope = $picker.$scope;
                  options = $picker.$options = $helpers.observeOptions(attr, $picker.$options);
                  scope.$$postDigest(function () {
                      scope.palettes = options.palette;
                      scope.$select = $picker.select;
                      scope.$alphaValue = 100;
                      scope.$options = $picker.$options;
                  });
                  scope.$showPicker = function () {
                      $picker.$target.toggleClass('picker-open');
                      if ($picker.$target.hasClass('picker-open')) {
                          bindMouse();
                          setPositions();
                      }
                      else
                          unbindMouse();

                  }
                  var init = $picker.init;
                  $picker.init = function () {
                      init();
                      findElement();
                      scope.selectedColor = scope.newColor = scope.selectedColor || options.defaultColor || '#FF0000';
                      scope.$color.setColor(scope.selectedColor);
                  }
                  var show = $picker.show;
                  $picker.show = function () {
                     return show();
                  }
                  var hide = $picker.hide;
                  $picker.hide = function () {
                      var promise = hide();
                      unbindMouse();
                      $picker.$target.removeClass('picker-open');
                      return promise;
                  }
                  var destroy = $picker.destroy
                  $picker.destroy = function () {
                      destroy();
                      unbindMouse();
                      scope.$destroy();
                  }
                  $picker.select = function (index) {
                      var color = scope.selectedColor || '#FF0000';
                      if (index) {
                          if (index == 'transparent')
                              color = 'transparent';
                          else {
                              color = scope.palettes[index];
                              scope.$color.setColor(color);
                          }

                      }
                      else if (scope.$color) {
                          if (scope.$color.value.a == 1)
                              color = scope.$color.hex()
                          else
                              color = scope.$color.rgba();
                          $picker.$target.removeClass('picker-open');
                      }
                      scope.selectedColor = color;
                  }
                  function findElement() {
                      target = $picker.$target;
                      if (!target && count < 10) {
                          setTimeout(function () {
                              findElement()
                              count++;
                          }, 50)
                      }
                      else {
                          !scope.$color && (scope.$color = $color)
                          hue = target.find('.color-hue');
                          alpha = target.find('.color-alpha');
                          saturation = target.find('.color-saturation');
                          hueSlider = hue.find('.hue-slider');
                          satPoint = saturation.find('.sat-point');
                          alphaSlider = alpha.find('.alpha-slider');
                      }
                  }

                  function bindMouse() {
                      if (!sizes)
                          findSizes();
                      hueMouse();
                      saturationMouse();
                      alphaMouse();
                  }
                  function unbindMouse() {
                      $mouse.offDown(saturation)
                      $mouse.offDown(satPoint);
                      $mouse.offDown(hue)
                      $mouse.offDown(hueSlider);
                      $mouse.offDown(alpha)
                      $mouse.offDown(alphaSlider);
                  }
                  function hueMouse() {
                      $mouse.down(hue, slideHue)
                      $mouse.down(hueSlider, function (event) {
                          $mouse.offMove($document, slideHue);
                          $mouse.move($document, slideHue);
                          var upHandler = function (event) {
                              $mouse.offMove($document, slideHue);
                              $mouse.offUp($document, upHandler);
                          };
                          $mouse.up($document, upHandler)
                      })

                  }
                  function saturationMouse() {
                      $mouse.down(saturation, dragSaturation)
                      $mouse.down(satPoint, function (event) {
                          $mouse.offMove($document, dragSaturation)
                          $mouse.move($document, dragSaturation);
                          var upHandler = function (event) {
                              $mouse.offMove($document, dragSaturation)
                              $mouse.offUp($document, upHandler);
                          };
                          $mouse.up($document, upHandler)
                      })


                  }
                  function alphaMouse() {
                      $mouse.down(alpha, slideAlpha)
                      $mouse.down(alphaSlider, function (event) {
                          $mouse.offMove($document, slideAlpha)
                          $mouse.move($document, slideAlpha);
                          var upHandler = function (event) {
                              $mouse.offMove($document, slideAlpha)
                              alphaSlider.removeClass('titip-active');
                              $mouse.offUp($document, upHandler)
                          };
                          $mouse.up($document, upHandler)
                      })


                  }
                  function slideHue(event) {
                      var y = $mouse.relativeY(event, hue);
                      y = y > sizes.hh ? sizes.hh : y < 0 ? 0 : y;
                      hueSlider.css({ top: y - (sizes.hsh / 2) });
                      setHue((y / sizes.hh));
                  }
                  function dragSaturation(event) {
                      var pos = $mouse.relativePos(event, saturation);
                      var x = pos.left, y = pos.top;
                      y = y > sizes.hh ? sizes.hh : y < 0 ? 0 : y;
                      x = x > sizes.aw ? sizes.aw : x < 0 ? 0 : x;

                      satPoint.css({ left: x - (sizes.spw / 2), top: y - (sizes.sph / 2) });
                      setSaturation((x / sizes.sw), 1 - (y / sizes.sh));
                  }
                  function slideAlpha(event) {
                      alphaSlider.addClass('titip-active')
                      var x = $mouse.relativeX(event, alpha);
                      x = x > sizes.aw ? sizes.aw : x < 0 ? 0 : x;
                      alphaSlider.css({ left: x - (sizes.asw / 2) });
                      setAlpha((x / sizes.aw));
                  }

                  function findSizes() {
                      sizes = {
                          hh: hue.height(),
                          hsh: hueSlider.outerHeight(),
                          sw: saturation.width(),
                          sh: saturation.height(),
                          sph: satPoint.outerHeight(),
                          spw: satPoint.outerWidth(),
                          aw: alpha.width(),
                          asw: alphaSlider.outerWidth()
                      }
                  }
                  function drawAlphaBg() {
                      var color = scope.$color.hex();
                      alpha.css('background-image', 'linear-gradient(to right, rgba(255,255,255, 0), ' + color + ')')
                      scope.newColor = scope.$color.rgba();
                      !scope.$$phase && scope.$apply(function () {
                          scope.newColor = scope.$color.rgba();
                      })

                  }
                  function setPositions() {
                      if (!sizes)
                          findSizes();
                      var satpos = {
                          left: (scope.$color.value.s * sizes.sw) - (sizes.spw / 2),
                          top: ((1 - scope.$color.value.b) * sizes.sw) - (sizes.sph / 2)
                      }
                      satPoint.css(satpos)
                      hueSlider.css({ top: (scope.$color.value.h * sizes.hh) - (sizes.hsh / 2) });
                      alphaSlider.css({ left: (scope.$color.value.a * sizes.aw) - (sizes.asw / 2) });
                      scope.$alphaValue = parseInt(scope.$color.value.a * 100);
                      saturation.css('background-color', $color.toHex(scope.$color.value.h, 1, 1, 1))
                      drawAlphaBg();
                  }
                  function setHue(value) {
                      scope.$color.setHue(value);
                      saturation.css('background-color', $color.toHex(value, 1, 1, 1))
                      drawAlphaBg()
                  }
                  function setSaturation(sat, bright) {
                      scope.$color.setSaturation(sat);
                      scope.$color.setLightness(bright);
                      drawAlphaBg();
                  }
                  function setAlpha(value) {
                      scope.$color.setAlpha(value);
                      scope.$apply(function () {
                          scope.$alphaValue = parseInt(value * 100);
                      })
                      drawAlphaBg();
                  }
                  return $picker;
              }
              return Factory;
          }
        ];
    })
    .directive('nqColorPicker', ['$colorPicker', function ($colorPicker) {
        return {
            restrict: 'AC',
            require: 'ngModel',
            link: function postLink(scope, element, attr, controller) {
                var options = {
                    $scope: scope.$new()
                };
                var picker = new $colorPicker(element, options, attr)
                scope.$watch(attr.ngModel, function (newVal, oldVal) {
                    if (newVal && (newVal !== picker.$scope.selectedColor)) {
                        picker.$scope.selectedColor = newVal;
                    }
                })

                picker.$scope.$watch('selectedColor', function (newVal, oldVal) {
                    if (newVal && (newVal !== oldVal)) {
                        controller.$setViewValue(picker.$scope.selectedColor);
                        controller.$render();
                    }
                })
                scope.$on('$destroy', function () {
                    picker && picker.destroy();
                    picker = null

                })
            }
        };
    }]);
}(window, window.angular);