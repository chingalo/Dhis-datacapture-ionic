/**
 * Created by joseph on 2/4/16.
 */
angular.module('dataCapture')
  .factory('userServices',function($http,$q,$localStorage,$indexedDB){

    var userServices = {

      getAssignedOrgUnitChildrenFromServer : function(orgUnitId,baseUrl){
        var defer = $q.defer();
        $http.get(baseUrl + '/api/organisationUnits/'+orgUnitId+'.json?paging=false&fields=id,name,children[id,name,children[id,name,children[id,name,children[id,name,children[id,name]]]]]')
          .success(function(results){
            defer.resolve(results);
          })
          .error(function(){
            defer.reject();
          });

        return defer.promise;
      },
      getAssignedOrgUnitFromIndexDb : function(){
        var defer = $q.defer();
        $indexedDB.openStore('orgUnits',function(orgUnitData){
          orgUnitData.getAll().then(function(data){
            defer.resolve(data);
          },function(){
            defer.reject('error');
          });
        });

        return defer.promise;
      }
    };

    return userServices;
  });

