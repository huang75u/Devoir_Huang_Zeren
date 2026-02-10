import './Hierarchy.css'
import { useEffect, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux'

import HierarchyD3 from './Hierarchy-d3';
import { setSelectedItems, setHoveredItem } from '../../redux/ItemInteractionSlice'

function HierarchyContainer() {
    const visData = useSelector(state => state.dataSet);
    const selectedItems = useSelector(state => state.itemInteraction.selectedItems);
    const hoveredItem = useSelector(state => state.itemInteraction.hoveredItem);
    const dispatch = useDispatch();

    // State to manage layout type
    const [layoutType, setLayoutType] = useState('circlePacking');

    // every time the component re-render
    useEffect(() => {
        console.log("HierarchyContainer useEffect (called each time component re-renders)");
    });

    const divContainerRef = useRef(null);
    const hierarchyD3Ref = useRef(null);

    const getChartSize = function() {
        let width;
        let height;
        if (divContainerRef.current !== undefined) {
            width = divContainerRef.current.offsetWidth;
            height = divContainerRef.current.offsetHeight;
        }
        return {width: width, height: height};
    }

    // did mount - called once the component did mount
    useEffect(() => {
        console.log("HierarchyContainer useEffect [] called once the component did mount");
        const hierarchyD3 = new HierarchyD3(divContainerRef.current);
        hierarchyD3.create({size: getChartSize()});
        hierarchyD3Ref.current = hierarchyD3;
        return () => {
            // did unmount
            console.log("HierarchyContainer useEffect [] return function, called when the component did unmount...");
            const hierarchyD3 = hierarchyD3Ref.current;
            hierarchyD3.clear();
        }
    }, []);

    // did update - called each time dependencies change
    useEffect(() => {
        console.log("HierarchyContainer useEffect with dependency [visData, layoutType, dispatch]");

        const handleOnClick = function(itemData) {
            // When clicking a node, select only that item
            dispatch(setSelectedItems([itemData]));
        }

        const handleOnMouseEnter = function(itemData) {
            // Highlight on hover
            dispatch(setHoveredItem(itemData));
        }

        const handleOnMouseLeave = function() {
            // Remove hover highlight
            dispatch(setHoveredItem({}));
        }

        const controllerMethods = {
            handleOnClick,
            handleOnMouseEnter,
            handleOnMouseLeave
        }

        // get the current instance of hierarchyD3 from the Ref
        const hierarchyD3 = hierarchyD3Ref.current;
        // call renderHierarchy
        hierarchyD3.renderHierarchy(visData, layoutType, controllerMethods);
    }, [visData, layoutType, dispatch]);

    // Update highlights when selectedItems change
    useEffect(() => {
        const hierarchyD3 = hierarchyD3Ref.current;
        if (hierarchyD3) {
            hierarchyD3.highlightSelectedItems(selectedItems);
        }
    }, [selectedItems]);

    // Update highlights when hoveredItem changes
    useEffect(() => {
        const hierarchyD3 = hierarchyD3Ref.current;
        if (hierarchyD3 && hierarchyD3.highlightHoveredItem) {
            hierarchyD3.highlightHoveredItem(hoveredItem);
        }
    }, [hoveredItem]);

    // Handle layout type change
    const handleLayoutChange = (event) => {
        setLayoutType(event.target.value);
    }

    return (
        <div className="hierarchyDivContainer col2">
            <div style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                zIndex: 1000,
                background: 'white',
                padding: '5px',
                borderRadius: '5px',
                border: '1px solid #ccc'
            }}>
                <label htmlFor="layout-select" style={{marginRight: '5px', fontSize: '12px'}}>
                    Layout:
                </label>
                <select 
                    id="layout-select" 
                    value={layoutType} 
                    onChange={handleLayoutChange}
                    style={{fontSize: '12px', padding: '2px'}}
                >
                    <option value="circlePacking">Circle Packing</option>
                    <option value="treemap">Treemap</option>
                    <option value="tree">Tree</option>
                </select>
            </div>
            <div ref={divContainerRef} style={{width: '100%', height: '100%'}}>
            </div>
        </div>
    )
}

export default HierarchyContainer;
