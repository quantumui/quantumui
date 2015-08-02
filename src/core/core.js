if (!String.prototype.trim) {
    String.prototype.trim = function () {
        return this.replace(/^\s+|\s+$/g, '');
    };
};
String.prototype.trimEnd = function (c) {
    var that = this.trim();
    if (c == null || c == "" || c.length > 1 || that.length < 2)
        return that;
    var s = that.slice(that.length - 1, that.length);
    if (s == c)
        return that.slice(0, this.length - 1);
    else
        return that;
};
String.prototype.trimStart = function (c) {
    var that = this.trim();
    if (c == null || c == "" || c.length > 1 || that.length < 2)
        return that;
    var s = that.slice(0, 1);
    if (s == c)
        return that.slice(1, that.length);
    else
        return that;
};
String.prototype.capitaliseFirstLetter = function () {
    return this.charAt(0).toUpperCase() + this.slice(1);
};
if (typeof String.prototype.endsWith !== 'function') {
    String.prototype.endsWith = function (suffix) {
        return this.indexOf(suffix, this.length - suffix.length) !== -1;
    };
};
String.prototype.toTitleCase = function (str) {
    var str = this || '';
    return str.replace(/\w\S*/g, function (txt) { return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(); });
};
String.prototype.replaceAll = function (find, replace) {
    var str = this || '';
    return str.replace(new RegExp(find, 'g'), replace);
};
if (typeof String.prototype.startsWith != 'function') {
    String.prototype.startsWith = function (str) {
        return this.slice(0, str.length) == str;
    };
};
if (typeof String.prototype.endsWith != 'function') {
    String.prototype.endsWith = function (str) {
        return this.slice(-str.length) == str;
    };
};
window.addResizeEvent = function (callback) {
    if (window.addEventListener) {
        window.addEventListener('resize', callback, true);
    }
    else if (window.attachEvent) {
        window.attachEvent('onresize', callback);
    }
};

+function (window, angular, undefined) {
    'use strict';
    var  $$raf  =
        window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function (callback) {
            setTimeout(function () {
                callback.call(null, false)
            }, 150);
        };
    angular.element.prototype.removeClasses = function (classList) {
        var el = this;
        var list = angular.isArray(classList) ? classList : angular.isStrign(classList) ? classList.split(" ") : [];
        angular.forEach(list, function (val, key) {
            val && el.removeClass(val);
        })
        return this;
    }
   

    angular.element.prototype.animationEnd = function (callback) {
        var el = this;
        el.one('animationend webkitAnimationEnd oAnimationEnd oanimationend MSAnimationEnd',
            function (evt) {
                callback(evt);
            });
        $$raf(function (evt) {
            if (evt === false)
                callback(evt);
        })
        return this;
    }
    angular.element.prototype.transitionEnd = function (callback) {
        var el = this;
        
        el.one('transitionend webkitTransitionEnd oTransitionEnd otransitionend',
            function (evt) {
                callback(evt);
            });
        $$raf(function (evt) {
            if (evt === false)
                callback(evt);
        })
        return this;
    }
    var nqCoreApp = angular.module('ngQuantum.directives', [])
    angular.forEach(['Append', 'Prepend', 'Bind'], function (directive) {
        nqCoreApp.directive('nq' + directive, ['$compile', function ($compile) {
            return {
                restrict: 'A',
                link: function (scope, element, attr) {
                    var dirName = 'nq' + directive;
                    element.addClass('nq-' + directive.toLowerCase()).data('$nqbind', attr[dirName]);
                    scope.$watch(attr[dirName], function (value) {
                        ensureElement(value);
                    });
                    function bindElement(value) {
                        switch (dirName) {
                            case 'nqAppend':
                                element.append(value)
                                break;
                            case 'nqPrepend':
                                element.prepend(value)
                                break;
                            case 'nqBind':
                                element.html('')
                                element.append(value)
                                break;
                        }
                    }
                    function ensureElement(value) {
                        if (angular.isElement(value))
                            bindElement(value);
                        else {
                            if (angular.isString(value)) {
                                if (value.indexOf('{{') > -1 || value.indexOf('ng-bind') > -1) {
                                    var complied = angular.element(value);
                                    $compile(complied)(scope)
                                    bindElement(complied);
                                }
                                else if (value.indexOf('</') > -1 && value.indexOf('>') > -1)
                                    bindElement(angular.element(value));
                                else
                                    bindElement(value);
                            }
                        }
                    }
                }
            }
        }]);
    })
}(window, window.angular);
