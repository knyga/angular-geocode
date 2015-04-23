/*global describe, beforeEach, it, inject, module, angular, expect, afterEach*/
describe('Factory: AngularGeocodeForward', function () {
    var geocodeForward,
        $timeout;

    beforeEach(module('angularGeocode'));

    beforeEach(inject(function (_$timeout_, _geocodeForward_) {
        geocodeForward = _geocodeForward_;
        $timeout = _$timeout_;
    }));

    it('should return correct coordinates', function (next) {
        geocodeForward("Paris").then(function (latLng) {
            expect(latLng).toEqual({lat: 48.856614, lng: 2.3522219000000177});
            next();
        });
        var id = -1,
            rerunner = function () {
                try {
                    $timeout.flush();
                    clearInterval(id);
                } catch (e) {
                    id = setInterval(rerunner, 250);
                }
            };

        rerunner();
    });

});