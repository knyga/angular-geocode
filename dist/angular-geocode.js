/*! angular-geocode - v1.0.0 - 2015-04-24
* https://github.com/knyga/angular-geocode
* Copyright (c) 2015 ; Licensed  */
angular.module('angularGeocode', []);
angular.module('angularGeocode')
    .directive('geocode', ['$timeout', 'geocodef', function ($timeout, geocodef) {
        return {
            restrict: 'EA',
            scope: {
                address: '=?',
                coordinates: '=?',
                result: '=?'
            },
            template: '<div></div>',
            link: function ($scope, element, attrs) {
                var ignoreChange = {
                    address: false,
                    coordinates: true
                    },
                    isChangedManually = false,
                    isBlockReverseOnManual = attrs.hasOwnProperty('blockManualReverse') ? true : false;

                element.on('change keydown', function() {
                    isChangedManually = true;
                });

                //Update coordinates on address changed
                $scope.$watch('address', function (address, oldAddress) {
                    if(oldAddress && 0 < oldAddress.length && 0 === address.length) {
                        isChangedManually = false;
                    }

                    if (!ignoreChange.address) {
                        geocodef.toLatLng(address).then(function (value) {
                            $scope.coordinates = value.latLng;
                            $scope.result = value.result;
                            ignoreChange.coordinates = true;
                        });
                    }
                    ignoreChange.address = false;
                });

                //Update address on coordinates changed
                $scope.$watch('coordinates', function (latLng) {
                    if (!ignoreChange.coordinates && !(isChangedManually && isBlockReverseOnManual)) {
                        geocodef.toAddress(latLng).then(function (value) {
                            $scope.address = value.address;
                            $scope.result = value.result;
                            ignoreChange.address = true;
                            isChangedManually = false;
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

                                    if (/(locality|administrative_area_level)/.test(result[i].types[0])) {
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
                                deferred.reject("No results");
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