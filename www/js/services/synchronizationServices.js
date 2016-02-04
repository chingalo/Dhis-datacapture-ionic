/**
 * Created by joseph on 2/4/16.
 */
angular.module('dataCapture')
  .factory('synchronizationServices',function($http,$q,$localStorage,$indexedDB,$interval){
    var syncCtr;
    var synchronizationServices = {

      startSync : function(){
        syncCtr = $interval(function () {
          console.log('call services');
        }, 600000);
      },
      stopSync : function(){
        $interval.cancel(syncCtr);
      }
    };
    return synchronizationServices;
  });
