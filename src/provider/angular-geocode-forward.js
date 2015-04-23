/*global angular, google */
angular.module('angularGeocode')
    .factory('geocodeForward', ['$timeout', '$q', function($timeout, $q) {
        var geocoder = new google.maps.Geocoder();

        return function(address) {
            var deferred = $q.defer(),
                latLng = {
                    lat: 0,
                    lng: 0
                };

            geocoder.geocode({ address: address }, function(result, status) {
                $timeout(function() {
                    switch(status) {
                        case google.maps.GeocoderStatus.OK:
                            latLng.lat = result[0].geometry.location.lat();
                            latLng.lng = result[0].geometry.location.lng();
                            deferred.resolve(latLng);
                            break;
                        case google.maps.GeocoderStatus.ZERO_RESULTS:
                            latLng.lat = 0;
                            latLng.lng = 0;
                            //console.log('Zero results were found for forward geocoding of "'+address+'"');
                            deferred.resolve(latLng);
                            break;
                        case google.maps.GeocoderStatus.OVER_QUERY_LIMIT:
                            deferred.reject('Over query limit');
                            break;
                        case google.maps.GeocoderStatus.REQUEST_DENIED:
                            deferred.reject('Request denied');
                            break;
                        case google.maps.GeocoderStatus.INVALID_REQUEST:
                            deferred.reject('Invalid request');
                            break;
                    }
                });
            });

            return deferred.promise;
        };
    }]);