/**
 * Created by joseph on 2/4/16.
 */
angular.module('dataCapture')
  .factory('Base64', function () {
    /* jshint ignore:start */

    var keyStr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

    return {
      encode: function (input) {
        var output = "";
        var chr1, chr2, chr3 = "";
        var enc1, enc2, enc3, enc4 = "";
        var i = 0;

        do {
          chr1 = input.charCodeAt(i++);
          chr2 = input.charCodeAt(i++);
          chr3 = input.charCodeAt(i++);

          enc1 = chr1 >> 2;
          enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
          enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
          enc4 = chr3 & 63;

          if (isNaN(chr2)) {
            enc3 = enc4 = 64;
          } else if (isNaN(chr3)) {
            enc4 = 64;
          }

          output = output +
            keyStr.charAt(enc1) +
            keyStr.charAt(enc2) +
            keyStr.charAt(enc3) +
            keyStr.charAt(enc4);
          chr1 = chr2 = chr3 = "";
          enc1 = enc2 = enc3 = enc4 = "";
        } while (i < input.length);

        return output;
      },

      decode: function (input) {
        var output = "";
        var chr1, chr2, chr3 = "";
        var enc1, enc2, enc3, enc4 = "";
        var i = 0;

        // remove all characters that are not A-Z, a-z, 0-9, +, /, or =
        var base64test = /[^A-Za-z0-9\+\/\=]/g;
        if (base64test.exec(input)) {
          window.alert("There were invalid base64 characters in the input text.\n" +
            "Valid base64 characters are A-Z, a-z, 0-9, '+', '/',and '='\n" +
            "Expect errors in decoding.");
        }
        input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

        do {
          enc1 = keyStr.indexOf(input.charAt(i++));
          enc2 = keyStr.indexOf(input.charAt(i++));
          enc3 = keyStr.indexOf(input.charAt(i++));
          enc4 = keyStr.indexOf(input.charAt(i++));

          chr1 = (enc1 << 2) | (enc2 >> 4);
          chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
          chr3 = ((enc3 & 3) << 6) | enc4;

          output = output + String.fromCharCode(chr1);

          if (enc3 != 64) {
            output = output + String.fromCharCode(chr2);
          }
          if (enc4 != 64) {
            output = output + String.fromCharCode(chr3);
          }

          chr1 = chr2 = chr3 = "";
          enc1 = enc2 = enc3 = enc4 = "";

        } while (i < input.length);

        return output;
      }
    };

    /* jshint ignore:end */
  })
  .factory('userServices', function ($http, $q, $localStorage, $indexedDB, Base64) {

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
        $indexedDB.openStore('orgUnits', function (orgUnits) {
          orgUnits.clear().then(function () {
            //success
            defer.resolve();
          }, function () {
            //error
            defer.reject();
          })
        })
        return defer.promise;
      },
      getAssignedOrgUnitFromIndexDb: function () {
        var defer = $q.defer();
        $indexedDB.openStore('orgUnits', function (orgUnitData) {
          orgUnitData.getAll().then(function (data) {
            defer.resolve(data);
          }, function () {
            defer.reject('error');
          });
        });

        return defer.promise;
      },
      updateAssignedOrgUnits: function () {
        var base = $localStorage.baseUrl;
        var orgUnits = $localStorage.loginUserData.organisationUnits;
        orgUnits.forEach(function (orgUnit) {
          this.getAssignedOrgUnitChildrenFromServer(orgUnit.id, base).then(function (data) {
            $indexedDB.openStore('dataSets', function (dataSetData) {
              dataSetData.upsert(data).then(function () {
                //success
              }, function () {
                //error
              });
            });
          })
        });
      }
    };

    return userServices;
  });

