'use strict';
angular.module('ngQuantum.dropdown', ['ngQuantum.popMaster'])
    .run(['$templateCache', function ($templateCache) {
        'use strict';

        $templateCache.put('dropdown/dropdown.tpl.html',
          "<ul tabindex=\"-1\" class=\"dropdown-menu\" role=\"menu\"><li role=\"presentation\" ng-class=\"{divider: item.divider}\" ng-repeat=\"item in content\"><a role=\"menuitem\" tabindex=\"-1\" ng-href=\"{{item.href}}\" ng-if=\"!item.divider && item.href\" ng-bind=\"item.text\"></a> <a role=\"menuitem\" tabindex=\"-1\" href=\"javascript:void(0)\" ng-if=\"!item.divider && item.click\" ng-click=\"$parent.$eval(item.click);$hide();\" ng-bind=\"item.text\"></a></li></ul>"
        );

    }])
    .provider('$dropdown', function () {
        var defaults = this.defaults = {
            effect: 'flip-x',
            typeClass: 'dropdown',
            prefixEvent: 'dropdown',
            placement: 'bottom-left',
            template: 'dropdown/dropdown.tpl.html',
            trigger: 'click',
            directive: 'nqDropdown',
            instanceName: 'dropdown',
            ensurePlacement:true,
            showArrow: false,
            fireEmit: true,
            displayReflow: false,
            keyboard: true,
            fixWidth:true
        };
        this.$get = [
          '$timeout',
          '$rootScope',
          '$popMaster', '$helpers',
          function ($timeout, $rootScope, $popMaster, $helpers) {

              function DropdownFactory(element, config, attr) {
                  var $dropdown = {};
                  config = angular.extend(config, $helpers.parseOptions(attr, config))
                  var options = angular.extend({}, defaults, config);
                  if (!options.independent) {
                      var target;
                      if (options.target)
                          target = angular.element(options.target);
                      else {
                          target = angular.element(element.find('.dropdown-container, .dropdown-menu')[0]);
                          if (target.length < 1)
                              target = angular.element(element.next('.dropdown-container, .dropdown-menu')[0]);
                      }

                      if (target.length > 0)
                          options.targetElement = target
                  }

                  $dropdown = new $popMaster(element, options);
                  options = $dropdown.$options = $helpers.observeOptions(attr, $dropdown.$options);
                  var scope = $dropdown.$scope
                  $dropdown.$onKeyDown = function (e) {
                      if (!/(38|40|13)/.test(e.keyCode))
                          return;
                      e.preventDefault();
                      e.stopPropagation();

                      var $items = $dropdown.$target.find('[role="menuitem"]:visible');
                      $dropdown.$target.focus();
                      if (!$items.length) return;
                      var index = scope.lastIndex > -1 ? scope.lastIndex : -1
                      if (e.keyCode == 38 && index > 0) index--                  // up
                      if (e.keyCode == 40 && index < $items.length - 1) index++  // down
                      if (!~index) index = 0
                      if (e.keyCode === 13) {
                          return angular.element($items[index]).trigger('click');
                      }
                      $items.eq(index).focus()
                      scope.lastIndex = index;

                  };
                  var show = $dropdown.show;
                  $dropdown.show = function (callback) {
                      var promise = show(callback);
                      angular.element(document).off('keydown.nqDropdown.api.data');
                      angular.element(document).on('keydown.nqDropdown.api.data', $dropdown.$onKeyDown);

                      if (!scope.$$phase) {
                          scope.$apply(function () {
                              $dropdown.$target.focus();
                          })
                      }
                      else
                          $dropdown.$target.focus();
                      if (!options.independent && options.fixWidth) {
                          var ew = element.outerWidth(true), tw = $dropdown.$target.outerWidth(true);
                          if(ew > tw)
                              $dropdown.$target.css('min-width', ew)
                      }
                      element.parent().addClass('open')
                      return promise;
                  };
                  var hide = $dropdown.hide;
                  $dropdown.hide = function (callback) {
                      scope.lastIndex = -1;
                      angular.element(document).off('keydown.nqDropdown.api.data');
                      element.parent().removeClass('open')
                     return hide(callback);
                  };
                  if (attr && angular.isDefined(options.directive)) {
                      attr[options.directive] && options.$scope.$watch(attr[options.directive], function (newValue, oldValue) {
                          scope.content = newValue;
                      }, true);
                  }
                  

                  if (options.autoDestroy)
                      scope.$on('$destroy', function () {
                          $dropdown && $dropdown.destroy();
                          $dropdown = null

                      })
                  return $dropdown;
              }
              return DropdownFactory;
          }
        ];
    })
    .directive('nqDropdown', ['$dropdown', 'templateHelper',
      function ($dropdown, templateHelper) {
          return {
              restrict: 'EA',
              link: function postLink(scope, element, attr, transclusion) {
                  var options = {
                      $scope: scope.$new()
                  };
                  
                  options.uniqueId = attr.qoUniqueId || attr.id || options.$scope.$id;
                  if (attr.qoTrigger && attr.qoTrigger.indexOf('hover') > -1) {
                      options.holdHoverDelta = true;
                      options.delayHide = 100;
                      options.delayShow = 10;
                  }

                  var dropdown = {};
                  if (angular.isDefined(attr.qoIndependent)) {
                      options.independent = true;
                      options.html = true;
                      options.displayReflow=false;
                      options.targetElement = element;
                      options.fireEmit = true;
                      dropdown = new $dropdown(null, options, attr);

                  }
                  else
                      dropdown = new $dropdown(element, options, attr);

                  scope.$on('$destroy', function () {
                      dropdown = null;
                  })
                  element.data('$nqDropdown', dropdown)

              }
          };
      }
    ])
