/*global angular, google */
angular.module('angularGeocode')
    .factory('geocode', ['$timeout', '$q', function($timeout, $q) {
        var geocoder = new google.maps.Geocoder();
        var runGeoCoder = function(options, process, deferred) {
            geocoder.geocode(options, function(result, status) {
                $timeout(function() {
                    if(!process(result, status, deferred)) {
                        switch(status) {
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
                    }
                });
            });
        };

        return {
            toLatLng: function(address) {
                var deferred = $q.defer(),
                    process = function(result, status, deffered) {
                        switch(status) {
                            case google.maps.GeocoderStatus.OK:
                                deferred.resolve({
                                    lat: result[0].geometry.location.lat(),
                                    lng: result[0].geometry.location.lng()
                                });
                                return true;
                            case google.maps.GeocoderStatus.ZERO_RESULTS:
                                //console.log('Zero results were found for forward geocoding of "'+address+'"');
                                deferred.resolve({
                                    lat: 0,
                                    lng: 0
                                });
                                return true;
                        }

                        return false;
                    };

                runGeoCoder({address: address}, process, deferred);

                return deferred.promise;
            },
            toAddress: function(latLng) {
                var deferred = $q.defer(),
                    process = function(result, status, deffered) {
                        if(status == google.maps.GeocoderStatus.OK) {

                            if (result[1]) {
                                deferred.resolve(result[1].formatted_address);
                                return true;
                            }

                            deferred.reject("Location not found");
                        }

                        return false;
                    };

                runGeoCoder({latLng: latLng}, process, deferred);

                return deferred.promise;
            }
        };
    }]);