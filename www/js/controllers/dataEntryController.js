/**
 * Created by joseph on 1/29/16.
 */
angular.module('dataCapture')
  .controller('dataEntryController',function($scope,$localStorage,dataSetsServices,$indexedDB){

    $scope.data = {};
    $scope.data.user = $localStorage.loginUserData;

    $scope.$watch('data.orgUnitId', function() {

      console.log($scope.data.orgUnitId);
      $indexedDB.openStore('dataSets',function(dataSetData){
        dataSetData.getAll().then(function(e){
          //success
          $scope.data.datasets = e;
        },function(){
          //error
        });
      })
    });

    /*
     *function to fetching all forms
     */
    dataSetsServices.getAllDataSetsFromServer().then(function(dataSets){

      dataSets.forEach(function(dataSet){
        dataSetsServices.getIndividualDataSetFromServer(dataSet.id).then(function(data){

          $indexedDB.openStore('dataSets',function(dataSetData){
            dataSetData.upsert(data).then(function(e){
              //success
            },function(){
              //error
            });
          })
        },function(){

          console.log('fails to load data set : ' + dataSet.id);
        });
      })
    },function(){

      console.log('fails to load all data sets');
    });



    periodOption();
    function periodOption(){
      var year = 2016;
      var period = [];

      for(var i = 0; i < 20; i ++){
        period.push({ year : year --});
      }
      $scope.data.periodOption = period;
    }

  });
