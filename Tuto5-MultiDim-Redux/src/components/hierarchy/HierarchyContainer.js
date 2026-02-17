import './Hierarchy.css'
import { useEffect, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux'
import * as d3 from 'd3'

import HierarchyD3 from './Hierarchy-d3';
import { setSelectedItems, setHoveredItem } from '../../redux/ItemInteractionSlice'

function HierarchyContainer() {
    const visData = useSelector(state => state.dataSet);
    const selectedItems = useSelector(state => state.itemInteraction.selectedItems);
    const hoveredItem = useSelector(state => state.itemInteraction.hoveredItem);
    const dispatch = useDispatch();

    // State to manage layout type
    const [layoutType, setLayoutType] = useState('circlePacking');
    
    // Extract unique states with their colors
    const [stateList, setStateList] = useState([]);

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

    // Extract unique states when data changes
    useEffect(() => {
        if (visData && visData.length > 0) {
            // Group by state and count communities
            const stateGroups = d3.group(visData, d => d.state);
            const states = Array.from(stateGroups, ([state, communities]) => ({
                state: state,
                count: communities.length,
                communities: communities
            })).sort((a, b) => b.count - a.count);  // Sort by count descending
            
            setStateList(states);
        }
    }, [visData]);

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

        const handleOnStateClick = function(allCommunities) {
            // When clicking a state node (depth 1), select all its communities
            console.log("State clicked, selecting", allCommunities.length, "communities");
            dispatch(setSelectedItems(allCommunities));
        }

        const controllerMethods = {
            handleOnClick,
            handleOnMouseEnter,
            handleOnMouseLeave,
            handleOnStateClick
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

    // Handle state selection - select all communities in a state
    const handleStateClick = (stateData) => {
        dispatch(setSelectedItems(stateData.communities));
    }

    // Get color for state
    const getStateColor = (state) => {
        const hierarchyD3 = hierarchyD3Ref.current;
        if (hierarchyD3 && hierarchyD3.colorScale) {
            return hierarchyD3.colorScale(state);
        }
        return '#ccc';
    }

    return (
        <div className="hierarchyDivContainer col2" style={{position: 'relative'}}>
            {/* Layout Selector */}
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

            {/* State Selector - Only show for Tree layout */}
            {layoutType === 'tree' && stateList.length > 0 && (
                <div style={{
                    position: 'absolute',
                    top: '10px',
                    left: '10px',
                    width: '160px',
                    maxHeight: '80vh',
                    overflowY: 'auto',
                    zIndex: 1000,
                    background: 'rgba(255, 255, 255, 0.95)',
                    padding: '10px',
                    borderRadius: '5px',
                    border: '1px solid #ccc',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                    <div style={{
                        fontSize: '11px',
                        fontWeight: 'bold',
                        marginBottom: '8px',
                        color: '#555',
                        borderBottom: '1px solid #ddd',
                        paddingBottom: '5px'
                    }}>
                        Sélection par État
                    </div>
                    {stateList.map((stateData, index) => (
                        <div 
                            key={stateData.state}
                            onClick={() => handleStateClick(stateData)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: '6px 8px',
                                marginBottom: '4px',
                                cursor: 'pointer',
                                borderRadius: '3px',
                                border: '1px solid #e0e0e0',
                                background: '#fff',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#f5f5f5';
                                e.currentTarget.style.borderColor = '#aaa';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = '#fff';
                                e.currentTarget.style.borderColor = '#e0e0e0';
                            }}
                        >
                            <div style={{
                                width: '16px',
                                height: '16px',
                                borderRadius: '50%',
                                backgroundColor: getStateColor(stateData.state),
                                marginRight: '8px',
                                flexShrink: 0,
                                border: '2px solid #fff',
                                boxShadow: '0 0 2px rgba(0,0,0,0.3)'
                            }}></div>
                            <div style={{
                                flex: 1,
                                fontSize: '11px',
                                color: '#333'
                            }}>
                                <div style={{fontWeight: '500'}}>État {stateData.state}</div>
                                <div style={{fontSize: '9px', color: '#888'}}>
                                    {stateData.count} communautés
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Hint for Circle Packing */}
            {layoutType === 'circlePacking' && (
                <div style={{
                    position: 'absolute',
                    bottom: '10px',
                    left: '10px',
                    background: 'rgba(255, 255, 255, 0.9)',
                    padding: '8px 12px',
                    borderRadius: '5px',
                    border: '1px solid #ddd',
                    fontSize: '11px',
                    color: '#666',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                    💡 Astuce : Cliquez sur un <strong>grand cercle</strong> pour sélectionner tout l'état
                </div>
            )}

            {/* Hint for Treemap */}
            {layoutType === 'treemap' && (
                <div style={{
                    position: 'absolute',
                    bottom: '10px',
                    left: '10px',
                    background: 'rgba(255, 255, 255, 0.9)',
                    padding: '8px 12px',
                    borderRadius: '5px',
                    border: '1px solid #ddd',
                    fontSize: '11px',
                    color: '#666',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                    💡 Astuce : <strong>Ctrl+Click</strong> sur une communauté pour sélectionner tout l'état
                </div>
            )}

            <div ref={divContainerRef} style={{width: '100%', height: '100%'}}>
            </div>
        </div>
    )
}

export default HierarchyContainer;
