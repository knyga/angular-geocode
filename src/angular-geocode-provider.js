/*global angular, google */
angular.module('angularGeocode')
    .factory('geocodef', ['$timeout', '$q', function($timeout, $q) {
        var initGeocoder = function() {
            return "undefined" !== typeof google ? new google.maps.Geocoder() : null;
        };

        var geocoder = initGeocoder();
        var runGeoCoder = function (options, process, deferred) {
            if(null == geocoder) {
                geocoder = initGeocoder();
            }

            geocoder.geocode(options, function (result, status) {
                $timeout(function () {
                    if (!process(result, status)) {
                        switch (status) {
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
            toLatLng: function (address) {
                var deferred = $q.defer(),
                    process = function (result, status) {
                        var value = {
                            latLng: {
                                latitude: 0,
                                longitude: 0
                            },
                            address: address,
                            result: result
                        };

                        switch (status) {
                            case "OK": //google.maps.GeocoderStatus.OK:
                                value.latLng = {
                                    latitude: result[0].geometry.location.lat(),
                                    longitude: result[0].geometry.location.lng()
                                };
                                deferred.resolve(value);
                                return true;
                            case "ZERO_RESULTS": //google.maps.GeocoderStatus.ZERO_RESULTS:
                                //console.log('Zero results were found for forward geocoding of "'+address+'"');
                                deferred.resolve(value);
                                return true;
                        }

                        return false;
                    };

                if (address) {
                    runGeoCoder({address: address}, process, deferred);
                } else {
                    process(null, google.maps.GeocoderStatus.ZERO_RESULTS);
                }

                return deferred.promise;
            },
            toAddress: function (latLng) {
                var deferred = $q.defer(),
                    process = function (result, status) {
                        switch (status) {
                            case "OK": //google.maps.GeocoderStatus.OK:
                                var address = result.length ? result[result.length - 1].formatted_address : "",
                                    i = 0;
                                //find first administrative_area_level object or return last

                                for (i = 0; i < result.length; i++) {

                                    if (/(locality|route|administrative_area_level)/.test(result[i].types[0])) {
                                    //if(result[i].hasOwnProperty('geometry')) {
                                        address = result[i].formatted_address;
                                        break;
                                    }
                                }

                                if (address) {
                                    deferred.resolve({
                                        address: address,
                                        latLng: latLng,
                                        result: result
                                    });
                                    return true;
                                }

                                deferred.reject("Location not found");
                                break;
                            case "ZERO_RESULTS": //google.maps.GeocoderStatus.ZERO_RESULTS:
                                deferred.resolve("");
                                return true;
                        }

                        return false;
                    };

                if (latLng && latLng.latitude && latLng.longitude) {
                    runGeoCoder({latLng: {
                        lat: latLng.latitude,
                        lng: latLng.longitude
                    }}, process, deferred);
                } else {
                    process(null, google.maps.GeocoderStatus.ZERO_RESULTS);
                }

                return deferred.promise;
            }
        };
    }]);