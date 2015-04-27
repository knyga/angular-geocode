/*global describe, beforeEach, it, inject, module, expect, google*/
describe('Factory: AngularGeocodeForward', function () {
    var geocodef,
        $timeout,
        checkPause = 250,//ms
        runnerId = -1,
        runner = null;

    beforeEach(module('angularGeocode'));

    beforeEach(inject(function (_$timeout_, _geocodef_) {
        geocodef = _geocodef_;
        $timeout = _$timeout_;

        runnerId = -1;
        runner = function () {
                try {
                    $timeout.flush();
                    clearInterval(runnerId);
                } catch (e) {
                    runnerId = setInterval(runner, checkPause);
                }
            };
    }));

    it('should return correct coordinates', function (next) {
        geocodef.toLatLng({
            address: "Paris"
        }).then(function (value) {
            expect(value.latLng).toEqual({latitude: 48.856614, longitude: 2.3522219000000177});
            next();
        });

        runner();
    });

    it('should return correct address', function (next) {
        geocodef.toAddress({
            latLng: {latitude: 48.856614, longitude: 2.3522219000000177}
        })
            .then(function (value) {
                expect(value.address).toEqual('4th arrondissement, Paris, France');
                next();
        });

        runner();
    });



    it('should return only zone address inside bounds', function(next) {
        geocodef.toAddress({
            bounds: new google.maps.LatLngBounds(
                new google.maps.LatLng(48.81206, 2.24488),
                new google.maps.LatLng(48.90467, 2.42272)),
            latLng: {latitude: 48.856614, longitude: 2.3522219000000177}
        })
            .then(function (value) {
                expect(value.address).toEqual('4th arrondissement, Paris, France');
                next();
            });

        runner();
    });

});