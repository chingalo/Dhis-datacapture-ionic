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
        var allowedFutureValue = this.getAllowedFuturePeriod(dataSet,year);
        switch(dataSet.periodType){
          case 'Monthly':
            periodSelection = this.getMonthlyPeriodSectionOptions(year,allowedFutureValue);
            break;
          case 'Quarterly':
            periodSelection = this.getQuarterlyPeriodSectionOptions(year,allowedFutureValue);
            break;
          case 'Yearly':
            periodSelection = this.getYearlyPeriodSectionOptions(year,allowedFutureValue);
            break;
          default :
            periodSelection = [];
        }
        return periodSelection;
      },
      getMonthlyPeriodSectionOptions : function(year,allowedFutureValue){
        var data = [];
        var currentYear = parseInt(new Date().getFullYear());
        var allowedFutureYear = currentYear + parseInt(allowedFutureValue/12);
        console.log(allowedFutureYear);
        if(year <= allowedFutureYear){
          for(var i=11;i >=0; i --){
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
        }
        return data;
      },
      getQuarterlyPeriodSectionOptions : function(year,allowedFutureValue){
        var data = [];
        var currentYear = parseInt(new Date().getFullYear());
        var allowedFutureYear = currentYear + parseInt(allowedFutureValue/4);
        console.log(allowedFutureYear);
        if(year <= allowedFutureYear){
          for(var i=3;i >= 0; i --){
            var quarter = i + 1;
            data.push({
              displayValue :quarterlyYearData[i] + ' ' +year ,
              periodValue : year+'Q' +quarter
            });
          }}
        return data;
      },
      getYearlyPeriodSectionOptions : function(year,allowedFutureValue){
        var data = [];
        var currentYear = parseInt(new Date().getFullYear());
        var allowedFutureYear = currentYear + parseInt(allowedFutureValue);
        console.log(allowedFutureYear);
        if(year <= allowedFutureYear){
          for(var i=0;i < 12; i ++){
            data.push({
              displayValue :year,
              periodValue : year
            });
            year--;
          }
        }
        return data;
      },
      getAllowedFuturePeriod : function(dateSet,year){
        var result = 0;
        if(dateSet.openFuturePeriods > 0){
          result = dateSet.openFuturePeriods;
        }
        return result;
      },
      // getYearAllowed

    };
    return mainServices;
  });
