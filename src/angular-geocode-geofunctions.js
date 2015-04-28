/*global angular */
angular.module('angularGeocode')
    .service('GeoFunctions', [function () {
        var GeoFunctions = this;

        this.calculateZoomLevel = function(bounds, mapDim) {
            var ZOOM_MAX = 16,
                WORLD_DIM = {height: 256, width: 256};

            function zoom(mapPx, worldPx, fraction) {
                return Math.floor(Math.log(mapPx / worldPx / fraction) / Math.LN2);
            }

            var latFraction = (GeoFunctions.convertLatitudeToRadians(bounds.ne.latitude) -
                GeoFunctions.convertLatitudeToRadians(bounds.sw.latitude)) / Math.PI;

            var lngDiff = bounds.ne.longitude - bounds.sw.longitude;
            var lngFraction = ((lngDiff < 0) ? (lngDiff + 360) : lngDiff) / 360;

            var latZoom = zoom(mapDim.height, WORLD_DIM.height, latFraction);
            var lngZoom = zoom(mapDim.width, WORLD_DIM.width, lngFraction);

            return Math.min(latZoom, lngZoom, ZOOM_MAX);
        };

        this.calculateCircleBounds = function(center, radius) {
            var kmRadiusX = GeoFunctions.convertDistanceToLatitude(radius),
                kmRadiusY = GeoFunctions.convertDistanceToLongitude(radius);

            var zoneBounds = {
                sw: {
                    latitude: center.latitude - kmRadiusX,
                    longitude: center.longitude - kmRadiusY
                },
                ne: {
                    latitude: center.latitude + kmRadiusX,
                    longitude: center.longitude + kmRadiusY
                }
            };

            return zoneBounds;
        };

        this.convertDegToRadians = function(deg) {
            return Math.PI * deg / 180;
        };

        this.convertLongitudeToRadians = this.convertLatitudeToRadians = function(lat) {
            var sin = Math.sin(lat * Math.PI / 180);
            var radX2 = Math.log((1 + sin) / (1 - sin)) / 2;
            return Math.max(Math.min(radX2, Math.PI), -Math.PI) / 2;
        };

        /**
         * Distance in meters
         */
        this.convertDistanceToLatitude = function(dist) {
            var earthRadius = 6378137,
                kmToDeg = Math.sqrt(earthRadius * earthRadius * 2) / 90;
            return dist / kmToDeg;
        };

        /**
         * Distance in meters
         */
        this.convertDistanceToLongitude = function(dist) {
            var earthRadius = 6378177,
                kmToDeg = Math.sqrt(earthRadius * earthRadius * 2) / 90;
            return dist / kmToDeg;
        };

        /**
         * Distance in meters
         */
        this.calculateDistanceBetweenPoints = function(p1, p2) {
            var earthRadius = 6378137,
                dLat = GeoFunctions.convertDegToRadians(p2.lat - p1.lat),
                dLng = GeoFunctions.convertDegToRadians(p2.lng - p2.lng);

            var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(GeoFunctions.convertDegToRadians(p1.lat) *
                GeoFunctions.convertDegToRadians(p2.lat)) *
                Math.sin(dLng / 2) * Math.sin(dLng / 2);

            var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            var dist = earthRadius * c;

            return dist;
        };
    }]);