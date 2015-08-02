(function (moment) {
    if(!moment)
        return;
    moment.fn.clearTime = function () {
        this.hours(0);
        this.minutes(0);
        this.seconds(0);
        this.milliseconds(0);
        return this;
    };
    moment.fn.isWeekend = function () {
        var d = this.day()
        return (d == 6 || d == 0) || false;
    };
    moment.fn.isToday = function () {
        return (this.clone().clearTime().valueOf() == moment().clearTime().valueOf());
    };
    moment.fn.toObject = function () {
            var m = this;
            return {
                year: m.year(),
                month: m.month(),
                date: m.date(),
                hour: m.hours(),
                minute:m.minutes(),
                second:m.seconds(),
                millisecond:m.milliseconds()
            }
    }

})(window.moment);
+function (window, angular, undefined) {
'use strict';
angular.module('ngQuantum.datepicker', [
      'ngQuantum.popMaster'
    ])
    .run(['$templateCache', function ($templateCache) {
        'use strict';
        $templateCache.put('datepicker/datepicker.tpl.html',
          "<div tabindex=\"-1\" class=\"calendar-panel\" role=\"listbox\"><div tabindex=\"-1\" class=\"calendar-header\" role=\"listbox\"></div><div tabindex=\"-1\" class=\"calendar-body\" role=\"listbox\"></div><div tabindex=\"-1\" class=\"calendar-footer\" role=\"listbox\"></div></div>"
        );

    }])
    .provider('$datepicker', function () {
        var defaults = this.defaults = {
            format: 'MM-DD-YYYY',
            timeFormat: 'HH:mm:ss',
            headerFormat: 'MMMM YYYY',
            timepicker: false,
            datepicker: true,
            rangepicker: false,
            timeView: false,
            showEvents: false,
            weekNumber: false,
            minDate: false,
            minDateFrom: false,
            maxDate: false,
            startDate: false,
            minHour: 0,
            maxHour: 23,
            divideHour: 4,
            defaultTime: false,
            timesSet: [], //to do
            todayButton: true,
            rangeType: 'day',
            minRange: 1,
            maxRange: false,
            defaultSelect: true, //to do
            allowBlank: false, //to do
            showYears: true,
            minYear: 1950,
            maxYear: 2050,
            dayOfWeekStart: 1,
            disableWeekends: false,
            disableWeekdays: [],
            specialDays: [], //to do
            dayHeader: 'shortest',
            effect: 'flip-y',
            typeClass: 'datepicker',
            prefixClass: 'calendar',
            prefixEvent: 'datepicker',
            instanceName: 'datepicker',
            placement: 'bottom-left',
            template: 'datepicker/datepicker.tpl.html',
            trigger: 'click',
            container: 'body',
            showArrow: true,
            allowWrite: false,
            autoHide: true,
            html: true,
            displayReflow: false,
            fireEmit: true,
            keyboard: true, //to do
            show: false,
            inline: false,
            theme:'default',
            selectable: true,
            readonly :  true,
            overseeingTarget: true,
            modelType:'date',
            nextIcon: 'fic fu-angle-r',
            prevIcon: 'fic fu-angle-l',
            todayIcon: 'fic fu-restore',
            closeIcon: 'fic fu-cross',
            timeIcon: 'fic fu-time',
            downIcon: 'fic fu-angle-d',
            upIcon: 'fic fu-angle-u'
        };
        this.$get = [
          '$compile',
          '$popMaster',
          '$parse',
          '$helpers',
          '$timeout',
          function ($compile, $popMaster, $parse, $helpers, $timeout) {
              function Factory(element, config, attr, ngModel) {
                  config = $helpers.parseOptions(attr, config);
                  var options = angular.extend({}, defaults, config);
                  if (options.inline) {
                      options.show = true;
                      options.trigger = false;
                      options.showArrow = false;
                      options.container = 'self';
                      element.addClass('calendar-inline');
                      options.effect = false;
                      options.autoHide = false;
                      options.readonly = false;
                  }
                  var $picker = new $popMaster(element, options);
                  var scope = $picker.$scope; var $target, $header, $body, $footer, yearSelector, table, tbody, initialized, lastCacheKey, keyTarget;

                  scope.$options = options = $helpers.observeOptions(attr, options);

                  $picker.caches = {};

                  angular.forEach(['next', 'before', 'today', 'gotoYear'], function (value) {
                      scope['$' + value] = function (evt) {
                          scope.$$postDigest(function () {
                              $picker[value](evt);
                          });
                      }
                  })
                  scope.$gotoYear = function (val, evt) {
                      if (evt) {
                         evt.preventDefault();
                          $picker.preventHide = true;
                      }
                      
                      scope.$$postDigest(function () {
                          $picker.gotoYear(val)
                      });
                  }
                  scope.$select = function (val, type) {
                      scope.$$postDigest(function () {
                          $picker.select(val, type)
                      });
                  }
                  scope.$setTime = function (val) {
                      scope.$$postDigest(function () {
                          $picker.setTime(val)
                      });
                  }
                  scope.$changeTime = function (dir, type, val) {
                      scope.$$postDigest(function () {
                          $picker.changeTime(dir, type, val)
                      });
                  }

                  var init = $picker.init;
                  $picker.init = function () {
                      optimize();
                      init();
                      if (!initialized) {
                          initialized = true;
                          buildScope();
                      }
                      if (!options.allowWrite) {
                          element.on('keydown', function () {
                              return false;
                          })
                      }
                      $target = $picker.$target;
                  }
                  var show = $picker.show;
                  $picker.show = function () {
                      if (!$picker.$builded) {
                          buildFirst();
                      }
                      var promise = show();
                      promise && promise.then(function () {
                          formatPicker();
                          $target.focus();
                      })
                      if (options.keyboard && $picker.$target) {
                          angular.element(document).off('keydown', $picker.$onKeyDown);
                          angular.element(document).on('keydown', $picker.$onKeyDown);
                      }
                      return promise;
                  }
                  var hide = $picker.hide;
                  $picker.hide = function () {
                      if ($picker.preventHide)
                      {
                          $picker.preventHide = false;
                          return false;
                      }
                      var promise = hide();
                      promise && promise.then(function () {
                          if (scope.$timeViewActive && options.datepicker)
                              scope.$toggleTimepicker();
                          element && element.focus();
                      })
                      if (options.keyboard && $picker.$target) {
                          angular.element(document).off('keydown', $picker.$onKeyDown);
                      }
                      return promise;
                  }
                  var destroy = $picker.destroy;
                  $picker.destroy = function () {
                      destroy();
                      scope.$destroy();
                  }
                  $picker.next = function () {
                      $picker.changeDate('up', 'month', 1)
                  }
                  $picker.before = function () {
                      $picker.changeDate('down', 'month', 1)
                  }
                  $picker.changeDate = function (dir, type, val) {
                      var v = !val ? 1 : angular.isNumber(val) ? val : window.isNaN(parseInt(val)) ? 1 : parseInt(val);
                      v = dir == 'down' ? -v : v;
                      type = type || 'day';
                      var dt = scope.currentDate.clone().add(v, type);
                      if (scope.minDate && dt.clone().endOf('month') < scope.minDate)
                          return;
                      if (scope.maxDate && dt.clone().startOf('month') > scope.maxDate)
                          return;
                      apply(function () {
                          if (scope.minDate && dt < scope.minDate) {
                              dt = scope.minDate.clone();
                          }
                         if (scope.maxDate && dt > scope.maxDate) {
                              dt = scope.maxDate.clone();
                          }
                          if (options.disableWeekdays.length) {
                              while (options.disableWeekdays.indexOf(dt.day()) > -1)
                                  dt.add(1, 'day')
                          }
                          scope.selectedDay = dt.month() + '-' + dt.date();
                          scope.currentDate = dt.clone();
                          fireChange(type)
                          buildNew()
                      });
                  }
                  $picker.today = function (evt) {
                      if (evt) {
                          evt.preventDefault();
                          $picker.preventHide = true;
                      }
                      apply(function () {
                          scope.currentDate = scope.minDate && scope.startDate < scope.minDate ? scope.minDate.clone() : scope.maxDate && scope.startDate > scope.maxDate ? scope.maxDate.clone() : scope.startDate.clone();
                          buildNew()
                          scope.modelSetted = true;
                          renderModel();
                          fireChange();
                          scope.selectedDay = scope.currentDate.month() + '-' + scope.currentDate.date();
                      })

                  }
                  $picker.gotoYear = function (val) {
                      apply(function () {
                          scope.currentDate.year(val);
                          buildNew();
                          scope.modelSetted = true;
                          renderModel();
                          fireChange('year')
                      })

                  }
                  $picker.setTime = function (val) {
                      var date = scope.currentDate.clone();
                      var h = parseInt(val.split(':')[0]);
                      var m = parseInt(val.split(':')[1]) || 0;
                      if (window.isNaN(h))
                          h = options.minHour;
                      date.hour(h)
                      date.minute(m)
                      apply(function () {
                          scope.currentDate = date;
                          scope.modelSetted = true;
                          renderModel();
                          fireChange('time');
                      })
                      if (options.datepicker)
                          scope.$toggleTimepicker();
                      else if (options.autoHide)
                          $picker.hide();
                  }
                  $picker.changeTime = function (dir, type, val) {
                      var v = !val ? 1 : angular.isNumber(val) ? val : window.isNaN(parseInt(val)) ? 1 : parseInt(val);
                      v = dir == 'down' ? -v : v;
                      var dt = scope.currentDate.clone().add(v, type),
                          dth = dt.hour();
                      if (dth >= options.minHour && dth <= options.maxHour) {
                          scope.currentDate = dt.clone();
                          scope.modelSetted = true;
                          renderModel();
                          fireChange(type)
                      }
                  }
                  $picker.$onKeyDown = function (e) {
                      if (!/(13|37|38|39|40)/.test(e.keyCode))
                          return true;
                      if (!e.isDefaultPrevented()) {
                          
                          var timeView = scope.$timeViewActive,
                              dir, type;
                          var code = e.keyCode, evt = e;
                          if (!timeView) {
                              e.preventDefault();
                              switch (code) {
                                  case 37:
                                  case 38:
                                      dir = 'down';
                                      type = e.ctrlKey ? (code == 37 ? 'month' : 'year') : (code == 37 ? 'day' : 'week');
                                      break;
                                  case 39:
                                  case 40:
                                      dir = 'up'
                                      type = e.ctrlKey ? (code == 39 ? 'month' : 'year') : (code == 39 ? 'day' : 'week');
                                      break;
                              }
                              if (code == 13) {
                                  if (e.altKey)
                                      $picker.today();
                                  else
                                      renderModel();
                              }
                              else
                                  dir && type && $picker.changeDate(dir, type, 1);
                          } else if (code == 13) {
                              if (options.timepicker && options.datepicker && e.ctrlKey)
                                  scope.$toggleTimepicker();
                              else if(e.target.tagName.toLowerCase() == 'a')
                                  angular.element(e.target).triggerHandler('click')
                          }
                          
                      }
                      return true;
                  };
                  function buildFirst(disablenew) {
                      $target = $picker.$target;
                      if (!$target)
                          return;
                      getElements($target);
                      if (options.rangepicker)
                          $target.addClass('picker-datarange')
                      else if (options.timepicker)
                          $target.addClass('picker-datetime')
                      else
                          $target.addClass('picker-date')
                      if (options.datepicker)
                          buildHeader();
                      if (options.timepicker)
                          buildTimeSelector();
                      if (options.showYears && options.datepicker)
                          buildYearSelector();
                      if (options.datepicker && !disablenew)
                          buildNew();
                      if (options.timepicker && !options.datepicker)
                          $picker.$builded = true;

                      
                  }
                  function buildNew() {
                      if (!$body) {
                          buildFirst(true);
                      }

                      if (options.timepicker && !options.datepicker)
                          return;
                      var cachekey = cacheKey(scope.currentDate);
                      if (lastCacheKey && cachekey == lastCacheKey)
                          return;
                      lastCacheKey = cachekey;
                      var data = $picker.caches[cachekey];

                      if (!data) {
                          data = createCache(cachekey);
                      }
                      apply(function () {
                          scope.dayArray = data.dayArray;
                      })

                      $body.find('td.selected').removeClass('selected');
                      tbody.html(data.content);
                      $compile($body)(scope);
                      $picker.$builded = true;
                  }
                  function createCache(cachekey) {
                      var start = scope.currentDate
                      var dArr = [];
                      var month = start.month();
                      var mStart = start.clone().startOf('month');
                      var mEnd = mStart.clone().endOf('month');
                      var dow = parseInt(options.dayOfWeekStart);
                      var wStart = mStart.clone().day(dow)
                      var wEnd = mEnd.clone().day(dow)
                      if (wStart > mStart)
                          wStart.add(-7, 'day')
                      if (wEnd <= mEnd)
                          wEnd.add(7, 'day')

                      var diff = wEnd.diff(wStart, 'day')
                      for (var d = 0; d < diff; d++) {
                          var day = wStart.clone().add(d, 'day');
                          var item = {
                              day: day.date(),
                              month: day.month(),
                              isWeekend: day.isWeekend()
                          }
                          if (options.disableWeekdays.length && options.disableWeekdays.indexOf(day.day()) > -1) {
                              item.unselectable = true;
                          }
                          if (month != day.month()) {
                              item.outMonth = true;
                          }
                          if (options.weekNumber)
                              item.week = day.week();
                          if (scope.minDate && day < scope.minDate)
                              item.unselectable = true;
                          if (scope.maxDate && day > scope.maxDate)
                              item.unselectable = true;
                          dArr.push(item);
                      }
                      $picker.caches[cachekey] = { 'dayArray': dArr };
                      scope.dayArray = dArr;
                      $picker.caches[cachekey].content = buildTable();
                      return $picker.caches[cachekey];
                  }
                  function getElements(target) {
                      $header = target.find('.calendar-header');
                      $body = target.find('.calendar-body');
                      $footer = target.find('.calendar-footer');
                  }
                  function detectDate(dDate, defaultDate) {
                      var value = angular.isString(dDate) ? moment(dDate, options.format) : angular.isDate(dDate) ? moment(dDate) : moment.isMoment(dDate) ? dDate.clone() : defaultDate;
                      return moment.isMoment(value) ? value :moment()
                  }
                  function optimize() {
                      if (!options.datepicker && !options.timepicker)
                          options.datepicker = true;
                      if (!angular.isArray(options.disableWeekdays))
                          options.disableWeekdays = [];
                      if (options.disableWeekends)
                          options.disableWeekdays = options.disableWeekdays.concat([0, 6])
                      if (options.minDate) {
                          if (options.minDate == 'today') {
                              scope.minDate = moment();
                          }
                          else
                              scope.minDate = detectDate(options.minDate, moment())
                          options.minYear = scope.minDate.year();
                          scope.minDate.clearTime();
                      }
                      if (options.maxDate) {
                          scope.maxDate = detectDate(options.maxDate, moment())
                          options.maxYear = scope.maxDate.year();
                          scope.maxDate.clearTime();
                      }

                      if (options.startDate) {
                          scope.startDate = detectDate(options.startDate, moment())
                      }
                      else
                          scope.startDate = scope.minDate && moment() < scope.minDate ? scope.minDate.clone() : scope.maxDate && moment() > scope.maxDate ? scope.maxDate.clone() : moment();
                      scope.currentDate = scope.startDate.clone();
                      scope.format = options.format;
                      if (options.disableWeekdays.length)
                          while (options.disableWeekdays.indexOf(scope.currentDate.day()) > -1)
                              scope.currentDate.add(-1, 'day');
                      if (options.timepicker) {
                          options.minHour = angular.isNumber(options.minHour) && (options.minHour >= 0) ? options.minHour : 8;
                          options.maxHour = angular.isNumber(options.maxHour) && options.maxHour || 22;
                          options.divideHour = angular.isNumber(options.divideHour) && options.divideHour || 4;
                          (options.minHour < 0 || options.minHour > 23) && (options.minHour = 0)
                             (options.maxHour > 24 || options.maxHour < 2) && (options.maxHour = 24)
                          if (options.divideHour > 30)
                              options.divideHour = 0;
                          else
                              while (60 % options.divideHour != 0)
                                  options.divideHour++;
                          optimizeTime();
                      }
                      else {
                          scope.currentDate.clearTime();
                      }
                      if (scope.currentDate.hour() < options.minHour)
                          scope.currentDate.hour(options.minHour).minute(0).second(0)
                      if (!options.defaultRange) {
                          options.defaultRange = options.minRange;
                      }
                      scope.selectedDay = scope.currentDate.month() + '-' + scope.currentDate.date();
                  }
                  function buildTable() {
                      if (!$body) {
                          buildFirst(true);
                      }
                      if (!table) {
                          table = angular.element('<table/>').addClass('calendar-table');
                          var thead = angular.element('<thead/>').appendTo(table);
                          tbody = angular.element('<tbody/>').appendTo(table)
                          var tfoot = angular.element('<tfoot/>').appendTo(table);
                          var names = options.dayHeader == 'shortest' ? moment.localeData()._weekdaysMin || moment.localeData()._weekdaysShort : moment.localeData()._weekdaysShort;
                          if (options.dayOfWeekStart > 0) {
                              var first = names.slice(options.dayOfWeekStart, 7)
                              var cut = names.slice(0, options.dayOfWeekStart)
                              names = first.concat(cut);
                          }
                          var trhead = angular.element('<tr><th>' + names.join('</th><th>') + '</th></tr>').appendTo(thead);
                          if (options.weekNumber) {
                              table.addClass('has-week-no')
                              trhead.prepend('<th class="cal-week-no">W</th>')
                          }

                          var watch = function () { return table.width() };
                          scope.$watch(watch, function () { })();
                          scope.$watch(watch, function (newValue, oldValue) {
                              setTimeout(function () {
                                  yearSelector && yearSelector.css('width', table.width());
                              }, 0)
                          })
                          $body.html(table)
                      }
                      
                      return buildTableBody();
                  }
                  function buildTableBody() {
                      var tbody = angular.element('<tbody/>');
                      var rows = parseInt(scope.dayArray.length / 7)
                      if ((scope.dayArray.length % 7) > 0) rows++;
                      var idx = 0;
                      for (var r = 0; r < rows; r++) {
                          var trdate = angular.element('<tr></tr>').appendTo(tbody);
                          var last = (r + 1) * 7
                          if (last > scope.dayArray.length)
                              last = scope.dayArray.length;
                          var rdates = scope.dayArray.slice(r * 7, last);
                          if (options.weekNumber)
                              trdate.append('<th class="cal-week-no">' + rdates[0].week + '</th>');
                          angular.forEach(rdates, function (val, key) {
                              var slday = val.month + '-' + val.day;
                              var td = angular.element('<td cal-date-item="' + idx + '" ng-class="{selected:selectedDay==\'' + slday + '\'}">'+val.day+'</td>').appendTo(trdate);
                              if (val.unselectable)
                                  td.addClass('unselectable')
                              if (val.isWeekend)
                                  td.addClass('weekend')
                              if (val.outMonth)
                                  td.addClass('out-month')
                              idx++;
                          })

                      }

                      return tbody.html();
                  }
                  function buildHeader() {
                      var ul = '<table class="cal-header-table"><tr>' +
                                   '<td class="before"><button data-title="Before" class="titip-top" type="button" ng-click="$before()"><i ng-class="$options.prevIcon"></i></button></td>' +
                                   '<td class="date-head"><span>{{currentMonthTitle}}</span></td>' +
                                   '<td class="today"><button data-title="Today" class="titip-top" type="button" ng-click="$today($event)"><i ng-class="$options.todayIcon"></i></button></td>' +
                                   '<td class="next"><button data-title="Next" class="titip-top" type="button" ng-click="$next()"><i ng-class="$options.nextIcon"></i></button></td>' +
                                   '<td class="hide-cal"><button data-title="Close" class="titip-top" type="button" ng-click="$hide()"><i ng-class="$options.closeIcon"></i></button></td>' +
                               '</tr></table>';
                      ul = angular.element(ul)
                      $compile(ul)(scope);
                      $header.html(ul)
                  }
                  function buildYearSelector() {
                      if (options.showYears) {
                          yearSelector = angular.element('<div class="year-selector" ng-hide="yearsArray.length < 2" nq-scroll="" data-qo-axis="x" data-qo-bar-size="slimmest" data-qo-placement-offset="0" data-qo-visible="true"></div>').appendTo($footer);
                          var inner = angular.element('<div class="selector-inner"></div>').appendTo(yearSelector);
                          options.theme && yearSelector.attr('data-qo-theme', options.theme);
                          getYearArray();
                          inner.append('<a role="button" tabindex="1" id="year-{{year}}" ng-repeat="year in yearsArray" ng-click="$gotoYear(year, $event)" ng-class="{active:currentYear == year}"><span>{{year}}</span></a>');
                          $picker.yearSelector = yearSelector;
                          $compile(yearSelector)(scope);
                       
                      }

                  }
                  function getYearArray() {
                      scope.yearsArray = [];
                      for (var y = options.minYear; y <= options.maxYear; y++)
                          scope.yearsArray.push(y)
                  }
                  function buildTimeSelector() {
                      if (options.timepicker) {
                          var dpCont = angular.element('<div role="presentation" tabindex="-1" class="dp-container clearfix"></div>').appendTo($body),
                          tpCont = angular.element('<div class="tp-container clearfix"></div>').appendTo($body),
                          tpSwicher = angular.element('<div class="tp-switcher" time-picker-switch="" data-time-icon="$options.timeIcon"  data-close-icon="$options.closeIcon"></div>').appendTo(tpCont),
                          tpTemp = timePickerTemplate().appendTo(tpCont);

                          $compile(tpCont)(scope);
                          scope.timePickerTemp = $picker.timePickerTemp = tpTemp;
                          $body = dpCont;

                          scope.$toggleTimepicker = function () {
                              apply(function () {
                                  scope.timePickerTemp.toggle();
                                  $picker.yearSelector && $picker.yearSelector.toggle();
                                  $header.toggle();
                                  dpCont.toggle();
                                  tpCont.toggleClass('tp-visible');
                                  scope.$timeViewActive = !scope.$timeViewActive;
                                  
                                  if (scope.$timeViewActive) {
                                      (options.timeView == 'list') && scrollTime();
                                      dpCont.focus();
                                  }
                                      
                              });
                          }
                      }
                  }
                  function cacheKey(date) {
                      return date.year() + date.month();
                  }
                  function scrollYear() {
                      if ($picker.yearSelector) {
                          $timeout(function () {
                              var yelm = '#year-' + (scope.currentYear - 3)
                              var bar = $picker.yearSelector.data('$scrollBar');
                              bar && bar.scrollTo(yelm)
                          }, 0)
                          
                      }
                  }
                  function scrollTime() {
                      if ($picker.timeListContainer) {
                          $timeout(function () {
                              var yelm = $picker.timeListContainer.find('a.active')
                              if (yelm.length) {
                                  var bar = $picker.timeListContainer.data('$scrollBar');
                                  var lval = yelm[0].offsetTop - 30;

                                  bar && bar.scrollTo(lval);
                                  yelm.first().focus();
                              }
                              else
                                  $picker.timeListContainer.find('a').first().focus()
                          }, 0)
                          
                      }
                  }
                  function fireChange(type) {
                      switch (type) {
                          case 'date':
                          case 'day':
                          case 'month':
                          case 'year':
                              scope.$broadcast('pickerDateChanged');
                              break;
                          case 'hour':
                          case 'second':
                          case 'minute':
                          case 'time':
                              scope.$broadcast('pickerTimeChanged');
                              break;
                          default:
                              scope.$broadcast('pickerDatetimeChanged');
                              break;
                      }
                      apply(function () {
                          scope.currentDateObject = scope.currentDate.toObject();
                      })
                  }
                  function optimizeTime() {
                      if (options.timeView == 'list') {
                          options.format = options.format.replace(':ss', '').replace('ss', '');
                          var hr = scope.currentDate.hour();
                          if (hr < options.minHour)
                              scope.currentDate.hour(options.minHour)
                          else if (hr > options.maxHour)
                              scope.currentDate.hour(options.maxHour)

                          var m = scope.currentDate.minutes();
                          m = m - (m % parseInt(60 / options.divideHour))
                          scope.currentDate.minute(m)
                          scope.currentDate.second(0)
                          scope.currentTimeString = scope.currentDate.format('HH:mm');
                      }
                  }
                  function timePickerTemplate() {
                      var timePicker = angular.element('<div class="cal-timepicker"></div>');
                      var hh = options.format.indexOf('HH') > -1,
                          mm = options.format.indexOf('mm') > -1,
                          ss = options.format.indexOf('ss') > -1;
                      if (options.timeView != 'list') {
                          var tableTime = '<table class="tp-table"><tbody><tr>';
                          tableTime += hh ? '<td><button ng-class="\'btn-\' + $options.theme" type="button" class="btn tp-up" ng-click="$changeTime(\'up\',\'hour\')"><i ng-class="$options.upIcon"></i></button></td>' : ''
                          tableTime += hh ? '<td class="tp-seperator"></td>':'';
                          tableTime += mm ? '<td><button ng-class="\'btn-\' + $options.theme" type="button" class="btn tp-up" ng-click="$changeTime(\'up\',\'minute\')"><i ng-class="$options.upIcon"></i></button></td>':'';
                          tableTime += mm ? '<td class="tp-seperator"></td>':'';
                          tableTime += ss ? '<td><button ng-class="\'btn-\' + $options.theme" type="button" class="btn tp-up" ng-click="$changeTime(\'up\',\'second\')"><i ng-class="$options.upIcon"></i></button></td>':'';
                          tableTime += '</tr><tr>';
                          tableTime += hh ? '<td tp-bind-time="hour"></td>':'';
                          tableTime += hh ? '<td class="tp-seperator">:</td>':'';
                          tableTime += mm ? '<td tp-bind-time="minute"></td>':'';
                          tableTime += mm ? '<td class="tp-seperator">:</td>':'';
                          tableTime += ss ? '<td tp-bind-time="second"></td>':'';
                          tableTime += '</tr><tr>';
                          tableTime +=  hh ? '<td><button ng-class="\'btn-\' + $options.theme" type="button" class="btn tp-down" ng-click="$changeTime(\'down\',\'hour\')"><i ng-class="$options.downIcon"></i></button></td>':'';
                          tableTime +=  hh ? '<td class="tp-seperator"></td>':'';
                          tableTime +=  mm ? '<td><button ng-class="\'btn-\' + $options.theme" type="button" class="btn tp-down" ng-click="$changeTime(\'down\',\'minute\')"><i ng-class="$options.downIcon"></i></button></td>':'';
                          tableTime +=  mm ? '<td class="tp-seperator"></td>':''
                          tableTime +=  ss ? '<td><button ng-class="\'btn-\' + $options.theme" type="button" class="btn tp-down" ng-click="$changeTime(\'down\',\'second\')"><i ng-class="$options.downIcon"></i></button></td>':'';
                          tableTime += '</tr></tbody></table>';
                          timePicker.append(tableTime)
                      }
                      else {
                          var times = [];
                          if (!options.timesSet.length) {
                              var min = options.minHour,
                                  max = options.maxHour,
                                  dvd = options.divideHour;

                              var ratio = 60 / dvd;
                              for (var h = min; h < max; h++)
                                  for (var s = 0; s < dvd; s++) {
                                     var rs = s * ratio;
                                      var item = h < 10 ? '0' + h : h;
                                      item += ':'
                                      item += rs < 10 ? '0' + rs : rs;
                                      times.push(item)
                                  }
                              times.push(max + ':00')
                          }
                          else {
                              angular.forEach(options.timesSet, function (val) {
                                  val = val.replace(' ', '')
                                  validateHhMm(val) && times.push(val)
                              })
                          }
                          scope.timesList = times;
                          var timeListContainer = angular.element('<div class="tp-time-list" nq-scroll="" data-qo-bar-size="slimmest" data-qo-placement-offset="0" data-qo-visible="true"><a class="tp-time" role="button" tabindex="1" ng-repeat="time in timesList" tp-time-list-item="time"  ng-class="{active:$parent.currentTimeString == time}"></a></div>')
                          options.theme && timeListContainer.attr('data-qo-theme', '$options.theme');
                          timePicker.append(timeListContainer)
                          $picker.timeListContainer = timeListContainer;
                      }
                      return timePicker;
                  }
                  function validateHhMm(val) {
                      return /^([0-1]?[0-9]|2[0-4]):([0-5][0-9])(:[0-5][0-9])?$/.test(val);
                  }
                  function renderModel() {
                      if (scope.hasModel) {
                          $timeout(function () {
                              if (options.modelType == 'date')
                                  ngModel.$setViewValue(scope.currentDate.clone().toDate());
                              else {
                                  ngModel.$setViewValue(scope.currentDate.format(scope.format));
                              }
                              ngModel.$commitViewValue();
                          }, 0)
                      }
                  }
                  function buildScope() {
                      angular.forEach(['onDateChange', 'onTimeChange', 'onChange'], function (key) {
                          if (angular.isDefined(options[key]) && !angular.isFunction(options[key]))
                              options[key] = $parse(options[key]);
                      })
                      if (ngModel) {
                          scope.hasModel = true;
                          var oldRender = ngModel.$render;
                          ngModel.$render = function (value) {
                              if (options.modelType == 'date') {
                                  var val = scope.currentDate.format(scope.format)
                                  if (element[0].tagName.toLowerCase() === 'input') {
                                      element.val(val);
                                  } else
                                      element.html(val);
                              } else {
                                  oldRender();
                              }
                          };
                          
                          scope.$parent.$watch(attr.ngModel, function (newValue, oldValue) {
                              if (newValue) {
                                  
                                  apply(function () {
                                      var dt;
                                      if (angular.isDate(newValue)) {
                                          options.modelType = 'date';
                                          dt = moment(newValue)
                                      } else
                                          dt = angular.isString(newValue) ? moment(newValue, scope.format) : moment.isMoment(newValue) ? newValue : moment();

                                      if (!dt.isValid())
                                          throw 'Type Error: ' + attr.ngModel + ' is not a valid Date, moment or date string...';
                                      if (options.timepicker) {
                                          var hr = dt.hour()
                                          if (hr < options.minHour)
                                              dt.hour(options.minHour)
                                          if (hr > options.maxHour)
                                              dt.hour(options.maxHour).minute(0)
                                      }
                                      scope.currentDate = dt.clone();
                                      scope.selectedDay = scope.currentDate.month() + '-' + scope.currentDate.date();
                                      if (!scope.modelSetted) {
                                          scope.modelSetted = true;
                                          fireChange()
                                          buildNew()
                                      }
                                      ngModel.$render();
                                      scope.modelDate = scope.currentDate.clone().toDate();
                                      if (options.autoHide && !options.timepicker)
                                          $picker.hide();
                                  });
                                  
                              }
                          })
                      }
                      
                      if (options.minDateFrom) {
                          var fromEl = angular.element(options.minDateFrom)
                          if (fromEl.length) {
                              var hasChage = false;
                              var fromPicker = fromEl.data('$datepicker');
                              var fromScope = fromPicker && fromPicker.$scope;
                              fromScope && fromScope.$watch('modelDate', function (newValue, oldValue) {
                                  if (newValue) {
                                      apply(function () {
                                          var dt = moment(newValue);
                                          scope.minDate = dt.clone().add(options.minRange, options.rangeType);
                                          scope.currentDate = dt.clone().add(options.defaultRange, options.rangeTypee);
                                          scope.selectedDay = scope.currentDate.month() + '-' + scope.currentDate.date();
                                          $picker.caches = {};
                                          options.minYear = scope.minDate.year();
                                          if (options.maxRange) {
                                              scope.maxDate = dt.clone().add(options.maxRange, options.rangeType);
                                              options.maxYear = scope.maxDate.year();
                                          }
                                          getYearArray()
                                          buildNew();
                                          fireChange();
                                          hasChage = true;
                                      })
                                  }

                              })
                              fromScope && fromScope.$on(options.prefixEvent + '.hide', function () {
                                  if (hasChage)
                                      $picker.show();
                                  hasChage = false;
                              });
                          }
                      }
                      if (options.iconId) {
                          var iconEl = angular.element(options.iconId)
                          if (iconEl.length) {
                              iconEl.on('click', function () {
                                  $picker.toggle();
                              })
                              scope.$on('$destroy', function () {
                                  iconEl.off('click')
                              });
                          }
                      }
                      scope.$watch('selectedIndex', function (newValue, oldValue) {
                          
                          if (newValue != oldValue) {
                              var idx = newValue;
                              if (idx >= scope.dayArray.length)
                                  idx = scope.dayArray.length - 1;
                              var dt = scope.dayArray[idx];
                              scope.selectedDay = dt.month + '-' + dt.day;
                              var diff = dt.month - scope.currentDate.month();
                              if (diff != 0) {
                                  if (diff > 0 && diff != 11 || diff == -11)
                                      $picker.next();
                                  else if (diff < 0 || diff == 11)
                                      $picker.before();
                              }
                              
                              scope.currentDate.date(dt.day);
                              scope.currentDate.month(dt.month);
                              fireChange('date');
                              renderModel();
                          }
                      })
                      
                      scope.$watch('currentDateObject.month', function (newval, oldval) {
                          if (newval != oldval && oldval) {
                              scope.selectedDay = scope.selectedDay.replace(oldval + '-', newval + '-');
                          }
                      })
                      scope.$on('pickerTimeChanged', function (evt, val) {
                          formatPicker();
                          if (angular.isFunction(options.onTimeChange))
                              options.onTimeChange(scope, { $currentDate: scope.currentDate.toDate() });
                          if (angular.isFunction(options.onChange))
                              options.onChange(scope, { $currentDate: scope.currentDate.toDate() });
                      })
                      scope.$on('pickerDatetimeChanged', function (evt, val) {
                          formatPicker();
                          if (angular.isFunction(options.onChange))
                              options.onChange(scope, { $currentDate: scope.currentDate.toDate() });
                      })
                      scope.$on('pickerDateChanged', function (evt, val) {
                          formatPicker();
                          if (angular.isFunction(options.onDateChange))
                              options.onDateChange(scope, { $currentDate: scope.currentDate.toDate() });
                          if (angular.isFunction(options.onChange))
                              options.onChange(scope, { $currentDate: scope.currentDate.toDate() });
                      })
                  }
                  function formatPicker() {
                      (options.timeView == 'list') && scrollTime();
                      scope.currentMonthTitle = scope.currentDate.format(options.headerFormat);
                      scope.currentYear = scope.currentDate.year();
                      options.showYears && scrollYear();
                  }
                  function apply(fn) {
                      if (!scope.$$phase) {
                          scope.$apply(function () {
                              fn();
                          })
                      }
                      else
                          fn();
                  }

                  return $picker;
              }
              return Factory;
          }
        ];
    })
    .directive('timePickerSwitch',
      function () {
          return {
              restrict: 'AC',
              link: function postLink(scope, element, attr, transclusion) {
                  var span = angular.element('<a href="#" class="tps-btn"></a>').append('<i class="' + scope.$eval(attr.timeIcon) + '"></i>').appendTo(element)
                  var time = angular.element('<span>Time</span>').appendTo(span)
                  scope.$on('pickerTimeChanged', function (evt, val) {
                      var format = scope.$options.timeView == 'list' ? 'HH:mm' : 'HH:mm:ss';
                      time.html(scope.currentDate.format(format))
                  })
                  element.on('click', function (evt) {
                      evt.preventDefault();
                      evt.stopPropagation();
                      if (scope.$options.datepicker)
                          scope.$toggleTimepicker();
                      else
                          scope.$apply(function () { scope.$hide() });

                  });
                  if (!scope.$options.datepicker)
                      scope.$$postDigest(function () {
                          scope.$toggleTimepicker();
                      });

                  element.append('<a class="tp-close" title="Close"><i class="' + scope.$eval(attr.closeIcon) + '"></i></a>');
                  scope.$on('$destroy', function () {
                      element.off('click')
                  });

              }
          };
      })
    .directive('tpBindTime',
      function () {
          return {
              restrict: 'AC',
              link: function postLink(scope, element, attr, transclusion) {
                  var type = attr.tpBindTime;
                  scope.$watch('currentDateObject.' + type, function (newVal, oldVal) {
                      switch (type) {
                          case 'hour':
                              element.html(scope.currentDate.format('HH'))
                              break;
                          case 'minute':
                              element.html(scope.currentDate.format('mm'))
                              break;
                          case 'second':
                              element.html(scope.currentDate.format('ss'))
                              break;
                      }
                  })
              }
          };
      })
    .directive('tpTimeListItem',
      function () {
          return {
              restrict: 'AC',
              link: function postLink(scope, element, attr, transclusion) {
                  var time = scope.time;
                  element.html('<span>' + time + '</span>');
                  element.on('click', function (evt) {
                      scope.$parent.$apply(function () {
                          scope.$parent.currentTimeString = time;
                          scope.$parent.$setTime(time);
                      })
                  })
                  scope.$on('$destroy', function () {
                      element.off('click')
                  });
              }
          };
      })
    .directive('calDateItem',
      function () {
          return {
              restrict: 'AC',
              link: function postLink(scope, element, attr, transclusion) {
                  var index = parseInt(attr.calDateItem);
                  var options = scope.$options;
                  if (!element.hasClass('unselectable'))
                      element.on('click', function (evt) {
                          evt.preventDefault();
                          scope.$parent.$apply(function () {
                              if (scope.selectedIndex != index)
                                  scope.selectedIndex = index;
                              else
                                  scope.$hide();
                          });
                      })
                  scope.$on('$destroy', function () {
                      element.off('click')
                  });

              }
          };
      }
    )
    .directive('nqDatepicker', ['$datepicker',
      function ($datepicker) {
          return {
              restrict: 'EAC',
              require: '?ngModel',
              link: function postLink(scope, element, attr, ngModel) {
                  var options = {
                      $scope : scope.$new()
                  }
                  if (angular.isDefined(attr.qoMode)) {
                      var mode = attr.qoMode;
                      if (/datetime|time/.test(mode)) {
                          options.timepicker = true;
                          if (!attr.qoFormat) {
                              if (mode == 'datetime')
                                  options.format = 'MM-DD-YYYY HH:mm:ss';
                              else {
                                  options.format = 'HH:mm:ss';
                                  options.datepicker = false;
                              }
                                  
                          }
                          else if (mode == 'time') {
                              options.datepicker = false;
                          }
                      }
                  }
                  var picker = new $datepicker(element, options, attr, ngModel);
                  element.data('$datepicker', picker)
                  scope.$on('$destroy', function () {
                      picker && picker.destroy();
                      options = null;
                      picker = null;
                  });

              }
          };
      }
    ])
}(window, window.angular);

