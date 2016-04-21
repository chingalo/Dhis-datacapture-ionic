/**
 * Created by joseph on 2/4/16.
 */
angular.module('dataCapture')
  .factory('synchronizationServices',function($http,$q,$localStorage,userServices,
                                              ionicToast,
                                              $indexedDB,$interval,dataSetsServices){
    var syncCtr,userSyncCtr;

    var synchronizationServices = {
      startSync : function(syncTime){
        if(!syncTime){
          syncTime = 1000*60;
        }
        syncCtr = $interval(function () {
          syncProcess();
        },syncTime);
      },
      stopSync : function(){
        $interval.cancel(syncCtr);
      },
      syncUserLoginData : function(user){
        var time = 1000*60;
        userSyncCtr = $interval(function () {
          userServices.authenticateUser(user.username,user.password);
        }, time);
      },
      stopSyncUserLoginData :function(){
        $interval.cancel(userSyncCtr);
      }
    };

    function syncProcess(){
      sendDataValues();
    }
    function sendDataValues(){
      dataSetsServices.getSavedDataValuesFromIndexDbForSync()
        .then(function(dataValues){
          var formattedDataValues = formatDataValues(dataValues);
          dataSetsServices.uploadDataValuesToTheServer(formattedDataValues,dataValues);
      },function(){
          //fail to get data for sync
        });
    }
    function formatDataValues(dataValues){
      var data = [];
      dataValues.forEach(function(dataValue){
        var formParameter = "de="+dataValue.de+"&pe="+dataValue.pe+"&ou="
          +dataValue.ou+"&co="+dataValue.co+"&value="+dataValue.value;

        if(dataValue.cp != null){
          formParameter = formParameter +"&cc="+dataValue.cc+"&cp="+dataValue.cp;
        }
        data.push(formParameter);
      });
      return data;
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
