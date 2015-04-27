/*global angular, google */
angular.module('angularGeocode')
    .factory('geocodef', ['$timeout', '$q', function ($timeout, $q) {
        var initGeocoder = function () {
            return "undefined" !== typeof google ? new google.maps.Geocoder() : null;
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
                    process(null, google.maps.GeocoderStatus.ZERO_RESULTS);
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
                                    i = 0;

                                for(i = result.length -1; i >=0; i--) {

                                    if(!result[i].hasOwnProperty('geometry')) {
                                        continue;
                                    }

                                    //if we have global bounds then select the smallest area that contains bounds
                                    //of the object we found
                                    if(options.bounds) {
                                        var optionsSquare = getBoundsSquare(options.bounds),
                                            currentSquare = getBoundsSquare(result[i].geometry.bounds);

                                        //current area is smaller
                                        if(optionsSquare > currentSquare) {
                                            break;
                                        }

                                        findLoc = result[i];
                                    } else {

                                        if(/(locality|administrative_area_level|country)/.test(result[i].types[0])) {
                                            findLoc = result[i];
                                        }
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
                    process(null, google.maps.GeocoderStatus.ZERO_RESULTS);
                }

                return deferred.promise;
            }
        };
    }]);