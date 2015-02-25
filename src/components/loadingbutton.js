'use strict';
angular.module('ngQuantum.loadingButton', ['ngQuantum.services.helpers'])
    .provider('$loadingButton', function () {
        var defaults = this.defaults = {
            timeout: 2000,
            onError: angular.noop,
            onSuccess: angular.noop,
            loadingText: 'Loading...',
            showIcons: true,
            spinner: '<i class="fic fu-spinner-circle spin"></i> ',
            successIcon: '<i class="fic fu-check  flash"></i>',
            errorIcon: '<i class="fic fu-cross-c flash red"></i> ',
            timeoutIcon: '<i class="fic fu-bell-off"></i> '
        };
        this.$get = function () {
            return { defaults: defaults };
        };
    })
    .directive("nqLoadingButton", ['$parse', '$loadingButton', '$helpers', '$timeout', '$q',
        function ($parse, $loadingButton, $helpers, $timeout, $q) {
            return {
                restrict: 'A',
                link: function (scope, element, attr) {
                    var fn = $parse(attr.nqLoadingButton);
                    var options = angular.extend({}, $loadingButton.defaults);
                    angular.forEach(['onSuccess', 'onTimeout', 'onError'], function (key) {
                        if (angular.isDefined(attr[key]))
                            options[key] = $parse(attr[key]);
                    })
                    angular.forEach(['loadingText', 'showIcons', 'timeout'], function (key) {
                        angular.isDefined(attr[key]) && (options[key] = $helpers.parseConstant(attr[key]));
                    })
                    var cloneElement = element.clone();
                    cloneElement.attr('disabled', 'disabled').html(options.loadingText);

                    options.showIcons && cloneElement.prepend(options.spinner);
                    var erricon, timeicon, successicon;
                    if (options.showIcons) {
                        successicon = angular.isElement(options.successIcon) ? options.successIcon : angular.element(options.successIcon)
                        erricon = angular.isElement(options.errorIcon) ? options.errorIcon : angular.element(options.errorIcon)
                    }
                    element.on('click', function (event) {
                        scope.$apply(function () {
                            getTimer(event);
                        });
                    });

                    function getTimer(event) {
                        element.css('display', 'none');
                        element.after(cloneElement);
                        $q.when(fn(scope, { $event: event }))
                        .then(function (res) {
                            element.css('display', '');
                            cloneElement.remove();
                            successicon && element.prepend(successicon);
                            successicon && setTimeout(function () {
                                successicon.remove();
                            }, options.timeout)
                            options.onSuccess(scope, { $event: event, $data: res });
                            return res;
                        }, function (res) {
                            element.css('display', '');
                            cloneElement.remove();
                            erricon && element.prepend(erricon);
                            options.onError(scope, { $event: event, $data: res });
                            erricon && setTimeout(function () {
                                erricon.remove();
                            }, options.timeout)
                        });
                    }
                }
            }
        }]);