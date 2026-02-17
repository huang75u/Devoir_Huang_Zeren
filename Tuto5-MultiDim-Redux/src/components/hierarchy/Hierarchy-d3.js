import * as d3 from 'd3'

class HierarchyD3 {
    margin = {top: 20, right: 20, bottom: 20, left: 20};
    size;
    height;
    width;
    svg;
    // visualization properties
    defaultOpacity = 0.25;  // Réduit de 0.7 à 0.25 pour plus de contraste
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
            .style("cursor", d => d.depth === 1 || d.depth === 2 ? "pointer" : "default")
            .on("click", (event, d) => {
                if (d.depth === 2) {
                    // Community node: select single community
                    controllerMethods.handleOnClick(d.data);
                } else if (d.depth === 1) {
                    // State node: select ALL communities in this state
                    const allCommunities = d.children.map(child => child.data);
                    console.log("Circle Packing: State clicked, selecting", allCommunities.length, "communities");
                    controllerMethods.handleOnStateClick(allCommunities);
                }
            })
            .on("mouseenter", (event, d) => {
                if (d.depth === 2) {
                    controllerMethods.handleOnMouseEnter(d.data);
                } else if (d.depth === 1) {
                    // Visual feedback for state hover - stronger effect
                    d3.select(event.currentTarget)
                        .style("filter", "brightness(1.3) drop-shadow(0 0 6px rgba(0, 0, 0, 0.4))")
                        .attr("stroke-width", 4);
                }
            })
            .on("mouseleave", (event, d) => {
                if (d.depth === 2) {
                    controllerMethods.handleOnMouseLeave();
                } else if (d.depth === 1) {
                    // Remove hover effect
                    d3.select(event.currentTarget)
                        .style("filter", null)
                        .attr("stroke-width", 2);
                }
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
            .style("cursor", "pointer")
            .on("click", (event, d) => {
                // Check if Ctrl/Cmd is pressed
                const isCtrlPressed = event.ctrlKey || event.metaKey;
                
                if (isCtrlPressed) {
                    // Ctrl+Click: Select all communities in this state
                    const stateData = d.parent.data;  // Parent is the state
                    const allCommunities = d.parent.children.map(child => child.data);
                    console.log("Ctrl+Click on Treemap, selecting all communities of state:", stateData.state, "count:", allCommunities.length);
                    controllerMethods.handleOnStateClick(allCommunities);
                } else {
                    // Normal click: Select single community
                    controllerMethods.handleOnClick(d.data);
                }
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

        // Add larger invisible circles for easier clicking on community nodes
        node.filter(d => d.depth === 2)
            .append("circle")
            .attr("r", 10)
            .attr("fill", "transparent")
            .attr("cursor", "pointer")
            .on("click", (event, d) => {
                controllerMethods.handleOnClick(d.data);
            })
            .on("mouseenter", (event, d) => {
                // Show label on hover
                d3.select(this.el).selectAll(".node-text")
                    .filter(td => td === d)
                    .style("opacity", 1);
                controllerMethods.handleOnMouseEnter(d.data);
            })
            .on("mouseleave", (event, d) => {
                // Hide label
                d3.select(this.el).selectAll(".node-text")
                    .filter(td => td === d && d.depth === 2)
                    .style("opacity", 0);
                controllerMethods.handleOnMouseLeave();
            });

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
            .style("opacity", this.defaultOpacity)
            .style("pointer-events", "none");

        // Add labels
        node.append("text")
            .attr("class", "node-text")
            .attr("dy", "0.31em")
            .attr("x", d => d.children ? -8 : 8)
            .attr("text-anchor", d => d.children ? "end" : "start")
            .text(d => d.data.name)
            .style("font-size", d => d.depth === 1 ? "12px" : "9px")
            .style("font-weight", d => d.depth === 1 ? "bold" : "normal")
            .style("fill", d => d.depth === 1 ? "#333" : "#666")
            .style("opacity", d => d.depth === 1 ? 1 : 0)  // Cacher les labels des communautés par défaut
            .style("pointer-events", "none");
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
                    return 6;  // Augmenté de 4 à 6 pour plus de visibilité
                }
                return d.depth === 0 ? 0 : 2;
            })
            .style("filter", d => {
                if (d.data && selectedIndices.has(d.data.index)) {
                    // Ajouter luminosité et ombre pour les sélectionnés
                    return "brightness(1.3) drop-shadow(0 0 4px rgba(0, 0, 0, 0.6))";
                }
                return null;
            });

        // For Tree layout: show labels of selected community nodes
        this.svg.selectAll(".node-text")
            .style("opacity", d => {
                // Always show state labels (depth 1)
                if (d.depth === 1) return 1;
                // Show community labels (depth 2) only if selected
                if (d.depth === 2 && d.data && selectedIndices.has(d.data.index)) {
                    return 1;
                }
                // Hide other community labels
                return d.depth === 2 ? 0 : 1;
            })
            .style("font-weight", d => {
                if (d.data && selectedIndices.has(d.data.index)) {
                    return "bold";
                }
                return d.depth === 1 ? "bold" : "normal";
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
