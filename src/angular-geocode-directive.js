/*global angular */
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