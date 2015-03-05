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
                if ('detail' in orgEvent) { deltaY = orgEvent.detail * -1; }
                if ('wheelDelta' in orgEvent) { deltaY = orgEvent.wheelDelta; }
                if ('wheelDeltaY' in orgEvent) { deltaY = orgEvent.wheelDeltaY; }
                if ('wheelDeltaX' in orgEvent) { deltaX = orgEvent.wheelDeltaX * -1; }
                if ('axis' in orgEvent && orgEvent.axis === orgEvent.HORIZONTAL_AXIS) {
                    deltaX = deltaY * -1;
                    deltaY = 0;
                }
                delta = deltaY === 0 ? deltaX : deltaY;
                if ('deltaY' in orgEvent) {
                    deltaY = orgEvent.deltaY * -1;
                    delta = deltaY;
                }
                if ('deltaX' in orgEvent) {
                    deltaX = orgEvent.deltaX;
                    if (deltaY === 0) { delta = deltaX * -1; }
                }
                if (deltaY === 0 && deltaX === 0) { return; }
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
                absDelta = Math.max(Math.abs(deltaY), Math.abs(deltaX));

                if (!lowestDelta || absDelta < lowestDelta) {
                    lowestDelta = absDelta;
                    if (shouldAdjustOldDeltas(orgEvent, absDelta)) {
                        lowestDelta /= 40;
                    }
                }
                if (shouldAdjustOldDeltas(orgEvent, absDelta)) {
                    delta /= 40;
                    deltaX /= 40;
                    deltaY /= 40;
                }
                delta = Math[delta >= 1 ? 'floor' : 'ceil'](delta / lowestDelta);
                deltaX = Math[deltaX >= 1 ? 'floor' : 'ceil'](deltaX / lowestDelta);
                deltaY = Math[deltaY >= 1 ? 'floor' : 'ceil'](deltaY / lowestDelta);
                if ($mouseConfig.normalizeOffset && element[0].getBoundingClientRect) {
                    var boundingRect = element[0].getBoundingClientRect();
                    offsetX = event.clientX - boundingRect.left;
                    offsetY = event.clientY - boundingRect.top;
                }
                event.deltaX = deltaX;
                event.deltaY = deltaY;
                event.deltaFactor = lowestDelta;
                event.offsetX = offsetX;
                event.offsetY = offsetY;
                event.deltaMode = 0;
                args.unshift(event, delta, deltaX, deltaY);
                if (nullLowestDeltaTimeout) { clearTimeout(nullLowestDeltaTimeout); }
                nullLowestDeltaTimeout = setTimeout(nullLowestDelta, 200);
                return callback(event);
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