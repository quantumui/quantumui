
angular.module('ngQuantum.services.color', ['ngQuantum.services.helpers'])
.factory('$color', ['$helpers', function ($helpers) {
    var color = {};
    color.value = {
        h: 1,
        s: 1,
        b: 1,
        a: 1
    }
    color.setColor = function (val) {
        if (val) {
            val = val.toLowerCase();
            for (var key in $helpers.stringParsers) {
                if ($helpers.stringParsers.hasOwnProperty(key)) {
                    var parser = $helpers.stringParsers[key];
                    var match = parser.re.exec(val),
                        values = match && parser.parse(match);
                    if (values) {
                        color.value = color.RGBtoHSB.apply(null, values);
                        
                    }
                }
            }
        }
        return color;
    }
    color.RGBtoHSB = function (r, g, b, a) {
        r /= 255;
        g /= 255;
        b /= 255;

        var H, S, V, C;
        V = Math.max(r, g, b);
        C = V - Math.min(r, g, b);
        H = (C === 0 ? null :
            V === r ? (g - b) / C :
                V === g ? (b - r) / C + 2 :
                    (r - g) / C + 4
            );
        H = ((H + 360) % 6) * 60 / 360;
        S = C === 0 ? 0 : C / V;
        return { h: H || 1, s: S, b: V, a: a || 1 };
    }
    color.setHue = function (h) {
        color.value.h = h == 0 ? 0 : h == 1 ? 1 : h % 1;
    }
    color.setSaturation = function (s) {
        color.value.s = s == 0 ? 0 : s == 1 ? 1 : s % 1;
    }
    color.setLightness = function (b) {
        color.value.b = b == 0 ? 0 : b == 1 ? 1 : b % 1;
    }
    color.setAlpha = function (a) {
        color.value.a = parseInt((a == 0 ? 0 : a == 1 ? 1 : a % 1) * 100, 10) / 100;
    }
    color.toRGB = function (h, s, b, a) {
        if (!h) {
            h = color.value.h;
            s = color.value.s;
            b = color.value.b;
        }
        h *= 360;
        var R, G, B, X, C;
        h = (h % 360) / 60;
        C = b * s;
        X = C * (1 - Math.abs(h % 2 - 1));
        R = G = B = b - C;

        h = ~~h;
        R += [C, X, 0, 0, X, C][h];
        G += [X, C, C, X, 0, 0][h];
        B += [0, 0, X, C, C, X][h];
        return {
            r: Math.round(R * 255),
            g: Math.round(G * 255),
            b: Math.round(B * 255),
            a: a || color.value.a
        };
    }
    color.toHex = function (h, s, b, a) {
        var rgb = color.toRGB(h, s, b, a);
        return '#' + ((1 << 24) | (parseInt(rgb.r, 10) << 16) | (parseInt(rgb.g, 10) << 8) | parseInt(rgb.b, 10)).toString(16).substr(1);
    }
    color['rgb'] = function () {
        var rgb = color.toRGB();
        return 'rgb(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ')';
    }
    color['rgba'] = function () {
        var rgb = color.toRGB();
        return 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',' + rgb.a + ')';
    }
    color['hex'] = function () {
        return color.toHex();
    }
    return color;
}])