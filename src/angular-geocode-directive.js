/*global angular */
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

                    if (!ignoreChange.address && !_.$isEmpty(address)) {
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