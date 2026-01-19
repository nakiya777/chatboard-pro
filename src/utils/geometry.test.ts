import { getResizeChange, rotatePoint, Rect, Point } from './geometry';

// Helper to get global coordinates of all corners
function getCorners(rect: Rect) {
    const cx = rect.x + rect.width / 2;
    const cy = rect.y + rect.height / 2;
    const rot = rect.rotation || 0;

    const corners = {
        nw: rotatePoint({ x: rect.x, y: rect.y }, { x: cx, y: cy }, rot),
        ne: rotatePoint({ x: rect.x + rect.width, y: rect.y }, { x: cx, y: cy }, rot),
        sw: rotatePoint({ x: rect.x, y: rect.y + rect.height }, { x: cx, y: cy }, rot),
        se: rotatePoint({ x: rect.x + rect.width, y: rect.y + rect.height }, { x: cx, y: cy }, rot),
    };
    return corners;
}

function dist(p1: Point, p2: Point) {
    return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
}

function assertApprox(val1: number, val2: number, msg: string) {
    if (Math.abs(val1 - val2) > 0.01) {
        console.error(`FAIL: ${msg} (Expected ${val2}, got ${val1})`);
        process.exit(1);
    } else {
        console.log(`PASS: ${msg}`);
    }
}

function runTests() {
    console.log("Running Geometry Tests...");

    // Test 1: Resize SE of rotated rect, NW should stay fixed
    {
        console.log("Test 1: Rotate 45deg, resize SE from (200,200) mouse");
        const rect: Rect = { x: 100, y: 100, width: 100, height: 100, rotation: 45 };
        const oldCorners = getCorners(rect);

        // Resize dragging SE
        const mousePos = { x: 300, y: 300 }; // Pull SE handle somewhere
        const newRect = getResizeChange(rect, 'se', mousePos);

        const newCorners = getCorners(newRect);

        // NW corner should be identical
        assertApprox(newCorners.nw.x, oldCorners.nw.x, 'NW X stays fixed');
        assertApprox(newCorners.nw.y, oldCorners.nw.y, 'NW Y stays fixed');
        
        // SE corner (handle) should match mousePos projected? 
        // Wait, mousePos is the *target* for the handle. 
        // But due to rotation, the handle moves along the local axis? 
        // If we just follow mouse, it should match mouse on the relevant axes.
        // For 'se', it matches both axes in local space.
        // So newCorners.se should be very close to mousePos IF mousePos is valid resize.
        // Actually mousePos is arbitrary. 'getResizeChange' projects mousePos onto the shape's local axes?
        // Let's check `getResizeChange` logic... 
        // It sets right/bottom to localMouse. So yes, in local space it matches.
        // So global SE should match global mousePos.
        
        assertApprox(newCorners.se.x, mousePos.x, 'SE X matches mouse');
        assertApprox(newCorners.se.y, mousePos.y, 'SE Y matches mouse');
    }

    // Test 2: Resize N of rotated rect, SW/SE segment should stay fixed?
    // Actually, if we resize N, the S side stays fixed.
    {
        console.log("Test 2: Rotate 30deg, resize N");
        const rect: Rect = { x: 100, y: 100, width: 100, height: 100, rotation: 30 };
        const oldCorners = getCorners(rect);
        
        // Drag N handle upwards
        const mousePos = { x: 150, y: 0 }; 
        const newRect = getResizeChange(rect, 'n', mousePos);
        const newCorners = getCorners(newRect);

        // SW and SE should be fixed?
        // Actually, if we pull N, the 'top' moves. The 'bottom' stays fixed.
        // So SW and SE should behave as anchors.
        
        assertApprox(newCorners.sw.x, oldCorners.sw.x, 'SW X fixed');
        assertApprox(newCorners.sw.y, oldCorners.sw.y, 'SW Y fixed');
        assertApprox(newCorners.se.x, oldCorners.se.x, 'SE X fixed');
        assertApprox(newCorners.se.y, oldCorners.se.y, 'SE Y fixed');
    }

    console.log("All Tests Passed!");
}

runTests();
