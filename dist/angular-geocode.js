/*! angular-geocode - v1.0.0 - 2015-04-28
* https://github.com/knyga/angular-geocode
* Copyright (c) 2015 ; Licensed  */
angular.module('angularGeocode', []);
angular.module('angularGeocode')
    .service('GeoFunctions', [function () {
        var GeoFunctions = this;

        this.calculateLatLngBoundsSquare = function(bounds) {
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

        this.convertToLatLngBounds = function(bounds) {
            return new google.maps.LatLngBounds(
                //sw
                new google.maps.LatLng(
                    bounds.sw.latitude,
                    bounds.sw.longitude
                ),
                //ne
                new google.maps.LatLng(
                    bounds.ne.latitude,
                    bounds.ne.longitude
                )
            );
        };

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
                                            //Selects the smaller area which is contains
                                            //biggest of placed in the bounds area
                                            if(options.isTakeBigger) {
                                                if(i<result.length-1) {
                                                    i++;
                                                }

                                                findLoc = result[i];
                                            }

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
    .directive('geocode', ['$timeout', 'geocodef', function ($timeout, geocodef) {
        return {
            restrict: 'EA',
            scope: {
                address: '=?',
                coordinates: '=?',
                result: '=?',
                bounds: '=?',
                changedManually: '=?'
            },
            template: '<div></div>',
            link: function ($scope, element, attrs) {
                var ignoreChange = {
                    address: false,
                    coordinates: true
                    },
                    isBlockReverseOnManual = attrs.hasOwnProperty('blockManualReverse'),
                    isReverseBinding = attrs.hasOwnProperty('reverseBinding');

                if("undefined" === typeof $scope.changedManually) {
                    $scope.changedManually = attrs.hasOwnProperty('changedManually');
                }

                element.on('change keydown', function() {
                    $scope.changedManually = true;
                });

                //Update coordinates on address changed
                $scope.$watch('address', function (address, oldAddress) {
                    if(oldAddress && 0 < oldAddress.length && 0 === address.length) {
                        $scope.changedManually = false;
                    }

                    //if (!ignoreChange.address && ((!address && !$scope.changedManually) || (address.length > 0 && $scope.changedManually))) {
                    if (!ignoreChange.address && address && address.length > 0 && $scope.changedManually) {
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
                        !($scope.changedManually && isBlockReverseOnManual)) {
                        geocodef.toAddress({
                            latLng: latLng,
                            bounds: $scope.bounds
                        }).then(function (value) {
                            $scope.address = value.address;
                            $scope.result = value.result;
                            ignoreChange.address = true;
                            $scope.changedManually = false;
                        });
                    }
                    ignoreChange.coordinates = false;
                }, true);
            }
        };
    }]);