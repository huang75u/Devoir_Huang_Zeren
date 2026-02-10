# Assignment 2 - Implementation Summary
## Interactive Data Visualizations with React and D3.js

### Project Overview
This project implements two synchronized visualizations for multivariate criminality data:
1. **Scatterplot with 2D-Brush interaction** (Left side)
2. **Hierarchical visualization** (Right side) with multiple layout options

### Data Source
- **Dataset**: `communities.csv` - Criminality dataset
- **Hierarchy levels**: State → Community
- **Key attributes**: population, medIncome, ViolentCrimesPerPop, communityname, state

---

## Implementation Details

### Step 1: Scatterplot with 2D-Brush ✅

**Location**: `src/components/scatterplot/`

**Features Implemented**:
- ✅ D3 Brush interaction for selecting multiple data points
- ✅ Rectangle selection on scatterplot
- ✅ Click interaction (single point selection)
- ✅ Clear selection button (appears when items are selected)
- ✅ Double-click background to clear selection
- ✅ Visual feedback with highlighted selected points

**Key Files**:
- `Scatterplot-d3.js`: D3 class with brush implementation
- `ScatterplotContainer.js`: React container managing state
- `Scatterplot.css`: Brush styling

**Brush Implementation**:
```javascript
// D3 Brush setup
this.brush = d3.brush()
    .extent([[0, 0], [this.width, this.height]]);

// On brush end, filter selected points
const selectedItems = visData.filter(d => {
    const x = that.xScale(d[xAttribute]);
    const y = that.yScale(d[yAttribute]);
    return x >= x0 && x <= x1 && y >= y0 && y <= y1;
});
```

**Clear Selection Methods**:
1. Click red button "Effacer la sélection (N)"
2. Double-click on scatterplot background
3. Create a new brush selection

---

### Step 2: Hierarchical Visualization ✅

**Location**: `src/components/hierarchy/`

**Features Implemented**:
- ✅ Three D3 hierarchical layouts (switchable via dropdown)
- ✅ Click interaction on nodes
- ✅ Hover interaction on nodes
- ✅ Visual encoding by population (size) and state (color)

**Key Files**:
- `Hierarchy-d3.js`: D3 class with three layout implementations
- `HierarchyContainer.js`: React container with layout switcher
- `Hierarchy.css`: Node styling

**Layout Options**:

1. **Circle Packing** (Default)
   - Nested circles representing hierarchy
   - Size = population
   - Color = state (with D3 color scheme)
   - Best for: Understanding relative sizes and hierarchical relationships

2. **Treemap**
   - Rectangular tiles
   - Size = population
   - Space-efficient layout
   - Best for: Comparing sizes efficiently

3. **Tree**
   - Traditional tree with links
   - Shows explicit parent-child relationships
   - Best for: Understanding hierarchical structure

**Data Transformation**:
```javascript
// Flat data → Hierarchical structure
const hierarchyData = {
    name: "root",
    children: Array.from(groupedByState, ([state, communities]) => ({
        name: state,
        state: state,
        children: communities.map(community => ({...}))
    }))
};
```

---

### Step 3: Synchronized Interactions ✅

**Redux State Management**: `src/redux/ItemInteractionSlice.js`

**State Variables**:
```javascript
{
    selectedItems: [],  // Array of selected data items
    hoveredItem: {}     // Single hovered data item
}
```

**Synchronization Flows**:

#### 1. Scatterplot → Hierarchy (Brush Selection)
```
User brushes scatterplot
    ↓
Brush captures selected points
    ↓
dispatch(setSelectedItems([...items]))
    ↓
Redux store updates selectedItems
    ↓
Hierarchy reads selectedItems
    ↓
Hierarchy highlights matching nodes
```

#### 2. Hierarchy → Scatterplot (Click)
```
User clicks hierarchy node
    ↓
dispatch(setSelectedItems([node.data]))
    ↓
Redux store updates selectedItems
    ↓
Scatterplot reads selectedItems
    ↓
Scatterplot highlights matching points
```

#### 3. Bidirectional Hover Highlighting
```
User hovers over hierarchy node
    ↓
dispatch(setHoveredItem(node.data))
    ↓
Redux store updates hoveredItem
    ↓
Both visualizations read hoveredItem
    ↓
Corresponding elements show golden glow effect
```

**Visual Effects**:
- **Selected items**: Red border, full opacity, stroke-width = 4
- **Hovered items**: Golden glow with drop-shadow filter
- **Normal items**: Default opacity (0.3 for scatterplot, 0.7 for hierarchy)

---

## Design Patterns Used

### React Patterns
- ✅ `useState` - For layout type selection
- ✅ `useRef` - For D3 instance and DOM references
- ✅ `useEffect` - For component lifecycle management
- ✅ `useSelector` - For reading Redux state
- ✅ `useDispatch` - For dispatching Redux actions

### D3 Patterns
- ✅ **Separation of concerns**: D3 classes separate from React components
- ✅ **Enter-Update-Exit pattern**: Using `.join()` for efficient updates
- ✅ **Scales**: `scaleLinear` for scatterplot, `scaleOrdinal` for colors
- ✅ **Layouts**: `d3.brush`, `d3.pack`, `d3.treemap`, `d3.tree`
- ✅ **Transitions**: Smooth animations with `.transition().duration()`

### Redux Patterns
- ✅ **Single source of truth**: All interaction state in one store
- ✅ **Immutable updates**: Using spread operators
- ✅ **Action creators**: Auto-generated by Redux Toolkit
- ✅ **Async data loading**: Using `createAsyncThunk` for CSV loading

---

## File Structure

```
src/
├── components/
│   ├── scatterplot/
│   │   ├── Scatterplot-d3.js          # D3 implementation
│   │   ├── ScatterplotContainer.js    # React container
│   │   └── Scatterplot.css            # Styling
│   └── hierarchy/
│       ├── Hierarchy-d3.js            # D3 implementation (3 layouts)
│       ├── HierarchyContainer.js      # React container
│       └── Hierarchy.css              # Styling
├── redux/
│   ├── DataSetSlice.js                # Data loading
│   ├── ItemInteractionSlice.js        # Selection & hover state
│   └── store.js                       # Redux store configuration
├── App.js                             # Main app component
└── App.css                            # App styling

public/
└── data/
    └── communities.csv                # Criminality dataset
```

---

## User Interactions Summary

### Left Panel (Scatterplot)
1. **Brush selection**: Drag to create a selection rectangle
2. **Click point**: Select single data point
3. **Double-click background**: Clear selection
4. **Click clear button**: Clear selection (when visible)

### Right Panel (Hierarchy)
1. **Select layout**: Choose from dropdown (Circle Packing, Treemap, Tree)
2. **Click node**: Select community (depth 2 nodes only)
3. **Hover node**: Temporarily highlight corresponding points in scatterplot

### Synchronized Behaviors
- Brushing scatterplot → Highlights hierarchy nodes
- Clicking hierarchy → Highlights scatterplot points
- Hovering hierarchy → Golden glow on both visualizations
- Clearing selection → Resets both visualizations

---

## Visual Design Rationale

### Color Encoding
- **States**: Categorical colors (D3 schemeCategory10)
- **Communities**: Lighter shade of parent state color
- **Reason**: Clear visual grouping by state, distinguishable communities

### Size Encoding
- **Metric**: Population
- **Reason**: Larger populations are easier to identify and compare

### Opacity Strategy
- **Default**: Semi-transparent (easier to see overlapping items)
- **Selected**: Full opacity (clear focus)
- **Reason**: Reduces visual clutter while maintaining focus on important items

### Interaction Feedback
- **Brush rectangle**: Blue with dashed border (standard selection UI)
- **Selected border**: Red, thick (strong visual indicator)
- **Hover effect**: Golden glow (temporary, non-intrusive highlight)
- **Reason**: Clear, conventional visual language that users understand

---

## Technical Achievements

1. ✅ **Clean separation**: React manages component lifecycle, D3 manages visualization
2. ✅ **Efficient updates**: Join pattern prevents unnecessary DOM operations
3. ✅ **Scalable state**: Redux enables easy addition of new visualizations
4. ✅ **Flexible layouts**: Easy to add new hierarchy layouts
5. ✅ **Smooth interactions**: All updates use transitions for better UX
6. ✅ **Error handling**: Proper cleanup in useEffect return functions

---

## Future Enhancements (Optional)

- Add tooltip showing detailed data on hover
- Add filtering by crime rate thresholds
- Add zoom/pan on scatterplot
- Add animation when switching hierarchy layouts
- Add ability to compare multiple selections
- Export selected data to CSV

---

## Running the Application

```bash
# Install dependencies
npm install

# Start development server
npm start

# Open browser
http://localhost:3000
```

---

## Assignment Requirements Checklist

- ✅ Two synchronized visualizations
- ✅ Scatterplot with 2D-Brush interaction
- ✅ Hierarchical visualization (state → community)
- ✅ Multiple D3 hierarchy layouts implemented (3 layouts)
- ✅ Brush selection synchronization
- ✅ Click/hover interaction synchronization
- ✅ Visual highlighting and animation
- ✅ React design patterns (useState, useRef, useEffect, useSelector, useDispatch)
- ✅ D3 classes separated from React components
- ✅ Global update pattern with join()
- ✅ Criminality dataset loaded and displayed
- ✅ User objective: Help decide where to settle (low crime areas visible)

---

## Implementation Date
February 2026

## Technologies Used
- React 18.3.1
- D3.js 7.9.0
- Redux Toolkit 2.2.7
- PapaParse 5.5.3 (CSV parsing)
