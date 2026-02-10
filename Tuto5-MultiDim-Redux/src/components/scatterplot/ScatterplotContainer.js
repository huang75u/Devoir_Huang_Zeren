import './Scatterplot.css'
import { useEffect, useRef } from 'react';
import {useSelector, useDispatch} from 'react-redux'

import ScatterplotD3 from './Scatterplot-d3';

// TODO: import action methods from reducers
import { setSelectedItems, setHoveredItem } from '../../redux/ItemInteractionSlice'

function ScatterplotContainer({xAttributeName, yAttributeName}){
    const visData = useSelector(state =>state.dataSet)
    const selectedItems = useSelector(state => state.itemInteraction.selectedItems);
    const hoveredItem = useSelector(state => state.itemInteraction.hoveredItem);
    const dispatch = useDispatch();

    // every time the component re-render
    useEffect(()=>{
        console.log("ScatterplotContainer useEffect (called each time matrix re-renders)");
    }); // if no second parameter, useEffect is called at each re-render

    const divContainerRef=useRef(null);
    const scatterplotD3Ref = useRef(null)

    const getChartSize = function(){
        // fixed size
        // return {width:900, height:900};
        // getting size from parent item
        let width;// = 800;
        let height;// = 100;
        if(divContainerRef.current!==undefined){
            width=divContainerRef.current.offsetWidth;
            // width = '100%';
            height=divContainerRef.current.offsetHeight;
            // height = '100%';
        }
        return {width:width,height:height};
    }

    // did mount called once the component did mount
    useEffect(()=>{
        console.log("ScatterplotContainer useEffect [] called once the component did mount");
        const scatterplotD3 = new ScatterplotD3(divContainerRef.current);
        scatterplotD3.create({size:getChartSize()});
        scatterplotD3Ref.current = scatterplotD3;
        return ()=>{
            // did unmout, the return function is called once the component did unmount (removed for the screen)
            console.log("ScatterplotContainer useEffect [] return function, called when the component did unmount...");
            const scatterplotD3 = scatterplotD3Ref.current;
            scatterplotD3.clear()
        }
    },[]);// if empty array, useEffect is called after the component did mount (has been created)

    // did update, called each time dependencies change, dispatch remain stable over component cycles
    useEffect(()=>{
        console.log("ScatterplotContainer useEffect with dependency [scatterplotData, xAttribute, yAttribute, scatterplotControllerMethods], called each time scatterplotData changes...");

        const handleOnClick = function(itemData){
            dispatch(setSelectedItems([itemData]))
        }
        const handleOnMouseEnter = function(itemData){
        }
        const handleOnMouseLeave = function(){
        }
        const handleOnBrushEnd = function(selectedItemsData){
            // Dispatch the brush-selected items to Redux store
            console.log("Brush selected items:", selectedItemsData.length);
            dispatch(setSelectedItems(selectedItemsData))
        }
        
        const handleClearSelection = function(){
            // Clear selection in Redux store
            console.log("Clearing selection");
            dispatch(setSelectedItems([]))
        }

        const controllerMethods={
            handleOnClick,
            handleOnMouseEnter,
            handleOnMouseLeave,
            handleOnBrushEnd,
            handleClearSelection
        }

        // get the current instance of scatterplotD3 from the Ref...
        const scatterplotD3 = scatterplotD3Ref.current;
        // call renderScatterplot of ScatterplotD3...;
        scatterplotD3.renderScatterplot(visData, xAttributeName, yAttributeName, controllerMethods);
    },[visData, xAttributeName, yAttributeName, dispatch]);// if dependencies, useEffect is called after each data update, in our case only visData changes.

    useEffect(()=>{
        const scatterplotD3 = scatterplotD3Ref.current;
        scatterplotD3.highlightSelectedItems(selectedItems);
    },[selectedItems])

    useEffect(()=>{
        const scatterplotD3 = scatterplotD3Ref.current;
        if (scatterplotD3 && scatterplotD3.highlightHoveredItem) {
            scatterplotD3.highlightHoveredItem(hoveredItem);
        }
    },[hoveredItem])

    const handleClearButtonClick = () => {
        const scatterplotD3 = scatterplotD3Ref.current;
        if (scatterplotD3) {
            scatterplotD3.clearBrush();
        }
        dispatch(setSelectedItems([]));
    }

    return(
        <div className="scatterplotDivContainer col2" style={{position: 'relative'}}>
            {selectedItems.length > 0 && (
                <div style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    zIndex: 1000,
                    pointerEvents: 'auto'
                }}>
                    <button 
                        onClick={handleClearButtonClick}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: '#ff6b6b',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#ff5252'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = '#ff6b6b'}
                    >
                        Effacer la sélection ({selectedItems.length})
                    </button>
                </div>
            )}
            <div ref={divContainerRef} style={{width: '100%', height: '100%'}}>
            </div>
        </div>
    )
}

export default ScatterplotContainer;