'use strict';
angular.module('ngQuantum.pageable.factory', ['ngQuantum.services.helpers'])
.provider('$pageable', function () {
    var defaults = this.defaults = {
        effect: 'fade-in',
        speed: 'fastest',
        theme: false,
        placement: 'bottom',
        pageNumbers: 3,
        pageSize: 10,
        showSize: true,
        showResultText: true,
        sizeOptions: [10, 20, 30, 40, 50],
        startPage: 1,
        firstLast: true,
        prevNext: true,
        firstText: 'First',
        lastText: 'Last',
        nextText: 'Next',
        previousText: 'Previous',
        currentPageText: 'Current Page',
        totalPageText: 'Total Pages',
        totalResultText: 'Total Results',
        noTotalResultText: 'Your server response do not have "totalResult" field. Pager cannot be displayed.',
        sizesText: 'Size :',
        remotePaging: false,
        dataType: 'json',
        method: 'GET',
        methodFilter: 'POST',
        methodDelete: 'DELETE',
        methodUpdate: 'PUT',
        paramsField: 'PageableRequest',
        primaryKeys:false,
        serverRoot: false,
        baseUrl: false,
        deleteSuffix: false,
        updateSuffix: false,
        insertSuffix: false,
        routeParams: false,
        useQueryString: false,
        refreshOnChange:true,
        cacheResult: false,
        templateUrl: false,
        pagerTamplate: false,
        lazyAjax: true,
        selectable: false,
        selectionMode: 'row',
        selectionClass:'active',
        recordsField: 'records',
        totalField: 'totalResult'
    };
    this.$get = ['$timeout', '$filter', '$http', '$rootScope', '$parse', '$helpers','$q', '$lazyRequest',
        function ($timeout, $filter, $http, $rootScope, $parse, $helpers, $q, $lazyRequest) {
            function Factory(element, config, attr) {

                var $pageable = {}, options = {}, currentPage = 1;
                attr && (config = $helpers.parseOptions(attr, config))
                  
                options = $pageable.$options = angular.extend(defaults, config);
                var scope = $pageable.$scope = options.$scope || $rootScope.$new();
                if (attr) {
                    if (angular.isDefined(attr.qoAllOptions)) {
                        options = scope.$eval(attr.qoAllOptions)
                    } else {
                        options = $pageable.$options = $helpers.observeOptions(attr, $pageable.$options);
                        angular.forEach(['formatRequest', 'formatData', 'loadError', 'deleted', 'updated', 'inserted', 'onRefresh'],
                            function (val) {
                                if (angular.isDefined(attr[val])) {
                                    options[val] = $parse(attr[val]);
                                }
                            })
                    }
                    
                }
                
                scope.$pageableBusy = true;
                scope.$modelKey = options.pageableModel;
                var modelData = [], sortedData;
                $pageable.caches = {};
                $pageable.init = function () {
                    var promise;
                    optimize();
                    if (options.baseUrl) {
                        if (options.lazyAjax) {
                            promise =  $lazyRequest(function () {
                                return $pageable.loadRemote();
                            }, 0)
                        }
                        else
                            promise = $pageable.loadRemote();
                    }
                    if (!promise)
                        promise = $q.when(null);
                    promise.then(function () {
                        scope.selectedRows = [];
                        scope.$pageableBusy = false;
                    })
                };
                $pageable.setModelData = function (data, isServer, error) {
                    var promise;
                    if (error) {
                        promise = $timeout(function () {
                            scope.$error = true;
                            scope.$currentRows = [];
                            modelData = scope[scope.$modelKey] = [];
                            scope.$currentPage = 0;
                            scope.totalResult = 0;
                        }, 0)
                    }
                    else {
                        if (angular.isArray(data)) {
                            if (options.remotePaging) {
                                promise = $timeout(function () {
                                    scope.$pagerWarning = options.noTotalResultText;
                                    scope.$currentPage = 0;
                                    scope.totalResult = 0;
                                    $pageable.getRows(data);
                                }, 0)
                            }
                            else {
                                promise = $timeout(function () {
                                    scope.$pagerWarning = false;
                                    modelData = scope[scope.$modelKey] = data || [];
                                    scope.totalResult = modelData.length;
                                    $pageable.getRows();
                                }, 0)
                                  
                            }
                        } else if (angular.isObject(data)) {
                            var total, array;
                            total = $helpers.getFieldValue(data, options.totalField);
                            array = $helpers.getFieldValue(data, options.recordsField);
                            
                            if (!total || !array) {
                                for (var o in data) {
                                    if (!total && angular.isNumber(data[o]))
                                        total = data[o];
                                    if (!array && angular.isArray(data[o]))
                                        array = data[o]
                                    if (array && total)
                                        break;
                                }
                            }
                            promise = $timeout(function () {
                                scope.totalResult = total;
                                if (options.remotePaging) {
                                    scope.totalResult = total;
                                    modelData = array;
                                    $pageable.getRows(array, total);
                                    
                                } else {
                                    modelData = scope[scope.$modelKey] = array || [];
                                    $pageable.getRows();
                                }
                            }, 0)
                              
                        }
                        if (promise && promise.then)
                            promise.then(function () {
                                $pageable.localdata = modelData.slice();
                            })
                          
                    }
                }
                $pageable.getRows = function (newrows, total) {
                    var rows = newrows || [];
                    var cp = scope.$currentPage = scope.$currentPage || options.startPage || 1;
                    scope.$pageSize = scope.$pageSize || options.pageSize || 10;
                    if (!rows.length) {
                        if (options.remotePaging) {
                            if (!newrows)
                                $pageable.loadRemote();
                            else if (!newrows.length)
                                setRows();
                        }
                        else {
                            
                            var start = (cp - 1) * scope.$pageSize;
                            rows = modelData.slice(start, start + scope.$pageSize);
                            setRows()
                        }
                    }
                    else {
                        setRows();
                    }
                    function setRows() {
                        $timeout(function () {
                            !total && (scope.totalResult = modelData.length);
                            scope.$currentRows = rows;
                            setTotalPages();
                            scope.$broadcast('$refreshPager')
                        }, 0);
                    }

                }
                $pageable.gotoPage = function (val) {
                    $timeout(function () {
                        !scope.$totalPages && setTotalPages();
                        if (scope.$currentPage !== val && val > 0 && val <= scope.$totalPages) {
                            scope.$currentPage = val;
                            $pageable.getRows();
                        }
                        
                    },0)
                }
                $pageable.loadRemote = function () {
                    scope.$pageableBusy = true;
                    var obj = { params: loadingParams(), url: buildUrl(), eventType: 'load' }, ajax = {};
                   
                    if (options.formatRequest) {
                        ajax = callFormatUrl(obj)
                    }
                    else {
                        
                        var post = options.method.toLowerCase() == 'post';
                        ajax.method = post ? 'POST' : 'GET';
                        var prm = angular.extend({}, obj.params.routeParams);
                        if (post) {
                            ajax.url = buildUrl(prm);
                            var data = angular.extend({}, obj.params)
                            data.routeParams && delete data.routeParams;
                            ajax.data = {}, ajax.data[options.paramsField] = data;
                        }
                        else {
                            prm = angular.extend({}, prm, obj.params.pageParams, obj.params.sortParams, { 'searchTerm': obj.params.searchTerm });
                            ajax.url = buildUrl(prm);
                        }
                       if (options.useQueryString) {
                            ajax.params = prm;
                        }
                    }
                    ajax && (ajax.cache = options.cacheResult);
                    
                    if (ajax)
                        return $http(ajax)
                            .success(function (res) {
                                var data = res.data ? res.data : res;
                                if (options.formatData) {
                                    data = options.formatData(scope, { $response: res })
                                }
                                scope.$noResultFound = !data.length;
                                $pageable.setModelData(data, true);
                                scope.$pageableBusy = false;
                                scope.$errorResponse = '';
                                scope.$error = false;
                            })
                            .error(function (res) {
                                scope.$pageableBusy = false;
                                scope.$noResultFound = true;
                                if (options.loadError) {
                                    var data = options.loadError(scope, { $response: res })
                                }
                                scope.$errorResponse = res;
                                $pageable.setModelData(null, true, true)
                            });
                }

               
                $pageable.sortTable = function (field, direction) {
                    var multiple = options.sortingMode == 'multiple';
                    if (options.remotePaging) {
                        setSortKey(field, direction, multiple);
                        scope.$currentPage = 1;
                        $pageable.loadRemote();
                    }
                    else {
                        if (multiple) {
                            if (!sortedData)
                                sortedData = angular.extend({}, $pageable.localdata)
                            modelData = $filter('orderBy')(sortedData, field, direction == 'desc' ? true : false);
                        }
                        else
                            modelData = $filter('orderBy')($pageable.localdata, field, direction == 'desc' ? true : false);
                        $pageable.getRows();
                    }

                }
                $pageable.searchTable = function (fields, term) {
                    scope.$currentPage = 1;
                    if (options.remotePaging) {
                        scope.searchTerm = term;
                        $pageable.loadRemote();
                    }
                    else {
                        modelData = $filter('filter')($pageable.localdata, function (item, key) {
                            var match = false, i = 0;
                            while (!match && i < fields.length) {
                                var value = $helpers.getFieldValue(item, fields[i]);
                                if (value) {
                                    if (angular.isString(value))
                                        match = (value.toLowerCase()).indexOf(term.toLowerCase()) > -1;
                                    else
                                        match = (value == term);
                                }

                                i++;
                            }
                            return match;
                        });
                        scope.totalResult = modelData.length;
                        $pageable.getRows();
                    }

                }
                $pageable.refresh = function (full) {
                    scope.$currentPage = 1;
                    sortedData = false;
                    if (options.remotePaging || (full && options.baseUrl)) {
                        scope.searchTerm = false;
                        scope.sortParam = false;
                        scope.totalResult = 0;
                        $pageable.loadRemote();
                    }
                    else {
                        $timeout(function () {
                            modelData = $pageable.localdata.slice();
                            scope.totalResult = modelData.length;
                            $pageable.getRows();
                        }, 0)
                        
                    }
                    scope.selectedRows = [];
                }
                
                
             
                scope.$watch('$pageSize', function (newVal, oldVal) {
                    if (newVal && oldVal && oldVal !== newVal) {
                        scope.selectedRows = [];
                        $pageable.getRows();
                    }
                })
                function optimize() {
                    if (angular.isString(options.sizeOptions))
                        options.sizeOptions = eval(options.sizeOptions);
                }
                function callFormatUrl(obj) {
                    if (options.formatRequest) {
                        var called = options.formatRequest(scope, { $url: obj.url, $params: obj.params, $eventType:obj.eventType });
                        if (angular.isString(called)) {
                            obj.url = called;
                            obj.params = false;
                        } else if (angular.isObject(called)) {
                            url = called.url;
                            obj.params = called.params;
                        }
                    }
                    return obj;
                }
                function loadingParams() {
                    var params = {};
                    var rp = routeParams();
                    if (rp) params.routeParams = rp;
                    params.pageParams = pageParams();
                    if (scope.sortParam) params.sortParams = scope.sortParam;
                    if (scope.searchTerm) params.searchTerm = scope.searchTerm;
                    return params == {} ? undefined : params;
                }
                function deletingParams(items) {
                    var params = {};
                    var rp = routeParams();
                    rp && (params.routeParams = rp);
                    params.items = deleteParams(items);
                    return params;
                }
                function routeParams() {
                    var params = {};
                    if (options.routeParams) {
                        if (angular.isArray(options.routeParams)) {
                            var arr = options.routeParams;
                            for (var i = 0; i < arr.length; i++) {
                                if ($rootScope.params[arr[i]])
                                    params[arr[i]] = $rootScope.params[arr[i]];
                            }
                        } else if (angular.isString(options.routeParams))
                            if ($rootScope.params[options.routeParams])
                                params[options.routeParams] = $rootScope.params[options.routeParams];
                    }
                    return params == {} ? false : params;
                }
                function pageParams() {
                    return {
                        pageno: scope.$currentPage || options.startPage || 1,
                        pagesize: scope.$pageSize || options.pageSize || 10
                    };
                }
                function deleteParams(items) {
                    if (items) {
                        if (angular.isArray(items) && items.length) {
                            var params = [];
                            angular.forEach(items, function (item) {
                                var prm = getPrimaryParams(item);
                                prm && params.push(prm);
                            })
                            return params.length ? params : false;
                        }
                        else if (angular.isObject(items))
                            return getPrimaryParams(items)
                    }
                    return false;
                }
                function getPrimaryParams(item) {
                    var keys = options.primaryKeys && options.primaryKeys.split(',') || [], params = {};
                    angular.forEach(keys, function (val) {
                        params[val] = item[val];

                    })
                    return params == {} ? false : params
                }
                function setSortKey(key, type, multiple) {
                    var prm = {
                        sortKey: key,
                        direction: type
                    }
                    if (multiple) {
                        scope.sortParam = angular.extend(scope.sortParam, prm);
                    }
                    else
                        scope.sortParam = prm;
                    
                }
             
                function buildUrl(params, suffix) {
                    var url = (options.serverRoot || '') + options.baseUrl;
                    if (suffix)
                        url = url.trimEnd('/'), url = url + suffix;
                    if (!options.useQueryString && params) {
                        url = $helpers.formatUrl(url, params)
                    }
                    return url;
                }

                function setTotalPages() {
                    scope.allPages = [];
                    var length = scope.totalResult;
                    scope.$totalPages = 1;
                    if (length % (scope.$pageSize || 10) == 0)
                        scope.$totalPages = (length / (scope.$pageSize || 10))
                    else
                        scope.$totalPages = parseInt(length / (scope.$pageSize || 10) + 1);
                    if (scope.$totalPages)
                        for (var i = 1; i <= scope.$totalPages; i++) {
                            scope.allPages.push(i);
                        }
             
                }
                function splicePages(pageNumbers, pages) {
                    var newPages = pages && pages.slice() || [], allPages = scope.allPages;
                    if (scope.$currentPage < pageNumbers || scope.$totalPages == pageNumbers)
                        newPages = allPages.slice(0, spliceValue(pageNumbers))
                    else if (pages.length) {
                        if (pages.length < pageNumbers || scope.$totalPages == scope.$currentPage) {
                            var start = scope.$totalPages - pageNumbers > 0 ? scope.$totalPages - pageNumbers : 0;
                            newPages = allPages.slice(start, spliceValue(scope.$totalPages))
                        }
                        else if (scope.$currentPage == pages[pages.length - 1])
                            newPages = allPages.slice(scope.$currentPage - 1, spliceValue(pageNumbers + scope.$currentPage - 1));
                        else if (scope.$currentPage == pages[0])
                            newPages = allPages.slice(scope.$currentPage - pageNumbers, spliceValue(scope.$currentPage))

                    }
                    else {
                        var start = scope.$currentPage - pageNumbers > 0 ? scope.$currentPage - pageNumbers : 0;
                        newPages = allPages.slice(start, spliceValue(pageNumbers + scope.$currentPage - 1))
                    }
                    
                    return newPages;
                }
                function spliceValue(number) {
                    return number < scope.$totalPages ? number : scope.$totalPages
                }
                function deleteRow(item) {
                    var items = item || scope.selectedRows, dparams = deletingParams(items);
                    if (!items || !dparams.items)
                        return false;
                    scope.$deletingProcess = true;
                    var obj = { params: dparams, url: buildUrl(null, options.deleteSuffix), eventType: 'delete' }, ajax = {};
                    if (options.formatRequest) {
                        ajax = callFormatUrl(obj)
                    }
                    else {
                        var prm = angular.extend({}, obj.params.routeParams)
                        if (angular.isArray(items) || options.methodDelete.toLowerCase() == 'post') {
                            ajax.url = buildUrl(prm, options.deleteSuffix);
                            ajax.method = 'POST';
                            ajax.data[options.paramsField] = obj.items;
                            
                        }
                        else {
                            prm = angular.extend({}, obj.params.routeParams, obj.params.items)
                            ajax.url = buildUrl(prm, options.deleteSuffix);
                            ajax.method = options.methodDelete;
                        }

                        if (options.useQueryString) {
                            ajax.params = prm;
                        }
                    }
                    if(ajax)
                    return $http(ajax)
                        .success(function (res) {
                            var data = res.data ? res.data : res;
                            if (data != false)
                                removeRows(items);
                            scope.$deletingProcess = false;
                            options.deleted && options.deleted(scope, { $response: res });
                            if (options.refreshOnChange)
                                $pageable.getRows();
                        })
                        .error(function (res) {
                            scope.$deletingProcess = false;
                            options.deleted && options.deleted(scope, { $response: res, $error: true })
                        });
                }
                function removeRows(items) {
                    angular.forEach(items, function (item) {
                        removeRow(item);
                    })
                }
                function removeRow(item) {
                    var index = -1;
                    if ($pageable.localdata && $pageable.localdata.length && (index = $pageable.localdata.indexOf(item)) > -1)
                        $pageable.localdata.splice(index, 1);
                    if (sortedData && sortedData.length && (index = sortedData.indexOf(item)) > -1)
                        sortedData.splice(index, 1);
                    if (modelData && modelData.length && (index = modelData.indexOf(item)) > -1)
                        modelData.splice(index, 1);
                    if (scope.$currentRows.length && (index = scope.$currentRows.indexOf(item)) > -1)
                        scope.$currentRows.splice(index, 1);

                    setRowSelection(item);
                    return true;
                }
                function saveRow(item, isNew) {;
                    if (!item)
                        return false;
                    scope.$savingProcess = true;
                    var rp = routeParams(),
                        eventType = isNew ? 'insert' : 'update',
                        method = isNew ? 'POST' : options.methodUpdate,
                        parseKey = isNew ? 'inserted' : 'updated',
                    obj = { params: {routeParams:rp, data:item}, url: buildUrl(null, options[eventType + 'Suffix']), eventType: eventType}, ajax = {};
                    if (options.formatRequest) {
                        ajax = callFormatUrl(obj)
                    }
                    else {
                        ajax.url = buildUrl(rp, options[eventType + 'Suffix']);
                        ajax.method = method;
                        ajax.data[options.paramsField] = item;

                        if (options.useQueryString && rp) {
                            ajax.params = rp;
                        }
                    }
                    if (ajax)
                        return $http(ajax)
                            .success(function (res) {
                                var data = res.data ? res.data : res;
                                if (isNew && data) {
                                    angular.extend(item, data);
                                    addRow(item)
                                }
                                scope.$savingProcess = false;
                                options[parseKey] && options[parseKey](scope, { $response: res });
                                if (options.refreshOnChange)
                                    $pageable.getRows();
                            })
                            .error(function (res) {
                                scope.$savingProcess = false;
                                options[parseKey] && options[parseKey](scope, { $response: res, $error: true })
                            });

                    return $q.when('');
                }
                function addRow(item) {
                    if (!item)
                        return false;
                    scope.$currentRows.unshift(item);
                    modelData.unshift(item);
                    $pageable.localdata.unshift(item)
                    $timeout(function () {
                        scope.totalResult++;
                        setTotalPages();
                        scope.$broadcast('$refreshPager')
                    }, 0);
                    
                    return true;
                }
                function setRowSelection(item) {
                    var index = scope.selectedRows.indexOf(item);
                    if (index < 0)
                        scope.selectedRows.push(item);
                    else
                        scope.selectedRows.splice(index, 1);
                }
                $pageable.splicePages = function (pageNumbers, pages) {
                    return splicePages(pageNumbers, pages);
                }
                $pageable.setRowSelection = setRowSelection;
                $pageable.removeRow = function (item) {
                    removeRow(item)
                    if (options.refreshOnChange)
                        $pageable.getRows();
                    else {
                        $timeout(function () {
                            scope.totalResult--;
                            setTotalPages();
                        }, 0)

                    }
                };
                $pageable.removeRows = function (items) {
                    items = items || scope.selectedRows;
                    angular.forEach(items, function (item) {
                        $pageable.removeRow(item);
                    })
                };
                $pageable.deleteRow = deleteRow;
                $pageable.addRow = addRow;
                $pageable.saveRow = saveRow;
                scope.$$postDigest(function () {
                    scope.$first = function () {
                        $pageable.gotoPage(1);
                    }
                    scope.$last = function () {
                        $pageable.gotoPage(scope.$totalPages);
                    }
                    scope.$prev = function () {
                        $pageable.gotoPage(scope.$currentPage - 1);
                    }
                    scope.$next = function () {
                        $pageable.gotoPage(scope.$currentPage + 1);
                    }
                    scope.$gotoPage = function (val) {
                        $pageable.gotoPage(val);
                    }
                    
                });
                if (options.onRefresh) {
                    scope.$on('$refreshPager', function () {
                        options.onRefresh(scope)
                    })
                }
                $pageable.init();
                return $pageable;
            }
            return Factory;
        }
    ];
});