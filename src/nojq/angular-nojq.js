(function (window, angular, undefined) {
    'use strict';
    if (typeof jQuery != 'undefined')
        return
    var vdoc = window.document, elproto = window.Element.prototype;
    try {
        vdoc.querySelector(':scope body');
    } catch (err) { // polyfill native methods if it doesn't
        ['querySelector', 'querySelectorAll'].forEach(function (method) {
            var native = elproto[method];
            elproto[method] = function (selectors) {
                if (/(^|,)\s*:scope/.test(selectors)) {
                    var id = this.id, result;
                    this.id = 'ID_' + Date.now();
                    selectors = selectors.replace(/((^|,)\s*):scope/g, '$1#' + this.id);
                    result = vdoc[method](selectors);
                    this.id = id;
                    return result;
                }
                else
                    return native.call(this, selectors);
            }
        });
    };
   
   
        var SPECIAL_CHARS_REGEXP = /([\:\-\_]+(.))/g,
            MOZ_HACK_REGEXP = /^moz([A-Z])/;
        function camelCase(name) {
            return name.
              replace(SPECIAL_CHARS_REGEXP, function (_, separator, letter, offset) {
                  return offset ? letter.toUpperCase() : letter;
              }).
              replace(MOZ_HACK_REGEXP, 'Moz$1');
        };
        var cssNumber = {
            "columnCount": true,
            "fillOpacity": true,
            "flexGrow": true,
            "flexShrink": true,
            "fontWeight": true,
            "lineHeight": true,
            "opacity": true,
            "order": true,
            "orphans": true,
            "widows": true,
            "zIndex": true,
            "zoom": true
        };
        function trimStart(str) {
            while (str && str.length && str.charAt[0] === ' ') {
                str = str.slice(1, str.length - 1)
            }
            return str;
        };
        function getStyles(elem) {
            if (!(elem instanceof HTMLElement))
                return {};

            if (elem.ownerDocument && elem.ownerDocument.defaultView.opener) {
                return elem.ownerDocument.defaultView.getComputedStyle(elem, null);
            }
            if (elem instanceof HTMLElement)
                return window.getComputedStyle(elem, null);
            else
                return {};
        };
        var isDefined = angular.isDefined;
        var forEach = angular.forEach;

        var iframe,
        elemdisplay = {
            HTML: "block",
            BODY: "block"
        };
        var cssValue = function (name, value) {
            if (angular.isNumber(value) && !cssNumber[name])
                value = value + 'px';
            return value;
        };
        var checkParentNode = function (parent, child) {
            if (parent === child)
                return true;
            if (child.path) {
                var length = child.path.length, node = child.path[1], index = 1, has = false;
                while (!has && index < length) {
                    if (node === parent)
                        has = true;
                    index++;
                    node = child.path[index]
                }
                return has;
            }
            else {
                var node = child.parentNode;
                while (node !== null) {
                    if (node == parent) {
                        return true;
                    }
                    node = node.parentNode;
                }
            }

            return false;
        };
        var setOffset = function (elem, options, i) {

            var curPosition, curLeft, curCSSTop, curTop, curOffset, curCSSLeft, calculatePosition,
                computed = getStyles(elem);
            var position = computed.position,
            curElem = angular.element(elem),
            props = {};
            if (position === "static") {
                elem.style.position = "relative";
            }

            curOffset = curElem.offset();
            curCSSTop = computed.top;
            curCSSLeft = computed.left;
            calculatePosition = (position === "absolute" || position === "fixed") &&
                (curCSSTop + curCSSLeft).indexOf("auto") > -1;
            if (calculatePosition) {
                curPosition = getPosition(elem);
                curTop = curPosition.top;
                curLeft = curPosition.left;

            } else {
                curTop = parseFloat(curCSSTop) || 0;
                curLeft = parseFloat(curCSSLeft) || 0;
            }

            if (angular.isFunction(options)) {
                options = options.call(elem, i, angular.extend({}, curOffset));
            }

            if (options.top !== null) {
                props.top = (options.top - curOffset.top) + curTop;
            }
            if (options.left !== null) {
                props.left = (options.left - curOffset.left) + curLeft;
            }

            if ("using" in options) {
                options.using.call(elem, props);

            } else {
                elem.style.top = props.top + 'px';
                elem.style.left = props.left + 'px';
            }
        };
        var getPosition = function (elem) {
            if (!elem) {
                return;
            }

            var offsetParent, offset,
                parentOffset = { top: 0, left: 0 },
                computed = getStyles(elem),
                    CSSposition = computed.position,
                    curElem = angular.element(elem);
            if (CSSposition === "fixed") {
                offset = elem.getBoundingClientRect();

            } else {
                offsetParent = getOffsetParent(elem);
                offset = curElem.offset();
                if (!nodeName(offsetParent, "html")) {
                    parentOffset = angular.extend(parentOffset, angular.element(offsetParent).offset());

                }
                var computedParent = getStyles(offsetParent);
                parentOffset.top += parseInt(computedParent.borderTopWidth, 0);
                parentOffset.left += parseInt(computedParent.borderLeftWidth, 0);
            }
            return {
                top: offset.top - parentOffset.top - parseInt(computed.marginTop, 0),
                left: offset.left - parentOffset.left - parseInt(computed.marginLeft, 0)
            };
        };
        var getOffsetParent = function (elem) {
            var docElem = window.document.documentElement, that = elem[0] ? elem[0] : elem;
            var offsetParent = that && that.offsetParent || docElem,
                    computed = getStyles(that);

            while (offsetParent && (!nodeName(offsetParent, "html") &&
                computed.position === "static")) {
                offsetParent = offsetParent.offsetParent;
            }
            
            return offsetParent || docElem;
        };
        var closest = function (elem, selector) {
            elem = elem.parentNode;
            var matchesSelector = matchesSelectors(elem);
            while (elem && elem.nodeType < 11 && elem.nodeType === 1) {
                if (matchesSelector.call(elem, selector)) {
                    return elem;
                    break;
                } else {
                    elem = elem.parentNode;
                }
            }
            return false;
        };
        var matchesSelectors = function (elem) {
            return elem.matches || elem.webkitMatchesSelector || elem.mozMatchesSelector || elem.msMatchesSelector;
        };
        var nodeName = function (elem, name) {
            return elem.nodeName && elem.nodeName.toLowerCase() === name.toLowerCase();
        };
        var dir = function (elem, node) {
            var matched = [];
            while (elem && (elem = elem[node]) && elem.nodeType !== 9) {
                if (elem.nodeType === 1) {
                    matched.push(elem);
                }
            }
            return matched;
        };
        var sibling = function (cur, dir) {
            while ((cur = cur[dir]) && cur.nodeType !== 1) { }
            return cur;
        };
        var showHide = function (elements, show) {
            var display, elem, hidden,
                values = [],
                index = 0,
                length = elements.length;

            for (; index < length; index++) {
                elem = elements[index];
                if (!elem.style) {
                    continue;
                }
                var $elem = angular.element(elem), dataPriv = $elem.data();
                values[index] = dataPriv["olddisplay"];
                display = elem.style.display;
                if (show) {
                    if (!values[index] && display === "none") {
                        elem.style.display = "";
                    }
                    if (elem.style.display === "" && isHidden(elem)) {
                        values[index] = defaultDisplay(elem.nodeName);
                        $elem.data(
                        "olddisplay",
                        values[index]
                    );
                    }
                } else {
                    hidden = isHidden(elem);

                    if (display !== "none" || !hidden) {
                        $elem.data(
                            "olddisplay",
                            hidden ? display : $elem.css("display")
                        );
                    }
                }
            }
            for (index = 0; index < length; index++) {
                elem = elements[index];
                if (!elem.style) {
                    continue;
                }
                if (!show || elem.style.display === "none" || elem.style.display === "") {
                    elem.style.display = show ? values[index] || "" : "none";
                }
            }

            return elements;
        };
        var isHidden = function (elem, el) {
            elem = el || elem;
            return angular.element(elem).css("display") === "none" ||
                !angular.contains(elem.ownerDocument, elem);
        };
        var actualDisplay = function (name, doc) {
            var elem = angular.element(doc.createElement(name)).appendTo(doc.body),
                display = elem.css("display");
            elem.detach();

            return display;
        };

        var defaultDisplay = function (nodeName) {
            var doc = document,
                display = elemdisplay[nodeName];

            if (!display) {
                display = actualDisplay(nodeName, doc);
                if (display === "none" || !display) {
                    iframe = (iframe || angular.element("<iframe frameborder='0' width='0' height='0'/>"))

                    angular.element('body').append(iframe)
                    doc = (iframe[0].contentWindow || iframe[0].contentDocument).document;
                    doc.write();
                    doc.close();

                    display = actualDisplay(nodeName, doc);
                    iframe.detach();
                }
                elemdisplay[nodeName] = display;
            }
            return display;
        };

        var getWindow = function (elem) {
            return isWindow(elem) ? elem : elem.nodeType === 9 && elem.defaultView;
        };
        var isWindow = function (obj) {
            return obj !== null && obj === obj.window;
        };
        var getUnique = function (arr) {
            var u = {}, a = [];
            for (var i = 0, l = arr.length; i < l; ++i) {
                if (a.indexOf(arr[i]) === -1) {
                    a.push(arr[i]);
                }
            }
            return a;
        };
        var manuplate = function (elem, selector, original) {
            var elems,
                    ret = [],
                    insert = angular.element(selector),
                    last = insert.length - 1,
                    i = 0;

            for (; i <= last; i++) {
                elems = i === last ? elem : elem.clone();

                angular.element(insert[i])[original](elems);

                ret.push.apply(ret, elems.slice());

            }
            return elem.pushStack(ret);
        };
        var filterVisible = function (selector) {
            var elems = angular.element(selector.indexOf(':visible')[0]);
            return elems.is(":visible");
        };
        function applyDimension(elem, dimension, show, time, callback) {
            var dimProp = dimension === 'width' ? 'clientWidth' : 'clientHeight',
                $elm = angular.element(elem),
                size = $elm[dimension](),
                hasStyle = angular.isDefined(elem.style[dimension]);
            time = time && (angular.isNumber(time) ? time : isNaN(parseInt(time)) ? 600 : parseInt(time)) || 600;
            var style = {
                position: elem.style.position || '',
                visibilty: elem.style.visiblity || '',
                display: elem.style.display || '',
                overflow: elem.style.overflow || '',
            }
            style[dimension] = elem.style[dimension];
            if (show) {
                $elm.css({ 'visibilty': 'hidden' });
                $elm.css('display', 'block');
                size = $elm[dimension]();
                $elm.css(style);
            }
           
            !size && (size = 2)
            var unitSize = 10,
                lastSize = show ? 0 : size;
            var start = (new Date()).getTime();
            $elm.css('overflow', 'hidden')
            $elm[dimension](lastSize);
            var i = 1;
            var interval = setInterval(function () {
                var now = (new Date()).getTime();
                unitSize = (size / (time / ((now - start) / i) || 1));
                $elm[dimension](lastSize);
                lastSize = show ? (lastSize + unitSize) : lastSize - unitSize;
                i++;
                if ((now - start) >= time) {
                    clearInterval(interval);
                    interval = null;
                    $elm.css(style);
                    callback && callback();
                }
            }, 1);
           
            setTimeout(function () {
                interval && clearInterval(interval);
            }, time * 2)
        }
        function selectResult(elem, selector) {
            if (elem.length == 1)
                return elem[0].querySelectorAll(selector);
            else {
                var mathches = [];
                forEach(elem, function (elm) {
                    var nodes = angular.element(elm.querySelectorAll(selector));
                    mathches.push.apply(mathches, nodes.slice());
                    
                })
                return mathches;

            }

        }
        var jqLite = angular.element;
        angular.merge = function (first, second) {
            var len = second && +second.length || 0,
                j = 0,
                i = first && first.length || 0;

            for (; j < len; j++) {
                first[i++] = second[j];
            }

            first.length = i;

            return first;
        };
        angular.map = function (elems, callback, arg) {
            var value,
                i = 0,
                length = elems.length,
                isArray = angular.isArray(elems),
                ret = [];
            if (isArray) {
                for (; i < length; i++) {
                    value = callback(elems[i], i, arg);

                    if (value !== null) {
                        ret.push(value);
                    }
                }
            } else {
                for (i in elems) {
                    value = callback(elems[i], i, arg);

                    if (value !== null) {
                        ret.push(value);
                    }
                }
            }
            return [].concat.apply([], ret);
        };
        angular.contains = function (a, b) {
            var adown = a.nodeType === 9 ? a.documentElement : a,
                bup = b && b.parentNode;
            return a === bup || !!(bup && bup.nodeType === 1 && angular.contains(adown, bup));
        };

        jqLite.prototype.width = function (value) {
            if (angular.isDefined(value)) {
                return this.innerWidth(value)
            } else {
                var el = this[0];
                var computedStyle = getStyles(el);
                var width = el.offsetWidth;
                if (computedStyle)
                    width -= parseFloat(computedStyle.paddingLeft) + parseFloat(computedStyle.paddingRight);
                return width;
            }
        };
        jqLite.prototype.innerWidth = function (value) {
            if (angular.isDefined(value)) {
                (this[0].style.width = angular.isNumber(value) ? (value + 'px') : value);
                return this;
            }
            return this[0].clientWidth;
        };
        jqLite.prototype.outerWidth = function (outer) {
            var el = this[0];
            var value = el.offsetWidth;
            if (outer) {
                var computedStyle = getStyles(el);
                value += parseFloat(computedStyle.marginLeft) + parseFloat(computedStyle.marginRight);
            }
            return value;
        };

        jqLite.prototype.height = function (value) {
            if (angular.isDefined(value)) {
                return this.innerHeight(value)
            } else {
                var el = this[0];
                var computedStyle = getStyles(el);
                var height = el.clientHeight;
                if (computedStyle)
                    height -= parseFloat(computedStyle.paddingTop) + parseFloat(computedStyle.paddingBottom);
                return height;
            };
        };
        jqLite.prototype.innerHeight = function (value) {
            if (angular.isDefined(value)) {
                (this[0].style.height = angular.isNumber(value) ? (value + 'px') : value);
                return this;
            }
            return this[0].clientHeight;
        };
        jqLite.prototype.outerHeight = function (margin) {
            var el = this[0];
            var value = el.offsetHeight;
            if (margin) {
                var computedStyle = getStyles(el);
                value += parseFloat(computedStyle.marginTop) + parseFloat(computedStyle.marginBottom);
            }
            return value;
        };
        var _css = jqLite.prototype.css;
        jqLite.prototype.css = function (name, value) {
            var that = this;
            if (angular.isString(name) && isDefined(value)) {
                _css.call(that, name, cssValue(camelCase(name), value))
            }
            else if (angular.isString(name) && that.length) {
                return getStyles(that[0])[camelCase(name)];
            }
            else if (angular.isObject(name)) {
                for (var o in name) {
                    _css.call(that, o, cssValue(camelCase(o), name[o]))
                }
            }
            return this;
        };
     
        jqLite.prototype.first = function () {
            return this.eq(0);
        };
        jqLite.prototype.last = function () {
            return this.eq(-1);
        };
        jqLite.prototype.pushStack = function (elems) {
            var ret = angular.merge(angular.element(), elems);
            ret.prevObject = this;
            ret.context = this.context;
            return ret;
        };

        jqLite.prototype.is = function (name) {
            var el = angular.element(this[0]);
            if (!isDefined(name) || !this.length)
                return false;
            if (angular.isFunction(name))
                return name(this[0]);
            if (angular.isString(name)) {
                if (name.substring(0, 1) == ':') {
                    var bool = /^(?:checked|selected|disabled|multiple|readonly|required)$/i;
                    if (bool.test(name))
                        return angular.isDefined(el.attr((name.substring(1, name.length)).replace(/\ /g, ''))) ? true : false;
                    else if (/:visible|:hidden/.test(name)) {
                        var visible = angular.contains(el[0].ownerDocument, el) || (el.css('display') === 'none' || el.css('visibilty') === 'hidden') ? false : true;
                        return name === ':visible' ? visible : !visible;
                    }
                }
                else {
                    return this[0].tagName.toLowerCase() == name.replace(/\ /g, '').toLowerCase() || false;
                }
            }
        };
        jqLite.prototype.find = function (selector) {
            var context = this[0];
            if (!context || (context.nodeType !== 1 && context.nodeType !== 9)  || !angular.isString(selector)) {
                return [];
            }
            var matches = [];
            if (selector.charAt(0) === '>')
                selector = ':scope ' + selector;
            if (selector.indexOf(':visible') > -1) {
                var elems = angular.element(selectResult(this, selector.split(':visible')[0]))
                
                forEach(elems, function (val, i) {
                    if (angular.element(val).is(':visible'))
                        matches.push(val);
                })
                
            } else {
                matches =  selectResult(this, selector)
            }

            if (matches.length) {
                if (matches.length == 1)
                    return angular.element(matches[0])
                else {
                    return this.pushStack(matches)
                }
            }
            return angular.element();
        };
        jqLite.prototype.has = function (node) {
            if (angular.isString(node)) {
                return this.find(node).length;
            } else {
                var el = node instanceof HTMLElement ? node : angular.isElement(node) && node.length ? node[0] : undefined;
                if (el)
                    return checkParentNode(this[0], el);
            }
            return false;
        };

        jqLite.prototype.closest = function (selector) {
            if (!this.length)
                return angular.element();
            var matches = [];
            forEach(this, function (val, i) {
                var node = closest(val, selector);
                if (node)
                    matches.push(node);
            })
            return this.pushStack(matches)
        };
        jqLite.prototype.before = function (selector) {
            var that = this;
            var before = angular.isElement(selector) ? selector : angular.element(selector);
            that.after(before);
            before.after(that)


            return this;
        };
        jqLite.prototype.index = function (elem) {
            if (!elem) {
                return (this[0] && this[0].parentNode) ? this.first().prevAll().length : -1;
            }
            if (angular.isString(elem)) {
                return angular.element(elem).indexOf(this[0]);
            }
            return this.indexOf(angular.isElement(elem) ? elem[0] : elem);
        };
        forEach({
            prev: function (elem) {
                return sibling(elem, "previousSibling");
            },
            nextAll: function (elem) {
                return dir(elem, "nextSibling");
            },
            prevAll: function (elem) {
                return dir(elem, "previousSibling");
            }
        }, function (fn, name) {
            jqLite.prototype[name] = function () {
                var matched = angular.map(this, fn);

                if (this.length > 1) {
                    if (name == 'prev') {
                        matched = getUnique([]);
                        matched.reverse();
                    }
                }

                return this.pushStack(matched);
            };
        });
        forEach({
            appendTo: "append",
            prependTo: "prepend",
            insertBefore: "before",
            insertAfter: "after",
            replaceAll: "replaceWith"
        }, function (original, name) {

            jqLite.prototype[name] = function (selector) {
                return manuplate(this, selector, original)
            };
        });

        jqLite.prototype.offset = function (options) {
            if (arguments.length) {
                return options === undefined ?
                    this :
                    forEach(this, function (val, i) {
                        setOffset(val, options, i);
                    });
            }
            var docElem, win,
                elem = this[0],
                box = { top: 0, left: 0 },
                doc = elem && elem.ownerDocument;

            if (!doc) {
                return;
            }

            docElem = doc.documentElement;
            if (!angular.contains(docElem, elem)) {
                return box;
            }

            box = elem.getBoundingClientRect();
            win = getWindow(doc);
            return {
                top: box.top + win.pageYOffset - docElem.clientTop,
                left: box.left + win.pageXOffset - docElem.clientLeft
            };
        };
        jqLite.prototype.offsetParent = function () {
            return angular.element(getOffsetParent(this));
        };
        jqLite.prototype.position = function () {
            return getPosition(this[0]);
        };
        forEach({ scrollLeft: "pageXOffset", scrollTop: "pageYOffset" }, function (prop, method) {
            var top = "pageYOffset" === prop;
            jqLite.prototype[method] = function (val) {
                var elem = this;
                var win = getWindow(elem);

                if (val === undefined) {
                    return win ? win[prop] : elem[method]();
                }
                if (win) {
                    win.scrollTo(
                        !top ? val : window.pageXOffset,
                        top ? val : window.pageYOffset
                    );

                } else {
                    elem[0][method] = val;
                }
                return this;
            };
        });
        jqLite.prototype.show = function () {
            return showHide(this, true);
        };
        jqLite.prototype.hide = function () {
            return showHide(this);
        };
        jqLite.prototype.toggle = function (state) {
            if (typeof state === "boolean") {
                return state ? this.show() : this.hide();
            }

            forEach(this, function (val) {
                if (isHidden(val)) {
                    angular.element(val).show();
                } else {
                    angular.element(val).hide();
                }
            });
            return this;
        }
        jqLite.prototype.slice = function () {
            return this.pushStack([].slice.apply(this, arguments));
        };
        jqLite.prototype.focus = function () {
            var that = this;
            forEach(that, function (node) {
                node.focus();
            })
        };
        jqLite.prototype.blur = function () {
            var that = this;
            forEach(that, function (node) {
                node.blur();
            });
        };
        var _html = jqLite.prototype.html;
        jqLite.prototype.html = function (value) {
            if (!angular.isDefined(value))
                return this[0].innerHTML || this[0].innerText;
            if (angular.isElement(value) || navigator.appVersion.indexOf("MSIE 9.") != -1) {
                _html.call(this, '')
                this.append(value)
            } else {
                _html.call(this, value);
            }
               
            return this;
        };
        var _on = jqLite.prototype.on;
        jqLite.prototype.on = function (type, handler) {
            if (type.indexOf(' ') > -1 || type.indexOf('.') == -1)
                return _on.call(this, type, handler);
            var namespaces = type.split('.'), nsEvents = window.namespaces = window.namespaces || {};
            type = namespaces.shift();
            namespaces.sort();
            var key = namespaces.join("_"),
            handlers = nsEvents[key] || [];
            handlers.push(handler);
            nsEvents[key] = handlers;
            return _on.call(this, type, handler);
        };
        var _off = jqLite.prototype.off;
        jqLite.prototype.off = function (type, handler) {
            if (!type || type.indexOf(' ') > -1 || type.indexOf('.') == -1)
                return _off.call(this, type, handler)
            var that = this, namespaces = type.split('.'),
                nsEvents = window.namespaces = window.namespaces || {};
            type = namespaces.shift();
            namespaces.sort();
            var prefix = namespaces.join("_");
            forEach(nsEvents, function (handlers, key) {
                if (key.indexOf(prefix) > -1) {
                    if (handler) {
                        nsEvents[key].splice(handlers.indexOf(handler), 1)
                        return _off.call(that, type, handler)
                    }
                    forEach(handlers, function (hdlr, idx) {
                        delete nsEvents[key]
                        return _off.call(that, type, hdlr)
                    })
                }
            });
            return _off.call(this, type, handler);
        };
        jqLite.prototype.parents = function () {
            return angular.element(dir(this[0], "parentNode"));
        };
        jqLite.prototype.siblings = function () {
            var children = this.parent().children(), that = this;
            var matches = [];
            forEach(children, function (el) {
                if (el != that[0])
                    matches.push(el)
            })
            return angular.element(that[0]).pushStack(matches);
        };
        jqLite.prototype.get = function (num) {
            return num !== null ?
                (num < 0 ? this[num + this.length] : this[num]) :
                [].slice.call(this);
        };
        jqLite.prototype.add = function (selector, context) {
            var that = this;
            return this.pushStack(getUnique((angular.merge(that[0], angular.element(selector, context)))));
        };
        jqLite.prototype.slideDown = function (time, callback) {
            forEach(this, function (elem) {
                applyDimension(elem, 'height', true, time, callback)
            })
            return this;
        };
        jqLite.prototype.slideUp = function (time, callback) {
            forEach(this, function (elem) {
                applyDimension(elem, 'height', false, time, callback)
            })
            return this;
        };
        var _jqLite = angular.element;
        function JQLite(element) {
            if (angular.isString(element)) {
                element = trimStart(element);
                if (element.charAt(0) !== '<') {
                    if (element.indexOf(':visible') > -1)
                        return filterVisible(element);
                    element = document.querySelectorAll(element);
                }
            }
            return _jqLite(element);
        };
        angular.element = JQLite;
        angular.element = angular.extend(angular.element, _jqLite);
        angular.element.prototype = _jqLite.prototype;
        
})(window, window.angular);