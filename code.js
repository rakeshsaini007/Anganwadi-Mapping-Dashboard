function doGet(e) {
  const udise = (e.parameter.udise || "").toString().trim();
  if (!udise) return createJsonResponse({ error: "UDISE code is missing" });

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Try to find the master sheet (Schools)
  let schoolSheet = ss.getSheetByName("Schools") || ss.getSheets()[0];
  const dataSheet = ss.getSheetByName("Data") || ss.insertSheet("Data");
  
  if (!schoolSheet) {
    return createJsonResponse({ error: "No sheet found in spreadsheet." });
  }

  const schoolData = schoolSheet.getDataRange().getValues();
  let schoolName = "";
  let foundInMaster = false;

  // Search for UDISE in column A, School Name in column B
  for (let i = 1; i < schoolData.length; i++) {
    const rowUdise = (schoolData[i][0] || "").toString().trim();
    if (rowUdise === udise) {
      schoolName = schoolData[i][1] || "Unknown School";
      foundInMaster = true;
      break;
    }
  }

  if (!foundInMaster) {
    return createJsonResponse({ 
      error: `विद्यालय कोड ${udise} रिकॉर्ड में नहीं मिला। कृपया अपनी गूगल शीट चेक करें।` 
    });
  }

  // 2. Search for existing mapping data in "Data" sheet
  let mappedData = null;
  if (dataSheet.getLastRow() > 1) {
    const existingData = dataSheet.getDataRange().getValues();
    for (let i = 1; i < existingData.length; i++) {
      if (existingData[i][0] && existingData[i][0].toString().trim() === udise) {
        mappedData = {
          isOperated: existingData[i][2],
          centerCount: existingData[i][3],
          distanceCenterCount: existingData[i][4],
          extraRoom: existingData[i][5],
          openSpace: existingData[i][6],
          buildingStatus: existingData[i][7],
          buildingStatusCount: existingData[i][8],
          lastUpdated: existingData[i][9]
        };
        break;
      }
    }
  }

  return createJsonResponse({ 
    udise: udise, 
    schoolName: schoolName,
    existingData: mappedData
  });
}

function doPost(e) {
  try {
    const params = JSON.parse(e.postData.contents);
    const udise = params.udise.toString().trim();
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("Data") || ss.insertSheet("Data");
    
    // Ensure headers exist
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "UDISE Code", 
        "School Name", 
        "विद्यालय में आंगनबाड़ी संचालित है अथवा नहीं", 
        "यदि संचालित है तो केन्द्रों की संख्या", 
        "200मी दूरी पर केन्द्रों की संख्या", 
        "अतिरिक्त कक्ष उपलब्ध है/नहीं", 
        "परिसर में खुले स्थान की उपलब्धता", 
        "भवन की स्थिति", 
        "भवन में संचालित केन्द्रों की संख्या",
        "Last Updated"
      ]);
    }
    
    const data = sheet.getDataRange().getValues();
    let rowIndex = -1;

    for (let i = 1; i < data.length; i++) {
      if (data[i][0] && data[i][0].toString().trim() === udise) {
        rowIndex = i + 1;
        break;
      }
    }

    const rowData = [
      udise,
      params.schoolName,
      params.isOperated,
      params.centerCount || "",
      params.distanceCenterCount || "",
      params.extraRoom || "",
      params.openSpace || "",
      params.buildingStatus || "",
      params.buildingStatusCount || "",
      new Date()
    ];

    let action = "saved";
    if (rowIndex > -1) {
      sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
      action = "updated";
    } else {
      sheet.appendRow(rowData);
    }
    
    return createJsonResponse({ success: true, action: action });
  } catch (err) {
    return createJsonResponse({ success: false, error: err.toString() });
  }
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
