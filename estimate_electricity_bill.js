// Customer ID
const maKhachHang = "OPS2151615A";
// Add your cookie here, get it from https://e-thanglong.vn
const cookie = ".AspNetCore.Antiforgery......";

// Get current date
let now = new Date();

// Calculate first day of current month (01/MM/YYYY)
let firstDay = new Date(now.getFullYear(), now.getMonth(), 1);

// Calculate last day of current month (using 0th day of next month trick)
let lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

// Format date as DD/MM/YYYY
function formatDate(date) {
  let d = date.getDate().toString().padStart(2, "0");
  let m = (date.getMonth() + 1).toString().padStart(2, "0");
  let y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

let ngayBatDau = formatDate(firstDay);
let ngayKetThuc = formatDate(lastDay);

// Construct URL
let url = `https://e-thanglong.vn/api/dichvuapi/getchisochitiet?maKhachHang=${encodeURIComponent(
  maKhachHang
)}&ngayBatDau=${encodeURIComponent(
  ngayBatDau
)}&ngayKetThuc=${encodeURIComponent(ngayKetThuc)}`;

// Create request
let req = new Request(url);

// Add headers
req.headers = {
  cookie,
};

// Load and log JSON response

let res = await req.loadJSON();

// Calculate metrics
let totalUsage = calculateTotalUsageKW(res.chiSoCongToAll);
let billEstimation = billEstimationCalculator(totalUsage);

// Create widget
let widget = createWidget(totalUsage, billEstimation, now.getMonth() + 1);

// Show in widget / app
if (config.runsInWidget) {
  Script.setWidget(widget);
} else {
  widget.presentSmall();
}
Script.complete();

// *********************************************************************
// ***************************** FUNCTIONS *****************************
// *********************************************************************

/**
 * @summary Create a widget with style to display
 * @param {number} totalUsage
 * @param {number} billEstimation
 * @param {number} currentMonth
 */
function createWidget(totalUsage, billEstimation, currentMonth) {
  let widget = new ListWidget();

  let col = widget.addStack();
  col.layoutVertically();
  col.addSpacer();

  // Title
  let titleRow = col.addStack();
  titleRow.layoutHorizontally();
  let title = titleRow.addText("⚡ Electricity ⚡");
  title.font = Font.semiboldSystemFont(14);
  col.addSpacer();

  // Usage
  let mothRow = col.addStack();
  mothRow.layoutHorizontally();
  let month = mothRow.addText(`Month: `);
  month.font = Font.semiboldSystemFont(12);
  let monthValue = mothRow.addText(`${currentMonth}`);
  monthValue.font = Font.regularSystemFont(12);
  col.addSpacer();

  // Usage
  let usageRow = col.addStack();
  usageRow.layoutHorizontally();
  let usage = usageRow.addText(`Usage: `);
  usage.font = Font.semiboldSystemFont(12);
  let usageValue = usageRow.addText(`${totalUsage} kW`);
  usageValue.font = Font.regularSystemFont(12);
  col.addSpacer();

  // Estimate bill
  let estimateRow = col.addStack();
  estimateRow.layoutHorizontally();
  let estimate = estimateRow.addText(`Estimate: `);
  estimate.font = Font.semiboldSystemFont(12);
  let estimateValue = estimateRow.addText(
    `${billEstimation.toLocaleString()}₫`
  );
  estimateValue.font = Font.regularSystemFont(12);

  return widget;
}

/**
 * Calculate total usage in kW
 * @param {[]Object} chiSoCongToAll
 * @returns {number} totalUsage
 */
function calculateTotalUsageKW(chiSoCongToAll) {
  let start = parseInt(chiSoCongToAll[chiSoCongToAll.length - 1].chiSo);
  let end = parseInt(chiSoCongToAll[0].chiSo);
  return end - start;
}

/**
 * @summary Calculate the estimation of the bill based on the total usage. This algorithm is extracted from e-thanglong.
 * @param {number} totalUsage total usage in kW
 * @return {number} bill estimation in VND
 */
function billEstimationCalculator(totalUsage) {
  var giaDien = [];

  var item = { bacThang: 1, dinhMuc: 50, donGia: 1984 };
  giaDien.push(item);
  item = { bacThang: 2, dinhMuc: 50, donGia: 2050 };
  giaDien.push(item);
  item = { bacThang: 3, dinhMuc: 100, donGia: 2380 };
  giaDien.push(item);
  item = { bacThang: 4, dinhMuc: 100, donGia: 2998 };
  giaDien.push(item);
  item = { bacThang: 5, dinhMuc: 100, donGia: 3350 };
  giaDien.push(item);
  item = { bacThang: 6, dinhMuc: 0, donGia: 3460 };
  giaDien.push(item);

  var soChu = totalUsage;
  var tongTien = 0.0;
  for (var i = 0; i < giaDien.length; i++) {
    if (soChu > giaDien[i].dinhMuc && giaDien[i].dinhMuc > 0) {
      soChu = soChu - giaDien[i].dinhMuc;
      tongTien += giaDien[i].dinhMuc * giaDien[i].donGia;
    } else {
      tongTien += soChu * giaDien[i].donGia;
      break;
    }
  }

  // Tax of 8%
  return tongTien + tongTien * 0.08;
}
