/*global angular, google */
angular.module('angularGeocode')
    .directive('geocode', ['$timeout', function($timeout) {
        return {
            restrict: 'EA',
            scope: {
                address: '=',
                lat: '=',
                lng: '='
            },
            template: '<div></div>',
            link: function ($scope) {
                var geocoder = new google.maps.Geocoder();
                geocoder.geocode({ address: $scope.address }, function(result, status) {
                    switch(status) {
                        case google.maps.GeocoderStatus.OK:
                            $scope.lat = result[0].geometry.location.lat();
                            $scope.lng = result[0].geometry.location.lng();
                            break;
                        case google.maps.GeocoderStatus.ZERO_RESULTS:
                            $scope.lat = null;
                            $scope.lng = null;
                            console.log('Zero results were found for forward geocoding of "'+$scope.address+'"');
                            break;
                        case google.maps.GeocoderStatus.OVER_QUERY_LIMIT:
                            throw new Error('Over query limit');
                        case google.maps.GeocoderStatus.REQUEST_DENIED:
                            throw new Error('Request denied');
                        case google.maps.GeocoderStatus.INVALID_REQUEST:
                            throw new Error('Invalid request');
                    }

                    $scope.$apply();
                });


            }
        };
    }]);