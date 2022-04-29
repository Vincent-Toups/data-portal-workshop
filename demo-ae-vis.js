const get_bounds = (keys, data) => {
    const bounds = {};
    bounds.min = {};
    bounds.max = {};
    bounds.avg = {};
    keys.forEach(k => {bounds.min[k] = Infinity;
                       bounds.max[k] = -Infinity;
                       bounds.avg[k] = 0;})
    const n = data.length;
    data.forEach(pt => {
        keys.forEach(k => {
            if(pt[k] < bounds.min[k]) bounds.min[k] = pt[k];
            if(pt[k] > bounds.max[k]) bounds.max[k] = pt[k];
            bounds.avg[k] += pt[k];
        })
    })
    keys.forEach(k => {
        bounds.avg[k] = bounds.avg[k]/n;
    })
    return bounds;    
}

const tally = function(keys, data){
    const counts = {};
    keys.forEach(k => counts[k] = {});
    data.forEach(d => keys.forEach(k => {
        const counts_at = counts[k];
        const val = d[k];
        const val_count = (counts_at[val] || 0) + 1;
        counts_at[val] = val_count;
    }))
    return counts;
}

const to_viewbox = (xmin, ymin, xmax, ymax) =>  [xmin, ymin, xmax, ymax].join(" ")

const cluster_colors = ["red","green","blue","cyan","magenta"];
const cluster_to_color = c => cluster_colors[c];

const draw_demo_points = (svg_selection, data, selected) => {
    const x = svg_selection.x;
    const y = svg_selection.y;
    svg_selection.selectAll("circle")
        .data(data)
        .join("circle")
        .attr("transform", d => `translate(${x(d.AE1)},${y(d.AE2)})`)
        .attr("r", 3)
        .attr("stroke", d => selected[d.id] ? "red" : "gray")
        .attr("fill", d => cluster_to_color(d.cluster))
        .attr("subjid", d => d.id);
}

const calc_averages = (data, keys, fitler) => {
    const out = {};
    let n = 0;
    keys.forEach(k => out[k] = 0);
    data.forEach(d => {
        if(filter(d)){
            keys.forEach(k => {
                out[k] += d[k];
            });
            n = n + 1;                       
        }
    });
    keys.forEach(k => out[k] = out[k]/n);
    return out;
}

const reduce_keys = (data, keys, f, init, filter) => {
    let state = init;
    let fs = {};
    let n = 0;
    if(typeof f === "function"){
        keys.forEach(key => fs[key] = f);        
    } else {
        fs = f;
    }
    data.forEach(d => {
        if(filter(d)){
            n++;
            keys.forEach(key => {
                state[key] = fs[key](state[key], d[key]);
            });
        }
    });
    return [n,state];    
}

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

const norm = (a) => {
    let the_min = Infinity;
    let the_max = -Infinity;
    a.forEach(e => {
        the_min = e < the_min ? e : the_min;
        the_max = e > the_max ? e : the_max;
    });
    const range = the_max - the_min;
    return a.map(e => (e - the_min)/range);
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

const tidy_demo_data = (data) => {
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
 
const demographic_variables = ['gender','married_or_living_as_marri','sses','non_white']

const demographic_variable_specs = (()=>{
    const v = {
        education:{type:"numerical", order:0},
        ethnicity:{type:"categorical", order:1},
        hispanic:{type:"categorical", order:2},
        gender:{type:"categorical", order:3},
        employment_status:{type:"numerical", order:4},
        exercise:{type:"numerical", order:5},
        handedness:{type:"categorical", order:6},
        sses:{type:"numerical",label:"SSES", order:7},
        married_or_living_as_marri:{type:"categorical",label:"Marital Status", order:8},
        age:{type:"numerical", order:9},
        weight:{type:"numerical", order:10},
        backpain_length:{type:"numerical", order:11},
    };
    return Object.keys(v).map(k => {
        const val = v[k];
        val.column = k;
        return val;
    });
})();


const to_color = n => {
    const x = Math.round((1-n)*255);
    return "rgb("+[x,x,x].join(",")+")"
}

const draw_demographic_average = (svg_selection, demo_data, filter) => {
    const gender_count = {male:0,female:0};
    const married_count = {married:0,unmarried:0}
    let sses_average = 0;
    const nonwhite = {nonwhite:0, white:0};
    let n = 0;
    demo_data.forEach(d => {
        if(filter(d)){            
            if(d.gender==="Male") gender_count["male"]++;
            if(d.gender==="Female") gender_count["female"]++;
            sses_average += d.sses;
            if(d.nonwhite==="Nonwhite") nonwhite["nonwhite"]++;
            if(d.nonwhite==="White") nonwhite["white"]++;
            if(d.married_or_living_as_marri==="Mrd") married_count["married"]++;
            if(d.married_or_living_as_marri==="NonMrd") married_count["unmarried"]++;
            n++;
        }
    });
    gender_count.male = gender_count.male / n;
    gender_count.female = gender_count.female / n;
    married_count.married = married_count.married / n;
    married_count.unmarried = married_count.unmarried / n;
    sses_average = n === 0 ? 0 : sses_average/n;
    nonwhite.nonwhite = nonwhite.nonwhite / n;
    nonwhite.white = nonwhite.white / n;

    svg_selection.select("#gender_male").attr("fill",to_color(gender_count.male))
    svg_selection.select("#gender_female").attr("fill",to_color(gender_count.female))

    svg_selection.select("#married_yes").attr("fill",to_color(married_count.married))
    svg_selection.select("#married_no").attr("fill",to_color(married_count.unmarried))

    svg_selection.select("#nonwhite").attr("fill",to_color(nonwhite.nonwhite))
    svg_selection.select("#white").attr("fill",to_color(nonwhite.white))

    svg_selection.select("#sses").attr("width",sses_average*360);

}

const to_average = x => x.reduce((a,b) => a+b)/x.length

const average_outcomes_by_group = (data, variable, filter) => {
    const groups = {};
    const sorter = (a,b) => {
        const at = a.time;
        const bt = b.time;
        const ag = a.group;
        const bg = b.group;
        return ag < bg ? -1 : ag > bg ? 1 : at < bt ? -1 : at > bt ? 1 : 0;
    }
    data.forEach(d => {
        if(filter(d)){
            const group = d.group;
            const time = d.time;
            const key = `${group}:${time}`
            const container = groups[key] || {};
            groups[key] = container;
            container.time = time;
            container.group = group;
            const holder = container[variable] || [];
            container[variable] = holder;
            holder.push(d[variable]);
        }
    });
    return Object.keys(groups).map(item => {
        groups[item][variable] = to_average(groups[item][variable]);
        return groups[item];
    }).sort(sorter);
}

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

const group_to_color = (group) => ({"G1":"RED","G2":"GREEN","G3":"BLUE"})[group];

const draw_outcomes = (svg_selection, outcome_data, selected) => {
    const x = svg_selection.x;
    const y = svg_selection.y;
    const adata = average_outcomes_by_group(outcome_data, 'bpi_intensity', d => selected[d.id])
    const by_group = split(adata, d => "G"+d.group);
    Object.keys(by_group).forEach(group => {
        const line = d3.line()
              .x(d => x(d.time))
              .y(d => y(d.bpi_intensity));
        svg_selection
            .select("#"+group)        
            .attr("d",line(by_group[group]))
            .attr("style", `fill:none;stroke:${group_to_color(group)};stroke-width:1`);
    })
}

const get_brushed = (data,x0,y0,x1,y1) => {
    const out = {};
    let i = 0;
    data.forEach(pt => {
        const x = pt.AE1;
        const y = pt.AE2;
        if(x > x0 && x < x1 && y > y1 && y < y0){
            out[pt.id] = true;
            i++;
        } else {
            out[pt.id] = false;
        }
    });
    return out;
}

const setup_svg_with_axis = (location, id, data, x, y, margin, size) => {
    const {top, right, bottom, left} = margin;
    const {width, height} = size;
    const x_scale = d3.scaleLinear()
          .domain(d3.extent(data, d=>d[x])).nice()
          .range([left, width - right]);
    const y_scale = d3.scaleLinear()
          .domain(d3.extent(data, d => d[y])).nice()
          .range([height-bottom, top]);
    const the_svg = d3.select(location).append("svg");
    the_svg.attr("id",id)
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", to_viewbox(0,0,width,height));
    the_svg.x = x_scale;
    the_svg.y = y_scale;
    the_svg.margin = margin;
    the_svg.append("g")
        .attr("id",id+"_x")
        .attr("transform", `translate(0,${height-bottom})`)
        .call(d3.axisBottom(x_scale))
        .call(g => g.select(".domain").remove())
        .call(g => g.append("text")
              .attr("x", width - right)
              .attr("y", -4)
              .attr("fill","#000")
              .attr("font-weight","bold")
              .attr("text-anchor", "end")
              .text(x));
    the_svg.append("g")
        .attr("id",id+"_y")
        .attr("transform",`translate(${left},0)`)
        .call(d3.axisLeft(y_scale))
        .call(g => g.select(".domain").remove())
        .call(g => g.select(".tick:last-of-type text").clone()
              .attr("x",4)
              .attr("text-anchor","start")
              .attr("font-weight","bold")
              .text(y));
    return the_svg;
}

const setup_demographics_svg = (location, id, data, spec, margin, size) => {
    const {top, right, bottom, left} = margin;
    const {width, height} = size;
    spec = spec.filter(d => !d.supress);
    const n = spec.length;
    const n_slots = n*2;
    const subrect_height = (height - (top+bottom))/n_slots;
    const y_increment = subrect_height*2;

    const numerical_bounds = get_bounds(spec.filter(d => d.type === "numerical").map(d=>d.column), data);
    const tallies = tally(spec.filter(d => d.type === "categorical").map(d=>d.column), data);
    
    const the_svg = d3.select(location).append("svg")
          .attr("id", id)
          .attr("width", width)
          .attr("height", height)
          .attr("viewBox", to_viewbox(0,0,width,height));
    the_svg.selectAll("g")
        .data(spec)
        .join("g")
        .attr("id", d => id + "_" + d.column)
        .attr("transform",d => `translate(${left}, ${top + d.order*y_increment})`)
        .each(function(d,i) {
            console.log(i);
            d3.select(this)
                .append("text")
                .text(d.label || d.column)
                .style("font-size",Math.floor(subrect_height)+"px");
            console.log(d.type);
            const rect_offset = Math.floor(subrect_height/2)-5;
            if(d.type==="numerical"){
                const mn = numerical_bounds.min[d.column];
                const mx = numerical_bounds.max[d.column];
                const avg = numerical_bounds.avg[d.column];
                const rect_width = (width-(left+right))*((avg-mn)/(mx-mn));                
                d3.select(this)
                    .append("rect")
                    .attr("id", d.column + "_rect")
                    .attr("x",0)
                    .attr("y",rect_offset)
                    .attr("width",rect_width)
                    .attr("height",Math.floor(subrect_height))
                    .attr("stroke","black")
                    .attr("fill","white")
                d3.select(this)
                    .append("text")
                    .attr("id",d.column+"_number")
                    .style("font-size",Math.floor(subrect_height*0.75)+"px")
                    .text(`(${Math.round(avg*100)/100})`)
                    .attr("transform",`translate(${rect_width + 3},${Math.floor(subrect_height/2)+7})`)
                
            } else {
                const counts = tallies[d.column];
                const categories = Object.keys(counts).sort();
                const total = categories.reduce((acc, it) => acc + counts[it],0);
                let x = 0;
                categories.forEach(cat => {
                    const g = d3.select(this).append("g").attr("transform",`translate(${x},${rect_offset + Math.floor(subrect_height*0.75)})`);
                    const txt = g.append("text").text(cat + ":: ").style("font-size",Math.floor(subrect_height*0.75)+"px");
                    const bb = txt.node().getBBox();
                    // const n = g.append("text").text(`:: ${counts[cat]},   `)
                    //       .style("font-size",Math.floor(subrect_height*0.75)+"px")
                    //       .attr("transform",`translate(${bb.width})`);
                    const tiny_rect = g.append("rect")
                          .attr("id",d.column + "_" + id_sanitize(cat))
                          .attr("transform",`translate(${bb.width},-${Math.floor(subrect_height*0.75)})`)
                          .attr("width",20)
                          .attr("height",Math.floor(subrect_height*0.75))
                          .attr("fill", to_color(counts[cat]/total))
                          .attr("stroke", "black")
                    x = x + g.node().getBBox().width + 3;
                });
            }
        })
    return the_svg;
}

const id_sanitize = id => id.replaceAll(/[^a-zA-Z]/ig,"_")


const update_demographic_svg = (the_svg, raw_data, spec, margin, size, filter_func) => {
    const {top, right, bottom, left} = margin;
    const {width, height} = size;
    const filt_data = raw_data.filter(filter_func);
    spec = spec.filter(d => !d.supress);
    const n = spec.length;
    const n_slots = n*2;
    const subrect_height = (height - (top+bottom))/n_slots;
    const raw_numerical_bounds = get_bounds(spec.filter(d => d.type === "numerical").map(d=>d.column), raw_data);
    const numerical_bounds = get_bounds(spec.filter(d => d.type === "numerical").map(d=>d.column), filt_data);
    const tallies = tally(spec.filter(d => d.type === "categorical").map(d=>d.column), filt_data);
    const {numerical, categorical} = split(spec, s => s.type);
    
    numerical.forEach(s => {
        const mn = raw_numerical_bounds.min[s.column];
        const mx = raw_numerical_bounds.max[s.column];
        const avg = numerical_bounds.avg[s.column];
        const rect_width = (width-(left+right))*((avg-mn)/(mx-mn));                        
        d3.select("#"+s.column + "_rect")
            .attr("width", rect_width || 0.1);
        d3.select("#"+s.column + "_number")
            .attr("transform",`translate(${rect_width + 3},${Math.floor(subrect_height/2)+7})`)
            .text(`(${Math.round(avg*100)/100})`);
    });
    categorical.forEach(s => {
        const counts = tallies[s.column];
        const categories = Object.keys(counts).sort();
        const total = categories.reduce((acc, it) => acc + counts[it],0);
        let x = 0;
        categories.forEach(cat => {
            const tiny_rect = d3.select("#"+s.column + "_" + id_sanitize(cat))
                  .attr("fill", to_color(counts[cat]/total))
        });
    });
}

const main = (data) => {

    d3.select("body").append("h1").text("PRT on cLBP Demographics Explorer");
    
    let selected_ids = {};
    const demo_ae = data[0];
    const demo_raw = data[1];
    const outcomes = data[2];
    const demo_tidy = tidy_demo_data(demo_raw);

    const ae_bounds = get_bounds(['AE1','AE2'], demo_ae);

    const proj_w = 400;
    const proj_h = 400;
    const out_w = 400;
    const out_h = 200;
    const demo_w = 400;
    const demo_h = 200;
    const demo_margin = {top:20,right:30,bottom:30,left:40};
    const demo_size = {width:400, height:400};

    demo_ae.forEach(d => selected_ids[d.id] = true);

    const projection_svg = setup_svg_with_axis("body",
                                               "projection",
                                               demo_ae,
                                               "AE1",
                                               "AE2",
                                               {top:20, right:30, bottom:30, left:40},
                                               {width:proj_w, height:proj_h});

    const outcomes_svg = setup_svg_with_axis("body",
                                             "outcomes",
                                             outcomes,
                                             "time",
                                             "bpi_intensity",
                                             {top:20, right:30, bottom:30, left:40},
                                             {width:out_w, height:out_h});


    let brush_count = 0;
    const brush = d3.brush().on("start brush end", brushed)   
    
    projection_svg.call(brush);

    outcomes_svg.append("path").attr("id","G1");
    outcomes_svg.append("path").attr("id","G2");
    outcomes_svg.append("path").attr("id","G3");

    const demographics_svg = setup_demographics_svg("body","demographics",demo_tidy,demographic_variable_specs,demo_margin,demo_size);

    draw_demo_points(projection_svg, demo_ae, selected_ids);
    draw_outcomes(outcomes_svg, outcomes, selected_ids);
    update_demographic_svg(demographics_svg, demo_tidy, demographic_variable_specs, demo_margin, demo_size, d => selected_ids[d.id]);
    
    //draw_demographic_average(demo_svg, demo_tidy, d => selected_ids[d.id]);

    function brushed({selection}){
        if(selection){
            const [[rx0,ry0],[rx1,ry1]] = selection;
            const x0 = projection_svg.x.invert(rx0);
            const y0 = projection_svg.y.invert(ry0);
            const x1 = projection_svg.x.invert(rx1);
            const y1 = projection_svg.y.invert(ry1);
            selected_ids = get_brushed(demo_ae, x0, y0, x1, y1);
            draw_demo_points(projection_svg, demo_ae, selected_ids);
            draw_outcomes(outcomes_svg, outcomes, selected_ids);
            update_demographic_svg(demographics_svg, demo_tidy, demographic_variable_specs, demo_margin, demo_size, d => selected_ids[d.id]);
        }
    }
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
const demo_ae_p = d3.csv("derived_data/demographic_ae.csv", numerify);
const demo_raw_p = d3.csv("source_data/demographics.csv", numerify);
const outcomes_p = d3.csv("derived_data/clinical_outcomes-d3.csv", numerify);

const data = Promise.all([demo_ae_p, demo_raw_p, outcomes_p]);

document.addEventListener("DOMContentLoaded", () => {
    data.then(main);
});

