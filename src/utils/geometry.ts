export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
}

/**
 * Rotates a point around a center by a given angle (in degrees).
 */
export const rotatePoint = (point: Point, center: Point, angleDegrees: number): Point => {
  const angle = (angleDegrees * Math.PI) / 180;
  const sin = Math.sin(angle);
  const cos = Math.cos(angle);
  const dx = point.x - center.x;
  const dy = point.y - center.y;

  return {
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos,
  };
};

/**
 * Unrotates a point around a center by a given angle (in degrees).
 */
export const unrotatePoint = (point: Point, center: Point, angleDegrees: number): Point => {
  return rotatePoint(point, center, -angleDegrees);
};

/**
 * Calculates the new bounds of a shape after resizing from a specific handle.
 * 
 * Logic:
 * 1. Transform the mouse position into the shape's local unrotated coordinate system.
 * 2. Determine the new bounds in that local system based on the handle.
 * 3. Calculate the new center in the local system.
 * 4. Transform the new center back to the global coordinate system.
 * 5. Calculate the new top-left (x, y) from the new global center and new dimensions.
 */
export const getResizeChange = (
  shape: Rect,
  handle: string,
  mousePos: Point,
  maintainAspectRatio = false
): Rect => {
  const { x, y, width, height, rotation = 0 } = shape;
  const cx = x + width / 2;
  const cy = y + height / 2;
  
  // 1. Mouse position in local unrotated space relative to the current center
  // The 'local' system here has origin at (cx, cy)
  const localMouse = unrotatePoint(mousePos, { x: cx, y: cy }, rotation);
  const lm = { x: localMouse.x - cx, y: localMouse.y - cy };

  // Helper: bounds of the *current* shape in local space (origin at center)
  const halfW = width / 2;
  const halfH = height / 2;

  // New bounds in local space (left, top, right, bottom)
  // Initially set to current bounds
  let left = -halfW;
  let right = halfW;
  let top = -halfH;
  let bottom = halfH;

  // Update bounds based on handle
  // Note: We allow width/height to be negative during drag for flipping?
  // Standard UI usually flips the handle if you drag past the opposite side.
  // For simplicity here, we'll calculate raw L/R/T/B and normalize later.

  switch (handle) {
    case 'nw':
      left = lm.x;
      top = lm.y;
      break;
    case 'n':
      top = lm.y;
      break;
    case 'ne':
      right = lm.x;
      top = lm.y;
      break;
    case 'e':
      right = lm.x;
      break;
    case 'se':
      right = lm.x;
      bottom = lm.y;
      break;
    case 's':
      bottom = lm.y;
      break;
    case 'sw':
      left = lm.x;
      bottom = lm.y;
      break;
    case 'w':
      left = lm.x;
      break;
  }

  // Calculate new width/height and center in local space
  // We normalize so width/height are always positive (if we want that).
  // Some apps allow negative width/height to indicate flip.
  // Let's stick to positive width/height for standard shapes, but maybe negative is fine for the renderer?
  // The renderer in CanvasArea uses Math.abs mostly, but let's normalize to be clean.
  
  let newLocalL = Math.min(left, right);
  let newLocalR = Math.max(left, right);
  let newLocalT = Math.min(top, bottom);
  let newLocalB = Math.max(top, bottom);

  let newW = newLocalR - newLocalL;
  let newH = newLocalB - newLocalT;
  
  // Local Center of the NEW box relative to the OLD center
  let newLocalCx = (newLocalL + newLocalR) / 2;
  let newLocalCy = (newLocalT + newLocalB) / 2;

  // 4. Rotate new center back to global space
  // The vector (newLocalCx, newLocalCy) is from the OLD center.
  // So we rotate this vector and add to OLD global center.
  const rotatedCenterShift = rotatePoint({ x: newLocalCx, y: newLocalCy }, { x: 0, y: 0 }, rotation);
  const newGlobalCx = cx + rotatedCenterShift.x;
  const newGlobalCy = cy + rotatedCenterShift.y;

  // 5. Final x, y (top-left)
  const newX = newGlobalCx - newW / 2;
  const newY = newGlobalCy - newH / 2;

  return {
    x: newX,
    y: newY,
    width: newW,
    height: newH,
    rotation: rotation
  };
};

/**
 * Standardizes a shape so that width/height are positive.
 * If negative, adjust x/y and flip. (Not strictly needed if we use the normalize logic above)
 */
export const normalizeRect = (rect: Rect): Rect => {
  let { x, y, width, height } = rect;
  if (width < 0) {
    x += width;
    width = Math.abs(width);
  }
  if (height < 0) {
    y += height;
    height = Math.abs(height);
  }
  return { ...rect, x, y, width, height };
};
