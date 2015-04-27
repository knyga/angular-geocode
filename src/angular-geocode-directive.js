/*global angular */
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
                    isChangedManually = attrs.hasOwnProperty('changedManually'),
                    isBlockReverseOnManual = attrs.hasOwnProperty('blockManualReverse'),
                    isReverseBinding = attrs.hasOwnProperty('reverseBinding');

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