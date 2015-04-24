/*global angular, google */
angular.module('angularGeocode')
    .factory('geocodef', ['$timeout', '$q', function($timeout, $q) {
        var geocoder = new google.maps.Geocoder();
        var runGeoCoder = function(options, process, deferred) {
            geocoder.geocode(options, function(result, status) {
                $timeout(function() {
                    if(!process(result, status)) {
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
                    process = function(result, status) {
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

                if(address) {
                    runGeoCoder({address: address}, process, deferred);
                } else {
                    process(null, google.maps.GeocoderStatus.ZERO_RESULTS);
                }

                return deferred.promise;
            },
            toAddress: function(latLng) {
                var deferred = $q.defer(),
                    process = function(result, status) {
                        if(status === google.maps.GeocoderStatus.OK) {
                            var address = result.length ? result[result.length-1].formatted_address : "",
                                i = 0;
                            //find first administrative_area_level object or return last

                            for(i=0;i<result.length;i++) {

                                if(/administrative_area_level/.test(result[i].types[0])) {
                                    address = result[i].formatted_address;
                                    break;
                                }
                            }

                            if (address) {
                                deferred.resolve(address);
                                return true;
                            }

                            deferred.reject("Location not found");
                        }

                        return false;
                    };

                if(latLng && latLng.lat && latLng.lng) {
                    runGeoCoder({latLng: latLng}, process, deferred);
                } else {
                    process(null, google.maps.GeocoderStatus.ZERO_RESULTS);
                }

                return deferred.promise;
            }
        };
    }]);