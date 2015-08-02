'use strict';
angular.module('ngQuantum.pageable.zeroresult')
.run(['$templateCache', function ($templateCache) {
    'use strict';
    $templateCache.put('pageable/zeroresult.tpl.html',
             '<div class="zero-result-inner">'
               + '<h1 class="zero-title" nq-bind="$zeroTitle || \'No result found.\'"></h1>'
               + '<p nq-bind="$zeroDescription || \'There is no data to displayed according to your configuration or filter...\'"></p>'
           + '</div>'
    );
}])
