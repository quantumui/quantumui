(function(window, angular){
    'use strict';
    var defaults,
    editApp = angular.module('ngQuantum.pageable.editing', ['ngQuantum.services.templateHelper'])
    .provider('$pageableTemplate', function () {
        defaults = this.defaults = {
            name: 'pageableEditForm',
            templateId: 'pageableTemplate',
            onShow: false,
            onHide: false,
            onChange: false,
            disableRemote:true,
            alias: 'aliasModel',
            container: false,
            type: 'insertedit',
            insertPlacement: 'start',
            insertDefault:'{}',
            enterMethod: 'append',
            defaultTitle: 'Pageable Default Title',
            multipleMode: false,
            panelClasses: 'panel-default',
            templateUrl: 'pageable/editing.panel.tpl.html',
            noTemplate: false,
            effectClasses: 'fastest from-left'
        };
        this.$get = ['templateHelper', '$timeout', '$animate', '$compile', function (templateHelper, $timeout, $animate, $compile) {
            function Factory(element, config, controller) {

                var options = angular.extend({}, defaults, config),
                    $parent = controller.$scope, tScope = $parent.$new();
                if (!controller.templates)
                    controller.templates = {}
                else if (controller.templates[options.templateId])
                    alert(options.templateId + ' already exist.');

                options.modelOptions = options.modelOptions ? $parent(options.modelOptions) : false;
                options.alias = config.alias || controller.rowField || 'pageableAlias';
                var type = options.type, html, transcluded = false, panel,
                    container = options.container;
                controller.editOptions = options;

                if (container == 'self') {
                    html = element[0].innerHTML;
                    element.html(' ');
                } else {
                    html = element[0].outerHTML;
                    element.remove();
                }
                function templateTransclude(callback) {
                    if (options.noTemplate) {
                        normalizeTemplate(angular.element(html))
                        callback && callback();
                    }
                    else
                        templateHelper.fetchTemplate(options.templateUrl).then(function (template) {
                            if (!angular.isElement(template))
                                template = angular.element(template);
                            var transclude = template.find('.pageable-template-transclude');
                            transclude.length && transclude.html(html) || template.append(html);
                            normalizeTemplate(template)
                            callback && callback();
                        });
                }
                function normalizeTemplate(template) {
                    var normalized, typeClasses = 'pageable-template-' + type;
                    
                    if (/over|self/.test(container))
                        typeClasses += ' pageable-template-' + container;
                    if (options.multipleMode) {
                        if (controller.elementTag == 'tr') {
                            var colspan = getTableColumnCount(controller.tableElement[0]);
                            normalized = '<tr class="' + typeClasses + '"><td colspan="' + colspan + '">' + template[0].outerHTML + '</td></tr>';
                        } else {
                            var tag = elementTag;
                            normalized = '<' + tag + 'class="' + typeClasses + '">' + template[0].outerHTML + '</' + tag + '>';
                        }
                        container = options.container = 'over';
                    } else {
                        normalized = template.addClass(typeClasses)[0].outerHTML;
                        if (!/over|self/.test(container)) {
                            panel = angular.element(container);
                            panel = panel.length ? panel.first() : controller.$container;
                        }
                        else if (container == 'self')
                            panel = element;
                        else
                            panel = controller.$container;
                        
                    }

                    if (type == 'insertedit') {
                        tScope.insertTemplate = normalized;
                        tScope.editTemplate = normalized;
                    }
                    else
                        tScope[type + 'Template'] = normalized;
                    console.log('type',type)
                    transcluded = true;
                }
                function getTableColumnCount(table) {
                    var columnCount = 0;
                    var rows = table.rows;
                    if (rows.length > 0) {
                        var cells = rows[0].cells;
                        for (var i = 0, len = cells.length; i < len; ++i) {
                            columnCount += cells[i].colSpan;
                        }
                    }
                    return columnCount;
                }
                var initialize = function (scope, tType) {
                    var $child = scope.$new(), templateKey = tType + 'Template', viewKey = tType + 'View';
                    $child.templateType = tType;
                    $child.defaultTitle = options.defaultTitle;
                    function _show() {
                        if (options.multipleMode && scope[viewKey])
                            return;
                        else if (!options.multipleMode && container !== 'over' && tScope[viewKey]) {
                            getRowField();
                            return;
                        }
                        var viewEl = angular.element(tScope[templateKey]),
                           parent,
                           after;
                        console.log('dsdsds', viewEl, tScope)
                        if (container == 'over') {
                            parent = controller.shellElement;
                            var items = controller.shellElement.find('.pageable-item');
                            if (tType == 'insert')
                                after = options.insertPlacement != 'end' ? false : items.last();
                            else
                                after = scope.$isPageableItem && scope.$index > -1 ? items.eq(scope.$index) : false;
                        }
                        else {
                            parent = panel;
                            after = container == 'self' || options.enterMethod == 'append' ? false : panel.children().last();
                        }
                        $timeout(function () {
                            viewEl.addClass('pageable-template-wrapper').addClass(options.effectClasses)

                            if (options.multipleMode) {
                                scope[viewKey] = viewEl;
                                $animate.enter(viewEl, parent, after);
                            } else {
                                var promise = tScope[viewKey] ? $animate.leave(tScope[viewKey]) : { then: function (c) { c(); } };
                                promise.then(function () {
                                    $animate.enter(viewEl, parent, after);
                                    tScope[viewKey] = viewEl;
                                })
                            }
                            $compile(viewEl)($child);
                            $child.viewEl = viewEl;
                            options.onShow && scope.$eval(options.onShow);
                            scope.$panelClasses = options.panelClasses
                        }, 0);
                    };
                    function getRowField() {
                        $timeout(function () {
                            var extend = tType == 'insert' ? scope.$eval(options.insertDefault) : scope[controller.rowField];
                            $child[options.alias] = {};
                            $child[options.alias] = angular.copy(extend, {});
                            options.onChange && scope.$eval(options.onChange);
                        })
                    }
                    scope.$on('$refreshPager', function () {
                        $child.$back();
                    })
                    $child.$back = function () {
                        var viewObj = options.multipleMode ? scope : tScope;
                        var viewEl = viewObj[viewKey];
                        viewEl && viewEl.length && $animate.leave(viewEl).then(function () { viewEl.remove() });
                        viewObj[viewKey] = false;
                        options.onHide && scope.$eval(options.onHide);
                    };
                    $child.$show = function () {
                        getRowField();
                        if (transcluded)
                            _show();
                        else
                            templateTransclude(_show);
                    };
                    if (tType !== 'detail') {
                        function setRowField() {
                            $timeout(function () {
                                if (tType !== 'insert')
                                    scope[controller.rowField] = angular.copy($child[options.alias], {});
                                options.onChange && scope.$eval(options.onChange);
                            })

                        }
                        function save() {
                            var formCtrl = $child[options.name];
                            if (options.modelOptions && options.modelOptions.updateOn == 'submit') {
                                formCtrl && formCtrl.$commitViewValue();
                            }
                            formCtrl.$commitViewValue();
                            formCtrl.$setSubmitted();
                            formCtrl.$$parentForm.$setValidity();
                            if (formCtrl.$invalid)
                                return;
                            if (options.disableRemote) {
                                tType == 'edit' ? setRowField() : controller.addRow($child[options.alias]);
                                $child.$back();
                            } else {
                                var promise = controller.saveRow($child[options.alias], tType == 'insert');
                                promise.then(function () {
                                    $child.$back();
                                })
                            }

                        }

                        $child.$cancel = function () {
                            getRowField();
                        };
                        $child.$save = function () {
                            $timeout(function () {
                                save();
                            }, 0)
                        };
                        $child.$delete = function () {
                            $timeout(function () {
                                controller.deleteRow(scope[controller.rowField]);
                                $child.$back();
                            }, 0)
                        };
                        $child.$submit = function (evt) {
                            var form = $child.viewEl.find('.pageable-template-container');
                            $timeout(function () {
                                form.triggerHandler('submit')
                            }, 0)

                        };
                    }
                    
                    return $child;
                }
                var $factory = {
                    initialize: initialize
                }
                controller.templates[options.templateId] = $factory;
                return $factory;
            }
            return Factory;
        }
        ];
    })
    .directive('nqPageableTemplate', ['$pageableTemplate', function ($pageableTemplate) {
        return {
            restrict: 'A',
            require: '^nqPageable',
            terminal: true,
            scope: false,
            priority: 1000,
            compile: function (tElm, tAttrs, transclude) {
                tElm.removeAttr('nq-pageable-template');
                tElm.removeAttr('data-nq-pageable-template');
                !tAttrs.type && tAttrs.$set('type', 'insertedit');
                !/edit|insert|detail|insertedit/.test(tAttrs.type) && tAttrs.$set('type', 'insertedit');
                if (tAttrs.type !== 'detail')
                    !tAttrs.name && tAttrs.$set('name', 'pageableEditForm');
                return function postLink(scope, element, attr, controller) {
                    var options = {}
                    for (var o in defaults) {
                        if (angular.isDefined(attr[o])) {
                            options[o] = attr[o];
                        }
                    }
                    element.addClass('pageable-template-container')
                    angular.isDefined(attr.ngModelOptions) && (options.modelOptions = attr.ngModelOptions)
                    var template = new $pageableTemplate(element, options, controller)
                }
            }
        };
    }]);
    angular.forEach(['Edit','Insert','Detail'], function (directive, index) {
        editApp.directive('nqShow' + directive, function () {
            return {
                restrict: 'A',
                require: '^nqPageable',
                link: function postLink(scope, element, attr, controller) {
                    var initialized = false, $child;
                    element.on('click', handler);
                    function init() {
                        if (!controller.templates) {
                            off(); return;
                        }
                        var templateId = attr.templateId, template;
                        if (templateId && controller.templates.hasOwnProperty(templateId))
                            template = controller.templates[templateId]
                        else
                            template = controller.templates[Object.keys(controller.templates)[0]];
                        if (!angular.isObject(template) || !template.hasOwnProperty('initialize')) {
                            off(); return;
                        }
                        $child = template.initialize(scope, directive.toLowerCase());
                    }
                    function handler(evt) {
                        evt.preventDefault();
                        !initialized && init();
                        $child && $child.$show();
                    }
                    function off() {
                        element.off('click', handler);
                    }
                }
            };
        })
    })
    
})(window, window.angular)