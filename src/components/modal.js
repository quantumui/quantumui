'use strict';
angular.module('ngQuantum.modal', ['ngQuantum.popMaster'])
    .run(['$templateCache', function ($templateCache) {
        'use strict';
        $templateCache.put('modal/modal.tpl.html',
          '<div class="modal" tabindex="-1" role="dialog"><div class="modal-dialog"><div class="modal-content"><div class="modal-header" ng-show="title"><h4 class="modal-title" ng-bind="title"></h4></div><div class="modal-body"  ng-bind="content"></div><div class="modal-footer"><button type="button" class="btn btn-default" ng-click="$hide()">{{closeText}}</button></div><button type="button" class="close" ng-click="$hide()" ng-bind-html="closeIcon">&nbsp;</button></div></div></div>'
        );
        $templateCache.put('modalbox/alertbox.tpl.html',
          '<div class="modal" tabindex="-1" role="dialog"><div class="modal-dialog"><div class="modal-content"><div class="modal-header" ng-show="title"><h4 class="modal-title" ng-bind="title"></h4></div><div class="modal-body"><div class="modal-body-inner" ng-bind="content"></div></div><div class="modal-footer"><button type="button" class="btn btn-primary" ng-click="$hide()">{{okText}}</button></div><button type="button" class="close" ng-click="$hide()" ng-bind-html="closeIcon">&nbsp;</button></div></div></div>'
        );
        $templateCache.put('modalbox/confirmbox.tpl.html',
        '<div class="modal" tabindex="-1" role="dialog"><div class="modal-dialog"><div class="modal-content"><div class="modal-header" ng-show="title"><h4 class="modal-title" ng-bind="title"></h4></div><div class="modal-body"><div class="modal-body-inner" ng-bind="content"></div></div><div class="modal-footer"><button type="button" class="btn btn-primary" ng-click="$cancel()">{{cancelText}}</button> <button type="button" class="btn btn-success" ng-click="$confirm()">{{confirmText}}</button></div><button type="button" class="close" ng-click="$cancel()" ng-bind-html="closeIcon">&nbsp;</button></div></div></div>'
        );
        $templateCache.put('modalbox/promptbox.tpl.html',
          '<div class="modal" tabindex="-1" role="dialog"><div class="modal-dialog"><div class="modal-content"><div class="modal-header" ng-show="title"><h4 class="modal-title" ng-bind="title"></h4></div><div class="modal-body"><div class="modal-body-inner" ng-bind="content"></div><div class="margin-t form-group"><label for="promptModel">{{promptLabel}}</label><input type="text" class="form-control" name="promptModel" ng-model="promptModel"></div></div><div class="modal-footer"><button type="button" class="btn btn-primary" ng-click="$cancel()">{{cancelText}}</button> <button type="button" class="btn btn-success" ng-click="$confirm()">{{confirmText}}</button></div><button type="button" class="close" ng-click="$cancel()" ng-bind-html="closeIcon">&nbsp;</button></div></div></div>'
          );
    }])
        .provider('$modal', function () {
            var defaults = this.defaults = {
                effect: 'from-top',
                backdropEffect: 'fade-in',
                animateTarget: '.modal-dialog',
                typeClass: 'modal',
                prefixEvent: 'modal',
                directive: 'nqModal',
                placement: 'near-top',
                uniqueId: 'nq-modal',
                trigger: 'click',
                clearExists: false,
                template: 'modal/modal.tpl.html',
                contentTemplate: false,
                container: false,
                element: null,
                backdrop: true,
                keyboard: true,
                closeText: 'Close',
                closeIcon: '<i class="fic fu-cross"></i>',
                buildOnShow: true,
                html: false,
                size: false,
                displayReflow: false,
                show: false,
                autoDestroy:false
            };
            this.$get = ['$window', '$compile', '$http', '$sce', '$timeout', '$helpers', '$popMaster',
              function ($window, $compile, $http, $sce, $timeout, $helpers, $popMaster) {
                  var $animate = $helpers.injectModule('$animate', 'ngAnimate');
                  var forEach = angular.forEach;
                  var bodyElement = angular.element($window.document.body);
                  function ModalFactory(config, attr) {

                      var $modal = {}, element = config.element;
                      if (!config.$scope) {
                          config.autoDestroy = true;
                          config.show = true;
                          config.html = true;
                          config.fireEmit = true;
                      }
                      if (attr)
                          config = $helpers.parseOptions(attr, config);
                      var options = config = angular.extend({}, defaults, config);
                      
                      
                      
                      options.container = 'body';
                      options.preventReplace = true;
                      $modal = new $popMaster(element, options);
                      if (attr)
                          options = $modal.$options = $helpers.observeOptions(attr, $modal.$options);
                      else
                          options = $modal.$options;
                      
                      var scope = $modal.$scope
                      config.content && (scope.content = config.content)
                      config.title && (scope.title = config.title)
                      scope.closeText = options.closeText;
                      scope.closeIcon = options.closeIcon;

                      var backdropElement = angular.element('<div class="' + options.typeClass + '-backdrop"/>');

                      var init = $modal.init;
                      $modal.init = function () {
                          init();
                          $modal.$promise.then(function (contentTemplate) {
                              if (options.backdrop) {
                                  backdropElement.prependTo($modal.$target)
                              }
                              if (options.screenMode) {
                                  $modal.$target.addClass('screen-mode')
                              }
                              else if ($modal.$animateTarget && options.size)
                                  $modal.$animateTarget.addClass('modal-' + options.size)

                              $modal.footerCheck(contentTemplate);
                              headerCheck(contentTemplate);
                              if (options.trigger == 'hover') {
                                  element.off('mouseleave', $modal.leave);
                              }
                          })
                          
                      };
                      var destroy = $modal.destroy;
                      $modal.destroy = function () {
                          destroy();
                          if (backdropElement) {
                              backdropElement.off('click')
                              backdropElement.remove();
                              backdropElement = null;
                          }
                      };
                      var show = $modal.show;
                      $modal.show = function () {
                         var promise = show();
                          if (options.backdrop) {
                              if (options.backdropEffect) {
                                  backdropElement.addClass('in');
                                  backdropElement.show();
                              }
                              options.backdrop !== 'static' && backdropElement.on('click', hideOnBackdropClick);
                          }
                          if (options.trigger == 'hover') {
                              $helpers.unBindTriggers(element, 'hover', $modal)
                          }
                          if ($modal.$animateTarget && options.size)
                              $modal.$animateTarget.addClass('modal-' + options.size);
                          
                          setTimeout(function () {
                              resizeModal();
                          }, 0);
                          return promise;
                      };
                      var hide = $modal.hide;
                      $modal.hide = function () {
                          if (options.backdrop) {
                              if (options.backdropEffect) {
                                  backdropElement.addClass('fade')
                                  backdropElement.removeClass('in')
                                  
                                  
                              }
                              options.backdrop !== 'static' && backdropElement && backdropElement.off('click');

                          }
                          if (options.trigger == 'hover' && element) {
                              $helpers.bindTriggers(element, 'hover', $modal)
                          }
                          var promise = hide();
                          promise.then(function () {
                              if ($modal.$animateTarget && options.size)
                                  $modal.$animateTarget.removeClass('modal-' + options.size);

                              clearHeight();
                              options.autoDestroy && $modal && $modal.destroy();
                          });
                          return promise;
                          
                      };
                      function hideOnBackdropClick(evt) {
                          options.backdrop === 'static' ? $modal.focus() : $modal.hide();
                      }
                      $modal.footerCheck = footerCheck;
                      function footerCheck(contentTemplate) {
                          var customFooter = $modal.$target.find('.custom-footer');
                          if (!customFooter.length && options.htmlObject)
                              customFooter = scope.content.find('.custom-footer');
                          if (!customFooter.length && contentTemplate && contentTemplate.find)
                              customFooter = contentTemplate.find('.custom-footer');
                          var footer = $modal.$target.find('.modal-footer');
                          if (customFooter.length && footer.length) {
                              footer.replaceWith(customFooter.addClass('modal-footer'))
                              $modal.customFooter = customFooter;
                          }
                      };
                      function headerCheck(contentTemplate) {
                          var customHeader = $modal.$target.find('.custom-header');
                          if (!customHeader.length && options.htmlObject)
                              customHeader = scope.content.find('.custom-header');
                          if (!customHeader.length && contentTemplate && contentTemplate.find)
                              customHeader = contentTemplate.find('.custom-header');
                          var header = $modal.$target.find('.modal-header');
                          if (customHeader.length && header.length) {
                              scope.title = true;
                              header.replaceWith(customHeader.addClass('modal-header'))
                          }
                      };
                      if (attr) {
                          angular.forEach(['title', 'content'], function (key) {
                              var akey = 'qs' + key.capitaliseFirstLetter();
                              attr[akey] && (scope[key] = $sce.trustAsHtml(attr[akey]));
                              attr.$$observers && attr.$$observers[akey] && attr.$observe(akey, function (newValue, oldValue) {
                                  scope[key] = $sce.trustAsHtml(newValue);
                              });
                          });
                          if (angular.isDefined(options.directive)) {
                              attr[options.directive] && options.$scope.$watch(attr[options.directive], function (newValue, oldValue) {
                                  if (angular.isObject(newValue)) {
                                      if (angular.isArray(newValue))
                                          scope.content = newValue;
                                      else
                                          angular.extend(scope, newValue);
                                  } else {
                                      scope.content = newValue;
                                  }
                              }, true);
                          }
                          
                      }
                      
                      
                      function resizeModal() {
                          if (!$modal.$target) {
                              setTimeout(function () {
                                  resizeModal();
                              }, 10);
                              return false;
                          }
                          var cnt = $modal.$target.find('.modal-content'),
                          bdy = $modal.$target.find('.modal-body'),
                          hdr = $modal.$target.find('.modal-header'),
                          ftr = $modal.$target.find('.modal-footer'),
                          dialog = $modal.$target.find('.modal-dialog');
                          if (options.screenMode) {
                              fixBodyHeight(cnt, hdr, ftr);
                          }
                          else {
                              var mh = $modal.$target.innerHeight(),
                                  dh = dialog.outerHeight(true);
                              if (dh > mh) {
                                  $modal.$target.addClass('modal-fix-height');
                                  fixBodyHeight(cnt, hdr, ftr);
                              } else {
                                  verticalPlacement(dialog, mh - dialog.innerHeight())
                              }
                          }
                      }
                      function fixBodyHeight(cnt, hdr, ftr) {
                          var hh = hdr.length ? hdr.outerHeight(true) : 0,
                          fh = ftr.length ? ftr.outerHeight(true) : 0;
                          cnt.css({ 'padding-top': hh, 'padding-bottom': fh });
                          hdr.css('margin-top', -hh);
                      }
                      function clearHeight() {
                          $modal.$target.removeClass('modal-fix-height');
                          $modal.$target.find('.modal-content').css({ 'padding-top': '', 'padding-bottom': '' });
                          $modal.$target.find('.modal-header').css('margin-top', '');
                          $modal.$target.find('.modal-dialog').css('top', '');
                      }
                      function verticalPlacement(dialog, diff) {
                          if (diff > 0) {
                              var top = 0;
                              switch (options.placement) {
                                  case 'center':
                                      top = diff / 2
                                      break;
                                  case 'bottom':
                                      top = diff
                                      break;
                                  case 'near-top':
                                      top = diff / 3
                                      break;
                                  case 'near-bottom':
                                      top = (diff / 3) * 2
                                      break;
                                  default:
                                      top = 0
                              }
                              dialog.css('top', top);
                          }
                      }
                      scope.$on('$destroy', function () {
                          $modal && !$modal.isDestroyed && $modal.destroy();
                          $modal = null;
                      });
                      return $modal;
                  }
                  return ModalFactory;
              }
            ];
        })
    .directive('nqModal', ['$modal',
      function ($modal) {
          return {
              restrict: 'EAC',
              scope: true,
              link: function postLink(scope, element, attr, transclusion) {
                  var options = {
                      $scope: scope
                  };
                  options.uniqueId = attr.qoUniqueId || attr.id || scope.$id;
                  var modal = {}
                  if (angular.isDefined(attr.qoIndependent)) {
                      options.htmlObject = true;
                      scope.content = element;
                      options.buildOnShow = false;
                      modal = $modal(options, attr);
                  }
                  else {
                      options.element = element;
                      options.html = true;
                      modal = $modal(options, attr);

                  }
                  element.data('$nqModal', modal)
              }
          };
      }
    ])
    .directive('modalBodyInner', function () {
        return {
            restrict: 'C',
            require: '?nqModal',
            link: function postLink(scope, element, attr, controller) {
                element.on('scroll', function (e) {
                    scope.$broadcast('staticContentScroll', this.scrollTop)
                })
            }
        };
    })
