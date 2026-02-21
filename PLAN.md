# BlotLab — Western Blot Densitometry

## Mission
Replace the 15-step ImageJ workflow for western blot quantification with a drag-and-drop web tool.

## Architecture
- `packages/engine/` — Image processing: rolling ball background subtraction, lane detection, band quantification
- `packages/web/` — React + Vite, canvas-based image editor with lane/band overlays
- `packages/cli/` — Node runner for batch blot processing

## MVP Features (Free Tier)
1. Upload blot image (TIFF, PNG, JPEG)
2. Auto-detect lane boundaries with manual adjustment
3. Draw band regions → automatic background subtraction (rolling ball method)
4. Output raw band intensities per lane
5. Normalize to a loading control lane (GAPDH, β-actin)
6. Bar chart of normalized band intensities
7. Export results as CSV

## Engine Tasks

### E1: Image Loading & Grayscale Conversion
- Accept TIFF, PNG, JPEG via Canvas API / OffscreenCanvas
- Convert to grayscale intensity array (0-255)
- Store as 2D float array for processing
- **Validation**: Known pixel values from test images

### E2: Rolling Ball Background Subtraction
- Implement rolling ball algorithm (same as ImageJ)
- Configurable ball radius (default 50px)
- Output: background-corrected intensity image
- **Validation**: Compare output to scikit-image rolling_ball on same input

### E3: Lane Detection
- Auto-detect vertical lane boundaries from intensity profile
- Compute vertical intensity projection (sum each column)
- Find peaks/valleys in projection to delineate lanes
- Allow manual lane boundary adjustment
- **Validation**: Test with synthetic blot images with known lane positions

### E4: Band Detection & ROI
- Within each lane, find horizontal intensity peaks (bands)
- Compute horizontal intensity profile per lane
- Define rectangular ROI around each band
- **Validation**: Test with known band positions

### E5: Densitometry (Integrated Intensity)
- Sum pixel intensities within each band ROI
- Subtract local background per band (mean of ROI border pixels)
- Output: raw integrated intensity per band per lane
- **Validation**: Manual pixel sum verification on test images

### E6: Normalization
- Designate one band row as loading control
- Divide each target band intensity by its lane's loading control intensity
- Output: normalized intensity ratios
- **Validation**: Manual calculation verification

### E7: Statistics & Export
- Compute fold change relative to control lane
- Generate bar chart data (lane labels, normalized values)
- CSV export: lane, band, raw intensity, normalized intensity, fold change

## Web UI Tasks

### W1: Image Upload & Display
- Drag-drop or file picker for blot images
- Display on HTML5 Canvas with zoom/pan
- Grayscale rendering with brightness/contrast sliders

### W2: Lane Overlay Editor
- Render lane boundaries as draggable vertical lines on canvas
- "Auto-detect lanes" button + manual adjustment
- Lane count indicator in toolbar

### W3: Band ROI Editor
- Click-drag to draw rectangular band regions within lanes
- "Auto-detect bands" button
- Visual highlighting of selected bands

### W4: Results Panel
- Table: Lane | Band | Raw Intensity | Normalized | Fold Change
- Bar chart (Recharts) of normalized intensities
- Loading control selector dropdown

### W5: Export
- Download CSV of results table
- Download bar chart as PNG/SVG
- Print-friendly results page

### W6: Toolbar & Theme
- Upload, Auto-detect, Normalize, Export buttons
- Light/dark theme toggle
- Ball radius parameter control

## Key Equations
- Rolling ball: morphological operation — erosion followed by dilation with spherical structuring element
- Background subtraction: `corrected[x,y] = original[x,y] - background[x,y]`
- Integrated intensity: `I = Σ(pixel values within ROI)`
- Normalization: `normalized = target_band_intensity / loading_control_intensity`
- Fold change: `fold = normalized_sample / normalized_control`

## Validation Strategy
- Synthetic test images with known pixel values → verify exact intensity calculations
- Real blot images processed in ImageJ → compare our output to ImageJ output
- scikit-image rolling_ball implementation as reference for background subtraction

## Tech Notes
- Image processing runs entirely client-side (Canvas API + typed arrays)
- No server needed for MVP — pure browser computation
- Large images: use Web Workers to avoid blocking UI thread
