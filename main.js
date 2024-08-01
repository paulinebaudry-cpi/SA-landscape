const windowWidth = $(window).width();
const windowHeight = $(window).height();

$(window).resize(function () {
  if (
    windowWidth != $(window).width() ||
    windowHeight != $(window).height()
  ) {
    location.reload();
    return;
  }
});

let isSmallScreen = false;

if (windowWidth <= 750) {
  isSmallScreen = true;
}


const main = d3.select("body");
const scrolly = d3.selectAll(".scroller");
const figure = d3.selectAll(".chart");
const article = d3.selectAll(".scroll-graphic");
const step = d3.selectAll(".scene");

// initialize the scrollama
const scroller = scrollama();

let width = figure.node().getBoundingClientRect().width;
let height = figure.node().getBoundingClientRect().height;


let margin = {
    "top": 35,
    "left": 60,
    "bottom": 65,
    "right": 30
}

if (windowWidth <= 700) {
     margin = {
        "top": 15,
        "left": 35,
        "bottom": 25,
        "right": 10
    }
  }


//svg
const svg = d3.select("#chart1").append("svg").attr("width", width + margin.left + margin.right).attr("height", height + margin.top + margin.bottom);

const texture = textures
    .lines()
    .size(5)
    .strokeWidth(3)
    .stroke("#e9c67f");

svg.call(texture);

// barData

const barData = [{
        "category": "Net zero by 2050",
        "subcategory": "current",
        "value": 131
    }, {
        "category": "Net zero by 2050",
        "subcategory": "needs",
        "value": 203,
        "total":334
    },
    {
        "category": "NDC by 2030",
        "subcategory": "current",
        "value": 131
    },
    {
        "category": "NDC by 2030",
        "subcategory": "needs",
        "value": 404,
        "total": 535
    }
]

const currentData = barData.filter(d => d.subcategory === "current")
const needsData = barData.filter(d => d.subcategory === "needs")


// ALL STACKED BAR
const nestedData = d3.group(barData, d => d.category);

// Convert nested data into a suitable format for d3.stack
const categories = Array.from(nestedData.keys());
const subcategories = Array.from(new Set(barData.map(d => d.subcategory)));

const stackedData = categories.map(category => {
    const categoryData = nestedData.get(category);
    const result = {
        category
    };
    subcategories.forEach(subcategory => {
        const subData = categoryData.find(d => d.subcategory === subcategory);
        result[subcategory] = subData ? subData.value : 0;
    });
    return result;
});

const x = d3.scaleBand()
    .domain(categories)
    .range([0, width])
    .padding(0.6);

const y = d3.scaleLinear()
    .domain([0, d3.max(stackedData, d => d3.sum(subcategories, sub => d[sub]))])
    .nice()
    .range([height, 0]);

const color = d3.scaleOrdinal()
    .domain(subcategories)
    .range(["#496f9c", "#e9c67f"]);

const stack = d3.stack()
    .keys(subcategories)
    .value((d, key) => d[key]);

const series = stack(stackedData);


// AXES bar chart
const xAxis = d3.axisBottom(x).ticks(10);
// .tickFormat(formatYear);
const yAxis = d3.axisLeft(y).ticks(5);


// ALL area
const areaData = [{"year":2018,"value":65},{"year":2019,"value":87.9},{"year":2020,"value":139.4},{"year":2021,"value":164.5}]
const xArea = d3.scaleLinear()
    .domain([2018,2021])
    .range([0,width]);
const yArea = d3.scaleLinear()
    .domain([0, d3.max(areaData,d=>d.value)])
    .nice()
    .range([height, 0]);

const customTickFormat = (d, i) => {
            if (i === 0) return "2017/2018";
            return d.toString();
        };
const xAxisArea = d3.axisBottom(xArea).ticks(3).tickFormat(customTickFormat);
const yAxisArea = d3.axisLeft(yArea).ticks(10);

// ALL G
const g = svg.append("g").attr("id","mainG").attr("transform", `translate(${margin.left},${margin.top})`);
const gArea = svg.append("g").attr("id","areaG").attr("transform", `translate(${margin.left},${margin.top})`);
const gImage = svg.append("g");
const gText = svg.append("g").attr("id", "text").raise()
const gMap = svg.append("g");
const gAnnotations = svg.append("g").attr("id","annotationsG").attr("transform", `translate(${margin.left},${margin.top})`);



//IMAGE
gImage.append("image")
    .attr("id", "sankey")
    .style("opacity", 1)
    .attr("xlink:href", "./img/sankey.png") // Replace with your image URL
    .attr("x", isSmallScreen?"5%":0)
    .attr("y", 0)
    .attr("width", isSmallScreen?"90%":"100%")
    .attr("height", "100%")
    .attr("preserveAspectRatio", "xMidYMid meet")
    .style("opacity",1)


// MAP
const mapData = [{"region":"Central Asia and Eastern Europe","value":0.22,"lat":49,"lon":60},{"region":"East Asia and Pacific","value":1.18,"lat":0,"lon":140},{"region":"Latin America & Caribbean","value":0.23,"lat":-15,"lon":-60},{"region":"Middle East and North Africa","value":0.71,"lat":25,"lon":30},{"region":"Other Oceania","value":0.05,"lat":-15,"lon":170},{"region":"South Asia","value":0.19,"lat":20,"lon":80},{"region":"Sub-Saharan Africa","value":0.41,"lat":-5,"lon":20},{"region":"Transregional","value":0.93,"lat":-50,"lon":20},{"region":"US & Canada","value":0.78,"lat":54,"lon":-100},{"region":"Western Europe","value":7.23,"lat":50,"lon":10}]

function loadJSON(filePath) {
            const request = new XMLHttpRequest();
            request.open("GET", filePath, false); // `false` makes the request synchronous
            request.send(null); //method sends the request to the server, null is passed as an argument because GET requests do not have a body
            if (request.status === 200) {
                return JSON.parse(request.responseText);
            }
        }

const worldmap = loadJSON("./data/land.geojson");
const SAMap = loadJSON("./data/south-africa.geojson");

const projection = d3.geoNaturalEarth1()
      projection.fitSize([width, height+100], worldmap);
const path = d3.geoPath()
      .projection(projection);

const SACentroid = path.centroid(SAMap.features[0]);

const circleScale = d3.scaleLinear().domain([0.1,10]).range([5,50]);


gMap.selectAll("path.land")
            .data(worldmap.features)
            .join("path")
            .attr("d", path)
            .attr("class", "land")
            .attr("fill", "#e5e4e3")
            .style("opacity",0)

gMap.selectAll("path.SA")
            .data(SAMap.features)
            .join("path")
            .attr("d", path)
            .attr("class", "SA")
            .attr("fill", "#496f9c")
            .style("opacity",0)

gMap.selectAll("circle.mapPoints")
      .data(mapData)
      .join("circle")
      .attr("class","mapPoints")
      .attr("cx",d=>projection([+d.lon, +d.lat])[0])
      .attr("cy",d=>projection([+d.lon, +d.lat])[1])
      .attr("r", d=>circleScale(d.value))
      .attr("fill", "#7da9c9")
      .style("opacity",0)

gMap.selectAll("text.mapText")
      .data(mapData)
      .join("text")
      .attr("class","mapText")
      .attr("x",d=>projection([+d.lon, +d.lat])[0])
      .attr("y",d=>projection([+d.lon, +d.lat])[1])
      .attr("fill", "black")
      .style("font-size",14)
      .text(d=>d.region)
      .style("opacity",0)

gMap.selectAll("text.mapTextVal")
      .data(mapData)
      .join("text")
      .attr("class","mapTextVal")
      .attr("x",d=>projection([+d.lon, +d.lat])[0])
      .attr("y",d=>projection([+d.lon, +d.lat])[1]+20)
      .attr("fill", "black")
      .style("font-weight",700)
      .text(d=>d.region === "Transregional"?`${d.value} billion p.a.`:d.value)
      .style("opacity",0)


gMap.append("image")
    .attr("id", "waffle")
    .attr("xlink:href", "./img/waffle.png") // Replace with your image URL
    .attr("x", function(){
      if(windowWidth <= 550){
        return width/2+35
      }
      if(windowWidth <= 770){
        return width/2+50
      }
      return width/2+100
    })
    .attr("y", height/3+50)
    .attr("width", 200)
    .attr("height", 200)
    .attr("preserveAspectRatio", "xMidYMid meet")
    .style("opacity",0)

//AXES
g.append("g")
    .attr("class", "y-axis axis")
    .call(yAxis)
    .style("opacity",0)

g.append("g")
    .attr("class", "x-axis axis")
    .attr("transform", `translate(0,${height})`)
    .call(xAxis)
    .style("opacity",0)

g.selectAll(".x-axis").selectAll(".tick").selectAll("text").style("font-size",16)

g.append("text")
    .attr("id","unit")
    .attr("x",0)
    .attr("y",y(0)+20)
    .text("R billion p.a.")
    .style("opacity",0)


//wrap text
const wrap = (text, width) => {
    text.each(function () {
        var text = d3.select(this),
            words = text.text().split(/\s+/).reverse(),
            word,
            line = [],
            lineNumber = 0, //<-- 0!
            lineHeight = 1.1, // ems
            x = text.attr("x"), //<-- include the x!
            y = text.attr("y"),
            dy = text.attr("dy") ? text.attr("dy") : 0; //<-- null check
        tspan = text.text(null).append("tspan").attr("x", x).attr("y", y).attr("dy", dy + "em");
        while (word = words.pop()) {
            line.push(word);
            tspan.text(line.join(" "));
            if (tspan.node().getComputedTextLength() > width) {
                line.pop();
                tspan.text(line.join(" "));
                line = [word];
                tspan = text.append("tspan").attr("x", x).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
            }
        }
    });
}

gAnnotations
   .append("text")
   .attr("class","annotationText")
   .attr("x", x("NDC by 2030") + x.bandwidth() / 2 + margin.left+30)
   .attr("y", y((404)/2+131))
   .text("Investment Gap")
   .style("font-weight",700)
   .attr("fill","#e9c67f")
   .style("opacity", 0)
   .call(wrap, windowWidth <= 900?100:300);

 gAnnotations
     .append("text")
     .attr("class","annotationText")
     .attr("x", x("NDC by 2030") + x.bandwidth() / 2 + margin.left+30)
     .attr("y", y((131)/2))
     .text("Tracked")
     .style("font-weight",700)
     .attr("fill","#496f9c")
     .style("opacity", 0)

gAnnotations
    .append("text")
    .attr("class","annotationText")
    .attr("x", x("NDC by 2030") + x.bandwidth() / 2 + margin.left+30)
    .attr("y", y(404+131)-3)
    .text("Annual Estimated Needs")
    .style("font-weight",700)
    .style("opacity", 0)
    .call(wrap, windowWidth <= 900?100:300);


// DRAW AREA

gArea.append("g")
    .attr("class", "y-axis-area")
    .call(yAxisArea)
    .style("opacity",0)

gArea.append("g")
    .attr("class", "x-axis-area")
    .attr("transform", `translate(0,${height})`)
    .call(xAxisArea)
    .style("opacity",0)

gArea.selectAll(".x-axis-area").selectAll(".tick").selectAll("text").style("font-size",16)

const areaGenerator = d3.area()
        .x(d=>xArea(d.year))
        .y0(yArea(0))
        .y1(d=>yArea(d.value))


//all functions
let barCalled = false;
let bar2Called = false;
let annotationsCalled = false;

function drawBars(){
  barCalled = true;
  g.select("#unit").style("opacity", windowWidth <= 650?0:1)
  g.append("g")
      .selectAll("g.rects")
      .data(series)
      .join("g")
      .attr("class", "rects")
      .attr("fill", d => color(d.key))
      .attr("class", d => `layer layer-${d.key}`)
      .selectAll("rect")
      .data(d => d)
      .join("rect")
      .attr("x", d => x(d.data.category))
      .attr("y", height) // Initially draw all rects at the bottom
      .attr("height", 0) // with height 0
      .attr("width", x.bandwidth())
      .attr("class", "bar")
      .style("opacity", 1)

  // Initially animate only the first subcategory
  g.selectAll(".layer-current .bar")
      .style("opacity", 1)
      .transition()
      .duration(300)
      .attr("y", d => y(d[1]))
      .attr("height", d => y(d[0]) - y(d[1]))
      .on("end", function() {
          gText.selectAll("text.current")
              .data(currentData)
              .join("text")
              .attr("class", "current")
              .attr("x", d => x(d.category) + x.bandwidth() / 2 + margin.left)
              .attr("y", d => y(d.value/2)+margin.top)
              .attr("text-anchor", "middle")
              .text(d => d.value)
              .style("font-size",20)
              .style("font-weight",700)
              .attr("fill","white")
              .style("opacity", (curIndex===0 || curIndex===1)? 1:0)

      })
}


// drawBars()


function drawBars2(){

  bar2Called = true;
  g.select("#unit").style("opacity", windowWidth <= 650?0:1)
  g.selectAll(`.layer-needs .bar`)
      .attr("y", d => y(d[0])) // Set y to the base of the previous stack
      .transition()
      .duration(300)
      .attr("height", d => y(d[0]) - y(d[1])) // Animate the height
      .attr("y", d => y(d[1])) // Animate y to the correct position
      .style("stroke-dasharray", ("3, 3"))
      .attr("stroke","black")
      .attr("stroke-wdith",2)
      .attr("fill",texture.url())
      .on("end", function() {
          gText.selectAll("text.needs")
              .data(needsData)
              .join("text")
              .attr("class", "needs")
              .attr("x", d => x(d.category) + x.bandwidth() / 2 + margin.left)
              .attr("y", d => y(d.value/2+131)+margin.top)
              .attr("text-anchor", "middle")
              .text(d => d.value)
              .style("opacity", (curIndex===0 || curIndex===1)? 1:0)
              .style("font-size",20)
              .style("font-weight",700)
              .attr("fill","white")

            gText.selectAll("text.needs2")
                  .data(needsData)
                  .join("text")
                  .attr("class", "needs2")
                  .attr("x", d => x(d.category) + x.bandwidth() / 2 + margin.left)
                  .attr("y", d => y(d.total)+margin.top-3)
                  .attr("text-anchor", "middle")
                  .text(d => d.total)
                  .style("opacity", (curIndex===0 || curIndex===1)? 1:0)
                  .style("font-size",20)
                  .style("font-weight",700)
                  .attr("fill","black")
      })
}



function changeBars(opacity){
  g.selectAll("rect").style("opacity", opacity)
  g.select(".x-axis").style("opacity",opacity)
  g.select(".y-axis").style("opacity",opacity)
  g.select("#unit").style("opacity", windowWidth <= 650?0:opacity)
}

function changeArea(opacity){
  gArea.selectAll("path").style("opacity",opacity)
  gArea.selectAll(".x-axis-area").style("opacity",opacity)
  gArea.selectAll(".y-axis-area").style("opacity",opacity)
  gArea.selectAll("text").style("opacity",opacity)
}

function removeMap(){
  gMap.selectAll(".SA").style("opacity",0)
  gMap.selectAll(".land").style("opacity",0)
  gMap.selectAll(".mapText").style("opacity",0)
  gMap.selectAll(".mapTextVal").style("opacity",0)
  gMap.selectAll(".mapPoints").style("opacity",0)
  gMap.selectAll(".slice").style("opacity",0)
  gMap.select("#pieText").style("opacity",0)

}



let curIndex = 0;

// scrollama event handlers
function handleStepEnter(response) {

    if (response.index == 0) { // sankey
        curIndex = 0;
        if (response.direction == "down") {
            changeArea(0)
            changeBars(0)
        }

        if(response.direction=="up"){
          gImage.select("#sankey")
              .transition()
              .duration(300)
              .style("opacity", 1)

          d3.select("#text").selectAll("text").style("opacity", 0)
          gAnnotations.selectAll("text").style("opacity", 0)
              changeArea(0)
              changeBars(0)
        }
    }

    if (response.index == 1) {
        curIndex = 1;
        if (response.direction == "down") {

           gImage.select("#sankey")
               .transition()
               .duration(300)
               .style("opacity", 0)

           drawBars();
           changeBars(1)
           gAnnotations.selectAll("text").style("opacity", 0)

        }


        if (response.direction == "up") {
          g.selectAll(`.layer-needs .bar`)
              .attr("y", d => y(d[1])) // Set y to the base of the previous stack
              .transition()
              .duration(300)
              .attr("height", 0) // Animate the height
              .attr("y", d => y(d[0]))

          d3.select("#text").selectAll("text.needs").style("opacity", 0)
          d3.select("#text").selectAll("text.needs2").style("opacity", 0)
          gAnnotations.selectAll("text").style("opacity", 0)

        }

    }


    if (response.index == 2) {
        curIndex = 2;
        if (response.direction == "down") {

            if(!barCalled){
              drawBars()
            }

            drawBars2()
              setTimeout(function() {
                gText.selectAll("text.needs").style("opacity",1).raise()
                gText.selectAll("text.needs2").style("opacity", 1)
              }, 350);

            changeBars(1)

            gImage.select("#sankey").style("opacity", 0)
            gAnnotations.selectAll("text").style("opacity", 1)

        }

        if (response.direction == "up") {

         if(isSmallScreen){
           gText.selectAll("text.needs").style("opacity",1)
         }

          svg.selectAll("text").style("opacity", 1)
          gArea.selectAll("text").style("opacity", 0)
          g.selectAll(".tick text").style("opacity", 1)
          g.select("#unit").style("opacity", windowWidth <= 650?0:1)
          g.selectAll(".annotationText").style("opacity",0)
          gMap.select("#waffle").style("opacity",0)

          changeBars(1)
          removeMap()

        }

    }

    if (response.index == 3) {
      curIndex = 3;

        if (response.direction == "down") {
          if(!barCalled){
            drawBars()
          }

          if(!bar2Called){
            drawBars2()
          }


          g.selectAll("text").style("opacity", 1)
          gText.selectAll("text.needs2").style("opacity", 0)

          gAnnotations.selectAll("text").style("opacity", 0)
          gMap.select("#waffle").style("opacity",1)


          gMap.selectAll(".land").transition().duration(300).style("opacity",1)
          gMap.selectAll(".SA").style("opacity",1)
          gMap.selectAll(".mapText").style("opacity",0)

          changeBars(0)
          gImage.select("#sankey").style("opacity", 0)

        }

        if (response.direction == "up") {
            gMap.selectAll(".SA").style("opacity",1)
            gMap.selectAll(".mapPoints").style("opacity",0)
            gMap.selectAll(".mapText").style("opacity",0)
            gMap.selectAll(".mapTextVal").style("opacity",0)
            gMap.select("#waffle").style("opacity",1)

            gAnnotations.selectAll("text").style("opacity", 0)

        }
    }


    if (response.index == 4) { //map with circles
      curIndex = 4;

        if (response.direction == "down") {
          if(!barCalled){
            drawBars()
          }

          if(!bar2Called){
            drawBars2()
          }

          gMap.selectAll(".land").style("opacity",1)
          gMap.selectAll(".SA").style("opacity",0)
          gMap.select("#waffle").style("opacity",0)
          gMap.selectAll(".mapPoints").attr("r",0).transition().duration(500).style("opacity",1).attr("r",d=>circleScale(d.value))
          svg.selectAll("text").style("opacity",0)
          gMap.selectAll(".mapText").transition().duration(300).style("opacity",windowWidth <= 750?0:1)
          gMap.selectAll(".mapTextVal").transition().duration(300).style("opacity",1)

          changeBars(0)

          gImage.select("#sankey").style("opacity", 0)

        }

        if (response.direction == "up") {

          gMap.selectAll(".mapPoints").style("opacity",1)
          gMap.selectAll(".mapText").style("opacity",isSmallScreen?0:1)
          gMap.selectAll(".mapTextVal").style("opacity",1)
          gMap.selectAll(".land").style("opacity",1)
          gAnnotations.selectAll("text").style("opacity", 0)
          g.select("#unit").style("opacity", 0)
          gArea.selectAll(".area").style("opacity",0)

          changeArea(0)

        }
    }

    if (response.index == 5) { //area
      curIndex = 5;

      if(!barCalled){
        drawBars()
      }

      if(!bar2Called){
        drawBars2()
      }

      gImage.select("#sankey").style("opacity", 0)


      gArea.selectAll(".area").remove();
      gArea.append("path")
            .attr("class","area")
            .datum(areaData)
            .attr("fill", "#ac90a4")
            .attr("stroke", "#6d4669")
            .attr("stroke-width", 2)
            .attr("d", d3.area()
                .x(d => xArea(d.year))
                .y0(yArea(0))
                .y1(yArea(0))
            )
            .transition() // Animate the transition
            .duration(500)
            .attr("d", areaGenerator)
            .style("opacity",1)
            .on("end", function() {
              gArea.selectAll("text.area")
                    .data(areaData)
                    .join("text")
                    .attr("class","area")
                    .attr("x",(d,i)=>i===3?xArea(d.year)-10:xArea(d.year))
                    .attr("y",d=>yArea(d.value)-6)
                    .text(d=>d.value)
                    .attr("fill","black")
                    .style("opacity",1)
                    .style("font-weight",700)

              gArea.selectAll("circle.area")
                    .data(areaData)
                    .join("circle")
                    .attr("class","area")
                    .attr("cx",d=>xArea(d.year))
                    .attr("cy",d=>yArea(d.value))
                    .attr("r",5)
                    .text(d=>d.value)
                    .attr("fill","black")
                    .style("opacity",1)
                    .style("font-weight",700)
            })



        if (response.direction == "down") {

          svg.selectAll("text").style("opacity",0)
          gArea.selectAll(".area").style("opacity",0)
          removeMap()
          changeBars(0)
          changeArea(1)


        }

        if (response.direction == "up") {
          gImage.select("#sankey").style("opacity", 0)
          removeMap()
          changeArea(1)

        }
    }




}


function handleStepExit(response) {}

function init() {

    scroller
        .setup({
            step: ".scene",
            offset: 0.9,
            debug: false,
            progress: false
        })
        .onStepEnter(handleStepEnter);

}

init();
