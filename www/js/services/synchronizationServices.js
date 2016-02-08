/**
 * Created by joseph on 2/4/16.
 */
angular.module('dataCapture')
  .factory('synchronizationServices',function($http,$q,$localStorage,userServices,$indexedDB,$interval,dataSetsServices){
    var syncCtr,userSyncCtr;

    var synchronizationServices = {
      startSync : function(syncTime){
        if(!syncTime){
          syncTime = 60*1000;
        }
        syncCtr = $interval(function () {
          syncProcess();
        },syncTime);
      },
      stopSync : function(){
        $interval.cancel(syncCtr);
      },
      syncUserLoginData : function(user){
        var time = 1000*60*60;
        userSyncCtr = $interval(function () {
          userServices.authenticateUser(user.username,user.password);
        }, time);
      },
      stopSyncUserLoginData :function(){
        $interval.cancel(userSyncCtr);
      }
    };
    function syncProcess(){
      console.log('data sync');
      sendDataValues();
    }
    function sendDataValues(){
      console.log('send data values');
    }
    function syncAllDataProcess(){
      dataSetsServices.getAllDataSetsFromServer()
        .then(function(dataSets){
          dataSets.forEach(function(dataSet){
            dataSetsServices.getIndividualDataSetFromServer(dataSet.id,$localStorage.baseUrl).then(function (data) {
              $indexedDB.openStore('dataSets', function (dataSetData) {
                dataSetData.upsert(data).then(function () {
                  //success
                }, function () {
                  //error getting individual data set
                });
              })
            }, function () {
              //error
            });
          });
        },function(){

        });
    }
    return synchronizationServices;
  });
