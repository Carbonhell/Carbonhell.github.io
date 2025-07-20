import {data} from './tech_radar_data.js';

document.addEventListener("DOMContentLoaded", function () {
    // TODO: centralize shared code along with tech_radar_partial.js
    // Radar configuration
    const config = {
        svg_id: "radar",
        width: 800,
        height: 800,
        colors: {
            adopt: "#93c47d",
            trial: "#6fa8dc",
            assess: "#8e7cc3"
        },
        quadrants: data.quadrants,
        rings: ["assess", "trial", "adopt"]
    };

    function sanitize(text) {
        // Replaces any non-alphanumeric characters with an underscore and lowercases everything
        // If multiple underscores are found, they are replaced with a single underscore
        return text.replace(/[^a-zA-Z0-9]+/g, "_").toLowerCase();
    }
    function createRadar() {
        const svg = d3.select("#radar")
            .append("svg")
            .attr("width", config.width)
            .attr("height", config.height);

        const radius = Math.min(config.width, config.height) / 2;
        const center = {x: config.width / 2, y: config.height / 2};

        const baseLayer = svg.append("g").attr("class", "base-layer");
        const labelLayer = svg.append("g").attr("class", "label-layer");

        // Draw rings
        config.rings.forEach((ring, i) => {
            const ringRadius = radius * (1 - (i * 0.3));
            baseLayer.append("circle")
                .attr("cx", center.x)
                .attr("cy", center.y)
                .attr("r", ringRadius)
                .attr("fill", "none")
                .attr("stroke", "#999")
                .attr("stroke-width", "2");

            // Add ring labels to label layer
            labelLayer.append("text")
                .attr("x", center.x)
                .attr("y", center.y - ringRadius + 20)
                .attr("text-anchor", "middle")
                .attr("fill", "#333")
                .attr("font-size", "14px")
                .attr("font-weight", "bold")
                .attr("fill", "var(--primary-color)")
                .attr("class", "ring-label")
                .text(ring.toUpperCase());
        });

        // Draw quadrant areas and labels
        config.quadrants.forEach((quadrant, i) => {
            const angle = (i * 90 - 90) * Math.PI / 180;
            const nextAngle = ((i + 1) * 90 - 90) * Math.PI / 180;
            // TODO this is needed for the arc to properly align the clickable area with its own area - why is this off-by-one error happening though?
            const nextAngleEnd = ((i + 2) * 90 - 90) * Math.PI / 180;

            // Draw lines in base layer
            baseLayer.append("line")
                .attr("x1", center.x)
                .attr("y1", center.y)
                .attr("x2", center.x + radius * Math.cos(angle))
                .attr("y2", center.y + radius * Math.sin(angle))
                .attr("stroke", "#999")
                .attr("stroke-width", "2");

            // Draw clickable quadrant areas in base layer
            const arc = d3.arc()
                .innerRadius(0)
                .outerRadius(radius)
                .startAngle(nextAngle)
                .endAngle(nextAngleEnd);

            // Draw the ring arcs
            baseLayer.append("path")
                .attr("d", arc)
                .attr("transform", `translate(${center.x},${center.y})`)
                .attr("fill", "transparent")
                .attr("cursor", "pointer")
                .attr("class", "quadrant")
                .on("mouseover", function () {
                    d3.selectAll(".quadrant").style("fill-opacity", 0.1);
                    d3.select(this).style("fill", "#eee").style("fill-opacity", 0.3);
                })
                .on("mouseout", function () {
                    d3.selectAll(".quadrant").style("fill", "transparent").style("fill-opacity", 1);
                })
                .on("click", () => {
                    const dest = sanitize(quadrant);
                    window.location.href = `/${dest}`;
                });

            // Add quadrant labels to label layer
            const labelRadius = radius + 20;
            const labelX = center.x + labelRadius * Math.cos(angle + Math.PI / 4);
            const labelY = center.y + labelRadius * Math.sin(angle + Math.PI / 4);
            // Math.sin(angle) doesn't return exactly 0 due to float fuckery
            const labelAngle = Math.abs(Math.sin(angle)) < Number.EPSILON ? -45 : 45;
            labelLayer.append("text")
                .attr("x", labelX)
                .attr("y", labelY)
                .attr("text-anchor", "middle")
                .attr("fill", "#333")
                .attr("font-size", "16px")
                .attr("font-weight", "bold")
                .attr("fill", "var(--primary-color)")
                .attr("class", "quadrant-label")
                .attr("transform", `rotate(${labelAngle}, ${labelX}, ${labelY})`)
                .text(quadrant.toUpperCase());
        });

        // Plot points in base layer
        data.entries.forEach((entry, index) => {
            const ringIndex = config.rings.indexOf(entry.ring);
            const quadrantIndex = config.quadrants.indexOf(entry.quadrant);
            const ringRadius = radius * (1 - (ringIndex * 0.3));

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
                    // TODO also raise the draw layer in case multiple points are overlapping
                    d3.select(this).select("circle").attr("r", 15);
                })
                .on("mouseout", function () {
                    hideTooltip();
                    d3.select(this).select("circle").attr("r", 12);
                })
                .on("click", function () {
                    const dest = sanitize(entry.quadrant);
                    const anchor = sanitize(entry.name);
                    window.location.href = `/${dest}#${anchor}`;
                });

            point.append("circle")
                .attr("r", "12")
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

    createRadar();
})