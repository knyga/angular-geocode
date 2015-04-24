/*global angular */
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