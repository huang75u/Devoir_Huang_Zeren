import * as d3 from 'd3'

class HierarchyD3 {
    margin = {top: 20, right: 20, bottom: 20, left: 20};
    size;
    height;
    width;
    svg;
    // visualization properties
    defaultOpacity = 0.7;
    highlightedOpacity = 1;
    transitionDuration = 500;
    colorScale;
    
    constructor(el){
        this.el = el;
    }

    create = function (config) {
        this.size = {width: config.size.width, height: config.size.height};

        // get the effective size of the view by subtracting the margin
        this.width = this.size.width - this.margin.left - this.margin.right;
        this.height = this.size.height - this.margin.top - this.margin.bottom;

        // initialize the svg
        this.svg = d3.select(this.el).append("svg")
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.top + this.margin.bottom)
            .append("g")
            .attr("class", "hierarchySvgG")
            .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

        // Create color scale for states
        this.colorScale = d3.scaleOrdinal(d3.schemeCategory10);
    }

    // Transform flat data to hierarchical structure
    transformToHierarchy = function(data) {
        // Group data by state
        const groupedByState = d3.group(data, d => d.state);
        
        // Build hierarchy structure
        const hierarchyData = {
            name: "root",
            children: Array.from(groupedByState, ([state, communities]) => ({
                name: state,
                state: state,
                children: communities.map(community => ({
                    name: community.communityname || "Unknown",
                    state: state,
                    communityname: community.communityname,
                    population: community.population || 0,
                    medIncome: community.medIncome || 0,
                    ViolentCrimesPerPop: community.ViolentCrimesPerPop || 0,
                    index: community.index,
                    ...community
                }))
            }))
        };
        
        return hierarchyData;
    }

    // Circle Packing Layout
    renderCirclePacking = function(visData, controllerMethods) {
        console.log("Rendering Circle Packing hierarchy...");
        
        // Transform data to hierarchy
        const hierarchyData = this.transformToHierarchy(visData);
        
        // Create hierarchy
        const root = d3.hierarchy(hierarchyData)
            .sum(d => d.population || 1) // Size by population
            .sort((a, b) => b.value - a.value);

        // Create pack layout
        const pack = d3.pack()
            .size([this.width, this.height])
            .padding(3);

        pack(root);

        // Clear previous content
        this.svg.selectAll("*").remove();

        // Create groups for each node
        const node = this.svg.selectAll(".node")
            .data(root.descendants())
            .join("g")
            .attr("class", d => `node node-${d.depth}`)
            .attr("transform", d => `translate(${d.x},${d.y})`);

        // Add circles
        node.append("circle")
            .attr("class", "node-circle")
            .attr("r", d => d.r)
            .attr("fill", d => {
                if (d.depth === 0) return "#fff"; // root
                if (d.depth === 1) return this.colorScale(d.data.state); // state level
                return d3.color(this.colorScale(d.data.state)).brighter(0.5); // community level
            })
            .attr("stroke", d => {
                if (d.depth === 0) return "none";
                return d3.color(this.colorScale(d.data.state)).darker(0.5);
            })
            .attr("stroke-width", d => d.depth === 0 ? 0 : 2)
            .style("opacity", this.defaultOpacity)
            .on("click", (event, d) => {
                if (d.depth === 2) { // Only community nodes
                    controllerMethods.handleOnClick(d.data);
                }
            })
            .on("mouseenter", (event, d) => {
                if (d.depth === 2) {
                    controllerMethods.handleOnMouseEnter(d.data);
                }
            })
            .on("mouseleave", (event, d) => {
                controllerMethods.handleOnMouseLeave();
            });

        // Add background rectangles for state labels
        const stateNodes = node.filter(d => d.depth === 1 && d.r > 25);
        
        stateNodes.append("rect")
            .attr("class", "label-background")
            .attr("x", d => {
                const fontSize = Math.max(Math.min(d.r / 2.5, 24), 14);
                const textWidth = d.data.name.length * fontSize * 0.6;
                return -textWidth / 2;
            })
            .attr("y", d => {
                const fontSize = Math.max(Math.min(d.r / 2.5, 24), 14);
                return -fontSize * 0.7;
            })
            .attr("width", d => {
                const fontSize = Math.max(Math.min(d.r / 2.5, 24), 14);
                return d.data.name.length * fontSize * 0.6;
            })
            .attr("height", d => {
                const fontSize = Math.max(Math.min(d.r / 2.5, 24), 14);
                return fontSize * 1.2;
            })
            .attr("rx", 4)
            .attr("fill", "rgba(0, 0, 0, 0.7)")
            .style("pointer-events", "none");

        // Add labels for state level (depth 1)
        stateNodes.append("text")
            .attr("class", "node-label")
            .attr("text-anchor", "middle")
            .attr("dy", "0.35em")
            .text(d => d.data.name)
            .style("font-size", d => Math.max(Math.min(d.r / 2.5, 24), 14) + "px")
            .style("font-weight", "bold")
            .style("fill", "#fff")
            .style("pointer-events", "none");

        // Add background for community labels
        const communityNodes = node.filter(d => d.depth === 2 && d.r > 12);
        
        communityNodes.append("rect")
            .attr("class", "label-background")
            .attr("x", d => {
                const fontSize = Math.max(Math.min(d.r / 1.8, 12), 8);
                const textWidth = d.data.name.length * fontSize * 0.5;
                return -textWidth / 2;
            })
            .attr("y", d => {
                const fontSize = Math.max(Math.min(d.r / 1.8, 12), 8);
                return -fontSize * 0.65;
            })
            .attr("width", d => {
                const fontSize = Math.max(Math.min(d.r / 1.8, 12), 8);
                return d.data.name.length * fontSize * 0.5;
            })
            .attr("height", d => {
                const fontSize = Math.max(Math.min(d.r / 1.8, 12), 8);
                return fontSize * 1.1;
            })
            .attr("rx", 2)
            .attr("fill", "rgba(0, 0, 0, 0.6)")
            .style("pointer-events", "none");

        // Add labels for community level (depth 2)
        communityNodes.append("text")
            .attr("class", "node-text")
            .attr("text-anchor", "middle")
            .attr("dy", "0.35em")
            .text(d => d.data.name)
            .style("font-size", d => Math.max(Math.min(d.r / 1.8, 12), 8) + "px")
            .style("fill", "#fff")
            .style("pointer-events", "none");
    }

    // Treemap Layout
    renderTreemap = function(visData, controllerMethods) {
        console.log("Rendering Treemap hierarchy...");
        
        const hierarchyData = this.transformToHierarchy(visData);
        
        const root = d3.hierarchy(hierarchyData)
            .sum(d => d.population || 1)
            .sort((a, b) => b.value - a.value);

        const treemap = d3.treemap()
            .size([this.width, this.height])
            .padding(2)
            .round(true);

        treemap(root);

        // Clear previous content
        this.svg.selectAll("*").remove();

        // Create groups for leaves (communities)
        const leaf = this.svg.selectAll(".node")
            .data(root.leaves())
            .join("g")
            .attr("class", "node")
            .attr("transform", d => `translate(${d.x0},${d.y0})`);

        // Add rectangles
        leaf.append("rect")
            .attr("class", "node-rect")
            .attr("width", d => d.x1 - d.x0)
            .attr("height", d => d.y1 - d.y0)
            .attr("fill", d => this.colorScale(d.data.state))
            .attr("stroke", "#fff")
            .attr("stroke-width", 1)
            .style("opacity", this.defaultOpacity)
            .on("click", (event, d) => {
                controllerMethods.handleOnClick(d.data);
            })
            .on("mouseenter", (event, d) => {
                controllerMethods.handleOnMouseEnter(d.data);
            })
            .on("mouseleave", (event, d) => {
                controllerMethods.handleOnMouseLeave();
            });

        // Add labels
        leaf.append("text")
            .attr("class", "node-text")
            .attr("x", 3)
            .attr("y", 12)
            .text(d => {
                const width = d.x1 - d.x0;
                const height = d.y1 - d.y0;
                return width > 30 && height > 20 ? d.data.name : "";
            })
            .style("font-size", "9px")
            .style("fill", "#fff");
    }

    // Tree Layout
    renderTree = function(visData, controllerMethods) {
        console.log("Rendering Tree hierarchy...");
        
        const hierarchyData = this.transformToHierarchy(visData);
        
        const root = d3.hierarchy(hierarchyData);

        const treeLayout = d3.tree()
            .size([this.height, this.width - 160]);

        treeLayout(root);

        // Clear previous content
        this.svg.selectAll("*").remove();

        // Add links
        this.svg.selectAll(".link")
            .data(root.links())
            .join("path")
            .attr("class", "link")
            .attr("d", d3.linkHorizontal()
                .x(d => d.y)
                .y(d => d.x))
            .attr("fill", "none")
            .attr("stroke", "#ccc")
            .attr("stroke-width", 1.5);

        // Add nodes
        const node = this.svg.selectAll(".node")
            .data(root.descendants())
            .join("g")
            .attr("class", "node")
            .attr("transform", d => `translate(${d.y},${d.x})`);

        node.append("circle")
            .attr("class", "node-circle")
            .attr("r", d => d.depth === 2 ? 4 : 6)
            .attr("fill", d => {
                if (d.depth === 0) return "#999";
                if (d.depth === 1) return this.colorScale(d.data.state);
                return d3.color(this.colorScale(d.data.state)).brighter(0.5);
            })
            .attr("stroke", "#fff")
            .attr("stroke-width", 2)
            .on("click", (event, d) => {
                if (d.depth === 2) {
                    controllerMethods.handleOnClick(d.data);
                }
            })
            .on("mouseenter", (event, d) => {
                if (d.depth === 2) {
                    controllerMethods.handleOnMouseEnter(d.data);
                }
            })
            .on("mouseleave", (event, d) => {
                controllerMethods.handleOnMouseLeave();
            });

        node.append("text")
            .attr("class", "node-text")
            .attr("dy", "0.31em")
            .attr("x", d => d.children ? -8 : 8)
            .attr("text-anchor", d => d.children ? "end" : "start")
            .text(d => d.data.name)
            .style("font-size", d => d.depth === 1 ? "12px" : "9px");
    }

    // Main render function - defaults to Circle Packing
    renderHierarchy = function(visData, layoutType, controllerMethods) {
        switch(layoutType) {
            case 'treemap':
                this.renderTreemap(visData, controllerMethods);
                break;
            case 'tree':
                this.renderTree(visData, controllerMethods);
                break;
            case 'circlePacking':
            default:
                this.renderCirclePacking(visData, controllerMethods);
                break;
        }
    }

    // Highlight selected items
    highlightSelectedItems = function(selectedItems) {
        const selectedIndices = new Set(selectedItems.map(d => d.index));
        
        this.svg.selectAll(".node-circle, .node-rect")
            .style("opacity", d => {
                // For hierarchy nodes, check if they match selected items
                if (d.data && selectedIndices.has(d.data.index)) {
                    return this.highlightedOpacity;
                }
                return this.defaultOpacity;
            })
            .attr("stroke-width", d => {
                if (d.data && selectedIndices.has(d.data.index)) {
                    return 4;
                }
                return d.depth === 0 ? 0 : 2;
            });
    }

    // Highlight hovered item
    highlightHoveredItem = function(hoveredItem) {
        if (!hoveredItem || !hoveredItem.index) {
            // Remove hover highlight
            this.svg.selectAll(".node-circle, .node-rect")
                .style("filter", null);
            return;
        }

        const hoveredIndex = hoveredItem.index;
        
        this.svg.selectAll(".node-circle, .node-rect")
            .style("filter", d => {
                if (d.data && d.data.index === hoveredIndex) {
                    return "brightness(1.3) drop-shadow(0 0 8px rgba(255, 215, 0, 0.8))";
                }
                return null;
            });
    }

    clear = function() {
        d3.select(this.el).selectAll("*").remove();
    }
}

export default HierarchyD3;
