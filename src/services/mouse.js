'use strict';
angular.module('ngQuantum.services.mouse', [])
        .factory('$mouse', ['$injector', '$window', function ($injector, $window) {
            var isTouch = "createTouch" in $window.document && window.ontouchstart != null;
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
            
            return mause;
        }])