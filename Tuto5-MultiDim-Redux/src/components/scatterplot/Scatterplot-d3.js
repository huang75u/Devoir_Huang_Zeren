import * as d3 from 'd3'
// import { getDefaultFontSize } from '../../utils/helper';

class ScatterplotD3 {
    margin = {top: 100, right: 10, bottom: 50, left: 100};
    size;
    height;
    width;
    svg;
    // add specific class properties used for the vis render/updates
    defaultOpacity=0.3;
    transitionDuration=1000;
    circleRadius = 3;
    xScale;
    yScale;
    brush;
    brushG;


    constructor(el){
        this.el=el;
    };

    create = function (config) {
        this.size = {width: config.size.width, height: config.size.height};

        // get the effect size of the view by subtracting the margin
        this.width = this.size.width - this.margin.left - this.margin.right;
        this.height = this.size.height - this.margin.top - this.margin.bottom;

        // initialize the svg and keep it in a class property to reuse it in renderScatterplot()
        this.svg=d3.select(this.el).append("svg")
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.top + this.margin.bottom)
            .append("g")
            .attr("class","svgG")
            .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");
        
        // Add a background rectangle for double-click to clear
        this.svg.append("rect")
            .attr("class", "background")
            .attr("width", this.width)
            .attr("height", this.height)
            .attr("fill", "none")
            .attr("pointer-events", "all");

        this.xScale = d3.scaleLinear().range([0,this.width]);
        this.yScale = d3.scaleLinear().range([this.height,0]);

        // build xAxisG
        this.svg.append("g")
            .attr("class","xAxisG")
            .attr("transform","translate(0,"+this.height+")")
        ;
        this.svg.append("g")
            .attr("class","yAxisG")
        ;

        // Initialize brush
        this.brush = d3.brush()
            .extent([[0, 0], [this.width, this.height]]);
        
        // Create a group for the brush
        this.brushG = this.svg.append("g")
            .attr("class", "brush");
    }

    changeBorderAndOpacity(selection, selected){
        selection.style("opacity", selected?1:this.defaultOpacity)
        ;

        selection.select(".markerCircle")
            .attr("stroke-width",selected?2:0)
        ;
    }

    updateMarkers(selection,xAttribute,yAttribute){
        // transform selection
        selection
            .transition().duration(this.transitionDuration)
            .attr("transform", (item)=>{
                // use scales to return shape position from data values
                return "translate("+this.xScale(item[xAttribute])+","+this.yScale(item[yAttribute])+")";
            })
        ;
        this.changeBorderAndOpacity(selection, false)
    }

    highlightSelectedItems(selectedItems){
        this.svg.selectAll(".markerG")
            // all elements with the class .cellG (empty the first time)
            .data(selectedItems,(itemData)=>itemData.index)
            .join(
                enter => {},
                update => {
                    this.changeBorderAndOpacity(update, true);
                },
                exit => {
                    this.changeBorderAndOpacity(exit, false);
                },
            );
        // use pattern update to change the border and opacity of objects:
        //      - call this.changeBorderAndOpacity(selection,true) for objects in selectedItems
        //      - this.changeBorderAndOpacity(selection,false) for objects not in selectedItems
    }

    setupBrush = function(visData, xAttribute, yAttribute, onBrushEnd, onClearSelection){
        const that = this;
        
        this.brush.on("end", function(event) {
            const selection = event.selection;
            
            if (!selection) {
                // If no selection (brush cleared), dispatch empty array
                onBrushEnd([]);
                return;
            }
            
            // Get the brush coordinates
            const [[x0, y0], [x1, y1]] = selection;
            
            // Find all points within the brush selection
            const selectedItems = visData.filter(d => {
                const x = that.xScale(d[xAttribute]);
                const y = that.yScale(d[yAttribute]);
                return x >= x0 && x <= x1 && y >= y0 && y <= y1;
            });
            
            // Call the callback with selected items
            onBrushEnd(selectedItems);
        });
        
        // Apply the brush to the brush group
        this.brushG.call(this.brush);

        // Add double-click to clear selection
        this.svg.select(".background")
            .on("dblclick", function() {
                // Clear the brush
                that.brushG.call(that.brush.clear);
                // Call the clear callback
                if (onClearSelection) {
                    onClearSelection();
                }
            });
    }

    // Method to clear brush selection programmatically
    clearBrush = function() {
        if (this.brushG && this.brush) {
            this.brushG.call(this.brush.clear);
        }
    }

    updateAxis = function(visData,xAttribute,yAttribute){
        // compute min max using d3.min/max(visData.map(item=>item.attribute))
        const minX = d3.min(visData.map(item=>item[xAttribute]))
        const maxX = d3.max(visData.map(item=>item[xAttribute]))
        const minY = d3.min(visData.map(item=>item[yAttribute]))
        const maxY = d3.max(visData.map(item=>item[yAttribute]))
        this.xScale.domain([minX,maxX]);
        this.yScale.domain([minY,maxY]);

        // create axis with computed scales
        // .xAxisG and .yAxisG are initialized in create() function
        this.svg.select(".xAxisG")
            .transition().duration(500)
            .call(d3.axisBottom(this.xScale))
        ;
        this.svg.select(".yAxisG")
            .transition().duration(500)
            .call(d3.axisLeft(this.yScale))
        ;
    }


    renderScatterplot = function (visData, xAttribute, yAttribute, controllerMethods){
        console.log("render scatterplot with a new data list ...")

        // build the size scales and x,y axis
        this.updateAxis(visData,xAttribute,yAttribute);

        // Setup brush if onBrushEnd callback is provided
        if (controllerMethods.handleOnBrushEnd) {
            this.setupBrush(visData, xAttribute, yAttribute, controllerMethods.handleOnBrushEnd, controllerMethods.handleClearSelection);
        }

        this.svg.selectAll(".markerG")
            // all elements with the class .cellG (empty the first time)
            .data(visData,(itemData)=>itemData.index)
            .join(
                enter=>{
                    // all data items to add:
                    // doesn’exist in the select but exist in the new array
                    const itemG=enter.append("g")
                        .attr("class","markerG")
                        .style("opacity",this.defaultOpacity)
                        .on("click", (event,itemData)=>{
                            controllerMethods.handleOnClick(itemData);
                        })
                    ;
                    // render element as child of each element "g"
                    itemG.append("circle")
                        .attr("class","markerCircle")
                        .attr("r",this.circleRadius)
                        .attr("stroke","red")
                    ;
                    this.updateMarkers(itemG,xAttribute,yAttribute);
                },
                update=>{
                    this.updateMarkers(update,xAttribute,yAttribute)
                },
                exit =>{
                    exit.remove()
                    ;
                }

            )
    }

    clear = function(){
        d3.select(this.el).selectAll("*").remove();
    }
}
export default ScatterplotD3;