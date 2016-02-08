/**
 * Created by joseph on 2/4/16.
 */
angular.module('dataCapture')
  .factory('synchronizationServices',function($http,$q,$localStorage,userServices,$indexedDB,$interval){
    var syncCtr,userSyncCtr;
    var syncTime = 60*1000;
    var synchronizationServices = {

      startSync : function(time){
        syncCtr = $interval(function () {
          syncProcess();
        },syncTime);
      },
      stopSync : function(){
        $interval.cancel(syncCtr);
      }
     ,
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
    }
    return synchronizationServices;
  });
