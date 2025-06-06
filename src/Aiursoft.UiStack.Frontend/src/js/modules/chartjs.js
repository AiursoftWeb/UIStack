import Chart from "chart.js";

Chart.defaults.global.defaultFontColor = window.cssVariables.bodyColor;
Chart.defaults.global.defaultFontFamily = "'Poppins', 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif";

// Rounded corners for barcharts
Chart.elements.Rectangle.prototype.draw = function() {
  const ctx = this._chart.ctx;
  const vm = this._view;
  let left, right, top, bottom, signX, signY, borderSkipped;
  let borderWidth = vm.borderWidth;
  let cornerRadius = 10;

  if (!vm.horizontal) {
      // bar
      left = vm.x - vm.width / 2;
      right = vm.x + vm.width / 2;
      top = vm.y;
      bottom = vm.base;
      signX = 1;
      signY = bottom > top? 1: -1;
      borderSkipped = vm.borderSkipped || 'bottom';
  } else {
      // horizontal bar
      left = vm.base;
      right = vm.x;
      top = vm.y - vm.height / 2;
      bottom = vm.y + vm.height / 2;
      signX = right > left? 1: -1;
      signY = 1;
      borderSkipped = vm.borderSkipped || 'left';
  }

  // Canvas doesn't allow us to stroke inside the width so we can
  // adjust the sizes to fit if we're setting a stroke on the line
  if (borderWidth) {
      // borderWidth shold be less than bar width and bar height.
      const barSize = Math.min(Math.abs(left - right), Math.abs(top - bottom));
      borderWidth = borderWidth > barSize? barSize: borderWidth;
      const halfStroke = borderWidth / 2;
      // Adjust borderWidth when bar top position is near vm.base(zero).
      const borderLeft = left + (borderSkipped !== 'left'? halfStroke * signX: 0);
      const borderRight = right + (borderSkipped !== 'right'? -halfStroke * signX: 0);
      const borderTop = top + (borderSkipped !== 'top'? halfStroke * signY: 0);
      const borderBottom = bottom + (borderSkipped !== 'bottom'? -halfStroke * signY: 0);
      // not become a vertical line?
      if (borderLeft !== borderRight) {
          top = borderTop;
          bottom = borderBottom;
      }
      // not become a horizontal line?
      if (borderTop !== borderBottom) {
          left = borderLeft;
          right = borderRight;
      }
  }

  ctx.beginPath();
  ctx.fillStyle = vm.backgroundColor;
  ctx.strokeStyle = vm.borderColor;
  ctx.lineWidth = borderWidth;

  // Corner points, from bottom-left to bottom-right clockwise
  // | 1 2 |
  // | 0 3 |
  const corners = [
    [left, bottom],
    [left, top],
    [right, top],
    [right, bottom]
  ];

  // Find first (starting) corner with fallback to 'bottom'
  const borders = ['bottom', 'left', 'top', 'right'];
  let startCorner = borders.indexOf(borderSkipped, 0);
  if (startCorner === -1) {
    startCorner = 0;
  }

  function cornerAt(index) {
    return corners[(startCorner + index) % 4];
  }

  // Draw rectangle from 'startCorner'
  let corner = cornerAt(0);
  ctx.moveTo(corner[0], corner[1]);

  for (var i = 1; i < 4; i++) {
    corner = cornerAt(i);

    const width = corners[2][0] - corners[1][0];
    const height = corners[0][1] - corners[1][1];
    const x = corners[1][0];
    const y = corners[1][1];

    let radius = cornerRadius;

    // Fix radius being too large
    if(radius > height/2){
      radius = height/2;
    }if(radius > width/2){
      radius = width/2;
    }

    let lastVisible = 0;
    for(let findLast = 0, findLastTo = this._chart.data.datasets.length; findLast < findLastTo; findLast++) {
      if (!this._chart.getDatasetMeta(findLast).hidden) {
        lastVisible = findLast;
      }
    }

    let rounded = this._datasetIndex === lastVisible;

    if (rounded) {
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + width - radius, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      ctx.lineTo(x + width, y + height);
      ctx.lineTo(x, y + height);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
    } else {
      ctx.moveTo(x, y);
      ctx.lineTo(x + width, y);
      ctx.lineTo(x + width, y + height );
      ctx.lineTo(x , y + height);
      ctx.lineTo(x, y );
    }
  }

  ctx.fill();
  if (borderWidth) {
      ctx.stroke();
  }
};

window.Chart = Chart;