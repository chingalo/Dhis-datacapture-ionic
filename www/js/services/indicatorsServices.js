/**
 * Created by chingalo on 2/27/16.
 */
angular.module('dataCapture')
  .factory('indicatorsServices', function ($http, $q, $localStorage, sqlLiteServices) {

    var indicatorsServices = {
      getAllIndicatorsFromServer: function (baseUrl) {
        var defer = $q.defer();
        var fields = "fields=id,name,indicatorType[factor],denominatorDescription,numeratorDescription,numerator,denominator";
        $http.get(baseUrl + '/api/indicators.json?paging=false&' + fields)
          .success(function (results) {
            defer.resolve(results.indicators);
          })
          .error(function () {
            defer.reject();
          });
        return defer.promise;
      },
      saveIndicatorIntoIndexDb: function (indicator) {
        sqlLiteServices.insertData('indicators', indicator.id, indicator)
          .then(function () {
            //success
          }, function () {
            //error
          });
      }
    };

    return indicatorsServices;
  });
