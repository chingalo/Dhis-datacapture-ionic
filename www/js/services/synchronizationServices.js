/**
 * Created by joseph on 2/4/16.
 */
angular.module('dataCapture')
  .factory('synchronizationServices',function($http,$q,$localStorage,userServices,$indexedDB,$interval){
    var syncCtr,userSyncCtr;
    var synchronizationServices = {

      startSync : function(){
        syncCtr = $interval(function () {
          this.syncProcess();
        }, 600000);
      },
      stopSync : function(){
        $interval.cancel(syncCtr);
      },
      syncProcess: function(){
        console.log('data sync');
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
    return synchronizationServices;
  });
