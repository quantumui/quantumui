'use strict';
angular.module('ngQuantum.modalBox', ['ngQuantum.modal'])
        .provider('$modalBox', function () {
            var defaults = this.defaults = {
                effect: 'slit',
                boxType: 'alert',
                typeClass: 'modalbox',
                instanceName: 'modal',
                prefixEvent: 'modalbox',
                directive: 'nqModalBox',
                placement: 'near-top',
                uniqueId: 'nq-modalbox',
                trigger: 'click',
                okText: 'OK',
                cancelText: 'Cancel',
                confirmText: 'Confirm',
                template:false,
                showIcon: true,
                promptModel: '$promptValue',
                alertTemplate: 'modalbox/alertbox.tpl.html',
                confirmTemplate: 'modalbox/confirmbox.tpl.html',
                promptTemplate: 'modalbox/promptbox.tpl.html'
            };
            this.$get = ['$modal', '$parse', '$helpers',
              function ($modal, $parse, $helpers) {
                  function ModalBoxFactory(config, attr) {
                      findTemplate()
                      var $modalBox = {}, element = config.element, $buttons;

                      var options = angular.extend({}, defaults, config);
                      attr && angular.forEach(['afterOk', 'afterConfirm', 'afterCancel', 'afterCustom'], function (key) {
                          if (angular.isDefined(attr[key])) {
                              options[key] = $parse(attr[key]);
                          }
                      })
                      $modalBox = new $modal(options, attr);
                      options = config = $modalBox.$options;
                      var scope = $modalBox.$scope
                      angular.forEach(['okText', 'cancelText', 'confirmText', 'promptLabel'], function (key) {
                          scope[key] = options[key]

                      })
                      var init = $modalBox.init;
                      $modalBox.init = function () {
                          init();
                          if (!options.showIcon) {
                              $modalBox.$target.addClass('no-icon')
                          }
                      };
                      var show = $modalBox.show;
                      $modalBox.show = function () {
                          if (options.boxType == 'prompt')
                              scope.promptModel = '';
                          var promise = show();
                          if ($buttons)
                              $buttons.on('click', $modalBox.hide);
                          return promise;
                      };
                      var hide = $modalBox.hide;
                      $modalBox.hide = function () {

                          if (angular.isFunction(options.afterOk) && !$buttons) {
                              options.afterOk(scope)
                          }
                          if ($buttons) {
                              if (angular.isFunction(options.afterCustom))
                                  options.afterCustom(scope)
                              $buttons.off('click', $modalBox.hide)
                          }
                          return hide();
                      };
                      var footerCheck = $modalBox.footerCheck;
                      $modalBox.footerCheck = function () {
                          footerCheck(arguments);
                          if ($modalBox.customFooter && $modalBox.customFooter.length)
                              $buttons = $modalBox.customFooter.find('button');
                      };
                      scope.$confirm = function () {
                          scope.$$postDigest(function () {
                              $modalBox.hide();
                              if (angular.isFunction(options.afterConfirm)) {
                                  scope.$parent.$apply(function () {
                                      if (options.boxType == 'prompt')
                                          scope.$parent[options.promptModel] = scope.promptModel;
                                  })
                                  options.afterConfirm(scope);
                              }
                          });

                      }
                      scope.$cancel = function () {
                          scope.$$postDigest(function () {
                              $modalBox.hide();
                              if (angular.isFunction(options.afterCancel)) {
                                  options.afterCancel(scope)
                              }
                          });

                      }
                      scope.$on('$destroy', function () {
                          $modalBox && !$modalBox.isDestroyed && $modalBox.destroy();
                          $modalBox = null;
                      });
                      function findTemplate() {

                          switch (config.boxType) {
                              case 'alert':
                                  config.template = config.alertTemplate || defaults.alertTemplate
                                  break;
                              case 'confirm':
                                  config.template = config.confirmTemplate || defaults.confirmTemplate
                                  break;
                              case 'prompt':
                                  config.template = config.promptTemplate || defaults.promptTemplate
                                  break;
                              default:
                                  config.template = config.template || defaults.alertTemplate
                                  break;
                          }
                      }
                      return $modalBox;
                  }
                  return ModalBoxFactory;
              }
            ];
        })
    .directive('nqModalBox', ['$modalBox','$helpers',
      function ($modalBox, $helpers) {
          return {
              restrict: 'EAC',
              scope:true,
              link: function postLink(scope, element, attr, transclusion) {
                  var options = {
                      $scope: scope
                  };
                  angular.forEach(['boxType', 'promptLabel', 'promptModel', 'alertTemplate', 'confirmTemplate', 'promptTemplate',
                      'showIcon', 'okText', 'cancelText', 'confirmText'], function (key) {
                      if (angular.isDefined(attr[key]))
                          options[key] = $helpers.parseConstant(attr[key]);

                  })
                  options.uniqueId = attr.uniqueId || attr.id || scope.$id;
                  options.element = element;
                  var modalBox = {}
                  if (angular.isDefined(attr.contentTarget)) {
                      var content = angular.element(attr.contentTarget)
                      if (!content.length) {
                          content = angular.element('<span><span class="label label-warning">Warning :</span> No content element find</span>')
                      }
                      options.htmlObject = true;
                      options.buildOnShow = false;
                      scope.content = content;
                      modalBox =new $modalBox(options, attr);
                  }
                  else {
                      options.element = element;
                      options.html = true;
                      modalBox =new $modalBox(options, attr);

                  }
                  scope.$on('$destroy', function () {
                      modalBox = null;
                  })
                  element.data('$nqModalBox', modalBox)
              }
          };
      }
    ])
