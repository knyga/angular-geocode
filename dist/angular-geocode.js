/*! angular-geocode - v1.0.0 - 2015-04-24
* https://github.com/knyga/angular-geocode
* Copyright (c) 2015 ; Licensed  */
angular.module('angularGeocode', []);
angular.module('angularGeocode')
    .directive('geocode', ['$timeout', 'geocodef', function ($timeout, geocodef) {
        return {
            restrict: 'EA',
            scope: {
                address: '=',
                coordinates: '='
            },
            template: '<div></div>',
            link: function ($scope) {
                var ignoreChange = {
                    address: false,
                    coordinates: true
                };

                //Update coordinates on address changed
                $scope.$watch('address', function (address) {
                    if (!ignoreChange.address) {
                        geocodef.toLatLng(address).then(function (latLng) {
                            $scope.coordinates = latLng;
                            ignoreChange.coordinates = true;
                        });
                    }
                    ignoreChange.address = false;
                });

                //Update address on coordinates changed
                $scope.$watch('coordinates', function (latLng) {
                    if (!ignoreChange.coordinates) {
                        geocodef.toAddress(latLng).then(function (address) {
                            $scope.address = address;
                            ignoreChange.address = true;
                        });
                    }
                    ignoreChange.coordinates = false;
                }, true);
            }
        };
    }]);
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
                        switch (status) {
                            case "OK": //google.maps.GeocoderStatus.OK:
                                deferred.resolve({
                                    lat: result[0].geometry.location.lat(),
                                    lng: result[0].geometry.location.lng()
                                });
                                return true;
                            case "ZERO_RESULTS": //google.maps.GeocoderStatus.ZERO_RESULTS:
                                //console.log('Zero results were found for forward geocoding of "'+address+'"');
                                deferred.resolve({
                                    lat: 0,
                                    lng: 0
                                });
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

                                    if (/administrative_area_level/.test(result[i].types[0])) {
                                        address = result[i].formatted_address;
                                        break;
                                    }
                                }

                                if (address) {
                                    deferred.resolve(address);
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

                if (latLng && latLng.lat && latLng.lng) {
                    runGeoCoder({latLng: latLng}, process, deferred);
                } else {
                    process(null, google.maps.GeocoderStatus.ZERO_RESULTS);
                }

                return deferred.promise;
            }
        };
    }]);