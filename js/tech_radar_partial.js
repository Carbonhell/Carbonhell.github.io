import {data} from './tech_radar_data.js';

document.addEventListener("DOMContentLoaded", function () {
    // Radar configuration
    const config = {
        svg_id: "radar",
        width: 400,
        height: 400,
        colors: {
            adopt: "#93c47d",
            trial: "#6fa8dc",
            assess: "#8e7cc3"
        },
        rings: ["assess", "trial", "adopt"]
    };

    function sanitize(text) {
        return text.replace(/[^a-zA-Z0-9]+/g, "_").toLowerCase();
    }

    function createSingleQuadrantRadar() {
        const svg = d3.select("#radar")
            .append("svg")
            .attr("width", config.width)
            .attr("height", config.height);
        // Math.PI / 2 <= angle <= Math.PI
        const quadrant = d3.select("#radar").attr("data-quadrant");
        const quadrant_index = data.quadrants.indexOf(quadrant);
        const angle = (quadrant_index * 90) * Math.PI / 180;
        const nextAngle = ((quadrant_index + 1) * 90) * Math.PI / 180;

        const radius = Math.min(config.width - 50, config.height - 50);
        const centerX = Math.cos(angle) <= 0 ? config.width - 35 : 35;
        const centerY = Math.sin(angle) <= 0 ? config.height - 35 : 35;
        const center = {x: centerX, y: centerY};

        const baseLayer = svg.append("g").attr("class", "base-layer");
        const labelLayer = svg.append("g").attr("class", "label-layer");

        // Create arc paths for the rings
        const arcGenerator = d3.arc()
            .innerRadius(0)
            .startAngle(angle)
            .endAngle(nextAngle);

        // Draw rings
        config.rings.forEach((ring, i) => {
            const ringRadius = radius * (1 - (i * 0.3));
            baseLayer.append("path")
                .attr("d", arcGenerator.outerRadius(ringRadius))
                .attr("transform", `translate(${center.x},${center.y})`)
                .attr("fill", "none")
                .attr("stroke", "#999")
                .attr("stroke-width", "2");

            // Add ring labels
            labelLayer.append("text")
                .attr("x", center.x)
                .attr("y", Math.sin(angle) <= 0 ? center.y - ringRadius + 20 : center.y + ringRadius - 20)
                .attr("text-anchor", "middle")
                .attr("fill", "var(--primary-color)")
                .attr("font-size", "14px")
                .attr("font-weight", "bold")
                .attr("class", "ring-label")
                .text(ring.toUpperCase());
        });

        // Add quadrant labels to label layer
        const labelRadius = radius + 20;
        const labelX = center.x + labelRadius * Math.cos(angle - Math.PI / 4);
        const labelY = center.y + labelRadius * Math.sin(angle - Math.PI / 4);
        const labelAngle = Math.abs(Math.cos(angle)) < Number.EPSILON ? -45 : 45;

        // Add quadrant label
        labelLayer.append("text")
            .attr("x", labelX)
            .attr("y", labelY)
            .attr("text-anchor", "middle")
            .attr("fill", "var(--primary-color)")
            .attr("font-size", "16px")
            .attr("font-weight", "bold")
            .attr("class", "quadrant-label")
            .attr("transform", `rotate(${labelAngle}, ${labelX}, ${labelY})`)
            .text(quadrant.toUpperCase());

        // Plot points
        const quadrantData = data.entries.filter(entry => entry.quadrant === quadrant);
        quadrantData.forEach((entry, index) => {
            const ringIndex = config.rings.indexOf(entry.ring);
            const ringRadius = radius * (1 - (ringIndex * 0.3));
            const baseSize = 12;
            const highlightedSize = 15;

            // Calculate position within the quadrant (-45° to 45°)
            const quadrantIndex = data.quadrants.indexOf(quadrant);
            const baseAngle = quadrantIndex * 90 - 45;
            const angleOffset = (index % 3) * 15 - 15;
            const angle = (baseAngle + angleOffset) * Math.PI / 180;

            const x = center.x + (ringRadius * entry.layer) * Math.cos(angle);
            const y = center.y + (ringRadius * entry.layer) * Math.sin(angle);

            const point = baseLayer.append("g")
                .attr("transform", `translate(${x},${y})`)
                .attr("cursor", "pointer")
                .on("mouseover", function (event) {
                    showTooltip(event, entry);
                    d3.select(this).select("circle").attr("r", highlightedSize);
                })
                .on("mouseout", function () {
                    hideTooltip();
                    d3.select(this).select("circle").attr("r", baseSize);
                })
                .on("click", function () {
                    const dest = sanitize(entry.quadrant);
                    const anchor = sanitize(entry.name);
                    window.location.href = `/${dest}#${anchor}`;
                });

            point.append("circle")
                .attr("r", baseSize)
                .attr("fill", config.colors[entry.ring]);

            if (entry.icon.startsWith('<svg')) {
                point.append("g")
                    .html(entry.icon)
                    .attr("transform", "translate(-8,-8)");
            } else {
                point.append("text")
                    .attr("text-anchor", "middle")
                    .attr("dy", "0.35em")
                    .text(entry.icon);
            }
        });
    }

    function showTooltip(event, entry) {
        const tooltip = d3.select(".tooltip");
        tooltip.style("opacity", 1)
            .html(`<strong>${entry.name}</strong><br>${entry.description}`)
            .style("background-color", "var(--bg-0)")
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY + 10) + "px");
    }

    function hideTooltip() {
        d3.select(".tooltip").style("opacity", 0);
    }

    createSingleQuadrantRadar();
});