+function (window, angular, undefined) {
'use strict';
var selectApp = angular.module('ngQuantum.select', [
      'ngQuantum.popMaster',
      'ngQuantum.scrollbar'
    ])
    .run(['$templateCache', function ($templateCache) {
        'use strict';
        $templateCache.put('select/select.tpl.html',
          '<div tabindex="-1" class="listbox-panel ng-cloak" role="listbox"><div class="scrollable" role=\"listbox\"><ul tabindex=\"-1\" class=\"listbox\"><li role=\"presentation\" tabindex=\"-1\" ng-repeat=\"match in $matches track by $index\"><span class=\"select-option option-label\"  role=\"option\" tabindex=\"-1\" ng-click=\"$select(match)\" ng-bind=\"match.label\"></span> </li></ul></div></div>'
        );
        $templateCache.put('select/selectgroup.tpl.html',
          '<div tabindex="-1" role="listbox" class="listbox-panel ng-cloak"><div tabindex="-1" class="scrollable" role="listbox"> <ul tabindex="-1" class="listbox"> <li tabindex="-1" role="presentation" ng-repeat="match in $groupMatches">  <span class="select-option" ng-if="!match.items" role="option" tabindex="-1" ng-disabled="match.disabled" ng-click="$select(match)"> <span class="option-label" ng-bind="match.label"></span> </span> <div tabindex="-1" class="option-group" ng-if="match.items" ng-disabled="match.disabled"> <span class="group-label" ng-bind="match.label"></span> <ul tabindex="-1">  <li tabindex="-1" role="presentation" data-ng-repeat="item in match.items track by $index"> <span class="select-option" role="option" tabindex="-1" ng-disabled="item.disabled" ng-click="$select(item)"><span class="option-label" ng-bind="item.label"></span></span></li></ul></div></li></ul></div></div>'
        );
    }])
    .provider('$select', function () {
        var defaults = this.defaults = {
            effect: 'sing',
            typeClass: 'select',
            prefixClass: 'select',
            buttonClass: 'btn-default',
            navClass: 'nav-mixed',
            prefixEvent: 'select',
            placement: 'bottom-left',
            template: 'select/select.tpl.html',
            groupTemplate: 'select/selectgroup.tpl.html',
            trigger: 'click',
            fireEmit: false,
            lazyAjax:true,
            container: 'body',
            displayReflow: false,
            disableClear: false,
            keyboard: true,
            multiple: false,
            filterable: true,
            highlight: true,
            showTick: true,
            urlPrefix: false,
            isQuerystring: false,
            cacheResult: true,
            caseSensitive: true,
            seperator: ', ',
            html: true,
            clearIcon: '<span class="clear-icon fu-cross"></span>',
            spinner: '<span class="spin-icon fu-spinner-fan spin"></span>',
            noMatch: 'No result found...',
            placeholder: 'Please select...',
            filterText: 'search...',
            charText: 'Please enter {{$remainingChar}} or more characters',
            searchingText: 'Searching...',
            maxLength: 3,
            maxTextLength: 30,
            minTextLength: 3,
            minChar: 3,
            forceHide:false,
            selectedRemovable: true
        };
        this.$get = [
            '$filter',
          '$window',
          '$http',
          '$compile',
          '$rootScope',
          '$popMaster',
          '$parseOptions',
          '$timeout',
          '$q',
          '$scrollbar',
          '$lazyRequest',
          '$helpers',
          function ($filter, $window, $http, $compile, $rootScope, $popMaster, $parseOptions, $timeout, $q, $scrollbar, $lazyRequest, $helpers) {
              var bodyEl = angular.element($window.document.body);
              var isTouch = 'createTouch' in $window.document;
              function SelectFactory(element, controller, config, attr, targetEl) {
                  config = $helpers.parseOptions(attr, config);
                  !config.template && config.grouped && (config.template = defaults.groupTemplate)
                  var $select = {}, inputItem, scrollbar;
                  var searchInput = angular.element(['<input ng-hide="$hideFilter" ng-model="filterModel.label" type="text" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" placeholder="{{$placeholder}}" class="select-input form-control" role="combobox" aria-expanded="true"',
                                    , ' aria-autocomplete="list" style="max-width:100%;" />'].join(""))

                  var options = angular.extend({}, defaults, config);
                  var isTagsInput = controller.isTagsInput = (options.directive == 'nqTagsInput');
                  var clearIcon = options.clearIcon;
                  var noMatch, charLabel, searchLabel;
                  if (options.filterable) {
                      if (angular.isString(options.noMatch) && options.noMatch.length > 2 && options.noMatch.substr(0, 1) == '#')
                          noMatch = angular.element(document).find(options.noMatch)
                      else
                          noMatch = angular.element('<span>' + options.noMatch + '</span>');
                      !noMatch.length && (noMatch = null)
                      if (noMatch)
                          noMatch.addClass('no-match').attr('ng-show', '$noResultFound')
                  }
                  if (options.inline) {
                      options.show = true;
                      options.trigger = false;
                      options.showArrow = false;
                      options.container = false;
                      element.addClass('listbox-inline');
                      options.effect = false;
                      options.autoHide = false;
                  }
                  $select = new $popMaster(element, options);
                  var scope = $select.$scope;
                  options = $select.$options = $helpers.observeOptions(attr, $select.$options);
                  $select.optionData = [];
                  scope.$matches = [];
                  scope.urlParams = [];
                  $select.searchInput = searchInput;
                  scope.$selectedIndex = options.multiple ? [] : -1;
                  scope.$isMultiple = options.multiple;
                  scope.$remainingChar = options.minChar;
                  scope.$placeholder = options.displayType == 'input' ? options.placeholder : options.filterText;
                  scope.$select = function (index, evt) {
                      scope.$$postDigest(function () {
                          $select.select(index);
                      });
                  };
                  var init = $select.init, $target;
                  $select.init = function () {
                      init();
                      options.displayType !== 'input' && element.addClass(options.buttonClass)
                      $target = $select.$target;
                      if (options.filterable && $target) {
                          $compile(searchInput)(scope)

                          if (options.displayType == 'input') {
                              options.navClass && element.addClass(options.navClass);
                              options.inputSize && element.addClass(options.inputSize)
                              inputItem = angular.element('<li></li>').append(searchInput.removeClass('form-control').removeClass('input-xs'))
                              element.append(inputItem)
                              !options.multiple && element.addClass('single-option')
                          }
                          else {
                              options.buttonClass && element.addClass(options.buttonClass)
                              $target.prepend(searchInput);
                              searchInput.on('click', function (e) {
                                  e.preventDefault();
                                  searchInput.focus();
                              })
                          }
                      }
                      if (noMatch) {
                          $compile(noMatch)(scope)
                          $target.append(noMatch)
                      }

                      options.showTick && $target.addClass('show-tick')

                      if (options.url && !options.remoteSearch) {
                          if (options.lazyAjax) {
                              $lazyRequest(function () {
                                  return $select.loadRemote();
                              },0)
                          }
                          else
                              $select.loadRemote();
                      }

                      if (options.remoteSearch) {
                          charLabel = angular.element('<span ng-show="$remainingChar > 0"></span>').append(options.charText)
                          searchLabel = angular.element('<span class="search-label" ng-show="$dataLoading"></span>').append(options.searchingText)
                          options.spinner && searchLabel.append(options.spinner)
                          $compile(charLabel)(scope)
                          $compile(searchLabel)(scope)
                          $target.append(charLabel);
                          $target.append(searchLabel);
                      }
                      $select.complated = true;
                      if (!$select.renderComplated)
                          $select.render();
                      !(options.displayType == 'input') && element.addClass('select-toggle')

                      searchInput && searchInput.attr('maxlength', options.maxTextLength);
                      if ($target) {
                          var barelement = $target.find('.scrollable');
                          var barOptions = {
                              keyword: false,
                              barSize: 'slimmest',
                              placementOffset: -2,
                              $scope: scope
                          }
                          scrollbar = $scrollbar(barelement, barOptions);
                      }
                  };
                  $select.update = function (matches) {
                      var selected = $filter('filter')($select.optionData, { selected: true })
                      $select.optionData = matches;
                      angular.forEach(selected, function (item) {
                          $select.addOption(item)
                      })
                      $select.updateMatches()
                  };
                  $select.addOption = function (item) {
                      var exists = $filter('filter')($select.optionData, function (val, i) {
                          if (!options.caseSensitive && (angular.isString(val.label)))
                              return val.label.toLowerCase() == (angular.isString(item.label) ? item.label.toLowerCase() : item.label)
                          return val.value == item.value;
                      });
                      if (!exists.length) {
                          $select.optionData.push(item);
                          scope.$matches = $select.optionData;
                          return $select.optionData[$select.optionData.length - 1];
                      }
                      return exists[0]


                  };
                  $select.changeOption = function (key, value) {
                      options[key] = value;
                  };
                  $select.updateMatches = function (matches, isfilter) {
                      scope.$matches = matches || $select.optionData;
                      if (options.grouped)
                          scope.$groupMatches = $filter('groupOption')(scope.$matches);
                      scope.$noResultFound = !scope.$matches.length;
                      if (isTagsInput, isfilter) {
                          scope.$noResultFound = !(($filter('filter')(scope.$matches, function (val) { return val.filtered != true })).length)

                          scope.$noResultFound ? $select.hide() : $select.show();
                      }
                  };
                  $select.select = function (item) {
                      if (options.multiple) {
                          if (!item.selected && options.maxLength && (controller.$modelValue && controller.$modelValue.length == options.maxLength))
                              return
                          else {
                              scope.$apply(function () {
                                  item.selected = isTagsInput ? true : item.selected ? false : true;
                                  item.filtered = isTagsInput && item.selected;
                              })
                              var selected = []
                              $filter('filter')($select.optionData, function (opt) {
                                  opt.selected && selected.push(opt.value);
                              })
                              $timeout(function () {
                                  controller.$setViewValue(selected);
                              }, 0)
                          }
                      } else {
                          if (!scope.fistChanged) {
                              $filter('filter')($select.optionData, function (itm, key) {
                                  if (itm.selected) {;
                                      scope.$lastSelected = itm
                                      scope.fistChanged = true;
                                  }
                              })
                          }

                          scope.$apply(function () {
                              item.selected = true;
                          })
                          scope.$lastSelected && !(scope.$lastSelected === item) && (scope.$lastSelected.selected = false);
                          scope.$lastSelected = item;
                          $timeout(function () {
                              controller.$setViewValue(item.value);
                          }, 0)
                      }
                      $timeout(function () {
                          $select.render();
                      }, 0)

                      if (!options.multiple) {
                          if (options.trigger === 'focus')
                              element[0].blur();
                          else if ($select.$isShown || $select.$isHidding)
                              $select.hide();
                      }
                      if (isTagsInput)
                          $select.hide();
                      scope.$emit('$select.select', item);
                      searchInput.val('')
                  };
                  $select.$getIndex = function (value) {
                      var l = $select.optionData.length, i = l;
                      if (!l)
                          return;
                      for (i = l; i--;) {
                          if ($select.optionData[i].value === value)
                              break;
                      }
                      if (i < 0)
                          return;
                      return i;
                  };
                  $select.$onMouseDown = function (evt) {
                      evt.preventDefault();
                      evt.stopPropagation();
                      if (isTouch) {
                          var targetEl = angular.element(evt.target);
                          targetEl.triggerHandler('click');
                      }
                  };
                  $select.$onKeyDown = function (e) {
                      if (!/(38|40|13)/.test(e.keyCode))
                          return true;
                      e.preventDefault();
                      e.stopPropagation();
                      
                      var $items = $target.find('.select-option:visible');
                    
                      if (!$items || !$items.length) return;
                      $target.focus();
                      var index = scope.$lastIndex > -1 ? scope.$lastIndex : -1;
                      if (index == -1) {
                          var elSelected = angular.element($target.find('.selected')[0]),
                              sIndex = elSelected.length && elSelected.scope().$index;
                          index = angular.isDefined(sIndex) ? sIndex : elSelected.hasClass('select-option') ? elSelected.parent().index() : elSelected.closest('.select-option').index();
                      }
                      index >= $items.length && (index = 0)
                      if (e.keyCode == 38 && index > 0) index--                  // up
                      if (e.keyCode == 40 && index < $items.length - 1) index++  // down
                      if (!~index) index = 0

                      if (e.keyCode === 13) {
                          var match = $filter('filter')(scope.$matches, function (itm) { return itm.filtered != true })[index]
                          if (match)
                              return $select.select(match);
                      }
                      $items.eq(index).focus();
                      scope.$lastIndex = index;

                  };

                  var _show = $select.show;
                  $select.show = function () {
                      var promise = _show();
                      if (options.multiple) {
                          $select.$target.addClass('select-multiple');
                      }
                      if (options.keyboard && $select.$target) {
                          angular.element(document).off('keydown', $select.$onKeyDown);
                          angular.element(document).on('keydown', $select.$onKeyDown);
                      }

                      $select.$target.css('min-width', element.outerWidth(true));
                      promise && promise.then(function () {
                          if (options.filterable) {
                              if (options.directive != 'nqTagsInput')
                                  scope.filterModel = { label: '' };
                              setTimeout(function () {
                                  searchInput.focus();
                              }, 0);
                          }
                          if (scrollbar) {
                              scrollbar.scrollTo('.selected', null, 60);
                          }
                          $select.$target.on(isTouch ? 'touchstart' : 'mousedown', $select.$onMouseDown);
                      })
                  };
                  var _hide = $select.hide;
                  $select.hide = function () {
                      $select.$target.off(isTouch ? 'touchstart' : 'mousedown', $select.$onMouseDown);
                      if (options.keyboard && $select.$target)
                          angular.element(document).off('keydown', $select.$onKeyDown);
                     
                      if (options.directive != 'nqTagsInput')
                          searchInput.val('');
                      scope.$lastIndex = -1;
                      if (options.inline)
                          return $q.when('');


                      var promise = _hide() || $q.when('');
                      promise.then(function () {
                          if (options.directive != 'nqTagsInput') {
                              scope.filterModel = { label: '' };
                              setTimeout(function () {
                                  searchInput.blur();
                              }, 0);
                          }
                      })
                  };

                  $select.render = function () {
                      if (controller.$modelValue && options.modelIsLabel) {
                          if ($select.complated) {
                              if (angular.isArray(controller.$modelValue)) {
                                  angular.forEach(controller.$modelValue, function (val) {
                                      var item = { label: val, value: val, selected: true, filtered: isTagsInput }
                                      item = $select.addOption(item)
                                  })
                              }
                              else if (options.modelIsLabel) {
                                  $select.addOption({ label: controller.$modelValue, value: controller.$modelValue, selected: true, filtered: isTagsInput })

                              }
                              renderController();
                          }
                      }
                      else if (controller.$modelValue && options.remoteSearch && !$select.optionData.length) {
                          if (options.lazyAjax) {
                              $lazyRequest(function () {
                                 return $select.loadRemote(null, controller.$modelValue);
                              }, 0)
                          }
                          else
                              $select.loadRemote(null, controller.$modelValue);
                      }
                      else if ($select.complated)
                          renderController();
                      validateModel();

                  };
                  $select.loadRemote = function (term, data) {
                      scope.$dataLoading = true;
                      var post = (data && data.length) ? true : false;
                      var url = buildUrl(term, post)
                      var ajax = {
                          url: url
                      }
                      ajax.method = post ? 'POST' : 'GET';
                      ajax.cache = options.cacheResult;
                      post && (ajax.data = { ModelValue: data });
                      return $http(ajax)
                           .success(function (res) {
                               if (options.resultKey)
                                   scope[options.resultKey] = res.data ? res.data : res;
                               else
                                   scope.selectOptions = res.data ? res.data : res;
                               scope.$dataLoading = false;
                               scope.$noResultFound = res.data ? !res.data.length : !res.length
                               !$select.fistLoad && setTimeout(function () {
                                   renderController();
                               }, 0)
                               $select.fistLoad = true;
                               term && (scope.lastTerm = term);
                           })
                           .error(function (res) {
                               scope.$dataLoading = false;
                               scope.$noResultFound = true;
                           })
                  }
                  if (options.filterable)
                      scope.$watch('filterModel.label', function (newValue, oldValue) {
                          if (options.remoteSearch)
                              remoteFiler(newValue, oldValue)
                          else
                              localFiler(newValue, oldValue);

                          if (searchInput && newValue) {
                              searchInput.css('min-width', newValue.length * 0.7 + 'em')
                          }
                          var scrollVal = newValue ? 0 : '.selected';
                          if (scrollbar && newValue) {
                              scrollbar.scrollTo(scrollVal, 'y', 10);
                          }

                      });
                  if (attr) {
                      angular.forEach(['urlParams'], function (key) {
                          attr[key] && attr.$observe(key, function (newValue, oldValue) {
                              scope[key] = newValue;
                          });
                      });
                  }
                  if (angular.isDefined(attr.ngOptions)) {
                      var parsedOptions = $parseOptions(attr.ngOptions);
                      var watchedOptions = parsedOptions.$match[7].replace(/\|.+/, '').trim();
                      scope.$watch(watchedOptions, function (newValue, oldValue) {
                          parsedOptions.valuesFn(scope, controller).then(function (values) {
                              if (values && angular.isArray(values)) {
                                  $select.update(values);
                                  $select.render();
                              }
                          });
                      });
                  }
                  else if (targetEl.is('select')) {
                      $q.when(targetEl).then(function (el) {
                          var parsedOptions = $parseOptions(null, el);
                          if (parsedOptions.$values && angular.isArray(parsedOptions.$values)) {
                              $select.update(parsedOptions.$values);
                              controller.$render();
                          }
                      });
                  }
                  else {
                      controller.$render();
                  }
                  if (angular.isDefined(attr.ngChange)) {
                      scope.$parent.$watch(function () { return controller.$modelValue }, function (newValue, oldValue) {
                          scope.$parent.$eval(attr.ngChange);
                      });
                  }
                  function renderController() {
                      $select.renderComplated = true;
                      var selected, index;
                      clearSelected();
                      if (options.displayType == 'input') {
                          if (controller.$modelValue)
                              renderSelected();
                      }
                      else {
                          if (options.multiple && angular.isArray(controller.$modelValue)) {
                              selected = controller.$modelValue.map(function (value) {
                                  index = $select.$getIndex(value);
                                  if (angular.isDefined(index)) {
                                      $select.optionData[index].selected = true
                                      return $select.optionData[index].label
                                  }
                                  return false
                              }).filter(angular.isDefined)
                              selected = selected.join(options.seperator)
                          } else {
                              index = $select.$getIndex(controller.$viewValue);
                              if (angular.isDefined(index)) {
                                  $select.optionData[index].selected = true
                                  selected = $select.optionData[index].label
                              }
                              else
                                  selected = false;
                          }
                          if (selected) {
                              element.html(selected)
                              if (!options.disableClear && !options.multiple) {
                                  var clrIcon = angular.element(clearIcon)
                                  clrIcon.one('click', function (evt) {
                                          evt.preventDefault();
                                          evt.stopPropagation();
                                          $timeout(function () {
                                              scope.$lastSelected && (scope.$lastSelected.selected = false);
                                              controller.$setViewValue(null);
                                              controller.$render()
                                          }, 0)

                                      });
                                  element.append(clrIcon)
                              }
                          }
                          else
                              element.html(options.placeholder)
                      }
                  }
                  function renderSelected() {
                      var current = element.find('li')
                      angular.forEach(current, function (elm, key) {
                          if (key < current.length - 1)
                              elm.remove()
                      })
                      if (angular.isArray(controller.$modelValue)) {
                          angular.forEach(controller.$modelValue, function (value, key) {
                              var index = $select.$getIndex(value)
                              if (index > -1) {
                                  $select.optionData[index].selected = true
                                  inputItem.before(renderItem($select.optionData[index], key));
                              }
                          })
                      }
                      else {
                          var index = $select.$getIndex(controller.$modelValue)
                          if (index > -1) {
                              $select.optionData[index].selected = true
                              inputItem.before(renderItem($select.optionData[index], controller.$modelValue));
                          }
                      }
                      $select.$isShown &&
                      $select.$applyPlacement();
                  }
                  function renderItem(item, key) {
                      var li = angular.element('<li class="active"></li>')
                      li.on('click', function (e) { e.preventDefault(), e.stopPropagation() })
                      var closer = angular.element(options.clearIcon)
                                   .one('click', function (e) {
                                       e.preventDefault();
                                       e.stopPropagation();
                                       if (angular.isArray(controller.$modelValue)) {
                                           controller.$modelValue = controller.$modelValue.splice(key, 1);
                                       }
                                       else
                                           controller.$modelValue = null
                                       li.off()
                                       li.remove()
                                       scope.$apply(function () {
                                           item.selected = false;
                                           item.filtered = false;
                                       })
                                   });
                      return li.append(angular.element('<a></a>').append(item.label).append(closer))
                  }
                  function highlightText(value) {
                      setTimeout(function () {
                          if (options.highlight && $target) {
                              var items = $target.find('.option-label')
                              if (items.length) {
                                  angular.forEach(items, function (val) {
                                      var el = angular.element(val);
                                      if (value)
                                          el.html(el.text().replace(new RegExp('(' + value + ')', 'gi'), '<span class="highlight">$1</span>'));
                                      else
                                          el.html(el.text());
                                  })
                              }
                          }
                      }, 100)
                      
                  }
                  function localFiler(newValue, oldValue) {
                      if (!options.customFilter) {
                          if (newValue) {
                              $select.updateMatches($filter('filter')($select.optionData, scope.filterModel), isTagsInput);
                          }
                          else if (!newValue && oldValue)
                              $select.updateMatches(undefined, isTagsInput)
                      }
                      else {
                          if (!newValue && !oldValue)
                              return;
                          var i = 0
                          $filter('filter')($select.optionData, function (obj) {
                              if (isTagsInput && obj.selected)
                                  obj.filtered = true
                              else {
                                  if (obj.label.search(new RegExp(newValue, "i")) < 0)
                                      obj.filtered = true
                                  else {
                                      obj.filtered = false;
                                      i++;
                                  }
                              }
                          })
                          scope.$noResultFound = !i;
                      }
                      highlightText(newValue)
                  }
                  function remoteFiler(newValue, oldValue) {
                      if (newValue) {
                          scope.$remainingChar = options.minChar - newValue.length;
                          scope.$noResultFound = false;
                          if (scope.$remainingChar == 0 && scope.lastTerm != newValue)
                              $select.loadRemote(newValue);
                          else
                              localFiler(newValue, oldValue);
                      }
                  }
                  function buildUrl(term, isPost) {
                      var url = options.urlPrefix || '';
                      url += isPost ? options.postUrl ? options.postUrl : options.url : options.url;
                      if (term) {
                          if (scope.urlParams.length) {
                              angular.forEach(scope.urlParams, function (value, index) {
                                  var param = getParam(value, index)
                                  if (options.isQuerystring) {
                                      url += index == 0 ? '?' : '&';
                                      url += param.param + '=' + param.value;
                                  }
                                  else {
                                      url += '/' + param.value;
                                  }
                              })
                          }
                          if (options.isQuerystring) {
                              url += scope.urlParams.length ? '&' : '?';
                              url += 'term=' + term;
                          }
                          else {
                              url += '/' + term;
                          }
                      }
                      return url;
                  }
                  function getParam(value, index) {
                      var param = { param: 'p' + index }
                      if (angular.isObject(value))
                          for (var key in value) {
                              if (key == 0)
                                  param.param = value[0]
                              if (key == 1) {
                                  param.value = value[1]
                                  break
                              }
                          }
                      else
                          param.value = value;
                      return param;
                  }
                  function validateModel() {
                      if (angular.isDefined(attr.required) || angular.isDefined(attr.ngRequired)) {
                          controller.$setValidity("required", controller.$modelValue);
                      }
                      if (options.minRequired) {
                          if (angular.isArray(controller.$modelValue))
                              controller.$setValidity("min-required", controller.$modelValue.length >= options.minRequired);
                      }
                  }
                  function clearSelected() {
                      angular.forEach($select.optionData, function (item) {
                          item.selected = false;
                      })
                  }
                  return $select;
              }
              return SelectFactory;
          }
        ];
    })
    .provider('$tagsInput', function () {
        var defaults = this.defaults = {
            maxLength: 10,
            typeClass: 'tagsInput',
            navClass: 'nav-mixed',
            prefixEvent: 'tagsInput',
            allowedChars: '[A-Za-z0-9ŞşIıĞğÜüÇçÖö ]',
            clearStrict: true,
            placeholder: 'type...',
            modelIsLabel: true,
            preventDublication: true,
            caseSensitive: false,
            maxTextLength: 30,
            minTextLength: 3
        };
        this.$get = [
            '$select',
            '$filter',
          function ($select, $filter) {
              function TagsInputFactory(element, controller, config, attr, targetEl) {
                  if (config.directive != 'nqTagsInput') {
                      return new $select(element, controller, config, attr, targetEl)
                  }
                  var options = angular.extend({}, defaults, config);
                  options.trigger = false;
                  var $tagsInput = new $select(element, controller, options, attr, targetEl);
                  var init = $tagsInput.init, scope = $tagsInput.$scope;
                  $tagsInput.init = function () {
                      init();
                      $tagsInput.searchInput.on('keypress', $tagsInput.$onKeyEnter)
                      $tagsInput.searchInput.on('keypress', $tagsInput.$onKeyPress)
                  };
                  $tagsInput.$onKeyEnter = function (e) {
                      if (e.keyCode === 13) {
                          if (angular.isArray(controller.$modelValue) && !(controller.$modelValue.length < options.maxLength))
                              return false;
                          var label = scope.filterModel.label;
                          if (label && label.length >= options.minTextLength) {
                              if (label.length > options.maxTextLength)
                                  label = label.substr(0, label.length)
                              var newOpt = { label: label, value: label };
                              newOpt = $tagsInput.addOption(newOpt);
                              if (!newOpt.selected)
                                  $tagsInput.select(newOpt);
                              $tagsInput.searchInput.val('')
                          }
                      }
                  };
                  $tagsInput.$onKeyPress = function (e) {
                      var c = String.fromCharCode(e.which)
                      if (!(new RegExp('^' + options.allowedChars + '$').test(c)))
                          return false;
                  };
                  attr.nqTagsInput && scope.$parent.$watch(attr.nqTagsInput, function (newValue, oldValue) {
                      if (angular.isArray(newValue)) {
                          angular.forEach(newValue, function (val, index) {
                              if (angular.isObject(val)) {
                                  if (val.label || val.value) {
                                      var item = {
                                          label: val.label || val.value,
                                          value: val.value || val.label
                                      };
                                      $tagsInput.addOption(item);
                                      $tagsInput.changeOption('modelIsLabel', false)
                                  }
                              }
                              else {
                                  var item = {
                                      label: val,
                                      value: val
                                  };
                                  $tagsInput.addOption(item)
                              }
                          })
                      }
                  });
                  scope.$parent.$watch(attr.ngModel, function (newValue, oldValue) {
                      if (newValue) {
                          controller.$setViewValue(newValue)
                          $tagsInput.render();
                      }
                  });
                  return $tagsInput;
              }
              return TagsInputFactory;
          }
        ]
    })
    angular.forEach(['nqSelect', 'nqTagsInput'], function (directive) {
        selectApp.directive(directive, [
          '$compile',
          '$tagsInput',
          '$parseOptions',
          function ($compile, $tagsInput, $parseOptions) {
              return {
                  restrict: 'EAC',
                  scope: true,
                  require: ['ngModel', directive],
                  controller: function () {
                  },
                  link: function postLink(scope, element, attr, controllers) {

                      var options = {
                          $scope: scope
                      },
                      ngModel = controllers[0];

                      if (directive == 'nqTagsInput') {
                          options.displayType = 'input';
                          options.multiple = true;
                      }
                      options.directive = directive;

                      var targetEl = element;
                      if (attr.ngOptions)
                          options.grouped = attr.ngOptions.indexOf('group by') > -1;
                      else if (element.is('select'))
                          options.grouped = element.find('optgroup').length

                      if (element.is('select') || element.is('input')) {
                          targetEl.addClass('disable-animation')
                          targetEl.css('display', 'none');
                          buildElement()
                      }
                      else if (!angular.isDefined(attr.ngOptions)) {
                          buildElement()
                          targetEl.addClass('listbox');
                          var scroller = angular.element('<div tabindex="-1" class="scrollable" role="listbox"></div>');

                          scroller.append(targetEl.show());
                          options.targetElement = angular.element('<div tabindex="-1" role="listbox" class="listbox-panel"></div>').append(scroller);
                      }
                      else if (attr.qoDisplayType == 'input') {
                          buildElement();
                      }
                      var select = new $tagsInput(element, ngModel, options, attr, targetEl);
                      controllers[1].addOption = select.addOption;
                      controllers[1].changeOption = select.changeOption;
                      controllers[1].select = select.select;
                      ngModel.$render = select.render;
                      scope.$on('$destroy', function () {
                          select.destroy();
                          options = null;
                          select = null;
                      });
                      function buildElement() {
                          if (options.displayType == 'input' || attr.qoDisplayType == 'input') {
                              options.filterable = true;
                              element = angular.element('<ul class="nav nav-pills select-render-nav form-control"></ul>');
                              targetEl.hide()
                          }
                          else
                              element = angular.element('<button type="button" class="btn form-control">Please select...</button>');
                          targetEl.before(element);
                      }
                  }
              };
          }
        ]);
    });

    selectApp.directive('selectOption', [
      function () {
          return {
              restrict: 'AC',
              scope: true,
              require: '?^nqSelect',
              link: function postLink(scope, element, attr, controller) {
                  var itemkey, watcher, item = {};
                  if (angular.isDefined(attr.ngRepeat))
                      itemkey = attr.ngRepeat.split(' ')[0];
                  else if (angular.isDefined(element.parent().attr('ng-repeat') || element.parent().attr('data-ng-repeat'))) {
                      var parentattr = element.parent().attr('ng-repeat') || element.parent().attr('data-ng-repeat')
                      if (parentattr)
                          itemkey = parentattr.split(' ')[0];
                  }
                  watcher = itemkey + '.selected';
                  if (controller) {
                      scope.$watch(controller.changeOption, function (newValue, oldValue) {
                          if (angular.isDefined(controller.changeOption))
                              controller.changeOption('customFilter', true);
                      });
                      element.addClass('select-option')
                      element.attr('tabindex', -1)
                      element.attr('role', 'option')
                      item.label = scope.$eval(attr.optionLabel) || attr.optionLabel;
                      item.value = scope.$eval(attr.optionValue) || attr.optionValue || item.label;
                      scope.$watch(controller.changeOption, function (newValue, oldValue) {
                          if (angular.isDefined(controller.addOption))
                              scope._selectOption = controller.addOption(item);
                      });

                      watcher = '_selectOption.selected';
                      element.on('click', function () {
                          controller.select(scope._selectOption)
                      })
                      scope.$watch('_selectOption.filtered', function (newValue, oldValue) {
                          newValue ? element.hide() : element.show()
                      });
                  }
                  scope.$watch(watcher, function (newValue, oldValue) {
                      newValue ? element.addClass('selected') : element.removeClass('selected')
                  });
                  scope.$on('$destroy', function () {
                      element && element.remove();
                  });

              }
          };
      }
    ])
    selectApp.filter('groupOption', ['$filter', function ($filter) {
        return function (array) {
            if (!array || !array.length)
                return []
            var newArray = [];
            angular.forEach(array, function (value) {
                if (value.group)
                    addToGroup(value);
                else
                    newArray.push(value)
            })
            function addToGroup(value) {
                var group = $filter('filter')(newArray, function (gr) {
                    if (angular.isObject(value.group)) {
                        return gr.label === value.group.label;
                    }
                    else
                        return gr.label == value
                });
                if (group.length) {
                    group = group[0]
                    group.items.push(value)
                }
                else {
                    if (angular.isObject(value.group))
                        group = angular.copy(value.group);
                    else
                        group = { label: value };
                    group.items = []
                    group.items.push(value)
                    newArray.push(group)
                }
            }
            return newArray;
        };
    }]);
 }(window, window.angular);