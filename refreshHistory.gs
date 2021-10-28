var ss = SpreadsheetApp.getActive().getSheetByName('Kopie von Umsätze und Laufzeiten');
var ethermine_dashboard = SpreadsheetApp.getActive().getSheetByName('Ethermine API Dashboards');
var cellColumnReference = 2; //Wo ist die Datum & Uhrzeit Spalte


function refreshHistory() {
    
    var cellRowReference = createTimeStamp(cellColumnReference);
    var unpaidAmount = writeUnpaidAmount(cellRowReference, cellColumnReference);
    var timeDifference = writeTimeDifference(cellRowReference, cellColumnReference);
    var ethDifference = writeETHDifference(cellRowReference, cellColumnReference, unpaidAmount);
    var ethPerHour = writeEthPerHour(cellRowReference, cellColumnReference, timeDifference, ethDifference);
    var ethPer24Hour = writeEthPer24Hour(cellRowReference, cellColumnReference, ethPerHour);
}

function createTimeStamp(cellColumnReference) {
    var timedate_now = Utilities.formatDate(new Date(), "GMT+1", "dd.MM.yyyy' 'HH:mm:ss");
    var cellRowReference = checkDates()+1;
    ss.getRange(cellRowReference, cellColumnReference).setValue(timedate_now);
    return cellRowReference;
}

function checkDates() {
    var timestamps = ss.getRange("B1:B").getValues();
    var last_stamp = timestamps.filter(String).length;
    return last_stamp;
    
}

function writeUnpaidAmount(cellRowReference, cellColumnReference) {
    var unpaidAmountEntryColumn = 24; // Y Spalte
    var unpaidAmountRowReference = getFirstEntry(ethermine_dashboard, 3, 999, unpaidAmountEntryColumn);
    while (true) {
      if (unpaidAmountRowReference != "not_found") {
        break;
      }
      var unpaidAmountRowReference = getFirstEntry(ethermine_dashboard, 3, 999, unpaidAmountEntryColumn);
    }
    
    Logger.log(unpaidAmountRowReference);
    var unpaidAmount = ethermine_dashboard.getRange(unpaidAmountRowReference, unpaidAmountEntryColumn + 1).getValue();
    Logger.log(unpaidAmount);

    var unpaidAmount = unpaidAmount / 1000000000000000000
    ss.getRange(cellRowReference, cellColumnReference +1).setValue(unpaidAmount);
    return unpaidAmount;
    
}

function getFirstEntry(ssname, start_row, search_limit, column) {
    var sheet = ssname;
    var data = sheet.getDataRange().getValues();
    for (var i = start_row; i < search_limit; i++) {
      if (data[i][column]) {   // index 2 = 3rd column = C
        return i+1;
      }
    }
    return "not_found";
}



function writeTimeDifference(cellRowReference, cellColumnReference) {
    var timestamp_new = ss.getRange(cellRowReference, cellColumnReference).getValue();
    var timestamp_old = ss.getRange(cellRowReference -1, cellColumnReference).getValue();
    var time_difference = parseFloat(Math.floor((timestamp_new - timestamp_old)))/1000/60/60;
    Logger.log(time_difference);
    ss.getRange(cellRowReference, cellColumnReference +3).setValue(time_difference);
    ss.getRange(cellRowReference, cellColumnReference +4).setValue(1);
    ss.getRange(cellRowReference, cellColumnReference +5).setValue(time_difference);
    return time_difference;
}

function writeETHDifference(cellRowReference, cellColumnReference, unpaidAmount) {
    var lastUnpaidAmount = ss.getRange(cellRowReference -1, cellColumnReference +1).getValue();
    var ethDiff = unpaidAmount - lastUnpaidAmount;
    Logger.log(ethDiff);
    ss.getRange(cellRowReference, cellColumnReference +2).setValue(ethDiff);
    return ethDiff;
}

function writeEthPerHour(cellRowReference, cellColumnReference, timeDifference, ethDifference) {
    var ethPerHour = ethDifference/timeDifference;
    ss.getRange(cellRowReference, cellColumnReference +10).setValue(ethPerHour);
    return ethPerHour;
}

function writeEthPer24Hour(cellRowReference, cellColumnReference, ethPerHour) {
    var ethPer24Hour = ethPerHour * 24;
    ss.getRange(cellRowReference, cellColumnReference +11).setValue(ethPer24Hour);
    return ethPer24Hour;
}