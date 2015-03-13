angular.module('ngQuantum').config(
    ['$datepickerProvider',
     '$loadingButtonProvider',
     '$colorPickerProvider',
     '$loadingProvider',
     '$modalProvider',
     '$selectProvider',
      function ($datepickerProvider, $loadingButtonProvider, $colorPickerProvider, $loadingProvider, $modalProvider, $selectProvider) {
          var dpdef = $datepickerProvider.defaults,
              lbdef = $loadingButtonProvider.defaults,
              cpdef = $colorPickerProvider.defaults,
              ldef = $loadingProvider.defaults,
              mdef = $modalProvider.defaults,
              sdef = $selectProvider.defaults
          //datepicker icons
          dpdef.todayIcon = 'glyphicon glyphicon-refresh';
          dpdef.nextIcon = 'glyphicon glyphicon-chevron-right';
          dpdef.prevIcon = 'glyphicon glyphicon-chevron-left';
          dpdef.timeIcon = 'glyphicon glyphicon-time';
          dpdef.closeIcon =  'glyphicon glyphicon-remove';
          dpdef.downIcon =  'glyphicon glyphicon-chevron-down';
          dpdef.upIcon = 'glyphicon glyphicon-chevron-up';

          //loadingButton icons
          lbdef.spinner = '<i class="glyphicon glyphicon-repeat spin"></i> '; //any html accepted
          lbdef.successIcon = '<i class="glyphicon fu-check  flash"></i>'; //any html accepted
          lbdef.errorIcon = '<i class="glyphicon glyphicon-ok flash red"></i> '; //any html accepted
          lbdef.timeoutIcon = '<i class="glyphicon glyphicon-bell"></i> '; //any html accepted

          //colorpicker icons
          cpdef.iconDown = 'glyphicon glyphicon-menu-down';
          cpdef.iconUp = 'glyphicon glyphicon-menu-up';

          //loading service icons
          ldef.spinnerIcon = '<i class="glyphicon glyphicon-repeat spin-icon spin"></i>'; //any html accepted

          //modal icons
          mdef.closeIcon = '<i class="glyphicon glyphicon-remove"></i>'; //any html accepted

          //select icons
          sdef.clearIcon = '<i class="glyphicon glyphicon-remove"></i>'; //any html accepted
          sdef.spinner = '<i class="glyphicon glyphicon-repeat spin"></i>'; //any html accepted

    }])
