'use strict';
angular.module('ngQuantum.pageable.scroll', ['ngQuantum.scrollbar'])
.directive('nqFixTableScroll', ['$compile', function ($compile) {
    return {
        restrict: 'C',
        require: '^nqPageable',
        priority: 0,
        compile: function (tElm, tAttrs, transclude) {
            var tag = tElm[0].tagName.toLowerCase();
            if (!/thead|tfoot/.test(tag))
                return;
            var tfoot = tag == 'tfoot';
            var parent = tElm.parent(), container = parent.parent(), appended = false;
            tElm.removeClass('nq-fix-table-scroll')
            var table = angular.element('<table style="position:absolute;"></table>').html(tElm.clone());
            tfoot && table.css('bottom', '0') || table.css('top','0')
            return function postLink(scope, element, attr, controller) {
                var pos = container.css('position');
                (!pos || pos==='static') && container.css('position', 'relative')
                container.on('scroll', function () {
                    var scrollTop = container[0].scrollTop;
                    if (scrollTop > 0) {
                        append();
                        show();
                        if (tfoot){
                            table.css('bottom', -scrollTop);
                            if (container[0].scrollHeight < (scrollTop + container[0].clientHeight + 10))
                                table.hide();
                        }
                        else
                            table.css('top', scrollTop);
                    }
                    else {
                       table.hide();
                       if (tfoot && parent.height() > container.height()) {
                           show();
                            table.css('bottom', 0);
                        }
                    }

                });
                scope.$on('$pageableItemsRendered', initFooter);
                function initFooter() {
                    if (tfoot && parent.height() > container.height()) {
                        append();
                        show();
                    }
                }
                function show() {
                    table.show();
                    table.css('width', parent.outerWidth())
                }
                function append() {
                    if (!appended) {
                        appended = true;
                        table.attr('class', parent.attr('class'));
                        parent.after(table);
                        $compile(table)(scope);
                        tfoot ? table.addClass('table-footer-clone') : table.addClass('table-header-clone');
                    }
                }

            }
        }
    };
}]);