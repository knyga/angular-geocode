# angular-geocode
AngularJS geocoding directive and provider. Allows to do forward and reverse geocoding. With google maps.
Look at example and tests.


```html
<div ng-controller="Geo">
    <input type="text" ng-model="geo.name" ng-model-options="{debounce: 1000}" coordinates="geo.latLng" address="geo.name" geocode />
    <input type="number" ng-model="geo.latLng.lat" ng-model-options="{debounce: 1000}" />
    <input type="number" ng-model="geo.latLng.lng" ng-model-options="{debounce: 1000}" />
</div>
```

```javascript
geocodef.toAddress(latLng).then(function (address) {
    $scope.address = address;
    ignoreChange.address = true;
});
```

```javascript
geocodef.toLatLng(address).then(function (latLng) {
    $scope.coordinates = latLng;
    ignoreChange.coordinates = true;
});
```
