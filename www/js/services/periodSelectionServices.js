/**
 * Created by joseph on 2/8/16.
 */
angular.module('dataCapture')
  .factory('periodSelectionServices',function(){

    var monthlyYearData = [
      'January','February','March','April','May','June','July','August','September','October','November','December'
    ];
    var quarterlyYearData =[
      'January-March','April-June','July-September','October -December'
    ];

    var mainServices = {

      getPeriodSelections : function(year,dataSet){
        var periodSelection = [];
        switch(dataSet.periodType){
          case 'Monthly':
            periodSelection = this.getMonthlyPeriodSectionOptions(year);
            break;
          case 'Quarterly':
            periodSelection = this.getQuarterlyPeriodSectionOptions(year);
            break;
          case 'Yearly':
            periodSelection = this.getYearlyPeriodSectionOptions(year);
            break;
          default :
            periodSelection = [];
        }
        return periodSelection;
      },
      getMonthlyPeriodSectionOptions : function(year){
        var data = [];
        for(var i=11;i >0; i --){
          var month = i + 1;
          if(month > 9){
            data.push({
              displayValue :monthlyYearData[i] +' '+year,
              periodValue : year + '' +month
            });
          }else {
            data.push({
              displayValue :monthlyYearData[i] +' '+year,
              periodValue : year + '0' +month
            });
          }
        }
        return data;
      },
      getQuarterlyPeriodSectionOptions : function(year){
        var data = [];
        for(var i=3;i >= 0; i --){
          var quarter = i + 1;
          data.push({
            displayValue :quarterlyYearData[i] + ' ' +year ,
            periodValue : year+'Q' +quarter
          });
        }
        return data;
      },
      getYearlyPeriodSectionOptions : function(year){
        var data = [];
        for(var i=0;i < 12; i ++){
          data.push({
            displayValue :year,
            periodValue : year
          });
          year--;
        }
        return data;
      }

    };
    return mainServices;
  });
