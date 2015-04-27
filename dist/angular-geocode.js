/*! angular-geocode - v1.0.0 - 2015-04-27
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
                result: '=?',
                bounds: '=?'
            },
            template: '<div></div>',
            link: function ($scope, element, attrs) {
                var ignoreChange = {
                    address: false,
                    coordinates: true
                    },
                    isChangedManually = false,
                    isBlockReverseOnManual = attrs.hasOwnProperty('blockManualReverse') ? true : false,
                    isReverseBinding = attrs.hasOwnProperty('reverseBinding') ? true : false;

                element.on('change keydown', function() {
                    isChangedManually = true;
                });

                //Update coordinates on address changed
                $scope.$watch('address', function (address, oldAddress) {
                    if(oldAddress && 0 < oldAddress.length && 0 === address.length) {
                        isChangedManually = false;
                    }

                    if (!ignoreChange.address) {
                        geocodef.toLatLng({
                            address: address,
                            bounds: $scope.bounds
                        }).then(function (value) {
                            $scope.coordinates = value.latLng;
                            $scope.result = value.result;
                            ignoreChange.coordinates = true;
                        });
                    }
                    ignoreChange.address = false;
                });

                //Update address on coordinates changed
                $scope.$watch('coordinates', function (latLng) {
                    if (!ignoreChange.coordinates && isReverseBinding &&
                        !(isChangedManually && isBlockReverseOnManual)) {
                        geocodef.toAddress({
                            latLng: latLng,
                            bounds: $scope.bounds
                        }).then(function (value) {
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
    .factory('geocodef', ['$timeout', '$q', function ($timeout, $q) {
        var isMapsLoaded = function() {
            return "undefined" !== typeof google ? true : false;
        };

        var initGeocoder = function () {
            return isMapsLoaded() ? new google.maps.Geocoder() : null;
        };

        var getBoundsSquare = function(bounds) {
            if("undefined" === typeof bounds) {
                return 0;
            }

            var ltr = {
                x: bounds.getNorthEast().lat(),
                y: bounds.getNorthEast().lng()
            },
                lbl = {
                    x: bounds.getSouthWest().lat(),
                    y: bounds.getSouthWest().lng()
                };

            return (ltr.x - lbl.x) * (ltr.y - lbl.y);
        };

        //var getIslocationInsideBounds = function (location, bounds) {
        //    var btr = {
        //            x: bounds.getNorthEast().lat(),
        //            y: bounds.getNorthEast().lng()
        //        },
        //        bbl = {
        //            x: bounds.getSouthWest().lat(),
        //            y: bounds.getSouthWest().lng()
        //        },
        //        ltr = {
        //            x: location.geometry.bounds.getNorthEast().lat(),
        //            y: location.geometry.bounds.getNorthEast().lng()
        //        },
        //        lbl = {
        //            x: location.geometry.bounds.getSouthWest().lat(),
        //            y: location.geometry.bounds.getSouthWest().lng()
        //        };
        //
        //    return btr.x > ltr.x && btr.y > ltr.y && bbl.x < lbl.x && bbl.y < lbl.y;
        //};

        var geocoder = initGeocoder();
        var runGeoCoder = function (options, process, deferred) {
            var testPause = 100,
                timeoutId = -1;

            timeoutId = setInterval(function() {
                if(isMapsLoaded()) {
                    clearInterval(timeoutId);
                }

                if (null == geocoder) {
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
            }, testPause);


        };

        return {
            toLatLng: function (options) {
                var deferred = $q.defer(),
                    process = function (result, status) {
                        var value = {
                            latLng: {
                                latitude: 0,
                                longitude: 0
                            },
                            address: options.address,
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

                if (options.address) {
                    runGeoCoder({address: options.address}, process, deferred);
                } else {
                    //process(null, google.maps.GeocoderStatus.ZERO_RESULTS);
                    process(null, "ZERO_RESULTS");
                }

                return deferred.promise;
            },
            toAddress: function (options) {
                var deferred = $q.defer(),
                    process = function (result, status) {
                        switch (status) {
                            case "OK": //google.maps.GeocoderStatus.OK:
                                var address = result.length ? result[result.length - 1].formatted_address : "",
                                    findLoc = result[result.length-1],
                                    optionsSquare = 0,
                                    currentSquare = 0,
                                    i = 0;

                                for(i = result.length -1; i >=0; i--) {

                                    if(!result[i].hasOwnProperty('geometry') ||
                                        !(/(locality|administrative_area_level|country)/.test(result[i].types[0]))
                                    ) {
                                        continue;
                                    }

                                    findLoc = result[i];

                                    //if we have global bounds then select the smallest area that contains bounds
                                    //of the object we found
                                    if(options.bounds) {
                                        optionsSquare = getBoundsSquare(options.bounds);
                                        currentSquare = getBoundsSquare(result[i].geometry.bounds);

                                        //current area is smaller
                                        if(optionsSquare > currentSquare) {
                                            break;
                                        }

                                        findLoc = result[i];
                                    }
                                }

                                //take with the smallest difference
                                address = findLoc.formatted_address;

                                //find first administrative_area_level object or return last


                                if (address) {
                                    deferred.resolve({
                                        address: address,
                                        latLng: options.latLng,
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

                if (options.latLng && options.latLng.latitude && options.latLng.longitude) {
                    runGeoCoder({
                        latLng: {
                            lat: options.latLng.latitude,
                            lng: options.latLng.longitude
                        }
                    }, process, deferred);
                } else {
                    //process(null, google.maps.GeocoderStatus.ZERO_RESULTS);
                    process(null, "ZERO_RESULTS");
                }

                return deferred.promise;
            }
        };
    }]);
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
            var ne = bounds.getNorthEast();
            var sw = bounds.getSouthWest();


            var latFraction = (latRad(ne.lat()) - latRad(sw.lat())) / Math.PI;

            var lngDiff = ne.lng() - sw.lng();
            var lngFraction = ((lngDiff < 0) ? (lngDiff + 360) : lngDiff) / 360;

            var latZoom = zoom(mapDim.height, WORLD_DIM.height, latFraction);
            var lngZoom = zoom(mapDim.width, WORLD_DIM.width, lngFraction);

            return Math.min(latZoom, lngZoom, ZOOM_MAX);
        };
    }]);