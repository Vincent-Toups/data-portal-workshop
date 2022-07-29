// d3.legend.js 
// (C) 2012 ziggy.jonsson.nyc@gmail.com
// MIT licence

(function() {
d3.legend = function(g) {
  g.each(function() {
      const g= d3.select(this);
      const items = {};
      const svg = d3.select(g.property("nearestViewportElement"));
      const legendPadding = g.attr("data-style-padding") || 5;
      const lb = g.append("rect.legend-box");
      const li = g.append("rect.legend-items");

    svg.selectAll("[data-legend]").each(function() {
        var self = d3.select(this)
        items[self.attr("data-legend")] = {
          pos : self.attr("data-legend-pos") || this.getBBox().y,
          color : self.attr("data-legend-color") != undefined ? self.attr("data-legend-color") : self.style("fill") != 'none' ? self.style("fill") : self.style("stroke") 
        }
      })

    //items = d3.entries(items).sort(function(a,b) { return a.value.pos-b.value.pos})

    
    li.selectAll("text")
        .data(items,function(d) { return d.key})
        .call(function(d) { d.enter().append("text")})
        .call(function(d) { d.exit().remove()})
        .attr("y",function(d,i) { return i+"em"})
        .attr("x","1em")
        .text(function(d) { ;return d.key})
    
    li.selectAll("circle")
        .data(items,function(d) { return d.key})
        .call(function(d) { d.enter().append("circle")})
        .call(function(d) { d.exit().remove()})
        .attr("cy",function(d,i) { return i-0.25+"em"})
        .attr("cx",0)
        .attr("r","0.4em")
        .style("fill",function(d) { console.log(d.value.color);return d.value.color})  
    
    // Reposition and resize the box
    // var lbbox = li[0][0].getBBox()  
    // lb.attr("x",(lbbox.x-legendPadding))
    //     .attr("y",(lbbox.y-legendPadding))
    //     .attr("height",(lbbox.height+2*legendPadding))
    //     .attr("width",(lbbox.width+2*legendPadding))
  })
  return g
}
})()

const in_box = (px,py,x1,y1,x2,y2) =>
      px >= x1 && px <= x2 && py <= y1 && py >= y2;
const translate = (x,y) => `translate(${x},${y})`
const max = (a,b) => Math.max(a,b);
const split = (data, mapper) => {
    const out = {};
    data.forEach(d => {
        const key = mapper(d);
        const holder = out[key] || [];
        out[key] = holder;
        holder.push(d);
    })
    return out;
}
const to_viewbox = (xmin, ymin, xmax, ymax) =>  [xmin, ymin, xmax, ymax].join(" ")
const lI = x => o => o[x];
Promise.prototype.spread = function(and_then){
    return this.then(function(a){
        return and_then.apply(this, a);
    });
}
const numerify = row => {
    Object.keys(row).forEach(k => {
        const nif = +row[k];
        if(!isNaN(nif)){
            row[k] = nif;
        }
    });
    return row;
}
const inside_out = (data) => {
    const keys = Object.keys(data[0]);
    const out = {};
    keys.forEach(k => out[k] = []);
    data.forEach(d => keys.forEach( k => out[k].push(d[k])))
    return out;
}

const outside_in = (data) => {
    const keys = Object.keys(data);
    const out = [];
    const n = data[keys[0]].length;
    for(let i = 0; i < n; i++){
        let element = {};
        keys.forEach(k => element[k] = data[k][i]);
        out.push(element);
    }
    return out;
}

const amin = a => a.reduce((a,b) => Math.min(a,b),Infinity)
const amax = a => a.reduce((a,b) => Math.max(a,b),-Infinity)

const setup_axes = (svg_element, data, x, y, margin) => {
    const id = svg_element.attr("id");
    const width = svg_element.node().clientWidth;
    const height = svg_element.node().clientHeight;
    const {top, right, bottom, left} = margin;

    const x_scale = d3.scaleLinear()
          .domain(d3.extent(data, lI(x)))
          .nice()
          .range([left, width-right]);
    const y_scale = d3.scaleLinear()
          .domain([0, d3.extent(data, lI(y))[1]])
          .nice()
          .range([height-bottom, top]);

    svg_element
        .attr("viewBox", to_viewbox(0,0,width,height))
        .append("g")
        .attr("id",`${id}_x`)
        .attr("transform",`translate(0, ${height-bottom})`)
        .call(d3.axisBottom(x_scale));

    svg_element
        .append("g")
        .attr("id",`${id}_y`)
        .attr("transform", `translate(${left}, 0)`)
        .call(d3.axisLeft(y_scale));

    svg_element.x_scale = x_scale;
    svg_element.y_scale = y_scale;
    
    return svg_element;
}

const mean_and_sd = (data, key) => {
    let n = 0;
    let sq_sum = 0;
    let sum = 0;
    const out = {};
    const mean_key = `${key}_mean`;
    const sd_key = `${key}_sd`;
    data.forEach((d) => {
        const x = d[key];
        if(d.selected){
            sum += x;
            sq_sum += x*x;
            n = n + 1;
        }
    });
    if(n===0){
        out[mean_key] = NaN;
        out[sd_key] = NaN;
    } else {
        const mean = sum/n;
        out[mean_key] = mean;
        out[sd_key] = Math.sqrt(sq_sum/n - mean*mean);
    }    
    return out;
}

const draw_ae_points = (svg_element, data, x_scale, y_scale, x, y) => {
    svg_element
        .selectAll("circle")
        .data(data)
        .join("circle")
        .attr("transform", d => `translate(${x_scale(d.AE1)},${y_scale(d.AE2)})`)
        .attr("r",3)
        .attr("stroke", d => d.selected ? "black" : "grey")
        .attr("fill", d => d3.schemeCategory10[d.cluster+4]);
}

const group_name = key => ["PRT","Saline","SOC"][key-1];
const group_name_to_color = gn => ({"PRT":"red","Saline":"green","SOC":"blue"})[gn];
const group_name_to_fill_color = gn => ({
    "PRT":"rgba(255,0,0,0.2)",
    "Saline":"rgba(0,255,0,0.2)",
    "SOC":"rgba(0,0,255,0.2)"
})[gn];

const draw_outcomes = (svg_element, data, x_scale, y_scale, x, y, y_err) => {
    const rev_path = ln => ln.split(" ").reverse().join(" ")
    const to_points = path => path.replaceAll("M"," ").replaceAll("L"," ").trim();
    const stats = split(digest_outcomes(data), d => group_name(d.group));
    const line_f = d3.line()
          .x(d => x_scale(d[x]))
          .y(d => y_scale(d[y]));
    const build_path = data => {
        const top = [];
        const bottom = [];
        const n = data.length;
        for(let i = 0, j = n-1; i < n; i++, j--){
            top.push(`${x_scale(data[i][x])},${y_scale(data[i][y] + data[i][y_err]/2)}`)
            bottom.push(`${x_scale(data[j][x])},${y_scale(data[j][y] - data[j][y_err]/2)}`)
        }
        return [top.join(" "),bottom.join(" ")].join(" ");
    };    
    Object.keys(stats).forEach(k => {
        const sub_data = stats[k];
        const line = line_f(sub_data);
        const path = build_path(sub_data);
        const gid = `${k}_line`;
        const ls = `fill:none;stroke:${group_name_to_color(k)};stroke-width:1`;
        const ps = `fill:${group_name_to_fill_color(k)};stroke:none;stroke-width:0`;
        const g = document.querySelector("#"+gid) === null ?
              svg_element.append("g").attr("id",gid) :
              svg_element.select("#"+gid);
        g.html("");
        g.append("path")
            .attr("d", line)
            .attr("style", ls)
            .property("data-legend",true);
        g.append("polygon")
            .attr("points", path)
            .attr("style", ps);
    });
    const ls = svg_element.select(".legend");
    const lg = ls.size() === 0 ? svg_element.append("g").classed("legend",true) : ls;
    lg.html("")
        .attr("transform",translate(30, 30))
        .call(d3.legend);    
    
}

const digest_outcomes = outcomes => {
    const out = [];
    const groups = split(outcomes, d => `${d.group}:${d.time}`);
    Object.keys(groups)
        .forEach(k=>{
            const subgroup = groups[k];
            const sub_out = {};
            const stats = mean_and_sd(subgroup,'bpi_intensity');
            sub_out.time = subgroup[0].time;
            sub_out.group = subgroup[0].group;
            Object.keys(stats).forEach(k => sub_out[k] = stats[k]);
            out.push(sub_out);
        });
    return out.sort((a,b) => {
        var t = a.time - b.time;
        var g = a.group - b.group;
        return t === 0 ? g : t;
    });
};

const select_all = data => data.forEach(d => d.selected = true);
const unselected_all = data => data.forEach(d => d.selected = false);
const create_index = (data, key) => {
    const index = {};
    data.forEach((d,i) => {
        const l = index[d[key]] || [];
        l.push(i);
        index[d[key]] = l;
    });
    return index;
}

const tidy_demo_data = (data) => {
    const label_ethnicities = (a) => a.map(a => a === 1 ? "Nat.Am./Al" :
                                           a === 2 ? "Asn/Pac.Isl." :
                                           a === 3 ? "Blk" :
                                           a === 4 ? "Wht" :
                                           a === 5 ? "Other" : "Other");

    const label_nonwhite = (a) => a.map(e => e === 4 ? "White" : "Nonwhite")

    const label_hispanic = (a) => a.map(h => h === 1 ? "Hsp" : "NonHsp");
    const label_married = (a) => a.map(m => m === 1 ? "Mrd" : "NonMrd");
    const label_gender = (a) => a.map(g => g === 1 ? "Male" :
                                      g === 2 ? "Female" :
                                      g === 3 ? "Other" : "Other");
    const label_handedness = (a) => a.map(h => h === 1 ? "R" : h === 2 ? "L" : "A")

    const iodata = inside_out(data);
    const out = [];
    out.id = iodata.id;
    out.education = (iodata.education);
    out.ethnicity = label_ethnicities(iodata.ethnicity);
    out.hispanic = label_hispanic(iodata.hispanic);
    out.employment_status = (iodata.employment_status);
    out.exercise = (iodata.exercise);
    out.handedness = label_handedness(iodata.handedness);
    out.sses = (iodata.sses);
    out.married_or_living_as_marri = label_married(iodata.married_or_living_as_marri);
    out.age = (iodata.age);
    out.weight = (iodata.weight);
    out.gender = label_gender(iodata.gender);
    out.backpain_length = (iodata.backpain_length);
    out.nonwhite = label_nonwhite(iodata.ethnicity);
    return outside_in(out);
}

const counts_to_rows = (obj, sorter, keyname, valuename) => {
    const keys = Object.keys(obj);
    const out = [];
    keys.forEach(k => {
        const s = {};
        s[keyname] = k;
        s[valuename] = obj[k];
        out.push(s);
    });
    return out.sort(sorter);
}

const digest_ethnicities = data => {
    const counts_object = {

    };
    data.forEach(d => {
        if(d.selected){            
            const c = counts_object[d.ethnicity] || 0;
            counts_object[d.ethnicity] = c + 1;
        }
    });
    return counts_to_rows(counts_object, (a,b) => a.ethnicity < b.ethnicity, 'ethnicity', 'count');
};

const digest_by_counting = column => data => {
    const counts_object = {

    };
    data.forEach(d => {
        if(d.selected){            
            const c = counts_object[d[column]] || 0;
            counts_object[d[column]] = c + 1;
        }
    });
    return counts_to_rows(counts_object, (a,b) => a[column] < b[column], column, 'count');
};


const setup_horizontal_bar_graph_axes = (svg_element, raw_data, digest, category, x, margin) => {
    const data = digest(raw_data);
    const id = svg_element.attr("id");
    const width = svg_element.node().clientWidth;
    const height = svg_element.node().clientHeight;
    const {top, right, bottom, left} = margin;

    const x_max = data.map(lI(x)).reduce(max);

    const x_scale = d3.scaleLinear()
          .domain([0,x_max])
          .nice()
          .range([left, width-right]);

    const y_scale = d3.scaleBand()
          .domain(data.map(d => d[category]))
          .rangeRound([top, height - bottom])
          .padding(0.1);

    svg_element
        .attr("viewBox", to_viewbox(0,0,width,height))
        .append("g")
        .attr("id", `${id}_x`)
        .attr("transform", `translate(0, ${height-bottom})`)
        .call(d3.axisBottom(x_scale));

    svg_element
        .append("g")
        .attr("id", `${id}_y`)
        .attr("transform", `translate(${left},0)`)
        .call(d3.axisLeft(y_scale));

    svg_element.x_scale = x_scale;
    svg_element.y_scale = y_scale;

    return svg_element;

};

const draw_horizontal_bar_graph = (svg_element, x_scale, y_scale, raw_data, digest, category, x) => {
    const data = digest(raw_data);
    const s = svg_element.select(".bars");
    const g = s.size() === 0 ? svg_element.append("g").classed("bars", true) : s;
    g.html("");
    g.selectAll("rect").data(data)
        .join("rect")
        .attr("transform",d => `translate(${x_scale(0)},${y_scale(d[category])+10})`)
        .attr("width", d => x_scale(d[x])-x_scale(0))
        .attr("height", d => 20)
        .attr("category", d=>d[category])
};

const setup_histogram = (svg_element, raw_data, variable, label, n_bins, margin) => {
    const data = raw_data.filter(d => d.selected);
    const id = svg_element.attr("id");
    const width = svg_element.node().clientWidth;
    const height = svg_element.node().clientHeight;
    const {top, right, bottom, left} = margin;

    const x_scale = d3.scaleLinear()
          .domain(d3.extent(data, lI(variable)))
          .nice()
          .range([left, width-right]);
    const hist = d3.histogram()
          .value(lI(variable))
          .domain(x_scale.domain())
          .thresholds(x_scale.ticks(n_bins));
    const bins = hist(data)
    const y_scale = d3.scaleLinear()
          .range([height-bottom, top])
          .domain([0, d3.max(bins, d => d.length)]);



    svg_element
        .attr("viewBox", to_viewbox(0,0,width,height));

    svg_element
        .append("g")
        .attr("transform", `translate(${left},0)`)
        .call(d3.axisLeft(y_scale));

    svg_element
        .append("g")
        .attr("transform", `translate(${left-left/2},${(height-(top+bottom))/2 + top})`)
        .append("text")
        .attr("transform", "rotate(-90)")
        .text("count")

    svg_element
        .append("g")
        .attr("transform", translate(left+(width-(left+right))/2, height-bottom/2))
        .append("text")
        .text(label)

    svg_element
        .append("g")
        .attr("transform", `translate(0,${height-bottom})`)
        .call(d3.axisBottom(x_scale))

    svg_element.x_scale = x_scale;
    svg_element.y_scale = y_scale;
    svg_element.hist = hist;

    return svg_element;
}

const draw_histogram = (svg_element, x_scale, y_scale, histf, raw_data, margin) => {
    const data = raw_data.filter(d => d.selected);
    const s = svg_element.select(".bars");
    const g = s.size() === 0 ? svg_element.append("g").classed("bars",true) : s;
    const bins = histf(data);
    const [ignore1,ignore2,width,height] = svg_element.attr("viewBox").split(" ").map(d => +d);
    const {top, right, bottom, left} = margin;
    g.html("");
    g.selectAll("rect")
        .data(bins)
        .join("rect")
        .attr("transform", d => `translate(${x_scale(d.x0)},${y_scale(d.length)})`)
        .attr("width", d => 8)
        .attr("count", d => d.length)
        .attr("height", d => height - bottom - y_scale(d.length))
        .style("fill", "black");
    return svg_element;
}

const demo_ae_p = d3.csv("derived_data/demographic_ae.csv", numerify);
const demo_raw_p = d3.csv("source_data/demographics.csv", numerify);
const outcomes_p = d3.csv("derived_data/clinical_outcomes-d3.csv", numerify);
const data = Promise.all([demo_ae_p, demo_raw_p, outcomes_p]);
const main = (demo_ae, demo_raw, outcomes) => {
    const grid_header       = d3.select(".grid-header");
    const grid_footer       = d3.select(".grid-footer");
    const grid_projection   = d3.select(".grid-projection");
    const grid_plot         = d3.select(".grid-plot");
    const grid_demographics = d3.select(".grid-demographics");
    const grid_explanation  = d3.select(".grid-explanation");
    const demo_tidy = tidy_demo_data(demo_raw);

    const datasets = [demo_ae, demo_tidy, outcomes];


    datasets.forEach(select_all);

    demo_ae.id_index = create_index(demo_ae, "id");
    demo_raw.id_index = create_index(demo_raw, "id");
    demo_tidy.id_index = create_index(demo_tidy, "id");
    outcomes.id_index = create_index(outcomes, "id");

    window.demo_ae = demo_ae;
    window.demo_raw = demo_raw;
    window.demo_tidy = demo_tidy;
    window.outcomes = outcomes;

    const projection = setup_axes(d3.select("#projection"),
                                  demo_ae,
                                  "AE1","AE2",
                                  {top:20,right:30,bottom:30,left:40});
    draw_ae_points(projection,
                   demo_ae,
                   projection.x_scale,
                   projection.y_scale,
                   'AE1',
                   'AE2');
    

    const plot = setup_axes(d3.select("#plot"),
                            digest_outcomes(outcomes),
                            "time","bpi_intensity_mean",
                            {top:20,right:30,bottom:30,left:40});

    draw_outcomes(plot, outcomes, plot.x_scale, plot.y_scale,
                  'time', 'bpi_intensity_mean', 'bpi_intensity_sd')

    const ethnicities = setup_horizontal_bar_graph_axes(d3.select("#ethnicities"),
                                                        demo_tidy,
                                                        digest_by_counting("ethnicity"),
                                                        "ethnicity",
                                                        "count",
                                                        {top:20,right:30,bottom:30,left:80});

    draw_horizontal_bar_graph(ethnicities, ethnicities.x_scale, ethnicities.y_scale, demo_tidy,
                              digest_by_counting("ethnicity"),
                              'ethnicity','count');

    const gender = setup_horizontal_bar_graph_axes(d3.select("#gender"),
                                                   demo_tidy,
                                                   digest_by_counting("gender"),
                                                   "gender",
                                                   "count",
                                                   {top:20,right:30,bottom:30,left:80});
    
    draw_horizontal_bar_graph(gender, gender.x_scale, gender.y_scale, demo_tidy,
                              digest_by_counting("gender"),
                              'gender','count');

    const hispanic = setup_horizontal_bar_graph_axes(d3.select("#race"),
                                                   demo_tidy,
                                                   digest_by_counting("hispanic"),
                                                   "hispanic",
                                                   "count",
                                                   {top:20,right:30,bottom:30,left:80});
    
    draw_horizontal_bar_graph(hispanic, hispanic.x_scale, hispanic.y_scale, demo_tidy,
                              digest_by_counting("hispanic"),
                              'hispanic','count');

    const married_or_living_as_marri = setup_horizontal_bar_graph_axes(d3.select("#marital"),
                                                   demo_tidy,
                                                   digest_by_counting("married_or_living_as_marri"),
                                                   "married_or_living_as_marri",
                                                   "count",
                                                   {top:20,right:30,bottom:30,left:80});
    
    draw_horizontal_bar_graph(married_or_living_as_marri, married_or_living_as_marri.x_scale, married_or_living_as_marri.y_scale, demo_tidy,
                              digest_by_counting("married_or_living_as_marri"),
                              'married_or_living_as_marri','count');

    const age_margin = {top:20,right:30,bottom:55,left:55};
    const age = setup_histogram(d3.select("#age"), demo_tidy, "age", "age (y)", 20, age_margin);
    draw_histogram(age, age.x_scale, age.y_scale, age.hist, demo_tidy,age_margin);

    const sse_margin = {top:20,right:30,bottom:55,left:55};
    const sse = setup_histogram(d3.select("#sse"), demo_tidy, "sses", "self-rep. socio. status", 20, sse_margin);
    draw_histogram(sse, sse.x_scale, sse.y_scale, sse.hist, demo_tidy,sse_margin);

    const prx_scale = projection.x_scale;
    const pry_scale = projection.y_scale;
    const set_by_id_index = (array_with_index, id, selected_state) => {
        const indexes = array_with_index.id_index;
        indexes[id].forEach(index => {
            array_with_index[index].selected = selected_state;
        })
    };
    d3.select(".container").attr("style", "height:100%;")
    projection.call(d3.brush().on("start brush end", (event) => {
        const {selection} = event;
        if (selection) {
            const [[rx0,ry0],[rx1,ry1]] = selection;
            const x0 = projection.x_scale.invert(rx0);
            const y0 = projection.y_scale.invert(ry0);
            const x1 = projection.x_scale.invert(rx1);
            const y1 = projection.y_scale.invert(ry1);
            console.log("orig:",rx0, ry0, rx1, ry1);
            console.log("inve:",x0,y0,x1,y1);
            demo_ae.forEach((row) => {
                const {id,AE1,AE2} = row;
                const selected = in_box(AE1, AE2, x0, y0, x1, y1);
                //if(selected) debugger;
                row.selected = selected;
                set_by_id_index(demo_tidy, id, selected);
                set_by_id_index(outcomes, id, selected);
            });
        } else {
            demo_ae.forEach((row) => {
                const {id} = row;
                const selected = true;
                row.selected = selected;
                set_by_id_index(demo_tidy, id, selected);
                set_by_id_index(outcomes, id, selected);
            });
        }
        draw_ae_points(projection,
                       demo_ae,
                       projection.x_scale,
                       projection.y_scale,
                       'AE1',
                       'AE2');
        draw_outcomes(plot, outcomes, plot.x_scale, plot.y_scale,
                      'time', 'bpi_intensity_mean', 'bpi_intensity_sd');
        draw_horizontal_bar_graph(ethnicities, ethnicities.x_scale, ethnicities.y_scale, demo_tidy,
                                  digest_by_counting("ethnicity"),
                                  'ethnicity','count');
        draw_horizontal_bar_graph(gender, gender.x_scale, gender.y_scale, demo_tidy,
                                  digest_by_counting("gender"),
                                  'gender','count');
        draw_horizontal_bar_graph(married_or_living_as_marri, married_or_living_as_marri.x_scale, married_or_living_as_marri.y_scale, demo_tidy,
                                  digest_by_counting("married_or_living_as_marri"),
                                  'married_or_living_as_marri','count')
        draw_histogram(age, age.x_scale, age.y_scale, age.hist, demo_tidy,age_margin);
        draw_histogram(sse, sse.x_scale, sse.y_scale, sse.hist, demo_tidy,sse_margin);
        
        
    }));
};

document.addEventListener("DOMContentLoaded", () => {
    data.spread(main);
});
