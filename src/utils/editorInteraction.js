export const getSvgMousePos = (event, svgCanvas, viewBox) => {
  const rect = svgCanvas.getBoundingClientRect()
  const px = event.clientX - rect.left
  const py = event.clientY - rect.top

  return {
    x: (px / rect.width) * viewBox.width + viewBox.x,
    y: (py / rect.height) * viewBox.height + viewBox.y
  }
}

export const isLeftMouseButton = (event) => event.button === 0

export const isRapidClick = (lastClickTime, threshold = 300) =>
  Date.now() - lastClickTime < threshold
