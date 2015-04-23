/*global angular */
angular.module('angularGeocode')
    .directive('geocode', [function() {
        return {
            restrict: 'EA',
            scope: {
                address: '=',
                lat: '=',
                lng: '='
            },
            template: '<div></div>'
        };
    }]);