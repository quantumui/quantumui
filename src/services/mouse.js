'use strict';
angular.module('ngQuantum.services.mouse', [])
        .provider('$mouseConfig', function () {
            this.adjustOldDeltas = true, // see shouldAdjustOldDeltas() below
            this.normalizeOffset = true  // calls getBoundingClientRect for each event
            this.$get = function () {
                return this;
            };
        })
        .factory('$mouse', ['$injector', '$window', '$mouseConfig', function ($injector, $window, $mouseConfig) {
            var isTouch = "createTouch" in $window.document && window.ontouchstart != null;
            var toFix = ['wheel', 'mousewheel', 'DOMMouseScroll', 'MozMousePixelScroll'],
                toBind = ('onwheel' in document || document.documentMode >= 9) ?
                            'wheel' : 'mousewheel DomMouseScroll, MozMousePixelScroll',
                slice = Array.prototype.slice,
                nullLowestDeltaTimeout, lowestDelta;
            var mause = {};


            mause.relativeX = function (event, container) {
                if (event.target == container[0] && event.offsetX) {
                    return event.offsetX
                }
                else {
                    var clinetX = event.pageX || event.clientX || (typeof (event.originalEvent) != 'undefined' ? event.originalEvent.touches[0].clientX : event.touches[0].clientX);
                    return clinetX - container.offset().left;
                }
            }
            mause.relativeY = function (event, container) {
                if (event.target == container[0] && event.offsetY) {
                    return event.offsetY
                }
                else {
                    var clinetY = event.pageY || event.clientY || (typeof (event.originalEvent) != 'undefined' ? event.originalEvent.touches[0].clientY : event.touches[0].clientY);
                    return clinetY - container.offset().top;
                }
            }
            mause.relativePos = function (event, container) {
                return {
                    top: mause.relativeY(event, container),
                    left: mause.relativeX(event, container)
                }
            }
            mause.down = function (element, callback) {
                var eventName = isTouch ? 'touchstart' : 'mousedown';
                return element.on(eventName, callback);
            }
            mause.move = function (element, callback, event) {
                var eventName = ((event && event.touches) || isTouch) ? 'touchmove' : 'mousemove';
                return element.on(eventName, callback);
            }
            mause.up = function (element, callback, event) {
                var eventName = ((event && event.touches) || isTouch) ? 'touchend' : 'mouseup';
                return element.on(eventName, callback);
            }
            
            mause.offDown = function (element, callback) {
                var eventName = isTouch ? 'touchstart' : 'mousedown';
                return callback ? element.off(eventName, callback) : element.off(eventName);
            }
            mause.offMove = function (element, callback) {
                var eventName = isTouch ? 'touchmove' : 'mousemove';
                return callback ? element.off(eventName, callback) : element.off(eventName);
            }
            mause.offUp = function (element, callback) {
                var eventName = isTouch ? 'touchend' : 'mouseup';
                return callback ? element.off(eventName, callback) : element.off(eventName);
            }
            mause.offEnter = function (element, callback) {
                var eventName = isTouch ? 'touchstart' : 'mouseenter';
                return callback ? element.off(eventName, callback) : element.off(eventName);
            }

            mause.onWheel = function (element, callback) {
                if (isTouch)
                    return false;
                element.on(toBind, function (event) {
                    element.data('mousewheel-line-height', getLineHeight(element));
                    element.data('mousewheel-page-height', element.height());
                   
                    return wheelHandler(element, event, callback)
                })
            }
            mause.offWheel = function (element, callback) {
                if (isTouch)
                    return false;
                element.data('mousewheel-line-height', '');
                element.data('mousewheel-page-height', '');
                return callback ? element.off(toBind, callback) : element.off(toBind);
            }
            function wheelHandler(element, orgEvent, callback) {
                var orgEvent = orgEvent || window.event,
                    args = [].slice.call(arguments, 1),
                    delta = 0,
                    deltaX = 0,
                    deltaY = 0,
                    absDelta = 0,
                    offsetX = 0,
                    offsetY = 0;
                var event = angular.extend({}, orgEvent);
                event.type = 'mousewheel';

                event.preventDefault = function () {
                    if (orgEvent.preventDefault) {
                        orgEvent.preventDefault();
                    } else {
                        orgEvent.returnValue = false;
                    }
                };
                event.stopPropagation = function () {
                    if (orgEvent.stopPropagation) {
                        orgEvent.stopPropagation();
                    } else {
                        orgEvent.cancelBubble = false;;
                    }
                };

                // Old school scrollwheel delta
                if ('detail' in orgEvent) { deltaY = orgEvent.detail * -1; }
                if ('wheelDelta' in orgEvent) { deltaY = orgEvent.wheelDelta; }
                if ('wheelDeltaY' in orgEvent) { deltaY = orgEvent.wheelDeltaY; }
                if ('wheelDeltaX' in orgEvent) { deltaX = orgEvent.wheelDeltaX * -1; }

                // Firefox < 17 horizontal scrolling related to DOMMouseScroll event
                if ('axis' in orgEvent && orgEvent.axis === orgEvent.HORIZONTAL_AXIS) {
                    deltaX = deltaY * -1;
                    deltaY = 0;
                }

                // Set delta to be deltaY or deltaX if deltaY is 0 for backwards compatabilitiy
                delta = deltaY === 0 ? deltaX : deltaY;

                // New school wheel delta (wheel event)
                if ('deltaY' in orgEvent) {
                    deltaY = orgEvent.deltaY * -1;
                    delta = deltaY;
                }
                if ('deltaX' in orgEvent) {
                    deltaX = orgEvent.deltaX;
                    if (deltaY === 0) { delta = deltaX * -1; }
                }

                // No change actually happened, no reason to go any further
                if (deltaY === 0 && deltaX === 0) { return; }

                // Need to convert lines and pages to pixels if we aren't already in pixels
                // There are three delta modes:
                //   * deltaMode 0 is by pixels, nothing to do
                //   * deltaMode 1 is by lines
                //   * deltaMode 2 is by pages
                if (orgEvent.deltaMode === 1) {
                    var lineHeight = element.data()['mousewheel-line-height'];
                    delta *= lineHeight;
                    deltaY *= lineHeight;
                    deltaX *= lineHeight;
                } else if (orgEvent.deltaMode === 2) {
                    var pageHeight = element.data()['mousewheel-page-height'];
                    delta *= pageHeight;
                    deltaY *= pageHeight;
                    deltaX *= pageHeight;
                }

                // Store lowest absolute delta to normalize the delta values
                absDelta = Math.max(Math.abs(deltaY), Math.abs(deltaX));

                if (!lowestDelta || absDelta < lowestDelta) {
                    lowestDelta = absDelta;

                    // Adjust older deltas if necessary
                    if (shouldAdjustOldDeltas(orgEvent, absDelta)) {
                        lowestDelta /= 40;
                    }
                }

                // Adjust older deltas if necessary
                if (shouldAdjustOldDeltas(orgEvent, absDelta)) {
                    // Divide all the things by 40!
                    delta /= 40;
                    deltaX /= 40;
                    deltaY /= 40;
                }

                // Get a whole, normalized value for the deltas
                delta = Math[delta >= 1 ? 'floor' : 'ceil'](delta / lowestDelta);
                deltaX = Math[deltaX >= 1 ? 'floor' : 'ceil'](deltaX / lowestDelta);
                deltaY = Math[deltaY >= 1 ? 'floor' : 'ceil'](deltaY / lowestDelta);

                // Normalise offsetX and offsetY properties
                if ($mouseConfig.normalizeOffset && element[0].getBoundingClientRect) {
                    var boundingRect = element[0].getBoundingClientRect();
                    offsetX = event.clientX - boundingRect.left;
                    offsetY = event.clientY - boundingRect.top;
                }

                // Add information to the event object
                event.deltaX = deltaX;
                event.deltaY = deltaY;
                event.deltaFactor = lowestDelta;
                event.offsetX = offsetX;
                event.offsetY = offsetY;
                // Go ahead and set deltaMode to 0 since we converted to pixels
                // Although this is a little odd since we overwrite the deltaX/Y
                // properties with normalized deltas.
                event.deltaMode = 0;
                // Add event and delta to the front of the arguments
                args.unshift(event, delta, deltaX, deltaY);
                
                // Clearout lowestDelta after sometime to better
                // handle multiple device types that give different
                // a different lowestDelta
                // Ex: trackpad = 3 and mouse wheel = 120
                if (nullLowestDeltaTimeout) { clearTimeout(nullLowestDeltaTimeout); }
                nullLowestDeltaTimeout = setTimeout(nullLowestDelta, 200);
                return callback(event);
                //return element[0].dispatchEvent.apply(element[0], args);
            }
            function shouldAdjustOldDeltas(orgEvent, absDelta) {
                return $mouseConfig.adjustOldDeltas && orgEvent.type === 'mousewheel' && absDelta % 120 === 0;
            }
            function nullLowestDelta() {
                lowestDelta = null;
            }
            function getLineHeight(elem) {
                var $parent = elem.offsetParent ? elem.offsetParent() : elem.parent();
                if (!$parent.length) {
                    $parent = angular.element('body');
                }
                return parseInt($parent.css('fontSize'), 10) || parseInt(elem.css('fontSize'), 10) || 16;
            }
            return mause;
        }])