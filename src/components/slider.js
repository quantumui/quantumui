'use strict';
angular.module('ngQuantum.slider', ['ngQuantum.services.mouse', 'ngQuantum.services.helpers'])
.provider('$slider', function () {
    var defaults = this.defaults = {
        keyboard: true,
        decimalPlace:0,
        step: 1,
        min: 0,
        max: 100,
        doubleThumb:false,
        diff: 10,
        size: false,
        sizeClass:false,
        showTooltip: true,
        tooltipVisible:false,
        showRuller: false,
        showLabel: false,
        tickSize: 10,
        valuePrefix: false,
        valueSuffix: false,
        formatValue:false,
        direction: 'horizontal',
        theme:false,
        thumbClass:false
    };
    this.$get = ['$rootScope', '$document', '$mouse', '$parse',
      function ($rootScope, $document, $mouse, $parse) {
          function Factory(element, config) {
              var $slider = {}, template, track, selection, thumb, thumb2, sizes, body = angular.element('body');
              
              var options = angular.extend({}, defaults, config);
              if (defaults.formatValue) {
                  options.callValueFunction = defaults.formatValue;
              }
              if (options.formatValue) {
                  options.formatValue = $parse(options.formatValue);
                  options.callValueFunction = false;
              }
              if (options.formatValue == false)
                  options.callValueFunction = false;
              var scope = $slider.$scope = options.$scope && options.$scope.$new() || $rootScope.$new();
              $slider.lastOffset = 0;
              $slider.lastOffset2 = 0;
              $slider.init = function () {
                  getTemplate();
                  template.addClass('slider-' + (options.direction == 'vertical' ? 'vertical' : 'horizontal'));
                  if (options.size) {
                      options.direction == 'vertical' ? template.height(options.size) : template.width(options.size)
                  }
                  options.sizeClass && template.addClass('slider-' + options.sizeClass)
                  findSizes();
                  bindMouse();
                  var titipclass = 'titip-' + (options.direction == 'vertical' ? 'left' : 'top') + ' titip-sm';
                  if (options.tooltipVisible) {
                      titipclass += ' titip-sm titip-active';
                  }
                 if (options.showTooltip || options.tooltipVisible) {
                     thumb.addClass(titipclass);
                     thumb2 && thumb2.addClass(titipclass);
                  }
                  if (options.doubleThumb)
                      options.direction == 'vertical' ? ($slider.lastOffset2 = sizes.trh) : ($slider.lastOffset2 = sizes.trw);
                  $slider.setValues();
                  if (options.showRuller || options.showLabel)
                      buildRuller();
                  
                  
              }
              $slider.setValues = function (value) {
                  if (!value) {
                      applyValue();
                      value = scope.values;
                  }
                  if (options.doubleThumb) {
                      if (!angular.isArray(value)) {
                          value = [value, options.max]
                      }
                      var v1 = (value[0] - options.min) / sizes.stepRate;
                      var v2 = (value[1] - options.min) / sizes.stepRate;
                      if (options.direction == 'vertical') {
                          v1 = v1 > sizes.trh ? sizes.trh : v1 < 0 ? 0 : v1;
                          bottomSlide(v1)
                          v2 = v2 > sizes.trh ? sizes.trh : v2 < 0 ? 0 : v2;
                          topSlide(v2)
                      }
                      else {
                          v1 = v1 > sizes.trw ? sizes.trw : v1 < 0 ? 0 : v1;
                          leftSlide(v1)
                          v2 = v2 > sizes.trw ? sizes.trw : v2 < 0 ? 0 : v2;
                          rightSlide(v2)
                      }
                  } else {
                      var v = (value - options.min) / sizes.stepRate;
                      if (options.direction == 'vertical') {
                          v = v > sizes.trh ? sizes.trh : v < 0 ? 0 : v;
                          bottomSlide(v)
                      }
                      else {
                          v = v > sizes.trw ? sizes.trw : v < 0 ? 0 : v;
                          leftSlide(v)
                      }
                  }
                  scope.$$postDigest(applyValue);
              }
              $slider.toggleDisable = function (disbled) {
                  if (disbled) {
                      template.addClass('slider-disabled')
                      unbindMouse();
                  }
                  else {
                      template.removeClass('slider-disabled');
                      unbindMouse();
                      bindMouse();
                  }
                  
              }
              $slider.destroy = function () {
                  unbindMouse();
                  scope.$destroy();
              }
              function applyValue(){
                  if (options.doubleThumb)
                      scope.values = [$slider.value0 || options.min, $slider.value1 || options.max];
                  else
                      scope.values = $slider.value0 || options.min;
              }
              function bindMouse() {
                  $mouse.down(track, function (event) {
                      if (event.target == track[0] || event.target == selection[0]) {
                          $slider.eventNo = 0;
                          slideThumb(event);
                      }
                  })
                  $mouse.down(thumb, function (event) {
                      $slider.eventNo = 1;
                      $mouse.move($document, slideThumb);
                      $mouse.up(body, documentUp)
                  })
                  thumb2 &&
                  $mouse.down(thumb2, function (event) {
                      $slider.eventNo = 2;
                      $mouse.move($document, slideThumb)
                      $mouse.up(body, documentUp)
                  })
                  
              }
              function unbindMouse() {
                  $mouse.offDown(track)
                  $mouse.offDown(thumb);
                  thumb2 && $mouse.offDown(thumb2);
                  $mouse.offMove($document, slideThumb);
                  $mouse.offUp(body, documentUp)
              }
              function documentUp(event) {
                  $mouse.offMove($document, slideThumb)
                  if (options.showTooltip && !options.tooltipVisible) {
                      thumb.removeClass('titip-active');
                      thumb2 && thumb2.removeClass('titip-active');
                  }
                  angular.element('body').removeClass('unselectable');
                  $mouse.offUp(body, documentUp);
                  
              }
              function slideThumb(event) {
                  event.preventDefault();
                  event.stopPropagation();
                  angular.element('body').addClass('unselectable')
                  if (!sizes)
                      findSizes();
                  if (options.showTooltip && !options.tooltipVisible) {
                      thumb.addClass('titip-active');
                      thumb2 && thumb2.addClass('titip-active');
                  }
                  options.direction == 'vertical' ? slideVertical(event) : slideHorizontal(event);
                  scope.$apply(applyValue)
                  
              }
              function slideVertical(event) {
                  var thumNo = 1;
                  var x = $mouse.relativeY(event, template);
                  x = sizes.trh - x;
                  x = x > sizes.trh ? sizes.trh : x < 0 ? 0 : x;
                  var val = (Math.abs(x - $slider.lastOffset) >= sizes.stepSize) || x == 0 || x == sizes.trh;
                  if ((options.doubleThumb && $slider.eventNo == 2) ||
                      (options.doubleThumb && $slider.eventNo == 0
                      && ((x > $slider.lastOffset2) || (Math.abs(x - $slider.lastOffset) > Math.abs(x - $slider.lastOffset2))))) {
                      val = (Math.abs(x - $slider.lastOffset2) >= sizes.stepSize) || x == 0 || x == sizes.trh;
                      thumNo = 2;
                  }
                  if (sizes.stepSize < 0 || val) {
                      thumNo == 2 ? topSlide(x) : bottomSlide(x);
                  }
              }
              function slideHorizontal(event) {
                  var thumNo = 1;
                  var x = $mouse.relativeX(event, template);
                  x = x > sizes.trw ? sizes.trw : x < 0 ? 0 : x;
                  var val = (Math.abs(x - $slider.lastOffset) >= sizes.stepSize) || x == 0 || x == sizes.trw;
                  if ((options.doubleThumb && $slider.eventNo == 2) ||
                      (options.doubleThumb && $slider.eventNo == 0
                      && ((x > $slider.lastOffset2) || (Math.abs(x - $slider.lastOffset) > Math.abs(x - $slider.lastOffset2))))) {
                      val = (Math.abs(x - $slider.lastOffset2) >= sizes.stepSize) || x == 0 || x == sizes.trw;
                      thumNo = 2;
                  }
                  if (sizes.stepSize < 0 || val) {
                      thumNo == 2 ? rightSlide(x) : leftSlide(x);
                  }
              }
              function leftSlide(x) {
                  if (sizes.diffPixel && ((x + sizes.diffPixel) > $slider.lastOffset2))
                      x = $slider.lastOffset2 - sizes.diffPixel + 1;
                  var value = getValue(x);
                  $slider.lastOffset = x;
                  thumb.css({ left: x });
                  options.showTooltip && thumb.attr('data-title', getValueFormat(value));
                  if (options.doubleThumb) {
                     var r = $slider.lastOffset2 > x ? (sizes.trw - $slider.lastOffset2) : 0;
                      selection.css({ left: x, right: r });
                  }
                  else
                      selection.css({ left: 0, right: sizes.trw - x });
                  $slider.value0 = value;
                  
              }
              function rightSlide(x) {
                  if (sizes.diffPixel && ((x - sizes.diffPixel) < $slider.lastOffset))
                      x = $slider.lastOffset + sizes.diffPixel;
                  var value = getValue(x);
                  $slider.lastOffset2 = x;
                  thumb2.css({ left: x });
                  options.showTooltip && thumb2.attr('data-title', getValueFormat(value));
                  var l = $slider.lastOffset > 0 ? $slider.lastOffset : 0;
                  selection.css({ right: sizes.trw - x, left: l });
                  $slider.value1 = value;
                  
              }

              function bottomSlide(x) {
                  if (sizes.diffPixel && ((x + sizes.diffPixel) > $slider.lastOffset2))
                      x = $slider.lastOffset2 - sizes.diffPixel + 1;
                  var value = getValue(x);
                  $slider.lastOffset = x;
                  thumb.css({ bottom: x });
                  options.showTooltip && thumb.attr('data-title', getValueFormat(value));
                  if (options.doubleThumb) {
                      var t = $slider.lastOffset2 > x ? (sizes.trh - $slider.lastOffset2) : 0;
                      selection.css({ bottom: x, top: t });
                  }
                  else
                      selection.css({ bottom: 0, top: sizes.trh - x });
                  $slider.value0 = value;

              }
              function topSlide(x) {
                  if (sizes.diffPixel && ((x - sizes.diffPixel) < $slider.lastOffset))
                      x = $slider.lastOffset + sizes.diffPixel;
                  var value = getValue(x);
                  $slider.lastOffset2 = x;
                  thumb2.css({ bottom: x });
                  options.showTooltip && thumb2.attr('data-title', getValueFormat(value));
                  var b = $slider.lastOffset > 0 ? $slider.lastOffset : 0;
                  selection.css({ bottom: b, top: sizes.trh - x });
                  $slider.value1 = value;

              }
              function getValue(val) {
                  if (!options.decimalPlace)
                      return Math.floor(val * sizes.stepRate) + parseFloat(options.min);
                  return parseFloat(Math.round(((val * sizes.stepRate) + parseFloat(options.min)) * 100) / 100).toFixed(options.decimalPlace)
              }
              function getValueFormat(val) {
                  if (options.callValueFunction)
                      return options.callValueFunction.call(null, val);
                  else if (options.formatValue)
                      return options.callValueFunction(scope, { $value: val });
                  else {
                      options.valuePrefix && (val = options.valuePrefix + val);
                      options.valueSuffix && (val += options.valueSuffix);
                      return val;
                  }
              }
              function findSizes() {
                  sizes = {
                      trw: track.width(),
                      thh: thumb.outerHeight(),
                      thw: thumb.outerWidth(),
                      trh: track.height()
                  }
                  var margins = {};
                  if (options.direction == 'vertical') {
                      margins['margin-bottom'] = -(sizes.thh / 2);
                      margins['margin-left'] = -((sizes.thw - sizes.trw) / 2);
                  }
                  else {
                      margins['margin-left'] = -(sizes.thw / 2);
                      margins['margin-top'] = -((sizes.thh - sizes.trh) / 2);
                  }
                  thumb.css(margins)
                  thumb2 && thumb2.css(margins)
                  findStep();
              }
              function findStep() {
                  var diff = (options.max - options.min) / options.step;
                  if (options.direction == 'vertical') {
                      sizes.stepRate = diff / sizes.trh;
                      sizes.stepSize = sizes.trh / diff;
                  } else {
                      sizes.stepRate = diff / sizes.trw;
                      sizes.stepSize = sizes.trw / diff;
                  }
                  options.diff && options.doubleThumb && (sizes.diffPixel = Math.round(sizes.stepSize * options.diff));
                  
              }
              function getTemplate() {
                  template = angular.element('<div class="range-slider"></div>').insertBefore(element).append(element)
                  track = angular.element('<div class="slider-track"></div>').appendTo(template);
                  selection = angular.element('<div class="slider-selection"></div>').appendTo(track);
                  thumb = angular.element('<div class="slider-thumb"></div>').appendTo(track);
                  options.theme && template.addClass('slider-' + options.theme)
                  options.thumbClass && thumb.addClass(options.thumbClass)
                  if (options.doubleThumb) {
                      thumb2 = angular.element('<div class="slider-thumb"></div>').appendTo(track);
                      options.thumbClass && thumb2.addClass(options.thumbClass)
                  }
                      
              }
              function buildRuller() {
                  var ruller = angular.element('<div class="slider-ruller"></div>').appendTo(template);
                  if (options.showRuller) {
                      var ticks = angular.element('<div class="slider-ticks"></div>').appendTo(ruller);
                      if (options.tickSize > 20)
                          options.tickSize = 20;
                      if (options.tickSize > 0)
                          for (var i = 0; i < options.tickSize - 1; i++) {
                              ticks.append('<span  class="slider-tick"></span>')
                          }
                  }
                  if(options.showLabel)
                      ruller.append('<div class="slider-values"><div class="values-min">' + getValueFormat(options.min) + '</div><div class="values-max">' + getValueFormat(options.max) + '</div></div>');

              }
              $slider.init();
              return $slider;
          }
          return Factory;
      }
    ];
})
.directive('nqSlider', ['$slider', '$helpers', function ($slider, $helpers) {
    return {
        restrict: 'AC',
        require: 'ngModel',
        link: function postLink(scope, element, attr, controller) {
            var options = {
                $scope : scope
            }
            var keys = ['disabled', 'keyboard', 'decimalPlace', 'step', 'min', 'max', 'doubleThumb', 'showLabel',
                        'diff', 'size', 'sizeClass', 'showRuller', 'direction', 'theme', 'thumbClass', 'valuePrefix', 'valueSuffix', 'formatValue']
            angular.forEach(keys,
                function (key) {
                    if (angular.isDefined(attr[key])) {
                        options[key] = $helpers.parseConstant(attr[key])
                    }

                });
            var slider = new $slider(element, options)
            scope.$watch(attr.ngModel, function (newVal, oldVal) {
                if (newVal) {
                    if (newVal != slider.$scope.values) {
                        slider.setValues(newVal);
                    }
                    
                }
            })
            attr.$observe('disabled', function (newVal, oldVal) {
                if (newVal) {
                    slider.toggleDisable(true);
                }
                else if(oldVal){
                    slider.toggleDisable(false);
                }
            })
            slider.$scope.$watch('values', function (newVal, oldVal) {
                if (newVal && (newVal !== oldVal)) {
                    controller.$setViewValue(newVal);
                }
            })
            scope.$on('$destroy', function () {
                slider.destroy();
                slider = null

            })
        }
    };
}])