/**
 * Created by joseph on 2/3/16.
 */
angular.module('dataCapture')
  .factory('reportServices',function($http,$q,$localStorage,$indexedDB){

    var baseUrl = $localStorage.baseUrl;

    var reportServices = {
      getAllReportsFromServer:function(){
        var defer = $q.defer();
        $http.get(baseUrl + '/api/reports.json?paging=false&fields=id,name,created,type')
          .success(function(results){
            defer.resolve(results.reports);
          })
          .error(function(){
            defer.reject('error');
          });
        return defer.promise;
      },
      getIndividualReportFromServer : function(reportId){
        var defer = $q.defer();
        $http.get(baseUrl + '/api/reports/'+ reportId +'.json?fields=id,name,created,type,relativePeriods,reportParams,designContent')
          .success(function(report){
            defer.resolve(report);
          })
          .error(function(){
            defer.reject('error');
          });
        return defer.promise;
      },
      saveReportToIndexDb : function(report){
        $indexedDB.openStore('reports', function (reportData) {
          reportData.upsert(report).then(function () {
            //success
          }, function () {
            //error
          });
        })
      },
      getAllReportsFromIndexDb : function(){

        var defer = $q.defer();
        $indexedDB.openStore('reports',function(reportsData){
          reportsData.getAll().then(function(data){
            defer.resolve(data);
          },function(){
            defer.reject('error');
          });
        });
        return defer.promise;
      }
    };
    return reportServices;

  });
