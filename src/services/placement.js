'use strict';
angular.module('ngQuantum.services.placement', ['ngQuantum.services.helpers'])
        .factory('$placement', ['$helpers', function ($helpers) {
            var fn = {};
            fn.applyPlacement = function (element, $target, options) {
                if (!element || !$target)
                    return;
                var placement = options.placement,
                    position = getPosition(element, options);
                
                options.originalPlacement = placement
                var autoToken = /\s?auto?\s?/i
                var autoPlace = autoToken.test(placement)
                if (autoPlace) placement = placement.replace(autoToken, '') || 'top'

                if (autoPlace) {
                    placement = getPlacement(element, placement, position, options.container)
                    $target.removeClass(options.originalPlacement).addClass(placement)
                }
                var width = $target.outerWidth(true),
                    height = $target.outerHeight(true);
                var offset = getCalculatedOffset(placement, position, width, height);
                
                offset.top = offset.top + $helpers.ensureNumber(options.offsetTop)
                offset.left = offset.left + $helpers.ensureNumber(options.offsetLeft)
                var marginTop = parseInt($target.css('margin-top'), 10)
                var marginLeft = parseInt($target.css('margin-left'), 10)
                if (isNaN(marginTop)) marginTop = 0;
                if (isNaN(marginLeft)) marginLeft = 0;
                
                offset.top = offset.top + marginTop;
                offset.left = offset.left + marginLeft;

                if (options.insideFixed) {
                    $target.css(offset);
                } else
                    $target.offset(offset);
                fn.ensurePosition($target, element, options)
                return options;
            }
            fn.verticalPlacement = function ($target, options) {
                var windowHeght = window.screen.height || 0;
                var targetHeight = $target.height() || 0;
                var diff = windowHeght - targetHeight - 10;
                if (diff > 0) {
                    var top = 0;
                    switch (options.placement) {
                        case 'center':
                            top = diff / 2
                            break;
                        case 'bottom':
                            top = diff
                            break;
                        case 'near-top':
                            top = diff / 3
                            break;
                        case 'near-bottom':
                            top = (diff / 3) * 2
                            break;
                        default:
                            top = 0
                    }
                    $target.css('top', top);
                }

            }
            fn.ensurePosition = function ($target, element, options) {
                var offset = options.insideFixed ? $target.position() : $target.offset(), ww = window.screen.width, dh = $helpers.docHeight(),
                    tw = $target.width(), th = $target.height(), eh = element.height(), eo = options.insideFixed ? element.position() : element.offset(), classList = $target.attr('class');
                if (offset.left < 0) {
                    $target.css('left', 0);
                    $target.attr('class', classList.replace('right', 'left'));
                }
                else if (offset.left >  (ww - tw)) {
                    $target.css('left', (element.width() - tw));
                    $target.attr('class', classList.replace('left', 'right'));
                }
                if (offset.top < 0) {
                    $target.css('top', eo.top);
                    $target.attr('class', classList.replace('bottom', 'top'));
                }
                else if (offset.top > (dh - th)) {
                    $target.css('left', (eo.top - th));
                    $target.attr('class', classList.replace('top', 'bottom'));
                }
                    
                
            }
            fn.replaceArrow = function ($target, delta, dimension, position) {
                $target.find('.arrow').css(position, delta ? (50 * (1 - delta / dimension) + "%") : '')
            }
            function getPosition(element, options) {
                var el = element[0];
                var clipRect = (typeof el.getBoundingClientRect == 'function') ? el.getBoundingClientRect() : {
                    width: el.offsetWidth
                   , height: el.offsetHeight
                };
                var rectObj = {};
                for (var o in clipRect) {
                    rectObj[o] = clipRect[o];
                }
                var offset = options.insideFixed ? element.position() : element.offset();
                var result = angular.extend({}, rectObj, offset);
               return result;
            }
            function getCalculatedOffset(placement, position, actualWidth, actualHeight) {
                var offset;
                var split = placement.split('-');
                switch (split[0]) {
                    case 'right':
                        offset = {
                            top: position.top + (position.height / 2) - (actualHeight / 2),
                            left: position.left + position.width
                        };
                        break;
                    case 'bottom':
                        offset = {
                            top: position.top + position.height,
                            left: position.left + (position.width / 2) - (actualWidth / 2)
                        };
                        break;
                    case 'left':
                        offset = {
                            top: position.top + (position.height / 2) - (actualHeight / 2),
                            left: position.left - actualWidth
                        };
                        break;
                    default:
                        
                        offset = {
                            top: position.top - actualHeight,
                            left: position.left + (position.width / 2) - (actualWidth / 2)
                        };
                        break;
                }
                if (!split[1]) {
                    return offset;
                }
                if (split[0] === 'top' || split[0] === 'bottom') {
                    switch (split[1]) {
                        case 'left':
                            offset.left = position.left;
                            break;
                        case 'right':
                            offset.left = position.left + position.width - actualWidth;
                    }
                } else if (split[0] === 'left' || split[0] === 'right') {
                    switch (split[1]) {
                        case 'top':
                            offset.top = position.top - actualHeight + position.height;
                            break;
                        case 'bottom':
                            offset.top = position.top
                    }
                }
                return offset;
            }
            function getPlacement(element, placement, position, container) {
                var actualWidth = element[0].offsetWidth
                var actualHeight = element[0].offsetHeight
                var $parent = element.parent()
                if (container)
                    container == container == 'body' ? window : angular.element(container)[0];
                var docScroll = document.documentElement.scrollTop || document.body.scrollTop
                var parentWidth = container ? container.innerWidth : $parent.outerWidth()
                var parentHeight = container ? container.innerHeight : $parent.outerHeight()
                var parentLeft = container ? 0 : $parent.offset().left

                placement = placement == 'bottom' && position.top + position.height + actualHeight - docScroll > parentHeight ? 'top' :
                            placement == 'top' && position.top - docScroll - actualHeight < 0 ? 'bottom' :
                            placement == 'right' && position.right + actualWidth > parentWidth ? 'left' :
                            placement == 'left' && position.left - actualWidth < parentLeft ? 'right' :
                            placement
                return placement;
            }

            return fn;
        }
        ]);
