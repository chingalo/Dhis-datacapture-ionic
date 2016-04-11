/**
 * Created by joseph on 2/3/16.
 */
angular.module('dataCapture')
  .factory('reportServices',function($http,$q,$localStorage,$indexedDB,sqlLiteServices){
    //var baseUrl = $localStorage.baseUrl;
    var reportServices = {
      getAllReportsFromServer:function(baseUrl){
        var defer = $q.defer();
        var fields = "fields=id,name,created,type,relativePeriods,reportParams,designContent";
        var filter = "filter=type:eq:HTML&filter=name:like:mobile";
        $http.get(baseUrl + '/api/reports.json?paging=false&'+filter+'&'+fields)
          .success(function(results){
            defer.resolve(results.reports);
          })
          .error(function(){
            defer.reject();
          });
        return defer.promise;
      },
      saveReportToIndexDb : function(report){
        sqlLiteServices.insertData("reports",report.id,report)
          .then(function(pass){
            //alert('success : ' + JSON.stringify(pass));
          },function(fail){
            //alert('Fail : ' + JSON.stringify(fail));
          });

      },
      deleteAllReports : function(){
        var defer = $q.defer();
        sqlLiteServices.dropTable('reports').then(function () {
          //success
          defer.resolve();
        }, function () {
          //error
          defer.reject();
        });
        return defer.promise;
      },
      getAllReportsFromIndexDb : function(){
        var defer = $q.defer();
        sqlLiteServices.getAllData('reports').then(function(data){
          defer.resolve(data);
        },function(){
          defer.reject('error');
        });
        return defer.promise;
      }
    };
    return reportServices;

  });
