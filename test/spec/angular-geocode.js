/*global describe, beforeEach, it, inject, module, expect*/
describe('Factory: AngularGeocodeForward', function () {
    var geocodef,
        $timeout,
        checkPause = 250;//ms

    beforeEach(module('angularGeocode'));

    beforeEach(inject(function (_$timeout_, _geocodef_) {
        geocodef = _geocodef_;
        $timeout = _$timeout_;
    }));

    it('should return correct coordinates', function (next) {
        geocodef.toLatLng("Paris").then(function (value) {
            expect(value.latLng).toEqual({latitude: 48.856614, longitude: 2.3522219000000177});
            next();
        });
        var id = -1,
            runner = function () {
                try {
                    $timeout.flush();
                    clearInterval(id);
                } catch (e) {
                    id = setInterval(runner, checkPause);
                }
            };

        runner();
    });

    it('should return correct address', function (next) {
        geocodef.toAddress({latitude: 48.856614, longitude: 2.3522219000000177})
            .then(function (value) {
                expect(value.address).toEqual('Paris, France');
                next();
        });
        var id = -1,
            runner = function () {
                try {
                    $timeout.flush();
                    clearInterval(id);
                } catch (e) {
                    id = setInterval(runner, checkPause);
                }
            };

        runner();
    });

});