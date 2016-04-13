/**
 * Created by joseph on 2/4/16.
 */
angular.module('dataCapture')
  .factory('userServices', function ($http, $q, $localStorage,sqlLiteServices, Base64) {
    var userServices = {
      authenticateUser: function (username, password) {
        var base = $localStorage.baseUrl;
        if (base) {
          $http.defaults.headers.common.Authorization = 'Basic ' + Base64.encode(username + ':' + password);
        }
      },
      getAssignedOrgUnitChildrenFromServer: function (orgUnitId, baseUrl) {
        var defer = $q.defer();
        var fields = "fields=id,name,code,ancestors[id,name],children[id,name,code,ancestors[id,name],children[id,name,code,ancestors[id,name],children[id,name,code,ancestors[id,name],children[id,name,code,ancestors[id,name],children[id,name,code,ancestors[id,name]]]]]]";
        $http.get(baseUrl + '/api/organisationUnits/' + orgUnitId + '.json?' + fields)
          .success(function (results) {
            defer.resolve(results);
          })
          .error(function () {
            defer.reject();
          });
        return defer.promise;
      },
      getSystemInfo: function (baseUrl) {
        var defer = $q.defer();
        $http.get(baseUrl + '/api/system/info')
          .success(function (results) {
            defer.resolve(results);
          })
          .error(function () {
            defer.reject();
          });
        return defer.promise;
      },
      deleteOrgUnitFromIndexDb: function () {
        var defer = $q.defer();
        sqlLiteServices.dropTable('orgUnits').then(function () {
          //success
          defer.resolve();
        }, function () {
          //error
          defer.reject();
        });
        return defer.promise;
      },
      getAssignedOrgUnitFromIndexDb: function () {
        var defer = $q.defer();
        sqlLiteServices.getAllData('orgUnits').then(function (data) {
          defer.resolve(data);
        }, function () {
          defer.reject('error');
        });
        return defer.promise;
      }
    };

    return userServices;
  });

