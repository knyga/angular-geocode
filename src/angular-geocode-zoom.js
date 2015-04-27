/*global angular */
angular.module('angularGeocode')
    .factory('zoomLevel', [function () {
        var ZOOM_MAX = 16,
            WORLD_DIM = {height: 256, width: 256};

        function latRad(lat) {
            var sin = Math.sin(lat * Math.PI / 180);
            var radX2 = Math.log((1 + sin) / (1 - sin)) / 2;
            return Math.max(Math.min(radX2, Math.PI), -Math.PI) / 2;
        }

        function zoom(mapPx, worldPx, fraction) {
            return Math.floor(Math.log(mapPx / worldPx / fraction) / Math.LN2);
        }

        return function (bounds, mapDim) {
            var latFraction = (latRad(bounds.ne.latitude) - latRad(bounds.sw.latitude)) / Math.PI;

            var lngDiff = bounds.ne.longitude - bounds.sw.longitude;
            var lngFraction = ((lngDiff < 0) ? (lngDiff + 360) : lngDiff) / 360;

            var latZoom = zoom(mapDim.height, WORLD_DIM.height, latFraction);
            var lngZoom = zoom(mapDim.width, WORLD_DIM.width, lngFraction);

            return Math.min(latZoom, lngZoom, ZOOM_MAX);
        };
    }]);