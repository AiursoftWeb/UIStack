// Styles (required)
import '../scss/app.scss'

// Common (required)
import "./modules/bootstrap";
import "./modules/css-variables";
import "./modules/lucide";
import "./modules/sidebar";
import "./modules/theme-toggle";

// Common (optional)
import "./modules/moment";
import "./modules/dragula";
import "./modules/notyf";

// Charts (optional)
import "./modules/chartjs";
import "./modules/apexcharts";

// Forms (optional)
import "./modules/daterangepicker"; // requires jQuery
import "./modules/tempus-dominus";
import "./modules/fullcalendar";
import "./modules/mask"; // requires jQuery
import "./modules/quill";
import "./modules/select2"; // requires jQuery
import "./modules/validation"; // requires jQuery
import "./modules/wizard"; // requires jQuery

// Maps (optional)
import "./modules/vector-maps";

// Tables (optional)
import "./modules/datatables"; // requires jQuery

// Time
import UtcTime from '@aiursoft/utctime.js'
const utcTime = new UtcTime({
  disableAutoUpdate: true,
  disableAgo: true,
  onSet: function (element, date) {
    new bootstrap.Tooltip(element, {
      trigger: 'hover',
      placement: 'top',
      title: date.toLocaleString(),
    })
  },
})

// Reuse the same formatter for content loaded after the initial page render.
const timeSelector = '[data-utc-time]'
new MutationObserver(records => {
  const hasNewTimes = records.some(record =>
    record.type === 'attributes' || Array.from(record.addedNodes).some(node =>
      node.nodeType === Node.ELEMENT_NODE &&
      (node.matches(timeSelector) || node.querySelector(timeSelector))
    )
  )
  if (hasNewTimes) {
    utcTime.initTime(utcTime.defaultSettings)
  }
}).observe(document.body, {
  childList: true,
  subtree: true,
  attributes: true,
  attributeFilter: ['data-utc-time'],
})
